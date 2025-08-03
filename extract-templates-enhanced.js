const fs = require('fs').promises;
const path = require('path');
const { CustomTemplate } = require('./backend/whatsapp/src/models');
const logger = require('./backend/whatsapp/src/utils/logger');

// Based on comprehensive chat analysis
const TEMPLATE_PATTERNS = [
    // Greeting templates
    {
        name: 'Greeting - Full',
        category: 'greeting',
        intent: 'greeting',
        keywords: 'assalamualaikum,waalaikumsalam',
        content: `Assalamu 'alaikum
Terima kasih telah menghubungi Vauza Tamma Umroh, dengan senang hati kami akan memberikan informasi yang Bpk/Ibu butuhkan 😊🙏🏻`,
        priority: 100
    },
    {
        name: 'Greeting - Simple',
        category: 'greeting',
        intent: 'greeting',
        keywords: 'halo,hi,hello',
        content: `Assalamu 'alaikum Dengan kami admin Vauza Tamma Umroh Ada yang bisa kami bantu?
😊🙏 kami izin saya share info paket ya.`,
        priority: 95
    },
    
    // Package inquiry responses
    {
        name: 'Package 9H Qatar Airways',
        category: 'package',
        intent: 'inquiry_package',
        keywords: 'paket,9 hari,qatar',
        content: `Umroh new season 9 hari start Jakarta
harga Rp. 29.900.000 all in Termasuk :

•⁠  ⁠tiket pesawat PP starting Jakarta Landing Jeddah by Qatar Airways
Hotel Makkah :  Makah Tower (hotel pelataran masjid) 4 malam
Hotel Madinah : Durrat Al Eiman 3 malam
•  free kereta cepat⁠
•⁠  free city tour thaif
•⁠  ⁠makan 3x1 (fullboard economy buffet)
•⁠  ⁠visa umroh
•⁠  ⁠handling Saudi
•⁠  ⁠handling airport
•⁠  ⁠lounge
•⁠  perlengkapan umroh
•⁠  ⁠asuransi
•⁠  ⁠manasik 3x
•⁠  ⁠bagasi 25 kg
•  zamzam 5 Liter

NB : harga tertera adalah harga satu kamar ber-4 selama di Makkah dan Madinah

Harga upgrade untuk Makkah dan Madinah :
Double 4.500.000/pax
Triple 3.000.000/pax`,
        priority: 90
    },
    {
        name: 'Package 12H Saudia',
        category: 'package',
        intent: 'inquiry_package',
        keywords: 'paket,12 hari,saudia',
        content: `Umroh New Season 12 hari start Jakarta
Harga all in termasuk :

•⁠  ⁠tiket pesawat PP starting Jakarta by Saudia Airlines Landing Jeddah out Madinah
Hotel Makkah : {{hotel_makkah}} 5 malam
Hotel Madinah : {{hotel_madinah}} 5 malam
•⁠  ⁠free kereta cepat
•⁠  ⁠⁠free tour thaif
•⁠  ⁠makan 3x1 hari
•⁠  ⁠visa umroh
•⁠  full handling Saudi
•⁠  ⁠perlengkapan umroh
•⁠  ⁠handling airport
•⁠  ⁠lounge
•⁠  ⁠asuransi
•⁠  ⁠manasik 3x
•⁠  ⁠bagasi 46kg + zamzam 5 liter

NB : harga tertera adalah harga satu kamar ber-4 selama di Makkah dan Madinah

Tersedia pilihan Untuk upgrade kamar :
Silver
Double +4.500.000/pax
Triple +3.000.000/pax
—
Gold
Double +6.000.000/pax
Triple +4.000.000/pax
—
Platinum
Double +7.500.000/pax
Triple +5.000.000/pax`,
        priority: 90
    },
    
    // Price inquiry responses
    {
        name: 'Room Upgrade Info',
        category: 'faq',
        intent: 'inquiry_price',
        keywords: 'kamar berdua,double,triple,upgrade',
        content: `Harga upgrade untuk Makkah dan Madinah:

Double: {{double_price}}/pax
Triple: {{triple_price}}/pax

Harga tersebut sudah untuk Makkah dan Madinah Bapak/Ibu 🙏🏻`,
        priority: 85
    },
    
    // Hotel distance information
    {
        name: 'Hotel Distance Info',
        category: 'faq',
        intent: 'inquiry_facility',
        keywords: 'jarak hotel,berapa meter,plataran',
        content: `silver 
- Makkah (Grand Al Massa 300m ke plataran masjidil haram)
- ⁠Madinah (Durrat 100m ke pintu gerbang masjid nabawi) 

Gold
- ⁠Makkah (Rayyana 200m ke platarana masjidil haram)
- ⁠Madinah (Grand plaza 50m ke pintu gerbang masjid nabawi)

Platinum
- ⁠Makkah (Safwa tower, turun langsung plataran masjid)
- ⁠Madinah (Taiba front, turun langsung plataran masjid)`,
        priority: 85
    },
    
    // Registration requirements
    {
        name: 'Registration Requirements',
        category: 'document',
        intent: 'inquiry_document',
        keywords: 'syarat,daftar,dokumen,persyaratan',
        content: `syarat : 
1.⁠ ⁠mengisi klausul pendaftaran
2.⁠ ⁠⁠mengirim scan pasport (2 suku kata)
3.⁠ ⁠minimal masa berlaku atau expired 8 bulan terhitung dari bulan keberangkatan
4.⁠ ⁠⁠mengirim scan ktp
5.⁠ ⁠⁠foto setengah badan bebas (tidak menggunakan aksesoris spt kacamata/peci/topi dan soflen, menghadap ke kamera, tidak bermakeup tebal
6.⁠ ⁠⁠mengirim bukti transfer DP min 5.000.000/pax 
7.Pelunasan h-40 hari sebelum keberangkatan, atau DP hangus`,
        priority: 90
    },
    
    // Equipment list
    {
        name: 'Equipment List',
        category: 'faq',
        intent: 'inquiry_facility',
        keywords: 'perlengkapan,apa saja,dapat apa',
        content: `Perlengkapan umroh yang didapat:

koper bagasi 24inch
ihrom/mukena
slayer
id card
buku doa
seragam batik
Tas tenteng

Berikut Bapak/Ibu 🙏🏻`,
        priority: 85
    },
    
    // Office location
    {
        name: 'Office Location',
        category: 'faq',
        intent: 'general_question',
        keywords: 'kantor,alamat,dimana,lokasi',
        content: `Silahkan berkunjung ke kantor kami 👇🏻
Kami ada kantor pusat di kota Malang-Jawa Timur, dan kantor pemasaran di Jakarta dan Surabaya

Alamat kami ada di :
📍Jalan Kauman 21 Kota Malang - Jawa Timur
📍Jalan Kemang Timur no. 3F Kemang - Jakarta Selatan
📍 Royal Residence Cluster Crown Hill B15 No. 61, Lakarsantri – Surabaya
Buka setiap hari : 09.00 - 17.00 WIB

Info dan Reservasi : 
Admin 1 : +628 55555 44 000
Admin 2: +6281 33333 5123`,
        priority: 85
    },
    
    // Schedule inquiry
    {
        name: 'Schedule - Available',
        category: 'faq',
        intent: 'inquiry_schedule',
        keywords: 'jadwal,kapan,bulan,tanggal',
        content: `Berikut jadwal paket kami {{nama}} 🙏🏻

[Images akan dikirimkan]

Berkenan kami share paket yang mana?`,
        priority: 85
    },
    {
        name: 'Schedule - Not Available',
        category: 'faq',
        intent: 'inquiry_schedule',
        keywords: 'belum ada,tidak tersedia',
        content: `Mohon maaf Bapak/ibu saat ini paket di bulan {{month}} {{year}} blm available🙏🏻

jika sudah rilis segera kami infokan ya`,
        priority: 80
    },
    
    // Payment information
    {
        name: 'DP Information',
        category: 'faq',
        intent: 'inquiry_payment',
        keywords: 'dp,bayar,transfer,pelunasan',
        content: `Untuk DP minimal 5.000.000/pax
Pelunasan H-40 sebelum keberangkatan

Jika DP tidak dilunasi H-40, maka DP dianggap hangus

Berkenan untuk DP hari ini Bapak/Ibu? 🙏🏻`,
        priority: 85
    },
    
    // Closing templates
    {
        name: 'Closing - Study',
        category: 'followup',
        intent: 'general_question',
        keywords: 'pelajari,pikir,tanya keluarga',
        content: `Baik {{nama}}, kami tunggu kabar baiknya 😊🙏🏻

Jangan sungkan-sungkan jika ada yang ingin ditanyakan terkait paket umroh

Semoga Allah mudahkan`,
        priority: 80
    },
    {
        name: 'Closing - Thanks',
        category: 'followup',
        intent: 'thanks',
        keywords: 'terima kasih,makasih,jazakallah',
        content: `Sama-sama {{nama}} 🙏🏻

Semoga bisa segera berangkat ke tanah suci. Aamiin`,
        priority: 85
    },
    
    // Urgency templates
    {
        name: 'Seat Limited',
        category: 'followup',
        intent: 'booking_intent',
        keywords: 'seat,kursi,available',
        content: `Silahkan {{nama}}, sedang promo best price seat terbatas 😊🙏🏻`,
        priority: 75
    }
];

