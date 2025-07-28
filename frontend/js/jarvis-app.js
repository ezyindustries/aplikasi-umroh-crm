// JARVIS CRM Application

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    // Boot sequence
    setTimeout(() => {
        document.getElementById('bootScreen').style.display = 'none';
        document.getElementById('mainInterface').style.display = 'flex';
        initializeJarvis();
    }, 2500);
});

// Initialize JARVIS System
function initializeJarvis() {
    // Start animations
    createParticles();
    updateDateTime();
    animateMetrics();
    startActivityStream();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Start system monitoring
    setInterval(updateSystemStatus, 5000);
}

// Create floating particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Update date and time
function updateDateTime() {
    const updateTime = () => {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        document.getElementById('dateTime').textContent = now.toLocaleString('en-US', options).toUpperCase();
    };
    
    updateTime();
    setInterval(updateTime, 1000);
}

// Animate metrics with counting effect
function animateMetrics() {
    const metrics = document.querySelectorAll('.metric-value');
    
    metrics.forEach(metric => {
        const target = parseFloat(metric.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                if (metric.getAttribute('data-target').includes('.')) {
                    metric.textContent = current.toFixed(1);
                } else {
                    metric.textContent = Math.floor(current).toLocaleString();
                }
                requestAnimationFrame(updateCounter);
            } else {
                if (metric.getAttribute('data-target').includes('.')) {
                    metric.textContent = target.toFixed(1);
                } else {
                    metric.textContent = Math.floor(target).toLocaleString();
                }
            }
        };
        
        updateCounter();
    });
}

// Start activity stream
function startActivityStream() {
    const activities = [
        { icon: 'chat', title: 'New WhatsApp Message', desc: 'Ahmad Fauzi - Inquiry about packages', time: 'Just now' },
        { icon: 'smart_toy', title: 'AI Response Sent', desc: 'Automated reply to 3 messages', time: '2 min ago' },
        { icon: 'person_add', title: 'New Lead Captured', desc: 'Siti Aminah - Via WhatsApp', time: '5 min ago' },
        { icon: 'trending_up', title: 'Conversion Complete', desc: 'Lead #1234 converted to customer', time: '8 min ago' },
        { icon: 'campaign', title: 'Campaign Started', desc: 'Ramadan Special - 500 recipients', time: '15 min ago' },
        { icon: 'analytics', title: 'Daily Report Ready', desc: 'Performance metrics compiled', time: '30 min ago' }
    ];
    
    const stream = document.getElementById('activityStream');
    let index = 0;
    
    const addActivity = () => {
        const activity = activities[index % activities.length];
        const activityEl = createActivityElement(activity);
        
        stream.insertBefore(activityEl, stream.firstChild);
        
        // Remove old activities
        if (stream.children.length > 10) {
            stream.removeChild(stream.lastChild);
        }
        
        index++;
    };
    
    // Add initial activities
    activities.slice(0, 5).forEach((activity, i) => {
        setTimeout(() => {
            const activityEl = createActivityElement(activity);
            stream.appendChild(activityEl);
        }, i * 100);
    });
    
    // Add new activity every 5 seconds
    setInterval(addActivity, 5000);
}

// Create activity element
function createActivityElement(activity) {
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = `
        <div class="activity-icon">
            <span class="material-icons">${activity.icon}</span>
        </div>
        <div class="activity-info">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-desc">${activity.desc}</div>
        </div>
        <div class="activity-time">${activity.time}</div>
    `;
    return div;
}

// Initialize event listeners
function initializeEventListeners() {
    // AI Input
    const aiInput = document.getElementById('aiInput');
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendToAI();
        }
    });
    
    // Action buttons hover effect
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            playHoverSound();
        });
    });
}

// Open conversations page
function openConversations() {
    // Use the existing conversations-beautiful.html
    window.location.href = 'conversations-beautiful.html';
}

// Send message to AI
function sendToAI() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.getElementById('aiChat');
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.innerHTML = `<div class="message-content">${message}</div>`;
    chatMessages.appendChild(userMsg);
    
    // Clear input
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const aiResponses = [
            "I'm analyzing the data now, Sir. Processing customer interactions across all channels.",
            "The WhatsApp integration is functioning at optimal capacity. 2,847 active conversations detected.",
            "AI response rate is at 98.7%. All systems are performing within expected parameters.",
            "I've identified 342 high-potential leads in today's conversations. Shall I prioritize them?",
            "The Ollama LLM is processing natural language at 0.02 seconds per query. Excellent performance.",
            "All WhatsApp messages are being captured and analyzed in real-time. No anomalies detected."
        ];
        
        const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];
        
        const aiMsg = document.createElement('div');
        aiMsg.className = 'ai-message';
        aiMsg.innerHTML = `<div class="message-content">${response}</div>`;
        chatMessages.appendChild(aiMsg);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Update system status
function updateSystemStatus() {
    // Randomly update performance bars
    const perfBars = document.querySelectorAll('.perf-fill');
    perfBars.forEach((bar, index) => {
        if (index < 2) { // CPU and RAM
            const newValue = 30 + Math.random() * 40;
            bar.style.width = newValue + '%';
            bar.parentElement.nextElementSibling.textContent = Math.floor(newValue) + '%';
        }
    });
    
    // Update metrics with slight variations
    const metrics = document.querySelectorAll('.metric-value');
    metrics.forEach(metric => {
        const current = parseFloat(metric.textContent.replace(/,/g, ''));
        const variation = (Math.random() - 0.5) * current * 0.02; // ±2% variation
        const newValue = current + variation;
        
        if (metric.getAttribute('data-target').includes('.')) {
            metric.textContent = newValue.toFixed(1);
        } else {
            metric.textContent = Math.floor(newValue).toLocaleString();
        }
    });
}

// Play hover sound (optional - requires audio file)
function playHoverSound() {
    // Add hover sound effect if desired
    // const audio = new Audio('sounds/hover.mp3');
    // audio.volume = 0.2;
    // audio.play();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K - Focus AI input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('aiInput').focus();
    }
    
    // Ctrl/Cmd + W - Open WhatsApp conversations
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        openConversations();
    }
});

// Add some JARVIS-style console messages
console.log('%c JARVIS CRM SYSTEM ', 'background: #00d4ff; color: #000; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('%c System initialized successfully ', 'color: #00ff88; font-size: 14px;');
console.log('%c All modules operational ', 'color: #00d4ff; font-size: 12px;');
console.log('%c "At your service, Sir." ', 'color: #ffaa00; font-style: italic;');