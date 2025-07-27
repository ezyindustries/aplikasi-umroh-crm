@echo off
echo ===============================================
echo PORT STATUS CHECK - Aplikasi Umroh
echo ===============================================
echo.

echo Checking core services ports...
echo.

echo [Backend API - Port 3000]
netstat -an | findstr :3000 | findstr LISTENING
if %errorlevel% equ 0 (
    echo Status: IN USE
) else (
    echo Status: AVAILABLE
)
echo.

echo [PostgreSQL - Port 5432]
netstat -an | findstr :5432 | findstr LISTENING
if %errorlevel% equ 0 (
    echo Status: IN USE
) else (
    echo Status: AVAILABLE
)
echo.

echo [Redis - Port 6379]
netstat -an | findstr :6379 | findstr LISTENING
if %errorlevel% equ 0 (
    echo Status: IN USE
) else (
    echo Status: AVAILABLE
)
echo.

echo [Frontend - Port 8081]
netstat -an | findstr :8081 | findstr LISTENING
if %errorlevel% equ 0 (
    echo Status: IN USE
) else (
    echo Status: AVAILABLE
)
echo.

echo ===============================================
echo Docker Container Port Mappings:
echo ===============================================
docker ps --format "table {{.Names}}\t{{.Ports}}" 2>nul
echo.

echo ===============================================
echo For detailed port allocation info, see:
echo PORT-ALLOCATION.md
echo ===============================================