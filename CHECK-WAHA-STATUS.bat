@echo off
title WAHA Status Check
echo ========================================
echo     WAHA and Backend Status Check
echo ========================================
echo.

echo [1/5] Checking Docker status...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not installed!
) else (
    echo [OK] Docker is installed
    docker ps >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker is not running!
    ) else (
        echo [OK] Docker is running
    )
)

echo.
echo [2/5] Checking WAHA containers...
docker ps -a | findstr waha
if errorlevel 1 (
    echo [WARNING] No WAHA containers found
) else (
    echo [OK] WAHA container found
)

echo.
echo [3/5] Testing WAHA API on port 3003...
curl -s http://localhost:3003/api/health
if errorlevel 1 (
    echo.
    echo [ERROR] WAHA not responding on port 3003
) else (
    echo.
    echo [OK] WAHA is responding
)

echo.
echo [4/5] Testing Backend on port 3002...
curl -s http://localhost:3002/api/health
if errorlevel 1 (
    echo.
    echo [ERROR] Backend not responding on port 3002
) else (
    echo.
    echo [OK] Backend is responding
)

echo.
echo [5/5] Checking for port conflicts...
echo.
echo Port 3001 (Main Umroh App):
netstat -an | findstr :3001 | findstr LISTENING
echo.
echo Port 3002 (WhatsApp CRM):
netstat -an | findstr :3002 | findstr LISTENING
echo.
echo Port 3003 (WAHA):
netstat -an | findstr :3003 | findstr LISTENING

echo.
echo ========================================
echo     Configuration Status
echo ========================================
echo.
cd backend\whatsapp
echo Current .env settings:
findstr "PORT=" .env
findstr "WAHA_URL=" .env
findstr "USE_WAHA=" .env
cd ..\..

echo.
echo ========================================
echo     Recommendations
echo ========================================
echo.
echo If WAHA is not running on port 3003:
echo   docker run -d --name waha-whatsapp -p 3003:3000 devlikeapro/waha
echo.
echo If Backend is not running on port 3002:
echo   Run FIX-AND-START-WAHA.bat
echo.
echo ========================================
echo.
pause