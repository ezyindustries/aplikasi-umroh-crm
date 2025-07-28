@echo off
echo ========================================
echo RESTARTING BACKEND (FIXED)
echo ========================================
echo.

REM Kill any existing backend process
taskkill /F /FI "WINDOWTITLE eq *Backend Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq npm*" >nul 2>&1

echo Fixed the duplicate JWT error!
echo.
echo Starting backend server...
echo.

cd backend
start "Backend Server - KEEP THIS OPEN" cmd /k npm start

echo.
echo Waiting for server to start (15 seconds)...
timeout /t 15 /nobreak

echo.
echo Testing backend...
echo ========================================
curl http://localhost:5000/health
echo.
echo ========================================
echo.
echo If you see {"status":"OK"} above = Backend is running!
echo.
echo Now refresh your CRM dashboard in browser
echo http://localhost:8080/crm-no-login.html
echo.
pause