const { Pool } = require('pg');
const Redis = require('redis');

class PerformanceService {
  constructor() {
    this.dbPool = null;
    this.redisClient = null;
    this.queryCache = new Map();
    this.performanceMetrics = {
      dbQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgQueryTime: 0
    };
  }

  // Initialize performance monitoring
  async initialize() {
    try {
      // Setup database connection pool
      this.dbPool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Setup Redis client for caching
      if (process.env.REDIS_HOST) {
        this.redisClient = Redis.createClient({
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
          retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              return new Error('Redis server refused connection');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              return new Error('Redis retry time exhausted');
            }
            if (options.attempt > 10) {
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });

        this.redisClient.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });
      }

      console.log('Performance service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize performance service:', error);
    }
  }

  // Cached database query with performance monitoring
  async cachedQuery(sql, params = [], cacheKey = null, ttl = 300) {
    const startTime = Date.now();
    
    try {
      // Generate cache key if not provided
      if (!cacheKey) {
        cacheKey = this.generateCacheKey(sql, params);
      }

      // Try to get from cache first
      const cachedResult = await this.getFromCache(cacheKey);
      if (cachedResult) {
        this.performanceMetrics.cacheHits++;
        return JSON.parse(cachedResult);
      }

      // Execute database query
      const result = await this.executeQuery(sql, params);
      
      // Cache the result
      await this.setCache(cacheKey, JSON.stringify(result), ttl);
      
      this.performanceMetrics.cacheMisses++;
      return result;

    } catch (error) {
      console.error('Cached query error:', error);
      throw error;
    } finally {
      const queryTime = Date.now() - startTime;
      this.updateQueryMetrics(queryTime);
    }
  }

  // Execute database query with connection pooling
  async executeQuery(sql, params = []) {
    const client = await this.dbPool.connect();
    try {
      const result = await client.query(sql, params);
      this.performanceMetrics.dbQueries++;
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Cache operations
  async getFromCache(key) {
    if (!this.redisClient) {
      return this.queryCache.get(key);
    }
    
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setCache(key, value, ttl = 300) {
    if (!this.redisClient) {
      this.queryCache.set(key, value);
      // Simple TTL for in-memory cache
      setTimeout(() => this.queryCache.delete(key), ttl * 1000);
      return;
    }
    
    try {
      await this.redisClient.setex(key, ttl, value);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async clearCache(pattern = '*') {
    if (!this.redisClient) {
      this.queryCache.clear();
      return;
    }
    
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Generate cache key from SQL and parameters
  generateCacheKey(sql, params) {
    const crypto = require('crypto');
    const key = sql + JSON.stringify(params);
    return crypto.createHash('md5').update(key).digest('hex');
  }

  // Update query performance metrics
  updateQueryMetrics(queryTime) {
    const currentAvg = this.performanceMetrics.avgQueryTime;
    const totalQueries = this.performanceMetrics.dbQueries;
    
    this.performanceMetrics.avgQueryTime = 
      (currentAvg * (totalQueries - 1) + queryTime) / totalQueries;
  }

  // Performance monitoring utilities
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.cacheHits / 
                   (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100,
      timestamp: new Date().toISOString()
    };
  }

  // Database query optimization helpers
  async optimizeQuery(sql, params = []) {
    // Add EXPLAIN ANALYZE for query optimization
    const explainSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`;
    
    try {
      const result = await this.executeQuery(explainSql, params);
      return result[0]['QUERY PLAN'];
    } catch (error) {
      console.error('Query optimization error:', error);
      return null;
    }
  }

  // Bulk operations for better performance
  async bulkInsert(tableName, columns, data, onConflict = null) {
    if (!data || data.length === 0) return [];

    const columnNames = columns.join(', ');
    const valuePlaceholders = data.map((_, index) => {
      const rowPlaceholders = columns.map((_, colIndex) => 
        `$${index * columns.length + colIndex + 1}`
      ).join(', ');
      return `(${rowPlaceholders})`;
    }).join(', ');

    const flatValues = data.flat();
    
    let sql = `INSERT INTO ${tableName} (${columnNames}) VALUES ${valuePlaceholders}`;
    
    if (onConflict) {
      sql += ` ${onConflict}`;
    }
    
    sql += ' RETURNING *';

    return await this.executeQuery(sql, flatValues);
  }

  // Pagination optimization
  createPaginatedQuery(baseQuery, page = 1, limit = 20, orderBy = 'id ASC') {
    const offset = (page - 1) * limit;
    
    return {
      query: `${baseQuery} ORDER BY ${orderBy} LIMIT $${baseQuery.split('$').length} OFFSET $${baseQuery.split('$').length + 1}`,
      params: [limit, offset]
    };
  }

  // Connection pool monitoring
  getPoolStatus() {
    if (!this.dbPool) return null;
    
    return {
      totalCount: this.dbPool.totalCount,
      idleCount: this.dbPool.idleCount,
      waitingCount: this.dbPool.waitingCount
    };
  }

  // Memory usage optimization
  async cleanupResources() {
    // Clear old cache entries
    if (this.queryCache.size > 1000) {
      this.queryCache.clear();
    }

    // Reset metrics if they get too large
    if (this.performanceMetrics.dbQueries > 1000000) {
      this.performanceMetrics = {
        dbQueries: 0,
        cacheHits: 0,
        cacheMisses: 0,
        avgQueryTime: 0
      };
    }
  }

  // Query result compression for large datasets
  compressResult(data) {
    if (data.length < 100) return data;
    
    // Simple compression: remove null fields for large datasets
    return data.map(row => {
      const compressed = {};
      Object.keys(row).forEach(key => {
        if (row[key] !== null && row[key] !== undefined) {
          compressed[key] = row[key];
        }
      });
      return compressed;
    });
  }

  // Database health check
  async healthCheck() {
    try {
      const result = await this.executeQuery('SELECT 1 as health');
      return {
        database: result.length > 0,
        redis: this.redisClient ? await this.redisClient.ping() === 'PONG' : false,
        pool: this.getPoolStatus()
      };
    } catch (error) {
      return {
        database: false,
        redis: false,
        error: error.message
      };
    }
  }

  // Graceful shutdown
  async shutdown() {
    try {
      if (this.dbPool) {
        await this.dbPool.end();
      }
      
      if (this.redisClient) {
        this.redisClient.quit();
      }
      
      console.log('Performance service shutdown completed');
    } catch (error) {
      console.error('Error during performance service shutdown:', error);
    }
  }
}

// Export singleton instance
const performanceService = new PerformanceService();

module.exports = performanceService;