@echo off
echo === INSTALL WAHA PLUS WITH LICENSE ===
echo.
echo You should have received an email from WAHA with:
echo 1. License Key (WAHA-XXXX-XXXX-XXXX)
echo 2. Docker Hub Username (usually: waha-customer-xxxxx)
echo 3. Docker Hub Password
echo.
echo If you don't have these, check your email (including spam folder)
echo.
pause

echo.
echo Step 1: Docker Login with WAHA Credentials
echo.
echo IMPORTANT: Use the Docker credentials from WAHA email, NOT your personal Docker Hub!
echo.
docker login
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker login failed!
    echo.
    echo Make sure you're using:
    echo - Username from WAHA email (e.g., waha-customer-12345)
    echo - Password from WAHA email
    echo - NOT your personal Docker Hub credentials
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Docker login successful!
echo.

echo Step 2: Stopping old WAHA container...
docker stop waha 2>nul
if %errorlevel% equ 0 (
    echo [OK] WAHA container stopped
) else (
    echo [INFO] No running WAHA container found
)

echo.
echo Step 3: Removing old container...
docker rm waha 2>nul
if %errorlevel% equ 0 (
    echo [OK] Old container removed
) else (
    echo [INFO] No container to remove
)

echo.
echo Step 4: Pulling WAHA Plus image...
docker pull devlikeapro/waha-plus:latest
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to pull WAHA Plus image!
    echo.
    echo This usually means:
    echo 1. Docker login failed or expired - try login again
    echo 2. Wrong credentials - make sure using WAHA credentials, not personal
    echo 3. Network issues - check your connection
    echo.
    echo Try running: docker login
    echo Username: [from WAHA email]
    echo Password: [from WAHA email]
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] WAHA Plus image downloaded!
echo.

echo Step 5: Configure WAHA Plus...
echo.
echo Enter your WAHA Plus License Key
echo Format: WAHA-XXXX-XXXX-XXXX or similar
set /p LICENSE_KEY="License Key: "

echo.
set /p API_KEY="Enter API key for security (or press Enter for 'your-api-key'): "
if "%API_KEY%"=="" set API_KEY=your-api-key

echo.
echo Starting WAHA Plus with:
echo - License: %LICENSE_KEY%
echo - API Key: %API_KEY%
echo - Port: 3000
echo - Webhook: http://host.docker.internal:3003/api/webhook
echo.

docker run -d ^
  --name waha ^
  --restart always ^
  -p 3000:3000 ^
  -e WAHA_LICENSE_KEY=%LICENSE_KEY% ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3003/api/webhook ^
  -e WHATSAPP_HOOK_EVENTS=* ^
  -e WHATSAPP_API_KEY=%API_KEY% ^
  -e WHATSAPP_RESTART_ALL_SESSIONS=true ^
  -e WHATSAPP_FILES_MIMETYPES=audio,document,image,video ^
  -e WHATSAPP_FILES_LIFETIME=180 ^
  -e WHATSAPP_SWAGGER_ENABLED=true ^
  -v waha-data:/app/data ^
  -v waha-media:/app/downloads ^
  devlikeapro/waha-plus:latest

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] WAHA Plus is running!
    echo.
    
    timeout /t 10 /nobreak >nul
    
    echo Checking WAHA Plus status...
    echo.
    
    curl -s http://localhost:3000/api/version
    echo.
    echo.
    
    echo === WAHA PLUS FEATURES ===
    curl -s -H "X-Api-Key: %API_KEY%" http://localhost:3000/api/plus/version 2>nul
    echo.
    echo.
    
    echo === NEXT STEPS ===
    echo.
    echo 1. Open WAHA Dashboard: http://localhost:3000
    echo    - Use API Key: %API_KEY%
    echo.
    echo 2. Scan QR Code for WhatsApp
    echo    - Go to Sessions menu
    echo    - Start session
    echo    - Scan QR with WhatsApp
    echo.
    echo 3. Test image sending:
    echo    http://localhost:8080/test-image-upload.html
    echo.
    echo WAHA Plus is ready to send images, videos, documents!
) else (
    echo.
    echo [ERROR] Failed to start WAHA Plus!
    echo.
    echo Common issues:
    echo 1. Invalid license key - check your email
    echo 2. Port 3000 already in use - stop other containers
    echo 3. Docker issues - restart Docker Desktop
    echo.
    echo To see detailed error:
    echo docker logs waha
)

echo.
pause