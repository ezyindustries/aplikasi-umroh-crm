const { AutomationRule, AutomationLog } = require('./backend/whatsapp/src/models');

async function debugAutomation() {
  try {
    console.log('=== AUTOMATION RULES ===');
    const rules = await AutomationRule.findAll({ order: [['id', 'ASC']] });
    
    if (rules.length === 0) {
      console.log('No automation rules found');
    } else {
      rules.forEach(rule => {
        console.log(`ID: ${rule.id} | Name: ${rule.name} | Type: ${rule.ruleType} | Active: ${rule.isActive}`);
        console.log(`Keywords: ${JSON.stringify(rule.keywords)}`);
        console.log(`Trigger Conditions: ${JSON.stringify(rule.triggerConditions)}`);
        console.log(`Response Messages: ${JSON.stringify(rule.responseMessages)}`);
        console.log(`Response Message: ${rule.responseMessage}`);
        console.log(`Priority: ${rule.priority} | Trigger Count: ${rule.triggerCount}`);
        console.log('---');
      });
    }
    
    console.log('\n=== RECENT AUTOMATION LOGS ===');
    const logs = await AutomationLog.findAll({ 
      order: [['createdAt', 'DESC']], 
      limit: 10,
      include: ['AutomationRule']
    });
    
    if (logs.length === 0) {
      console.log('No automation logs found');
    } else {
      logs.forEach(log => {
        console.log(`${log.createdAt} | Rule: ${log.AutomationRule?.name || 'Unknown'} | Status: ${log.status}`);
        console.log(`Trigger: ${log.triggerType} | Error: ${log.error || 'None'}`);
        console.log(`Skip Reason: ${log.skippedReason || 'None'}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugAutomation();