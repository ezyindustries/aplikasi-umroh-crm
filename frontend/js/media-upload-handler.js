// Media Upload Handler for WhatsApp
class MediaUploadHandler {
    constructor() {
        this.allowedTypes = {
            image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            video: ['video/mp4', 'video/mpeg'],
            audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
        };
        
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.uploadQueue = [];
        this.isUploading = false;
    }

    // Initialize upload UI
    init() {
        this.createUploadButton();
        this.createPreviewModal();
        this.setupDragDrop();
    }

    // Create upload button in chat interface
    createUploadButton() {
        const chatInputWrapper = document.querySelector('.chat-input-wrapper');
        if (!chatInputWrapper) return;

        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'media-upload-input';
        fileInput.style.display = 'none';
        fileInput.accept = Object.values(this.allowedTypes).flat().join(',');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Create upload button
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'btn btn-icon upload-btn';
        uploadBtn.innerHTML = '<i class="material-icons">attach_file</i>';
        uploadBtn.onclick = () => fileInput.click();
        uploadBtn.title = 'Attach file';

        // Insert before send button
        const sendBtn = chatInputWrapper.querySelector('button');
        chatInputWrapper.insertBefore(uploadBtn, sendBtn);
        chatInputWrapper.appendChild(fileInput);

        // Add styles
        this.addStyles();
    }

    // Create preview modal
    createPreviewModal() {
        const modal = document.createElement('div');
        modal.id = 'media-preview-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content media-preview-content">
                <div class="modal-header">
                    <h3>Send Media</h3>
                    <button class="modal-close" onclick="mediaUploadHandler.closePreview()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="preview-container" id="media-preview-container">
                        <!-- Preview will be inserted here -->
                    </div>
                    <div class="caption-input-container">
                        <textarea 
                            id="media-caption" 
                            class="caption-input" 
                            placeholder="Add a caption (optional)"
                            rows="3"
                        ></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="mediaUploadHandler.closePreview()">Cancel</button>
                    <button class="btn btn-primary" onclick="mediaUploadHandler.sendMedia()">
                        <i class="material-icons">send</i>
                        Send
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Setup drag and drop
    setupDragDrop() {
        const chatArea = document.querySelector('.chat-messages');
        if (!chatArea) return;

        let dragCounter = 0;

        chatArea.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            chatArea.classList.add('drag-over');
        });

        chatArea.addEventListener('dragleave', (e) => {
            dragCounter--;
            if (dragCounter === 0) {
                chatArea.classList.remove('drag-over');
            }
        });

