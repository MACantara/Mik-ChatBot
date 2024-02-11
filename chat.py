import random
import json
import os

import torch
import datetime
import requests
import subprocess

from model import NeuralNet
from nltk_utils import bag_of_words, tokenize
from dotenv import load_dotenv

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

with open('intents.json', 'r') as json_data:
    intents = json.load(json_data)

load_dotenv()

FILE = "data.pth"
data = torch.load(FILE)

input_size = data["input_size"]
hidden_size = data["hidden_size"]
output_size = data["output_size"]
all_words = data['all_words']
tags = data['tags']
model_state = data["model_state"]

model = NeuralNet(input_size, hidden_size, output_size).to(device)
model.load_state_dict(model_state)
model.eval()

bot_name = "Sam"

def get_current_weather():
    open_weather_map_api_key = os.getenv('OPEN_WEATHER_MAP_API_KEY')
    city_name = "London"
    base_url = "http://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city_name,
        "appid": open_weather_map_api_key,
        "units": "metric"
    }
    
    response = requests.get(base_url, params=params)
    weather_data = response.json()
    
    if response.status_code == 200:
        # Process the weather data
        description = weather_data["weather"][0]["description"]
        temperature = weather_data["main"]["temp"]
        return {"description": description, "temperature": temperature, "city_name": city_name}
    else:
        return None # Handle errors


def basic_calculator(operation, num1, num2):
    if operation == 'add' or operation == "+":
        operation = "sum"
        result = num1 + num2
        return {"operation": operation, "result": result, "num1": num1, "num2": num2}
    elif operation == 'subtract' or operation == "-":
        operation = "difference"
        result = num1 - num2
        return {"operation": operation, "result": result, "num1": num1, "num2": num2}
    elif operation in ['multiply', '*', 'x']:
        operation = "product"
        result = num1 * num2
        return {"operation": operation, "result": result, "num1": num1, "num2": num2}
    elif operation == 'divide' or operation == "/":
        if num2 != 0:
            operation = "quotient"
            result = num1 / num2
            return {"operation": operation, "result": result, "num1": num1, "num2": num2}
        else:
            return "Cannot divide by zero"
    else:
        return "Invalid operation"


def extract_operation_and_numbers(msg):
    # Assuming the user input is in the format "calculate add 10 5"
    # You can split the message and extract the operation and numbers
    words = msg.split()
    num1 = int(words[1])
    operation = words[2]
    num2 = int(words[3])
    return operation, num1, num2


def get_response(msg):
    sentence = tokenize(msg)
    X = bag_of_words(sentence, all_words)
    X = X.reshape(1, X.shape[0])
    X = torch.from_numpy(X).to(device)

    output = model(X)
    _, predicted = torch.max(output, dim=1)

    tag = tags[predicted.item()]

    probs = torch.softmax(output, dim=1)
    prob = probs[0][predicted.item()]
    if prob.item() > 0.75:
        for intent in intents['intents']:
            if tag == intent["tag"]:
                if tag == "time":
                    current_time = datetime.datetime.now().strftime("%I:%M:%S %p")
                    return random.choice(intent["responses"]).format(time=current_time)
                elif tag == "weather":
                    weather_data = get_current_weather()
                    return random.choice(intent["responses"]).format(city_name=weather_data["city_name"], description=weather_data["description"], temperature=weather_data["temperature"])
                elif tag == "open_brave_application":
                    brave_path = "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
                    subprocess.Popen(brave_path)
                    return random.choice(intent["responses"])
                elif tag == "calculator":
                    operation, num1, num2 = extract_operation_and_numbers(msg)
                    result = basic_calculator(operation, num1, num2)
                    return random.choice(intent['responses']).format(operation=result['operation'], result=result['result'], num1=result['num1'], num2=result['num2'])
                elif tag == "date":
                    current_date = datetime.date.today().strftime("%B %d, %Y")
                    return random.choice(intent["responses"]).format(date=current_date)
                else:
                    return random.choice(intent['responses'])
            
    return "I do not understand..."


if __name__ == "__main__":
    print("Let's chat! (type 'quit' to exit)")
    while True:
        # sentence = "do you use credit cards?"
        sentence = input("You: ")
        if sentence == "quit":
            break

        resp = get_response(sentence)
        print(resp)