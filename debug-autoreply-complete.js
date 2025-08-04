async function debugAutoReply() {
    console.log('🔍 COMPLETE AUTOREPLY SYSTEM DEBUG\n');
    
    const API_URL = 'http://localhost:3003/api';
    let issues = [];
    
    try {
        // 1. Check backend health
        console.log('1️⃣ Checking backend server...');
        try {
            const health = await fetch(`${API_URL}/health`);
            const healthData = await health.json();
            console.log('   ✅ Backend is running');
        } catch (e) {
            console.log('   ❌ Backend is NOT running!');
            issues.push('Backend server is not running');
            return;
        }
        
        // 2. Check WAHA connection
        console.log('\n2️⃣ Checking WAHA connection...');
        try {
            const waha = await fetch('http://localhost:3000/api/sessions/default', {
                headers: { 'X-Api-Key': 'your-api-key' }
            });
            const wahaData = await waha.json();
            if (wahaData.status === 'WORKING') {
                console.log('   ✅ WAHA is connected');
            } else {
                console.log(`   ❌ WAHA status: ${wahaData.status}`);
                issues.push('WAHA is not properly connected');
            }
        } catch (e) {
            console.log('   ❌ Cannot connect to WAHA');
            issues.push('WAHA is not running or not accessible');
        }
        
        // 3. Check master switch
        console.log('\n3️⃣ Checking master automation switch...');
        const masterResponse = await fetch(`${API_URL}/automation/master-switch/status`);
        const masterData = await masterResponse.json();
        if (masterData.enabled) {
            console.log('   ✅ Master switch is ON');
        } else {
            console.log('   ❌ Master switch is OFF');
            issues.push('Master automation switch is OFF');
        }
        
        // 4. Check active rules
        console.log('\n4️⃣ Checking automation rules...');
        const rulesResponse = await fetch(`${API_URL}/automation/rules`);
        const rulesData = await rulesResponse.json();
        
        if (rulesData.success) {
            const activeRules = rulesData.data.filter(r => r.isActive);
            console.log(`   Total rules: ${rulesData.data.length}`);
            console.log(`   Active rules: ${activeRules.length}`);
            
            if (activeRules.length === 0) {
                console.log('   ❌ No active rules!');
                issues.push('No active automation rules');
            } else {
                console.log('\n   Active Rules:');
                activeRules.forEach(rule => {
                    console.log(`   - ${rule.name}`);
                    console.log(`     Type: ${rule.ruleType}`);
                    console.log(`     Priority: ${rule.priority}`);
                    console.log(`     Keywords: ${rule.keywords?.length || 0}`);
                    
                    // Check if it's for packages
                    if (rule.metadata?.category === 'package_info' || 
                        rule.triggerConditions?.templateCategory === 'package_info' ||
                        rule.name.toLowerCase().includes('package')) {
                        console.log('     ✅ This rule handles package inquiries');
                    }
                });
            }
        }
        
        // 5. Check templates
        console.log('\n5️⃣ Checking package templates...');
        const templateResponse = await fetch(`${API_URL}/templates?category=package_info`);
        const templateData = await templateResponse.json();
        
        if (templateData.success) {
            console.log(`   Total package templates: ${templateData.data.length}`);
            const activeTemplates = templateData.data.filter(t => t.isActive);
            console.log(`   Active templates: ${activeTemplates.length}`);
            
            if (activeTemplates.length === 0) {
                console.log('   ❌ No active templates!');
                issues.push('No active package templates');
            } else {
                // Check specific template
                const sbyTemplate = activeTemplates.find(t => 
                    t.templateName.includes('2026_9H_SBY_MED_JAN_FEB')
                );
                if (sbyTemplate) {
                    console.log(`\n   Found template: ${sbyTemplate.templateName}`);
                    console.log(`   Keywords: ${sbyTemplate.keywords?.substring(0, 100)}...`);
                    console.log(`   Media files: ${sbyTemplate.mediaFiles?.length || 0}`);
                }
            }
        }
        
        // 6. Test keyword matching
        console.log('\n6️⃣ Testing keyword matching...');
        const testMessages = [
            '#2026_9H_SBY_MED_JAN_FEB',
            'paket 9 hari',
            'umroh surabaya',
            'sby januari'
        ];
        
        for (const msg of testMessages) {
            console.log(`\n   Testing: "${msg}"`);
            
            // Test against active rules
            for (const rule of rulesData.data.filter(r => r.isActive)) {
                if (rule.keywords && rule.keywords.length > 0) {
                    const matched = rule.keywords.some(k => 
                        msg.toLowerCase().includes(k.toLowerCase())
                    );
                    if (matched) {
                        console.log(`   ✅ Matches rule: ${rule.name}`);
                    }
                }
            }
            
            // Test template matching
            const templates = templateData.data.filter(t => t.isActive);
            for (const template of templates) {
                if (template.keywords) {
                    const keywords = template.keywords.toLowerCase().split(',').map(k => k.trim());
                    const matched = keywords.some(k => msg.toLowerCase().includes(k));
                    if (matched) {
                        console.log(`   ✅ Matches template: ${template.templateName}`);
                        break;
                    }
                }
            }
        }
        
        // 7. Check recent logs
        console.log('\n7️⃣ Checking recent automation logs...');
        const logsResponse = await fetch(`${API_URL}/automation/logs?limit=10`);
        const logsData = await logsResponse.json();
        
        if (logsData.success && logsData.data.length > 0) {
            console.log(`   Found ${logsData.data.length} recent log entries`);
            
            const recentLogs = logsData.data.slice(0, 5);
            recentLogs.forEach(log => {
                const time = new Date(log.executedAt).toLocaleString();
                console.log(`\n   ${time}`);
                console.log(`   Rule: ${log.rule?.name || 'Unknown'}`);
                console.log(`   Status: ${log.status}`);
                if (log.error) {
                    console.log(`   Error: ${log.error}`);
                }
                if (log.processingDetails?.triggerCheckResult) {
                    console.log(`   Trigger: ${JSON.stringify(log.processingDetails.triggerCheckResult)}`);
                }
            });
        } else {
            console.log('   No recent automation activity');
            issues.push('No automation activity detected');
        }
        
        // 8. Test automation engine directly
        console.log('\n8️⃣ Simulating message to test automation...');
        const simulateResponse = await fetch(`${API_URL}/automation/simulate-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: '#2026_9H_SBY_MED_JAN_FEB',
                fromNumber: '6281234567890'
            })
        });
        
        const simulateData = await simulateResponse.json();
        if (simulateData.success) {
            console.log('   ✅ Simulation successful');
            if (simulateData.rulesTriggered > 0) {
                console.log(`   Rules triggered: ${simulateData.rulesTriggered}`);
            } else {
                console.log('   ❌ No rules were triggered!');
                issues.push('No rules triggered for test message');
            }
        } else {
            console.log('   ❌ Simulation failed:', simulateData.error);
        }
        
        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 SUMMARY\n');
        
        if (issues.length === 0) {
            console.log('✅ All systems appear to be working!');
            console.log('\nPossible reasons autoreply didn\'t work:');
            console.log('1. Message was sent from the same number as the bot');
            console.log('2. Contact has cooldown period active');
            console.log('3. Rule conditions not met (group filters, etc)');
            console.log('4. Message format not matching keywords exactly');
        } else {
            console.log('❌ Found issues:');
            issues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue}`);
            });
            
            console.log('\n🔧 Solutions:');
            if (issues.includes('Backend server is not running')) {
                console.log('- Start the backend server: npm run dev');
            }
            if (issues.includes('WAHA is not running or not accessible')) {
                console.log('- Start WAHA: docker start waha-plus');
            }
            if (issues.includes('Master automation switch is OFF')) {
                console.log('- Run: node enable-automation.js');
            }
            if (issues.includes('No active automation rules')) {
                console.log('- Run: node create-package-autoreply-rule.js');
            }
        }
        
    } catch (error) {
        console.error('\n❌ Debug script error:', error.message);
    }
}

debugAutoReply();