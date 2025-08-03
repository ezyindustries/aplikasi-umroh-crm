const http = require('http');

// Create a simple webhook receiver
const server = http.createServer((req, res) => {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    console.log('\n=== WEBHOOK RECEIVED ===');
    console.log('Time:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', body);
    console.log('========================\n');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  });
});

server.listen(3004, () => {
  console.log('Debug webhook server listening on port 3004');
  console.log('Update WAHA webhook to: http://localhost:3004/webhook');
});