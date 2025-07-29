const fs = require('fs');
const path = require('path');

console.log('Switching back to whatsapp-web.js (no Docker required)...\n');

// Update SessionController
const sessionControllerPath = path.join(__dirname, 'src/controllers/SessionController.js');
let content = fs.readFileSync(sessionControllerPath, 'utf8');
content = content.replace(
    "const whatsappService = require('../services/RealWAHAService');",
    "const whatsappService = require('../services/WhatsAppWebService');"
);
fs.writeFileSync(sessionControllerPath, content);
console.log('✅ Updated SessionController.js');

// Update MessageQueue
const messageQueuePath = path.join(__dirname, 'src/services/MessageQueue.js');
content = fs.readFileSync(messageQueuePath, 'utf8');
content = content.replace(
    "const whatsappService = require('./RealWAHAService');",
    "const whatsappService = require('./WhatsAppWebService');"
);
fs.writeFileSync(messageQueuePath, content);
console.log('✅ Updated MessageQueue.js');

// Update force-load-chats
const forceLoadPath = path.join(__dirname, 'force-load-chats.js');
content = fs.readFileSync(forceLoadPath, 'utf8');
content = content.replace(
    "const whatsappService = require('./src/services/RealWAHAService');",
    "const whatsappService = require('./src/services/WhatsAppWebService');"
);
fs.writeFileSync(forceLoadPath, content);
console.log('✅ Updated force-load-chats.js');

console.log('\n✅ Switched back to whatsapp-web.js!');
console.log('\nNow you can use WhatsApp CRM without Docker.');
console.log('Restart the backend and try connecting WhatsApp again.');