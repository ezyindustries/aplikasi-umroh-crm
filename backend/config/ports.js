/**
 * Port Configuration Registry
 * Centralized port management for all services
 * 
 * IMPORTANT: Check PORT-ALLOCATION.md before adding new ports
 */

const ports = {
  // Core Services
  backend: process.env.PORT || 3000,
  database: process.env.DB_PORT || 5432,
  redis: process.env.REDIS_PORT || 6379,
  frontend: process.env.FRONTEND_PORT || 8081,
  
  // Optional Services
  waha: process.env.WAHA_PORT || 3001,
  
  // Development & Testing
  testDb: process.env.TEST_DB_PORT || 5433,
  mockServer: process.env.MOCK_SERVER_PORT || 9001,
  debugger: process.env.DEBUGGER_PORT || 9229,
  
  // Future Services (reserved)
  elasticsearch: 9200,
  kibana: 5601,
  monitoring: 9090,
  metrics: 9091
};

/**
 * Check if a port is already allocated
 * @param {number} port - Port number to check
 * @returns {boolean|string} - false if available, service name if allocated
 */
const isPortAllocated = (port) => {
  for (const [service, allocatedPort] of Object.entries(ports)) {
    if (allocatedPort === port) {
      return service;
    }
  }
  return false;
};

/**
 * Get next available port in a range
 * @param {number} start - Start of port range
 * @param {number} end - End of port range
 * @returns {number|null} - Available port or null if none found
 */
const getAvailablePort = (start = 3000, end = 3999) => {
  for (let port = start; port <= end; port++) {
    if (!isPortAllocated(port)) {
      return port;
    }
  }
  return null;
};

/**
 * Port ranges for different service types
 */
const portRanges = {
  development: { start: 3000, end: 3999 },
  database: { start: 5000, end: 5999 },
  cache: { start: 6000, end: 6999 },
  frontend: { start: 8000, end: 8999 },
  testing: { start: 9000, end: 9999 }
};

/**
 * Reserved ports that should not be used
 */
const reservedPorts = [
  80,    // HTTP
  443,   // HTTPS
  3306,  // MySQL
  8080,  // Common dev port
  22,    // SSH
  21,    // FTP
  25,    // SMTP
  110,   // POP3
  143,   // IMAP
];

/**
 * Validate if a port can be used
 * @param {number} port - Port to validate
 * @returns {object} - { valid: boolean, reason?: string }
 */
const validatePort = (port) => {
  if (port < 1024) {
    return { valid: false, reason: 'System ports (< 1024) require admin privileges' };
  }
  
  if (port > 65535) {
    return { valid: false, reason: 'Port number exceeds maximum (65535)' };
  }
  
  if (reservedPorts.includes(port)) {
    return { valid: false, reason: 'Port is in reserved list' };
  }
  
  const allocated = isPortAllocated(port);
  if (allocated) {
    return { valid: false, reason: `Port already allocated to: ${allocated}` };
  }
  
  return { valid: true };
};

module.exports = {
  ports,
  isPortAllocated,
  getAvailablePort,
  portRanges,
  reservedPorts,
  validatePort
};