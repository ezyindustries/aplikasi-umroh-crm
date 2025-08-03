const { sequelize } = require('./backend/whatsapp/src/models');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function syncIntentFields() {
  try {
    console.log('🔄 Syncing database to add intent fields...\n');
    
    // Run migration
    const migrationPath = path.join(__dirname, 'backend', 'whatsapp', 'src', 'migrations', 'add-intent-to-templates.js');
    
    console.log('Running migration to add intent fields...');
    
    // For SQLite, we'll run the migration manually
    const migration = require(migrationPath);
    const queryInterface = sequelize.getQueryInterface();
    
    try {
      await migration.up(queryInterface, sequelize.constructor);
      console.log('✅ Migration completed successfully!');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  Columns already exist, skipping migration');
      } else {
        throw error;
      }
    }
    
    console.log('\n✨ Database sync complete!');
    console.log('\nNew fields added to custom_templates:');
    console.log('- intent: For AI-based intent matching');
    console.log('- min_confidence: Minimum confidence threshold');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  }
}

// Run the sync
syncIntentFields();