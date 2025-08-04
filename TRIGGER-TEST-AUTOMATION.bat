@echo off
echo ========================================
echo TRIGGERING TEST AUTOMATION
echo ========================================
echo.

echo This will simulate a message to create new automation logs with full metadata.
echo.

cd backend\whatsapp

echo Creating trigger script...
(
echo const { AutomationEngine } = require('./src/services'^);
echo const { Contact, Conversation, Message } = require('./src/models'^);
echo.
echo async function triggerAutomation(^) {
echo   try {
echo     console.log('Creating test message to trigger automation...'^);
echo.
echo     // Find or create test contact
echo     const [contact] = await Contact.findOrCreate({
echo       where: { phoneNumber: '628123456789' },
echo       defaults: {
echo         name: 'Test User',
echo         isBlocked: false
echo       }
echo     }^);
echo.
echo     // Find or create conversation
echo     const [conversation] = await Conversation.findOrCreate({
echo       where: { contactId: contact.id },
echo       defaults: {
echo         sessionId: 'default',
echo         isGroup: false,
echo         status: 'active'
echo       }
echo     }^);
echo.
echo     // Create test message
echo     const testMessage = {
echo       id: 'test-' + Date.now(^),
echo       content: 'Assalamualaikum, saya mau tanya paket umroh',
echo       body: 'Assalamualaikum, saya mau tanya paket umroh',
echo       messageType: 'text',
echo       conversationId: conversation.id,
echo       fromNumber: contact.phoneNumber,
echo       direction: 'inbound',
echo       status: 'received',
echo       isGroupMessage: false
echo     };
echo.
echo     console.log('\nProcessing message through automation engine...'^);
echo     console.log('Message:', testMessage.content^);
echo.
echo     // Process through automation
echo     await AutomationEngine.processMessage(testMessage, contact, conversation^);
echo.
echo     console.log('\nAutomation processing complete!'^);
echo     console.log('Check the Autoreply Management page now.'^);
echo.
echo   } catch (error^) {
echo     console.error('Error:', error^);
echo   }
echo   process.exit(0^);
echo }
echo.
echo triggerAutomation(^);
) > trigger-test.js

echo.
echo Running trigger...
node trigger-test.js

echo.
echo ========================================
echo Check http://localhost:8080/autoreply-management.html
echo ========================================
pause