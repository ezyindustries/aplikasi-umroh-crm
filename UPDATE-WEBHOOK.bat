@echo off
title Update WhatsApp Webhook
cls

echo ===============================================
echo UPDATE WEBHOOK CONFIGURATION
echo ===============================================
echo.

:: Check current session
echo [1] Checking WhatsApp connection...
curl -s http://localhost:3000/api/sessions/default 2>nul | findstr /C:"WORKING" >nul
if %errorlevel% equ 0 (
    echo ✅ WhatsApp is connected!
) else (
    echo ⚠️ WhatsApp may not be properly connected
)
echo.

:: Update webhook
echo [2] Updating webhook configuration...
echo.
curl -X POST http://localhost:3000/api/sessions/default/webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"url\": \"http://host.docker.internal:3001/api/webhooks/waha\", \"events\": [\"message\", \"message.any\", \"message.ack\", \"state.change\", \"group.join\", \"group.leave\", \"presence.update\"]}" 2>nul

echo.
echo ✅ Webhook updated!
echo.

:: Verify webhook
echo [3] Verifying webhook configuration...
echo.
curl -s http://localhost:3000/api/sessions/default | node -pe "try { const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); if(d.config && d.config.webhooks && d.config.webhooks.length > 0) { console.log('✅ Webhook URL: ' + d.config.webhooks[0].url); console.log('✅ Events: ' + d.config.webhooks[0].events.join(', ')); } else { console.log('❌ No webhook found'); } } catch(e) { console.log('Error checking webhook'); }"

echo.
echo ===============================================
echo READY TO TEST!
echo ===============================================
echo.
echo You can now test:
echo.
echo 1. MEDIA MESSAGES:
echo    - Send photos, videos, documents from WhatsApp
echo    - Share location
echo    - Send voice notes
echo.
echo 2. GROUP CHATS:
echo    - Create a new group or use existing
echo    - Add your connected number
echo    - Send messages in the group
echo.
echo 3. OPEN WEB INTERFACE:
echo    http://localhost:8080/conversations-beautiful.html
echo.
echo All messages should appear in real-time!
echo.
pause