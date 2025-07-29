@echo off
echo Switching to WAHA (RealWAHAService)...
echo.

cd backend\whatsapp

echo Updating SessionController.js...
node -e "const fs=require('fs'); let content=fs.readFileSync('src/controllers/SessionController.js','utf8'); content=content.replace(/WhatsAppWebService/g,'RealWAHAService'); fs.writeFileSync('src/controllers/SessionController.js',content);"

echo Updating MessageQueue.js...
node -e "const fs=require('fs'); let content=fs.readFileSync('src/services/MessageQueue.js','utf8'); content=content.replace(/WhatsAppWebService/g,'RealWAHAService'); fs.writeFileSync('src/services/MessageQueue.js',content);"

echo Updating force-load-chats.js...
node -e "const fs=require('fs'); let content=fs.readFileSync('force-load-chats.js','utf8'); content=content.replace(/WhatsAppWebService/g,'RealWAHAService'); fs.writeFileSync('force-load-chats.js',content);"

cd ..\..

echo.
echo Done! Now using RealWAHAService.
echo.
pause