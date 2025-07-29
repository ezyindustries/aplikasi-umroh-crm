@echo off
title WhatsApp CRM - Frontend Server
color 0A

echo ============================================
echo        STARTING FRONTEND SERVER
echo ============================================
echo.

cd frontend

echo Starting HTTP server on port 8080...
echo.
echo Access the application at:
echo - http://localhost:8080/conversations-beautiful.html
echo - http://localhost:8080/crm-main.html
echo.

REM Try Python first
python --version >nul 2>&1
if %errorlevel%==0 (
    echo Using Python HTTP Server...
    python -m http.server 8080
) else (
    REM If Python not available, use Node.js
    echo Using Node.js HTTP Server...
    npx http-server -p 8080
)

pause