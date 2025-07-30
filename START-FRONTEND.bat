@echo off
echo ===============================================
echo    START FRONTEND SERVER
echo    WhatsApp CRM Frontend
echo ===============================================
echo.

:: Check if frontend directory exists
if not exist "%~dp0frontend" (
    echo ERROR: Frontend directory not found!
    echo Expected at: %~dp0frontend
    pause
    exit /b 1
)

:: Kill existing process on port 8080
echo [1/4] Checking port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
    echo Stopping existing process on port 8080 (PID: %%a)
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul

:: Navigate to frontend directory
echo.
echo [2/4] Navigating to frontend directory...
cd /d "%~dp0frontend"

:: Start frontend server
echo.
echo [3/4] Starting frontend server...

:: Try Python first (preferred)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using Python HTTP server...
    start "WhatsApp CRM Frontend" cmd /k "python -m http.server 8080"
    goto CHECK_SERVER
)

:: Try Node.js http-server
echo Python not found, trying Node.js http-server...
npx http-server --version >nul 2>&1
if %errorlevel% equ 0 (
    start "WhatsApp CRM Frontend" cmd /k "npx http-server -p 8080 -c-1 -o"
    goto CHECK_SERVER
)

:: Install http-server if needed
echo Installing http-server...
call npm install -g http-server
start "WhatsApp CRM Frontend" cmd /k "http-server -p 8080 -c-1 -o"

:CHECK_SERVER
:: Wait for server to start
echo.
echo [4/4] Waiting for server to start...
timeout /t 3 /nobreak >nul

:: Open browser
start http://localhost:8080/crm-main.html

echo.
echo ===============================================
echo    FRONTEND SERVER STARTED!
echo ===============================================
echo.
echo Frontend URL: http://localhost:8080
echo.
echo Available Pages:
echo - CRM Dashboard: http://localhost:8080/crm-main.html
echo - Conversations: http://localhost:8080/conversations-beautiful.html
echo.
echo Server Options:
echo - Port: 8080
echo - Cache: Disabled (-c-1)
echo - Auto-open: Enabled
echo.
echo To stop the server, close the command window.
echo.
pause