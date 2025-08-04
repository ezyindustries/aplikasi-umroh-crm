@echo off
echo ==========================================
echo TESTING WAHA CONNECTION & WEBHOOK
echo ==========================================
echo.

echo Step 1: Test WAHA without API Key
echo ---------------------------------
echo Testing basic endpoint...
curl -s http://localhost:3000/
echo.
echo.

echo Step 2: Test WAHA with empty API Key
echo ------------------------------------
curl -s -H "X-Api-Key: " http://localhost:3000/api/sessions
echo.
echo.

echo Step 3: Get WAHA Session Info (no auth)
echo ---------------------------------------
curl -s http://localhost:3000/api/default
echo.
echo.

echo Step 4: Test Direct Webhook to Backend
echo -------------------------------------
echo Testing if backend webhook works...
set /p phone="Enter your phone (628xxx): "
echo.
echo Sending test message...
curl -X POST http://localhost:3003/api/webhooks/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"payload\":{\"id\":\"test_%random%\",\"from\":\"%phone%@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"test auto reply 123123\",\"type\":\"text\",\"fromMe\":false,\"timestamp\":1234567890}}"
echo.
echo.

echo Step 5: Check if Message Received
echo --------------------------------
timeout /t 2 /nobreak > nul
curl -s "http://localhost:3003/api/messages/search?phoneNumber=%phone%&limit=3"
echo.
echo.

echo ==========================================
echo RESULTS:
echo.
echo 1. If WAHA returns data without auth,
echo    update .env WAHA_API_KEY=""
echo.
echo 2. If webhook test shows message in DB,
echo    backend is working correctly.
echo.
echo 3. Check backend console for logs.
echo ==========================================
echo.
pause