const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'data', 'whatsapp-crm.db'),
  logging: false
});

// Define models
const Contact = sequelize.define('contacts', {
  name: Sequelize.STRING,
  phoneNumber: Sequelize.STRING,
  email: Sequelize.STRING,
  company: Sequelize.STRING,
  tags: Sequelize.JSON,
  notes: Sequelize.TEXT,
  source: Sequelize.STRING,
  status: Sequelize.STRING,
  lastMessageAt: Sequelize.DATE
}, { timestamps: true });

const Conversation = sequelize.define('conversations', {
  contactId: Sequelize.INTEGER,
  sessionId: Sequelize.STRING,
  status: Sequelize.STRING,
  lastMessageAt: Sequelize.DATE,
  lastMessageContent: Sequelize.TEXT,
  unreadCount: Sequelize.INTEGER,
  priority: Sequelize.STRING,
  tags: Sequelize.JSON,
  notes: Sequelize.TEXT
}, { timestamps: true });

const Message = sequelize.define('messages', {
  conversationId: Sequelize.INTEGER,
  phoneNumber: Sequelize.STRING,
  whatsappMessageId: Sequelize.STRING,
  content: Sequelize.TEXT,
  direction: Sequelize.STRING,
  status: Sequelize.STRING,
  messageType: Sequelize.STRING,
  mediaUrl: Sequelize.STRING,
  metadata: Sequelize.JSON,
  sentAt: Sequelize.DATE,
  deliveredAt: Sequelize.DATE,
  readAt: Sequelize.DATE
}, { timestamps: true });

const WhatsAppSession = sequelize.define('whatsapp_sessions', {
  session_name: Sequelize.STRING,
  phone_number: Sequelize.STRING,
  status: Sequelize.STRING,
  connected_at: Sequelize.DATE,
  disconnected_at: Sequelize.DATE,
  qr_code: Sequelize.TEXT,
  qr_code_expires_at: Sequelize.DATE
}, { 
  timestamps: true,
  underscored: true 
});

// Define associations
Contact.hasMany(Conversation, { foreignKey: 'contactId' });
Conversation.belongsTo(Contact, { foreignKey: 'contactId' });
Conversation.hasMany(Message, { foreignKey: 'conversationId' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

async function analyzeChats() {
  try {
    console.log('=== WhatsApp CRM Database Analysis ===\n');

    // Check session status
    const sessions = await WhatsAppSession.findAll();
    console.log(`Sessions found: ${sessions.length}`);
    sessions.forEach(session => {
      console.log(`- ${session.session_name}: ${session.status} (Phone: ${session.phone_number || 'Not connected'})`);
    });
    console.log();

    // Get all contacts
    const contacts = await Contact.findAll({
      order: [['lastMessageAt', 'DESC']]
    });
    console.log(`Total contacts: ${contacts.length}`);
    
    // Get all conversations
    const conversations = await Conversation.findAll({
      include: [Contact]
    });
    console.log(`Total conversations: ${conversations.length}`);
    
    // Get all messages
    const messages = await Message.findAll();
    console.log(`Total messages: ${messages.length}`);
    console.log(`- Inbound: ${messages.filter(m => m.direction === 'inbound').length}`);
    console.log(`- Outbound: ${messages.filter(m => m.direction === 'outbound').length}`);
    console.log();

    // Show recent contacts
    console.log('=== Recent Contacts (Top 10) ===');
    const recentContacts = contacts.slice(0, 10);
    recentContacts.forEach((contact, i) => {
      console.log(`${i + 1}. ${contact.name || 'Unknown'} (${contact.phoneNumber})`);
      console.log(`   Company: ${contact.company || 'N/A'}`);
      console.log(`   Last message: ${contact.lastMessageAt ? new Date(contact.lastMessageAt).toLocaleString() : 'Never'}`);
      console.log();
    });

    // Show recent messages
    console.log('=== Recent Messages (Last 20) ===');
    const recentMessages = await Message.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20,
      include: [{
        model: Conversation,
        include: [Contact]
      }]
    });

    for (const msg of recentMessages) {
      const contact = msg.Conversation?.Contact;
      const name = contact?.name || contact?.phoneNumber || 'Unknown';
      const direction = msg.direction === 'inbound' ? '←' : '→';
      const time = new Date(msg.createdAt).toLocaleString();
      
      console.log(`[${time}] ${direction} ${name}: ${msg.content?.substring(0, 100)}${msg.content?.length > 100 ? '...' : ''}`);
    }

    // Market Analysis
    console.log('\n=== Market Analysis ===');
    
    // Common keywords
    const allMessages = await Message.findAll({
      where: { direction: 'inbound' }
    });
    
    const keywords = {};
    const commonWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'adalah', 'ini', 'itu'];
    
    allMessages.forEach(msg => {
      if (msg.content) {
        const words = msg.content.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3 && !commonWords.includes(word)) {
            keywords[word] = (keywords[word] || 0) + 1;
          }
        });
      }
    });

    // Sort by frequency
    const topKeywords = Object.entries(keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);

    console.log('Top 20 Keywords from customer messages:');
    topKeywords.forEach(([word, count], i) => {
      console.log(`${i + 1}. "${word}" - ${count} times`);
    });

    // Time analysis
    console.log('\n=== Message Time Analysis ===');
    const hourCounts = {};
    allMessages.forEach(msg => {
      const hour = new Date(msg.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    console.log('Messages by hour:');
    Object.entries(hourCounts)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([hour, count]) => {
        const bar = '█'.repeat(Math.floor(count / 2));
        console.log(`${hour.padStart(2, '0')}:00 - ${bar} ${count}`);
      });

  } catch (error) {
    console.error('Error analyzing chats:', error);
  } finally {
    await sequelize.close();
  }
}

// Export data as JSON
async function exportData() {
  try {
    const data = {
      contacts: await Contact.findAll(),
      conversations: await Conversation.findAll(),
      messages: await Message.findAll({
        order: [['createdAt', 'DESC']]
      })
    };

    const fs = require('fs');
    fs.writeFileSync('whatsapp-data-export.json', JSON.stringify(data, null, 2));
    console.log('\nData exported to whatsapp-data-export.json');
  } catch (error) {
    console.error('Error exporting data:', error);
  }
}

// Run analysis
analyzeChats().then(() => {
  if (process.argv.includes('--export')) {
    return exportData();
  }
});