        chatArea.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        chatArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            chatArea.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.handleFiles(files);
            }
        });
    }

    // Handle file selection
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            this.handleFiles(files);
        }
        // Reset input
        event.target.value = '';
    }

    // Handle files
    handleFiles(files) {
        // Validate files
        const validFiles = files.filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            this.showError('No valid files selected');
            return;
        }

        if (validFiles.length === 1) {
            // Single file - show preview
            this.showPreview(validFiles[0]);
        } else {
            // Multiple files - add to queue
            this.addToQueue(validFiles);
        }
    }

    // Validate file
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            this.showError(`File "${file.name}" is too large. Maximum size is 100MB.`);
            return false;
        }

        // Check file type
        const isAllowed = Object.values(this.allowedTypes).flat().includes(file.type);
        if (!isAllowed) {
            this.showError(`File type "${file.type}" is not allowed.`);
            return false;
        }

        return true;
    }

    // Show preview
    showPreview(file) {
        this.currentFile = file;
        const modal = document.getElementById('media-preview-modal');
        const container = document.getElementById('media-preview-container');
        
        container.innerHTML = '';

        if (file.type.startsWith('image/')) {
            // Image preview
            const img = document.createElement('img');
            img.className = 'media-preview-image';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            container.appendChild(img);
        } else if (file.type === 'application/pdf') {
            // PDF preview
            container.innerHTML = `
                <div class="file-preview">
                    <i class="material-icons file-icon">picture_as_pdf</i>
                    <div class="file-info">
                        <div class="file-name">${this.escapeHtml(file.name)}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
            `;
        } else if (file.type.startsWith('video/')) {
            // Video preview
            const video = document.createElement('video');
            video.className = 'media-preview-video';
            video.controls = true;
            
            const url = URL.createObjectURL(file);
            video.src = url;
            
            container.appendChild(video);
        } else {
            // Generic file preview
            const icon = this.getFileIcon(file.type);
            container.innerHTML = `
                <div class="file-preview">
                    <i class="material-icons file-icon">${icon}</i>
                    <div class="file-info">
                        <div class="file-name">${this.escapeHtml(file.name)}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
            `;
        }

        modal.style.display = 'block';
    }

    // Send media
    async sendMedia() {
        if (!this.currentFile || !window.currentChatId) return;

        const caption = document.getElementById('media-caption').value.trim();
        const sendBtn = document.querySelector('#media-preview-modal .btn-primary');
        
        // Disable button
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<div class="spinner"></div> Sending...';

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', this.currentFile);
            formData.append('caption', caption);
            formData.append('isReply', window.messageQueueHandler?.checkIfReplyMessage(window.currentChatId) || false);

            // Upload and send
            const response = await fetch(`${API_BASE}/crm/conversations/${window.currentChatId}/media`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Add to chat UI
                this.addMediaMessageToChat(data.data);
                
                // Close modal
                this.closePreview();
                
                // Show queue info
                if (data.queue && window.rateLimitUI) {
                    const messageEl = document.querySelector(`[data-id="${data.data.id}"]`);
                    if (messageEl) {
                        window.rateLimitUI.showQueuePosition(messageEl, data.queue);
                    }
                }

                // Clear caption
                document.getElementById('media-caption').value = '';
            } else {
                throw new Error(data.message || 'Failed to send media');
            }
        } catch (error) {
            console.error('Send media error:', error);
            this.showError(error.message);
        } finally {
            // Re-enable button
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="material-icons">send</i> Send';
        }
    }

    // Add media message to chat UI
    addMediaMessageToChat(message) {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.direction}`;
        messageEl.dataset.id = message.id;
        messageEl.dataset.timestamp = message.created_at;

        const time = new Date(message.created_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let mediaContent = '';
        
        if (message.type === 'image') {
            mediaContent = `
                <div class="media-content">
                    <img src="${message.media_url}" alt="Image" onclick="mediaUploadHandler.viewMedia('${message.media_url}', 'image')">
                </div>
            `;
        } else if (message.type === 'video') {
            mediaContent = `
                <div class="media-content">
                    <video controls>
                        <source src="${message.media_url}" type="video/mp4">
                    </video>
                </div>
            `;
        } else if (message.type === 'document') {
            const fileName = message.content || 'Document';
            mediaContent = `
                <div class="media-content document">
                    <a href="${message.media_url}" download class="document-link">
                        <i class="material-icons">insert_drive_file</i>
                        <span>${this.escapeHtml(fileName)}</span>
                    </a>
                </div>
            `;
        }

        messageEl.innerHTML = `
            ${mediaContent}
            ${message.content && message.type !== 'document' ? `<div class="message-content">${this.escapeHtml(message.content)}</div>` : ''}
            <div class="message-time">
                ${time}
                <span class="message-status">
                    ${message.status === 'queued' ? '<i class="material-icons">schedule</i>' : ''}
                </span>
            </div>
        `;

        container.appendChild(messageEl);
        container.scrollTop = container.scrollHeight;
    }

    // View media in fullscreen
    viewMedia(url, type) {
        if (type === 'image') {
            window.open(url, '_blank');
        }
    }

    // Close preview
    closePreview() {
        const modal = document.getElementById('media-preview-modal');
        modal.style.display = 'none';
        this.currentFile = null;
        
        // Clean up object URLs
        const video = modal.querySelector('video');
        if (video && video.src) {
            URL.revokeObjectURL(video.src);
        }
    }

    // Helper functions
    getFileIcon(mimeType) {
        if (mimeType.includes('pdf')) return 'picture_as_pdf';
        if (mimeType.includes('word')) return 'description';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table_chart';
        if (mimeType.startsWith('audio/')) return 'audiotrack';
        if (mimeType.startsWith('video/')) return 'movie';
        return 'insert_drive_file';
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        // Use existing error toast from message queue handler
        if (window.messageQueueHandler) {
            window.messageQueueHandler.showError(message);
        } else {
            alert(message);
        }
    }

    // Add styles
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .upload-btn {
                margin-right: 10px;
            }
            
            .media-preview-content {
                max-width: 600px;
                width: 90%;
            }
            
            .preview-container {
                max-height: 400px;
                overflow: auto;
                margin-bottom: 20px;
                background: rgba(71, 85, 105, 0.1);
                border-radius: 8px;
                padding: 20px;
            }
            
            .media-preview-image {
                max-width: 100%;
                max-height: 350px;
                display: block;
                margin: 0 auto;
                border-radius: 8px;
            }
            
            .media-preview-video {
                max-width: 100%;
                max-height: 350px;
                display: block;
                margin: 0 auto;
                border-radius: 8px;
            }
            
            .file-preview {
                display: flex;
                align-items: center;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
            }
            
            .file-icon {
                font-size: 48px;
                color: #60a5fa;
                margin-right: 20px;
            }
            
            .file-info {
                flex: 1;
            }
            
            .file-name {
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 5px;
                word-break: break-word;
            }
            
            .file-size {
                font-size: 14px;
                color: #94a3b8;
            }
            
            .caption-input-container {
                margin-top: 20px;
            }
            
            .caption-input {
                width: 100%;
                background: rgba(71, 85, 105, 0.2);
                border: 1px solid rgba(71, 85, 105, 0.3);
                border-radius: 8px;
                padding: 12px;
                color: #e2e8f0;
                font-size: 14px;
                resize: vertical;
            }
            
            .caption-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
            }
            
            .drag-over {
                background: rgba(59, 130, 246, 0.1);
                border: 2px dashed #3b82f6;
            }
            
            /* Media content in messages */
            .message .media-content {
                margin-bottom: 10px;
            }
            
            .message .media-content img {
                max-width: 300px;
                max-height: 300px;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .message .media-content img:hover {
                transform: scale(1.05);
            }
            
            .message .media-content video {
                max-width: 300px;
                max-height: 300px;
                border-radius: 8px;
            }
            
            .message .media-content.document {
                background: rgba(71, 85, 105, 0.2);
                padding: 12px;
                border-radius: 8px;
                display: inline-block;
            }
            
            .document-link {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #60a5fa;
                text-decoration: none;
                transition: opacity 0.2s;
            }
            
            .document-link:hover {
                opacity: 0.8;
            }
            
            .document-link i {
                font-size: 24px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Auto-initialize
window.mediaUploadHandler = new MediaUploadHandler();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mediaUploadHandler.init();
    });
} else {
    window.mediaUploadHandler.init();
}