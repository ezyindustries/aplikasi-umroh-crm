const API_URL = 'http://localhost:3003/api';

async function createTemplateRule() {
    try {
        // First check if rule already exists
        console.log('Checking existing rules...');
        const checkResponse = await fetch(`${API_URL}/automation/rules`);
        const checkData = await checkResponse.json();
        
        if (checkData.success) {
            const existingRule = checkData.data.find(r => 
                r.name === "Smart Package Response" || 
                (r.ruleType === "template" && r.metadata?.category === "package_info")
            );
            
            if (existingRule) {
                console.log(`Rule already exists: ${existingRule.name}`);
                
                // Activate it if inactive
                if (!existingRule.isActive) {
                    console.log('Activating rule...');
                    const toggleResponse = await fetch(`${API_URL}/automation/rules/${existingRule.id}/toggle`, {
                        method: 'POST'
                    });
                    const toggleData = await toggleResponse.json();
                    console.log(toggleData.success ? '✅ Rule activated!' : '❌ Failed to activate');
                }
                return;
            }
        }
        
        // Create new rule
        console.log('Creating new template-based rule...');
        
        const ruleData = {
            name: "Smart Package Response",
            description: "Automatically respond with package details based on keywords",
            ruleType: "template",
            isActive: true,
            priority: 85,
            keywords: [], // Empty for template-based matching
            triggerConditions: {
                groupFilters: "all",
                templateCategory: "package_info",
                useIntentDetection: true
            },
            templateId: null,
            responseType: "template",
            responseMessage: "",
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
        
        // Send as FormData since the controller expects it
        const formData = new FormData();
        formData.append('ruleData', JSON.stringify(ruleData));
        
        const response = await fetch(`${API_URL}/automation/rules`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Successfully created rule:', result.data.name);
            console.log('Rule ID:', result.data.id);
            console.log('Priority:', result.data.priority);
            console.log('Status:', result.data.isActive ? 'Active' : 'Inactive');
        } else {
            console.error('❌ Failed to create rule:', result.error);
            
            // Try with simple JSON body
            console.log('\nTrying with JSON body...');
            const jsonResponse = await fetch(`${API_URL}/automation/rules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ruleData)
            });
            
            const jsonResult = await jsonResponse.json();
            if (jsonResult.success) {
                console.log('✅ Successfully created rule with JSON!');
            } else {
                console.error('❌ JSON also failed:', jsonResult.error);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the script
createTemplateRule();