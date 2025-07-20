// Test setup and configuration
const { setupDatabase, closeDatabase } = require('../config/database');
const bcrypt = require('bcryptjs');

// Test database setup
const setupTestDatabase = async () => {
  try {
    // Use in-memory SQLite for tests
    process.env.USE_SQLITE = 'true';
    process.env.SQLITE_PATH = ':memory:';
    process.env.NODE_ENV = 'test';
    
    await setupDatabase();
    
    // Create test data
    await createTestData();
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
};

const createTestData = async () => {
  const { query } = require('../config/database');
  
  // Create test tables
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'User',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(15,2) NOT NULL,
      capacity INTEGER NOT NULL,
      occupied INTEGER DEFAULT 0,
      departure_date DATE NOT NULL,
      return_date DATE NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS jamaah (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name VARCHAR(255) NOT NULL,
      nik VARCHAR(16) UNIQUE NOT NULL,
      passport_number VARCHAR(50) UNIQUE,
      birth_date DATE NOT NULL,
      gender VARCHAR(20) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100),
      address TEXT,
      package_id INTEGER,
      status VARCHAR(50) DEFAULT 'Terdaftar',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jamaah_id INTEGER NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      payment_type VARCHAR(50) DEFAULT 'DP',
      payment_method VARCHAR(50),
      payment_date DATETIME,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jamaah_id) REFERENCES jamaah(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      target_type VARCHAR(20) NOT NULL,
      target_id VARCHAR(50),
      data TEXT DEFAULT '{}',
      priority VARCHAR(20) DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  
  for (const table of tables) {
    await query(table);
  }
  
  // Create test users
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  
  await query(`
    INSERT INTO users (username, full_name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `, ['testadmin', 'Test Admin', 'admin@test.com', hashedPassword, 'Admin']);
  
  await query(`
    INSERT INTO users (username, full_name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `, ['testuser', 'Test User', 'user@test.com', hashedPassword, 'Marketing']);
  
  // Create test package
  await query(`
    INSERT INTO packages (name, description, price, capacity, departure_date, return_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['Test Package', 'Test package description', 35000000, 50, '2024-12-01', '2024-12-14']);
  
  // Create test jamaah
  await query(`
    INSERT INTO jamaah (full_name, nik, passport_number, birth_date, gender, phone, email, package_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, ['Test Jamaah', '1234567890123456', 'A123456789', '1990-01-01', 'Laki-laki', '081234567890', 'jamaah@test.com', 1]);
};

const cleanupTestDatabase = async () => {
  try {
    await closeDatabase();
    console.log('Test database cleanup complete');
  } catch (error) {
    console.error('Test database cleanup failed:', error);
  }
};

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
  createTestData
};