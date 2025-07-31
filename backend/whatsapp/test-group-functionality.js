/**
 * Test script for WhatsApp group chat functionality
 * Run: node test-group-functionality.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const SESSION_ID = 'default';

async function testGroupFunctionality() {
    console.log('🔍 Testing WhatsApp Group Chat Functionality\n');
    
    try {
        // 1. Check session status
        console.log('1️⃣ Checking WhatsApp session status...');
        const statusResponse = await axios.get(`${API_BASE}/sessions/${SESSION_ID}/status`);
        console.log('Session status:', statusResponse.data.data.status);
        
        if (statusResponse.data.data.status !== 'WORKING') {
            console.log('❌ WhatsApp not connected. Please connect first.');
            return;
        }
        
        // 2. Get groups list
        console.log('\n2️⃣ Fetching groups...');
        const groupsResponse = await axios.get(`${API_BASE}/groups?sessionId=${SESSION_ID}`);
        console.log(`Found ${groupsResponse.data.data.length} groups`);
        
        if (groupsResponse.data.data.length > 0) {
            const firstGroup = groupsResponse.data.data[0];
            console.log(`\nFirst group: ${firstGroup.name} (${firstGroup.groupId})`);
            console.log(`Participants: ${firstGroup.participantCount || 0}`);
            
            // 3. Get group details
            console.log('\n3️⃣ Getting group details...');
            const groupDetailResponse = await axios.get(`${API_BASE}/groups/${firstGroup.groupId}?sessionId=${SESSION_ID}`);
            const groupDetail = groupDetailResponse.data.data;
            console.log(`Group: ${groupDetail.name}`);
            console.log(`Participants: ${groupDetail.participants?.length || 0}`);
            
            // 4. Get group messages
            console.log('\n4️⃣ Getting group messages...');
            const messagesResponse = await axios.get(`${API_BASE}/groups/${firstGroup.groupId}/messages?limit=5`);
            console.log(`Found ${messagesResponse.data.data.length} recent messages`);
            
            // 5. Test sending a message to group
            console.log('\n5️⃣ Testing message send to group...');
            const testMessage = {
                to: firstGroup.groupId,
                message: `Test message from WhatsApp CRM - ${new Date().toLocaleString()}`,
                sessionId: SESSION_ID
            };
            
            const sendResponse = await axios.post(`${API_BASE}/messages/send`, testMessage);
            if (sendResponse.data.success) {
                console.log('✅ Message sent successfully!');
                console.log('Message ID:', sendResponse.data.data.id);
            } else {
                console.log('❌ Failed to send message:', sendResponse.data.error);
            }
            
            // 6. Get group invite link
            console.log('\n6️⃣ Getting group invite link...');
            try {
                const inviteResponse = await axios.get(`${API_BASE}/groups/${firstGroup.groupId}/invite-link?sessionId=${SESSION_ID}`);
                if (inviteResponse.data.success) {
                    console.log('Invite link:', inviteResponse.data.data.inviteLink || inviteResponse.data.data);
                }
            } catch (error) {
                console.log('Could not get invite link (may require admin permissions)');
            }
        }
        
        // 7. Test conversations filter
        console.log('\n7️⃣ Testing group conversations filter...');
        const groupConversations = await axios.get(`${API_BASE}/conversations?isGroup=true`);
        console.log(`Found ${groupConversations.data.data.length} group conversations`);
        
        console.log('\n✅ Group chat functionality test completed!');
        
    } catch (error) {
        console.error('\n❌ Error during test:', error.response?.data || error.message);
    }
}

// Run the test
testGroupFunctionality();