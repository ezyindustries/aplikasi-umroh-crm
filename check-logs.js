const { AutomationLog, AutomationRule } = require('./backend/whatsapp/src/models');

async function checkLogs() {
  try {
    console.log('=== RECENT AUTOMATION LOGS ===\n');
    
    const logs = await AutomationLog.findAll({ 
      order: [['createdAt', 'DESC']], 
      limit: 20
    });
    
    if (logs.length === 0) {
      console.log('No automation logs found');
      return;
    }
    
    for (const log of logs) {
      const rule = await AutomationRule.findByPk(log.ruleId);
      console.log(`${log.createdAt.toISOString()}`);
      console.log(`Rule: ${rule?.name || 'Unknown'} (${log.ruleId})`);
      console.log(`Status: ${log.status}`);
      console.log(`Trigger: ${log.triggerType}`);
      console.log(`Contact: ${log.contactId}`);
      console.log(`Message: ${log.messageId}`);
      console.log(`Response Message ID: ${log.responseMessageId}`);
      console.log(`Execution Time: ${log.executionTime}ms`);
      console.log(`Error: ${log.error || 'None'}`);
      console.log(`Skip Reason: ${log.skippedReason || 'None'}`);
      console.log(`Trigger Data:`, JSON.stringify(log.triggerData, null, 2));
      console.log('---\n');
    }
    
    // Summary
    const statusCounts = {};
    logs.forEach(log => {
      statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;
    });
    
    console.log('=== SUMMARY ===');
    console.log('Status counts:', statusCounts);
    
    const errors = logs.filter(log => log.error).map(log => log.error);
    if (errors.length > 0) {
      console.log('\nUnique errors:');
      [...new Set(errors)].forEach(error => console.log(`- ${error}`));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLogs();