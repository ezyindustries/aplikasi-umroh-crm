@echo off
echo ========================================
echo Quick Start - Aplikasi Umroh
echo ========================================
echo.

echo Checking if ports are available...
netstat -ano | findstr :8080 >nul
if %errorlevel%==0 (
    echo WARNING: Port 8080 is already in use!
    echo Please close the application using port 8080 first.
    pause
    exit /b 1
)

netstat -ano | findstr :3000 >nul
if %errorlevel%==0 (
    echo WARNING: Port 3000 is already in use!
    echo Please close the application using port 3000 first.
    pause
    exit /b 1
)

echo Ports are available. Starting services...
echo.

echo Starting Backend (Port 3000)...
cd backend
start /min cmd /c "npm start"
echo Waiting for backend to start...
timeout /t 5 >nul

echo.
echo Starting Frontend (Port 8080)...
cd ..\frontend
start /min cmd /c "python -m http.server 8080"
echo Waiting for frontend to start...
timeout /t 3 >nul

echo.
echo ========================================
echo Services are starting...
echo.
echo Opening browser in 5 seconds...
echo URL: http://localhost:8080
echo.
echo Login credentials:
echo Username: admin
echo Password: admin123
echo ========================================
timeout /t 5 >nul

start http://localhost:8080

echo.
echo Press any key to exit (services will continue running)...
pause >nul