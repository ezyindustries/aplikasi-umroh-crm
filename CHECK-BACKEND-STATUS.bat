@echo off
echo ========================================
echo Checking Backend Status
echo ========================================
echo.

echo Testing Backend Health...
curl -s http://localhost:3000/health || echo Backend is NOT running!

echo.
echo Testing Backend API...
curl -s http://localhost:3000/api/health || echo Backend API is NOT responding!

echo.
echo Testing CORS Headers...
curl -s -I -X OPTIONS http://localhost:3000/api/auth/login -H "Origin: http://localhost:8081" -H "Access-Control-Request-Method: POST" | findstr "Access-Control"

echo.
echo ========================================
echo If you see errors above, please:
echo 1. Make sure backend is running (npm start in backend folder)
echo 2. Check if PostgreSQL is running
echo 3. Check backend logs for errors
echo ========================================

pause