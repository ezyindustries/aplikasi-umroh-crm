/**
 * CRM Integration for Marketing Dashboard
 * Integrates with WhatsApp Bot and Lead Management
 */

// CRM API Service
const CRMService = {
    // Dashboard
    async getDashboard() {
        return api.get('/crm/dashboard');
    },
    
    // Lead Management
    async getLeads(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/crm/leads${queryString ? '?' + queryString : ''}`);
    },
    
    async createLead(data) {
        return api.post('/crm/leads', data);
    },
    
    async updateLead(id, data) {
        return api.put(`/crm/leads/${id}`, data);
    },
    
    async getLeadActivities(leadId) {
        return api.get(`/crm/leads/${leadId}/activities`);
    },
    
    // WhatsApp Conversations
    async getConversations(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/crm/conversations${queryString ? '?' + queryString : ''}`);
    },
    
    async getConversationMessages(conversationId) {
        return api.get(`/crm/conversations/${conversationId}/messages`);
    },
    
    async sendMessage(conversationId, content) {
        return api.post(`/crm/conversations/${conversationId}/messages`, { content });
    },
    
    // Bot Configuration
    async getBotConfig() {
        return api.get('/crm/bot/config');
    },
    
    async updateBotConfig(config) {
        return api.put('/crm/bot/config', config);
    },
    
    async getBotTemplates() {
        return api.get('/crm/bot/templates');
    },
    
    async createBotTemplate(template) {
        return api.post('/crm/bot/templates', template);
    },
    
    async updateBotTemplate(id, template) {
        return api.put(`/crm/bot/templates/${id}`, template);
    },
    
    async deleteBotTemplate(id) {
        return api.delete(`/crm/bot/templates/${id}`);
    },
    
    // Campaigns
    async getCampaigns() {
        return api.get('/crm/campaigns');
    },
    
    async createCampaign(campaign) {
        return api.post('/crm/campaigns', campaign);
    },
    
    async launchCampaign(id) {
        return api.post(`/crm/campaigns/${id}/launch`);
    }
};

// CRM Dashboard Functions
async function loadCRMDashboard() {
    try {
        const response = await CRMService.getDashboard();
        if (response.success) {
            updateCRMMetrics(response.data);
        }
    } catch (error) {
        console.error('Error loading CRM dashboard:', error);
        API.handleError(error);
    }
}

function updateCRMMetrics(data) {
    // Update lead metrics
    document.getElementById('total-leads').textContent = data.leads.total;
    document.getElementById('active-convos').textContent = data.conversations.active;
    
    // Update funnel
    if (data.leads.byStatus) {
        data.leads.byStatus.forEach(status => {
            const element = document.getElementById(`funnel-${status.status}`);
            if (element) {
                element.textContent = status.count;
            }
        });
    }
}

// Lead Management
async function loadLeads(page = 1, filters = {}) {
    try {
        showLoadingState('leads-list');
        
        const response = await CRMService.getLeads({
            page,
            ...filters
        });
        
        if (response.success) {
            displayLeads(response.data.items);
            updatePagination('leads', response.data.pagination);
        }
    } catch (error) {
        console.error('Error loading leads:', error);
        showErrorState('leads-list', error.message);
    }
}

function displayLeads(leads) {
    const container = document.getElementById('leads-list');
    container.innerHTML = '';
    
    if (leads.length === 0) {
        container.innerHTML = '<p class="no-data">No leads found</p>';
        return;
    }
    
    leads.forEach(lead => {
        const leadCard = createLeadCard(lead);
        container.appendChild(leadCard);
    });
}

