const monitoringService = require('../services/monitoringService');
const { logActivity } = require('../utils/activityLogger');

class MonitoringController {

  // Get system health status
  static async getHealth(req, res, next) {
    try {
      const health = monitoringService.getHealthStatus();

      // Log health check access
      await logActivity(req.user?.id, 'monitoring', 'health', 'Health check accessed', req.ip);

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      next(error);
    }
  }

  // Get detailed system metrics
  static async getMetrics(req, res, next) {
    try {
      const metrics = monitoringService.getDetailedMetrics();

      await logActivity(req.user.id, 'monitoring', 'metrics', 'System metrics accessed', req.ip);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }

  // Get historical metrics
  static async getHistoricalMetrics(req, res, next) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const metrics = await monitoringService.getHistoricalMetrics(hours);

      await logActivity(req.user.id, 'monitoring', 'historical', `Historical metrics accessed (${hours}h)`, req.ip);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }

  // Update monitoring thresholds
  static async updateThresholds(req, res, next) {
    try {
      const { thresholds } = req.body;
      
      if (!thresholds || typeof thresholds !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Thresholds object is required'
        });
      }

      monitoringService.updateThresholds(thresholds);

      await logActivity(req.user.id, 'monitoring', 'config', 'Monitoring thresholds updated', req.ip);

