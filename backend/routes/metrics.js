const express = require('express');
const performanceService = require('../services/performanceService');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../services/auditService');

const router = express.Router();

// Prometheus-style metrics endpoint
router.get('/prometheus', async (req, res) => {
  try {
    const metrics = performanceService.getPerformanceMetrics();
    const poolStatus = performanceService.getPoolStatus();
    
    // Generate Prometheus format metrics
    let prometheusMetrics = '';
    
    // Application metrics
    prometheusMetrics += `# HELP umroh_app_uptime_seconds Application uptime in seconds\n`;
    prometheusMetrics += `# TYPE umroh_app_uptime_seconds counter\n`;
    prometheusMetrics += `umroh_app_uptime_seconds ${process.uptime()}\n\n`;
    
    prometheusMetrics += `# HELP umroh_app_memory_usage_bytes Memory usage in bytes\n`;
    prometheusMetrics += `# TYPE umroh_app_memory_usage_bytes gauge\n`;
    prometheusMetrics += `umroh_app_memory_usage_bytes ${process.memoryUsage().heapUsed}\n\n`;
    
    prometheusMetrics += `# HELP umroh_db_queries_total Total database queries executed\n`;
    prometheusMetrics += `# TYPE umroh_db_queries_total counter\n`;
    prometheusMetrics += `umroh_db_queries_total ${metrics.dbQueries}\n\n`;
    
    prometheusMetrics += `# HELP umroh_cache_hits_total Total cache hits\n`;
    prometheusMetrics += `# TYPE umroh_cache_hits_total counter\n`;
    prometheusMetrics += `umroh_cache_hits_total ${metrics.cacheHits}\n\n`;
    
    prometheusMetrics += `# HELP umroh_cache_misses_total Total cache misses\n`;
    prometheusMetrics += `# TYPE umroh_cache_misses_total counter\n`;
    prometheusMetrics += `umroh_cache_misses_total ${metrics.cacheMisses}\n\n`;
    
    prometheusMetrics += `# HELP umroh_avg_query_time_ms Average query time in milliseconds\n`;
    prometheusMetrics += `# TYPE umroh_avg_query_time_ms gauge\n`;
    prometheusMetrics += `umroh_avg_query_time_ms ${metrics.avgQueryTime}\n\n`;
    
    // Database connection pool metrics
    if (poolStatus) {
      prometheusMetrics += `# HELP umroh_db_pool_total_connections Total database connections\n`;
      prometheusMetrics += `# TYPE umroh_db_pool_total_connections gauge\n`;
      prometheusMetrics += `umroh_db_pool_total_connections ${poolStatus.totalCount}\n\n`;
      
      prometheusMetrics += `# HELP umroh_db_pool_idle_connections Idle database connections\n`;
      prometheusMetrics += `# TYPE umroh_db_pool_idle_connections gauge\n`;
      prometheusMetrics += `umroh_db_pool_idle_connections ${poolStatus.idleCount}\n\n`;
      
      prometheusMetrics += `# HELP umroh_db_pool_waiting_connections Waiting database connections\n`;
      prometheusMetrics += `# TYPE umroh_db_pool_waiting_connections gauge\n`;
      prometheusMetrics += `umroh_db_pool_waiting_connections ${poolStatus.waitingCount}\n\n`;
    }
    
    // Business metrics (would need to query database)
    try {
      const businessMetrics = await getBusinessMetrics();
      
      prometheusMetrics += `# HELP umroh_total_jamaah Total number of jamaah registered\n`;
      prometheusMetrics += `# TYPE umroh_total_jamaah gauge\n`;
      prometheusMetrics += `umroh_total_jamaah ${businessMetrics.totalJamaah}\n\n`;
      
      prometheusMetrics += `# HELP umroh_active_sessions Active user sessions\n`;
      prometheusMetrics += `# TYPE umroh_active_sessions gauge\n`;
      prometheusMetrics += `umroh_active_sessions ${businessMetrics.activeSessions}\n\n`;
      
      prometheusMetrics += `# HELP umroh_pending_payments Pending payment count\n`;
      prometheusMetrics += `# TYPE umroh_pending_payments gauge\n`;
      prometheusMetrics += `umroh_pending_payments ${businessMetrics.pendingPayments}\n\n`;
    } catch (error) {
      console.warn('Could not fetch business metrics:', error.message);
    }
    
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
    
  } catch (error) {
    console.error('Error generating Prometheus metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate metrics'
    });
  }
});

