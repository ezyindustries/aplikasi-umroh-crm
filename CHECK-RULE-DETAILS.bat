@echo off
echo ==========================================
echo Checking Rule Details
echo ==========================================
echo.

echo Getting details of active rule...
echo -----------------------------
curl -s "http://localhost:3003/api/automation/rules?isActive=true&limit=10" > rules.json

echo Rules found:
type rules.json

echo.
echo.
echo Checking specific rule details (Smart Template Response)...
echo -----------------------------
echo Note: Look for rule ID in the output above
set /p ruleId="Enter Rule ID to check details: "

echo.
echo Rule Details:
curl -s "http://localhost:3003/api/automation/rules/%ruleId%"

echo.
echo.
del rules.json
pause