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
    console.log('Starting group chat support migration...');

    // 1. Add is_group and group fields to contacts table
    const contactsTableInfo = await sequelize.query(
      "PRAGMA table_info(contacts);",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const contactColumnsToAdd = [
      { name: 'is_group', type: 'BOOLEAN DEFAULT 0' },
      { name: 'group_id', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'group_name', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'group_description', type: 'TEXT DEFAULT NULL' },
      { name: 'participant_count', type: 'INTEGER DEFAULT NULL' }
    ];
    
    for (const col of contactColumnsToAdd) {
      const hasColumn = contactsTableInfo.some(c => c.name === col.name);
      if (!hasColumn) {
        console.log(`Adding ${col.name} column to contacts table...`);
        await sequelize.query(`
          ALTER TABLE contacts 
          ADD COLUMN ${col.name} ${col.type};
        `);
        console.log(`✓ Added ${col.name} column successfully`);
      } else {
        console.log(`✓ ${col.name} column already exists in contacts`);
      }
    }

    // 2. Add group-related fields to conversations table
    const conversationsTableInfo = await sequelize.query(
      "PRAGMA table_info(conversations);",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const conversationColumnsToAdd = [
      { name: 'is_group', type: 'BOOLEAN DEFAULT 0' },
      { name: 'group_id', type: 'VARCHAR(255) DEFAULT NULL' }
    ];
    
    for (const col of conversationColumnsToAdd) {
      const hasColumn = conversationsTableInfo.some(c => c.name === col.name);
      if (!hasColumn) {
        console.log(`Adding ${col.name} column to conversations table...`);
        await sequelize.query(`
          ALTER TABLE conversations 
          ADD COLUMN ${col.name} ${col.type};
        `);
        console.log(`✓ Added ${col.name} column successfully`);
      } else {
        console.log(`✓ ${col.name} column already exists in conversations`);
      }
    }

    // 3. Add media-related fields to messages table
    const messagesTableInfo = await sequelize.query(
      "PRAGMA table_info(messages);",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const messageColumnsToAdd = [
      { name: 'file_name', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'thumbnail_url', type: 'TEXT DEFAULT NULL' },
      { name: 'media_caption', type: 'TEXT DEFAULT NULL' },
      { name: 'media_duration', type: 'INTEGER DEFAULT NULL' },
      { name: 'location_latitude', type: 'REAL DEFAULT NULL' },
      { name: 'location_longitude', type: 'REAL DEFAULT NULL' },
      { name: 'location_name', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'location_address', type: 'TEXT DEFAULT NULL' },
      { name: 'contact_vcard', type: 'TEXT DEFAULT NULL' },
      { name: 'is_group_message', type: 'BOOLEAN DEFAULT 0' },
      { name: 'group_participant', type: 'VARCHAR(255) DEFAULT NULL' }
    ];
    
    for (const col of messageColumnsToAdd) {
      const hasColumn = messagesTableInfo.some(c => c.name === col.name);
      if (!hasColumn) {
        console.log(`Adding ${col.name} column to messages table...`);
        await sequelize.query(`
          ALTER TABLE messages 
          ADD COLUMN ${col.name} ${col.type};
        `);
        console.log(`✓ Added ${col.name} column successfully`);
      } else {
        console.log(`✓ ${col.name} column already exists in messages`);
      }
    }

    // 4. Create group_participants table for tracking group members
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS group_participants (
        id VARCHAR(36) PRIMARY KEY,
        group_id VARCHAR(255) NOT NULL,
        contact_id VARCHAR(36) NOT NULL,
        phone_number VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT 0,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        left_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id),
        UNIQUE(group_id, phone_number)
      );
    `);
    console.log('✓ Created group_participants table');

    // Create indexes for group_participants
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_group_participants_group_id 
      ON group_participants(group_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_group_participants_contact_id 
      ON group_participants(contact_id);
    `);
    console.log('✓ Created indexes for group_participants table');

    // 5. Create media_files table for better media management
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS media_files (
        id VARCHAR(36) PRIMARY KEY,
        message_id VARCHAR(36) NOT NULL,
        file_path TEXT,
        file_name VARCHAR(255),
        mime_type VARCHAR(100),
        file_size INTEGER,
        width INTEGER,
        height INTEGER,
        duration INTEGER,
        thumbnail_path TEXT,
        whatsapp_media_id VARCHAR(255),
        download_status VARCHAR(50) DEFAULT 'pending',
        downloaded_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Created media_files table');

    // Create indexes for media_files
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_media_files_message_id 
      ON media_files(message_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_media_files_download_status 
      ON media_files(download_status);
    `);
    console.log('✓ Created indexes for media_files table');

    console.log('\n✅ Group chat and media support migration completed successfully!');
    
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