#!/usr/bin/env node

/**
 * Port Checker Utility
 * Check port availability before starting services
 */

const net = require('net');
const { ports, validatePort } = require('../backend/config/ports');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Check if a port is in use
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - true if in use, false if available
 */
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port, '0.0.0.0');
  });
};

/**
 * Check all configured ports
 */
const checkAllPorts = async () => {
  console.log(`${colors.cyan}🔍 Checking Port Availability...${colors.reset}\n`);
  console.log(`${'Service'.padEnd(20)} ${'Port'.padEnd(10)} ${'Status'.padEnd(15)} Notes`);
  console.log('─'.repeat(70));
  
  let hasConflicts = false;
  
  for (const [service, port] of Object.entries(ports)) {
    if (typeof port !== 'number') continue;
    
    const inUse = await isPortInUse(port);
    
    let status = '';
    let notes = '';
    
    if (inUse) {
      status = `${colors.yellow}⚠️  IN USE${colors.reset}`;
      notes = 'Currently being used (might be by our service)';
      // Don't mark as conflict if it's our own service
    } else {
      status = `${colors.green}✅ AVAILABLE${colors.reset}`;
    }
    
    console.log(
      `${service.padEnd(20)} ${port.toString().padEnd(10)} ${status.padEnd(25)} ${notes}`
    );
  }
  
  console.log('\n' + '─'.repeat(70));
  
  if (hasConflicts) {
    console.log(`${colors.red}⚠️  Port conflicts detected! Please resolve before starting services.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ Port check completed!${colors.reset}`);
  }
};

/**
 * Check specific port
 */
const checkPort = async (portNum) => {
  const port = parseInt(portNum);
  if (isNaN(port)) {
    console.error(`${colors.red}Error: Invalid port number${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`\n${colors.cyan}Checking port ${port}...${colors.reset}\n`);
  
  const validation = validatePort(port);
  if (!validation.valid) {
    console.log(`${colors.red}❌ Port ${port} is invalid: ${validation.reason}${colors.reset}`);
    process.exit(1);
  }
  
  const inUse = await isPortInUse(port);
  if (inUse) {
    console.log(`${colors.red}❌ Port ${port} is already in use${colors.reset}`);
    
    // Try to find what's using it (Windows)
    if (process.platform === 'win32') {
      console.log(`\n${colors.yellow}Run this command to find what's using the port:${colors.reset}`);
      console.log(`netstat -ano | findstr :${port}`);
    } else {
      console.log(`\n${colors.yellow}Run this command to find what's using the port:${colors.reset}`);
      console.log(`lsof -i :${port}`);
    }
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ Port ${port} is available${colors.reset}`);
  }
};

/**
 * Find next available port in range
 */
const findAvailablePort = async (start, end) => {
  console.log(`\n${colors.cyan}Finding available port between ${start}-${end}...${colors.reset}\n`);
  
  for (let port = start; port <= end; port++) {
    const validation = validatePort(port);
    if (!validation.valid) continue;
    
    const inUse = await isPortInUse(port);
    if (!inUse) {
      console.log(`${colors.green}✅ Found available port: ${port}${colors.reset}`);
      return port;
    }
  }
  
  console.log(`${colors.red}❌ No available ports found in range ${start}-${end}${colors.reset}`);
  return null;
};

// CLI handling
const args = process.argv.slice(2);

if (args.length === 0) {
  checkAllPorts();
} else if (args[0] === '--check' && args[1]) {
  checkPort(args[1]);
} else if (args[0] === '--find' && args[1] && args[2]) {
  findAvailablePort(parseInt(args[1]), parseInt(args[2]));
} else {
  console.log(`
${colors.cyan}Port Checker Utility${colors.reset}

Usage:
  node check-ports.js              Check all configured ports
  node check-ports.js --check PORT Check specific port
  node check-ports.js --find START END  Find available port in range

Examples:
  node check-ports.js
  node check-ports.js --check 3000
  node check-ports.js --find 3000 3999
  `);
}