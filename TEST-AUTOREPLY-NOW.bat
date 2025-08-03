@echo off
echo ==============================================
echo TEST AUTOREPLY NOW
echo ==============================================
echo.

:: Quick status check
echo [STATUS CHECK]
curl -s http://localhost:3000/api/sessions/default | findstr "status"
curl -s http://localhost:3003/api/health | findstr "status"
echo.

:: Send test messages
echo [SENDING TEST MESSAGES]
echo ----------------------

:: Test 1: Greeting
echo Test 1: Greeting message...
curl -X POST http://localhost:3003/api/webhooks/waha -H "Content-Type: application/json" -d "{\"event\":\"message\",\"session\":\"default\",\"payload\":{\"from\":\"6281234567890@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"assalamualaikum\",\"type\":\"text\",\"id\":\"test_greeting_%random%\",\"fromMe\":false}}"
echo.
timeout /t 2 /nobreak > nul

:: Test 2: Package info
echo Test 2: Package info...
curl -X POST http://localhost:3003/api/webhooks/waha -H "Content-Type: application/json" -d "{\"event\":\"message\",\"session\":\"default\",\"payload\":{\"from\":\"6281234567890@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"info paket umroh\",\"type\":\"text\",\"id\":\"test_package_%random%\",\"fromMe\":false}}"
echo.
timeout /t 2 /nobreak > nul

:: Test 3: Document requirements
echo Test 3: Document requirements...
curl -X POST http://localhost:3003/api/webhooks/waha -H "Content-Type: application/json" -d "{\"event\":\"message\",\"session\":\"default\",\"payload\":{\"from\":\"6281234567890@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"syarat dokumen\",\"type\":\"text\",\"id\":\"test_docs_%random%\",\"fromMe\":false}}"
echo.

echo.
echo ==============================================
echo CHECK BACKEND CONSOLE FOR:
echo - "=== WEBHOOK RECEIVED ==="
echo - "=== AUTOMATION ENGINE ==="
echo - "=== SENDING TEMPLATE RESPONSE ==="
echo.
echo If you see these logs but no reply,
echo the issue is with message sending.
echo.
echo If you don't see these logs,
echo the webhook is not reaching backend.
echo ==============================================
pause