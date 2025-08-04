@echo off
echo ===============================================
echo FIXING WAHA TIMEOUT CONFIGURATION
echo ===============================================
echo.

echo This will increase WAHA timeout from 30s to 60s
echo and add retry logic for failed messages.
echo.

echo Please follow these steps:
echo.
echo 1. Stop the backend server (Ctrl+C)
echo.
echo 2. Edit backend\whatsapp\src\services\RealWAHAService.js
echo    - Change timeout: 30000 to timeout: 60000 (line 49)
echo.
echo 3. Add retry logic by changing sendTextMessage method
echo    to retry once if timeout occurs
echo.
echo 4. Restart the backend server
echo.
echo 5. If issues persist:
echo    - Check WAHA container: docker logs waha-plus
echo    - Restart WAHA: docker restart waha-plus
echo    - Ensure WhatsApp is connected (scan QR if needed)
echo.
echo ===============================================
echo Common causes of timeout:
echo - WAHA container is overloaded
echo - WhatsApp connection is unstable
echo - Too many messages in queue
echo - Network issues
echo ===============================================
pause