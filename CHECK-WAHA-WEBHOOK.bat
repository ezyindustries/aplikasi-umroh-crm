@echo off
echo ==========================================
echo CHECKING WAHA WEBHOOK CONFIGURATION
echo ==========================================
echo.

echo Step 1: Check WAHA Session Status
echo --------------------------------
curl -s http://localhost:3000/api/sessions/default 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to WAHA on port 3000
    echo Make sure WAHA is running
)
echo.
echo.

echo Step 2: Check Webhook Configuration
echo ----------------------------------
echo Getting webhook config for session default...
curl -s http://localhost:3000/api/sessions/default/webhooks 2>nul
echo.
echo.

echo Step 3: Set Correct Webhook URL
echo -------------------------------
echo Setting webhook to localhost:3003...
curl -X POST http://localhost:3000/api/sessions/default/webhooks ^
  -H "Content-Type: application/json" ^
  -d "{\"url\":\"http://localhost:3003/api/webhooks/waha\",\"events\":[\"message\",\"message.any\",\"state.change\",\"group.join\",\"group.leave\"]}" 2>nul
echo.
echo.

echo Step 4: Verify Webhook Update
echo ----------------------------
curl -s http://localhost:3000/api/sessions/default/webhooks 2>nul
echo.
echo.

echo ==========================================
echo IMPORTANT:
echo.
echo Webhook URL should be:
echo http://localhost:3003/api/webhooks/waha
echo.
echo NOT:
echo http://localhost:3001/api/webhooks/waha
echo.
echo If webhook URL was wrong, it's now fixed.
echo Try sending a WhatsApp message again.
echo ==========================================
echo.
pause