// Performance dashboard metrics (protected endpoint)
router.get('/dashboard', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const metrics = performanceService.getPerformanceMetrics();
    const poolStatus = performanceService.getPoolStatus();
    const healthStatus = await performanceService.healthCheck();
    
    // Get business metrics
    const businessMetrics = await getBusinessMetrics();
    
    // System metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    };
    
    await auditLog({
      action: 'metrics_accessed',
      userId: req.user.id,
      details: 'Dashboard metrics accessed',
      ip: req.ip
    });
    
    res.json({
      success: true,
      data: {
        performance: metrics,
        database: poolStatus,
        health: healthStatus,
        business: businessMetrics,
        system: systemMetrics,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard metrics'
    });
  }
});

// Real-time metrics for admin dashboard
router.get('/realtime', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Send initial metrics
    const sendMetrics = async () => {
      try {
        const metrics = performanceService.getPerformanceMetrics();
        const businessMetrics = await getBusinessMetrics();
        
        const data = {
          performance: metrics,
          business: businessMetrics,
          timestamp: new Date().toISOString()
        };
        
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Error sending real-time metrics:', error);
      }
    };
    
    // Send metrics every 5 seconds
    sendMetrics();
    const interval = setInterval(sendMetrics, 5000);
    
    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
    
    req.on('aborted', () => {
      clearInterval(interval);
      res.end();
    });
    
  } catch (error) {
    console.error('Error setting up real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup real-time metrics'
    });
  }
});

// Cache statistics
router.get('/cache', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const metrics = performanceService.getPerformanceMetrics();
    
    const cacheStats = {
      hits: metrics.cacheHits,
      misses: metrics.cacheMisses,
      hitRate: metrics.cacheHitRate || 0,
      totalOperations: metrics.cacheHits + metrics.cacheMisses
    };
    
    res.json({
      success: true,
      data: cacheStats
    });
    
  } catch (error) {
    console.error('Error fetching cache statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache statistics'
    });
  }
});

// Database performance metrics
router.get('/database', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const poolStatus = performanceService.getPoolStatus();
    const healthStatus = await performanceService.healthCheck();
    
    // Get database-specific metrics
    const dbMetrics = await performanceService.executeQuery(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        pool: poolStatus,
        health: healthStatus.database,
        statistics: dbMetrics,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching database metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database metrics'
    });
  }
});

// Helper function to get business metrics
async function getBusinessMetrics() {
  try {
    // Count total jamaah
    const jamaahResult = await performanceService.executeQuery(
      'SELECT COUNT(*) as count FROM jamaah'
    );
    
    // Count pending payments
    const paymentsResult = await performanceService.executeQuery(
      'SELECT COUNT(*) as count FROM payments WHERE status = $1',
      ['Pending']
    );
    
    // Count active packages
    const packagesResult = await performanceService.executeQuery(
      'SELECT COUNT(*) as count FROM packages WHERE is_active = true'
    );
    
    // Count recent documents
    const documentsResult = await performanceService.executeQuery(
      'SELECT COUNT(*) as count FROM documents WHERE created_at > NOW() - INTERVAL \'24 hours\''
    );
    
    return {
      totalJamaah: parseInt(jamaahResult[0]?.count || 0),
      pendingPayments: parseInt(paymentsResult[0]?.count || 0),
      activePackages: parseInt(packagesResult[0]?.count || 0),
      recentDocuments: parseInt(documentsResult[0]?.count || 0),
      activeSessions: getActiveSessionsCount() // From auth middleware
    };
    
  } catch (error) {
    console.error('Error fetching business metrics:', error);
    return {
      totalJamaah: 0,
      pendingPayments: 0,
      activePackages: 0,
      recentDocuments: 0,
      activeSessions: 0
    };
  }
}

// Helper function to get active sessions count
function getActiveSessionsCount() {
  try {
    const { getActiveSessionsForUser } = require('../middleware/auth');
    // This is a simplified count - in production, use Redis or database
    return Math.floor(Math.random() * 50); // Placeholder
  } catch (error) {
    return 0;
  }
}

module.exports = router;