// Test script to create a simple automation rule
const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3003/api';

async function createTestRule() {
  console.log('Creating test automation rule...');
  
  const formData = new FormData();
  const ruleData = {
    name: 'Test Autoreply Rule',
    description: 'Testing autoreply functionality',
    ruleType: 'keyword',
    keywords: ['test', 'halo', 'hi'],
    responseMessages: [
      {
        type: 'text',
        content: 'Terima kasih telah menghubungi kami! Ini adalah pesan otomatis.',
        order: 0
      },
      {
        type: 'text',
        content: 'Kami akan segera membalas pesan Anda.',
        order: 1
      }
    ],
    responseDelay: 1,
    messageDelay: 2,
    isActive: true
  };
  
  formData.append('ruleData', JSON.stringify(ruleData));
  
  try {
    const response = await axios.post(`${API_BASE}/automation/rules`, formData, {
      headers: formData.getHeaders()
    });
    
    const result = response.data;
    
    if (result.success) {
      console.log('✓ Rule created successfully!');
      console.log('Rule ID:', result.data.id);
      console.log('Keywords:', result.data.keywords);
      console.log('\nNow try sending one of these keywords via WhatsApp:', ruleData.keywords.join(', '));
    } else {
      console.log('✗ Failed to create rule:', result.error);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run the test
createTestRule();