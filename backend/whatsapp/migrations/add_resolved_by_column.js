const { Sequelize } = require('sequelize');
const path = require('path');

async function runMigration() {
  // Connect to database
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../data/whatsapp-crm.db'),
    logging: console.log
  });

  try {
    // Check if column exists
    const tableInfo = await sequelize.query(
      "PRAGMA table_info(conversations);",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const hasResolvedBy = tableInfo.some(col => col.name === 'resolved_by');
    
    if (!hasResolvedBy) {
      console.log('Adding resolved_by column to conversations table...');
      
      await sequelize.query(`
        ALTER TABLE conversations 
        ADD COLUMN resolved_by VARCHAR(255) DEFAULT NULL;
      `);
      
      console.log('✓ Added resolved_by column successfully');
    } else {
      console.log('✓ resolved_by column already exists');
    }

    // Check Message table columns
    const messageTableInfo = await sequelize.query(
      "PRAGMA table_info(messages);",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Add missing columns to messages table
    const columnsToAdd = [
      { name: 'is_automated', type: 'BOOLEAN DEFAULT 0' },
      { name: 'response_time', type: 'INTEGER DEFAULT NULL' },
      { name: 'type', type: "VARCHAR(255) DEFAULT 'incoming'" }
    ];
    
    for (const col of columnsToAdd) {
      const hasColumn = messageTableInfo.some(c => c.name === col.name);
      if (!hasColumn) {
        console.log(`Adding ${col.name} column to messages table...`);
        await sequelize.query(`
          ALTER TABLE messages 
          ADD COLUMN ${col.name} ${col.type};
        `);
        console.log(`✓ Added ${col.name} column successfully`);
      } else {
        console.log(`✓ ${col.name} column already exists`);
      }
    }

    console.log('\n✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;