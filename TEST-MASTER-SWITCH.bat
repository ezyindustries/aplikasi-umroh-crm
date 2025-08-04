@echo off
echo Testing Master Automation Switch...
echo.

echo 1. Testing GET status endpoint:
curl -X GET http://localhost:3003/api/automation/master-switch/status
echo.
echo.

echo 2. Testing POST toggle endpoint (turn OFF):
curl -X POST http://localhost:3003/api/automation/master-switch -H "Content-Type: application/json" -d "{\"enabled\": false}"
echo.
echo.

echo 3. Testing POST toggle endpoint (turn ON):
curl -X POST http://localhost:3003/api/automation/master-switch -H "Content-Type: application/json" -d "{\"enabled\": true}"
echo.
echo.

pause