const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'whatsapp-crm.db'));

console.log('=== Debug Contacts & Conversations ===\n');

// Check contacts
db.all(`
  SELECT 
    c.id as contact_id,
    c.name,
    c.phone_number,
    c.status as contact_status,
    conv.id as conversation_id,
    conv.session_id,
    conv.status as conv_status,
    conv.last_message_at,
    conv.unread_count
  FROM contacts c
  LEFT JOIN conversations conv ON c.id = conv.contact_id
`, (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log(`Found ${rows.length} contact-conversation pairs\n`);
  
  rows.forEach((row, i) => {
    console.log(`${i+1}. Contact: ${row.name} (${row.phone_number})`);
    console.log(`   Contact ID: ${row.id}`);
    console.log(`   Conversation ID: ${row.conversation_id || 'NO CONVERSATION'}`);
    console.log(`   Session ID: ${row.session_id || 'N/A'}`);
    console.log(`   Status: ${row.status}`);
    console.log(`   Last Message: ${row.last_message_at || 'Never'}`);
    console.log(`   Unread: ${row.unread_count || 0}`);
    console.log();
  });
  
  // Check messages
  db.all('SELECT COUNT(*) as count, direction FROM messages GROUP BY direction', (err, msgStats) => {
    if (!err) {
      console.log('Message Statistics:');
      msgStats.forEach(stat => {
        console.log(`  ${stat.direction}: ${stat.count}`);
      });
    }
    
    // Recent messages
    db.all(`
      SELECT m.*, c.name 
      FROM messages m
      LEFT JOIN conversations conv ON m.conversation_id = conv.id
      LEFT JOIN contacts c ON conv.contact_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 10
    `, (err, messages) => {
      if (!err && messages.length > 0) {
        console.log('\nRecent Messages:');
        messages.forEach(msg => {
          console.log(`[${msg.created_at}] ${msg.direction} - ${msg.name || 'Unknown'}: ${msg.content?.substring(0, 50)}`);
        });
      } else {
        console.log('\nNo messages found in database');
      }
      
      db.close();
    });
  });
});