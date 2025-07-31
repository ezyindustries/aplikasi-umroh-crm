@echo off
echo ===============================================
echo RESTART BACKEND ONLY
echo ===============================================
echo.

:: Kill existing backend
echo Stopping existing backend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

:: Start backend
echo Starting backend with enhanced logging...
cd /d "%~dp0backend\whatsapp"
npm start