const { sequelize, CustomTemplate } = require('./backend/whatsapp/src/models');

async function syncTemplateTable() {
  try {
    console.log('Syncing template table...');
    
    // Sync only the CustomTemplate table
    await CustomTemplate.sync({ force: false });
    console.log('✓ CustomTemplate table synced');
    
    console.log('\nTemplate table synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing template table:', error);
    process.exit(1);
  }
}

syncTemplateTable();