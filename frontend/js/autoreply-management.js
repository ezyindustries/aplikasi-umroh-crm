// Autoreply Management System JavaScript

// Global variables
let socket;
let messagesData = [];
let rulesData = [];
let intentChart;
let performanceChart;
let currentView = 'grid';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeSocket();
    initializeCharts();
    loadInitialData();
    setupEventListeners();
    createFloatingParticles();
    
    // Set up auto-refresh every 30 seconds
    setInterval(() => {
        loadInitialData();
    }, 30000);
});

// Initialize Socket.IO connection
function initializeSocket() {
    socket = io(window.API_URL || 'http://localhost:3003');
    
    socket.on('connect', () => {
        console.log('Connected to autoreply monitoring');
        showConnectionStatus('connected');
    });
    
    socket.on('disconnect', () => {
        showConnectionStatus('disconnected');
    });
    
    // Listen for new autoreply events
    socket.on('autoreply:new', (data) => {
        addNewMessage(data);
        updateStats();
        playNotificationSound();
    });
    
    socket.on('autoreply:processing', (data) => {
        updateMessageStatus(data.messageId, 'processing');
        animateProcessingCard(data.messageId);
    });
    
    socket.on('autoreply:complete', (data) => {
        updateMessageStatus(data.messageId, data.status);
        if (data.metadata) {
            updateMessageMetadata(data.messageId, data.metadata);
        }
    });
}

// Show connection status
function showConnectionStatus(status) {
    const indicator = document.createElement('div');
    indicator.className = `connection-status ${status}`;
    indicator.innerHTML = `
        <span class="material-icons">${status === 'connected' ? 'wifi' : 'wifi_off'}</span>
        <span>${status === 'connected' ? 'Connected' : 'Disconnected'}</span>
    `;
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        indicator.remove();
    }, 3000);
}

// Animate processing card
function animateProcessingCard(messageId) {
    const card = document.querySelector(`[data-id="${messageId}"]`);
    if (card) {
        card.classList.add('processing-active');
        
        // Add spinning icon to status
        const statusIcon = card.querySelector('.status-icon .material-icons');
        if (statusIcon) {
            statusIcon.textContent = 'sync';
            statusIcon.style.animation = 'spin 1s linear infinite';
        }
    }
}

// Play notification sound
function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSiEzPLZjTYIG2m98OScTgwOUarm7blmFgU7k9j1 0Xw6Bix6yO/fnkEIHWq+8+OWT');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

// Update message metadata
function updateMessageMetadata(messageId, metadata) {
    const card = document.querySelector(`[data-id="${messageId}"]`);
    if (card && metadata) {
        // Update AI tags if present
        const infoRow = card.querySelector('.info-row');
        if (infoRow && metadata.aiModel) {
            // Check if AI tags already exist
            if (!infoRow.querySelector('.tag.ai-model')) {
                const aiTags = `
                    ${metadata.aiModel ? `<span class="tag ai-model">${metadata.aiModel}</span>` : ''}
                    ${metadata.tokensUsed ? `<span class="tag tokens">${metadata.tokensUsed}t</span>` : ''}
                    ${metadata.tokensPerSecond ? `<span class="tag tps">${metadata.tokensPerSecond}t/s</span>` : ''}
                `;
                infoRow.insertAdjacentHTML('beforeend', aiTags);
            }
        }
    }
}

