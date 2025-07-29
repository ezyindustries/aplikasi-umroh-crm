@echo off
title Test WAHA Connection
echo ========================================
echo     Testing WAHA Connection
echo ========================================
echo.

:: Test if WAHA is running
echo Checking WAHA on port 3003...
curl -X GET http://localhost:3003/api/sessions
echo.
echo.

:: Test creating a session
echo Testing session creation...
curl -X POST http://localhost:3003/api/sessions/ -H "Content-Type: application/json" -d "{\"name\": \"default\"}"
echo.
echo.

:: Check backend logs
echo.
echo Checking backend error logs...
type "backend\whatsapp\logs\error.log" | findstr /I "error" | findstr /V "info" | tail -10
echo.

echo.
echo If WAHA is not running, start it with:
echo   docker run -it --rm -p 3003:3000 --name waha waha/waha
echo   or
echo   START-WAHA-DOCKER.bat
echo.
pause