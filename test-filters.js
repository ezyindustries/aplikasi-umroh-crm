// Test the filters that might block auto-reply
const logger = require('./backend/whatsapp/src/utils/logger');

console.log('=== TESTING AUTO-REPLY FILTERS ===\n');

// Test master switch
function testMasterSwitch() {
  console.log('1. MASTER SWITCH TEST');
  
  const AutomationEngine = require('./backend/whatsapp/src/services/AutomationEngine');
  console.log(`   Master enabled: ${AutomationEngine.getMasterEnabled()}`);
  
  if (!AutomationEngine.getMasterEnabled()) {
    console.log('   ❌ BLOCKING: Master switch is OFF');
    return false;
  } else {
    console.log('   ✅ PASS: Master switch is ON');
    return true;
  }
}

// Test group message filter
function testGroupMessageFilter() {
  console.log('\n2. GROUP MESSAGE FILTER TEST');
  
  const testCases = [
    {
      message: { isGroupMessage: true },
      conversation: { isGroup: false },
      expected: 'blocked',
      description: 'Message marked as group message'
    },
    {
      message: { isGroupMessage: false },
      conversation: { isGroup: true },
      expected: 'blocked', 
      description: 'Conversation is group'
    },
    {
      message: { isGroupMessage: false },
      conversation: { isGroup: false },
      expected: 'allowed',
      description: 'Both message and conversation are not group'
    },
  ];
  
  testCases.forEach((testCase, i) => {
    console.log(`   Test ${i + 1}: ${testCase.description}`);
    
    const isBlocked = testCase.message.isGroupMessage || testCase.conversation.isGroup;
    const result = isBlocked ? 'blocked' : 'allowed';
    const passed = result === testCase.expected;
    
    console.log(`     Expected: ${testCase.expected}, Got: ${result}`);
    console.log(`     Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  });
}

// Test outgoing message filter
function testOutgoingMessageFilter() {
  console.log('\n3. OUTGOING MESSAGE FILTER TEST');
  
  const testCases = [
    {
      message: { fromMe: true },
      expected: 'blocked',
      description: 'Message from me (outgoing)'
    },
    {
      message: { fromMe: false },
      expected: 'allowed',
      description: 'Message from contact (incoming)'
    },
    {
      message: {}, // fromMe undefined
      expected: 'allowed',
      description: 'fromMe undefined (treated as incoming)'
    }
  ];
  
  testCases.forEach((testCase, i) => {
    console.log(`   Test ${i + 1}: ${testCase.description}`);
    
    const isBlocked = testCase.message.fromMe === true;
    const result = isBlocked ? 'blocked' : 'allowed';
    const passed = result === testCase.expected;
    
    console.log(`     Expected: ${testCase.expected}, Got: ${result}`);
    console.log(`     Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  });
}

// Test complete flow simulation
function simulateProcessMessage() {
  console.log('\n4. COMPLETE FLOW SIMULATION');
  console.log('   Simulating a typical incoming message...');
  
  const message = {
    id: 'test_msg_123',
    content: 'test123',
    body: 'test123',
    direction: 'inbound',
    messageType: 'text',
    fromMe: false,
    isGroupMessage: false
  };
  
  const contact = {
    id: 'test_contact_123',
    phoneNumber: '6281234567890'
  };
  
  const conversation = {
    id: 'test_conv_123',
    isGroup: false
  };
  
  console.log('   Message details:');
  console.log(`     Content: "${message.content}"`);
  console.log(`     From me: ${message.fromMe}`);
  console.log(`     Is group: ${message.isGroupMessage}`);
  console.log(`     Conversation is group: ${conversation.isGroup}`);
  
  // Check filters step by step
  const AutomationEngine = require('./backend/whatsapp/src/services/AutomationEngine');
  
  // 1. Master switch
  if (!AutomationEngine.getMasterEnabled()) {
    console.log('   ❌ BLOCKED: Master switch is OFF');
    return;
  }
  
  // 2. Group filter
  if (message.isGroupMessage || conversation.isGroup) {
    console.log('   ❌ BLOCKED: Group message filter');
    return;
  }
  
  // 3. Outgoing filter (in evaluateRule)
  if (message.fromMe) {
    console.log('   ❌ BLOCKED: Outgoing message filter');
    return;
  }
  
  console.log('   ✅ ALL FILTERS PASSED');
  console.log('   Message should trigger automation rules');
}

// Run all tests
testMasterSwitch();
testGroupMessageFilter();
testOutgoingMessageFilter();
simulateProcessMessage();