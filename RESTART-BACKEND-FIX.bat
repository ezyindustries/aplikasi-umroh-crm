@echo off
echo Restarting WhatsApp CRM Backend with Fixes...
echo.

:: Kill existing Node.js processes
echo Stopping existing Node processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

:: Navigate to backend directory
cd /d "%~dp0backend\whatsapp"

:: Clear npm cache if needed
echo Clearing npm cache...
npm cache clean --force 2>nul

:: Start backend with better error handling
echo.
echo Starting backend...
echo ========================================
start /B cmd /c "npm start 2>&1"

echo.
echo Backend is starting...
echo Please wait a moment for the service to initialize.
echo.
echo Check http://localhost:3001/api/health to verify backend is running
echo.
pause