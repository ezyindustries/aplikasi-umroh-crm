@echo off
echo ===============================================
echo START FRONTEND SERVER
echo ===============================================
echo.

:: Check if port 8080 is in use
echo Checking port 8080...
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo Port 8080 already in use!
    echo.
    echo Killing existing process...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 /nobreak >nul
)

:: Start frontend
echo Starting frontend server...
cd /d "%~dp0frontend"

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo.
echo Frontend will run on: http://localhost:8080
echo.
echo Main pages:
echo - CRM Dashboard: http://localhost:8080/crm-main.html
echo - Conversations: http://localhost:8080/conversations-beautiful.html
echo - Debug Media: http://localhost:8080/debug-media.html
echo.
echo Starting server...
echo.

python -m http.server 8080