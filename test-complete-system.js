const IntentDetectionService = require('./backend/whatsapp/src/services/IntentDetectionService');
const EntityExtractionService = require('./backend/whatsapp/src/services/EntityExtractionService');
const { CustomTemplate } = require('./backend/whatsapp/src/models');
const AutomationEngine = require('./backend/whatsapp/src/services/AutomationEngine');

// Test messages based on real chat patterns
const testMessages = [
    {
        message: "Assalamualaikum, mau tanya paket umroh bulan desember ada?",
        context: { from: "628123456789", name: "Ibu Siti" }
    },
    {
        message: "Berapa harga paket 9 hari? Kalau sekamar berdua tambah berapa?",
        context: { from: "628123456789", name: "Pak Ahmad" }
    },
    {
        message: "Hotel nya berapa meter dari masjid?",
        context: { from: "628123456789", name: "Ibu Fatimah" }
    },
    {
        message: "Perlengkapan dapat apa saja ya?",
        context: { from: "628123456789", name: "Pak Umar" }
    },
    {
        message: "Syarat pendaftaran apa saja? Saya mau daftar untuk 4 orang",
        context: { from: "628123456789", name: "Ibu Aisyah" }
    },
    {
        message: "Alamat kantor dimana ya?",
        context: { from: "628123456789", name: "Pak Ali" }
    },
    {
        message: "Terima kasih infonya, saya pikir-pikir dulu",
        context: { from: "628123456789", name: "Ibu Khadijah" }
    }
];

async function testCompleteSystem() {
    console.log('=== Testing Complete WhatsApp Auto-Reply System ===\n');
    
    for (const test of testMessages) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📨 Customer (${test.context.name}): "${test.message}"`);
        console.log(`${'='.repeat(80)}\n`);
        
        try {
            // Step 1: Detect Intent
            console.log('🤔 STEP 1: Intent Detection');
            const intentResult = await IntentDetectionService.detectIntent(test.message);
            console.log(`   Intent: ${intentResult.intent} (confidence: ${intentResult.confidence})`);
            console.log(`   Reason: ${intentResult.reason || 'N/A'}`);
            
            // Step 2: Extract Entities
            console.log('\n🔍 STEP 2: Entity Extraction');
            const entities = await EntityExtractionService.extractEntities(test.message, intentResult.intent);
            console.log('   Entities found:');
            if (Object.keys(entities).length === 0) {
                console.log('   - None');
            } else {
                Object.entries(entities).forEach(([key, value]) => {
                    console.log(`   - ${key}: "${value}"`);
                });
            }
            
            // Step 3: Map Intent to Category
            console.log('\n🗺️  STEP 3: Category Mapping');
            const category = IntentDetectionService.mapIntentToCategory(intentResult.intent);
            console.log(`   Intent "${intentResult.intent}" → Category "${category || 'none'}"`);
            
            // Step 4: Find Matching Template
            console.log('\n📝 STEP 4: Template Matching');
            const template = await CustomTemplate.findBestMatch(
                test.message,
                category,
                intentResult
            );
            
            if (template) {
                console.log(`   ✅ Found template: "${template.templateName}"`);
                console.log(`   Category: ${template.category}`);
                console.log(`   Priority: ${template.priority}`);
                console.log(`   Match type: ${template.intent === intentResult.intent ? 'Intent-based' : 'Keyword-based'}`);
                
                // Step 5: Fill Template
                console.log('\n🔧 STEP 5: Template Filling');
                const variables = EntityExtractionService.prepareTemplateVariables(entities, {
                    nama: test.context.name,
                    phoneNumber: test.context.from,
                    ...entities
                });
                
                console.log('   Variables:');
                Object.entries(variables).forEach(([key, value]) => {
                    if (value) console.log(`   - ${key}: "${value}"`);
                });
                
                const response = template.fillTemplate(variables);
                
                // Show the response
                console.log('\n📤 CS RESPONSE:');
                console.log('-'.repeat(60));
                response.split('\n').forEach(line => {
                    console.log(`   ${line}`);
                });
                console.log('-'.repeat(60));
                
            } else {
                console.log('   ❌ No template found');
                console.log('\n🤖 Fallback to LLM response would be triggered');
            }
            
        } catch (error) {
            console.error('\n❌ Error:', error.message);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Show system statistics
    console.log('\n\n=== System Statistics ===');
    
    // Template stats
    const templateCount = await CustomTemplate.count();
    const activeTemplates = await CustomTemplate.count({ where: { isActive: true } });
    console.log(`\n📊 Template Statistics:`);
    console.log(`   Total templates: ${templateCount}`);
    console.log(`   Active templates: ${activeTemplates}`);
    
    // Intent stats
    const intentStats = IntentDetectionService.getIntentStats();
    console.log(`\n🤔 Intent Detection:`);
    console.log(`   Available intents: ${intentStats.availableIntents}`);
    console.log(`   Cache size: ${intentStats.cacheSize}`);
    
    console.log('\n✨ Complete system test finished!');
}

// Test automation rule execution
async function testAutomationRule() {
    console.log('\n\n=== Testing Automation Rule Execution ===\n');
    
    const testMessage = {
        from: '628123456789',
        body: 'Assalamualaikum, saya Pak Budi dari Surabaya mau tanya harga paket umroh 12 hari',
        type: 'chat',
        timestamp: new Date()
    };
    
    console.log(`📨 Incoming message: "${testMessage.body}"`);
    console.log(`From: ${testMessage.from}\n`);
    
    try {
        // Find matching rules
        const rules = await AutomationEngine.findMatchingRules(testMessage);
        console.log(`Found ${rules.length} matching rule(s)`);
        
        if (rules.length > 0) {
            const rule = rules[0];
            console.log(`\n🔄 Executing rule: "${rule.ruleName}"`);
            
            // Process with template system
            const response = await AutomationEngine.sendTemplateBasedResponse(
                rule,
                testMessage,
                { contactName: 'Pak Budi' }
            );
            
            if (response.success) {
                console.log('\n✅ Response sent successfully!');
                console.log('\n📤 Final Response:');
                console.log('='.repeat(60));
                response.response.split('\n').forEach(line => {
                    console.log(line);
                });
                console.log('='.repeat(60));
            }
        }
        
    } catch (error) {
        console.error('Error in automation test:', error);
    }
}

// Main execution
async function main() {
    try {
        // Test the complete system
        await testCompleteSystem();
        
        // Test automation rule
        await testAutomationRule();
        
    } catch (error) {
        console.error('Main execution error:', error);
    } finally {
        process.exit(0);
    }
}

// Run the tests
if (require.main === module) {
    main();
}

module.exports = { testCompleteSystem, testAutomationRule };