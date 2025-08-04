// Test keyword matching logic
const logger = require('./backend/whatsapp/src/utils/logger');

// Simulate the checkKeywordConditions function
async function testKeywordMatching() {
  console.log('=== TESTING KEYWORD MATCHING LOGIC ===\n');
  
  // Test cases
  const testCases = [
    {
      keywords: ["test123"],
      messageText: "test123",
      expected: true,
      description: "Exact match"
    },
    {
      keywords: ["test123"],
      messageText: "Test123",
      expected: true,
      description: "Case insensitive match"
    },
    {
      keywords: ["test123"],
      messageText: "Hi test123 there",
      expected: true,
      description: "Keyword in middle of message"
    },
    {
      keywords: ["test123"],
      messageText: "TEST123",
      expected: true,
      description: "Uppercase message"
    },
    {
      keywords: ["test123"],
      messageText: "hello world",
      expected: false,
      description: "No match"
    },
    {
      keywords: ["123123"],
      messageText: "123123",
      expected: true,
      description: "Numeric keyword"
    },
    {
      keywords: [],
      messageText: "test123",
      expected: false,
      description: "No keywords configured"
    }
  ];
  
  // Simulate checkKeywordConditions
  function checkKeywordConditions(rule, message) {
    const keywords = rule.keywords || [];
    const messageText = (message.body || message.content || '').toLowerCase();
    
    console.log(`  Checking keywords: ${JSON.stringify(keywords)}`);
    console.log(`  Message text: "${messageText}"`);
    
    if (keywords.length === 0) {
      return { trigger: false, reason: 'No keywords configured' };
    }
    
    // Check if any keyword matches
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      if (messageText.includes(keywordLower)) {
        console.log(`  ✅ Keyword matched: ${keyword}`);
        return { trigger: true, reason: `Keyword matched: ${keyword}` };
      }
    }
    
    console.log(`  ❌ No keywords matched`);
    return { trigger: false, reason: 'No keywords matched' };
  }
  
  // Run test cases
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}: ${testCase.description}`);
    
    const rule = { keywords: testCase.keywords };
    const message = { body: testCase.messageText };
    
    const result = checkKeywordConditions(rule, message);
    const passed = result.trigger === testCase.expected;
    
    console.log(`  Expected: ${testCase.expected}, Got: ${result.trigger}`);
    console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Reason: ${result.reason}\n`);
  }
}

testKeywordMatching();