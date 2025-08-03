const IntentDetectionService = require('./backend/whatsapp/src/services/IntentDetectionService');
const EntityExtractionService = require('./backend/whatsapp/src/services/EntityExtractionService');
const { CustomTemplate } = require('./backend/whatsapp/src/models');

async function testAITemplateSystem() {
    console.log('=== Testing AI-Enhanced Template System ===\n');
    
    // Test messages
    const testCases = [
        {
            message: "Assalamualaikum, saya Pak Ahmad mau tanya paket umroh untuk 4 orang dari Surabaya",
            expectedIntent: "inquiry_package",
            expectedEntities: ["nama", "jumlah_orang", "kota"]
        },
        {
            message: "Berapa harga paket VIP bulan Ramadhan?",
            expectedIntent: "inquiry_price",
            expectedEntities: ["tipe_paket", "tanggal"]
        },
        {
            message: "Dokumen apa saja yang diperlukan untuk mendaftar umroh?",
            expectedIntent: "inquiry_document",
            expectedEntities: []
        },
        {
            message: "Saya complain hotel di Makkah terlalu jauh dari Masjidil Haram",
            expectedIntent: "complaint",
            expectedEntities: ["masalah"]
        },
        {
            message: "Jadwal keberangkatan bulan Februari 2025 ada?",
            expectedIntent: "inquiry_schedule",
            expectedEntities: ["tanggal"]
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n📨 Message: "${testCase.message}"`);
        console.log('─'.repeat(60));
        
        // Step 1: Intent Detection
        console.log('\n1️⃣ Intent Detection:');
        const intent = await IntentDetectionService.detectIntent(testCase.message);
        console.log(`   Intent: ${intent.intent} (confidence: ${intent.confidence})`);
        console.log(`   Reason: ${intent.reason}`);
        console.log(`   ✅ Expected: ${testCase.expectedIntent} ${intent.intent === testCase.expectedIntent ? '✓' : '✗'}`);
        
        // Step 2: Entity Extraction
        console.log('\n2️⃣ Entity Extraction:');
        const entities = await EntityExtractionService.extractEntities(testCase.message, intent.intent);
        console.log('   Extracted entities:');
        Object.entries(entities).forEach(([key, value]) => {
            console.log(`   - ${key}: "${value}"`);
        });
        
        // Check expected entities
        const extractedKeys = Object.keys(entities);
        const matchedEntities = testCase.expectedEntities.filter(e => extractedKeys.includes(e));
        console.log(`   ✅ Matched ${matchedEntities.length}/${testCase.expectedEntities.length} expected entities`);
        
        // Step 3: Template Matching
        console.log('\n3️⃣ Template Matching:');
        
        // Get suggested category from intent
        const suggestedCategory = IntentDetectionService.mapIntentToCategory(intent.intent);
        console.log(`   Suggested category: ${suggestedCategory || 'none'}`);
        
        // Find matching template
        const template = await CustomTemplate.findBestMatch(
            testCase.message,
            suggestedCategory,
            intent
        );
        
        if (template) {
            console.log(`   ✅ Found template: "${template.templateName}"`);
            console.log(`      Category: ${template.category}`);
            console.log(`      Priority: ${template.priority}`);
            if (template.intent) {
                console.log(`      AI Intent: ${template.intent}`);
            }
            
            // Step 4: Fill Template
            console.log('\n4️⃣ Template Filling:');
            const variables = EntityExtractionService.prepareTemplateVariables(entities, {
                nama: entities.nama || 'Bapak/Ibu'
            });
            
            const filledContent = template.fillTemplate(variables);
            console.log('   Response preview:');
            console.log('   ' + filledContent.substring(0, 150).replace(/\n/g, '\n   ') + '...');
            
        } else {
            console.log('   ❌ No template found');
            console.log('   Would fallback to LLM if enabled');
        }
    }
    
    // Test multiple intent detection
    console.log('\n\n=== Testing Multiple Intent Detection ===');
    const complexMessage = "Assalamualaikum, saya mau tanya harga paket umroh dan juga dokumen apa saja yang diperlukan";
    
    console.log(`\n📨 Complex Message: "${complexMessage}"`);
    const multiIntent = await IntentDetectionService.detectMultipleIntents(complexMessage);
    console.log('\nDetected intents:');
    multiIntent.intents.forEach(i => {
        console.log(`- ${i.intent} (confidence: ${i.confidence})`);
    });
    console.log(`Primary intent: ${multiIntent.primary}`);
    
    // Performance stats
    console.log('\n\n=== Performance Stats ===');
    console.log('Intent Detection Cache:', IntentDetectionService.getIntentStats());
    console.log('\n✨ AI-Enhanced Template System test complete!');
}

// Run the test
testAITemplateSystem()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });