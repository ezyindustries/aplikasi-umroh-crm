const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');

let db;

async function setupDatabase() {
  try {
    // MySQL setup as specified in requirements
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || 'umroh_management',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      charset: 'utf8mb4',
      ssl: false
    };
    
    db = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await db.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    
    console.log('MySQL database connected successfully');
    
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function query(sql, params = []) {
  try {
    const [rows, fields] = await db.execute(sql, params);
    return { 
      rows: rows,
      fields: fields,
      rowCount: rows.affectedRows || rows.length,
      insertId: rows.insertId
    };
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

async function getClient() {
  const connection = await db.getConnection();
  return {
    query: async (sql, params) => {
      const [rows, fields] = await connection.execute(sql, params);
      return { rows, fields, rowCount: rows.affectedRows || rows.length };
    },
    release: () => connection.release(),
    begin: () => connection.beginTransaction(),
    commit: () => connection.commit(),
    rollback: () => connection.rollback()
  };
}

async function closeDatabase() {
  try {
    await db.end();
    console.log('MySQL database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

// Set user context for audit logging
async function setUserContext(userId, ipAddress) {
  await query('SET @current_user_id = ?', [userId]);
  await query('SET @current_ip = ?', [ipAddress]);
}

// Export for MySQL compatibility
module.exports = {
  setupDatabase,
  query,
  getClient,
  closeDatabase,
  setUserContext,
  db: () => db
};