const express = require('express');
const app = express();
app.use(express.json({ limit: '50mb' }));

console.log('=== WEBHOOK MONITOR ===');
console.log('Starting webhook receiver on port 3002...');
console.log('');

// Catch all webhooks
app.all('*', (req, res) => {
    console.log('\n=== WEBHOOK RECEIVED ===');
    console.log('Time:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    if (req.body) {
        console.log('\nBody:');
        console.log(JSON.stringify(req.body, null, 2));
        
        // Check for media in webhook
        if (req.body.event === 'message' && req.body.payload) {
            const payload = req.body.payload;
            console.log('\n=== MESSAGE DETAILS ===');
            console.log('Type:', payload.type);
            console.log('Has Media:', !!payload.media);
            
            if (payload.media) {
                console.log('\nMEDIA INFO:');
                console.log('  ID:', payload.media.id);
                console.log('  Mimetype:', payload.media.mimetype);
                console.log('  Filename:', payload.media.filename);
                console.log('  Size:', payload.media.filesize);
                console.log('  URL:', payload.media.url);
                console.log('  Data present:', !!payload.media.data);
            }
        }
    }
    
    res.json({ success: true });
});

app.listen(3002, () => {
    console.log('Webhook monitor listening on port 3002');
    console.log('\nNow update WAHA webhook to point here:');
    console.log('docker stop whatsapp-http-api');
    console.log('docker rm whatsapp-http-api');
    console.log('docker run -d \\');
    console.log('  --name whatsapp-http-api \\');
    console.log('  --restart unless-stopped \\');
    console.log('  -p 3000:3000 \\');
    console.log('  -v "D:\\ezyin\\Documents\\aplikasi umroh\\waha-data:/app/data" \\');
    console.log('  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3002 \\');
    console.log('  -e WHATSAPP_HOOK_EVENTS=* \\');
    console.log('  -e WHATSAPP_RESTART_ALL_SESSIONS=true \\');
    console.log('  devlikeapro/whatsapp-http-api:latest');
});