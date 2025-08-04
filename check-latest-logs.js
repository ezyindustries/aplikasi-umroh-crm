const { AutomationLog, AutomationRule, Contact, Message } = require('./backend/whatsapp/src/models');

async function checkLatestLogs() {
  try {
    console.log('Checking latest automation logs...\n');
    
    // Get latest 5 logs
    const logs = await AutomationLog.findAll({
      include: [
        { model: AutomationRule, as: 'rule' },
        { model: Contact, as: 'contact' }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    console.log(`Found ${logs.length} recent logs:\n`);
    
    logs.forEach((log, index) => {
      console.log(`=== Log ${index + 1} ===`);
      console.log('ID:', log.id);
      console.log('Created:', new Date(log.createdAt).toLocaleString());
      console.log('Status:', log.status);
      console.log('Rule:', log.rule?.name || 'No rule data');
      console.log('Contact:', log.contact?.phoneNumber || 'No contact data');
      
      // Check metadata
      console.log('\nMetadata:');
      if (log.metadata) {
        console.log('Type:', typeof log.metadata);
        if (typeof log.metadata === 'string') {
          try {
            const parsed = JSON.parse(log.metadata);
            console.log('Parsed:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('String value:', log.metadata);
          }
        } else {
          console.log('Object:', JSON.stringify(log.metadata, null, 2));
        }
      } else {
        console.log('No metadata');
      }
      
      // Check triggerData
      console.log('\nTriggerData:');
      if (log.triggerData) {
        console.log('Type:', typeof log.triggerData);
        if (typeof log.triggerData === 'string') {
          try {
            const parsed = JSON.parse(log.triggerData);
            console.log('Parsed:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('String value:', log.triggerData);
          }
        } else {
          console.log('Object:', JSON.stringify(log.triggerData, null, 2));
        }
      } else {
        console.log('No triggerData');
      }
      
      console.log('\n' + '-'.repeat(50) + '\n');
    });
    
    // Check if automation is running
    console.log('Checking if automation rules are active...');
    const activeRules = await AutomationRule.findAll({
      where: { isActive: true }
    });
    console.log(`Active rules: ${activeRules.length}`);
    activeRules.forEach(rule => {
      console.log(`- ${rule.name} (${rule.ruleType})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkLatestLogs();