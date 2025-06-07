document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendButton = document.getElementById('sendButton');
    const clearButton = document.getElementById('clearButton');
    const exportButton = document.getElementById('exportButton');
    const voiceButton = document.getElementById('voiceButton');
    const callButton = document.getElementById('callButton');
    let isCallActive = false;
    let recognition = null;
    let synthesis = window.speechSynthesis;
    let audioContext = null;
    let mediaStream = null;
    let selectedVoice = null;

    // Initialize speech synthesis and select a voice
    function initSpeechSynthesis() {
        if (synthesis) {
            // Wait for voices to be loaded
            if (speechSynthesis.getVoices().length === 0) {
                speechSynthesis.addEventListener('voiceschanged', selectVoice);
            } else {
                selectVoice();
            }
        }
    }

    // Select a voice based on language
    function selectVoice() {
        const voices = speechSynthesis.getVoices();
        // Try to find a female English voice
        selectedVoice = voices.find(voice => 
            voice.lang.includes('en') && voice.name.includes('Female')
        ) || voices.find(voice => 
            voice.lang.includes('en')
        ) || voices[0];
        
        console.log('Selected voice:', selectedVoice ? selectedVoice.name : 'No voice selected');
    }

    // Initialize audio context
    async function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            addMessage('Error accessing microphone. Please check your permissions.', 'assistant');
            return false;
        }
    }

    // Initialize speech recognition
    function initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = async function(event) {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                
                if (event.results[0].isFinal) {
                    addMessage(transcript, 'user');
                    // Process the message and get AI response
                    const response = await processMessage(transcript);
                    // Speak the response
                    speak(response);
                }
            };

            recognition.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
                stopCall();
            };

            recognition.onend = function() {
                if (isCallActive) {
                    recognition.start();
                }
            };

            return recognition;
        }
        return null;
    }

    // Process message and get AI response
    async function processMessage(message) {
        try {
            const response = await fetch('/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                throw new Error('Server returned non-JSON response');
            }
            
            if (response.ok && data.response) {
                addMessage(data.response, 'assistant');
                return data.response;
            } else {
                const errorMsg = data.error || 'An error occurred. Please try again.';
                addMessage(errorMsg, 'assistant');
                return errorMsg;
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMsg = 'Sorry, I encountered an error. Please try again.';
            addMessage(errorMsg, 'assistant');
            return errorMsg;
        }
    }

    // Initialize speech synthesis
    function speak(text) {
        if (synthesis && selectedVoice) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = selectedVoice;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            synthesis.speak(utterance);
        }
    }

    // Start voice call
    async function startCall() {
        if (!await initAudio()) {
            return;
        }

        if (!recognition) {
            recognition = initSpeechRecognition();
        }

        if (recognition) {
            isCallActive = true;
            callButton.innerHTML = '<i class="fas fa-phone-slash"></i> End Call';
            callButton.classList.add('active');
            recognition.start();
            addMessage('Voice call started. You can speak now.', 'assistant');
            speak('Voice call started. You can speak now.');
        } else {
            addMessage('Sorry, voice calls are not supported in your browser.', 'assistant');
        }
    }

    // Stop voice call
    function stopCall() {
        isCallActive = false;
        if (recognition) {
            recognition.stop();
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContext) {
            audioContext.close();
        }
        callButton.innerHTML = '<i class="fas fa-phone"></i> Start Call';
        callButton.classList.remove('active');
        addMessage('Voice call ended.', 'assistant');
        speak('Voice call ended.');
    }

    // Handle call button click
    if (callButton) {
        callButton.addEventListener('click', async function() {
            if (!isCallActive) {
                await startCall();
            } else {
                stopCall();
            }
        });
    }

    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                ${text}
                <div class="message-time">${timeString}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Handle form submission
    if (chatForm) {
        chatForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const message = messageInput.value.trim();
            if (message) {
                messageInput.value = '';
                addMessage(message, 'user');
                const response = await processMessage(message);
                speak(response);
            }
        });
    }

    // Clear chat history
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            chatMessages.innerHTML = '';
        });
    }

    // Export chat history
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            const messages = Array.from(chatMessages.children).map(message => {
                const sender = message.classList.contains('user') ? 'User' : 'Assistant';
                const content = message.querySelector('.message-content').textContent.trim();
                const time = message.querySelector('.message-time').textContent;
                return `[${time}] ${sender}: ${content}`;
            }).join('\n\n');
            
            const blob = new Blob([messages], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'chat-history.txt';
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // Initialize speech synthesis
    initSpeechSynthesis();
}); 