@echo off
title WhatsApp CRM - Quick Start
color 0E

echo ============================================
echo      WHATSAPP CRM - QUICK START
echo ============================================
echo.
echo Starting all services in one window...
echo.

:: Check Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

:: Clean up
docker stop waha >nul 2>&1
docker rm waha >nul 2>&1

:: Create a temporary batch file to run all services
echo @echo off > temp_start.bat
echo title WhatsApp CRM - All Services >> temp_start.bat
echo echo Starting WAHA Docker... >> temp_start.bat
echo start /B docker run -it --rm -p 3000:3000/tcp --name waha devlikeapro/waha >> temp_start.bat
echo timeout /t 10 /nobreak ^> nul >> temp_start.bat
echo echo. >> temp_start.bat
echo echo Starting WhatsApp Backend... >> temp_start.bat
echo cd /d "%~dp0backend\whatsapp" >> temp_start.bat
echo start /B npm start >> temp_start.bat
echo cd /d "%~dp0" >> temp_start.bat
echo timeout /t 5 /nobreak ^> nul >> temp_start.bat
echo echo. >> temp_start.bat
echo echo Starting Frontend Server... >> temp_start.bat
echo cd /d "%~dp0frontend" >> temp_start.bat
echo npx http-server -p 8080 -c-1 --cors >> temp_start.bat

:: Run the temporary batch file
start "WhatsApp CRM Services" cmd /k temp_start.bat

:: Wait and open browser
echo Waiting for services to start (20 seconds)...
timeout /t 20 /nobreak > nul

:: Clean up temp file
del temp_start.bat >nul 2>&1

:: Open browser
start http://localhost:8080/conversations-beautiful.html

echo.
echo ============================================
echo Services are starting in a single window!
echo.
echo URLs:
echo - Conversations: http://localhost:8080/conversations-beautiful.html
echo - CRM Dashboard: http://localhost:8080/crm-main.html
echo.
echo To stop: Close the "WhatsApp CRM Services" window
echo ============================================
echo.
pause