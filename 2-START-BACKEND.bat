@echo off
title WhatsApp CRM Backend
color 0B
cls

echo ===============================================
echo    START WHATSAPP CRM BACKEND
echo ===============================================
echo.

:: Check if port 3001 is in use
echo Checking port 3001...
netstat -an | findstr :3001 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo Port 3001 is already in use!
    echo.
    echo Killing existing process...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 /nobreak >nul
)

:: Navigate to backend directory
cd /d "%~dp0backend\whatsapp"

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Run migrations
echo.
echo Running database migrations...
node -e "require('./migrations/add_resolved_by_column.js')().catch(console.error)" 2>nul
node -e "require('./migrations/add_group_chat_support.js')().catch(console.error)" 2>nul

:: Set webhook configuration
echo.
echo Configuring webhook...
timeout /t 2 /nobreak >nul
curl -X POST http://localhost:3000/api/sessions/default/webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"url\": \"http://host.docker.internal:3001/api/webhooks/waha\", \"events\": [\"message\", \"message.any\", \"message.ack\", \"state.change\", \"group.join\", \"presence.update\"]}" 2>nul

:: Start backend
echo.
echo ===============================================
echo    STARTING BACKEND SERVER
echo ===============================================
echo.
echo Backend will run on: http://localhost:3003
echo.
echo Features enabled:
echo ✓ WhatsApp message sync
echo ✓ Media support (images, videos, documents)
echo ✓ Group chat support
echo ✓ Real-time WebSocket updates
echo.
echo Starting server...
echo.

npm start