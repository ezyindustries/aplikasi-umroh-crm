const { AutomationLog, AutomationRule, Contact, Message } = require('./src/models');

async function checkNewLogs() {
  try {
    // Get logs with metadata
    const logsWithMetadata = await AutomationLog.findAll({
      where: {
        metadata: {
          $ne: null
        }
      },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: AutomationRule, as: 'rule' },
        { model: Contact, as: 'contact' }
      ]
    });
    
    console.log('Logs with metadata:', logsWithMetadata.length);
    
    if (logsWithMetadata.length === 0) {
      console.log('\nNo logs with enhanced metadata found!');
      console.log('This means all logs are from before the update.');
      console.log('\nTo create new logs with full details:');
      console.log('1. Send a new message to trigger automation');
      console.log('2. The new logs will have complete metadata');
      
      // Show a recent log structure
      const recentLog = await AutomationLog.findOne({
        order: [['createdAt', 'DESC']],
        include: [
          { model: AutomationRule, as: 'rule' }
        ]
      });
      
      if (recentLog) {
        console.log('\nRecent log details:');
        console.log('- Rule:', recentLog.rule?.name);
        console.log('- Status:', recentLog.status);
        console.log('- Created:', recentLog.createdAt);
        console.log('- Has metadata:', Object.keys(recentLog.metadata || {}).length > 0);
      }
    } else {
      console.log('\nLogs with metadata:');
      logsWithMetadata.forEach(log => {
        console.log(`\n- Rule: ${log.metadata?.ruleName || log.rule?.name}`);
        console.log(`  Type: ${log.metadata?.ruleType || log.rule?.ruleType}`);
        console.log(`  Contact: ${log.contact?.phoneNumber}`);
        console.log(`  Status: ${log.status}`);
        console.log(`  Metadata keys:`, Object.keys(log.metadata));
      });
    }
    
    // Test API endpoint
    console.log('\n\nTesting API endpoint...');
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3003/api/automation/logs?limit=5');
    const data = await response.json();
    
    console.log('API Response:', data.success ? 'Success' : 'Failed');
    console.log('Logs returned:', data.logs?.length || 0);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkNewLogs();