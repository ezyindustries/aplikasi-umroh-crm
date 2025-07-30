const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/whatsapp-crm.db',
  logging: false
});

async function checkTableStructure() {
  try {
    // Get table info
    const [columns] = await sequelize.query(`PRAGMA table_info(messages)`);
    
    console.log('=== STRUKTUR TABEL MESSAGES ===\n');
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    // Now get last messages with correct column names
    console.log('\n=== 10 PESAN TERAKHIR ===\n');
    
    const [messages] = await sequelize.query(`
      SELECT * FROM messages 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.created_at}]`);
      Object.keys(msg).forEach(key => {
        if (msg[key] !== null && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          console.log(`   ${key}: ${msg[key]}`);
        }
      });
      console.log('   -------------------');
    });
    
    if (messages.length === 0) {
      console.log('Tidak ada pesan di database.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure();