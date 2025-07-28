@echo off
title Frontend Server - Aplikasi Umroh
color 0A
cls

echo ========================================
echo    STARTING FRONTEND SERVER
echo ========================================
echo.

cd frontend

echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python found, starting server...
    echo.
    echo Server running at: http://localhost:8080
    echo.
    echo Available pages:
    echo - Main App: http://localhost:8080/index.html
    echo - CRM Dashboard: http://localhost:8080/crm-no-login.html
    echo - CRM Complete: http://localhost:8080/crm-complete.html
    echo.
    echo Press Ctrl+C to stop the server
    echo ========================================
    python -m http.server 8080
) else (
    echo [INFO] Python not found, trying Node.js...
    npx --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Using Node.js http-server...
        echo.
        echo Installing http-server...
        call npm install -g http-server
        echo.
        echo Server running at: http://localhost:8080
        echo.
        echo Available pages:
        echo - Main App: http://localhost:8080/index.html
        echo - CRM Dashboard: http://localhost:8080/crm-no-login.html
        echo - CRM Complete: http://localhost:8080/crm-complete.html
        echo.
        echo Press Ctrl+C to stop the server
        echo ========================================
        http-server -p 8080 -c-1
    ) else (
        echo [ERROR] Neither Python nor Node.js found!
        echo.
        echo Please install one of the following:
        echo 1. Python: https://www.python.org/downloads/
        echo 2. Node.js: https://nodejs.org/
        echo.
        echo Alternative: You can open the HTML files directly in browser
        pause
        exit /b 1
    )
)

cd ..
pause