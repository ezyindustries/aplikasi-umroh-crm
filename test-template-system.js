const { CustomTemplate } = require('./backend/whatsapp/src/models');

async function testTemplateSystem() {
    console.log('=== Testing Template System ===\n');
    
    // 1. Create test templates
    console.log('1. Creating test templates...');
    
    const testTemplates = [
        {
            templateName: 'Greeting - Assalamualaikum',
            category: 'greeting',
            templateContent: 'Assalamualaikum {{nama}} 😊\n\nTerima kasih telah menghubungi Vauza Tamma Abadi. Perkenalkan, saya Admin yang akan membantu Bapak/Ibu hari ini.\n\nAda yang bisa saya bantu terkait paket umroh kami? 🙏🏻',
            keywords: 'assalamualaikum, salam, halo, hai',
            priority: 100
        },
        {
            templateName: 'Package Info - Basic',
            category: 'package',
            templateContent: 'Baik {{nama}}, untuk paket umroh kami saat ini:\n\n📋 *PAKET REGULER 12 HARI*\n💰 Harga: Rp 28.5 juta/orang\n🏨 Hotel: Bintang 4 (Makkah & Madinah)\n✈️ Pesawat: Garuda Indonesia Direct Flight\n\n📋 *PAKET VIP 9 HARI*\n💰 Harga: Rp 35 juta/orang\n🏨 Hotel: Bintang 5 dekat Masjid\n✈️ Pesawat: Saudi Airlines\n\nSilakan pilih paket yang sesuai dengan kebutuhan Bapak/Ibu 😊',
            keywords: 'paket, harga, biaya, berapa, hotel',
            priority: 90
        },
        {
            templateName: 'Document Requirements',
            category: 'document',
            templateContent: 'Untuk persyaratan dokumen umroh:\n\n📄 *Dokumen Wajib:*\n1. Paspor (masa berlaku min. 7 bulan)\n2. KTP\n3. Kartu Keluarga\n4. Akte Nikah/Cerai/Kematian\n5. Pas foto 4x6 (6 lembar)\n\n💉 *Kesehatan:*\n- Vaksin Meningitis (wajib)\n- Vaksin COVID-19 (dosis lengkap)\n\nAda dokumen yang ingin ditanyakan lebih lanjut, {{nama}}? 😊',
            keywords: 'dokumen, syarat, persyaratan, paspor, vaksin',
            priority: 85
        }
    ];
    
    // Create templates
    for (const template of testTemplates) {
        try {
            await CustomTemplate.create(template);
            console.log(`✅ Created: ${template.templateName}`);
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                console.log(`⚠️  Template already exists: ${template.templateName}`);
            } else {
                console.error(`❌ Error creating template: ${error.message}`);
            }
        }
    }
    
    // 2. Test template matching
    console.log('\n2. Testing template matching...');
    
    const testMessages = [
        'Assalamualaikum, saya mau tanya paket umroh',
        'Berapa harga paket umroh yang ada?',
        'Apa saja syarat dokumen untuk umroh?',
        'Saya butuh info tentang jadwal keberangkatan'
    ];
    
    for (const message of testMessages) {
        console.log(`\n📨 Message: "${message}"`);
        
        const template = await CustomTemplate.findBestMatch(message);
        
        if (template) {
            console.log(`✅ Matched: ${template.templateName} (${template.category})`);
            
            // Test filling template
            const filled = template.fillTemplate({
                nama: 'Pak Ahmad',
                tanggal: new Date().toLocaleDateString('id-ID')
            });
            
            console.log(`📝 Response preview:`);
            console.log(filled.substring(0, 100) + '...');
        } else {
            console.log('❌ No template matched');
        }
    }
    
    // 3. Test category filtering
    console.log('\n3. Testing category filtering...');
    
    const categories = ['greeting', 'package', 'document'];
    
    for (const category of categories) {
        const templates = await CustomTemplate.getByCategory(category);
        console.log(`\n📁 Category: ${category}`);
        console.log(`   Found ${templates.length} templates`);
        
        templates.forEach(t => {
            console.log(`   - ${t.templateName}`);
        });
    }
    
    // 4. Show statistics
    console.log('\n4. Template Statistics:');
    
    const totalTemplates = await CustomTemplate.count();
    const activeTemplates = await CustomTemplate.count({ where: { isActive: true } });
    
    console.log(`📊 Total templates: ${totalTemplates}`);
    console.log(`✅ Active templates: ${activeTemplates}`);
    
    console.log('\n✨ Template system test complete!');
}

// Run the test
testTemplateSystem()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });