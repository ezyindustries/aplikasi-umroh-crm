@echo off
echo ===============================================
echo SAFELY RESTARTING BACKEND
echo ===============================================
echo.

:: Kill existing backend processes
echo Stopping existing backend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /PID %%a /F 2>nul
)

:: Wait a moment
timeout /t 3 /nobreak >nul

:: Start backend
echo.
echo Starting backend...
cd /d "%~dp0backend\whatsapp"
start "WhatsApp Backend" cmd /k "npm start"

echo.
echo Backend restarting...
echo Please wait for it to fully start before testing.
echo.
pause