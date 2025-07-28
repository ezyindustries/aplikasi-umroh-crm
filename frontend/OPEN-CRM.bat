@echo off
echo ================================================
echo Starting Vauza Tamma CRM
echo ================================================
echo.

:: Check if Python HTTP server is already running on port 8080
netstat -an | findstr :8080 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo Starting web server...
    cd /d "%~dp0"
    start /min cmd /c "python -m http.server 8080"
    timeout /t 3 >nul
) else (
    echo Server already running on port 8080
)

echo.
echo Opening CRM Dashboard...
start http://localhost:8080/crm-main.html

echo.
echo ================================================
echo CRM is now running!
echo Access at: http://localhost:8080/crm-main.html
echo ================================================
echo.
echo Press any key to close this window...
pause >nul