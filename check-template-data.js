const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/whatsapp/data/whatsapp-crm.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        return;
    }
    
    console.log('🔍 Checking template data in database...\n');
    
    // Check a specific template
    db.get(
        "SELECT id, template_name, media_files FROM custom_templates WHERE template_name = 'Paket - #2025_10H_DBX_SEP07'",
        (err, row) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
            
            if (row) {
                console.log('Template found:');
                console.log(`  ID: ${row.id}`);
                console.log(`  Name: ${row.template_name}`);
                console.log(`  Media files (raw): ${row.media_files}`);
                console.log(`  Media files type: ${typeof row.media_files}`);
                
                try {
                    const parsed = JSON.parse(row.media_files);
                    console.log(`  Parsed media files: ${parsed.length} files`);
                    if (parsed.length > 0) {
                        console.log(`  First file: ${parsed[0]}`);
                    }
                } catch (e) {
                    console.error('  Error parsing media_files:', e.message);
                }
            }
            
            db.close();
        }
    );
});