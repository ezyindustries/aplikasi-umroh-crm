// Conversation Labels Management
class ConversationLabels {
    constructor() {
        this.labels = [];
        this.selectedLabels = new Set();
        this.currentConversationId = null;
    }

    // Initialize labels system
    async init() {
        await this.loadLabels();
        this.createLabelUI();
        this.setupEventListeners();
        this.addStyles();
    }

    // Load labels from backend
    async loadLabels() {
        try {
            const response = await fetch(`${API_BASE}/crm/labels`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.labels = data.data;
                this.renderLabelFilter();
            }
        } catch (error) {
            console.error('Failed to load labels:', error);
        }
    }

    // Create label UI components
    createLabelUI() {
        // Add label filter to conversation list
        this.createLabelFilter();
        
        // Add label selector to chat header
        this.createLabelSelector();
        
        // Add label management modal
        this.createLabelManagementModal();
    }

    // Create label filter for conversation list
    createLabelFilter() {
        const filterContainer = document.createElement('div');
        filterContainer.id = 'label-filter-container';
        filterContainer.className = 'label-filter-container';
        filterContainer.innerHTML = `
            <div class="label-filter-header">
                <h4>Filter by Label</h4>
                <button class="btn-icon" onclick="conversationLabels.openManageLabels()">
                    <i class="material-icons">settings</i>
                </button>
            </div>
            <div class="label-filter-list" id="label-filter-list">
                <div class="label-filter-item active" data-label-id="all">
                    <i class="material-icons">label</i>
                    <span>All Conversations</span>
                </div>
            </div>
        `;
        
        // Find a good place to insert it
        const conversationSection = document.querySelector('.card:has(.conversation-list)');
        if (conversationSection) {
            conversationSection.insertBefore(filterContainer, conversationSection.querySelector('.conversation-list'));
        }
    }

    // Render label filter items
    renderLabelFilter() {
        const filterList = document.getElementById('label-filter-list');
        if (!filterList) return;
        
        // Keep the "All" option
        const allOption = filterList.querySelector('[data-label-id="all"]');
        filterList.innerHTML = '';
        filterList.appendChild(allOption);
        
        // Add each label
        this.labels.forEach(label => {
            const item = document.createElement('div');
            item.className = 'label-filter-item';
            item.dataset.labelId = label.id;
            item.innerHTML = `
                <i class="material-icons" style="color: ${label.color}">${label.icon || 'label'}</i>
                <span>${this.escapeHtml(label.name)}</span>
                <span class="label-count">0</span>
            `;
            item.onclick = () => this.filterByLabel(label.id);
            filterList.appendChild(item);
        });
    }

    // Create label selector for chat header
    createLabelSelector() {
        const selector = document.createElement('div');
        selector.id = 'conversation-label-selector';
        selector.className = 'conversation-label-selector';
        selector.innerHTML = `
            <button class="btn-icon label-selector-btn" onclick="conversationLabels.toggleLabelSelector()" title="Manage labels">
                <i class="material-icons">label</i>
            </button>
            <div class="label-selector-dropdown" id="label-selector-dropdown">
                <div class="label-selector-header">
                    <h4>Assign Labels</h4>
                </div>
                <div class="label-selector-list" id="label-selector-list">
                    <!-- Labels will be rendered here -->
                </div>
                <div class="label-selector-footer">
                    <button class="btn btn-sm btn-primary" onclick="conversationLabels.saveLabels()">Save</button>
                    <button class="btn btn-sm btn-secondary" onclick="conversationLabels.closeLabelSelector()">Cancel</button>
                </div>
            </div>
        `;
        
        // This will be inserted into chat header when a conversation is selected
        this.labelSelectorElement = selector;
    }