function createLeadCard(lead) {
    const div = document.createElement('div');
    div.className = 'lead-card';
    
    const statusBadge = getStatusBadge(lead.status);
    const interestLevel = getInterestLevelTag(lead.interest_level);
    
    div.innerHTML = `
        <div class="lead-header">
            <div>
                <h4 style="font-size: 16px; margin-bottom: 5px;">${lead.name || 'Unknown'}</h4>
                <div style="color: #94a3b8; font-size: 13px;">
                    <span class="material-icons" style="font-size: 14px; vertical-align: middle;">phone</span>
                    ${lead.phone} • ${lead.city || 'Unknown'}
                </div>
            </div>
            <div style="text-align: right;">
                <div class="badge ${statusBadge.class}">${statusBadge.text}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 5px;">
                    ${formatRelativeTime(lead.created_at)}
                </div>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
            <div>
                <div style="color: #94a3b8; font-size: 12px;">Interest</div>
                <div style="font-weight: 600;">${lead.interestedPackage?.name || '-'}</div>
            </div>
            <div>
                <div style="color: #94a3b8; font-size: 12px;">Budget</div>
                <div style="font-weight: 600;">${lead.budget_range || '-'}</div>
            </div>
            <div>
                <div style="color: #94a3b8; font-size: 12px;">Departure</div>
                <div style="font-weight: 600;">${lead.estimated_departure ? formatDate(lead.estimated_departure) : '-'}</div>
            </div>
        </div>
        <div class="lead-tags">
            ${interestLevel}
            ${lead.tags.map(tag => `<span class="lead-tag" style="background: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;">${tag.name}</span>`).join('')}
        </div>
        <div style="margin-top: 15px; display: flex; gap: 10px;">
            <button class="btn btn-primary" style="font-size: 13px; padding: 6px 16px;" onclick="openWhatsApp('${lead.phone}')">
                <span class="material-icons" style="font-size: 16px;">chat</span> WhatsApp
            </button>
            <button class="btn btn-secondary" style="font-size: 13px; padding: 6px 16px;" onclick="editLead('${lead.id}')">
                <span class="material-icons" style="font-size: 16px;">edit</span> Edit
            </button>
            <button class="btn btn-secondary" style="font-size: 13px; padding: 6px 16px;" onclick="viewLeadActivities('${lead.id}')">
                <span class="material-icons" style="font-size: 16px;">history</span> Activity
            </button>
        </div>
    `;
    
    return div;
}

