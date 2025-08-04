@echo off
echo ==========================================
echo Testing Simple Auto-Reply with Keyword Rule
echo ==========================================
echo.

echo Step 1: Creating a simple keyword-based rule
echo -----------------------------
curl -X POST http://localhost:3003/api/automation/rules -H "Content-Type: application/json" -d "{\"name\": \"Test Keyword Reply\", \"ruleType\": \"keyword\", \"triggerType\": \"keyword\", \"triggerConditions\": {\"keywords\": [\"hello\", \"halo\", \"test\"], \"matchType\": \"contains\"}, \"responseType\": \"text\", \"responseMessage\": \"Halo! Ini adalah balasan otomatis test. Sistem automation berfungsi dengan baik.\", \"priority\": 1, \"isActive\": true}"

echo.
echo.
echo Step 2: Check if rule was created
echo -----------------------------
curl -s "http://localhost:3003/api/automation/rules?isActive=true&ruleType=keyword"

echo.
echo.
echo Step 3: Test the rule with a message
echo -----------------------------
set /p phone="Enter your phone number (format: 628xxx): "
echo.
echo Sending test message with keyword "hello"...
curl -X POST http://localhost:3003/api/automation/simulate-message -H "Content-Type: application/json" -d "{\"phoneNumber\": \"%phone%\", \"message\": \"hello test automation\"}"

echo.
echo.
echo Step 4: Check recent automation logs
echo -----------------------------
curl -s "http://localhost:3003/api/automation/logs?limit=5"

echo.
echo.
echo ==========================================
echo Check the backend console for:
echo - "AUTOMATION ENGINE: PROCESSING MESSAGE"
echo - "Rule matched: Test Keyword Reply"
echo - "Sending response"
echo ==========================================
echo.
pause