      res.json({
        success: true,
        message: 'Thresholds updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get system information
  static async getSystemInfo(req, res, next) {
    try {
      const os = require('os');
      const process = require('process');
      
      const systemInfo = {
        server: {
          hostname: os.hostname(),
          platform: os.platform(),
          arch: os.arch(),
          uptime: os.uptime(),
          loadAverage: os.loadavg(),
          cpus: os.cpus().length,
          totalMemory: os.totalmem(),
          freeMemory: os.freemem()
        },
        process: {
          pid: process.pid,
          version: process.version,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          env: process.env.NODE_ENV || 'development'
        },
        application: {
          name: 'Aplikasi Manajemen Umroh',
          version: process.env.npm_package_version || '1.0.0',
          startTime: new Date(Date.now() - (process.uptime() * 1000))
        }
      };

      await logActivity(req.user.id, 'monitoring', 'info', 'System information accessed', req.ip);

      res.json({
        success: true,
        data: systemInfo
      });
    } catch (error) {
      next(error);
    }
  }

  // Get database status
  static async getDatabaseStatus(req, res, next) {
    try {
      const { query } = require('../config/database');
      
      // Test database connection
      const startTime = Date.now();
      await query('SELECT 1 as test');
      const responseTime = Date.now() - startTime;

      // Get database version
      const versionResult = await query('SELECT version()');
      
      // Get database size
      const sizeResult = await query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);

      // Get connection stats
      const connectionStats = await query(`
        SELECT 
          count(*) as total_connections,
          count(*) filter (where state = 'active') as active_connections,
          count(*) filter (where state = 'idle') as idle_connections,
          count(*) filter (where state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      const dbStatus = {
        connected: true,
        responseTime: responseTime,
        version: versionResult.rows[0].version,
        size: sizeResult.rows[0].size,
        connections: connectionStats.rows[0]
      };

      await logActivity(req.user.id, 'monitoring', 'database', 'Database status checked', req.ip);

      res.json({
        success: true,
        data: dbStatus
      });
    } catch (error) {
      const dbStatus = {
        connected: false,
        error: error.message,
        responseTime: null
      };

      res.status(503).json({
        success: false,
        data: dbStatus,
        error: 'Database connection failed'
      });
    }
  }

  // Run system diagnostics
  static async runDiagnostics(req, res, next) {
    try {
      const diagnostics = {
        timestamp: new Date(),
        tests: []
      };

      // Test 1: Database connectivity
      try {
        const { query } = require('../config/database');
        const startTime = Date.now();
        await query('SELECT 1');
        const responseTime = Date.now() - startTime;
        
        diagnostics.tests.push({
          name: 'Database Connectivity',
          status: 'pass',
          responseTime: responseTime,
          message: `Database responding in ${responseTime}ms`
        });
      } catch (error) {
        diagnostics.tests.push({
          name: 'Database Connectivity',
          status: 'fail',
          error: error.message,
          message: 'Database connection failed'
        });
      }

      // Test 2: File system access
      try {
        const fs = require('fs').promises;
        const testFile = require('path').join(__dirname, '../../test-write.txt');
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        
        diagnostics.tests.push({
          name: 'File System Access',
          status: 'pass',
          message: 'File system read/write working'
        });
      } catch (error) {
        diagnostics.tests.push({
          name: 'File System Access',
          status: 'fail',
          error: error.message,
          message: 'File system access failed'
        });
      }

      // Test 3: Memory usage
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      
      diagnostics.tests.push({
        name: 'Memory Usage',
        status: heapUsedMB < 500 ? 'pass' : 'warn',
        value: `${heapUsedMB.toFixed(2)} MB`,
        message: `Heap memory usage: ${heapUsedMB.toFixed(2)} MB`
      });

      // Test 4: Required directories
      const requiredDirs = ['uploads', 'exports', 'backups'];
      for (const dir of requiredDirs) {
        try {
          const fs = require('fs').promises;
          const dirPath = require('path').join(__dirname, '../../', dir);
          await fs.access(dirPath);
          
          diagnostics.tests.push({
            name: `Directory: ${dir}`,
            status: 'pass',
            message: `Directory ${dir} exists and accessible`
          });
        } catch (error) {
          diagnostics.tests.push({
            name: `Directory: ${dir}`,
            status: 'fail',
            error: error.message,
            message: `Directory ${dir} not accessible`
          });
        }
      }

      // Overall status
      const failedTests = diagnostics.tests.filter(test => test.status === 'fail');
      const warnTests = diagnostics.tests.filter(test => test.status === 'warn');
      
      diagnostics.overallStatus = failedTests.length > 0 ? 'fail' : 
                                  warnTests.length > 0 ? 'warn' : 'pass';
      
      diagnostics.summary = {
        total: diagnostics.tests.length,
        passed: diagnostics.tests.filter(test => test.status === 'pass').length,
        warnings: warnTests.length,
        failed: failedTests.length
      };

      await logActivity(req.user.id, 'monitoring', 'diagnostics', 
        `System diagnostics completed: ${diagnostics.overallStatus}`, req.ip);

      res.json({
        success: true,
        data: diagnostics
      });
    } catch (error) {
      next(error);
    }
  }

  // Get application logs
  static async getLogs(req, res, next) {
    try {
      const { level = 'info', limit = 100, hours = 24 } = req.query;
      const cutoffDate = new Date(Date.now() - (hours * 60 * 60 * 1000));

      // Get audit logs as application logs
      const { query } = require('../config/database');
      const logs = await query(`
        SELECT 
          al.id,
          al.action,
          al.resource_type,
          al.description,
          u.full_name as user_name,
          al.ip_address,
          al.created_at
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.created_at >= $1
        ORDER BY al.created_at DESC
        LIMIT $2
      `, [cutoffDate, parseInt(limit)]);

      await logActivity(req.user.id, 'monitoring', 'logs', 
        `Application logs accessed (${hours}h, limit: ${limit})`, req.ip);

      res.json({
        success: true,
        data: {
          logs: logs.rows,
          filters: { level, limit, hours },
          total: logs.rows.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Simple health check for load balancers (no auth required)
  static async simpleHealthCheck(req, res, next) {
    try {
      const health = monitoringService.getHealthStatus();
      
      if (health.status === 'healthy') {
        res.status(200).json({ status: 'ok', timestamp: new Date() });
      } else if (health.status === 'degraded') {
        res.status(200).json({ status: 'degraded', timestamp: new Date() });
      } else {
        res.status(503).json({ status: 'unhealthy', timestamp: new Date() });
      }
    } catch (error) {
      res.status(503).json({ status: 'error', timestamp: new Date(), error: error.message });
    }
  }
}

module.exports = MonitoringController;