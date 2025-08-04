async function enableAutomation() {
    console.log('🔧 Enabling Automation System...\n');
    
    const API_URL = 'http://localhost:3003/api';
    
    try {
        // Turn on master switch
        console.log('1. Turning on master automation switch...');
        const response = await fetch(`${API_URL}/automation/master-switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('   ✅ Master switch enabled!');
        } else {
            console.log('   ❌ Failed to enable:', data.error);
        }
        
        // Check if we need to create a template rule
        console.log('\n2. Checking for template-based rule...');
        const rulesResponse = await fetch(`${API_URL}/automation/rules`);
        const rulesData = await rulesResponse.json();
        
        if (rulesData.success) {
            const templateRule = rulesData.data.find(r => 
                r.ruleType === 'template' && r.name.includes('Package')
            );
            
            if (!templateRule) {
                console.log('   No template rule found. Creating one...');
                
                const newRule = {
                    name: "Smart Package Response",
                    description: "Automatically respond with package details and images based on keywords",
                    ruleType: "template",
                    isActive: true,
                    priority: 85,
                    keywords: [],
                    triggerConditions: {
                        groupFilters: "all",
                        templateCategory: "package_info",
                        useIntentDetection: true,
                        fallbackToLLM: false
                    },
                    templateId: null,
                    responseType: "single",
                    responseDelay: 1,
                    messageDelay: 2,
                    maxTriggersPerContact: 0,
                    cooldownMinutes: 0,
                    contactConditions: {},
                    metadata: {
                        category: "package_info",
                        dynamicTemplateSelection: true
                    }
                };
                
                const createResponse = await fetch(`${API_URL}/automation/rules`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newRule)
                });
                
                const createData = await createResponse.json();
                if (createData.success) {
                    console.log('   ✅ Created template rule successfully!');
                } else {
                    console.log('   ❌ Failed to create rule:', createData.error);
                }
            } else {
                console.log(`   ✅ Template rule exists: ${templateRule.name}`);
                console.log(`   Active: ${templateRule.isActive ? 'Yes' : 'No'}`);
                
                if (!templateRule.isActive) {
                    console.log('   Activating rule...');
                    const toggleResponse = await fetch(`${API_URL}/automation/rules/${templateRule.id}/toggle`, {
                        method: 'POST'
                    });
                    const toggleData = await toggleResponse.json();
                    if (toggleData.success) {
                        console.log('   ✅ Rule activated!');
                    }
                }
            }
        }
        
        console.log('\n✅ Automation system is ready!');
        console.log('\nTest by sending messages like:');
        console.log('- #2026_9H_SBY_MED_JAN_FEB');
        console.log('- paket 9 hari surabaya');
        console.log('- sby januari');
        console.log('- 9h sby med');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

enableAutomation();