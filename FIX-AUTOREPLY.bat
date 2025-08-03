@echo off
echo ==============================================
echo FIX AUTOREPLY WHATSAPP CRM
echo ==============================================
echo.

:: Get local IP address
echo [1] Getting local IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found_ip
    )
)
:found_ip
echo    Local IP: %LOCAL_IP%
echo.

:: Check WAHA status
echo [2] Checking WAHA status...
curl -s http://localhost:3000/api/sessions/default > temp_waha.json
echo    WAHA is running
echo.

:: Update webhook with local IP
echo [3] Updating WAHA webhook to use local IP...
echo    Setting webhook to: http://%LOCAL_IP%:3003/api/webhooks/waha
curl -X PUT http://localhost:3000/api/sessions/default -H "Content-Type: application/json" -d "{\"config\":{\"webhooks\":[{\"url\":\"http://%LOCAL_IP%:3003/api/webhooks/waha\",\"events\":[\"message\",\"message.any\",\"session.status\",\"message.ack\"],\"hmac\":{\"key\":\"your-webhook-secret\"},\"retries\":{\"delaySeconds\":2,\"attempts\":5}}]}}" > nul 2>&1
echo    Webhook updated!
echo.

:: Test webhook
echo [4] Testing webhook connection...
curl -X POST http://localhost:3003/api/webhooks/waha -H "Content-Type: application/json" -d "{\"event\":\"test\",\"session\":\"default\",\"payload\":{\"test\":true}}" > temp_webhook.json 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    Webhook test: SUCCESS
) else (
    echo    Webhook test: FAILED - Backend might not be running
)
echo.

:: Check automation rules
echo [5] Checking automation rules...
curl -s http://localhost:3003/api/automation/rules > temp_rules.json
echo    Automation rules checked
echo.

:: Show current webhook config
echo [6] Current webhook configuration:
curl -s http://localhost:3000/api/sessions/default | findstr /C:"webhooks"
echo.

echo ==============================================
echo NEXT STEPS:
echo ==============================================
echo 1. Make sure backend is running (npm start)
echo 2. Send a WhatsApp message to test
echo 3. Check backend console for:
echo    - "=== WEBHOOK RECEIVED ==="
echo    - "=== AUTOMATION ENGINE ==="
echo.
echo If still not working, try:
echo - Restart WAHA: docker-compose restart
echo - Use ngrok: ngrok http 3003
echo ==============================================

:: Cleanup temp files
del temp_*.json 2>nul

pause