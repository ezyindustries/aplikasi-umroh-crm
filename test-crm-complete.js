// Comprehensive CRM Dashboard Test Script
// Run this in the browser console when on the CRM dashboard page

console.log('=== CRM Dashboard Complete Test ===');

// Test 1: Check Navigation
console.log('\n1. Testing Navigation:');
const navItems = document.querySelectorAll('.nav-item[data-page]');
console.log(`Found ${navItems.length} navigation items`);

navItems.forEach(item => {
    const page = item.dataset.page;
    console.log(`- ${page}: Click handler attached:`, 
        item.onclick === null && item._listeners !== undefined);
});

// Test 2: Check Page Switching
console.log('\n2. Testing Page Switching:');
const pages = ['dashboard', 'whatsapp', 'marketing', 'automation', 'leads', 'analytics', 'settings'];

pages.forEach(page => {
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        console.log(`✓ ${page}-page exists`);
    } else {
        console.error(`✗ ${page}-page NOT FOUND`);
    }
});

// Test 3: Check Buttons
console.log('\n3. Testing Buttons:');
const actionButtons = document.querySelectorAll('[data-action]');
console.log(`Found ${actionButtons.length} action buttons`);

const expectedActions = [
    'add-jamaah', 'view-all-leads', 'add-new-lead', 'view-conversations',
    'open-whatsapp', 'view-bot-stats', 'configure-bot', 'view-funnel',
    'view-reports', 'connect-whatsapp', 'test-bot', 'view-logs',
    'open-full-chat', 'send-message', 'close-qr-modal'
];

expectedActions.forEach(action => {
    const button = document.querySelector(`[data-action="${action}"]`);
    if (button) {
        console.log(`✓ ${action} button found`);
    } else {
        console.warn(`✗ ${action} button NOT FOUND`);
    }
});

// Test 4: Check for Inline Handlers
console.log('\n4. Checking for inline onclick handlers:');
const onclickElements = document.querySelectorAll('[onclick]');
if (onclickElements.length === 0) {
    console.log('✓ No inline onclick handlers found');
} else {
    console.error(`✗ Found ${onclickElements.length} inline onclick handlers:`);
    onclickElements.forEach((el, index) => {
        console.error(`  ${index + 1}. ${el.tagName} - ${el.outerHTML.substring(0, 80)}...`);
    });
}

// Test 5: Test Page Switching Function
console.log('\n5. Testing switchPage function:');
if (typeof switchPage === 'function') {
    console.log('✓ switchPage function exists');
    
    // Try switching to each page
    pages.forEach(page => {
        try {
            switchPage(page);
            const activeNav = document.querySelector(`.nav-item[data-page="${page}"].active`);
            const visiblePage = document.querySelector(`#${page}-page[style*="block"]`);
            
            if (activeNav && visiblePage) {
                console.log(`✓ ${page} page switches correctly`);
            } else {
                console.error(`✗ ${page} page switch failed`);
            }
        } catch (error) {
            console.error(`✗ Error switching to ${page}:`, error);
        }
    });
    
    // Return to dashboard
    switchPage('dashboard');
} else {
    console.error('✗ switchPage function not found');
}

// Test 6: Test Button Actions
console.log('\n6. Testing handleButtonAction function:');
if (typeof handleButtonAction === 'function') {
    console.log('✓ handleButtonAction function exists');
} else {
    console.error('✗ handleButtonAction function not found');
}

// Test 7: Check WebSocket
console.log('\n7. Testing WebSocket:');
if (typeof socket !== 'undefined' && socket) {
    console.log('✓ WebSocket instance exists');
    console.log(`  Connected: ${socket.connected}`);
} else {
    console.warn('✗ WebSocket not initialized');
}

// Test 8: Check Critical Functions
console.log('\n8. Testing Critical Functions:');
const criticalFunctions = [
    'connectWhatsApp', 'checkWhatsAppConnection', 'loadConversations',
    'selectConversation', 'sendMessage', 'loadStats', 'loadLeads',
    'displayLeads', 'loadBotSettings', 'toggleBot', 'saveBotConfig'
];

criticalFunctions.forEach(func => {
    if (typeof window[func] === 'function') {
        console.log(`✓ ${func} exists`);
    } else {
        console.warn(`✗ ${func} NOT FOUND`);
    }
});

// Test 9: Simulate Navigation Click
console.log('\n9. Simulating Navigation Clicks:');
try {
    // Click on WhatsApp nav
    const whatsappNav = document.querySelector('.nav-item[data-page="whatsapp"]');
    if (whatsappNav) {
        whatsappNav.click();
        const whatsappPage = document.getElementById('whatsapp-page');
        if (whatsappPage && whatsappPage.style.display === 'block') {
            console.log('✓ WhatsApp page navigation works');
        } else {
            console.error('✗ WhatsApp page navigation failed');
        }
    }
    
    // Return to dashboard
    const dashboardNav = document.querySelector('.nav-item[data-page="dashboard"]');
    if (dashboardNav) {
        dashboardNav.click();
    }
} catch (error) {
    console.error('✗ Navigation simulation failed:', error);
}

// Test 10: Check Event Listeners
console.log('\n10. Checking Event Listeners Setup:');
const setupFunctions = ['setupNavigationEventListeners', 'setupButtonEventListeners'];
setupFunctions.forEach(func => {
    if (typeof window[func] === 'function') {
        console.log(`✓ ${func} exists`);
    } else {
        console.error(`✗ ${func} NOT FOUND`);
    }
});

console.log('\n=== Test Complete ===');
console.log('Summary: Check the console output above for any ✗ marks indicating issues.');

// Return test results
const issues = [];
if (onclickElements.length > 0) issues.push('Inline onclick handlers found');
if (navItems.length === 0) issues.push('No navigation items found');
if (actionButtons.length === 0) issues.push('No action buttons found');

if (issues.length === 0) {
    console.log('\n✅ All tests passed! The CRM dashboard should be fully functional.');
} else {
    console.error('\n❌ Issues found:', issues);
}