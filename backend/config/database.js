const fs = require('fs').promises;
const path = require('path');

let db;

// Check if using SQLite for development/demo
const useSQLite = process.env.USE_SQLITE === 'true';

async function setupDatabase() {
  try {
    if (useSQLite) {
      // SQLite setup for development/demo
      const sqlite3 = require('sqlite3').verbose();
      const { open } = require('sqlite');
      
      db = await open({
        filename: process.env.SQLITE_PATH || './database.db',
        driver: sqlite3.Database
      });
      
      // Enable foreign keys
      await db.exec('PRAGMA foreign_keys = ON');
      
      console.log('SQLite database connected successfully');
    } else {
      // PostgreSQL setup for production
      const { Pool } = require('pg');
      
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'umroh_management',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
      
      db = new Pool(dbConfig);
      
      // Test connection
      const client = await db.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log('PostgreSQL database connected successfully');
    }
    
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function query(sql, params = []) {
  try {
    if (useSQLite) {
      if (sql.toLowerCase().includes('returning')) {
        // Handle RETURNING clause for SQLite
        const insertSql = sql.split(' RETURNING')[0];
        const result = await db.run(insertSql, params);
        return { rows: [{ id: result.lastID }] };
      } else if (sql.toLowerCase().startsWith('select')) {
        const rows = await db.all(sql, params);
        return { rows };
      } else {
        const result = await db.run(sql, params);
        return { 
          rows: [], 
          rowCount: result.changes,
          lastID: result.lastID 
        };
      }
    } else {
      return await db.query(sql, params);
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function getClient() {
  if (useSQLite) {
    return {
      query: query,
      release: () => {},
      begin: () => db.exec('BEGIN'),
      commit: () => db.exec('COMMIT'),
      rollback: () => db.exec('ROLLBACK')
    };
  } else {
    return await db.connect();
  }
}

async function closeDatabase() {
  try {
    if (useSQLite) {
      await db.close();
    } else {
      await db.end();
    }
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

// Export for both SQLite and PostgreSQL compatibility
module.exports = {
  setupDatabase,
  query,
  getClient,
  closeDatabase,
  db: () => db,
  useSQLite
};