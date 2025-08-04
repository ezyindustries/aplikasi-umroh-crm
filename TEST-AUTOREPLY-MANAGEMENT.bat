@echo off
echo ========================================
echo TESTING AUTOREPLY MANAGEMENT SYSTEM
echo ========================================
echo.

echo 1. Opening Autoreply Management page...
start http://localhost:8080/autoreply-management.html

echo.
echo 2. Testing API endpoints...
echo.

echo Testing /api/automation/logs...
curl -X GET http://localhost:3003/api/automation/logs?limit=10
echo.
echo.

echo Testing /api/automation/stats...
curl -X GET http://localhost:3003/api/automation/stats
echo.
echo.

echo Testing /api/automation/rule-triggers...
curl -X GET http://localhost:3003/api/automation/rule-triggers
echo.
echo.

echo ========================================
echo Test completed!
echo Check the browser for the management page.
echo ========================================
pause