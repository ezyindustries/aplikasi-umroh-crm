@echo off
echo === RESTARTING BACKEND SERVER (SIMPLE) ===
echo.

:: Kill existing Node.js processes on port 3003
echo Stopping existing backend processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003') do (
    taskkill /F /PID %%a 2>nul
)

:: Wait a moment
timeout /t 2 /nobreak >nul

:: Change to backend directory
cd /d "D:\ezyin\Documents\aplikasi umroh\backend\whatsapp"

:: Start backend server using npm start (no nodemon required)
echo Starting backend server on port 3003...
start "WhatsApp Backend" cmd /k "npm start"

:: Wait for server to start
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

:: Test if server is running
echo.
echo Testing backend connection...
curl -s http://localhost:3003/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend server is running on port 3003
) else (
    echo [WARNING] Backend might still be starting up...
)

echo.
echo Backend restart complete!
echo You can now test the autoreply system.
echo.
pause