// WhatsApp Conversations
async function loadConversations(status = 'active') {
    try {
        const response = await CRMService.getConversations({ status });
        
        if (response.success) {
            displayConversations(response.data.items);
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
        API.handleError(error);
    }
}

function displayConversations(conversations) {
    const container = document.getElementById('conversation-list');
    container.innerHTML = '';
    
    conversations.forEach(conv => {
        const item = createConversationItem(conv);
        container.appendChild(item);
    });
}

function createConversationItem(conversation) {
    const div = document.createElement('div');
    div.className = 'conversation-item';
    div.onclick = () => selectConversation(conversation.id);
    div.style.cursor = 'pointer';
    
    const lastMessage = conversation.messages[0];
    const contact = conversation.lead || conversation.jamaah;
    const initials = contact?.name ? contact.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'WA';
    
    div.innerHTML = `
        <div class="conversation-avatar">${initials}</div>
        <div class="conversation-details">
            <div class="conversation-name">${contact?.name || conversation.phone_number}</div>
            <div class="conversation-preview">${lastMessage?.content || 'No messages'}</div>
        </div>
        <div>
            <div class="conversation-time">${formatRelativeTime(conversation.last_message_at)}</div>
            ${conversation.status === 'bot_handled' ? '<span class="badge badge-success" style="font-size: 10px;">Bot</span>' : ''}
        </div>
    `;
    
    return div;
}

// Chat Functions
let currentConversation = null;

async function selectConversation(conversationId) {
    try {
        currentConversation = conversationId;
        
        // Load messages
        const response = await CRMService.getConversationMessages(conversationId);
        
        if (response.success) {
            displayMessages(response.data);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        API.handleError(error);
    }
}

function displayMessages(messages) {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageEl = createMessageElement(message);
        container.appendChild(messageEl);
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.direction}`;
    
    if (message.is_from_bot) {
        div.classList.add('bot');
    }
    
    const time = new Date(message.created_at).toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let botInfo = '';
    if (message.is_from_bot) {
        botInfo = ` • Bot (confidence: ${message.bot_confidence || 'N/A'})`;
    }
    
    div.innerHTML = `
        <div>${message.content}</div>
        <div class="message-time">${time}${botInfo}</div>
    `;
    
    return div;
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || !currentConversation) return;
    
    try {
        // Add message to UI immediately
        const tempMessage = {
            direction: 'outbound',
            content: message,
            created_at: new Date(),
            is_from_bot: false
        };
        
        const messageEl = createMessageElement(tempMessage);
        document.getElementById('chat-messages').appendChild(messageEl);
        
        // Clear input
        input.value = '';
        
        // Send to server
        await CRMService.sendMessage(currentConversation, message);
        
        // Reload messages to get server response
        setTimeout(() => selectConversation(currentConversation), 1000);
    } catch (error) {
        console.error('Error sending message:', error);
        API.handleError(error);
    }
}

// Bot Configuration
async function loadBotConfig() {
    try {
        const [configResponse, templatesResponse] = await Promise.all([
            CRMService.getBotConfig(),
            CRMService.getBotTemplates()
        ]);
        
        if (configResponse.success) {
            populateBotConfig(configResponse.data);
        }
        
        if (templatesResponse.success) {
            displayBotTemplates(templatesResponse.data);
        }
    } catch (error) {
        console.error('Error loading bot config:', error);
        API.handleError(error);
    }
}

function populateBotConfig(config) {
    // Populate form fields
    Object.entries(config).forEach(([key, value]) => {
        const input = document.getElementById(`bot-config-${key}`);
        if (input) {
            input.value = value;
        }
    });
}

async function saveBotConfig() {
    try {
        const config = {};
        
        // Collect all config inputs
        document.querySelectorAll('[id^="bot-config-"]').forEach(input => {
            const key = input.id.replace('bot-config-', '');
            config[key] = input.value;
        });
        
        const response = await CRMService.updateBotConfig(config);
        
        if (response.success) {
            API.showToast('success', 'Bot configuration saved successfully');
        }
    } catch (error) {
        console.error('Error saving bot config:', error);
        API.handleError(error);
    }
}

// Helper Functions
function getStatusBadge(status) {
    const badges = {
        'new': { class: 'badge-info', text: 'New' },
        'contacted': { class: 'badge-secondary', text: 'Contacted' },
        'qualified': { class: 'badge-warning', text: 'Qualified' },
        'negotiation': { class: 'badge-primary', text: 'Negotiation' },
        'won': { class: 'badge-success', text: 'Won' },
        'lost': { class: 'badge-danger', text: 'Lost' }
    };
    
    return badges[status] || { class: 'badge-secondary', text: status };
}

function getInterestLevelTag(level) {
    if (level >= 8) {
        return '<span class="lead-tag hot-lead">Hot Lead</span>';
    } else if (level >= 5) {
        return '<span class="lead-tag warm-lead">Warm Lead</span>';
    } else {
        return '<span class="lead-tag cold-lead">Cold Lead</span>';
    }
}

function openWhatsApp(phone) {
    // Remove any non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add country code if not present
    const formattedPhone = cleanPhone.startsWith('62') ? cleanPhone : `62${cleanPhone}`;
    
    // Open WhatsApp
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short'
    });
}

function formatRelativeTime(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
}

// Attach to window
window.CRMService = CRMService;
window.loadCRMDashboard = loadCRMDashboard;
window.loadLeads = loadLeads;
window.loadConversations = loadConversations;
window.selectConversation = selectConversation;
window.sendChatMessage = sendChatMessage;
window.loadBotConfig = loadBotConfig;
window.saveBotConfig = saveBotConfig;
window.openWhatsApp = openWhatsApp;

// Add event listener for Enter key in chat
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
});