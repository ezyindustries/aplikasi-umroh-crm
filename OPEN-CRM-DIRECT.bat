@echo off
echo Opening CRM Dashboard directly in browser...

REM Get the current directory
set CURRENT_DIR=%~dp0

REM Open CRM in default browser using file:// protocol
start "" "file:///%CURRENT_DIR:\=/%frontend/crm-no-login.html"

echo.
echo ========================================
echo CRM Dashboard opened in browser!
echo.
echo Note: Some features may not work properly
echo when opened as file:// instead of http://
echo.
echo For full functionality, run START-FRONTEND.bat
echo to start a proper web server.
echo ========================================
echo.
pause