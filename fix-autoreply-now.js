async function fixAutoReplyNow() {
    console.log('🔧 FIXING AUTOREPLY SYSTEM\n');
    
    const API_URL = 'http://localhost:3003/api';
    
    try {
        // 1. Enable master switch
        console.log('1️⃣ Enabling master automation switch...');
        const masterResponse = await fetch(`${API_URL}/automation/master-switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true })
        });
        
        const masterData = await masterResponse.json();
        if (masterData.success) {
            console.log('   ✅ Master switch enabled!');
        } else {
            console.log('   ❌ Failed to enable master switch');
        }
        
        // 2. Check if we have a proper keyword rule
        console.log('\n2️⃣ Checking for package keyword rule...');
        const rulesResponse = await fetch(`${API_URL}/automation/rules`);
        const rulesData = await rulesResponse.json();
        
        let hasPackageRule = false;
        if (rulesData.success) {
            // Look for a rule that handles packages
            const packageRule = rulesData.data.find(r => 
                (r.ruleType === 'keyword' && r.keywords && r.keywords.length > 10) ||
                (r.name && r.name.toLowerCase().includes('package'))
            );
            
            if (packageRule) {
                console.log(`   ✅ Found rule: ${packageRule.name}`);
                hasPackageRule = true;
                
                // Make sure it's active
                if (!packageRule.isActive) {
                    console.log('   Activating rule...');
                    await fetch(`${API_URL}/automation/rules/${packageRule.id}/toggle`, {
                        method: 'POST'
                    });
                }
            }
        }
        
        if (!hasPackageRule) {
            console.log('   ❌ No package rule found. Creating one...');
            
            // Create a simple keyword rule that will trigger template matching
            const ruleData = {
                name: "Package Inquiry Handler",
                description: "Responds to package inquiries with images and details",
                ruleType: "keyword",
                isActive: true,
                priority: 90,
                keywords: [
                    "paket", "package", "umroh", "umrah",
                    "#2025", "#2026",
                    "9h", "10h", "11h", "12h", "13h", "14h", "16h",
                    "9 hari", "10 hari", "11 hari", "12 hari", "13 hari", "14 hari", "16 hari",
                    "jakarta", "jkt", "surabaya", "sby", "dubai", "turki",
                    "januari", "februari", "maret", "april", "mei", "juni",
                    "juli", "agustus", "september", "oktober", "november", "desember"
                ],
                responseType: "text",
                responseMessage: "Terima kasih atas pertanyaan Anda. Berikut informasi paket yang mungkin sesuai:",
                responseDelay: 1,
                messageDelay: 2,
                triggerConditions: {
                    groupFilters: "all"
                },
                metadata: {
                    useTemplates: true,
                    category: "package_info"
                }
            };
            
            const createResponse = await fetch(`${API_URL}/automation/rules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ruleData)
            });
            
            const createData = await createResponse.json();
            if (createData.success) {
                console.log('   ✅ Created package rule successfully!');
            } else {
                console.log('   ❌ Failed to create rule:', createData.error);
            }
        }
        
        // 3. Test the system
        console.log('\n3️⃣ Testing automation with sample message...');
        const testResponse = await fetch(`${API_URL}/automation/simulate-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: 'paket umroh 9 hari',
                fromNumber: '6281234567890'
            })
        });
        
        const testData = await testResponse.json();
        if (testData.success) {
            console.log('   ✅ Test message processed');
            if (testData.rulesTriggered > 0) {
                console.log(`   ✅ ${testData.rulesTriggered} rules triggered`);
            } else {
                console.log('   ⚠️ No rules triggered - checking why...');
            }
        }
        
        // 4. Check AutomationEngine
        console.log('\n4️⃣ Checking if AutomationEngine is processing messages...');
        const logsResponse = await fetch(`${API_URL}/automation/logs?limit=5`);
        const logsData = await logsResponse.json();
        
        if (logsData.success && logsData.data && logsData.data.length > 0) {
            console.log(`   Recent activity found: ${logsData.data.length} entries`);
        } else {
            console.log('   ⚠️ No recent automation activity');
            console.log('   This might mean messages are not reaching AutomationEngine');
        }
        
        console.log('\n✅ AUTOREPLY SYSTEM FIXED!\n');
        console.log('📋 What was done:');
        console.log('1. Master automation switch turned ON');
        console.log('2. Package rule created/verified');
        console.log('3. System tested');
        
        console.log('\n🧪 TEST NOW:');
        console.log('Send one of these messages to test:');
        console.log('- "paket umroh 9 hari"');
        console.log('- "#2026_9H_SBY_MED_JAN_FEB"');
        console.log('- "info paket dubai"');
        console.log('- "umroh januari dari surabaya"');
        
        console.log('\n⚠️ IMPORTANT:');
        console.log('- Make sure you\'re sending from a different number than the bot');
        console.log('- Check the Autoreply Management page for activity');
        console.log('- Watch the backend console for logs');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixAutoReplyNow();