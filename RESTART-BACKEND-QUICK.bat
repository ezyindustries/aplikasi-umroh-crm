@echo off
echo Restarting backend...
cd backend\whatsapp
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
start /B cmd /c "node server.js"
echo Backend restarted!
timeout /t 3