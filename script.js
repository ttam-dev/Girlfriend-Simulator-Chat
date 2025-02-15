window.onload = function() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messageArea = document.getElementById('messageArea');

    let isTyping = false;
    let currentTypingIndicator = null;
    const messageQueue = [];
    let latestUserMessageText = "";
    const API_KEY = "AIzaSyBvjPOZU7UHTYfIsnns_6WdXTG4wItB_mk"; // DO NOT ABUSE MY API KEY!
    const Instruction = "You are my virtual girlfriend, here to support and comfort me. Please respond with warmth and emotion, and keep it brief.";

    let conversationHistory = []; // Ahh AI Memories

    function createUserMessage(messageText) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'user-message');
        messageDiv.textContent = messageText;

        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 10); // Small delay to allow DOM update
        return messageDiv;
    }

    function createGirlfriendMessage(messageText) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'girlfriend-message');
        messageDiv.innerHTML = messageText;

        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 10); // Small delay to allow DOM update
        return messageDiv;
    }

    function createQuotedUserMessage(messageText) {
        const quotedDiv = document.createElement('div');
        quotedDiv.classList.add('quoted-message');
        quotedDiv.textContent = messageText;
        return quotedDiv;
    }

    function createTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        return typingDiv;
    }

    function enqueueMessage(messageText) {
        messageQueue.push(messageText);
        if (!isTyping) {
            processMessageQueue();
        }
    }

    async function getGeminiResponse(messageText) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        conversationHistory.push({ role: "user", parts: [{ text: messageText }] });

        const requestBody = {
            systemInstruction: {
                role: "user",
                parts: [{ text: Instruction }]
            },
            contents: conversationHistory,
            generationConfig: {
                temperature: 1,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048, // Max = 8192
                responseMimeType: "text/plain"
            }
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                const modelResponseText = data.candidates[0].content.parts[0].text;
                conversationHistory.push({ role: "model", parts: [{ text: modelResponseText }] });

                if (conversationHistory.length > 10) {
                    conversationHistory = conversationHistory.slice(2);
                }

                return modelResponseText;
            } else {
                console.error("Unexpected API response format:", data);
                return "Sorry, I couldn't generate a response.";
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return "Sorry, I'm having trouble connecting. Please try again later.";
        }
    }

    async function processMessageQueue() {
        if (messageQueue.length === 0) {
            return;
        }
        if (isTyping) {
            return;
        }

        const userMessageText = messageQueue.shift();

        isTyping = true;
        currentTypingIndicator = createTypingIndicator();
        messageArea.appendChild(currentTypingIndicator);
        messageArea.scrollTop = messageArea.scrollHeight;

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const responseText = await getGeminiResponse(userMessageText);
            const quotedMessageDiv = createQuotedUserMessage(userMessageText);

            let girlfriendResponseHTML = "";
            if (quotedMessageDiv.textContent === latestUserMessageText) {
                girlfriendResponseHTML = responseText;
            } else {
                girlfriendResponseHTML = quotedMessageDiv.outerHTML + "<br>" + responseText;
            }

            setTimeout(() => {
                if (currentTypingIndicator) {
                    messageArea.removeChild(currentTypingIndicator);
                    currentTypingIndicator = null;
                }

                const girlfriendResponse = createGirlfriendMessage(girlfriendResponseHTML);
                messageArea.appendChild(girlfriendResponse);
                messageArea.scrollTop = messageArea.scrollHeight;
                isTyping = false;

                processMessageQueue();
            }, 1500);
        } catch (error) {
            console.error("Error processing message queue:", error);
            if (currentTypingIndicator) {
                messageArea.removeChild(currentTypingIndicator);
                currentTypingIndicator = null;
            }
            const errorMessage = createGirlfriendMessage("Sorry, I encountered an error. Please try again.");
            messageArea.appendChild(errorMessage);
            isTyping = false;
            processMessageQueue();
        }
    }

    sendButton.addEventListener('click', () => {
        const messageText = messageInput.value.trim();
        if (messageText !== "") {
            const messagesToSend = messageText.split('\n').filter(msg => msg.trim() !== "");

            messagesToSend.forEach(msg => {
                latestUserMessageText = msg;
                const userMessage = createUserMessage(msg);
                messageArea.appendChild(userMessage);
                enqueueMessage(msg);
            });

            if (isTyping && currentTypingIndicator) {
                messageArea.appendChild(currentTypingIndicator);
                messageArea.scrollTop = messageArea.scrollHeight;
            }

            messageInput.value = "";
            messageArea.scrollTop = messageArea.scrollHeight;
        }
    });

    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            sendButton.click();
            event.preventDefault();
        }
    });
};