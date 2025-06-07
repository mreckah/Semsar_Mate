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

// Speech Synthesis
let speechSynthesis = window.speechSynthesis;
let speaking = false;
let currentUtterance = null;

// Speech Recognition
let recognition = null;
let isRecording = false;

// Initialize speech synthesis
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices);
    };
}

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
        });
}

// Language Functions
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

// Speech Functions
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
        document.getElementById('speakButton').innerHTML = '<i class="fas fa-stop"></i>';
    };

    utterance.onend = () => {
        speaking = false;
        document.getElementById('speakButton').innerHTML = '<i class="fas fa-volume-up"></i>';
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

// Message Functions
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

// Speech Recognition Functions
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = languageConfig[currentLanguage].code;

        recognition.onstart = () => {
            isRecording = true;
            document.getElementById('voiceButton').classList.add('recording');
            document.getElementById('voiceStatus').classList.add('active');
            // Stop any ongoing speech when starting recording
            if (speaking) {
                speechSynthesis.cancel();
                speaking = false;
                document.getElementById('speakButton').innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        };

        recognition.onend = () => {
            isRecording = false;
            document.getElementById('voiceButton').classList.remove('recording');
            document.getElementById('voiceStatus').classList.remove('active');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('user-input').value = transcript;
            sendMessage();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isRecording = false;
            document.getElementById('voiceButton').classList.remove('recording');
            document.getElementById('voiceStatus').classList.remove('active');
            
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
        document.getElementById('voiceButton').style.display = 'none';
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
            document.getElementById('speakButton').innerHTML = '<i class="fas fa-volume-up"></i>';
        }
        try {
            recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
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

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateUserName();
    initSpeechRecognition();
});

document.addEventListener('DOMContentLoaded', function() {
    const assistantForm = document.getElementById('assistantForm');
    const responseContainer = document.getElementById('assistantResponse');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const submitButton = document.getElementById('submitBtn');

    if (assistantForm) {
        assistantForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading state
            submitButton.disabled = true;
            loadingSpinner.classList.add('active');
            responseContainer.innerHTML = '';

            // Get form data
            const formData = new FormData(assistantForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message')
            };

            try {
                const response = await fetch('/assistant', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Display success response
                    responseContainer.innerHTML = `
                        <div class="assistant-response">
                            <h3>Response from Assistant</h3>
                            <p>${result.message}</p>
                        </div>
                    `;
                } else {
                    // Display error message
                    responseContainer.innerHTML = `
                        <div class="assistant-response">
                            <h3>Error</h3>
                            <p class="error-message">${result.error || 'An error occurred. Please try again.'}</p>
                        </div>
                    `;
                }
            } catch (error) {
                // Display error message
                responseContainer.innerHTML = `
                    <div class="assistant-response">
                        <h3>Error</h3>
                        <p class="error-message">Failed to connect to the server. Please try again later.</p>
                    </div>
                `;
            } finally {
                // Reset loading state
                submitButton.disabled = false;
                loadingSpinner.classList.remove('active');
            }
        });
    }

    // Form validation
    const validateForm = () => {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        
        let isValid = true;
        let errorMessage = '';

        if (!name) {
            errorMessage = 'Please enter your name';
            isValid = false;
        } else if (!email) {
            errorMessage = 'Please enter your email';
            isValid = false;
        } else if (!isValidEmail(email)) {
            errorMessage = 'Please enter a valid email address';
            isValid = false;
        } else if (!message) {
            errorMessage = 'Please enter your message';
            isValid = false;
        }

        if (!isValid) {
            responseContainer.innerHTML = `
                <div class="assistant-response">
                    <h3>Validation Error</h3>
                    <p class="error-message">${errorMessage}</p>
                </div>
            `;
        }

        return isValid;
    };

    // Email validation helper
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
}); 