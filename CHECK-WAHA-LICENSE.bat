@echo off
echo === CHECK WAHA PLUS LICENSE STATUS ===
echo.

echo Checking if WAHA is running...
docker ps | findstr waha >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] WAHA container is not running!
    echo.
    echo Run INSTALL-WAHA-PLUS-LICENSE.bat first
    echo.
    pause
    exit /b 1
)

echo [OK] WAHA container is running
echo.

echo Checking WAHA version...
curl -s http://localhost:3000/api/version 2>nul
echo.
echo.

echo Checking license status...
echo Enter your API key (same as when you started WAHA):
set /p API_KEY="API Key: "

echo.
echo === LICENSE INFO ===
curl -s -H "X-Api-Key: %API_KEY%" http://localhost:3000/api/plus/license 2>nul
echo.
echo.

echo === PLUS FEATURES ===
curl -s -H "X-Api-Key: %API_KEY%" http://localhost:3000/api/plus/features 2>nul
echo.
echo.

echo === SESSIONS ===
curl -s -H "X-Api-Key: %API_KEY%" http://localhost:3000/api/sessions 2>nul
echo.
echo.

echo === QUICK TESTS ===
echo.
echo 1. WAHA Dashboard: http://localhost:3000
echo    Login with API Key: %API_KEY%
echo.
echo 2. Test Image Upload: http://localhost:8080/test-image-upload.html
echo.
echo 3. API Docs: http://localhost:3000/swagger
echo    Username: admin
echo    Password: admin
echo.

pause