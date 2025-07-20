// Simple database initialization script
console.log('🔄 Starting simple database initialization...');

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.db');
console.log(`📁 Database path: ${dbPath}`);

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
const createTables = async () => {
  return new Promise((resolve, reject) => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'User',
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating users table:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Users table created');

      // Packages table
      db.run(`
        CREATE TABLE IF NOT EXISTS packages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(15,2) NOT NULL,
          capacity INTEGER NOT NULL,
          occupied INTEGER DEFAULT 0,
          departure_date DATE NOT NULL,
          return_date DATE NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating packages table:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Packages table created');

        // Jamaah table
        db.run(`
          CREATE TABLE IF NOT EXISTS jamaah (
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
            emergency_contact_name VARCHAR(255),
            emergency_contact_phone VARCHAR(20),
            medical_conditions TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (package_id) REFERENCES packages(id)
          )
        `, (err) => {
          if (err) {
            console.error('❌ Error creating jamaah table:', err.message);
            reject(err);
            return;
          }
          console.log('✅ Jamaah table created');

          // Payments table
          db.run(`
            CREATE TABLE IF NOT EXISTS payments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              jamaah_id INTEGER NOT NULL,
              amount DECIMAL(15,2) NOT NULL,
              payment_type VARCHAR(50) DEFAULT 'DP',
              payment_method VARCHAR(50),
              payment_date DATETIME,
              status VARCHAR(50) DEFAULT 'Pending',
              proof_file VARCHAR(255),
              notes TEXT,
              verified_by INTEGER,
              verified_at DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (jamaah_id) REFERENCES jamaah(id),
              FOREIGN KEY (verified_by) REFERENCES users(id)
            )
          `, (err) => {
            if (err) {
              console.error('❌ Error creating payments table:', err.message);
              reject(err);
              return;
            }
            console.log('✅ Payments table created');

            // Notifications table
            db.run(`
              CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('user', 'role', 'all')),
                target_id VARCHAR(50),
                data TEXT DEFAULT '{}',
                priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
                expires_at DATETIME,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
              )
            `, (err) => {
              if (err) {
                console.error('❌ Error creating notifications table:', err.message);
                reject(err);
                return;
              }
              console.log('✅ Notifications table created');

              // Documents table
              db.run(`
                CREATE TABLE IF NOT EXISTS documents (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  jamaah_id INTEGER NOT NULL,
                  document_type VARCHAR(50) NOT NULL,
                  file_name VARCHAR(255) NOT NULL,
                  file_path VARCHAR(500) NOT NULL,
                  file_size INTEGER,
                  uploaded_by INTEGER,
                  status VARCHAR(50) DEFAULT 'Uploaded',
                  verified_by INTEGER,
                  verified_at DATETIME,
                  notes TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (jamaah_id) REFERENCES jamaah(id),
                  FOREIGN KEY (uploaded_by) REFERENCES users(id),
                  FOREIGN KEY (verified_by) REFERENCES users(id)
                )
              `, (err) => {
                if (err) {
                  console.error('❌ Error creating documents table:', err.message);
                  reject(err);
                  return;
                }
                console.log('✅ Documents table created');
                resolve();
              });
            });
          });
        });
      });
    });
  });
};

// Create sample data
const createSampleData = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      db.run(`
        INSERT OR IGNORE INTO users (username, full_name, email, password, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['admin', 'Administrator', 'admin@umroh.com', hashedPassword, 'Admin', 1], function(err) {
        if (err) {
          console.error('❌ Error creating admin user:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Admin user created');

        // Create sample packages
        db.run(`
          INSERT OR IGNORE INTO packages (name, description, price, capacity, departure_date, return_date, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          'Paket Umroh Regular',
          'Paket umroh 14 hari dengan fasilitas lengkap',
          35000000,
          50,
          '2024-08-15',
          '2024-08-28',
          1
        ], function(err) {
          if (err) {
            console.error('❌ Error creating package 1:', err.message);
            reject(err);
            return;
          }
          
          db.run(`
            INSERT OR IGNORE INTO packages (name, description, price, capacity, departure_date, return_date, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            'Paket Umroh VIP',
            'Paket umroh premium dengan hotel bintang 5',
            55000000,
            30,
            '2024-09-10',
            '2024-09-23',
            1
          ], function(err) {
            if (err) {
              console.error('❌ Error creating package 2:', err.message);
              reject(err);
              return;
            }
            console.log('✅ Sample packages created');

            // Create sample jamaah
            db.run(`
              INSERT OR IGNORE INTO jamaah (
                full_name, nik, passport_number, birth_date, gender, phone, email, address,
                package_id, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              'Ahmad Jamaah',
              '3201234567890001',
              'A1234567',
              '1980-01-01',
              'Laki-laki',
              '081234567890',
              'ahmad@email.com',
              'Jl. Mecca No. 1, Jakarta',
              1,
              'Terdaftar'
            ], function(err) {
              if (err) {
                console.error('❌ Error creating jamaah 1:', err.message);
                reject(err);
                return;
              }

              db.run(`
                INSERT OR IGNORE INTO jamaah (
                  full_name, nik, passport_number, birth_date, gender, phone, email, address,
                  package_id, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                'Siti Fatimah',
                '3201234567890002',
                'A2345678',
                '1985-05-15',
                'Perempuan',
                '081234567891',
                'siti@email.com',
                'Jl. Madinah No. 2, Bandung',
                1,
                'Konfirmasi'
              ], function(err) {
                if (err) {
                  console.error('❌ Error creating jamaah 2:', err.message);
                  reject(err);
                  return;
                }
                console.log('✅ Sample jamaah created');
                resolve();
              });
            });
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Main initialization
const initialize = async () => {
  try {
    await createTables();
    await createSampleData();
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   URL: http://localhost:3000');
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    db.close();
    process.exit(1);
  }
};

initialize();