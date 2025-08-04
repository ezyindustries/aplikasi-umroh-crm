const { AutomationRule, Message, Contact, Conversation } = require('./backend/whatsapp/src/models');
const { Op } = require('./backend/whatsapp/node_modules/sequelize');

async function checkMissedTriggers() {
  try {
    console.log('=== CHECKING FOR MISSED KEYWORD TRIGGERS ===\n');
    
    // Get all keyword rules
    const keywordRules = await AutomationRule.findAll({
      where: { 
        ruleType: 'keyword',
        isActive: true 
      }
    });
    
    console.log(`Found ${keywordRules.length} active keyword rules:`);
    keywordRules.forEach(rule => {
      console.log(`- ${rule.name}: keywords = ${JSON.stringify(rule.keywords)}`);
    });
    
    // Get recent incoming messages (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentMessages = await Message.findAll({
      where: {
        createdAt: { [Op.gte]: oneDayAgo },
        direction: 'inbound',
        fromMe: false
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    console.log(`\nChecking ${recentMessages.length} recent incoming messages...\n`);
    
    for (const message of recentMessages) {
      const messageText = (message.body || message.content || '').toLowerCase();
      console.log(`Message: "${messageText}" (${message.createdAt.toISOString()})`);
      
      // Check against each keyword rule
      for (const rule of keywordRules) {
        const keywords = rule.keywords || [];
        let matched = false;
        
        for (const keyword of keywords) {
          if (messageText.includes(keyword.toLowerCase())) {
            matched = true;
            console.log(`  ✅ SHOULD TRIGGER: Rule "${rule.name}" (keyword: "${keyword}")`);
            break;
          }
        }
        
        if (!matched) {
          console.log(`  ❌ No match for rule "${rule.name}"`);
        }
      }
      console.log('');
    }
    
    // Also check messages that contain the specific test keywords
    console.log('=== SEARCHING FOR SPECIFIC KEYWORD MESSAGES ===\n');
    
    const testKeywords = ['test123', '123123'];
    
    for (const keyword of testKeywords) {
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { body: { [Op.like]: `%${keyword}%` } },
            { content: { [Op.like]: `%${keyword}%` } }
          ],
          direction: 'inbound',
          fromMe: false
        },
        order: [['createdAt', 'DESC']],
        limit: 10
      });
      
      console.log(`Messages containing "${keyword}": ${messages.length}`);
      messages.forEach(msg => {
        console.log(`  - ${msg.createdAt.toISOString()}: "${msg.body || msg.content}"`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMissedTriggers();