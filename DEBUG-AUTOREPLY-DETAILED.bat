@echo off
echo ==========================================
echo COMPLETE AUTO-REPLY DEBUGGING
echo ==========================================
echo.

echo STEP 1: System Status
echo ---------------------
echo Master Switch:
curl -s http://localhost:3003/api/automation/master-switch/status
echo.
echo.
echo Backend Health:
curl -s http://localhost:3003/api/health
echo.
echo.

echo STEP 2: Active Rules (Detailed)
echo -------------------------------
curl -s "http://localhost:3003/api/automation/rules?isActive=true" > active_rules.json
echo Active Rules Found:
type active_rules.json | findstr /C:"name" /C:"ruleType" /C:"keywords" /C:"isActive"
echo.
echo.

echo STEP 3: Test Webhook Message Processing
echo ---------------------------------------
set /p phone="Enter your phone number (628xxx): "
echo.
echo Sending test message "123123" via webhook...
curl -X POST http://localhost:3003/api/webhooks/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"engine\":{\"name\":\"WAHA\"},\"payload\":{\"id\":\"test_%random%\",\"timestamp\":1234567890,\"from\":\"%phone%@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"123123\",\"hasMedia\":false,\"type\":\"text\",\"fromMe\":false}}"
echo.
echo.

echo STEP 4: Check Message in Database
echo ---------------------------------
timeout /t 2 /nobreak > nul
curl -s "http://localhost:3003/api/messages/search?phoneNumber=%phone%&limit=5" > recent_messages.json
echo Recent Messages:
type recent_messages.json | findstr /C:"content" /C:"direction" /C:"123123"
echo.
echo.

echo STEP 5: Check Automation Logs
echo -----------------------------
curl -s "http://localhost:3003/api/automation/logs?limit=10" > automation_logs.json
echo Automation Log Status:
type automation_logs.json | findstr /C:"status" /C:"error" /C:"skippedReason" /C:"ruleId"
echo.
echo.

echo STEP 6: Test Keyword Matching Directly
echo -------------------------------------
echo Testing if keywords are matching...
for %%k in (123123 test hello) do (
    echo Testing keyword: %%k
    curl -X POST "http://localhost:3003/api/automation/test-keyword" ^
      -H "Content-Type: application/json" ^
      -d "{\"keyword\":\"%%k\",\"message\":\"%%k test\"}"
    echo.
)
echo.

echo STEP 7: Database Check
echo ---------------------
echo Checking if automation is enabled in DB...
cd backend\whatsapp
sqlite3 data\whatsapp-crm.db "SELECT id, rule_name, rule_type, is_active, trigger_conditions FROM automation_rules WHERE is_active = 1;" 2>nul
cd ..\..\  
echo.

del active_rules.json recent_messages.json automation_logs.json 2>nul

echo ==========================================
echo DEBUGGING CHECKLIST:
echo.
echo 1. Master switch is ON? (Check Step 1)
echo 2. Rules are active? (Check Step 2)
echo 3. Message received in DB? (Check Step 4)
echo 4. Automation logs show activity? (Check Step 5)
echo.
echo BACKEND CONSOLE SHOULD SHOW:
echo - "=== WEBHOOK RECEIVED ==="
echo - "=== PROCESSING INCOMING MESSAGE ==="
echo - "AUTOMATION ENGINE: PROCESSING MESSAGE"
echo - "Found X active automation rules"
echo - "Evaluating rule: XXX"
echo.
echo If NO logs appear, webhook is not working.
echo If logs appear but no match, rule config issue.
echo ==========================================
echo.
pause