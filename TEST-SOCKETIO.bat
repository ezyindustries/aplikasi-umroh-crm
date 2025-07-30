@echo off
echo ===============================================
echo TESTING SOCKET.IO CONNECTION
echo ===============================================
echo.

cd /d "%~dp0backend\whatsapp"

echo Installing socket.io-client if needed...
npm list socket.io-client >nul 2>&1 || npm install socket.io-client --no-save

echo.
echo Testing Socket.IO connection...
echo.
node test-socketio.js

echo.
pause