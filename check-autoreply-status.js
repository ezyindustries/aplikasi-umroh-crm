async function checkAutoReplyStatus() {
    console.log('🔍 Checking AutoReply System Status...\n');
    
    const API_URL = 'http://localhost:3003/api';
    
    try {
        // 1. Check master switch
        console.log('1. Checking master automation switch...');
        const masterResponse = await fetch(`${API_URL}/automation/master-switch/status`);
        const masterData = await masterResponse.json();
        console.log(`   Master Switch: ${masterData.enabled ? '✅ ON' : '❌ OFF'}`);
        
        if (!masterData.enabled) {
            console.log('\n⚠️ MASTER SWITCH IS OFF! Enable it first.');
            return;
        }
        
        // 2. Check active rules
        console.log('\n2. Checking active automation rules...');
        const rulesResponse = await fetch(`${API_URL}/automation/rules`);
        const rulesData = await rulesResponse.json();
        
        if (rulesData.success) {
            const activeRules = rulesData.data.filter(r => r.isActive);
            console.log(`   Total rules: ${rulesData.data.length}`);
            console.log(`   Active rules: ${activeRules.length}`);
            
            // Find template-based rules
            const templateRules = activeRules.filter(r => r.ruleType === 'template');
            console.log(`   Template-based rules: ${templateRules.length}`);
            
            if (templateRules.length > 0) {
                console.log('\n   Template Rules:');
                templateRules.forEach(rule => {
                    console.log(`   - ${rule.name} (Priority: ${rule.priority})`);
                });
            }
        }
        
        // 3. Check specific template
        console.log('\n3. Checking template for #2026_9H_SBY_MED_JAN_FEB...');
        const templateResponse = await fetch(`${API_URL}/templates?category=package_info`);
        const templateData = await templateResponse.json();
        
        if (templateData.success) {
            const targetTemplate = templateData.data.find(t => 
                t.templateName.includes('2026_9H_SBY_MED_JAN_FEB')
            );
            
            if (targetTemplate) {
                console.log(`   ✅ Template found: ${targetTemplate.templateName}`);
                console.log(`   Keywords: ${targetTemplate.keywords}`);
                console.log(`   Active: ${targetTemplate.isActive ? 'Yes' : 'No'}`);
                console.log(`   Priority: ${targetTemplate.priority}`);
                console.log(`   Media files: ${targetTemplate.mediaFiles?.length || 0}`);
            } else {
                console.log('   ❌ Template not found!');
            }
        }
        
        // 4. Test keyword matching
        console.log('\n4. Testing keyword match...');
        const testResponse = await fetch(`${API_URL}/automation/test-keyword`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: '#2026_9H_SBY_MED_JAN_FEB',
                ruleType: 'template'
            })
        });
        
        const testData = await testResponse.json();
        if (testData.matches && testData.matches.length > 0) {
            console.log(`   ✅ Keyword matches found: ${testData.matches.length}`);
            testData.matches.forEach(match => {
                console.log(`   - Template: ${match.templateName}`);
            });
        } else {
            console.log('   ❌ No keyword matches found!');
        }
        
        // 5. Check recent logs
        console.log('\n5. Checking recent automation logs...');
        const logsResponse = await fetch(`${API_URL}/automation/logs?limit=5`);
        const logsData = await logsResponse.json();
        
        if (logsData.success && logsData.data.length > 0) {
            console.log('   Recent automation activity:');
            logsData.data.forEach(log => {
                const time = new Date(log.executedAt).toLocaleTimeString();
                console.log(`   - ${time}: ${log.status} - ${log.rule?.name || 'Unknown rule'}`);
                if (log.error) {
                    console.log(`     Error: ${log.error}`);
                }
            });
        } else {
            console.log('   No recent automation activity');
        }
        
    } catch (error) {
        console.error('❌ Error checking status:', error.message);
    }
}

checkAutoReplyStatus();