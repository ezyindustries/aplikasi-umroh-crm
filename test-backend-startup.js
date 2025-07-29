// Test if backend starts correctly
const path = require('path');

console.log('Testing backend startup...');
console.log('Current directory:', process.cwd());
console.log('Loading server.js from:', path.join(__dirname, 'backend/whatsapp/server.js'));

try {
  process.chdir('./backend/whatsapp');
  console.log('Changed to:', process.cwd());
  
  // Try to load server
  require('./server.js');
} catch (error) {
  console.error('Error starting server:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}