@echo off
title WhatsApp CRM Frontend
color 0E
cls

echo ===============================================
echo    START WHATSAPP CRM FRONTEND
echo ===============================================
echo.

:: Check if port 8080 is in use
echo Checking port 8080...
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo Port 8080 is already in use!
    echo.
    echo Killing existing process...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 /nobreak >nul
)

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed!
    echo.
    echo Please install Python from: https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

:: Navigate to frontend directory
cd /d "%~dp0frontend"

:: Display available pages
echo ===============================================
echo    FRONTEND PAGES
echo ===============================================
echo.
echo Main Pages:
echo ► CRM Dashboard: http://localhost:8080/crm-main.html
echo ► Conversations: http://localhost:8080/conversations-beautiful.html
echo.
echo Utility Pages:
echo ► Debug Media: http://localhost:8080/debug-media.html
echo.
echo ===============================================
echo    STARTING FRONTEND SERVER
echo ===============================================
echo.
echo Frontend will run on: http://localhost:8080
echo.
echo Starting server...
echo.

:: Start Python HTTP server
python -m http.server 8080