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
echo [4/4] Application started successfully!
echo.
echo ========================================
echo IMPORTANT: Before using the application:
echo.
echo 1. Make sure WAHA is running on http://localhost:3000
echo    - If not, start WAHA first
echo.
echo 2. Access the application at:
echo    http://localhost:8080/conversations-beautiful.html
echo.
echo 3. Backend API is running on:
echo    http://localhost:3001
echo.
echo 4. To stop the application:
echo    - Close both command windows
echo    - Or press Ctrl+C in each window
echo ========================================
echo.
pause