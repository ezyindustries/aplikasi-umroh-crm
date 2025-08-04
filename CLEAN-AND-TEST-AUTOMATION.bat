@echo off
echo ========================================
echo CLEAN OLD LOGS AND TEST AUTOMATION
echo ========================================
echo.
echo This will:
echo 1. Delete old automation logs without metadata
echo 2. Create a test message to generate new logs
echo.

cd backend\whatsapp

echo Creating script...
(
echo const { AutomationLog, AutomationEngine, Contact, Conversation } = require('./src/models'^);
echo const { Op } = require('sequelize'^);
echo.
echo async function cleanAndTest(^) {
echo   try {
echo     // Count old logs
echo     const oldLogs = await AutomationLog.count({
echo       where: {
echo         [Op.or]: [
echo           { metadata: null },
echo           { metadata: {} }
echo         ]
echo       }
echo     }^);
echo.
echo     console.log(`Found ${oldLogs} old logs without metadata`^);
echo.
echo     if (oldLogs ^> 0^) {
echo       console.log('Deleting old logs...'^);
echo       await AutomationLog.destroy({
echo         where: {
echo           [Op.or]: [
echo             { metadata: null },
echo             { metadata: {} }
echo           ]
echo         }
echo       }^);
echo       console.log('Old logs deleted!'^);
echo     }
echo.
echo     // Now trigger a test
echo     console.log('\nTriggering test automation...'^);
echo.
echo     const [contact] = await Contact.findOrCreate({
echo       where: { phoneNumber: '628123456789' },
echo       defaults: { name: 'Test User', isBlocked: false }
echo     }^);
echo.
echo     const [conversation] = await Conversation.findOrCreate({
echo       where: { contactId: contact.id },
echo       defaults: { sessionId: 'default', isGroup: false, status: 'active' }
echo     }^);
echo.
echo     // Test different messages
echo     const testMessages = [
echo       'Assalamualaikum',
echo       '123123',
echo       'Berapa harga paket umroh?'
echo     ];
echo.
echo     const AutomationEngineService = require('./src/services/AutomationEngine'^);
echo.
echo     for (const content of testMessages^) {
echo       const message = {
echo         id: 'test-' + Date.now(^) + '-' + Math.random(^),
echo         content: content,
echo         body: content,
echo         messageType: 'text',
echo         conversationId: conversation.id,
echo         fromNumber: contact.phoneNumber,
echo         direction: 'inbound',
echo         status: 'received',
echo         isGroupMessage: false
echo       };
echo.
echo       console.log(`\nProcessing: "${content}"`^);
echo       await AutomationEngineService.processMessage(message, contact, conversation^);
echo       
echo       // Small delay between messages
echo       await new Promise(resolve =^> setTimeout(resolve, 1000^)^);
echo     }
echo.
echo     // Check new logs
echo     const newLogs = await AutomationLog.count(^);
echo     console.log(`\nTotal logs after test: ${newLogs}`^);
echo.
echo   } catch (error^) {
echo     console.error('Error:', error^);
echo   }
echo   process.exit(0^);
echo }
echo.
echo cleanAndTest(^);
) > clean-and-test.js

echo.
echo Running clean and test...
node clean-and-test.js

echo.
echo ========================================
echo Now check http://localhost:8080/autoreply-management.html
echo The page should show the new test messages!
echo ========================================
pause