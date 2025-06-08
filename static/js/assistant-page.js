// Assistant Page JavaScript

// Get user name from session
function updateUserName() {
    fetch('/get-user-info')
        .then(response => {
            if (!response.ok) {
                throw new Error('Not logged in');
            }
            return response.json();
        })
        .then(data => {
            if (data.name) {
                document.getElementById('userName').textContent = ' ' + data.name;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Optionally redirect to signin or keep as Guest
        });
}

// Call updateUserName when page loads
document.addEventListener('DOMContentLoaded', updateUserName);

// Configuration
const API_CONFIG = {
    model: 'anthropic/claude-3-haiku:beta',
    max_tokens: 300,
    system_prompt: 'You are a helpful travel assistant for Semsar Mate, a hotel booking platform in Morocco. Keep responses concise and focused on hotel recommendations and travel advice.'
};

// Language state
let currentLanguage = 'en';
const languageConfig = {
    en: {
        name: 'English',
        code: 'en-US',
        systemPrompt: 'You are a helpful travel assistant for Semsar Mate, a hotel booking platform in Morocco. Keep responses concise and focused on hotel recommendations and travel advice.'
    },
    darija: {
        name: 'Darija',
        code: 'ar-MA',
        systemPrompt: 'You are a helpful travel assistant for Semsar Mate, a hotel booking platform in Morocco. Respond in Moroccan Darija (Moroccan Arabic). Keep responses concise and focused on hotel recommendations and travel advice.'
    },
    fr: {
        name: 'Français',
        code: 'fr-FR',
        systemPrompt: 'You are a helpful travel assistant for Semsar Mate, a hotel booking platform in Morocco. Respond in French. Keep responses concise and focused on hotel recommendations and travel advice.'
    }
};

function changeLanguage(lang) {
    currentLanguage = lang;
    const languageText = document.getElementById('currentLanguage');

    // Update button text
    languageText.textContent = languageConfig[currentLanguage].name;

    // Update active state in dropdown
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(lang)) {
            item.classList.add('active');
        }
    });

    // Update recognition language
    if (recognition) {
        recognition.lang = languageConfig[currentLanguage].code;
    }

    // Update API config
    API_CONFIG.system_prompt = languageConfig[currentLanguage].systemPrompt;

    // Show confirmation message
    let message;
    switch(currentLanguage) {
        case 'en':
            message = 'Switched to English. How can I help you?';
            break;
        case 'darija':
            message = 'تم التحويل إلى الدارجة. كيف يمكنني مساعدتك؟';
            break;
        case 'fr':
            message = 'Passé au français. Comment puis-je vous aider?';
            break;
    }
    addMessage(message, 'assistant');
}

// Speech Synthesis
let speechSynthesis = window.speechSynthesis;
let speaking = false;
let currentUtterance = null;

function speakText(text) {
    if (speaking) {
        speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = languageConfig[currentLanguage].code;

    // Get available voices and set a preferred voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
        voice.lang === languageConfig[currentLanguage].code
    ) || voices[0];

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
        speaking = true;
        const speakButton = document.getElementById('speakButton');
        if (speakButton) {
            speakButton.innerHTML = '<i class="fas fa-stop"></i>';
        }
    };

    utterance.onend = () => {
        speaking = false;
        const speakButton = document.getElementById('speakButton');
        if (speakButton) {
            speakButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    };

    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}

function toggleSpeech() {
    const button = document.getElementById('speakButton');
    if (speaking) {
        speechSynthesis.cancel();
        speaking = false;
        button.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
        const lastMessage = document.querySelector('.message.assistant:last-child .message-content');
        if (lastMessage) {
            speakText(lastMessage.textContent);
        }
    }
}

// Event Handlers
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function askQuestion(question) {
    document.getElementById('user-input').value = question;
    sendMessage();
}

