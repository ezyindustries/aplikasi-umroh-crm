const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/whatsapp-crm.db',
  logging: false
});

async function checkLastMessages() {
  try {
    const query = `
      SELECT 
        m.id,
        m.content,
        m.messageType,
        m.fromNumber,
        m.toNumber,
        m.direction,
        m.status,
        m.createdAt,
        c.name as contactName,
        c.phoneNumber as contactPhone
      FROM messages m
      LEFT JOIN conversations conv ON m.conversationId = conv.id
      LEFT JOIN contacts c ON conv.contactId = c.id
      ORDER BY m.createdAt DESC
      LIMIT 10
    `;
    
    const [messages] = await sequelize.query(query);
    
    console.log('=== 10 PESAN TERAKHIR DI DATABASE ===\n');
    
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.createdAt}]`);
      console.log(`   Direction: ${msg.direction}`);
      console.log(`   From: ${msg.fromNumber}`);
      console.log(`   To: ${msg.toNumber}`);
      console.log(`   Contact: ${msg.contactName || msg.contactPhone || 'Unknown'}`);
      console.log(`   Type: ${msg.messageType}`);
      console.log(`   Content: ${msg.content || '[No content]'}`);
      console.log(`   Status: ${msg.status}`);
      console.log('   -------------------');
    });
    
    if (messages.length === 0) {
      console.log('Tidak ada pesan di database.');
    }
    
    // Check total messages
    const [countResult] = await sequelize.query('SELECT COUNT(*) as total FROM messages');
    console.log(`\nTotal pesan di database: ${countResult[0].total}`);
    
    // Check incoming vs outgoing
    const [directionCount] = await sequelize.query(`
      SELECT direction, COUNT(*) as count 
      FROM messages 
      GROUP BY direction
    `);
    
    console.log('\nDistribusi pesan:');
    directionCount.forEach(d => {
      console.log(`- ${d.direction}: ${d.count} pesan`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

checkLastMessages();