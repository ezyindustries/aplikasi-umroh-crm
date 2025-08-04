const fs = require('fs').promises;
const path = require('path');

const API_URL = 'http://localhost:3003/api';
const PAKET_DIR = path.join(__dirname, 'paket');

// Helper function to generate keywords from package name
function generateKeywords(folderName) {
    const keywords = [];
    
    // Add full name with and without hashtag
    keywords.push(folderName);
    keywords.push(folderName.replace('#', ''));
    
    // Parse components from folder name
    // Format: #YEAR_DAYS_CITY_DETAILS
    const parts = folderName.replace('#', '').split('_');
    
    if (parts.length >= 3) {
        const year = parts[0];
        const days = parts[1];
        const city = parts[2];
        const details = parts.slice(3).join(' ');
        
        // Add component combinations
        keywords.push(`${days} ${city}`);
        keywords.push(`${city} ${details}`);
        keywords.push(`${days} ${city} ${details}`);
        
        // Add Indonesian variations
        const dayNum = days.replace('H', '');
        keywords.push(`${dayNum} hari`);
        keywords.push(`paket ${dayNum} hari`);
        
        // City variations
        const cityMap = {
            'JKT': ['jakarta', 'jkt'],
            'SBY': ['surabaya', 'sby'],
            'TUR': ['turki', 'turkey', 'tur', 'istanbul'],
            'DBX': ['dubai', 'dbx'],
            'DXB': ['dubai', 'dxb'],
            'DOH': ['doha', 'qatar', 'doh'],
            'JED': ['jeddah', 'jedah', 'jed'],
            'MED': ['madinah', 'medina', 'med']
        };
        
        if (cityMap[city]) {
            cityMap[city].forEach(variation => {
                keywords.push(variation);
                keywords.push(`${dayNum} hari ${variation}`);
                keywords.push(`paket ${variation}`);
            });
        }
        
        // Month variations
        const monthMap = {
            'JAN': ['januari', 'jan'],
            'FEB': ['februari', 'feb'],
            'MAR': ['maret', 'mar'],
            'APR': ['april', 'apr'],
            'MAY': ['mei', 'may'],
            'JUN': ['juni', 'jun'],
            'JUL': ['juli', 'jul'],
            'AGT': ['agustus', 'agt', 'aug'],
            'SEP': ['september', 'sep'],
            'OCT': ['oktober', 'oct', 'okt'],
            'NOV': ['november', 'nov'],
            'DEC': ['desember', 'dec', 'des']
        };
        
        // Check for month in details
        Object.keys(monthMap).forEach(month => {
            if (details.includes(month)) {
                monthMap[month].forEach(variation => {
                    keywords.push(variation);
                    keywords.push(`${variation} ${year}`);
                    keywords.push(`paket ${variation}`);
                });
            }
        });
        
        // Airline variations
        const airlineMap = {
            'GA': ['garuda', 'garuda indonesia', 'ga'],
            'SV': ['saudia', 'saudi airlines', 'sv'],
            'QR': ['qatar', 'qatar airways', 'qr'],
            'EK': ['emirates', 'ek'],
            'TK': ['turkish', 'turkish airlines', 'tk'],
            'WY': ['oman air', 'wy'],
            'QT': ['qatar', 'qt']
        };
        
        Object.keys(airlineMap).forEach(airline => {
            if (folderName.includes(airline)) {
                airlineMap[airline].forEach(variation => {
                    keywords.push(variation);
                    keywords.push(`paket ${variation}`);
                });
            }
        });
    }
    
    // Remove duplicates and join with comma
    return [...new Set(keywords)].join(', ').toLowerCase();
}

// Process single package folder
async function processPackageFolder(folderPath, folderName) {
    try {
        console.log(`\nProcessing package: ${folderName}`);
        
        // Read folder contents
        const files = await fs.readdir(folderPath);
        
        // Find text file and image files
        const txtFile = files.find(f => f.endsWith('.txt'));
        const imgFiles = files.filter(f => f.endsWith('.jpg')).sort();
        
        if (!txtFile) {
            console.log(`⚠️ No text file found in ${folderName}`);
            return null;
        }
        
        // Read text content
        const txtContent = await fs.readFile(path.join(folderPath, txtFile), 'utf-8');
        
        // Generate keywords
        const keywords = generateKeywords(folderName);
        
        // Prepare template data
        const templateData = {
            templateName: `Paket - ${folderName}`,
            category: 'package_info',
            templateContent: txtContent.trim(),
            keywords: keywords,
            intent: 'inquiry_package',
            minConfidence: 0.7,
            priority: 90,
            isActive: true,
            variables: {},
            // Store media paths for later processing
            mediaFiles: imgFiles.map(img => path.join(folderPath, img))
        };
        
        console.log(`✅ Prepared template with ${imgFiles.length} images`);
        console.log(`📝 Keywords: ${keywords.split(', ').slice(0, 5).join(', ')}...`);
        
        return templateData;
        
    } catch (error) {
        console.error(`❌ Error processing ${folderName}:`, error.message);
        return null;
    }
}

// Create template via API
async function createTemplate(templateData) {
    try {
        // For now, we'll create text-only templates
        // Media handling will be added later with proper upload mechanism
        const { mediaFiles, ...apiData } = templateData;
        
        const response = await fetch(`${API_URL}/templates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Created template: ${templateData.templateName}`);
            return data.data;
        } else {
            console.error(`❌ Failed to create template: ${data.error}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ API Error:`, error.message);
        return null;
    }
}

// Main function
async function generateAllTemplates() {
    try {
        console.log('🚀 Starting package template generation...');
        console.log(`📁 Scanning directory: ${PAKET_DIR}`);
        
        // Read all folders in paket directory
        const folders = await fs.readdir(PAKET_DIR);
        const packageFolders = [];
        
        // Filter only directories
        for (const folder of folders) {
            const folderPath = path.join(PAKET_DIR, folder);
            const stat = await fs.stat(folderPath);
            if (stat.isDirectory()) {
                packageFolders.push({ path: folderPath, name: folder });
            }
        }
        
        console.log(`📦 Found ${packageFolders.length} package folders`);
        
        // Process each package folder
        const templates = [];
        for (const { path: folderPath, name } of packageFolders) {
            const templateData = await processPackageFolder(folderPath, name);
            if (templateData) {
                templates.push(templateData);
            }
        }
        
        console.log(`\n📋 Prepared ${templates.length} templates`);
        
        // Confirm before creating
        console.log('\n⚡ Ready to create templates via API...');
        console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Create templates via API
        let successCount = 0;
        for (const template of templates) {
            const result = await createTemplate(template);
            if (result) {
                successCount++;
            }
            // Add small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`\n✅ Successfully created ${successCount}/${templates.length} templates`);
        
        // Save template data for reference
        const outputFile = path.join(__dirname, 'generated-templates.json');
        await fs.writeFile(outputFile, JSON.stringify(templates, null, 2));
        console.log(`📄 Template data saved to: ${outputFile}`);
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
    }
}

// Run the script
generateAllTemplates();