// Create a template-based rule for package inquiry

const API_URL = 'http://localhost:3003/api';

async function createPackageRule() {
    try {
        const ruleData = {
            name: "Smart Package Response",
            description: "Automatically respond with package details based on keywords",
            ruleType: "template",
            isActive: true,
            priority: 85, // Higher than general responses but lower than greetings
            keywords: [], // Empty because we'll use template keywords
            triggerConditions: {
                groupFilters: "all"
            },
            templateId: null, // Will be matched dynamically
            responseType: "single",
            responseDelay: 1,
            messageDelay: 1,
            maxTriggersPerContact: 0,
            cooldownMinutes: 0,
            contactConditions: {},
            metadata: {
                category: "package_info",
                dynamicTemplateSelection: true
            }
        };
        
        console.log('Creating template-based rule for package inquiries...');
        
        const response = await fetch(`${API_URL}/automation/rules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ruleData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Successfully created rule:', result.data.name);
            console.log('Rule ID:', result.data.id);
            console.log('Priority:', result.data.priority);
            console.log('Status:', result.data.isActive ? 'Active' : 'Inactive');
        } else {
            console.error('❌ Failed to create rule:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the script
createPackageRule();