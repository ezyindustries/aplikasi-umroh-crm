const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open database
const db = new sqlite3.Database(path.join(__dirname, 'data', 'whatsapp-crm.db'));

console.log('=== WhatsApp CRM Database Analysis ===\n');

// Helper function to run queries
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function analyze() {
  try {
    // Check sessions
    const sessions = await runQuery('SELECT * FROM whatsapp_sessions');
    console.log(`WhatsApp Sessions: ${sessions.length}`);
    sessions.forEach(s => {
      console.log(`- ${s.session_name}: ${s.status} (Phone: ${s.phone_number || 'Not connected'})`);
      if (s.connected_at) console.log(`  Connected: ${new Date(s.connected_at).toLocaleString()}`);
    });
    console.log();

    // Get contacts  
    const contacts = await runQuery('SELECT * FROM contacts ORDER BY last_message_at DESC LIMIT 20');
    console.log(`Total Contacts: ${contacts.length}`);
    
    if (contacts.length > 0) {
      console.log('\n=== Recent Contacts ===');
      contacts.forEach((c, i) => {
        console.log(`${i+1}. ${c.name || 'Unknown'} (${c.phone_number})`);
        if (c.company) console.log(`   Company: ${c.company}`);
        if (c.last_message_at) console.log(`   Last msg: ${new Date(c.last_message_at).toLocaleString()}`);
      });
    }

    // Get messages
    const totalMessages = await runQuery('SELECT COUNT(*) as count FROM messages');
    const inboundCount = await runQuery('SELECT COUNT(*) as count FROM messages WHERE direction = "inbound"');
    const outboundCount = await runQuery('SELECT COUNT(*) as count FROM messages WHERE direction = "outbound"');
    
    console.log(`\n=== Message Statistics ===`);
    console.log(`Total Messages: ${totalMessages[0].count}`);
    console.log(`- Inbound: ${inboundCount[0].count}`);
    console.log(`- Outbound: ${outboundCount[0].count}`);

    // Get recent messages with contact info
    const recentMessages = await runQuery(`
      SELECT m.*, c.name, c.phone_number as contact_phone
      FROM messages m
      LEFT JOIN conversations conv ON m.conversation_id = conv.id
      LEFT JOIN contacts c ON conv.contact_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 30
    `);

    if (recentMessages.length > 0) {
      console.log('\n=== Recent Messages ===');
      recentMessages.forEach(msg => {
        const name = msg.name || msg.contact_phone || msg.phone_number || 'Unknown';
        const direction = msg.direction === 'inbound' ? '←' : '→';
        const time = new Date(msg.created_at).toLocaleString();
        const content = msg.content ? msg.content.substring(0, 80) : '[No content]';
        console.log(`[${time}] ${direction} ${name}: ${content}${msg.content?.length > 80 ? '...' : ''}`);
      });
    }

    // Analyze message content for market insights
    const inboundMessages = await runQuery('SELECT content FROM messages WHERE direction = "inbound" AND content IS NOT NULL');
    
    if (inboundMessages.length > 0) {
      console.log('\n=== Market Analysis from Customer Messages ===');
      
      // Common keywords
      const keywords = {};
      const commonWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'adalah', 'ini', 'itu', 'ya', 'tidak', 'ada', 'saya', 'anda'];
      
      inboundMessages.forEach(msg => {
        const words = msg.content.toLowerCase().split(/\s+/);
        words.forEach(word => {
          // Clean word
          word = word.replace(/[^a-z0-9]/gi, '');
          if (word.length > 3 && !commonWords.includes(word)) {
            keywords[word] = (keywords[word] || 0) + 1;
          }
        });
      });

      // Sort by frequency
      const topKeywords = Object.entries(keywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20);

      console.log('\nTop 20 Keywords:');
      topKeywords.forEach(([word, count], i) => {
        console.log(`${i + 1}. "${word}" - ${count} times`);
      });

      // Look for questions
      const questions = inboundMessages.filter(msg => 
        msg.content.includes('?') || 
        msg.content.toLowerCase().includes('berapa') ||
        msg.content.toLowerCase().includes('bagaimana') ||
        msg.content.toLowerCase().includes('kapan') ||
        msg.content.toLowerCase().includes('dimana')
      );
      
      console.log(`\nQuestions from customers: ${questions.length}`);
      if (questions.length > 0) {
        console.log('Sample questions:');
        questions.slice(0, 5).forEach((q, i) => {
          console.log(`${i+1}. ${q.content.substring(0, 100)}${q.content.length > 100 ? '...' : ''}`);
        });
      }
    }

    // Time analysis
    const messagesByHour = await runQuery(`
      SELECT strftime('%H', created_at) as hour, COUNT(*) as count
      FROM messages
      WHERE direction = 'inbound'
      GROUP BY hour
      ORDER BY hour
    `);

    if (messagesByHour.length > 0) {
      console.log('\n=== Customer Activity by Hour ===');
      messagesByHour.forEach(row => {
        const bar = '█'.repeat(Math.min(row.count, 50));
        console.log(`${row.hour}:00 - ${bar} ${row.count}`);
      });
    }

    // Export to JSON
    if (process.argv.includes('--export')) {
      const fs = require('fs');
      const exportData = {
        sessions,
        contacts,
        recentMessages,
        statistics: {
          totalMessages: totalMessages[0].count,
          inbound: inboundCount[0].count,
          outbound: outboundCount[0].count
        }
      };
      
      fs.writeFileSync('whatsapp-analysis.json', JSON.stringify(exportData, null, 2));
      console.log('\n✅ Data exported to whatsapp-analysis.json');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

// Run analysis
analyze();