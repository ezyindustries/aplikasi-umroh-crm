@echo off
echo ================================================
echo Starting Application with New Port Configuration
echo ================================================
echo Backend: Port 3001
echo Frontend: Port 8090
echo ================================================
echo.

:: Kill any existing processes on our ports
echo Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Killing process on port 3001 (PID: %%a)
    taskkill /PID %%a /F 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8090 ^| findstr LISTENING') do (
    echo Killing process on port 8090 (PID: %%a)
    taskkill /PID %%a /F 2>nul
)
timeout /t 2 >nul

:: Use the new .env file for backend
echo.
echo Configuring backend with new ports...
cd backend
if exist .env (
    copy .env .env.backup >nul
    echo Backed up existing .env to .env.backup
)
copy .env.new .env >nul
echo Updated .env with new configuration

:: Start Backend
echo.
echo Starting Backend on port 3001...
start "Backend Server" cmd /k "npm start"
echo Waiting for backend to initialize...
timeout /t 5 >nul

:: Start Frontend
echo.
echo Starting Frontend on port 8090...
cd ..\frontend
start "Frontend Server" cmd /k "python -m http.server 8090"
echo Waiting for frontend to start...
timeout /t 3 >nul

:: Open browser
echo.
echo ================================================
echo Services Started Successfully!
echo ================================================
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:8090
echo.
echo Login Credentials:
echo Username: admin
echo Password: admin123
echo ================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:8090

echo.
echo Press any key to stop watching (services will continue running)...
pause >nul