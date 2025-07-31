const { exec } = require('child_process');
const { spawn } = require('child_process');

// Kill existing backend
console.log('Stopping existing backend...');
exec('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :3001 ^| findstr LISTENING\') do taskkill /F /PID %a', (error) => {
  if (error && !error.message.includes('not found')) {
    console.error('Error killing process:', error);
  }
  
  // Wait a bit
  setTimeout(() => {
    console.log('Starting backend with media handling...');
    
    // Start the server
    const server = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    server.on('error', (err) => {
      console.error('Failed to start server:', err);
    });
  }, 2000);
});