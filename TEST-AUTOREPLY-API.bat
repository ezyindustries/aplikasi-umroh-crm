@echo off
echo ========================================
echo TESTING AUTOREPLY API ENDPOINTS
echo ========================================
echo.

echo 1. Testing /api/automation/logs...
curl -X GET http://localhost:3003/api/automation/logs?limit=5
echo.
echo.

echo 2. Testing /api/automation/stats...
curl -X GET http://localhost:3003/api/automation/stats
echo.
echo.

echo 3. Testing /api/automation/rule-triggers...
curl -X GET http://localhost:3003/api/automation/rule-triggers
echo.
echo.

echo ========================================
echo If you see errors, please restart backend!
echo ========================================
pause