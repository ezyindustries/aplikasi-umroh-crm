const fs = require('fs').promises;
const path = require('path');
const { sequelize, CustomTemplate } = require('./backend/whatsapp/src/models');
const logger = require('./backend/whatsapp/src/utils/logger');

// Patterns for detecting CS responses
const CS_PATTERNS = {
    greeting: [
        /assalamualaikum/i,
        /terima kasih telah menghubungi/i,
        /selamat (pagi|siang|sore|malam)/i,
        /ada yang bisa.*bantu/i
    ],
    package: [
        /paket.*umroh/i,
        /harga.*paket/i,
        /fasilitas.*hotel/i,
        /keberangkatan/i,
        /jadwal.*umroh/i
    ],
    faq: [
        /syarat.*umroh/i,
        /dokumen.*diperlukan/i,
        /vaksin/i,
        /visa/i,
        /pembayaran/i
    ],
    followup: [
        /ada.*pertanyaan.*lain/i,
        /jangan.*sungkan/i,
        /silakan.*hubungi/i,
        /terima.*kasih/i
    ],
    document: [
        /paspor/i,
        /ktp/i,
        /kartu.*keluarga/i,
        /surat.*nikah/i,
        /akte/i
    ]
};

// Extract templates from chat files
async function extractTemplatesFromChats(directory) {
    const templates = new Map(); // Use map to avoid duplicates
    const files = await fs.readdir(directory);
    
    logger.info(`Found ${files.length} chat files to analyze`);
    
    for (const file of files) {
        if (!file.endsWith('.txt')) continue;
        
        try {
            const content = await fs.readFile(path.join(directory, file), 'utf-8');
            const lines = content.split('\n');
            
            // Track CS messages
            const csMessages = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Look for CS messages (Vauza Tamma Abadi)
                if (line.includes('Vauza Tamma Abadi:')) {
                    const messageMatch = line.match(/Vauza Tamma Abadi:\s*(.+)/);
                    if (messageMatch) {
                        let message = messageMatch[1].trim();
                        
                        // Check if message continues on next lines
                        let j = i + 1;
                        while (j < lines.length && !lines[j].includes(':') && lines[j].trim() !== '') {
                            message += ' ' + lines[j].trim();
                            j++;
                        }
                        
                        // Only consider substantial messages
                        if (message.length > 50) {
                            csMessages.push(message);
                        }
                    }
                }
            }
            
            // Analyze CS messages for patterns
            for (const message of csMessages) {
                const category = detectCategory(message);
                const key = normalizeMessage(message);
                
                if (!templates.has(key)) {
                    templates.set(key, {
                        content: message,
                        category: category,
                        count: 1,
                        keywords: extractKeywords(message)
                    });
                } else {
                    templates.get(key).count++;
                }
            }
            
        } catch (error) {
            logger.error(`Error processing file ${file}:`, error);
        }
    }
    
    // Convert to array and filter by frequency
    const templateArray = Array.from(templates.values())
        .filter(t => t.count >= 3) // Only templates used 3+ times
        .sort((a, b) => b.count - a.count);
    
    logger.info(`Extracted ${templateArray.length} unique templates`);
    
    return templateArray;
}

// Detect category based on content
function detectCategory(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const [category, patterns] of Object.entries(CS_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(lowerMessage)) {
                return category;
            }
        }
    }
    
    return 'faq'; // Default category
}

// Normalize message for comparison
function normalizeMessage(message) {
    return message
        .toLowerCase()
        .replace(/\b(bapak|ibu|pak|bu)\s+\w+/gi, '{{nama}}') // Replace names
        .replace(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g, '{{tanggal}}') // Replace dates
        .replace(/\d{1,2}:\d{2}/g, '{{waktu}}') // Replace times
        .replace(/rp\.?\s*\d+[.,]?\d*\s*(juta|jt|ribu|rb)?/gi, '{{harga}}') // Replace prices
        .replace(/\b\d+\s*(orang|pax|jamaah)/gi, '{{jumlah_orang}}') // Replace quantities
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
}

// Extract keywords from message
function extractKeywords(message) {
    const keywords = [];
    const lowerMessage = message.toLowerCase();
    
    // Common keywords to look for
    const keywordPatterns = [
        'paket', 'harga', 'jadwal', 'syarat', 'dokumen',
        'hotel', 'visa', 'paspor', 'pembayaran', 'keberangkatan',
        'fasilitas', 'penerbangan', 'asuransi', 'vaksin'
    ];
    
    for (const keyword of keywordPatterns) {
        if (lowerMessage.includes(keyword)) {
            keywords.push(keyword);
        }
    }
    
    return keywords.join(', ');
}

// Import templates to database
async function importToDatabase(templates) {
    let imported = 0;
    
    for (const template of templates) {
        try {
            // Check if similar template already exists
            const existing = await CustomTemplate.findOne({
                where: {
                    templateContent: template.content
                }
            });
            
            if (!existing) {
                await CustomTemplate.create({
                    templateName: `Auto-imported #${imported + 1}`,
                    category: template.category,
                    templateContent: template.content,
                    keywords: template.keywords,
                    priority: Math.min(template.count * 10, 100), // Higher count = higher priority
                    usageCount: template.count
                });
                
                imported++;
                logger.info(`Imported template: ${template.content.substring(0, 50)}...`);
            }
        } catch (error) {
            logger.error('Error importing template:', error);
        }
    }
    
    logger.info(`Successfully imported ${imported} templates`);
    return imported;
}

// Main function
async function main() {
    try {
        console.log('=== Template Extraction Tool ===');
        console.log('Analyzing chat history files...\n');
        
        const chatDirectory = path.join(__dirname, 'datasets');
        
        // Extract templates
        const templates = await extractTemplatesFromChats(chatDirectory);
        
        console.log(`\nFound ${templates.length} frequently used templates`);
        
        // Show top 10 templates
        console.log('\nTop 10 most frequent templates:');
        templates.slice(0, 10).forEach((t, i) => {
            console.log(`\n${i + 1}. Category: ${t.category} (Used ${t.count} times)`);
            console.log(`   Content: ${t.content.substring(0, 100)}...`);
            console.log(`   Keywords: ${t.keywords || 'none'}`);
        });
        
        // Ask for confirmation to import
        console.log('\nPress Enter to import these templates to database, or Ctrl+C to cancel...');
        
        await new Promise(resolve => {
            process.stdin.once('data', resolve);
        });
        
        // Import to database
        const imported = await importToDatabase(templates);
        
        console.log(`\n✅ Import complete! Added ${imported} new templates.`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { extractTemplatesFromChats, detectCategory, normalizeMessage };