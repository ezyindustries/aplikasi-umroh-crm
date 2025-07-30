const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/whatsapp-crm.db',
  logging: false
});

async function checkContacts() {
  try {
    const [contacts] = await sequelize.query('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 10');
    
    console.log('=== KONTAK TERDAFTAR ===');
    contacts.forEach((c, i) => {
      console.log(`${i+1}. ${c.name || 'No name'} - ${c.phone_number}`);
    });
    
    console.log(`\nTotal kontak: ${contacts.length}`);
    
    const [sessions] = await sequelize.query('SELECT * FROM whatsapp_sessions');
    console.log('\n=== WHATSAPP SESSIONS ===');
    sessions.forEach(s => {
      console.log(`Session: ${s.session_name}, Status: ${s.status}`);
      console.log(`Config: ${JSON.stringify(s.config)}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkContacts();