const { Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

let sequelize;
let db;

async function setupDatabase() {
  try {
    // PostgreSQL configuration for Docker environment
    const dbConfig = {
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'vauza_tamma_db',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 20,
        min: 0,
        acquire: 60000,
        idle: 10000
      },
      dialectOptions: {
        connectTimeout: 60000,
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      retry: {
        max: 3,
        timeout: 30000
      }
    };
    
    // Create Sequelize instance
    sequelize = new Sequelize(dbConfig);
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database connected successfully');
    
    // Create a compatibility layer for raw queries
    db = {
      sequelize,
      query: async (sql, params = []) => {
        try {
          const [results, metadata] = await sequelize.query(sql, {
            replacements: params,
            type: Sequelize.QueryTypes.SELECT
          });
          
          return {
            rows: results,
            rowCount: results.length,
            fields: metadata
          };
        } catch (error) {
          // For non-SELECT queries
          if (error.message && error.message.includes('result.length')) {
            const [result, metadata] = await sequelize.query(sql, {
              replacements: params,
              type: Sequelize.QueryTypes.RAW
            });
            
            return {
              rows: [],
              rowCount: metadata,
              affectedRows: metadata,
              insertId: result
            };
          }
          throw error;
        }
      },
      execute: async (sql, params = []) => {
        return db.query(sql, params);
      }
    };
    
    return sequelize;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

// Query wrapper for compatibility with MySQL code
async function query(sql, params = []) {
  try {
    // Convert MySQL placeholders (?) to PostgreSQL ($1, $2, etc)
    let pgSql = sql;
    let paramIndex = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', '$' + paramIndex);
      paramIndex++;
    }
    
    // Handle different query types
    const queryType = sql.trim().toUpperCase().split(' ')[0];
    
    if (queryType === 'SELECT') {
      const results = await sequelize.query(pgSql, {
        bind: params,
        type: Sequelize.QueryTypes.SELECT
      });
      
      return {
        rows: results,
        rowCount: results.length,
        fields: Object.keys(results[0] || {})
      };
    } else if (queryType === 'INSERT') {
      const [result, metadata] = await sequelize.query(pgSql + ' RETURNING id', {
        bind: params,
        type: Sequelize.QueryTypes.INSERT
      });
      
      return {
        rows: result,
        rowCount: 1,
        insertId: result[0]?.id || metadata
      };
    } else if (queryType === 'UPDATE' || queryType === 'DELETE') {
      const [result, metadata] = await sequelize.query(pgSql, {
        bind: params,
        type: queryType === 'UPDATE' ? Sequelize.QueryTypes.UPDATE : Sequelize.QueryTypes.DELETE
      });
      
      return {
        rows: [],
        rowCount: metadata,
        affectedRows: metadata
      };
    } else {
      // For other query types (CREATE, ALTER, etc)
      await sequelize.query(pgSql, {
        bind: params,
        type: Sequelize.QueryTypes.RAW
      });
      
      return {
        rows: [],
        rowCount: 0
      };
    }
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

// Get client for transaction support
async function getClient() {
  const transaction = await sequelize.transaction();
  
  return {
    query: async (sql, params) => {
      const result = await query(sql, params);
      return result;
    },
    release: () => {
      // Transaction will be handled by commit/rollback
    },
    begin: () => {
      // Transaction already started
    },
    commit: async () => {
      await transaction.commit();
    },
    rollback: async () => {
      await transaction.rollback();
    }
  };
}

// Close database connection
async function closeDatabase() {
  try {
    await sequelize.close();
    console.log('PostgreSQL database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

// Set user context for audit logging
async function setUserContext(userId, ipAddress) {
  try {
    // PostgreSQL way to set session variables
    await sequelize.query('SELECT set_config(:key1, :value1, false)', {
      replacements: { key1: 'app.current_user_id', value1: userId?.toString() || '' },
      type: Sequelize.QueryTypes.SELECT
    });
    
    await sequelize.query('SELECT set_config(:key2, :value2, false)', {
      replacements: { key2: 'app.current_ip', value2: ipAddress || '' },
      type: Sequelize.QueryTypes.SELECT
    });
  } catch (error) {
    console.error('Error setting user context:', error);
  }
}

// Helper function to convert MySQL queries to PostgreSQL
function convertMySQLToPostgreSQL(sql) {
  let pgSql = sql;
  
  // Replace MySQL-specific functions
  pgSql = pgSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
  pgSql = pgSql.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');
  pgSql = pgSql.replace(/IFNULL\(/gi, 'COALESCE(');
  pgSql = pgSql.replace(/`/g, '"'); // Replace backticks with double quotes
  pgSql = pgSql.replace(/LIMIT (\d+), (\d+)/gi, 'LIMIT $2 OFFSET $1'); // Convert LIMIT syntax
  pgSql = pgSql.replace(/AUTO_INCREMENT/gi, 'SERIAL');
  pgSql = pgSql.replace(/UNSIGNED/gi, '');
  pgSql = pgSql.replace(/TINYINT\(1\)/gi, 'BOOLEAN');
  pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
  
  return pgSql;
}

// Export for compatibility
module.exports = {
  setupDatabase,
  query,
  getClient,
  closeDatabase,
  setUserContext,
  sequelize: () => sequelize,
  db: () => db,
  convertMySQLToPostgreSQL
};