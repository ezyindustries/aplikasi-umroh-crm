const axios = require('axios');

async function debugAPIData() {
    try {
        console.log('Fetching automation logs...\n');
        
        const response = await axios.get('http://localhost:3003/api/automation/logs?limit=3');
        const data = response.data;
        
        if (data.success && data.logs && data.logs.length > 0) {
            console.log(`Found ${data.logs.length} logs\n`);
            
            data.logs.forEach((log, index) => {
                console.log(`=== Log ${index + 1} (ID: ${log.id}) ===`);
                console.log('Status:', log.status);
                console.log('Created:', new Date(log.createdAt).toLocaleString());
                console.log('Execution Time:', log.executionTime, 'ms');
                
                console.log('\nMetadata:');
                console.log(JSON.stringify(log.metadata, null, 2));
                
                console.log('\nTriggerData:');
                console.log(JSON.stringify(log.triggerData, null, 2));
                
                if (log.rule) {
                    console.log('\nRule Info:');
                    console.log('- Name:', log.rule.name);
                    console.log('- Type:', log.rule.ruleType);
                    console.log('- Priority:', log.rule.priority);
                }
                
                if (log.contact) {
                    console.log('\nContact Info:');
                    console.log('- Phone:', log.contact.phone);
                    console.log('- Name:', log.contact.name || 'Unknown');
                }
                
                console.log('\n' + '-'.repeat(60) + '\n');
            });
            
            // Check what fields are available for display
            const firstLog = data.logs[0];
            console.log('DISPLAY DATA CHECK:');
            console.log('Rule Name:', firstLog.metadata?.ruleName || firstLog.rule?.name || 'NOT FOUND');
            console.log('Rule Type:', firstLog.metadata?.ruleType || firstLog.rule?.ruleType || 'NOT FOUND');
            console.log('Message Content:', firstLog.triggerData?.messageContent || 'NOT FOUND');
            console.log('Has Metadata:', !!firstLog.metadata);
            console.log('Has TriggerData:', !!firstLog.triggerData);
            
        } else {
            console.log('No logs found or invalid response:', data);
        }
        
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

debugAPIData();