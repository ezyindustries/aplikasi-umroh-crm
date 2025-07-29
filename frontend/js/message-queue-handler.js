// Message Queue Handler
class MessageQueueHandler {
    constructor() {
        this.pendingMessages = new Map();
        this.rateLimitUI = new RateLimitUI();
    }

    // Initialize the handler
    init() {
        this.rateLimitUI.init();
        this.setupWebSocketListeners();
        this.enhanceSendMessage();
    }

    // Setup WebSocket listeners for queue events
    setupWebSocketListeners() {
        if (!window.ws) return;

        // Message queued
        ws.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
                case 'message_queued':
                    this.handleMessageQueued(data);
                    break;
                case 'message:sent':
                    this.handleMessageSent(data);
                    break;
                case 'message:failed':
                    this.handleMessageFailed(data);
                    break;
            }
        });
    }

    // Enhanced send message with rate limiting
    async sendMessageWithQueue(conversationId, content) {
        const input = document.getElementById('chat-input');
        const sendBtn = document.querySelector('.chat-input-container button');
        
        // Check if within business hours
        const isWithin24Hour = this.checkIfReplyMessage(conversationId);
        
        // Disable input while sending
        input.disabled = true;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px;"></div>';

        try {
            const response = await fetch(`${API_BASE}/crm/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    content: content,
                    type: 'text',
                    isReply: isWithin24Hour
                })
            });

            const data = await response.json();

            if (response.status === 429) {
                // Rate limited
                this.rateLimitUI.handleRateLimitError(data);
                
                // Show user-friendly message with retry time
                const retryAfter = data.retryAfter || 60;
                this.showError(`Rate limit exceeded. Please wait ${retryAfter} seconds before sending more messages.`);
                
                // Re-enable after retry time
                setTimeout(() => {
                    input.disabled = false;
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = '<i class="material-icons">send</i>';
                    input.focus();
                }, retryAfter * 1000);
                
                return false;
            }

            if (response.status === 400) {
                // Business hours or spam detection
                this.showError(data.message);
                input.disabled = false;
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="material-icons">send</i>';
                return false;
            }

            if (data.success) {
                // Clear input
                input.value = '';
                
                // Add message to UI with queue status
                const messageEl = this.addMessageToChat({
                    id: data.data.id,
                    content: content,
                    direction: 'outbound',
                    status: 'queued',
                    created_at: new Date().toISOString()
                });

                // Show queue position
                if (data.queue) {
                    this.rateLimitUI.showQueuePosition(messageEl, data.queue);
                    this.pendingMessages.set(data.data.id, messageEl);
                }

                // Update rate limits
                this.rateLimitUI.updateRateLimits();
                
                return true;
            }
        } catch (error) {
            console.error('Send error:', error);
            this.showError('Failed to send message. Please try again.');
        } finally {
            // Re-enable input
            setTimeout(() => {
                input.disabled = false;
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="material-icons">send</i>';
                input.focus();
            }, 1000);
        }

        return false;
    }

    // Check if this is a reply within 24 hours
    checkIfReplyMessage(conversationId) {
        const messages = document.querySelectorAll('.message.inbound');
        if (messages.length === 0) return false;

        const lastInbound = messages[messages.length - 1];
        const timestamp = lastInbound.dataset.timestamp;
        if (!timestamp) return false;

        const messageTime = new Date(timestamp);
        const now = new Date();
        const hoursDiff = (now - messageTime) / (1000 * 60 * 60);

        return hoursDiff < 24;
    }

    // Handle message queued event
    handleMessageQueued(data) {
        console.log('Message queued:', data);
        
        const messageEl = this.pendingMessages.get(data.message.id);
        if (messageEl) {
            // Update status indicator
            const statusEl = messageEl.querySelector('.message-status');
            if (statusEl) {
                statusEl.innerHTML = '<i class="material-icons">schedule</i> Queued';
            }
        }
    }

    // Handle message sent event
    handleMessageSent(data) {
        console.log('Message sent:', data);
        
        const messageEl = this.pendingMessages.get(data.id);
        if (messageEl) {
            // Update status
            const statusEl = messageEl.querySelector('.message-status');
            if (statusEl) {
                statusEl.innerHTML = '<i class="material-icons">done</i>';
            }
            
            // Remove queue indicator
            const queueIndicator = messageEl.querySelector('.queue-indicator');
            if (queueIndicator) {
                queueIndicator.style.opacity = '0';
                setTimeout(() => queueIndicator.remove(), 300);
            }
            
            this.pendingMessages.delete(data.id);
        }
    }

    // Handle message failed event
    handleMessageFailed(data) {
        console.log('Message failed:', data);
        
        const messageEl = this.pendingMessages.get(data.item.id);
        if (messageEl) {
            // Update status
            const statusEl = messageEl.querySelector('.message-status');
            if (statusEl) {
                statusEl.innerHTML = '<i class="material-icons" style="color: #ef4444;">error</i>';
            }
            
            // Show error
            messageEl.classList.add('failed');
            
            // Add retry button
            const retryBtn = document.createElement('button');
            retryBtn.className = 'retry-btn';
            retryBtn.innerHTML = '<i class="material-icons">refresh</i> Retry';
            retryBtn.onclick = () => this.retryMessage(data.item);
            
            messageEl.appendChild(retryBtn);
            
            this.pendingMessages.delete(data.item.id);
        }
        
        this.showError(data.error || 'Failed to send message');
    }

    // Add message to chat UI
    addMessageToChat(message) {
        const container = document.getElementById('chat-messages');
        if (!container) return null;

        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.direction}`;
        messageEl.dataset.id = message.id;
        messageEl.dataset.timestamp = message.created_at;
        
        const time = new Date(message.created_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageEl.innerHTML = `
            <div class="message-content">
                ${this.escapeHtml(message.content)}
            </div>
            <div class="message-time">
                ${time}
                <span class="message-status">
                    ${message.status === 'queued' ? '<i class="material-icons">schedule</i>' : ''}
                </span>
            </div>
        `;

        container.appendChild(messageEl);
        container.scrollTop = container.scrollHeight;

        return messageEl;
    }

    // Retry failed message
    async retryMessage(messageData) {
        const { phoneNumber, message, options } = messageData;
        const conversationId = options.conversationId;
        
        // Find and update the failed message element
        const failedEl = document.querySelector(`.message[data-id="${messageData.id}"]`);
        if (failedEl) {
            failedEl.classList.remove('failed');
            const retryBtn = failedEl.querySelector('.retry-btn');
            if (retryBtn) retryBtn.remove();
        }

        // Resend
        await this.sendMessageWithQueue(conversationId, message);
    }

    // Show error message
    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-toast';
        errorEl.innerHTML = `
            <i class="material-icons">error_outline</i>
            <span>${message}</span>
        `;
        
        // Add styles if not exists
        if (!document.getElementById('error-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'error-toast-styles';
            style.textContent = `
                .error-toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    animation: slideUp 0.3s ease;
                    z-index: 1000;
                }
                
                @keyframes slideUp {
                    from {
                        transform: translate(-50%, 100%);
                    }
                    to {
                        transform: translate(-50%, 0);
                    }
                }
                
                .message.failed {
                    opacity: 0.7;
                    background: rgba(239, 68, 68, 0.1);
                }
                
                .retry-btn {
                    margin-top: 5px;
                    padding: 4px 8px;
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.5);
                    border-radius: 4px;
                    color: #60a5fa;
                    font-size: 12px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .retry-btn:hover {
                    background: rgba(59, 130, 246, 0.3);
                }
                
                .retry-btn i {
                    font-size: 14px;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(errorEl);
        
        setTimeout(() => {
            errorEl.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => errorEl.remove(), 300);
        }, 4000);
    }

    // Enhance the existing sendMessage function
    enhanceSendMessage() {
        // Override the global sendMessage function
        window.sendMessage = async () => {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message || !window.currentChatId) return;
            
            await this.sendMessageWithQueue(window.currentChatId, message);
        };
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.messageQueueHandler = new MessageQueueHandler();
        window.messageQueueHandler.init();
    });
} else {
    window.messageQueueHandler = new MessageQueueHandler();
    window.messageQueueHandler.init();
}