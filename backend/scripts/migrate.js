const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Get all migration files
    const migrationsPath = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    console.log(`📁 Found ${migrationFiles.length} migration files`);
    
    // Create migrations tracking table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sequelize_meta (
        name VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM sequelize_meta'
    );
    const executedSet = new Set(executedMigrations.map(m => m.name));
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedSet.has(file)) {
        console.log(`\n🚀 Running migration: ${file}`);
        
        const migration = require(path.join(migrationsPath, file));
        
        try {
          await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
          
          // Record successful migration
          await sequelize.query(
            'INSERT INTO sequelize_meta (name) VALUES (:name)',
            { replacements: { name: file } }
          );
          
          console.log(`✅ Migration ${file} completed successfully`);
        } catch (error) {
          console.error(`❌ Migration ${file} failed:`, error.message);
          throw error;
        }
      } else {
        console.log(`⏭️  Skipping already executed migration: ${file}`);
      }
    }
    
    console.log('\n✨ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Check for PostgreSQL-specific migrations
async function checkPostgreSQLMigrations() {
  const migrationsPath = path.join(__dirname, '../migrations-postgresql');
  
  if (fs.existsSync(migrationsPath)) {
    console.log('\n📂 PostgreSQL-specific migrations found');
    
    const pgMigrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    console.log(`📁 Found ${pgMigrationFiles.length} PostgreSQL migration files`);
    
    // Run PostgreSQL migrations
    for (const file of pgMigrationFiles) {
      const [executed] = await sequelize.query(
        'SELECT name FROM sequelize_meta WHERE name = :name',
        { replacements: { name: file } }
      );
      
      if (executed.length === 0) {
        console.log(`\n🐘 Running PostgreSQL migration: ${file}`);
        
        const migration = require(path.join(migrationsPath, file));
        
        try {
          await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
          
          // Record successful migration
          await sequelize.query(
            'INSERT INTO sequelize_meta (name) VALUES (:name)',
            { replacements: { name: file } }
          );
          
          console.log(`✅ PostgreSQL migration ${file} completed successfully`);
        } catch (error) {
          console.error(`❌ PostgreSQL migration ${file} failed:`, error.message);
          throw error;
        }
      }
    }
  }
}

// Run all migrations
async function main() {
  await runMigrations();
  await checkPostgreSQLMigrations();
}

main().catch(console.error);