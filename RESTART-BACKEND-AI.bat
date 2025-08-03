@echo off
echo ========================================
echo Restarting Backend Server with AI Routes
echo ========================================
echo.

echo Step 1: Killing existing Node processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node processes terminated
) else (
    echo [INFO] No Node processes were running
)

timeout /t 2 /nobreak >nul

echo.
echo Step 2: Starting backend server...
cd backend\whatsapp

echo.
echo Server will start in a new window...
echo Please wait for "Server running on port 3003" message
echo.

start "WhatsApp CRM Backend" cmd /k "npm start"

timeout /t 5 /nobreak >nul

echo.
echo Step 3: Testing backend connection...
curl -s http://localhost:3003/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend server is running
) else (
    echo [WARNING] Backend might still be starting up...
)

echo.
echo Step 4: Testing AI routes...
timeout /t 2 /nobreak >nul
curl -s http://localhost:3003/api/ai/connection
echo.
echo.
echo ========================================
echo Backend restart complete!
echo ========================================
echo.
echo You can now:
echo 1. Open AI Dashboard (OPEN-AI-DASHBOARD.bat)
echo 2. Test connection (TEST-AI-CONNECTION.bat)
echo.
pause