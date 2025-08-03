const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/whatsapp/data/whatsapp-crm.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Automation Rules ===');

db.all(`SELECT id, name, ruleType, responseType, isActive, priority, keywords 
        FROM AutomationRules 
        WHERE isActive = 1`, (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\nActive Automation Rules:');
  if (rows.length === 0) {
    console.log('No active automation rules found!');
  } else {
    rows.forEach(rule => {
      console.log(`\nRule: ${rule.name}`);
      console.log(`  ID: ${rule.id}`);
      console.log(`  Type: ${rule.ruleType}`);
      console.log(`  Response Type: ${rule.responseType}`);
      console.log(`  Priority: ${rule.priority}`);
      console.log(`  Keywords: ${rule.keywords}`);
    });
  }
  
  // Check templates
  console.log('\n\n=== Checking Templates ===');
  db.all(`SELECT id, templateName, category, keywords, usageCount, isActive 
          FROM CustomTemplates 
          WHERE isActive = 1 
          LIMIT 5`, (err, templates) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('\nActive Templates:');
    if (templates.length === 0) {
      console.log('No active templates found!');
    } else {
      templates.forEach(template => {
        console.log(`\nTemplate: ${template.templateName}`);
        console.log(`  Category: ${template.category}`);
        console.log(`  Keywords: ${template.keywords}`);
        console.log(`  Usage Count: ${template.usageCount}`);
      });
    }
    
    db.close();
  });
});