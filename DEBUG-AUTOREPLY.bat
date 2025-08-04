@echo off
echo ==========================================
echo Debug Auto-Reply System
echo ==========================================
echo.

echo 1. Checking Master Switch Status...
curl -s http://localhost:3003/api/automation/master-switch/status | findstr "enabled"
echo.

echo 2. Checking Active Automation Rules...
curl -s http://localhost:3003/api/automation/rules?isActive=true
echo.
echo.

echo 3. Checking Recent Automation Logs...
curl -s http://localhost:3003/api/automation/logs?limit=10
echo.
echo.

echo 4. Testing Keyword Match...
set /p keyword="Enter a keyword to test: "
curl -X POST http://localhost:3003/api/automation/test-keyword -H "Content-Type: application/json" -d "{\"keyword\": \"%keyword%\"}"
echo.
echo.

echo 5. Checking WAHA Session Status...
curl -s http://localhost:3003/api/sessions/default/status
echo.
echo.

echo ==========================================
echo If all checks pass but auto-reply still not working,
echo check the backend console for error messages.
echo ==========================================
echo.
pause