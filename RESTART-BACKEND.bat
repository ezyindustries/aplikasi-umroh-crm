@echo off
echo Restarting WhatsApp Backend...
echo.

:: Kill existing Node process
taskkill /F /IM node.exe >nul 2>&1
echo Backend stopped.

:: Wait a moment
timeout /t 2 /nobreak > nul

:: Start backend again
cd /d "%~dp0backend\whatsapp"
echo Starting backend...
npm start

pause