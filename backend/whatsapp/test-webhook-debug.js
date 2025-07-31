const express = require('express');
const app = express();
app.use(express.json());

console.log('=== WEBHOOK DEBUG SERVER ===');
console.log('Starting on port 3002...');
console.log('Configure WAHA webhook to: http://host.docker.internal:3002/webhook');
console.log('');

// Capture all webhook data
app.post('/webhook', (req, res) => {
    console.log('\n=== NEW WEBHOOK EVENT ===');
    console.log('Time:', new Date().toISOString());
    console.log('Event:', req.body.event);
    
    if (req.body.event === 'message' || req.body.event === 'message.any') {
        const payload = req.body.payload;
        console.log('\nMessage Details:');
        console.log('  ID:', payload.id);
        console.log('  Type:', payload.type);
        console.log('  From:', payload.from);
        console.log('  To:', payload.to);
        console.log('  Body:', payload.body);
        console.log('  Has Media:', !!payload.media);
        
        if (payload.media) {
            console.log('\nMedia Details:');
            console.log('  Media ID:', payload.media.id);
            console.log('  Filename:', payload.media.filename);
            console.log('  Mimetype:', payload.media.mimetype);
            console.log('  File size:', payload.media.filesize);
            console.log('  URL:', payload.media.url);
            console.log('  Preview:', payload.media.preview);
        }
        
        console.log('\nFull payload:');
        console.log(JSON.stringify(payload, null, 2));
    }
    
    res.json({ success: true });
});

app.listen(3002, () => {
    console.log('Debug webhook server listening on port 3002');
    console.log('\nNow update WAHA webhook:');
    console.log('curl -X POST http://localhost:3000/api/sessions/default/webhook \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"url": "http://host.docker.internal:3002/webhook", "events": ["message", "message.any"]}\'');
});