const sequelize = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function addMediaFilesColumn() {
  console.log('🔧 Adding media_files column to custom_templates table...\n');
  
  try {
    // Check if column already exists
    const columns = await sequelize.query(
      "PRAGMA table_info(custom_templates);",
      { type: QueryTypes.SELECT }
    );
    
    const hasMediaFiles = columns.some(col => col.name === 'media_files');
    
    if (hasMediaFiles) {
      console.log('✅ Column media_files already exists!');
      return;
    }
    
    // Add the column
    await sequelize.query(`
      ALTER TABLE custom_templates 
      ADD COLUMN media_files TEXT DEFAULT '[]'
    `);
    
    console.log('✅ Successfully added media_files column!');
    
    // Verify the column was added
    const updatedColumns = await sequelize.query(
      "PRAGMA table_info(custom_templates);",
      { type: QueryTypes.SELECT }
    );
    
    const mediaFilesCol = updatedColumns.find(col => col.name === 'media_files');
    if (mediaFilesCol) {
      console.log('\n📋 Column details:');
      console.log(`  - Name: ${mediaFilesCol.name}`);
      console.log(`  - Type: ${mediaFilesCol.type}`);
      console.log(`  - Default: ${mediaFilesCol.dflt_value}`);
    }
    
  } catch (error) {
    console.error('❌ Error adding column:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the migration
addMediaFilesColumn();