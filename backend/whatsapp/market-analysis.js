const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'whatsapp-crm.db'));

console.log('=== WhatsApp CRM - Market Analysis ===\n');

// Helper function
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function analyzeMarket() {
  try {
    // 1. Connection Status
    const sessions = await runQuery('SELECT * FROM whatsapp_sessions WHERE status = "connected"');
    console.log(`✅ WhatsApp Connected: ${sessions[0]?.phone_number || 'Not connected'}`);
    console.log(`   Connected since: ${sessions[0]?.connected_at ? new Date(sessions[0].connected_at).toLocaleString() : 'N/A'}\n`);

    // 2. Contact Statistics
    const totalContacts = await runQuery('SELECT COUNT(*) as count FROM contacts');
    const activeContacts = await runQuery('SELECT COUNT(*) as count FROM conversations WHERE status = "active"');
    
    console.log('📊 Contact Statistics:');
    console.log(`   Total Contacts: ${totalContacts[0].count}`);
    console.log(`   Active Conversations: ${activeContacts[0].count}`);

    // 3. Recent Contacts
    const recentContacts = await runQuery(`
      SELECT c.*, conv.last_message_at 
      FROM contacts c
      LEFT JOIN conversations conv ON c.id = conv.contact_id
      ORDER BY conv.last_message_at DESC
      LIMIT 10
    `);

    if (recentContacts.length > 0) {
      console.log('\n👥 Recent Active Contacts:');
      recentContacts.forEach((contact, i) => {
        console.log(`   ${i+1}. ${contact.name || 'Unknown'} (${contact.phone_number})`);
        if (contact.last_message_at) {
          console.log(`      Last activity: ${new Date(contact.last_message_at).toLocaleString()}`);
        }
      });
    }

    // 4. Message Analysis
    const totalMessages = await runQuery('SELECT COUNT(*) as count FROM messages');
    const inboundMessages = await runQuery('SELECT COUNT(*) as count FROM messages WHERE direction = "inbound"');
    const outboundMessages = await runQuery('SELECT COUNT(*) as count FROM messages WHERE direction = "outbound"');
    
    console.log('\n💬 Message Statistics:');
    console.log(`   Total Messages: ${totalMessages[0].count}`);
    console.log(`   Customer Messages (Inbound): ${inboundMessages[0].count}`);
    console.log(`   Your Messages (Outbound): ${outboundMessages[0].count}`);

    // 5. Recent Conversations
    const recentMessages = await runQuery(`
      SELECT m.*, c.name, c.phone_number as contact_phone
      FROM messages m
      LEFT JOIN conversations conv ON m.conversation_id = conv.id
      LEFT JOIN contacts c ON conv.contact_id = c.id
      WHERE m.content IS NOT NULL
      ORDER BY m.created_at DESC
      LIMIT 20
    `);

    if (recentMessages.length > 0) {
      console.log('\n📝 Recent Conversations:');
      console.log('─'.repeat(80));
      
      recentMessages.forEach(msg => {
        const name = msg.name || msg.contact_phone || msg.from_number || 'Unknown';
        const direction = msg.direction === 'inbound' ? '👤' : '🤖';
        const time = new Date(msg.created_at).toLocaleString('id-ID');
        const content = msg.content.substring(0, 60).replace(/\n/g, ' ');
        
        console.log(`${direction} [${time}] ${name}:`);
        console.log(`   "${content}${msg.content.length > 60 ? '...' : ''}"`);
        console.log('');
      });
    }

    // 6. Keyword Analysis for Market Insights
    const customerMessages = await runQuery(`
      SELECT content FROM messages 
      WHERE direction = "inbound" 
      AND content IS NOT NULL 
      AND content != ''
    `);

    if (customerMessages.length > 0) {
      console.log('\n🔍 Market Analysis - Customer Keywords:');
      console.log('─'.repeat(80));
      
      // Analyze keywords
      const keywords = {};
      const stopWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'adalah', 'ini', 'itu', 'ya', 'tidak', 'ada', 'saya', 'anda', 'kita', 'akan', 'sudah', 'jika', 'bisa', 'atau', 'juga', 'saja', 'apa', 'mau', 'minta'];
      
      // Special keywords to track (umroh related)
      const umrohKeywords = {
        packages: ['paket', 'package', 'program', 'umroh', 'umrah', 'haji'],
        pricing: ['harga', 'biaya', 'price', 'berapa', 'cost', 'tarif', 'bayar'],
        timing: ['kapan', 'jadwal', 'bulan', 'tanggal', 'keberangkatan', 'berangkat'],
        hotels: ['hotel', 'penginapan', 'makkah', 'madinah', 'akomodasi'],
        visa: ['visa', 'paspor', 'passport', 'dokumen'],
        facilities: ['fasilitas', 'include', 'termasuk', 'dapat', 'bonus']
      };

      const categoryCount = {};
      Object.keys(umrohKeywords).forEach(cat => categoryCount[cat] = 0);

      customerMessages.forEach(msg => {
        const words = msg.content.toLowerCase().split(/\s+/);
        
        // Check special categories
        Object.entries(umrohKeywords).forEach(([category, keywords]) => {
          keywords.forEach(keyword => {
            if (msg.content.toLowerCase().includes(keyword)) {
              categoryCount[category]++;
            }
          });
        });

        // General keyword analysis
        words.forEach(word => {
          word = word.replace(/[^a-z0-9]/gi, '');
          if (word.length > 3 && !stopWords.includes(word)) {
            keywords[word] = (keywords[word] || 0) + 1;
          }
        });
      });

      // Show category interests
      console.log('\n📈 Customer Interest Categories:');
      Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          const percentage = ((count / customerMessages.length) * 100).toFixed(1);
          const bar = '█'.repeat(Math.floor(count / 2));
          console.log(`   ${category.padEnd(12)}: ${bar} ${count} mentions (${percentage}%)`);
        });

      // Top keywords
      const topKeywords = Object.entries(keywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15);

      console.log('\n🏷️ Top 15 Customer Keywords:');
      topKeywords.forEach(([word, count], i) => {
        console.log(`   ${(i+1).toString().padStart(2)}. "${word}" - ${count} times`);
      });

      // Questions analysis
      const questions = customerMessages.filter(msg => {
        const lower = msg.content.toLowerCase();
        return msg.content.includes('?') || 
               lower.includes('berapa') ||
               lower.includes('bagaimana') ||
               lower.includes('kapan') ||
               lower.includes('dimana') ||
               lower.includes('apakah') ||
               lower.includes('bisakah');
      });

      console.log(`\n❓ Customer Questions: ${questions.length} found`);
      if (questions.length > 0) {
        console.log('   Sample questions:');
        questions.slice(0, 5).forEach((q, i) => {
          console.log(`   ${i+1}. "${q.content.substring(0, 80)}${q.content.length > 80 ? '...' : ''}"`);
        });
      }
    }

    // 7. Time Analysis
    const hourlyActivity = await runQuery(`
      SELECT 
        CAST(strftime('%H', datetime(created_at, 'localtime')) as INTEGER) as hour,
        COUNT(*) as count
      FROM messages
      WHERE direction = 'inbound'
      GROUP BY hour
      ORDER BY hour
    `);

    if (hourlyActivity.length > 0) {
      console.log('\n⏰ Customer Activity by Hour (WIB):');
      console.log('─'.repeat(60));
      
      const maxCount = Math.max(...hourlyActivity.map(h => h.count));
      hourlyActivity.forEach(row => {
        const barLength = Math.floor((row.count / maxCount) * 30);
        const bar = '█'.repeat(barLength);
        console.log(`   ${row.hour.toString().padStart(2, '0')}:00 ${bar} ${row.count}`);
      });
    }

    // 8. Export detailed analysis
    if (process.argv.includes('--export')) {
      const exportData = {
        metadata: {
          generated: new Date().toISOString(),
          whatsappNumber: sessions[0]?.phone_number,
          totalContacts: totalContacts[0].count,
          totalMessages: totalMessages[0].count
        },
        recentContacts,
        recentMessages,
        marketAnalysis: {
          categoryInterests: categoryCount || {},
          topKeywords: topKeywords || []
        },
        hourlyActivity
      };

      fs.writeFileSync('market-analysis-export.json', JSON.stringify(exportData, null, 2));
      console.log('\n✅ Detailed analysis exported to market-analysis-export.json');
    }

    console.log('\n' + '='.repeat(80));
    console.log('Analysis complete. Use --export flag to save detailed data.');

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    db.close();
  }
}

// Run analysis
analyzeMarket();