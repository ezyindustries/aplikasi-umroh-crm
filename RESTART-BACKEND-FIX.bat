@echo off
echo ==============================================
echo RESTART BACKEND WITH AUTOREPLY FIX
echo ==============================================
echo.

:: Kill existing backend
echo [1] Stopping existing backend...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found_ip
    )
)
:found_ip

:: Update .env file with correct APP_URL
echo [2] Updating backend configuration...
cd backend\whatsapp
powershell -Command "(Get-Content .env) -replace 'APP_URL=.*', 'APP_URL=http://%LOCAL_IP%:3003' | Set-Content .env"
echo    APP_URL updated to: http://%LOCAL_IP%:3003

:: Start backend
echo.
echo [3] Starting backend server...
echo    Backend will run at: http://localhost:3003
echo    Webhook URL: http://%LOCAL_IP%:3003/api/webhooks/waha
echo.
start "WhatsApp CRM Backend" cmd /k "npm start"

:: Wait for backend to start
echo [4] Waiting for backend to start...
timeout /t 5 /nobreak > nul

:: Update WAHA webhook
echo.
echo [5] Updating WAHA webhook configuration...
curl -X PUT http://localhost:3000/api/sessions/default -H "Content-Type: application/json" -d "{\"config\":{\"webhooks\":[{\"url\":\"http://%LOCAL_IP%:3003/api/webhooks/waha\",\"events\":[\"message\",\"message.any\",\"session.status\",\"message.ack\"],\"hmac\":{\"key\":\"your-webhook-secret\"},\"retries\":{\"delaySeconds\":2,\"attempts\":5}}]}}"
echo.
echo    Webhook updated!

:: Test webhook
echo.
echo [6] Testing webhook connection...
timeout /t 2 /nobreak > nul
curl -X POST http://localhost:3003/api/webhooks/waha -H "Content-Type: application/json" -d "{\"event\":\"test\",\"session\":\"default\",\"payload\":{\"test\":true}}"
echo.

echo.
echo ==============================================
echo BACKEND RESTARTED WITH AUTOREPLY FIX!
echo ==============================================
echo.
echo Test by sending WhatsApp message containing:
echo - "assalamualaikum" 
echo - "info paket"
echo - "syarat dokumen"
echo.
echo Watch the backend console for webhook logs!
echo ==============================================
pause