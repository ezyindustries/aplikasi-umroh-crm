const io = require('socket.io-client');

console.log('Testing Socket.IO connection to backend...\n');

// Connect to backend
const socket = io('http://localhost:3001', {
    transports: ['polling', 'websocket'],
    reconnection: false,
    query: {
        sessionId: 'default'
    }
});

// Connection events
socket.on('connect', () => {
    console.log('✅ Connected successfully!');
    console.log('Socket ID:', socket.id);
    console.log('Transport:', socket.io.engine.transport.name);
    
    // Try joining session
    socket.emit('join:session', 'default');
});

socket.on('connect:success', (data) => {
    console.log('✅ Connection acknowledged:', data);
});

socket.on('join:session:success', (data) => {
    console.log('✅ Joined session:', data);
    
    // Test complete, disconnect
    setTimeout(() => {
        console.log('\nTest completed successfully!');
        socket.disconnect();
        process.exit(0);
    }, 1000);
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    console.error('Error type:', error.type);
    process.exit(1);
});

socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.error('❌ Connection timeout - no response after 10 seconds');
    process.exit(1);
}, 10000);