// Message Handling
function addMessage(content, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const avatar = sender === 'user' ?
        '<div class="message-avatar"><i class="fas fa-user"></i></div>' :
        '<div class="message-avatar"><i class="fas fa-robot"></i></div>';

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            ${content}
            <div class="message-time">${time}</div>
        </div>
        <div class="message-actions">
            <button class="message-action-btn" onclick="copyMessage(this)" title="Copy message">
                <i class="fas fa-copy"></i>
            </button>
            <button class="message-action-btn" onclick="speakMessage(this)" title="Speak message">
                <i class="fas fa-volume-up"></i>
            </button>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function copyMessage(button) {
    const messageContent = button.closest('.message').querySelector('.message-content').textContent;
    navigator.clipboard.writeText(messageContent).then(() => {
        // Show copy confirmation
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 2000);
    });
}

function speakMessage(button) {
    const messageContent = button.closest('.message').querySelector('.message-content').textContent;
    speakText(messageContent);
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    try {
        const response = await fetch('/assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        const aiResponse = data.response;
        addMessage(aiResponse, 'assistant');

        // Auto-speak the response
        speakText(aiResponse);
    } catch (error) {
        console.error('Detailed Error:', error);
        const errorMessage = `I apologize, but I'm having trouble connecting to my brain right now. Please try again in a moment. (Error: ${error.message})`;
        addMessage(errorMessage, 'assistant');
    }
}

// Initialize speech synthesis
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices);
    };
}

// Speech Recognition
let recognition = null;
let isRecording = false;

function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = languageConfig[currentLanguage].code;

        recognition.onstart = () => {
            isRecording = true;
            const voiceButton = document.getElementById('voiceButton');
            const voiceStatus = document.getElementById('voiceStatus');
            if (voiceButton) voiceButton.classList.add('recording');
            if (voiceStatus) voiceStatus.classList.add('active');
            // Stop any ongoing speech when starting recording
            if (speaking) {
                speechSynthesis.cancel();
                speaking = false;
                const speakButton = document.getElementById('speakButton');
                if (speakButton) {
                    speakButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                }
            }
        };

        recognition.onend = () => {
            isRecording = false;
            const voiceButton = document.getElementById('voiceButton');
            const voiceStatus = document.getElementById('voiceStatus');
            if (voiceButton) voiceButton.classList.remove('recording');
            if (voiceStatus) voiceStatus.classList.remove('active');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('user-input').value = transcript;
            sendMessage();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isRecording = false;
            const voiceButton = document.getElementById('voiceButton');
            const voiceStatus = document.getElementById('voiceStatus');
            if (voiceButton) voiceButton.classList.remove('recording');
            if (voiceStatus) voiceStatus.classList.remove('active');

            let errorMessage = 'Error with voice input. ';
            switch(event.error) {
                case 'no-speech':
                    errorMessage += 'No speech was detected.';
                    break;
                case 'audio-capture':
                    errorMessage += 'No microphone was found.';
                    break;
                case 'not-allowed':
                    errorMessage += 'Microphone access was denied.';
                    break;
                default:
                    errorMessage += 'Please try again.';
            }
            addMessage(errorMessage, 'assistant');
        };
    } else {
        console.error('Speech recognition not supported');
        const voiceButton = document.getElementById('voiceButton');
        if (voiceButton) {
            voiceButton.style.display = 'none';
        }
    }
}

