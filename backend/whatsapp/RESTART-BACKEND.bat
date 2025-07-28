@echo off
echo Restarting WhatsApp CRM Backend...
echo.

:: Kill existing process on port 3001
echo Killing existing process on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo Found process %%a using port 3001
    taskkill /PID %%a /F 2>nul
)

:: Wait a moment
timeout /t 2 /nobreak >nul

:: Start the backend
echo Starting backend...
cd /d "%~dp0"
npm start

pause