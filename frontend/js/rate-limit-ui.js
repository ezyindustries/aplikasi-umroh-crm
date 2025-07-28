// Rate Limit UI Management
class RateLimitUI {
    constructor() {
        this.rateLimitInfo = null;
        this.updateInterval = null;
    }

    // Initialize rate limit display
    init() {
        this.createRateLimitCard();
        this.updateRateLimits();
        
        // Update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateRateLimits();
        }, 30000);
    }

    // Create rate limit card in dashboard
    createRateLimitCard() {
        const container = document.createElement('div');
        container.className = 'card rate-limit-card';
        container.innerHTML = `
            <div class="card-header">
                <h3>
                    <i class="material-icons">speed</i>
                    <span>Usage Limits</span>
                </h3>
                <span class="badge badge-info" id="user-tier">Basic</span>
            </div>
            <div class="card-content">
                <div class="limit-item">
                    <div class="limit-header">
                        <span>Daily Messages</span>
                        <span id="daily-usage">0/100</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="daily-progress" style="width: 0%"></div>
                    </div>
                </div>
                <div class="limit-item">
                    <div class="limit-header">
                        <span>Messages/Hour</span>
                        <span id="hourly-usage">0/30</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill warning" id="hourly-progress" style="width: 0%"></div>
                    </div>
                </div>
                <div class="limit-item">
                    <div class="limit-header">
                        <span>Business Hours</span>
                        <span id="business-hours-status" class="badge badge-success">Open</span>
                    </div>
                    <small class="text-muted">Mon-Sat, 8:00 AM - 8:00 PM WIB</small>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .rate-limit-card {
                margin-top: 20px;
            }
            
            .limit-item {
                margin-bottom: 15px;
            }
            
            .limit-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 14px;
            }
            
            .progress-bar {
                height: 8px;
                background: rgba(71, 85, 105, 0.3);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #60a5fa);
                transition: width 0.3s ease;
                border-radius: 4px;
            }
            
            .progress-fill.warning {
                background: linear-gradient(90deg, #f59e0b, #fbbf24);
            }
            
            .progress-fill.danger {
                background: linear-gradient(90deg, #dc2626, #ef4444);
            }
            
            .badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .badge-info {
                background: rgba(59, 130, 246, 0.2);
                color: #60a5fa;
            }
            
            .badge-success {
                background: rgba(16, 185, 129, 0.2);
                color: #10b981;
            }
            
            .badge-warning {
                background: rgba(245, 158, 11, 0.2);
                color: #f59e0b;
            }
            
            .badge-danger {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
            }
            
            .rate-limit-warning {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(245, 158, 11, 0.9);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                display: none;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                }
                to {
                    transform: translateX(0);
                }
            }
            
            .queue-indicator {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 4px 12px;
                background: rgba(59, 130, 246, 0.2);
                border-radius: 12px;
                font-size: 12px;
                color: #60a5fa;
                margin-left: 10px;
            }
            
            .queue-indicator .spinner {
                width: 12px;
                height: 12px;
                border-width: 2px;
            }
        `;
        document.head.appendChild(style);

        // Find a good place to insert it
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            statsGrid.parentNode.insertBefore(container, statsGrid.nextSibling);
        }
    }

    // Update rate limits from API
    async updateRateLimits() {
        try {
            const response = await fetch(`${API_BASE}/crm/rate-limits`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.rateLimitInfo = data.limits;
                this.updateDisplay(data);
            }
        } catch (error) {
            console.error('Failed to fetch rate limits:', error);
        }
    }

    // Update UI with rate limit data
    updateDisplay(data) {
        // Update tier
        const tierBadge = document.getElementById('user-tier');
        if (tierBadge) {
            tierBadge.textContent = data.tier.charAt(0).toUpperCase() + data.tier.slice(1);
        }

        // Update daily usage
        const daily = data.limits.daily;
        const dailyUsage = document.getElementById('daily-usage');
        const dailyProgress = document.getElementById('daily-progress');
        
        if (dailyUsage && dailyProgress) {
            dailyUsage.textContent = `${daily.used}/${daily.limit}`;
            const percentage = (daily.used / daily.limit) * 100;
            dailyProgress.style.width = `${percentage}%`;
            
            // Change color based on usage
            if (percentage > 90) {
                dailyProgress.classList.add('danger');
            } else if (percentage > 70) {
                dailyProgress.classList.add('warning');
            }
        }

        // Update hourly usage (mock for now)
        const hourlyUsage = document.getElementById('hourly-usage');
        const hourlyProgress = document.getElementById('hourly-progress');
        
        if (hourlyUsage && hourlyProgress) {
            const hourlyUsed = Math.min(daily.used, 30);
            hourlyUsage.textContent = `${hourlyUsed}/30`;
            hourlyProgress.style.width = `${(hourlyUsed / 30) * 100}%`;
        }

        // Update business hours
        const bhStatus = document.getElementById('business-hours-status');
        if (bhStatus) {
            if (data.limits.businessHours.currentlyOpen) {
                bhStatus.textContent = 'Open';
                bhStatus.className = 'badge badge-success';
            } else {
                bhStatus.textContent = 'Closed';
                bhStatus.className = 'badge badge-danger';
            }
        }

        // Show warning if approaching limits
        if (daily.remaining < 10) {
            this.showWarning(`Only ${daily.remaining} messages left today!`);
        }
    }

    // Show rate limit warning
    showWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'rate-limit-warning';
        warning.innerHTML = `
            <i class="material-icons">warning</i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(warning);
        warning.style.display = 'block';
        
        setTimeout(() => {
            warning.remove();
        }, 5000);
    }

    // Handle rate limit error
    handleRateLimitError(error) {
        const retryAfter = error.retryAfter;
        const retryDate = new Date(retryAfter);
        const now = new Date();
        const secondsLeft = Math.ceil((retryDate - now) / 1000);
        
        this.showWarning(`Rate limit exceeded. Try again in ${secondsLeft} seconds.`);
        
        // Disable send button temporarily
        const sendBtn = document.querySelector('.chat-input-container button');
        if (sendBtn) {
            sendBtn.disabled = true;
            const originalHTML = sendBtn.innerHTML;
            
            const countdown = setInterval(() => {
                const timeLeft = Math.ceil((new Date(retryAfter) - new Date()) / 1000);
                if (timeLeft > 0) {
                    sendBtn.innerHTML = `${timeLeft}s`;
                } else {
                    clearInterval(countdown);
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = originalHTML;
                }
            }, 1000);
        }
    }

    // Show queue position for message
    showQueuePosition(messageElement, queueInfo) {
        const indicator = document.createElement('span');
        indicator.className = 'queue-indicator';
        indicator.innerHTML = `
            <div class="spinner"></div>
            <span>Queue position: ${queueInfo.position}</span>
        `;
        
        messageElement.appendChild(indicator);
        
        // Update estimated time
        if (queueInfo.estimatedTime) {
            setTimeout(() => {
                indicator.innerHTML = `
                    <i class="material-icons" style="font-size: 12px;">schedule</i>
                    <span>~${queueInfo.estimatedTime}s</span>
                `;
            }, 1000);
        }
    }

    // Clean up
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Export for use
window.RateLimitUI = RateLimitUI;