function toggleVoiceInput() {
    if (!recognition) {
        initSpeechRecognition();
    }

    if (isRecording) {
        recognition.stop();
    } else {
        // Stop any ongoing speech before starting recording
        if (speaking) {
            speechSynthesis.cancel();
            speaking = false;
            const speakButton = document.getElementById('speakButton');
            if (speakButton) {
                speakButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        }
        try {
            recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
        }
    }
}

// Voice Agent Functionality
const voiceAgentBtn = document.getElementById('voiceAgentBtn');
const voiceAgentInput = document.getElementById('voiceAgentInput');
const commandInput = document.getElementById('commandInput');
const sendCommandBtn = document.getElementById('sendCommandBtn');

let isAgentListening = false;
let agentRecognition = null;

function initAgentRecognition() {
    if ('webkitSpeechRecognition' in window) {
        agentRecognition = new webkitSpeechRecognition();
        agentRecognition.continuous = true;
        agentRecognition.interimResults = false;
        agentRecognition.lang = 'en-US';

        agentRecognition.onstart = () => {
            isAgentListening = true;
            voiceAgentBtn.classList.add('active');
            voiceAgentInput.classList.add('active');
            speakResponse('Agent Mode Activated');
        };

        agentRecognition.onresult = (event) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
            commandInput.value = command;
            handleAgentCommand(command);
        };

        agentRecognition.onerror = (event) => {
            console.error('Agent recognition error:', event.error);
            if (event.error === 'no-speech') {
                agentRecognition.start();
            } else {
                stopAgentListening();
            }
        };

        agentRecognition.onend = () => {
            if (isAgentListening) {
                agentRecognition.start();
            }
        };
    } else {
        alert('Speech recognition is not supported in your browser.');
    }
}

function startAgentListening() {
    if (!agentRecognition) {
        initAgentRecognition();
    }
    if (agentRecognition) {
        agentRecognition.start();
    }
}

function stopAgentListening() {
    if (agentRecognition) {
        agentRecognition.stop();
    }
    isAgentListening = false;
    voiceAgentBtn.classList.remove('active');
    voiceAgentInput.classList.remove('active');
    commandInput.value = '';
    localStorage.setItem('agentActive', 'false');
    speakResponse('Agent Mode Deactivated');
}

function handleAgentCommand(command) {
    // Scroll commands
    if (command.includes('scroll up')) {
        window.scrollBy(0, -300);
        speakResponse('Scrolling up');
    } else if (command.includes('scroll down')) {
        window.scrollBy(0, 300);
        speakResponse('Scrolling down');
    } else if (command.includes('scroll to top')) {
        window.scrollTo(0, 0);
        speakResponse('Scrolling to top');
    } else if (command.includes('scroll to bottom')) {
        window.scrollTo(0, document.body.scrollHeight);
        speakResponse('Scrolling to bottom');
    }
    // Navigation commands
    else if (command.includes('go to home')) {
        localStorage.setItem('agentActive', 'true'); // Keep agent active during navigation
        window.location.href = '/index';
        speakResponse('Navigating to home');
    }
    // Language commands
    else if (command.includes('switch to english')) {
        document.getElementById('languageDropdown').textContent = 'English';
        speakResponse('Switching to English');
    } else if (command.includes('switch to french')) {
        document.getElementById('languageDropdown').textContent = 'French';
        speakResponse('Switching to French');
    } else if (command.includes('switch to darija')) {
        document.getElementById('languageDropdown').textContent = 'Darija';
        speakResponse('Switching to Darija');
    }
    // Help command
    else if (command.includes('help') || command.includes('what can you do')) {
        speakResponse('I can help you scroll, navigate to different pages, and switch languages. Just tell me what you want to do.');
    }
    // Deactivation command
    else if (command.includes('deactivate') || command.includes('stop listening')) {
        stopAgentListening();
    }
    // Unknown command
    else {
        speakResponse('Sorry, I did not understand that command. Say help to know what I can do.');
    }
}

function speakResponse(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    }
}

// Event Listeners for the agent
voiceAgentBtn.addEventListener('click', () => {
    if (!isAgentListening) {
        startAgentListening();
    } else {
        stopAgentListening();
    }
});

sendCommandBtn.addEventListener('click', () => {
    const command = commandInput.value.toLowerCase();
    if (command) {
        handleAgentCommand(command);
        commandInput.value = '';
    }
});

commandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const command = commandInput.value.toLowerCase();
        if (command) {
            handleAgentCommand(command);
            commandInput.value = '';
        }
    }
});

// Initialize agent on page load
document.addEventListener('DOMContentLoaded', () => {
    initAgentRecognition();
    // Check if agent was active on previous page
    if (localStorage.getItem('agentActive') === 'true') {
        startAgentListening();
    }
});

// Initialize speech recognition when the page loads
window.addEventListener('load', initSpeechRecognition);

