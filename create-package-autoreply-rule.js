const API_URL = 'http://localhost:3003/api';

async function createPackageAutoReplyRule() {
    try {
        // Check existing rules
        console.log('🔍 Checking existing rules...');
        const checkResponse = await fetch(`${API_URL}/automation/rules`);
        const checkData = await checkResponse.json();
        
        if (checkData.success) {
            const existingRule = checkData.data.find(r => 
                r.name === "Package Inquiry Auto Response" || 
                r.name === "Smart Package Response"
            );
            
            if (existingRule) {
                console.log(`✅ Rule already exists: ${existingRule.name}`);
                console.log(`   Type: ${existingRule.ruleType}`);
                console.log(`   Active: ${existingRule.isActive ? 'Yes' : 'No'}`);
                
                if (!existingRule.isActive) {
                    console.log('   Activating rule...');
                    const toggleResponse = await fetch(`${API_URL}/automation/rules/${existingRule.id}/toggle`, {
                        method: 'POST'
                    });
                    const toggleData = await toggleResponse.json();
                    console.log(toggleData.success ? '   ✅ Rule activated!' : '   ❌ Failed to activate');
                }
                return;
            }
        }
        
        // Create new keyword rule with template matching
        console.log('\n📝 Creating package autoreply rule...');
        
        const ruleData = {
            name: "Package Inquiry Auto Response",
            description: "Responds with package details and images when customers ask about specific packages",
            ruleType: "keyword", // Using keyword type but with template matching
            isActive: true,
            priority: 85,
            keywords: [
                // Common package keywords
                "paket", "package", "umroh", "umrah",
                "9 hari", "10 hari", "11 hari", "12 hari", "13 hari", "14 hari", "16 hari",
                "9h", "10h", "11h", "12h", "13h", "14h", "16h",
                // Cities
                "jakarta", "jkt", "surabaya", "sby", 
                "dubai", "dbx", "dxb", "turki", "turkey", "istanbul",
                "doha", "qatar", "jeddah", "jedah", "madinah", "medina",
                // Months
                "januari", "februari", "maret", "april", "mei", "juni",
                "juli", "agustus", "september", "oktober", "november", "desember",
                "jan", "feb", "mar", "apr", "may", "jun",
                "jul", "agt", "aug", "sep", "oct", "okt", "nov", "dec", "des",
                // Airlines
                "garuda", "saudia", "qatar", "emirates", "turkish",
                "ga", "sv", "qr", "ek", "tk",
                // Specific package codes
                "#2025", "#2026"
            ],
            triggerConditions: {
                groupFilters: "all",
                templateCategory: "package_info",
                useTemplateMatching: true,
                fallbackToLLM: false
            },
            templateId: null,
            responseType: "text",
            responseMessage: "Terima kasih atas pertanyaan Anda tentang paket umroh. Berikut detail paket yang sesuai:",
            responseDelay: 1,
            messageDelay: 2,
            maxTriggersPerContact: 0,
            cooldownMinutes: 0,
            contactConditions: {},
            metadata: {
                category: "package_info",
                useTemplates: true,
                sendMedia: true
            }
        };
        
        // Try JSON body first
        const response = await fetch(`${API_URL}/automation/rules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ruleData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('\n✅ Successfully created rule!');
            console.log(`   Rule ID: ${result.data.id}`);
            console.log(`   Name: ${result.data.name}`);
            console.log(`   Type: ${result.data.ruleType}`);
            console.log(`   Priority: ${result.data.priority}`);
            console.log(`   Status: ${result.data.isActive ? 'Active' : 'Inactive'}`);
            console.log(`   Keywords: ${result.data.keywords.length} keywords configured`);
            
            console.log('\n📋 How it works:');
            console.log('1. Customer sends message with package keyword');
            console.log('2. System matches keyword and finds appropriate template');
            console.log('3. Sends package images (3-5 photos)');
            console.log('4. Sends package details text');
            
            console.log('\n🧪 Test with messages like:');
            console.log('- "paket dubai 10 hari"');
            console.log('- "#2026_9H_SBY_MED_JAN_FEB"');
            console.log('- "umroh september dari jakarta"');
            console.log('- "paket 12 hari turki"');
            
        } else {
            console.error('❌ Failed to create rule:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the script
createPackageAutoReplyRule();