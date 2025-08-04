const { AutomationLog, AutomationEngine, Contact, Conversation } = require('./src/models');
const { Op } = require('sequelize');

async function cleanAndTest() {
  try {
    // Count old logs
    const oldLogs = await AutomationLog.count({
      where: {
        [Op.or]: [
          { metadata: null },
          { metadata: {} }
        ]
      }
    });

    console.log(`Found ${oldLogs} old logs without metadata`);

    if (oldLogs > 0) {
      console.log('Deleting old logs...');
      await AutomationLog.destroy({
        where: {
          [Op.or]: [
            { metadata: null },
            { metadata: {} }
          ]
        }
      });
      console.log('Old logs deleted!');
    }

    // Now trigger a test
    console.log('\nTriggering test automation...');

    const [contact] = await Contact.findOrCreate({
      where: { phoneNumber: '628123456789' },
      defaults: { name: 'Test User', isBlocked: false }
    });

    const [conversation] = await Conversation.findOrCreate({
      where: { contactId: contact.id },
      defaults: { sessionId: 'default', isGroup: false, status: 'active' }
    });

    // Test different messages
    const testMessages = [
      'Assalamualaikum',
      '123123',
      'Berapa harga paket umroh?'
    ];

    const AutomationEngineService = require('./src/services/AutomationEngine');

    for (const content of testMessages) {
      const message = {
        id: 'test-' + Date.now() + '-' + Math.random(),
        content: content,
        body: content,
        messageType: 'text',
        conversationId: conversation.id,
        fromNumber: contact.phoneNumber,
        direction: 'inbound',
        status: 'received',
        isGroupMessage: false
      };

      console.log(`\nProcessing: "${content}"`);
      await AutomationEngineService.processMessage(message, contact, conversation);
ECHO is off.
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check new logs
    const newLogs = await AutomationLog.count();
    console.log(`\nTotal logs after test: ${newLogs}`);

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

cleanAndTest();