    // Create label management modal
    createLabelManagementModal() {
        const modal = document.createElement('div');
        modal.id = 'label-management-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content label-management-content">
                <div class="modal-header">
                    <h2>Manage Labels</h2>
                    <button class="modal-close" onclick="conversationLabels.closeManageLabels()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="label-management-actions">
                        <button class="btn btn-primary" onclick="conversationLabels.showCreateLabel()">
                            <i class="material-icons">add</i>
                            Create New Label
                        </button>
                    </div>
                    <div class="label-list" id="manage-labels-list">
                        <!-- Labels will be rendered here -->
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Create label form modal
        const formModal = document.createElement('div');
        formModal.id = 'label-form-modal';
        formModal.className = 'modal';
        formModal.innerHTML = `
            <div class="modal-content label-form-content">
                <div class="modal-header">
                    <h3 id="label-form-title">Create Label</h3>
                    <button class="modal-close" onclick="conversationLabels.closeLabelForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="label-form" onsubmit="conversationLabels.submitLabel(event)">
                        <div class="form-group">
                            <label>Label Name</label>
                            <input type="text" id="label-name" class="form-control" required maxlength="50">
                        </div>
                        <div class="form-group">
                            <label>Color</label>
                            <div class="color-picker">
                                ${this.getColorOptions().map(color => `
                                    <div class="color-option" data-color="${color}" style="background: ${color}" onclick="conversationLabels.selectColor('${color}')"></div>
                                `).join('')}
                            </div>
                            <input type="hidden" id="label-color" value="#3b82f6" required>
                        </div>
                        <div class="form-group">
                            <label>Icon (optional)</label>
                            <div class="icon-picker">
                                ${this.getIconOptions().map(icon => `
                                    <div class="icon-option" data-icon="${icon}" onclick="conversationLabels.selectIcon('${icon}')">
                                        <i class="material-icons">${icon}</i>
                                    </div>
                                `).join('')}
                            </div>
                            <input type="hidden" id="label-icon" value="">
                        </div>
                        <div class="form-group">
                            <label>Description (optional)</label>
                            <textarea id="label-description" class="form-control" rows="3"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Label</button>
                            <button type="button" class="btn btn-secondary" onclick="conversationLabels.closeLabelForm()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(formModal);
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for conversation selection
        document.addEventListener('conversation:selected', (event) => {
            this.currentConversationId = event.detail.conversationId;
            this.updateConversationLabels(event.detail.labels || []);
        });
        
        // Listen for label updates via WebSocket
        if (window.ws) {
            ws.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'conversation:labels_updated') {
                    this.handleLabelUpdate(data);
                }
            });
        }
    }

    // Filter conversations by label
    async filterByLabel(labelId) {
        // Update UI
        document.querySelectorAll('.label-filter-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-label-id="${labelId}"]`)?.classList.add('active');
        
        // Reload conversations with filter
        if (window.loadConversations) {
            const params = labelId === 'all' ? {} : { labelId };
            window.loadConversations(params);
        }
    }

    // Show label selector for current conversation
    toggleLabelSelector() {
        const dropdown = document.getElementById('label-selector-dropdown');
        if (!dropdown) return;
        
        const isOpen = dropdown.classList.contains('show');
        if (isOpen) {
            this.closeLabelSelector();
        } else {
            this.openLabelSelector();
        }
    }

    // Open label selector
    async openLabelSelector() {
        if (!this.currentConversationId) return;
        
        // Get current conversation labels
        const conversation = await this.getConversationDetails(this.currentConversationId);
        const currentLabels = conversation?.labels || [];
        
        // Render label options
        const list = document.getElementById('label-selector-list');
        list.innerHTML = this.labels.map(label => `
            <label class="label-selector-item">
                <input type="checkbox" value="${label.id}" ${currentLabels.find(l => l.id === label.id) ? 'checked' : ''}>
                <span class="label-tag" style="background: ${label.color}">
                    <i class="material-icons">${label.icon || 'label'}</i>
                    ${this.escapeHtml(label.name)}
                </span>
            </label>
        `).join('');
        
        // Show dropdown
        document.getElementById('label-selector-dropdown').classList.add('show');
    }

    // Close label selector
    closeLabelSelector() {
        document.getElementById('label-selector-dropdown')?.classList.remove('show');
    }

    // Save selected labels
    async saveLabels() {
        const checkboxes = document.querySelectorAll('#label-selector-list input[type="checkbox"]:checked');
        const labelIds = Array.from(checkboxes).map(cb => cb.value);
        
        try {
            const response = await fetch(`${API_BASE}/crm/conversations/${this.currentConversationId}/labels`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ labelIds })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateConversationLabels(data.data.labels);
                this.closeLabelSelector();
                this.showSuccess('Labels updated successfully');
            }
        } catch (error) {
            console.error('Failed to save labels:', error);
            this.showError('Failed to update labels');
        }
    }

    // Update conversation labels in UI
    updateConversationLabels(labels) {
        // Update in conversation list
        const conversationItem = document.querySelector(`[data-conversation-id="${this.currentConversationId}"]`);
        if (conversationItem) {
            let labelsContainer = conversationItem.querySelector('.conversation-labels');
            if (!labelsContainer) {
                labelsContainer = document.createElement('div');
                labelsContainer.className = 'conversation-labels';
                conversationItem.appendChild(labelsContainer);
            }
            
            labelsContainer.innerHTML = labels.map(label => `
                <span class="label-tag mini" style="background: ${label.color}">
                    <i class="material-icons">${label.icon || 'label'}</i>
                    ${this.escapeHtml(label.name)}
                </span>
            `).join('');
        }
        
        // Update in chat header
        this.updateChatHeaderLabels(labels);
    }

    // Update labels in chat header
    updateChatHeaderLabels(labels) {
        let container = document.getElementById('chat-header-labels');
        if (!container) {
            const chatHeader = document.querySelector('.chat-header');
            if (chatHeader) {
                container = document.createElement('div');
                container.id = 'chat-header-labels';
                container.className = 'chat-header-labels';
                chatHeader.appendChild(container);
                
                // Add label selector button
                if (!chatHeader.querySelector('.label-selector-btn')) {
                    chatHeader.appendChild(this.labelSelectorElement);
                }
            }
        }
        
        if (container) {
            container.innerHTML = labels.map(label => `
                <span class="label-tag" style="background: ${label.color}">
                    <i class="material-icons">${label.icon || 'label'}</i>
                    ${this.escapeHtml(label.name)}
                </span>
            `).join('');
        }
    }

    // Label management functions
    openManageLabels() {
        this.renderManageLabels();
        document.getElementById('label-management-modal').style.display = 'block';
    }

    closeManageLabels() {
        document.getElementById('label-management-modal').style.display = 'none';
    }

    renderManageLabels() {
        const list = document.getElementById('manage-labels-list');
        list.innerHTML = this.labels.map(label => `
            <div class="label-item">
                <div class="label-info">
                    <span class="label-tag" style="background: ${label.color}">
                        <i class="material-icons">${label.icon || 'label'}</i>
                        ${this.escapeHtml(label.name)}
                    </span>
                    ${label.description ? `<p class="label-description">${this.escapeHtml(label.description)}</p>` : ''}
                </div>
                <div class="label-actions">
                    <button class="btn-icon" onclick="conversationLabels.editLabel('${label.id}')">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn-icon" onclick="conversationLabels.deleteLabel('${label.id}')">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Show create label form
    showCreateLabel() {
        this.currentEditingLabel = null;
        document.getElementById('label-form-title').textContent = 'Create Label';
        document.getElementById('label-form').reset();
        document.getElementById('label-color').value = '#3b82f6';
        this.selectColor('#3b82f6');
        document.getElementById('label-form-modal').style.display = 'block';
    }

    // Edit label
    async editLabel(labelId) {
        const label = this.labels.find(l => l.id === labelId);
        if (!label) return;
        
        this.currentEditingLabel = label;
        document.getElementById('label-form-title').textContent = 'Edit Label';
        document.getElementById('label-name').value = label.name;
        document.getElementById('label-color').value = label.color;
        document.getElementById('label-icon').value = label.icon || '';
        document.getElementById('label-description').value = label.description || '';
        
        this.selectColor(label.color);
        if (label.icon) this.selectIcon(label.icon);
        
        document.getElementById('label-form-modal').style.display = 'block';
    }

    // Delete label
    async deleteLabel(labelId) {
        if (!confirm('Are you sure you want to delete this label?')) return;
        
        try {
            const response = await fetch(`${API_BASE}/crm/labels/${labelId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                await this.loadLabels();
                this.renderManageLabels();
                this.showSuccess('Label deleted successfully');
            }
        } catch (error) {
            console.error('Failed to delete label:', error);
            this.showError('Failed to delete label');
        }
    }

    // Submit label form
    async submitLabel(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('label-name').value,
            color: document.getElementById('label-color').value,
            icon: document.getElementById('label-icon').value || null,
            description: document.getElementById('label-description').value || null
        };
        
        try {
            const url = this.currentEditingLabel 
                ? `${API_BASE}/crm/labels/${this.currentEditingLabel.id}`
                : `${API_BASE}/crm/labels`;
                
            const method = this.currentEditingLabel ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                await this.loadLabels();
                this.closeLabelForm();
                this.renderManageLabels();
                this.showSuccess(this.currentEditingLabel ? 'Label updated' : 'Label created');
            }
        } catch (error) {
            console.error('Failed to save label:', error);
            this.showError('Failed to save label');
        }
    }

    closeLabelForm() {
        document.getElementById('label-form-modal').style.display = 'none';
    }

    // Color and icon selection
    selectColor(color) {
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        document.querySelector(`[data-color="${color}"]`)?.classList.add('selected');
        document.getElementById('label-color').value = color;
    }

    selectIcon(icon) {
        document.querySelectorAll('.icon-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        document.querySelector(`[data-icon="${icon}"]`)?.classList.add('selected');
        document.getElementById('label-icon').value = icon;
    }

    // Helper functions
    getColorOptions() {
        return [
            '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
            '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6',
            '#f97316', '#06b6d4', '#84cc16', '#a855f7',
            '#dc2626', '#ca8a04', '#059669', '#2563eb'
        ];
    }

    getIconOptions() {
        return [
            'label', 'star', 'flag', 'bookmark', 'local_fire_department',
            'schedule', 'verified', 'info', 'payment', 'report_problem',
            'priority_high', 'new_releases', 'help', 'group', 'person',
            'shopping_cart', 'favorite', 'thumb_up', 'visibility', 'done'
        ];
    }

    async getConversationDetails(conversationId) {
        // This would fetch full conversation details including labels
        // For now, we'll use the cached data
        return { labels: [] };
    }

    handleLabelUpdate(data) {
        if (data.conversationId === this.currentConversationId) {
            this.updateConversationLabels(data.labels);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        // Reuse message queue handler's notification
        if (window.messageQueueHandler) {
            const toast = document.createElement('div');
            toast.className = 'success-toast';
            toast.innerHTML = `
                <i class="material-icons">check_circle</i>
                <span>${message}</span>
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }

    showError(message) {
        if (window.messageQueueHandler) {
            window.messageQueueHandler.showError(message);
        }
    }

    // Add styles
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Label Filter */
            .label-filter-container {
                padding: 15px;
                border-bottom: 1px solid rgba(71, 85, 105, 0.3);
            }
            
            .label-filter-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .label-filter-header h4 {
                margin: 0;
                font-size: 14px;
                color: #94a3b8;
            }
            
            .label-filter-list {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .label-filter-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }
            
            .label-filter-item:hover {
                background: rgba(71, 85, 105, 0.1);
            }
            
            .label-filter-item.active {
                background: rgba(59, 130, 246, 0.1);
                color: #3b82f6;
            }
            
            .label-filter-item i {
                font-size: 18px;
            }
            
            .label-count {
                margin-left: auto;
                font-size: 12px;
                color: #64748b;
            }
            
            /* Label Tags */
            .label-tag {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                color: white;
                font-weight: 500;
            }
            
            .label-tag i {
                font-size: 14px;
            }
            
            .label-tag.mini {
                padding: 2px 6px;
                font-size: 11px;
                gap: 2px;
            }
            
            .label-tag.mini i {
                font-size: 12px;
            }
            
            /* Conversation Labels */
            .conversation-labels {
                display: flex;
                gap: 4px;
                margin-top: 5px;
                flex-wrap: wrap;
            }
            
            /* Chat Header Labels */
            .chat-header-labels {
                display: flex;
                gap: 6px;
                margin-left: auto;
                margin-right: 10px;
            }
            
            /* Label Selector */
            .conversation-label-selector {
                position: relative;
            }
            
            .label-selector-btn {
                background: rgba(71, 85, 105, 0.2);
                border: 1px solid rgba(71, 85, 105, 0.3);
            }
            
            .label-selector-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                background: rgba(15, 23, 42, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(71, 85, 105, 0.3);
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                min-width: 250px;
                display: none;
                z-index: 100;
            }
            
            .label-selector-dropdown.show {
                display: block;
            }
            
            .label-selector-header {
                padding: 12px 15px;
                border-bottom: 1px solid rgba(71, 85, 105, 0.3);
            }
            
            .label-selector-header h4 {
                margin: 0;
                font-size: 14px;
            }
            
            .label-selector-list {
                padding: 10px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .label-selector-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 5px;
                cursor: pointer;
            }
            
            .label-selector-item input[type="checkbox"] {
                cursor: pointer;
            }
            
            .label-selector-footer {
                padding: 10px;
                border-top: 1px solid rgba(71, 85, 105, 0.3);
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            /* Label Management Modal */
            .label-management-content {
                max-width: 600px;
                width: 90%;
            }
            
            .label-management-actions {
                margin-bottom: 20px;
            }
            
            .label-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .label-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: rgba(71, 85, 105, 0.1);
                border-radius: 8px;
            }
            
            .label-info {
                flex: 1;
            }
            
            .label-description {
                margin: 5px 0 0 0;
                font-size: 13px;
                color: #94a3b8;
            }
            
            .label-actions {
                display: flex;
                gap: 5px;
            }
            
            /* Label Form */
            .label-form-content {
                max-width: 500px;
                width: 90%;
            }
            
            .color-picker {
                display: grid;
                grid-template-columns: repeat(8, 1fr);
                gap: 10px;
                margin-top: 10px;
            }
            
            .color-option {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s;
                border: 2px solid transparent;
            }
            
            .color-option:hover {
                transform: scale(1.1);
            }
            
            .color-option.selected {
                border-color: white;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
            }
            
            .icon-picker {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 10px;
                margin-top: 10px;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .icon-option {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px;
                background: rgba(71, 85, 105, 0.2);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                border: 2px solid transparent;
            }
            
            .icon-option:hover {
                background: rgba(71, 85, 105, 0.3);
            }
            
            .icon-option.selected {
                background: rgba(59, 130, 246, 0.2);
                border-color: #3b82f6;
            }
            
            .success-toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(16, 185, 129, 0.9);
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
        `;
        document.head.appendChild(style);
    }
}

// Initialize conversation labels
window.conversationLabels = new ConversationLabels();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.conversationLabels.init();
    });
} else {
    window.conversationLabels.init();
}