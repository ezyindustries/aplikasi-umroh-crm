const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
  let connection;
  
  try {
    console.log('🚀 Starting MySQL database initialization...');
    
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'umroh_management';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database "${dbName}" ready`);
    
    // Use the database
    await connection.query(`USE \`${dbName}\`;`);
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📋 Executing ${statements.length} schema statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          // Skip database creation and USE statements since we already handled them
          if (statement.includes('CREATE DATABASE') || statement.includes('USE umroh_management')) {
            continue;
          }
          
          await connection.query(statement);
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        } catch (error) {
          // Some statements might fail if they already exist, which is okay
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate entry') &&
              !error.message.includes('Table') &&
              !error.message.includes('already')) {
            console.error(`❌ Error executing statement: ${statement.substring(0, 50)}...`);
            console.error(error.message);
          }
        }
      }
    }
    
    // Verify tables were created
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Created ${tables.length} tables:`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
    // Check if admin user exists
    const [adminUsers] = await connection.query('SELECT COUNT(*) as count FROM users WHERE role_name = "Admin"');
    if (adminUsers[0].count === 0) {
      console.log('⚠️  No admin user found, creating default admin...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await connection.query(`
        INSERT INTO users (username, email, password_hash, full_name, role_name, phone) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['admin', 'admin@umroh.com', hashedPassword, 'Administrator', 'Admin', '081234567890']);
      
      console.log('✅ Default admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Email: admin@umroh.com');
    }
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };