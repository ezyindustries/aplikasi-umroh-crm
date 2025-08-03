// Direct test templates
const { CustomTemplate } = require('./backend/whatsapp/src/models');

async function testTemplates() {
    console.log('Testing CustomTemplate model directly...\n');
    
    try {
        // Test 1: Count templates
        const count = await CustomTemplate.count();
        console.log(`✅ Total templates in database: ${count}`);
        
        // Test 2: Get all templates
        const templates = await CustomTemplate.findAll({
            limit: 5,
            order: [['priority', 'DESC']]
        });
        
        console.log('\n📋 Sample templates:');
        templates.forEach(t => {
            console.log(`- ${t.name} (${t.category}) - Priority: ${t.priority}`);
        });
        
        // Test 3: Get categories
        const categories = await CustomTemplate.findAll({
            attributes: ['category'],
            group: ['category']
        });
        
        console.log('\n📂 Available categories:');
        categories.forEach(c => {
            console.log(`- ${c.category}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

// Wait for DB connection
setTimeout(testTemplates, 1000);