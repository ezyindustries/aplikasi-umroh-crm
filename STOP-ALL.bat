@echo off
title Stop All Services - Aplikasi Umroh
color 0C
cls

echo ================================================
echo    STOPPING ALL SERVICES
echo ================================================
echo.

echo [1/3] Stopping WAHA WhatsApp API...
docker stop waha-umroh >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] WAHA stopped
) else (
    echo [INFO] WAHA was not running
)

echo.
echo [2/3] Stopping Backend Server...
taskkill /F /FI "WINDOWTITLE eq Backend Server - Aplikasi Umroh*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq npm*" >nul 2>&1
echo [OK] Backend stopped

echo.
echo [3/3] Stopping Frontend Server...
taskkill /F /FI "WINDOWTITLE eq Frontend Server - Aplikasi Umroh*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq python*" >nul 2>&1
echo [OK] Frontend stopped

echo.
echo ================================================
echo    ALL SERVICES STOPPED
echo ================================================
echo.
pause