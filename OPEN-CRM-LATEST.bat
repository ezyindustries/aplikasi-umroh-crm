@echo off
echo ================================================
echo    OPENING LATEST CRM DASHBOARD
echo ================================================
echo.

echo Available CRM versions:
echo.
echo 1. CRM No Login (Recommended - Latest)
echo    Path: frontend\crm-no-login.html
echo    URL: http://localhost:8080/crm-no-login.html
echo.
echo 2. CRM Complete (Full features)
echo    Path: frontend\crm-complete.html
echo    URL: http://localhost:8080/crm-complete.html
echo.
echo 3. Main App (With login)
echo    Path: frontend\index.html
echo    URL: http://localhost:8080/index.html
echo.
echo ================================================
echo Opening CRM No Login (Latest version)...
echo ================================================
echo.

REM Check if frontend server is running
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend server is running. Opening in browser...
    start "" "http://localhost:8080/crm-no-login.html"
) else (
    echo Frontend server not running. Opening file directly...
    start "" "%~dp0frontend\crm-no-login.html"
)

echo.
echo ================================================
echo QUICK ACCESS LINKS:
echo ================================================
echo.
echo Main CRM: http://localhost:8080/crm-no-login.html
echo Complete: http://localhost:8080/crm-complete.html
echo Main App: http://localhost:8080/index.html
echo.
echo File locations:
echo - %~dp0frontend\crm-no-login.html
echo - %~dp0frontend\crm-complete.html
echo - %~dp0frontend\index.html
echo.
pause