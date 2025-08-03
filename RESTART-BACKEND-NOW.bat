@echo off
echo === RESTARTING BACKEND SERVER ===
echo.

echo Stopping existing backend processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Backend*" 2>nul
taskkill /F /FI "WINDOWTITLE eq npm*" 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Starting backend server...
cd backend\whatsapp
start "Backend Server" cmd /k "npm start"

echo.
echo Backend server is starting on port 3003...
echo Please wait a few seconds for it to fully initialize.
echo.
pause