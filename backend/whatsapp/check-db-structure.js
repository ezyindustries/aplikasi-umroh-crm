const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'whatsapp-crm.db'));

console.log('=== Database Structure ===\n');

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

  console.log('Tables found:', tables.map(t => t.name).join(', '));
  console.log();

  // For each table, get column info
  tables.forEach(table => {
    db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
      if (err) {
        console.error(`Error getting columns for ${table.name}:`, err);
        return;
      }

      console.log(`Table: ${table.name}`);
      console.log('Columns:');
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
      console.log();
    });
  });

  // Get some sample data
  setTimeout(() => {
    console.log('=== Sample Data ===\n');
    
    // Contacts
    db.all('SELECT * FROM contacts LIMIT 5', (err, rows) => {
      if (!err && rows.length > 0) {
        console.log('Contacts:', rows.length);
        console.log(rows[0]); // Show first record structure
      }
    });

    // Messages
    db.all('SELECT * FROM messages LIMIT 5', (err, rows) => {
      if (!err && rows.length > 0) {
        console.log('\nMessages:', rows.length);
        console.log(rows[0]); // Show first record structure
      }
    });

    setTimeout(() => db.close(), 1000);
  }, 1000);
});