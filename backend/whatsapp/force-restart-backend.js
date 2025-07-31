const { exec } = require('child_process');
const path = require('path');

console.log('Force restarting backend with cache clear...\n');

// Kill all node processes except the current one
exec('taskkill /F /IM node.exe /FI "PID ne ' + process.pid + '"', (err) => {
    if (err) {
        console.log('No other node processes found');
    }
    
    setTimeout(() => {
        console.log('Starting fresh backend...');
        
        // Clear require cache for controllers
        const controllerPath = path.join(__dirname, 'src', 'controllers', 'messageController.js');
        delete require.cache[require.resolve(controllerPath)];
        
        // Start the server
        exec('npm start', {
            cwd: __dirname,
            stdio: 'inherit'
        }, (error) => {
            if (error) {
                console.error('Error starting backend:', error);
            }
        });
        
        console.log('Backend starting... Please wait a few seconds.');
    }, 2000);
});