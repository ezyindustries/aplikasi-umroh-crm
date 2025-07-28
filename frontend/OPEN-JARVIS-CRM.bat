@echo off
echo ================================================
echo Starting JARVIS CRM System
echo ================================================
echo.
echo Initializing AI Assistant...
echo.

:: Check if Python HTTP server is already running on port 8080
netstat -an | findstr :8080 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo Starting JARVIS interface...
    cd /d "%~dp0"
    start /min cmd /c "python -m http.server 8080"
    timeout /t 3 >nul
) else (
    echo JARVIS already online on port 8080
)

echo.
echo Launching JARVIS CRM...
start http://localhost:8080/crm-jarvis.html

echo.
echo ================================================
echo JARVIS CRM System Active
echo.
echo "At your service, Sir."
echo ================================================
echo.
timeout /t 5 >nul