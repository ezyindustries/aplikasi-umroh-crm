const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'whatsapp-crm.db'));

console.log('=== Checking Tables Separately ===\n');

// Check contacts
console.log('CONTACTS:');
db.all('SELECT * FROM contacts', (err, contacts) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log(`Found ${contacts.length} contacts`);
  contacts.forEach((c, i) => {
    console.log(`${i+1}. ${c.name} (${c.phone_number}) - ID: ${c.id}`);
  });
  
  console.log('\nCONVERSATIONS:');
  db.all('SELECT * FROM conversations', (err, conversations) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log(`Found ${conversations.length} conversations`);
    conversations.forEach((conv, i) => {
      console.log(`${i+1}. ID: ${conv.id}`);
      console.log(`   Contact ID: ${conv.contact_id}`);
      console.log(`   Session: ${conv.session_id}`);
      console.log(`   Status: ${conv.status}`);
      console.log(`   Last Message: ${conv.last_message_at || 'Never'}`);
      console.log(`   Unread: ${conv.unread_count}`);
    });
    
    console.log('\nMESSAGES:');
    db.all('SELECT * FROM messages LIMIT 10', (err, messages) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      
      console.log(`Found ${messages.length} messages`);
      messages.forEach((msg, i) => {
        console.log(`${i+1}. ${msg.direction} - ${msg.content?.substring(0, 50)}`);
        console.log(`   Conv ID: ${msg.conversation_id}`);
        console.log(`   Created: ${msg.created_at}`);
      });
      
      db.close();
    });
  });
});