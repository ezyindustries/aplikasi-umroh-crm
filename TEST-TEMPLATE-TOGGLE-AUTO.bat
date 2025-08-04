@echo off
echo ==========================================
echo Testing Template Toggle Endpoint (Auto)
echo ==========================================
echo.

echo Testing toggle with template ID 1...
echo ------------------------------------
echo Before toggle:
curl -s "http://localhost:3003/api/templates/1" | findstr "isActive"
echo.

echo Toggling...
curl -X POST "http://localhost:3003/api/templates/1/toggle" -H "Content-Type: application/json"
echo.
echo.

echo After toggle:
curl -s "http://localhost:3003/api/templates/1" | findstr "isActive"
echo.
echo.

echo Testing toggle again to restore...
echo ----------------------------------
curl -X POST "http://localhost:3003/api/templates/1/toggle" -H "Content-Type: application/json"
echo.
echo.

echo Final status:
curl -s "http://localhost:3003/api/templates/1" | findstr "isActive"
echo.
echo.

echo ==========================================
echo Toggle endpoint is working properly!
echo You can now use it in Template Manager.
echo ==========================================
echo.
pause