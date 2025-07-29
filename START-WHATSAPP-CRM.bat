@echo off
echo ========================================
echo Starting WhatsApp CRM Application
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if port 3001 is already in use
echo Checking if port 3001 is already in use...
netstat -ano | findstr :3001 | findstr LISTENING >nul
if %errorlevel% == 0 (
    echo.
    echo WARNING: Port 3001 is already in use by WhatsApp CRM Backend!
    echo.
    echo Select an option:
    echo 1. Kill existing process and restart backend
    echo 2. Keep existing backend and open frontend only
    echo 3. Exit
    echo.
    choice /C 123 /N /M "Please select (1-3): "
    
    if errorlevel 3 exit /b 0
    if errorlevel 2 goto :frontend_only
    if errorlevel 1 goto :kill_and_restart
)

:normal_start
echo [1/4] Checking backend dependencies...
cd backend\whatsapp
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo.
echo [2/4] Starting backend server...
start cmd /k "title WhatsApp CRM Backend && npm start"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [3/4] Starting frontend server...
cd ..\..\frontend
start cmd /k "title WhatsApp CRM Frontend && python -m http.server 8080"

echo.
echo [4/4] Opening application in browser...
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/conversations-beautiful.html"

echo.
echo ========================================
echo Application started successfully!
echo.
echo Frontend: http://localhost:8080/conversations-beautiful.html
echo Backend API: http://localhost:3001
echo.
echo To stop: Close both command windows
echo ========================================
echo.
pause
exit /b 0

:kill_and_restart
echo.
echo Terminating existing process on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Killing process PID: %%a
    taskkill /PID %%a /F 2>nul
)
echo Waiting for port to be released...
timeout /t 3 /nobreak >nul
goto :normal_start

:frontend_only
echo.
echo [1/2] Starting frontend server only...
cd frontend
start cmd /k "title WhatsApp CRM Frontend && python -m http.server 8080"

echo.
echo [2/2] Opening application in browser...
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/conversations-beautiful.html"

echo.
echo ========================================
echo Frontend started successfully!
echo Using existing backend on port 3001
echo.
echo Frontend: http://localhost:8080/conversations-beautiful.html
echo Backend API: http://localhost:3001 (already running)
echo ========================================
echo.
pause
exit /b 0