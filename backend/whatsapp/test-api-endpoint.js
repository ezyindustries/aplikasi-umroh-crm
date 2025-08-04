const express = require('express');
const app = express();
const { AutomationLog, AutomationRule, Contact, Message } = require('./src/models');

async function testEndpoint() {
  try {
    console.log('Testing automation logs endpoint...\n');
    
    // Import controller
    const automationController = require('./src/controllers/automationController');
    
    // Create mock request and response
    const mockReq = {
      query: {
        limit: 5,
        offset: 0
      }
    };
    
    const mockRes = {
      json: (data) => {
        console.log('API Response:');
        console.log('Success:', data.success);
        console.log('Total logs:', data.logs?.length || 0);
        
        if (data.logs && data.logs.length > 0) {
          console.log('\n=== ANALYZING FIRST LOG ===');
          const log = data.logs[0];
          
          console.log('\nBasic Info:');
          console.log('- ID:', log.id);
          console.log('- Status:', log.status);
          console.log('- Created:', new Date(log.createdAt).toLocaleString());
          
          console.log('\nMetadata Analysis:');
          console.log('- Has metadata:', !!log.metadata);
          console.log('- Metadata type:', typeof log.metadata);
          if (log.metadata) {
            console.log('- Metadata keys:', Object.keys(log.metadata));
            console.log('- Rule name in metadata:', log.metadata.ruleName || 'NOT FOUND');
            console.log('- Rule type in metadata:', log.metadata.ruleType || 'NOT FOUND');
          }
          
          console.log('\nTriggerData Analysis:');
          console.log('- Has triggerData:', !!log.triggerData);
          console.log('- TriggerData type:', typeof log.triggerData);
          if (log.triggerData) {
            console.log('- TriggerData keys:', Object.keys(log.triggerData));
            console.log('- Message content in triggerData:', log.triggerData.messageContent || 'NOT FOUND');
          }
          
          console.log('\nRule Analysis:');
          console.log('- Has rule:', !!log.rule);
          if (log.rule) {
            console.log('- Rule name:', log.rule.name);
            console.log('- Rule type:', log.rule.ruleType);
          }
          
          console.log('\n=== DISPLAY DATA SUMMARY ===');
          console.log('Display Rule Name:', log.metadata?.ruleName || log.rule?.name || 'NO NAME AVAILABLE');
          console.log('Display Rule Type:', log.metadata?.ruleType || log.rule?.ruleType || 'NO TYPE AVAILABLE');
          console.log('Display Message:', log.triggerData?.messageContent || 'NO MESSAGE AVAILABLE');
          
          // Check if we need to parse JSON strings
          if (typeof log.metadata === 'string') {
            console.log('\nWARNING: metadata is a string, parsing...');
            try {
              const parsed = JSON.parse(log.metadata);
              console.log('Parsed metadata:', parsed);
            } catch (e) {
              console.log('Failed to parse metadata:', e.message);
            }
          }
          
          if (typeof log.triggerData === 'string') {
            console.log('\nWARNING: triggerData is a string, parsing...');
            try {
              const parsed = JSON.parse(log.triggerData);
              console.log('Parsed triggerData:', parsed);
            } catch (e) {
              console.log('Failed to parse triggerData:', e.message);
            }
          }
        }
      },
      status: (code) => {
        console.log('Status code:', code);
        return mockRes;
      }
    };
    
    // Call the controller method
    await automationController.getAutomationLogs(mockReq, mockRes);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testEndpoint();