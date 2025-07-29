@echo off
echo Starting Frontend Server...
echo ==========================

:: Start Frontend
start "Frontend Server" /D "frontend" cmd /k "python -m http.server 8080"

echo.
echo Frontend server has been started!
echo Frontend: http://localhost:8080
echo.
echo Press any key to exit...
pause > nul