@echo off
title Start Docker and WAHA
color 0A
cls

echo ===============================================
echo    START DOCKER AND WAHA CONTAINER
echo ===============================================
echo.

:: Check if Docker is running
echo [1/4] Checking Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul
    if %errorlevel% neq 0 (
        start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe" 2>nul
    )
    
    echo Waiting for Docker to start (this may take a minute)...
    :WAIT_DOCKER
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto WAIT_DOCKER
)
echo ✓ Docker is running

:: Check WAHA container
echo.
echo [2/4] Checking WAHA container...
docker ps --filter "name=whatsapp-http-api" --format "{{.Names}}" | findstr /i "whatsapp-http-api" >nul 2>&1
if %errorlevel% neq 0 (
    echo WAHA container not found. Creating new container...
    
    :: Create data directory
    if not exist "%~dp0waha-data" mkdir "%~dp0waha-data"
    
    :: Run WAHA container
    docker run -d ^
      --name whatsapp-http-api ^
      --restart unless-stopped ^
      -p 3000:3000 ^
      -v "%~dp0waha-data:/app/data" ^
      -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha ^
      -e WHATSAPP_HOOK_EVENTS=* ^
      -e WHATSAPP_API_KEY= ^
      -e WHATSAPP_RESTART_ALL_SESSIONS=true ^
      devlikeapro/whatsapp-http-api:latest
      
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create WAHA container
        pause
        exit /b 1
    )
) else (
    echo WAHA container exists. Starting if stopped...
    docker start whatsapp-http-api >nul 2>&1
)

:: Wait for WAHA to be ready
echo.
echo [3/4] Waiting for WAHA API to be ready...
:WAIT_WAHA
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 goto WAIT_WAHA

echo ✓ WAHA API is ready

:: Check WhatsApp session
echo.
echo [4/4] Checking WhatsApp session...
curl -s http://localhost:3000/api/sessions | findstr "[]" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo No WhatsApp session found. Creating default session...
    curl -X POST http://localhost:3000/api/sessions/start ^
      -H "Content-Type: application/json" ^
      -d "{\"name\": \"default\"}" 2>nul
    
    echo.
    echo ===============================================
    echo    SCAN QR CODE TO CONNECT WHATSAPP
    echo ===============================================
    echo.
    echo Open this URL in your browser:
    echo http://localhost:3000/api/sessions/default/qr
    echo.
    echo Then scan the QR code with WhatsApp on your phone
    echo.
) else (
    echo ✓ WhatsApp session exists
)

echo.
echo ===============================================
echo    DOCKER AND WAHA READY!
echo ===============================================
echo.
echo WAHA Dashboard: http://localhost:3000
echo WAHA API Docs: http://localhost:3000/swagger
echo.
pause