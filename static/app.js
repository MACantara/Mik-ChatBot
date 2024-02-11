

class Chatbox {
    /**
     * Constructor for initializing the args, state, and messages.
     */
    constructor() {
        this.args = {
            chatBox: document.querySelector('.chatbox__support'),
            sendButton: document.querySelector(".send__button")
        }

        this.state = false;
        this.messages = [];
    }

    /**
     * Function to set up event listeners for the openButton, sendButton, and input field in the chatBox.
     *
     */
    display() {
        const {chatBox, sendButton} = this.args;

        // openButton.addEventListener('click', () => this.toggleState(chatBox))

        sendButton.addEventListener('click', () => this.onSendButton(chatBox))

        const node = chatBox.querySelector('input');
        node.addEventListener("keyup", ({key}) => {
            if (key === "Enter") {
                this.onSendButton(chatBox)
            }
        })
    }

    /**
     * Handles the action when the send button is clicked in the chatbox.
     *
     * @param {HTMLElement} chatbox - The chatbox element
     * @return {void} 
     */
    onSendButton(chatbox) {
        let textField = chatbox.querySelector('input');
        let text1 = textField.value
        if (text1 === "") {
            return;
        }

        let msg1 = { name: "User", message: text1 }
        this.messages.push(msg1);

        fetch($SCRIPT_ROOT + '/predict', {
            method: 'POST',
            body: JSON.stringify({ message: text1 }),
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'  
            },
        })
        .then (r => r.json())
        .then(r => {
            let msg2 = { name: "Sam", message: r.answer };
            this.messages.push(msg2);
            this.updateChatText(chatbox)
            textField.value = ''

        }).catch((error) => {
            console.error('Error:', error);
            this.updateChatText(chatbox)
            textField.value = ''
        });
    }

    /**
     * Updates the chat text in the chatbox.
     *
     * @param {Object} chatbox - The chatbox element to update
     * @return {void} 
     */
    updateChatText(chatbox) {
        let html = "";
        this.messages.slice().reverse().forEach(function(item, index) {
            if (item.name === "Sam") {
                html += '<div class="messages__item messages__item--visitor">' + item.message + '</div>'
            } else {
                html += '<div class="messages__item messages__item--operator">' + item.message + '</div>'
            }
        });

        // Save messages to local storage
        localStorage.setItem('messages', JSON.stringify(this.messages));

        const chatmessage = chatbox.querySelector('.chatbox__messages');
        chatmessage.innerHTML = html;
    }

    /**
     * Load messages from local storage and update the chatbox with the loaded messages.
     *
     * @param {string} chatbox - The chatbox element to update with the loaded messages.
     */
    loadMessages(chatbox) {
        // Load messages from local storage
        const savedMessages = localStorage.getItem('messages');

        if (savedMessages) {
            this.messages = JSON.parse(savedMessages);
        } else {
            // If no messages are found, add a greeting message
            this.messages = [{ name: "Sam", message: '<div class="messages__item messages__item--operator">Hi! I am MikBot, what can I do for you?</div>' }];
        }

        this.updateChatText(chatbox);
    }

    /**
     * Clears the messages from the chatbot and updates the chat text.
     *
     * @param {Object} chatbot - The chatbot object
     * @return {void} 
     */
    clearMessages(chatbot) {
        localStorage.removeItem('messages');
        this.messages = [];
        this.updateChatText(chatbot);
    }
}


const chatbox = new Chatbox();
chatbox.display();


/**
 * Executes the specified function when the window loads.
 *
 * @param {function} - The function to be executed when the window loads
 * @return {void}
 */
window.onload = function() {
    chatbox.loadMessages(chatbox.args.chatBox);
};

const clearButton = document.querySelector('.clear__button');
clearButton.addEventListener('click', function() {
    chatbox.clearMessages(chatbox.args.chatBox);

    // After clearing the messages, add a greeting message
    chatbox.messages = [{ name: "Sam", message: '<div class="messages__item--visitor">Hi! I am MikBot, what can I do for you?</div>' }];
    chatbox.updateChatText(chatbox.args.chatBox);

    // Store the greeting message in local storage
    localStorage.setItem('messages', JSON.stringify(chatbox.messages));
});

document.addEventListener('DOMContentLoaded', function() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
});