// Initialize Charts
function initializeCharts() {
    // Intent Distribution Chart
    const intentCtx = document.getElementById('intentChart').getContext('2d');
    intentChart = new Chart(intentCtx, {
        type: 'doughnut',
        data: {
            labels: ['Greeting', 'Price Inquiry', 'Package Info', 'Booking', 'Other'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(236, 72, 153, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e2e8f0',
                        padding: 10,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
    
    // Performance Timeline Chart
    const perfCtx = document.getElementById('performanceChart').getContext('2d');
    performanceChart = new Chart(perfCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Response Time (s)',
                data: [],
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: '#94a3b8',
                        maxTicksLimit: 6
                    },
                    grid: {
                        color: 'rgba(71, 85, 105, 0.3)'
                    }
                },
                y: {
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return value + 's';
                        }
                    },
                    grid: {
                        color: 'rgba(71, 85, 105, 0.3)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Load initial data
async function loadInitialData() {
    try {
        console.log('Loading initial data...');
        
        // Load automation logs
        const logsUrl = `${window.API_URL || 'http://localhost:3003'}/api/automation/logs?limit=50`;
        console.log('Fetching logs from:', logsUrl);
        
        const logsResponse = await fetch(logsUrl);
        console.log('Logs response status:', logsResponse.status);
        
        const logsData = await logsResponse.json();
        console.log('Logs data received:', logsData);
        console.log('Type of logsData:', typeof logsData);
        console.log('Has success property:', 'success' in logsData);
        console.log('Success value:', logsData.success);
        console.log('Has logs property:', 'logs' in logsData);
        console.log('Logs is array:', Array.isArray(logsData.logs));
        console.log('Logs count:', logsData.logs?.length);
        
        if (logsData.success && (logsData.logs || logsData.data)) {
            messagesData = logsData.logs || logsData.data;
            console.log('Messages data set:', messagesData);
            console.log('First message:', messagesData[0]);
            renderMessages();
        } else {
            console.error('Invalid logs data format:', logsData);
            console.error('Success:', logsData.success, 'Has logs:', !!logsData.logs, 'Has data:', !!logsData.data);
        }
        
        // Load stats
        const statsResponse = await fetch(`${window.API_URL || 'http://localhost:3003'}/api/automation/stats`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            updateStatsDisplay(statsData.stats);
            updateCharts(statsData.stats);
        }
        
        // Load top rules
        const rulesResponse = await fetch(`${window.API_URL || 'http://localhost:3003'}/api/automation/rule-triggers`);
        const rulesData = await rulesResponse.json();
        
        if (rulesData.success && rulesData.rules) {
            updateTopRules(rulesData.rules);
        }
        
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// Render messages
function renderMessages() {
    const container = document.getElementById('messagesContainer');
    console.log('Rendering messages. Total messages:', messagesData.length);
    
    const filteredMessages = filterMessages();
    console.log('Filtered messages:', filteredMessages.length);
    
    if (filteredMessages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">inbox</span>
                <h3>No messages found</h3>
                <p>Try adjusting your filters or wait for new activity</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredMessages.map(msg => createMessageCard(msg)).join('');
    console.log('Messages rendered');
}

// Create message card HTML
function createMessageCard(message) {
    // Handle both API formats (formatted and raw database)
    const ruleType = message.metadata?.ruleType || message.rule?.ruleType || message.ruleType || message.rule_type || 'unknown';
    const status = message.status || 'pending';
    const processingTime = message.executionTime || message.execution_time || 0;
    const timeInSeconds = (processingTime / 1000).toFixed(2);
    
    let timeClass = 'fast';
    if (timeInSeconds > 3) timeClass = 'very-slow';
    else if (timeInSeconds > 1) timeClass = 'slow';
    
    const timestamp = new Date(message.createdAt || message.created_at).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Extract fields from metadata or fallback to formatted fields or rule/contact objects
    const ruleName = message.metadata?.ruleName || message.rule?.name || message.ruleName || message.rule_name || 'Unknown Rule';
    const messageContent = message.triggerData?.messageContent || message.trigger_data?.messageContent || 'No content';
    const matchedKeywords = message.metadata?.matchedKeywords || message.matchedKeywords || [];
    const intentDetection = message.metadata?.intentDetection || message.intentDetection;
    const templateUsed = message.metadata?.templateUsed || message.templateUsed;
    
    // AI response info
    const aiModel = message.metadata?.aiModel || message.rule?.llmConfig?.model || '';
    const temperature = message.metadata?.temperature || message.rule?.llmConfig?.temperature || '';
    const tokensUsed = message.metadata?.tokensUsed || '';
    const tokensPerSecond = message.metadata?.tokensPerSecond || '';
    const promptTokens = message.metadata?.promptTokens || '';
    const completionTokens = message.metadata?.completionTokens || '';
    const aiResponsePreview = message.metadata?.aiResponsePreview || message.metadata?.responseContent || message.responseContent || '';
    const responsePreview = aiResponsePreview ? (aiResponsePreview.length > 80 ? aiResponsePreview.substring(0, 80) + '...' : aiResponsePreview) : '';
    
    // Check if this is an AI-powered response
    const hasAIInfo = ruleType === 'llm_agent' || aiModel || tokensUsed;
    
    return `
        <div class="message-card mini ${ruleType} ${status === 'processing' ? 'processing' : ''}" 
             data-id="${message.id}" onclick="showMessageDetail('${message.id}')">
            <div class="card-header">
                <div class="rule-info">
                    <span class="rule-icon ${ruleType}">
                        <span class="material-icons">${getRuleIcon(ruleType)}</span>
                    </span>
                    <div class="rule-details">
                        <span class="rule-name">${ruleName}</span>
                        <span class="rule-time">${timestamp}</span>
                    </div>
                </div>
                <span class="status-icon ${status}">
                    <span class="material-icons">${getStatusIcon(status)}</span>
                </span>
            </div>
            
            <div class="message-content-section">
                <div class="user-message">
                    <span class="message-label">User:</span>
                    <span class="message-text">${messageContent}</span>
                </div>
                ${responsePreview ? `
                    <div class="ai-response">
                        <span class="message-label">AI:</span>
                        <span class="response-text">${responsePreview}</span>
                    </div>
                ` : ''}
            </div>
            
            ${hasAIInfo ? `
                <div class="ai-info-section">
                    ${aiModel ? `
                        <div class="ai-stat">
                            <span class="ai-stat-icon"><span class="material-icons">psychology</span></span>
                            <div class="ai-stat-details">
                                <span class="ai-stat-label">Model</span>
                                <span class="ai-stat-value">${aiModel}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${temperature ? `
                        <div class="ai-stat">
                            <span class="ai-stat-icon"><span class="material-icons">thermostat</span></span>
                            <div class="ai-stat-details">
                                <span class="ai-stat-label">Temp</span>
                                <span class="ai-stat-value">${temperature}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${tokensUsed ? `
                        <div class="ai-stat">
                            <span class="ai-stat-icon"><span class="material-icons">token</span></span>
                            <div class="ai-stat-details">
                                <span class="ai-stat-label">Tokens</span>
                                <span class="ai-stat-value">${promptTokens || '?'}/${completionTokens || '?'} (${tokensUsed})</span>
                            </div>
                        </div>
                    ` : ''}
                    ${tokensPerSecond ? `
                        <div class="ai-stat">
                            <span class="ai-stat-icon"><span class="material-icons">speed</span></span>
                            <div class="ai-stat-details">
                                <span class="ai-stat-label">Speed</span>
                                <span class="ai-stat-value">${Math.round(tokensPerSecond)} t/s</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <div class="card-footer">
                ${intentDetection ? `<span class="tag intent">${intentDetection.intent} ${Math.round(intentDetection.confidence * 100)}%</span>` : ''}
                ${matchedKeywords && matchedKeywords.length > 0 ? `<span class="tag keywords">${matchedKeywords[0]}</span>` : ''}
                <span class="tag time ${timeClass}">${timeInSeconds}s</span>
                ${templateUsed && !hasAIInfo ? `<span class="tag template">${templateUsed.split(' ')[0]}</span>` : ''}
            </div>
        </div>
    `;
}

// Add new message
function addNewMessage(message) {
    messagesData.unshift(message);
    if (messagesData.length > 100) {
        messagesData.pop(); // Keep only last 100 messages
    }
    
    const container = document.getElementById('messagesContainer');
    
    // Remove empty state if exists
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = createMessageCard(message);
    const newCard = tempDiv.firstElementChild;
    
    // Add new-message class for animation
    newCard.classList.add('new-message');
    
    // Insert at the beginning
    container.insertBefore(newCard, container.firstChild);
    
    // Remove the animation class after animation completes
    setTimeout(() => {
        newCard.classList.remove('new-message');
    }, 600);
    
    // Update notification badge with animation
    const badge = document.querySelector('.notification-badge');
    const currentCount = parseInt(badge.textContent) || 0;
    badge.textContent = currentCount + 1;
    
    // Animate badge
    badge.style.transform = 'scale(1.5)';
    setTimeout(() => {
        badge.style.transform = 'scale(1)';
    }, 300);
    
    // Update stats with animation
    updateStats();
}

// Update message status
function updateMessageStatus(messageId, status) {
    const card = document.querySelector(`[data-id="${messageId}"]`);
    if (card) {
        card.classList.remove('processing');
        const statusIndicator = card.querySelector('.status-indicator');
        statusIndicator.className = `status-indicator ${status}`;
        statusIndicator.innerHTML = `<span class="material-icons">${getStatusIcon(status)}</span>`;
    }
    
    // Update in data array
    const message = messagesData.find(m => m.id === messageId);
    if (message) {
        message.status = status;
    }
}

// Filter messages based on current filters
function filterMessages() {
    const ruleType = document.getElementById('ruleTypeFilter').value;
    const intent = document.getElementById('intentFilter').value;
    const status = document.getElementById('statusFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    return messagesData.filter(msg => {
        // Handle both API formats
        const msgRuleType = msg.metadata?.ruleType || msg.rule?.ruleType || msg.ruleType || msg.rule_type;
        const msgIntent = msg.metadata?.intentDetection?.intent || msg.intentDetection?.intent;
        const msgRuleName = msg.metadata?.ruleName || msg.rule?.name || msg.ruleName || msg.rule_name || '';
        const msgContent = msg.triggerData?.messageContent || msg.trigger_data?.messageContent || '';
        const msgTemplate = msg.metadata?.templateUsed || msg.templateUsed || '';
        
        if (ruleType && msgRuleType !== ruleType) return false;
        if (intent && msgIntent !== intent) return false;
        if (status && msg.status !== status) return false;
        if (search) {
            const searchableText = [msgRuleName, msgContent, msgTemplate].join(' ').toLowerCase();
            if (!searchableText.includes(search)) return false;
        }
        return true;
    });
}

// Update stats display
function updateStatsDisplay(stats) {
    animateStatValue('totalMessages', stats.totalMessages || 0);
    animateStatValue('successRate', `${stats.successRate || 0}%`);
    animateStatValue('avgResponseTime', `${stats.avgResponseTime || 0}s`);
    animateStatValue('activeRules', stats.activeRules || 0);
}

// Animate stat value
function animateStatValue(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (element) {
        const currentValue = element.textContent;
        if (currentValue !== newValue.toString()) {
            element.classList.add('updating');
            element.textContent = newValue;
            setTimeout(() => {
                element.classList.remove('updating');
            }, 500);
        }
    }
}

// Update stats with animation
async function updateStats() {
    try {
        const response = await fetch(`${window.API_URL || 'http://localhost:3003'}/api/automation/stats`);
        const data = await response.json();
        
        if (data.success) {
            updateStatsDisplay(data.stats);
            updateCharts(data.stats);
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Update charts with new data
function updateCharts(stats) {
    if (stats.intentDistribution) {
        const intents = Object.keys(stats.intentDistribution);
        const counts = Object.values(stats.intentDistribution);
        
        intentChart.data.labels = intents;
        intentChart.data.datasets[0].data = counts;
        intentChart.update();
    }
    
    if (stats.performanceTimeline) {
        const times = stats.performanceTimeline.map(p => new Date(p.time).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        }));
        const values = stats.performanceTimeline.map(p => (p.avgTime / 1000).toFixed(2));
        
        performanceChart.data.labels = times;
        performanceChart.data.datasets[0].data = values;
        performanceChart.update();
    }
}

// Update top rules list
function updateTopRules(rules) {
    const container = document.getElementById('topRulesList');
    
    if (rules.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center;">No rules triggered yet</p>';
        return;
    }
    
    container.innerHTML = rules.slice(0, 5).map(rule => `
        <div class="rule-item">
            <span class="rule-item-name">${rule.name}</span>
            <div class="rule-item-count">
                <span class="count-badge">${rule.triggerCount}</span>
                ${rule.trend ? `
                    <span class="trend-indicator ${rule.trend < 0 ? 'down' : ''}">
                        ${rule.trend > 0 ? '+' : ''}${rule.trend}%
                    </span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Show message detail modal
function showMessageDetail(messageId) {
    const message = messagesData.find(m => m.id === messageId);
    if (!message) return;
    
    const modal = document.getElementById('messageDetailModal');
    const modalBody = document.getElementById('modalBody');
    
    // Extract rule type
    const ruleType = message.metadata?.ruleType || message.rule?.ruleType || message.ruleType || message.rule_type || 'unknown';
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <h4>Rule Information</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Rule Name:</span>
                    <span class="detail-value">${message.ruleName || message.rule_name || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Rule Type:</span>
                    <span class="detail-value">${formatRuleType(message.ruleType || message.rule_type)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Priority:</span>
                    <span class="detail-value">${message.rulePriority || message.rule_priority || 0}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value status-${message.status}">${message.status}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Message Content</h4>
            <div class="message-box">
                ${message.triggerData?.messageContent || message.trigger_data?.messageContent || 'No content'}
            </div>
            ${message.matchedKeywords ? `
                <div class="keywords-box">
                    <strong>Matched Keywords:</strong> ${message.matchedKeywords.join(', ')}
                </div>
            ` : ''}
        </div>
        
        ${message.intentDetection ? `
            <div class="detail-section">
                <h4>Intent Detection</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Intent:</span>
                        <span class="detail-value">${message.intentDetection.intent}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Confidence:</span>
                        <span class="detail-value">${Math.round(message.intentDetection.confidence * 100)}%</span>
                    </div>
                    ${message.intentDetection.entities ? `
                        <div class="detail-item full-width">
                            <span class="detail-label">Entities:</span>
                            <span class="detail-value">${JSON.stringify(message.intentDetection.entities)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        ` : ''}
        
        <div class="detail-section">
            <h4>Response Details</h4>
            ${message.templateUsed ? `
                <div class="detail-item">
                    <span class="detail-label">Template Used:</span>
                    <span class="detail-value">${message.templateUsed}</span>
                </div>
            ` : ''}
            ${message.responseContent ? `
                <div class="response-box">
                    ${message.responseContent}
                </div>
            ` : ''}
        </div>
        
        ${ruleType === 'llm_agent' || message.metadata?.aiModel || message.metadata?.aiResponsePreview || message.metadata?.responseContent ? `
            <div class="detail-section">
                <h4>AI Processing Details</h4>
                <div class="detail-grid">
                    ${message.metadata?.aiModel || message.rule?.llmConfig?.model ? `
                        <div class="detail-item">
                            <span class="detail-label">AI Model:</span>
                            <span class="detail-value">
                                <span class="material-icons" style="font-size: 16px; vertical-align: middle; margin-right: 4px;">psychology</span>
                                ${message.metadata?.aiModel || message.rule?.llmConfig?.model}
                            </span>
                        </div>
                    ` : ''}
                    ${message.metadata?.temperature || message.rule?.llmConfig?.temperature ? `
                        <div class="detail-item">
                            <span class="detail-label">Temperature:</span>
                            <span class="detail-value">${message.metadata?.temperature || message.rule?.llmConfig?.temperature}</span>
                        </div>
                    ` : ''}
                    ${message.metadata?.tokensUsed ? `
                        <div class="detail-item">
                            <span class="detail-label">Total Tokens:</span>
                            <span class="detail-value">${message.metadata.tokensUsed}</span>
                        </div>
                    ` : ''}
                    ${message.metadata?.tokensPerSecond ? `
                        <div class="detail-item">
                            <span class="detail-label">Processing Speed:</span>
                            <span class="detail-value">${message.metadata.tokensPerSecond.toFixed(2)} tokens/sec</span>
                        </div>
                    ` : ''}
                    ${message.metadata?.promptTokens ? `
                        <div class="detail-item">
                            <span class="detail-label">Prompt Tokens:</span>
                            <span class="detail-value">${message.metadata.promptTokens}</span>
                        </div>
                    ` : ''}
                    ${message.metadata?.completionTokens ? `
                        <div class="detail-item">
                            <span class="detail-label">Completion Tokens:</span>
                            <span class="detail-value">${message.metadata.completionTokens}</span>
                        </div>
                    ` : ''}
                </div>
                ${message.metadata?.aiResponsePreview || message.metadata?.responseContent || message.responseContent ? `
                    <div class="ai-response-box">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                            <span class="material-icons" style="color: #10b981;">smart_toy</span>
                            <strong>AI Response:</strong>
                        </div>
                        <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1; white-space: pre-wrap;">
                            ${message.metadata?.responseContent || message.responseContent || message.metadata?.aiResponsePreview || 'No response content available'}
                        </div>
                    </div>
                ` : ''}
                ${message.rule?.systemPrompt ? `
                    <div class="system-prompt-box">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span class="material-icons" style="color: #8b5cf6;">settings</span>
                            <strong>System Prompt:</strong>
                        </div>
                        <div style="font-size: 13px; color: #94a3b8; font-style: italic;">
                            ${message.rule.systemPrompt}
                        </div>
                    </div>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="detail-section">
            <h4>Performance Metrics</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Processing Time:</span>
                    <span class="detail-value">${((message.executionTime || 0) / 1000).toFixed(2)}s</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Timestamp:</span>
                    <span class="detail-value">${new Date(message.createdAt || message.created_at).toLocaleString('id-ID')}</span>
                </div>
            </div>
        </div>
        
        ${message.error ? `
            <div class="detail-section error">
                <h4>Error Information</h4>
                <div class="error-box">
                    ${message.error}
                </div>
            </div>
        ` : ''}
    `;
    
    modal.classList.add('show');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('messageDetailModal');
    modal.classList.remove('show');
}

// Clear filters
function clearFilters() {
    document.getElementById('ruleTypeFilter').value = '';
    document.getElementById('intentFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('searchInput').value = '';
    renderMessages();
}

// Export logs
async function exportLogs() {
    try {
        const response = await fetch(`${window.API_URL || 'http://localhost:3003'}/api/automation/logs/export`);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `autoreply-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting logs:', error);
        alert('Failed to export logs');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filters
    document.getElementById('ruleTypeFilter').addEventListener('change', renderMessages);
    document.getElementById('intentFilter').addEventListener('change', renderMessages);
    document.getElementById('statusFilter').addEventListener('change', renderMessages);
    document.getElementById('searchInput').addEventListener('input', renderMessages);
    
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.dataset.view;
            
            const container = document.getElementById('messagesContainer');
            if (currentView === 'list') {
                container.style.gridTemplateColumns = '1fr';
            } else {
                container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
            }
        });
    });
    
    // Modal close on outside click
    document.getElementById('messageDetailModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Clear notification badge on click
    document.querySelector('.notification-btn').addEventListener('click', function() {
        document.querySelector('.notification-badge').textContent = '0';
    });
}

// Create floating particles effect
function createFloatingParticles() {
    const container = document.querySelector('.floating-particles');
    const particleCount = 10;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, transparent 70%);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 20 + 20}s linear infinite;
            opacity: ${Math.random() * 0.5 + 0.2};
        `;
        container.appendChild(particle);
    }
    
    // Add floating animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            from {
                transform: translateY(100vh) translateX(0);
            }
            to {
                transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px);
            }
        }
    `;
    document.head.appendChild(style);
}

// Helper functions
function getRuleIcon(ruleType) {
    const icons = {
        keyword: 'text_fields',
        template: 'description',
        llm_agent: 'psychology',
        welcome: 'waving_hand',
        away: 'schedule',
        workflow: 'account_tree'
    };
    return icons[ruleType] || 'rule';
}

function formatRuleType(ruleType) {
    const types = {
        keyword: 'Keyword',
        template: 'Template',
        llm_agent: 'LLM Agent',
        welcome: 'Welcome',
        away: 'Away',
        workflow: 'Workflow'
    };
    return types[ruleType] || 'Unknown';
}

function getStatusIcon(status) {
    const icons = {
        success: 'check_circle',
        failed: 'error',
        skipped: 'warning',
        pending: 'hourglass_empty',
        processing: 'sync'
    };
    return icons[status] || 'help';
}

// Add additional CSS for detail modal
const additionalStyles = `
    <style>
    .detail-section {
        margin-bottom: 24px;
    }
    
    .detail-section h4 {
        font-size: 16px;
        font-weight: 600;
        color: #e2e8f0;
        margin: 0 0 16px 0;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
    }
    
    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .detail-item.full-width {
        grid-column: 1 / -1;
    }
    
    .detail-label {
        font-size: 13px;
        color: #94a3b8;
        font-weight: 500;
    }
    
    .detail-value {
        font-size: 14px;
        color: #e2e8f0;
    }
    
    .detail-value.status-success {
        color: #10b981;
    }
    
    .detail-value.status-failed {
        color: #ef4444;
    }
    
    .detail-value.status-skipped {
        color: #f59e0b;
    }
    
    .message-box, .response-box, .error-box, .keywords-box, .ai-response-box {
        background: rgba(71, 85, 105, 0.2);
        border: 1px solid rgba(71, 85, 105, 0.3);
        border-radius: 8px;
        padding: 16px;
        font-size: 14px;
        line-height: 1.5;
        color: #cbd5e1;
        margin-top: 12px;
    }
    
    .ai-response-box {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
    }
    
    .system-prompt-box {
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 8px;
        padding: 16px;
        font-size: 14px;
        line-height: 1.5;
        color: #cbd5e1;
        margin-top: 12px;
    }
    
    .error-box {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.3);
        color: #fca5a5;
    }
    
    .matched-keywords {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        font-size: 13px;
        color: #94a3b8;
    }
    
    .keyword-label {
        font-weight: 500;
    }
    
    .template-used {
        font-size: 12px;
        color: #8b5cf6;
        padding: 4px 8px;
        background: rgba(139, 92, 246, 0.1);
        border-radius: 4px;
    }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);