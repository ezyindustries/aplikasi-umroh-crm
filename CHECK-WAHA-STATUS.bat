@echo off
echo ===============================================
echo CHECKING WAHA STATUS AND CONNECTION
echo ===============================================
echo.

echo [1] Checking if WAHA is running on port 3000...
netstat -an | findstr :3000
echo.

echo [2] Testing WAHA health endpoint...
curl -X GET http://localhost:3000/health
echo.
echo.

echo [3] Testing WAHA session status...
curl -X GET http://localhost:3000/api/sessions/default -H "X-Api-Key: your-api-key"
echo.
echo.

echo [4] Checking WAHA auth status...
curl -X GET http://localhost:3000/api/sessions/default/auth -H "X-Api-Key: your-api-key"
echo.
echo.

echo [5] Getting QR code status...
curl -X GET http://localhost:3000/api/sessions/default/auth/qr -H "X-Api-Key: your-api-key"
echo.
echo.

echo ===============================================
echo If WAHA is not running or not authenticated,
echo please check:
echo 1. WAHA container is running (docker ps)
echo 2. WhatsApp is properly connected (scan QR)
echo 3. Session is not expired
echo ===============================================
pause