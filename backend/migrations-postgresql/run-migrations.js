const fs = require('fs').promises;
const path = require('path');
const { setupDatabase, sequelize } = require('../config/database');

async function runMigrations() {
  console.log('🚀 Starting PostgreSQL migrations...\n');
  
  try {
    // Setup database connection
    await setupDatabase();
    console.log('✅ Database connection established\n');
    
    // Get all migration files
    const migrationDir = __dirname;
    const files = await fs.readdir(migrationDir);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Ensure files run in order
    
    console.log(`Found ${sqlFiles.length} migration files\n`);
    
    // Create migrations tracking table
    await sequelize().query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Run each migration
    for (const file of sqlFiles) {
      try {
        // Check if migration already ran
        const [existing] = await sequelize().query(
          'SELECT filename FROM migrations WHERE filename = $1',
          {
            bind: [file],
            type: sequelize().QueryTypes.SELECT
          }
        );
        
        if (existing) {
          console.log(`⏭️  Skipping ${file} (already executed)`);
          continue;
        }
        
        // Read and execute migration
        console.log(`📝 Running ${file}...`);
        const sql = await fs.readFile(path.join(migrationDir, file), 'utf8');
        
        // Split by semicolon but ignore semicolons inside functions
        const statements = sql
          .split(/;(?![^$$]*\$\$)/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        
        for (const statement of statements) {
          if (statement) {
            await sequelize().query(statement);
          }
        }
        
        // Record migration
        await sequelize().query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          { bind: [file] }
        );
        
        console.log(`✅ ${file} completed\n`);
        
      } catch (error) {
        console.error(`❌ Error in ${file}:`, error.message);
        throw error;
      }
    }
    
    console.log('✅ All migrations completed successfully!');
    
    // Close connection
    await sequelize().close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };