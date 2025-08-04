@echo off
echo ==========================================
echo COMPLETE AUTO-REPLY FIX
echo ==========================================
echo.

echo Step 1: Master Switch ON
echo -----------------------
curl -X POST http://localhost:3003/api/automation/master-switch -H "Content-Type: application/json" -d "{\"enabled\":true}"
echo.
echo.

echo Step 2: Create Working Keyword Rule
echo ----------------------------------
echo Creating rule for keywords: test, 123123, halo...
curl -X POST http://localhost:3003/api/automation/rules ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Auto Reply Test\",\"description\":\"Test rule\",\"ruleType\":\"keyword\",\"triggerType\":\"keyword\",\"triggerConditions\":{\"keywords\":[\"test\",\"123123\",\"halo\",\"hello\"],\"matchType\":\"contains\"},\"responseType\":\"text\",\"responseMessage\":\"Auto-reply berhasil! Ini adalah balasan otomatis dari sistem.\",\"isActive\":true,\"priority\":100,\"cooldownMinutes\":0}"
echo.
echo.

echo Step 3: Test Direct Webhook
echo --------------------------
set /p phone="Enter phone (628xxx): "
echo.
echo Sending test "123123"...
curl -X POST http://localhost:3003/api/webhooks/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"payload\":{\"id\":\"test_%random%\",\"timestamp\":1234567890,\"from\":\"%phone%@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"123123\",\"type\":\"text\",\"fromMe\":false}}"
echo.
echo.

timeout /t 3 /nobreak > nul

echo Step 4: Check Results
echo --------------------
echo Messages:
curl -s "http://localhost:3003/api/messages/search?phoneNumber=%phone%&limit=3" | findstr /C:"123123" /C:"content" /C:"direction"
echo.
echo.
echo Automation logs:
curl -s "http://localhost:3003/api/automation/logs?limit=5" | findstr /C:"success" /C:"failed" /C:"Auto Reply Test"
echo.
echo.

echo ==========================================
echo DIAGNOSTICS:
echo.
echo Backend console MUST show:
echo 1. === WEBHOOK RECEIVED ===
echo 2. AUTOMATION ENGINE: PROCESSING MESSAGE
echo 3. Found X active automation rules
echo 4. Evaluating rule: Auto Reply Test
echo.
echo If NO logs: Webhook not reaching backend
echo If logs but no match: Rule matching issue
echo If match but no reply: WAHA send issue
echo ==========================================
echo.
pause