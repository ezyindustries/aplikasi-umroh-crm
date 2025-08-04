async function testTemplateFetch() {
    console.log('🧪 Testing template fetch after adding media_files column...\n');
    
    try {
        // Test fetching templates
        const response = await fetch('http://localhost:3003/api/templates?category=package_info');
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Successfully fetched ${data.data.length} templates`);
            
            // Show first template with media files
            const firstWithMedia = data.data.find(t => t.mediaFiles && t.mediaFiles.length > 0);
            if (firstWithMedia) {
                console.log('\n📋 Sample template with media:');
                console.log(`  Name: ${firstWithMedia.templateName}`);
                console.log(`  Media files: ${firstWithMedia.mediaFiles.length}`);
                console.log(`  First media: ${firstWithMedia.mediaFiles[0]}`);
            }
        } else {
            console.error('❌ Failed to fetch templates:', data.error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testTemplateFetch();