@echo off
echo ==========================================
echo DIRECT AUTO-REPLY TEST (NO WAHA CONFIG)
echo ==========================================
echo.

echo Step 1: Ensure System Ready
echo --------------------------
echo Master Switch ON:
curl -X POST http://localhost:3003/api/automation/master-switch -H "Content-Type: application/json" -d "{\"enabled\":true}"
echo.
echo.

echo Step 2: Create Test Rule
echo -----------------------
echo Creating keyword rule for "123123"...
curl -X POST http://localhost:3003/api/automation/rules ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Direct Test Rule\",\"description\":\"Test\",\"ruleType\":\"keyword\",\"triggerType\":\"keyword\",\"triggerConditions\":{\"keywords\":[\"123123\",\"test\"],\"matchType\":\"contains\"},\"responseType\":\"text\",\"responseMessage\":\"AUTO-REPLY WORKS! Pesan diterima.\",\"isActive\":true,\"priority\":100}"
echo.
echo.

echo Step 3: Send Test via Webhook
echo ----------------------------
set /p phone="Your phone (628xxx): "
echo.
echo Sending "123123" directly to webhook...
curl -X POST http://localhost:3003/api/webhooks/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"payload\":{\"id\":\"msg_%random%\",\"from\":\"%phone%@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"123123\",\"type\":\"text\",\"fromMe\":false,\"timestamp\":1234567890}}"
echo.
echo.

echo Step 4: Check Results
echo --------------------
timeout /t 2 /nobreak > nul
echo Checking messages...
curl -s "http://localhost:3003/api/messages/search?limit=5" | findstr /C:"123123"
echo.
echo Checking logs...
curl -s "http://localhost:3003/api/automation/logs?limit=3" | findstr /C:"Direct Test Rule" /C:"success"
echo.
echo.

echo ==========================================
echo WHAT TO CHECK:
echo.
echo 1. Backend console for webhook logs
echo 2. Message appears in database
echo 3. Automation log shows rule triggered
echo.
echo If webhook works but no auto-reply,
echo the issue is in automation processing.
echo ==========================================
echo.
pause