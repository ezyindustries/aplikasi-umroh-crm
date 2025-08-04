const fs = require('fs').promises;
const path = require('path');

const API_URL = 'http://localhost:3003/api';
const PAKET_DIR = path.join(__dirname, 'paket');

// Helper function to extract package name from template name
function extractPackageName(templateName) {
    // Template format: "Paket - #2025_10H_DBX_SEP07"
    const match = templateName.match(/Paket - (.+)/);
    return match ? match[1] : null;
}

// Get media files for a package
async function getPackageMediaFiles(packageName) {
    try {
        const packagePath = path.join(PAKET_DIR, packageName);
        const files = await fs.readdir(packagePath);
        
        // Find all jpg files and sort them
        const jpgFiles = files
            .filter(f => f.endsWith('.jpg'))
            .sort()
            .map(f => path.join(packagePath, f));
        
        return jpgFiles;
    } catch (error) {
        console.error(`Error reading package folder ${packageName}:`, error.message);
        return [];
    }
}

// Update template with media files
async function updateTemplateMedia(template) {
    try {
        const packageName = extractPackageName(template.templateName);
        if (!packageName) {
            console.log(`⚠️ Could not extract package name from: ${template.templateName}`);
            return false;
        }
        
        const mediaFiles = await getPackageMediaFiles(packageName);
        
        if (mediaFiles.length === 0) {
            console.log(`⚠️ No media files found for: ${packageName}`);
            return false;
        }
        
        console.log(`📸 Found ${mediaFiles.length} media files for ${packageName}`);
        
        // Update template via API
        const response = await fetch(`${API_URL}/templates/${template.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mediaFiles: mediaFiles
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Updated template: ${template.templateName} with ${mediaFiles.length} media files`);
            return true;
        } else {
            console.error(`❌ Failed to update template: ${result.error}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error updating template ${template.id}:`, error.message);
        return false;
    }
}

// Main function
async function updateAllTemplatesWithMedia() {
    try {
        console.log('🚀 Starting template media update...');
        
        // Get all templates with category 'package_info'
        const response = await fetch(`${API_URL}/templates?category=package_info`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to fetch templates');
        }
        
        const templates = data.data;
        console.log(`📋 Found ${templates.length} package templates to update`);
        
        if (templates.length === 0) {
            console.log('No package templates found. Make sure you have created the templates first.');
            return;
        }
        
        // Update each template
        let successCount = 0;
        for (const template of templates) {
            const success = await updateTemplateMedia(template);
            if (success) {
                successCount++;
            }
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`\n✅ Successfully updated ${successCount}/${templates.length} templates with media files`);
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
    }
}

// Run the script
updateAllTemplatesWithMedia();