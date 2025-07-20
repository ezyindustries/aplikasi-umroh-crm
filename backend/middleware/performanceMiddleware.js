const performanceService = require('../services/performanceService');

// Request timing middleware
const requestTimer = (req, res, next) => {
  req.startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - req.startTime;
    
    // Add response time header
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Request size optimization
const optimizeRequestSize = (req, res, next) => {
  // Compress large request bodies
  if (req.headers['content-length'] && 
      parseInt(req.headers['content-length']) > 1024 * 1024) { // 1MB
    
    // Add compression headers
    res.setHeader('Content-Encoding', 'gzip');
  }
  
  next();
};

// Response optimization middleware
const optimizeResponse = (req, res, next) => {
  // Override res.json to optimize large responses
  const originalJson = res.json;
  
  res.json = function(data) {
    // Compress large responses
    if (Array.isArray(data) && data.length > 100) {
      data = performanceService.compressResult(data);
    }
    
    // Add caching headers for static-like data
    if (req.method === 'GET' && req.path.includes('/api/')) {
      // Cache GET requests for 5 minutes by default
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
    
    originalJson.call(this, data);
  };
  
  next();
};

// Database query optimization middleware
const optimizeDatabase = async (req, res, next) => {
  // Add database optimization utilities to request
  req.db = {
    // Cached query method
    cachedQuery: async (sql, params, cacheKey, ttl) => {
      return await performanceService.cachedQuery(sql, params, cacheKey, ttl);
    },
    
    // Bulk operations
    bulkInsert: async (tableName, columns, data, onConflict) => {
      return await performanceService.bulkInsert(tableName, columns, data, onConflict);
    },
    
    // Paginated queries
    paginate: (baseQuery, page, limit, orderBy) => {
      return performanceService.createPaginatedQuery(baseQuery, page, limit, orderBy);
    }
  };
  
  next();
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  
  // Log high memory usage
  if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn(`High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    
    // Trigger cleanup if memory is very high
    if (memUsage.heapUsed > 800 * 1024 * 1024) { // 800MB
      setImmediate(() => {
        performanceService.cleanupResources();
        global.gc && global.gc(); // Force garbage collection if available
      });
    }
  }
  
  next();
};

// API rate optimization
const optimizeApiRate = (req, res, next) => {
  // Skip optimization for certain endpoints
  const skipPaths = ['/health', '/metrics', '/docs'];
  if (skipPaths.some(path => req.path.includes(path))) {
    return next();
  }
  
  // Add performance headers
  res.setHeader('X-Powered-By', 'Umroh-API');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || 
                 require('crypto').randomUUID());
  
  next();
};

// Query parameter optimization
const optimizeQueryParams = (req, res, next) => {
  // Standardize pagination parameters
  if (req.query.page) {
    req.query.page = Math.max(1, parseInt(req.query.page) || 1);
  }
  
  if (req.query.limit) {
    req.query.limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  }
  
  // Clean up empty query parameters
  Object.keys(req.query).forEach(key => {
    if (req.query[key] === '' || req.query[key] === 'undefined') {
      delete req.query[key];
    }
  });
  
  next();
};

// Connection pooling optimization
const optimizeConnections = async (req, res, next) => {
  // Monitor database connection pool
  const poolStatus = performanceService.getPoolStatus();
  
  if (poolStatus && poolStatus.waitingCount > 5) {
    console.warn(`High database connection wait queue: ${poolStatus.waitingCount}`);
    
    // Add delay for non-critical requests
    if (!req.path.includes('/auth') && !req.path.includes('/health')) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  next();
};

// Request clustering optimization
const clusterRequests = (req, res, next) => {
  // Group similar requests together for batch processing
  const batchableEndpoints = ['/api/jamaah', '/api/payments', '/api/documents'];
  
  if (batchableEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    // Add batch processing flag
    req.batchable = true;
  }
  
  next();
};

// Response streaming for large datasets
const streamLargeResponses = (req, res, next) => {
  const originalJson = res.json;
  
  res.streamJson = function(data) {
    if (Array.isArray(data) && data.length > 1000) {
      // Stream large arrays in chunks
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked'
      });
      
      res.write('[');
      
      data.forEach((item, index) => {
        if (index > 0) res.write(',');
        res.write(JSON.stringify(item));
      });
      
      res.write(']');
      res.end();
    } else {
      originalJson.call(this, data);
    }
  };
  
  next();
};

// Performance metrics collection
const collectMetrics = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Collect metrics
    const metrics = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    };
    
    // Store metrics (in production, send to monitoring service)
    if (process.env.ENABLE_METRICS === 'true') {
      // Could send to Prometheus, InfluxDB, etc.
      console.log('API Metrics:', metrics);
    }
  });
  
  next();
};

module.exports = {
  requestTimer,
  optimizeRequestSize,
  optimizeResponse,
  optimizeDatabase,
  memoryMonitor,
  optimizeApiRate,
  optimizeQueryParams,
  optimizeConnections,
  clusterRequests,
  streamLargeResponses,
  collectMetrics
};