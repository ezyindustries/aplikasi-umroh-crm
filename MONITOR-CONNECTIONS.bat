@echo off
echo ===============================================
echo    MONITOR SYSTEM CONNECTIONS
echo    Real-time Status Check
echo ===============================================
echo.

:LOOP
cls
echo ===============================================
echo    SYSTEM STATUS - %date% %time%
echo ===============================================
echo.

:: Check WAHA
echo [WAHA API - Port 3000]
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo Status: ONLINE
    echo Sessions:
    curl -s http://localhost:3000/api/sessions 2>nul | findstr /C:"name" /C:"status"
) else (
    echo Status: OFFLINE
)

echo.
echo ----------------------------------------

:: Check Backend
echo [Backend API - Port 3001]
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo Status: ONLINE
    curl -s http://localhost:3001/api/health 2>nul
) else (
    echo Status: OFFLINE
)

echo.
echo ----------------------------------------

:: Check Frontend
echo [Frontend - Port 8080]
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo Status: ONLINE
) else (
    echo Status: OFFLINE
)

echo.
echo ----------------------------------------

:: Check Docker containers
echo [Docker Containers]
docker ps --filter "name=whatsapp-http-api" --format "Status: {{.Status}}" 2>nul

echo.
echo ----------------------------------------

:: Check active connections
echo [Active Network Connections]
echo WAHA (3000):
netstat -an | findstr :3000 | findstr ESTABLISHED | find /c /v "" | set /p count= && echo   Active connections: %count%
echo.
echo Backend (3001):
netstat -an | findstr :3001 | findstr ESTABLISHED | find /c /v "" | set /p count= && echo   Active connections: %count%
echo.
echo Frontend (8080):
netstat -an | findstr :8080 | findstr ESTABLISHED | find /c /v "" | set /p count= && echo   Active connections: %count%

echo.
echo ===============================================
echo Press Ctrl+C to stop monitoring
echo Refreshing in 5 seconds...

timeout /t 5 /nobreak >nul
goto LOOP