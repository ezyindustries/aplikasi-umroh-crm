@echo off
title Fix WhatsApp and Backend - Aplikasi Umroh
color 0A
cls

echo ================================================
echo    FIXING WHATSAPP SESSION AND BACKEND
echo ================================================
echo.

echo [1/4] Stopping and restarting WAHA container...
docker stop waha-umroh >nul 2>&1
docker rm waha-umroh >nul 2>&1

echo Creating fresh WAHA container...
docker run -d ^
    --name waha-umroh ^
    -p 3001:3000 ^
    -e WHATSAPP_HOOK_URL=http://host.docker.internal:5000/api/crm/webhook ^
    -e WHATSAPP_HOOK_EVENTS=* ^
    -e WHATSAPP_API_KEY=your-secret-api-key ^
    -e WHATSAPP_RESTART_ALL_SESSIONS=false ^
    -v waha-umroh-data:/app/data ^
    devlikeapro/waha:latest

echo Waiting for WAHA to initialize...
timeout /t 10 /nobreak >nul

echo.
echo [2/4] Starting Backend Server...
cd backend
start "Backend Server - DO NOT CLOSE" /min cmd /c "npm start"
cd ..

echo Waiting for backend to initialize...
timeout /t 15 /nobreak >nul

echo.
echo [3/4] Testing services...
echo ================================================

curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend API is running
) else (
    echo [ERROR] Backend API failed to start
)

curl -s http://localhost:3001/api/version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] WAHA API is running
) else (
    echo [ERROR] WAHA API failed to start
)

echo.
echo [4/4] Opening improved CRM dashboard...
timeout /t 3 /nobreak >nul
start "" "http://localhost:8080/crm-no-login.html"

echo.
echo ================================================
echo    DONE! Services should be running now.
echo ================================================
echo.
echo If WhatsApp shows FAILED status:
echo 1. Click "Connect to WhatsApp" again
echo 2. Scan the QR code
echo.
pause