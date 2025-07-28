@echo off
title Check Services Status - Aplikasi Umroh
color 0E
cls

echo ================================================
echo    CHECKING ALL SERVICES STATUS
echo ================================================
echo.

echo [1] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker is installed
    docker ps -a | findstr waha-umroh >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] WAHA container exists
        docker ps | findstr waha-umroh >nul 2>&1
        if %errorlevel% equ 0 (
            echo [RUNNING] WAHA container is running
        ) else (
            echo [STOPPED] WAHA container is stopped
        )
    ) else (
        echo [NOT FOUND] WAHA container does not exist
    )
) else (
    echo [ERROR] Docker is not installed or not running
)

echo.
echo [2] Checking Backend Server (Port 5000)...
netstat -an | findstr :5000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [RUNNING] Backend server is listening on port 5000
    curl -s http://localhost:5000/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Backend server is responding
    ) else (
        echo [WARNING] Backend server is not responding to health check
    )
) else (
    echo [STOPPED] Backend server is not running
)

echo.
echo [3] Checking WAHA API (Port 3001)...
netstat -an | findstr :3001 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [RUNNING] WAHA API is listening on port 3001
    curl -s http://localhost:3001/api/version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] WAHA API is responding
    ) else (
        echo [WARNING] WAHA API is not responding
    )
) else (
    echo [STOPPED] WAHA API is not running
)

echo.
echo [4] Checking Frontend Server (Port 8080)...
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [RUNNING] Frontend server is listening on port 8080
) else (
    echo [INFO] Frontend server is not running (files can be accessed directly)
)

echo.
echo [5] Checking PostgreSQL (Port 5432)...
netstat -an | findstr :5432 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [RUNNING] PostgreSQL is listening on port 5432
    pg_isready -h localhost -p 5432 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] PostgreSQL is accepting connections
    ) else (
        echo [WARNING] PostgreSQL is not accepting connections
    )
) else (
    echo [STOPPED] PostgreSQL is not running
)

echo.
echo ================================================
echo    QUICK ACTIONS:
echo ================================================
echo.
echo 1. To start all services: Run START-ALL-COMPLETE.bat
echo 2. To stop all services: Run STOP-ALL.bat
echo 3. To view WAHA logs: docker logs -f waha-umroh
echo 4. To restart WAHA: docker restart waha-umroh
echo.
echo ================================================
echo.
pause