async function insertTemplates() {
    try {
        console.log('\n=== Inserting Enhanced Templates Based on Chat Analysis ===\n');
        
        let inserted = 0;
        let skipped = 0;
        
        for (const template of TEMPLATE_PATTERNS) {
            try {
                // Check if template already exists
                const existing = await CustomTemplate.findOne({
                    where: { templateName: template.name }
                });
                
                if (existing) {
                    console.log(`⚠️  Template already exists: ${template.name}`);
                    skipped++;
                    continue;
                }
                
                // Create new template
                await CustomTemplate.create({
                    templateName: template.name,
                    category: template.category,
                    intent: template.intent,
                    keywords: template.keywords,
                    templateContent: template.content,
                    priority: template.priority,
                    minConfidence: 0.7,
                    isActive: true,
                    usageCount: 0
                });
                
                console.log(`✅ Created template: ${template.name}`);
                inserted++;
                
            } catch (error) {
                console.error(`❌ Error creating template ${template.name}:`, error.message);
            }
        }
        
        console.log(`\n=== Summary ===`);
        console.log(`Total templates: ${TEMPLATE_PATTERNS.length}`);
        console.log(`Inserted: ${inserted}`);
        console.log(`Skipped: ${skipped}`);
        
        // Show current template stats
        const stats = await CustomTemplate.getStats();
        console.log('\nCurrent template statistics:');
        console.log(stats);
        
    } catch (error) {
        console.error('Error in template insertion:', error);
    }
}

// Helper function to analyze chat files for more patterns
async function analyzeChatFiles(directory) {
    try {
        console.log(`\n=== Analyzing Chat Files in ${directory} ===\n`);
        
        const entries = await fs.readdir(directory);
        const chatFiles = [];
        
        // Look for _chat.txt files in subdirectories
        for (const entry of entries) {
            const entryPath = path.join(directory, entry);
            const stat = await fs.stat(entryPath);
            
            if (stat.isDirectory()) {
                // Check inside subdirectory for _chat.txt
                const subFiles = await fs.readdir(entryPath);
                const chatFile = subFiles.find(f => f === '_chat.txt');
                if (chatFile) {
                    chatFiles.push(path.join(entryPath, chatFile));
                }
            }
        }
        
        console.log(`Found ${chatFiles.length} chat files`);
        
        // Pattern counters
        const patterns = {
            greetings: new Set(),
            questions: new Set(),
            responses: new Map(),
            keywords: new Map()
        };
        
        // Analyze first 10 files for demonstration
        for (let i = 0; i < Math.min(10, chatFiles.length); i++) {
            const filePath = chatFiles[i];
            const dirName = path.basename(path.dirname(filePath));
            console.log(`\nAnalyzing ${dirName}...`);
            
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            
            let isCSResponse = false;
            let currentMessage = '';
            
            for (const line of lines) {
                // Detect CS responses (looking for Vauza Tamma patterns)
                if (line.includes('Vauza Tamma Abadi:') || line.includes('Vauza Tamma:')) {
                    isCSResponse = true;
                    const splitPattern = line.includes('Vauza Tamma Abadi:') ? 'Vauza Tamma Abadi:' : 'Vauza Tamma:';
                    currentMessage = line.split(splitPattern)[1]?.trim() || '';
                } else if (line.includes(':') && !isCSResponse) {
                    // Customer message
                    const customerMsg = line.split(':').slice(1).join(':').trim();
                    
                    // Extract customer patterns
                    if (customerMsg.toLowerCase().includes('assalam')) {
                        patterns.greetings.add('Islamic greeting');
                    }
                    if (customerMsg.includes('?')) {
                        patterns.questions.add(customerMsg);
                    }
                } else if (isCSResponse && line.trim() && !line.includes(':')) {
                    // Continue CS message
                    currentMessage += '\n' + line;
                }
                
                // Reset when we hit a new message
                if (line.includes(':') && currentMessage) {
                    const key = currentMessage.substring(0, 50);
                    patterns.responses.set(key, (patterns.responses.get(key) || 0) + 1);
                    currentMessage = '';
                    isCSResponse = false;
                }
            }
        }
        
        // Show analysis results
        console.log('\n=== Pattern Analysis Results ===');
        console.log(`Unique greetings: ${patterns.greetings.size}`);
        console.log(`Unique questions: ${patterns.questions.size}`);
        console.log(`Common CS responses: ${patterns.responses.size}`);
        
        // Show top repeated responses
        console.log('\nTop 5 repeated CS responses:');
        const sortedResponses = Array.from(patterns.responses.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        sortedResponses.forEach(([response, count]) => {
            console.log(`[${count}x] ${response}...`);
        });
        
    } catch (error) {
        console.error('Error analyzing chat files:', error);
    }
}

// Main execution
async function main() {
    try {
        // First analyze some chat files from extracted directories
        const chatDir = path.join(__dirname, 'datasets', 'Wa export');
        
        // Check if we have extracted chat files
        const extractedFiles = await fs.readdir(chatDir);
        console.log('Files in datasets/Wa export:', extractedFiles.length);
        
        await analyzeChatFiles(chatDir);
        
        // Then insert templates
        await insertTemplates();
        
    } catch (error) {
        console.error('Main execution error:', error);
    } finally {
        process.exit(0);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { TEMPLATE_PATTERNS, insertTemplates };