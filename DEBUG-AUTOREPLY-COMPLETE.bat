@echo off
echo ==========================================
echo COMPLETE AUTO-REPLY DEBUGGING
echo ==========================================
echo.

echo STEP 1: Check System Health
echo ---------------------------
echo Master Switch Status:
curl -s http://localhost:3003/api/automation/master-switch/status
echo.
echo.
echo Backend Health:
curl -s http://localhost:3003/api/health
echo.
echo.

echo STEP 2: List ALL Rules (Active and Inactive)
echo --------------------------------------------
curl -s "http://localhost:3003/api/automation/rules?limit=50"
echo.
echo.

echo STEP 3: Test Direct Webhook
echo ---------------------------
set /p phone="Enter your test phone number (628xxx): "
echo.
echo Sending test message with keyword "123123"...
curl -X POST http://localhost:3003/api/webhooks/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"message\":{\"id\":\"test_%random%\",\"from\":\"%phone%@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"123123\",\"type\":\"text\",\"fromMe\":false,\"timestamp\":1234567890}}"
echo.
echo.

echo STEP 4: Check Automation Logs
echo -----------------------------
timeout /t 2 /nobreak > nul
echo Recent automation logs:
curl -s "http://localhost:3003/api/automation/logs?limit=10"
echo.
echo.

echo ==========================================
echo CHECK BACKEND CONSOLE FOR:
echo - "=== WEBHOOK RECEIVED ==="
echo - "AUTOMATION ENGINE: PROCESSING MESSAGE"
echo - "Rule matched" or "No matching rules"
echo ==========================================
echo.
pause