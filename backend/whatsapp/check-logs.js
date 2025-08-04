const { AutomationLog, AutomationRule } = require('./src/models');

async function checkLogs() {
  try {
    const count = await AutomationLog.count();
    console.log('Total automation logs:', count);
    
    if (count > 0) {
      const logs = await AutomationLog.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']]
      });
      
      console.log('\nRecent logs:');
      logs.forEach(log => {
        console.log(`- ID: ${log.id}`);
        console.log(`  Status: ${log.status}`);
        console.log(`  RuleId: ${log.ruleId}`);
        console.log(`  Metadata:`, log.metadata);
        console.log('---');
      });
    } else {
      console.log('\nNo automation logs found!');
      console.log('This is why the management page is empty.');
      console.log('\nTo create logs:');
      console.log('1. Make sure you have active automation rules');
      console.log('2. Send a message that triggers a rule');
      console.log('3. Check the page again');
    }
    
    // Check rules
    const ruleCount = await AutomationRule.count({ where: { isActive: true } });
    console.log('\nActive automation rules:', ruleCount);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkLogs();