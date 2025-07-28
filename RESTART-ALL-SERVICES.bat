@echo off
echo ========================================
echo Restarting All Services
echo ========================================
echo.

echo Step 1: Killing existing processes...
echo Killing process on port 8081 and 3000 (PID: 25556)...
taskkill /PID 25556 /F 2>nul
timeout /t 2 >nul

echo.
echo Step 2: Starting Backend with correct CORS settings...
cd backend
start cmd /k "echo Starting Backend on port 3000... && npm start"
timeout /t 5 >nul

echo.
echo Step 3: Starting Frontend on port 8080...
cd ..\frontend
start cmd /k "echo Starting Frontend on port 8080... && python -m http.server 8080"
timeout /t 3 >nul

echo.
echo ========================================
echo Services Started:
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:8080
echo.
echo Please wait a few seconds for services to fully start
echo Then open: http://localhost:8080
echo ========================================

pause