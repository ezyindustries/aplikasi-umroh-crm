const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { query } = require('../config/database');
const { setupLogging } = require('../config/logging');
const logger = setupLogging();

class MonitoringService {
  constructor() {
    this.metrics = {
      system: {},
      database: {},
      application: {},
      alerts: []
    };
    
    this.thresholds = {
      cpu: 80, // 80%
      memory: 85, // 85%
      disk: 90, // 90%
      dbConnections: 80, // 80% of max connections
      responseTime: 2000, // 2 seconds
      errorRate: 5 // 5%
    };

    this.initializeMonitoring();
  }

  initializeMonitoring() {
    // Start monitoring intervals
    setInterval(() => this.collectSystemMetrics(), 30000); // Every 30 seconds
    setInterval(() => this.collectDatabaseMetrics(), 60000); // Every minute
    setInterval(() => this.collectApplicationMetrics(), 60000); // Every minute
    setInterval(() => this.checkAlerts(), 120000); // Every 2 minutes
    setInterval(() => this.cleanupOldMetrics(), 3600000); // Every hour

    logger.info('System monitoring initialized');
  }

  // Collect system metrics (CPU, Memory, Disk)
  async collectSystemMetrics() {
    try {
      const cpuUsage = await this.getCPUUsage();
      const memoryUsage = this.getMemoryUsage();
      const diskUsage = await this.getDiskUsage();
      const networkStats = this.getNetworkStats();

      this.metrics.system = {
        timestamp: new Date(),
        cpu: {
          usage: cpuUsage,
          cores: os.cpus().length,
          loadAvg: os.loadavg()
        },
        memory: memoryUsage,
        disk: diskUsage,
        network: networkStats,
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch()
      };

      // Store in database for historical tracking
      await this.storeSystemMetrics(this.metrics.system);
    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  }

  // Get CPU usage percentage
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startMeasure = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endMeasure = process.cpuUsage(startMeasure);
        const endTime = Date.now();
        const totalTime = (endTime - startTime) * 1000; // Convert to microseconds

        const userPercent = (endMeasure.user / totalTime) * 100;
        const systemPercent = (endMeasure.system / totalTime) * 100;
        const totalPercent = userPercent + systemPercent;

        resolve(Math.min(100, Math.max(0, totalPercent)));
      }, 100);
    });
  }

  // Get memory usage
  getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    const processMemory = process.memoryUsage();

    return {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usagePercent: (usedMem / totalMem) * 100,
      process: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external
      }
    };
  }

  // Get disk usage
  async getDiskUsage() {
    try {
      const stats = await fs.stat(__dirname);
      // This is a simplified version - in production, you'd use a library like 'df' or 'node-disk-info'
      return {
        total: 0,
        free: 0,
        used: 0,
        usagePercent: 0
      };
    } catch (error) {
      return { total: 0, free: 0, used: 0, usagePercent: 0 };
    }
  }

  // Get network statistics
  getNetworkStats() {
    const networkInterfaces = os.networkInterfaces();
    const stats = {
      interfaces: Object.keys(networkInterfaces).length,
      activeConnections: 0
    };

    return stats;
  }

  // Collect database metrics
  async collectDatabaseMetrics() {
    try {
      // Database connection info
      const connectionInfo = await query(`
        SELECT 
          count(*) as total_connections,
          count(*) filter (where state = 'active') as active_connections,
          count(*) filter (where state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      // Database size
      const dbSize = await query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);

      // Table statistics
      const tableStats = await query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `);

      // Query performance
      const slowQueries = await query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          max_time
        FROM pg_stat_statements
        WHERE calls > 10
        ORDER BY mean_time DESC
        LIMIT 5
      `).catch(() => ({ rows: [] })); // pg_stat_statements might not be enabled

      this.metrics.database = {
        timestamp: new Date(),
        connections: connectionInfo.rows[0],
        size: dbSize.rows[0].size,
        tables: tableStats.rows,
        slowQueries: slowQueries.rows,
        uptime: await this.getDatabaseUptime()
      };

      await this.storeDatabaseMetrics(this.metrics.database);
    } catch (error) {
      logger.error('Failed to collect database metrics:', error);
    }
  }

  // Get database uptime
  async getDatabaseUptime() {
    try {
      const result = await query(`
        SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) as uptime
      `);
      return result.rows[0].uptime;
    } catch (error) {
      return null;
    }
  }

  // Collect application metrics
  async collectApplicationMetrics() {
    try {
      // Get record counts from main tables
      const recordCounts = await query(`
        SELECT 
          (SELECT count(*) FROM jamaah WHERE is_deleted = false) as jamaah_count,
          (SELECT count(*) FROM payments) as payments_count,
          (SELECT count(*) FROM packages WHERE is_active = true) as active_packages,
          (SELECT count(*) FROM groups) as groups_count,
          (SELECT count(*) FROM users WHERE is_active = true) as active_users,
          (SELECT count(*) FROM documents) as documents_count
      `);

      // Get recent activity
      const recentActivity = await query(`
        SELECT 
          action,
          count(*) as count
        FROM audit_logs 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        GROUP BY action
      `);

      // Get error logs from last hour (if you have error logging)
      const errorCount = await query(`
        SELECT count(*) as error_count
        FROM audit_logs 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        AND description ILIKE '%error%'
      `);

      this.metrics.application = {
        timestamp: new Date(),
        records: recordCounts.rows[0],
        recentActivity: recentActivity.rows,
        errorCount: errorCount.rows[0].error_count,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      };

      await this.storeApplicationMetrics(this.metrics.application);
    } catch (error) {
      logger.error('Failed to collect application metrics:', error);
    }
  }

  // Check for alerts based on thresholds
  async checkAlerts() {
    try {
      const alerts = [];
      const now = new Date();

      // CPU alert
      if (this.metrics.system.cpu?.usage > this.thresholds.cpu) {
        alerts.push({
          type: 'warning',
          category: 'system',
          message: `High CPU usage: ${this.metrics.system.cpu.usage.toFixed(2)}%`,
          threshold: this.thresholds.cpu,
          current: this.metrics.system.cpu.usage,
          timestamp: now
        });
      }

      // Memory alert
      if (this.metrics.system.memory?.usagePercent > this.thresholds.memory) {
        alerts.push({
          type: 'warning',
          category: 'system',
          message: `High memory usage: ${this.metrics.system.memory.usagePercent.toFixed(2)}%`,
          threshold: this.thresholds.memory,
          current: this.metrics.system.memory.usagePercent,
          timestamp: now
        });
      }

      // Database connections alert
      const dbConnections = this.metrics.database.connections?.total_connections || 0;
      const maxConnections = 100; // Default PostgreSQL max_connections
      const connectionPercent = (dbConnections / maxConnections) * 100;
      
      if (connectionPercent > this.thresholds.dbConnections) {
        alerts.push({
          type: 'warning',
          category: 'database',
          message: `High database connections: ${dbConnections}/${maxConnections} (${connectionPercent.toFixed(2)}%)`,
          threshold: this.thresholds.dbConnections,
          current: connectionPercent,
          timestamp: now
        });
      }

      // Error rate alert
      const errorCount = this.metrics.application.errorCount || 0;
      if (errorCount > this.thresholds.errorRate) {
        alerts.push({
          type: 'error',
          category: 'application',
          message: `High error rate: ${errorCount} errors in the last hour`,
          threshold: this.thresholds.errorRate,
          current: errorCount,
          timestamp: now
        });
      }

      this.metrics.alerts = alerts;

      // Log critical alerts
      alerts.filter(alert => alert.type === 'error').forEach(alert => {
        logger.error(`ALERT: ${alert.message}`);
      });

      // Store alerts in database
      if (alerts.length > 0) {
        await this.storeAlerts(alerts);
      }
    } catch (error) {
      logger.error('Failed to check alerts:', error);
    }
  }

  // Store system metrics in database
  async storeSystemMetrics(metrics) {
    try {
      await query(`
        INSERT INTO system_metrics (
          timestamp, cpu_usage, memory_usage, memory_total, uptime, load_avg
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        metrics.timestamp,
        metrics.cpu.usage,
        metrics.memory.usagePercent,
        metrics.memory.total,
        metrics.uptime,
        JSON.stringify(metrics.cpu.loadAvg)
      ]);
    } catch (error) {
      // Table might not exist, which is fine for now
    }
  }

  // Store database metrics
  async storeDatabaseMetrics(metrics) {
    try {
      await query(`
        INSERT INTO database_metrics (
          timestamp, total_connections, active_connections, database_size
        ) VALUES ($1, $2, $3, $4)
      `, [
        metrics.timestamp,
        metrics.connections.total_connections,
        metrics.connections.active_connections,
        metrics.size
      ]);
    } catch (error) {
      // Table might not exist, which is fine for now
    }
  }

  // Store application metrics
  async storeApplicationMetrics(metrics) {
    try {
      await query(`
        INSERT INTO application_metrics (
          timestamp, jamaah_count, payments_count, active_packages, groups_count, error_count
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        metrics.timestamp,
        metrics.records.jamaah_count,
        metrics.records.payments_count,
        metrics.records.active_packages,
        metrics.records.groups_count,
        metrics.errorCount
      ]);
    } catch (error) {
      // Table might not exist, which is fine for now
    }
  }

  // Store alerts
  async storeAlerts(alerts) {
    try {
      for (const alert of alerts) {
        await query(`
          INSERT INTO system_alerts (
            timestamp, type, category, message, threshold_value, current_value
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          alert.timestamp,
          alert.type,
          alert.category,
          alert.message,
          alert.threshold,
          alert.current
        ]);
      }
    } catch (error) {
      // Table might not exist, which is fine for now
    }
  }

  // Clean up old metrics (keep last 7 days)
  async cleanupOldMetrics() {
    try {
      const cutoffDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
      
      await query(`DELETE FROM system_metrics WHERE timestamp < $1`, [cutoffDate]);
      await query(`DELETE FROM database_metrics WHERE timestamp < $1`, [cutoffDate]);
      await query(`DELETE FROM application_metrics WHERE timestamp < $1`, [cutoffDate]);
      await query(`DELETE FROM system_alerts WHERE timestamp < $1`, [cutoffDate]);
    } catch (error) {
      // Tables might not exist, which is fine
    }
  }

  // Get current health status
  getHealthStatus() {
    const now = new Date();
    const health = {
      status: 'healthy',
      timestamp: now,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      components: {}
    };

    // Check system health
    if (this.metrics.system.cpu?.usage > this.thresholds.cpu || 
        this.metrics.system.memory?.usagePercent > this.thresholds.memory) {
      health.status = 'degraded';
    }

    // Check database health
    const dbConnections = this.metrics.database.connections?.total_connections || 0;
    if (dbConnections > 50) { // Assume 50 is concerning
      health.status = 'degraded';
    }

    // Check for critical alerts
    const criticalAlerts = this.metrics.alerts.filter(alert => alert.type === 'error');
    if (criticalAlerts.length > 0) {
      health.status = 'unhealthy';
    }

    health.components = {
      system: {
        status: this.metrics.system.cpu?.usage > this.thresholds.cpu ? 'degraded' : 'healthy',
        cpu: this.metrics.system.cpu?.usage,
        memory: this.metrics.system.memory?.usagePercent
      },
      database: {
        status: 'healthy',
        connections: this.metrics.database.connections?.total_connections,
        size: this.metrics.database.size
      },
      application: {
        status: this.metrics.application.errorCount > this.thresholds.errorRate ? 'degraded' : 'healthy',
        errors: this.metrics.application.errorCount,
        records: this.metrics.application.records
      }
    };

    return health;
  }

  // Get detailed metrics
  getDetailedMetrics() {
    return {
      timestamp: new Date(),
      system: this.metrics.system,
      database: this.metrics.database,
      application: this.metrics.application,
      alerts: this.metrics.alerts,
      thresholds: this.thresholds
    };
  }

  // Update thresholds
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Monitoring thresholds updated:', newThresholds);
  }

  // Get historical metrics
  async getHistoricalMetrics(hours = 24) {
    try {
      const cutoffDate = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      const systemMetrics = await query(`
        SELECT * FROM system_metrics 
        WHERE timestamp >= $1 
        ORDER BY timestamp DESC
      `, [cutoffDate]).catch(() => ({ rows: [] }));

      const databaseMetrics = await query(`
        SELECT * FROM database_metrics 
        WHERE timestamp >= $1 
        ORDER BY timestamp DESC
      `, [cutoffDate]).catch(() => ({ rows: [] }));

      const applicationMetrics = await query(`
        SELECT * FROM application_metrics 
        WHERE timestamp >= $1 
        ORDER BY timestamp DESC
      `, [cutoffDate]).catch(() => ({ rows: [] }));

      const alerts = await query(`
        SELECT * FROM system_alerts 
        WHERE timestamp >= $1 
        ORDER BY timestamp DESC
      `, [cutoffDate]).catch(() => ({ rows: [] }));

      return {
        system: systemMetrics.rows,
        database: databaseMetrics.rows,
        application: applicationMetrics.rows,
        alerts: alerts.rows
      };
    } catch (error) {
      logger.error('Failed to get historical metrics:', error);
      return { system: [], database: [], application: [], alerts: [] };
    }
  }
}

module.exports = new MonitoringService();