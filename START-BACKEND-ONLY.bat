@echo off
echo Starting Backend Server...
echo =========================

:: Start Backend
start "Backend Server" /D "backend\whatsapp" cmd /k "npm start"

echo.
echo Backend server has been started!
echo Backend: http://localhost:3001
echo.
echo Press any key to exit...
pause > nul