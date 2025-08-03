const { 
  sequelize, 
  WorkflowTemplate, 
  WorkflowStep, 
  WorkflowSession, 
  WorkflowVariable 
} = require('./backend/whatsapp/src/models');

async function syncWorkflowTables() {
  try {
    console.log('Syncing workflow tables...');
    
    // Sync only workflow tables
    await WorkflowTemplate.sync({ force: false });
    console.log('✓ WorkflowTemplate table synced');
    
    await WorkflowStep.sync({ force: false });
    console.log('✓ WorkflowStep table synced');
    
    await WorkflowSession.sync({ force: false });
    console.log('✓ WorkflowSession table synced');
    
    await WorkflowVariable.sync({ force: false });
    console.log('✓ WorkflowVariable table synced');
    
    console.log('\nWorkflow tables synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing workflow tables:', error);
    process.exit(1);
  }
}

syncWorkflowTables();