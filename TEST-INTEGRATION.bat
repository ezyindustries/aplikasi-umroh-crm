@echo off
echo ===============================================
echo    TEST WAHA INTEGRATION
echo    WhatsApp CRM System
echo ===============================================
echo.

:: Test WAHA
echo [1/5] Testing WAHA API...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ WAHA is running
    curl -s http://localhost:3000/api/health
) else (
    echo ✗ WAHA is NOT running
    echo Please run SETUP-WAHA-FRESH.bat first
)

echo.
echo [2/5] Testing Backend API...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend is running
    curl -s http://localhost:3001/api/health
) else (
    echo ✗ Backend is NOT running
    echo Please run START-BACKEND.bat
)

echo.
echo [3/5] Testing Frontend...
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend is running
) else (
    echo ✗ Frontend is NOT running
    echo Please run START-FRONTEND.bat
)

echo.
echo [4/5] Testing WAHA Sessions...
curl -s http://localhost:3000/api/sessions
echo.

echo.
echo [5/5] Testing Backend-WAHA Connection...
curl -s http://localhost:3001/api/sessions
echo.

echo.
echo ===============================================
echo    INTEGRATION TEST SUMMARY
echo ===============================================
echo.
echo URLs to test manually:
echo - WAHA Swagger: http://localhost:3000/swagger
echo - Backend Health: http://localhost:3001/api/health
echo - Frontend Dashboard: http://localhost:8080/crm-main.html
echo - Frontend Chat: http://localhost:8080/conversations-beautiful.html
echo.
echo Test WebSocket connection:
echo 1. Open browser console
echo 2. Check for socket.io connection to ws://localhost:3001
echo.
pause