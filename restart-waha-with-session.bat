@echo off
echo ========================================
echo  RESTART WAHA WITH PERSISTENT SESSION
echo ========================================

echo 1. Stopping current WAHA container...
docker stop waha 2>nul
docker rm waha 2>nul

echo 2. Creating persistent volume for session data...
docker volume create waha-sessions 2>nul

echo 3. Starting WAHA with persistent session storage...
docker run -d ^
  --name waha ^
  -p 3000:3000 ^
  -v waha-sessions:/app/.sessions ^
  -v waha-sessions:/app/session ^
  -v waha-sessions:/app/storage ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha ^
  devlikeapro/waha

echo 4. Waiting for WAHA to start...
timeout /t 5 /nobreak >nul

echo 5. Checking WAHA status...
curl -s http://localhost:3000/api/version >nul
if %errorlevel%==0 (
    echo ✅ WAHA started successfully with persistent session!
    echo.
    echo 📱 Access WAHA Dashboard: http://localhost:3000/dashboard
    echo 🔗 Backend should connect automatically
    echo.
    echo ⚠️  IMPORTANT: Session data now saved to Docker volume 'waha-sessions'
    echo    Your WhatsApp login will persist across Docker restarts!
) else (
    echo ❌ WAHA failed to start. Check Docker logs:
    echo docker logs waha
)

echo.
echo ========================================
echo  RESTART COMPLETE
echo ========================================
pause