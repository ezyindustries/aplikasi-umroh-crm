@echo off
echo ==========================================
echo Checking Automation Errors
echo ==========================================
echo.

echo Recent Automation Logs (Last 20):
echo -----------------------------
curl -s "http://localhost:3003/api/automation/logs?limit=20" | python -m json.tool

echo.
echo.
echo Checking if Templates exist in database:
echo -----------------------------
curl -s "http://localhost:3003/api/templates" | python -m json.tool

echo.
echo.
echo Testing Template Matching:
echo -----------------------------
set /p testMsg="Enter test message to check template match: "
curl -X POST "http://localhost:3003/api/templates/match" ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"%testMsg%\",\"intent\":\"inquiry\"}"

echo.
echo.
pause