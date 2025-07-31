const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001/api';
const WAHA_BASE = 'http://localhost:3000/api';

async function testMediaMessages() {
    console.log('=== Testing Media and Group Messages ===\n');

    try {
        // 1. Check WAHA status
        console.log('[1] Checking WAHA status...');
        const wahaStatus = await axios.get(`${WAHA_BASE}/default/sessions/default`);
        console.log('✅ WAHA Status:', wahaStatus.data.status);
        console.log('Session:', wahaStatus.data.name);
        console.log('');

        // 2. Get recent conversations
        console.log('[2] Getting recent conversations...');
        const conversations = await axios.get(`${API_BASE}/conversations`);
        console.log(`✅ Found ${conversations.data.data.length} conversations`);
        
        if (conversations.data.data.length > 0) {
            const conv = conversations.data.data[0];
            console.log(`Latest: ${conv.Contact.name} (${conv.Contact.phoneNumber})`);
            console.log(`Is Group: ${conv.Contact.isGroup}`);
            
            // 3. Get messages with media
            console.log('\n[3] Checking for media messages...');
            const messages = await axios.get(`${API_BASE}/messages/${conv.id}`);
            
            const mediaMessages = messages.data.data.filter(m => m.messageType !== 'text');
            console.log(`✅ Found ${mediaMessages.length} media messages`);
            
            if (mediaMessages.length > 0) {
                console.log('\nMedia message types:');
                const typeCounts = {};
                mediaMessages.forEach(m => {
                    typeCounts[m.messageType] = (typeCounts[m.messageType] || 0) + 1;
                });
                Object.entries(typeCounts).forEach(([type, count]) => {
                    console.log(`  - ${type}: ${count}`);
                });
                
                // Show sample media message
                const sampleMedia = mediaMessages[0];
                console.log('\nSample media message:');
                console.log(`  Type: ${sampleMedia.messageType}`);
                console.log(`  Media ID: ${sampleMedia.mediaId}`);
                console.log(`  File Name: ${sampleMedia.fileName}`);
                console.log(`  Caption: ${sampleMedia.mediaCaption || 'No caption'}`);
            }
            
            // 4. Check group messages
            console.log('\n[4] Checking for group messages...');
            const groupMessages = messages.data.data.filter(m => m.isGroupMessage);
            console.log(`✅ Found ${groupMessages.length} group messages`);
            
            if (groupMessages.length > 0) {
                const participants = [...new Set(groupMessages.map(m => m.groupParticipant).filter(Boolean))];
                console.log(`Unique participants: ${participants.length}`);
            }
        }

        // 5. Test sending a text message
        console.log('\n[5] Testing message send...');
        console.log('To test sending media:');
        console.log('1. Use WhatsApp Web/Desktop to send images, videos, documents');
        console.log('2. Create or join a group chat');
        console.log('3. Messages should appear in the web interface at http://localhost:8080/conversations-beautiful.html');
        
        // 6. Database statistics
        console.log('\n[6] Database statistics...');
        const stats = await axios.get(`${API_BASE}/dashboard/test`);
        console.log('Database contents:', stats.data.data);

        // 7. Check for group contacts
        console.log('\n[7] Checking for group contacts...');
        const contacts = await axios.get(`${API_BASE}/contacts`);
        const groupContacts = contacts.data.data.filter(c => c.isGroup);
        console.log(`✅ Found ${groupContacts.length} group chats`);
        
        if (groupContacts.length > 0) {
            console.log('\nGroup chats:');
            groupContacts.forEach(g => {
                console.log(`  - ${g.groupName || g.name} (${g.participantCount || 0} members)`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run the test
testMediaMessages();

// Monitor for new messages
console.log('\n\n=== Monitoring for new messages (press Ctrl+C to stop) ===\n');

const io = require('socket.io-client');
const socket = io('http://localhost:3001', {
    transports: ['polling', 'websocket']
});

socket.on('connect', () => {
    console.log('✅ Connected to WebSocket');
});

socket.on('message:new', (data) => {
    const msg = data.message;
    console.log(`\n📨 New message:`);
    console.log(`  From: ${msg.fromNumber}`);
    console.log(`  Type: ${msg.messageType}`);
    console.log(`  Content: ${msg.content || '[Media]'}`);
    if (msg.isGroupMessage) {
        console.log(`  Group: Yes`);
        console.log(`  Participant: ${msg.groupParticipant}`);
    }
    if (msg.messageType !== 'text') {
        console.log(`  Media ID: ${msg.mediaId}`);
        console.log(`  File: ${msg.fileName}`);
    }
});

socket.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});