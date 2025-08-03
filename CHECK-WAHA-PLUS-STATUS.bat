@echo off
echo === CHECK WAHA PLUS STATUS ===
echo.

echo 1. Container Status:
docker ps | findstr waha
echo.

echo 2. WAHA Version:
curl -s http://localhost:3000/api/version
echo.
echo.

echo 3. Health Check:
curl -s http://localhost:3000/api/health
echo.
echo.

echo 4. Sessions Status:
curl -s -H "X-Api-Key: your-api-key" http://localhost:3000/api/sessions
echo.
echo.

echo 5. Plus Features Check:
curl -s -H "X-Api-Key: your-api-key" http://localhost:3000/api/plus/version 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Plus endpoint might need different auth or not available yet
)
echo.
echo.

echo === TEST RESULTS ===
echo If you see:
echo - Container running: YES
echo - Version info: YES
echo - Health: OK
echo - Sessions: Listed
echo.
echo Then WAHA Plus is working!
echo.
echo Next: Test image upload at http://localhost:8080/test-image-upload.html
echo.
pause