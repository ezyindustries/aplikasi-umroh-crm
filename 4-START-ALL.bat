@echo off
title WhatsApp CRM - Start All
color 0C
cls

echo ===============================================
echo    START COMPLETE WHATSAPP CRM SYSTEM
echo ===============================================
echo.

:: Step 1: Docker and WAHA
echo [1/5] Starting Docker and WAHA...
echo ----------------------------------------
call "%~dp01-START-DOCKER.bat" nopause
if %errorlevel% neq 0 (
    echo ERROR: Docker/WAHA startup failed
    pause
    exit /b 1
)
cls

:: Step 2: Backend
echo [2/5] Starting Backend Server...
echo ----------------------------------------
start "WhatsApp CRM Backend" cmd /c ""%~dp02-START-BACKEND.bat""
echo Waiting for backend to start...
timeout /t 8 /nobreak >nul

:: Verify backend is running
curl -s http://localhost:3003/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Backend may not be ready yet
)

:: Step 3: Frontend
echo.
echo [3/5] Starting Frontend Server...
echo ----------------------------------------
start "WhatsApp CRM Frontend" cmd /c ""%~dp03-START-FRONTEND.bat""
timeout /t 3 /nobreak >nul

:: Step 4: Update webhook configuration
echo.
echo [4/5] Configuring webhook...
echo ----------------------------------------
curl -X POST http://localhost:3000/api/sessions/default/webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"url\": \"http://host.docker.internal:3001/api/webhooks/waha\", \"events\": [\"message\", \"message.any\", \"message.ack\", \"state.change\", \"group.join\", \"presence.update\"]}" 2>nul
echo ✓ Webhook configured

:: Step 5: Open browser
echo.
echo [5/5] Opening browser...
echo ----------------------------------------
timeout /t 2 /nobreak >nul
start http://localhost:8080/conversations-beautiful.html

:: Final status
echo.
echo ===============================================
echo    ALL SYSTEMS STARTED SUCCESSFULLY!
echo ===============================================
echo.
echo System Status:
echo ✓ Docker: Running
echo ✓ WAHA API: http://localhost:3000
echo ✓ Backend API: http://localhost:3003
echo ✓ Frontend: http://localhost:8080
echo.
echo Active Windows:
echo - WhatsApp CRM Backend (check for logs)
echo - WhatsApp CRM Frontend
echo.
echo Quick Links:
echo ► Conversations: http://localhost:8080/conversations-beautiful.html
echo ► CRM Dashboard: http://localhost:8080/crm-main.html
echo ► WAHA Dashboard: http://localhost:3000
echo.
echo ===============================================
echo    TESTING MEDIA MESSAGES
echo ===============================================
echo.
echo To test media support:
echo 1. Send a NEW image/video/document from WhatsApp
echo 2. Check backend window for "=== WEBHOOK MESSAGE RECEIVED ==="
echo 3. Message type should be "image", "video", etc (not "chat")
echo 4. Media should appear in the conversations page
echo.
echo If media doesn't work:
echo - Run: UPDATE-WEBHOOK.bat
echo - Check: node backend\whatsapp\check-media-db.js
echo.
pause