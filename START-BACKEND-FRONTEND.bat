@echo off
echo Starting Backend and Frontend Services...
echo ========================================

:: Start Backend
echo Starting Backend Server...
start "Backend Server" /D "backend\whatsapp" cmd /k "npm start"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Frontend
echo Starting Frontend Server...
start "Frontend Server" /D "frontend" cmd /k "python -m http.server 8080"

echo.
echo Both services have been started!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:8080
echo.
echo Press any key to exit...
pause > nul