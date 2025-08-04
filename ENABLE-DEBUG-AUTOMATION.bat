@echo off
echo ==========================================
echo Enabling Debug Mode for Automation
echo ==========================================
echo.

echo Setting debug environment variable...
set DEBUG=automation:*
set LOG_LEVEL=debug

echo.
echo Debug mode enabled. Now run the backend with:
echo npm start
echo.
echo The backend will show detailed logs for:
echo - All incoming messages
echo - Rule matching process
echo - Template searching
echo - Response sending
echo.
echo After starting backend, send a test message to see debug logs.
echo.
pause