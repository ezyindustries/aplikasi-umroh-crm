const { sequelize } = require('../models');

async function syncDatabase() {
  try {
    console.log('🔄 Syncing database schema...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Sync all models - this will create tables
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database schema synced successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();