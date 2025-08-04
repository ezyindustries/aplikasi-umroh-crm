@echo off
echo ==========================================
echo Restarting Backend and Testing Auto-Reply
echo ==========================================
echo.

echo Stopping backend...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Starting backend...
cd backend\whatsapp
start /min cmd /c "npm start"
cd ..\..

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Testing auto-reply...
echo ==========================================

echo Master Switch Status:
curl -s http://localhost:3003/api/automation/master-switch/status
echo.
echo.

echo Active Rules:
curl -s "http://localhost:3003/api/automation/rules?isActive=true" | findstr /C:"name" /C:"ruleType" /C:"keywords"
echo.
echo.

set /p phone="Enter your phone number (628xxx): "
echo.
echo Sending test message "123123"...
curl -X POST http://localhost:3003/api/webhooks/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"message\":{\"id\":\"test_%random%\",\"from\":\"%phone%@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"123123\",\"type\":\"text\",\"fromMe\":false,\"timestamp\":1234567890}}"

echo.
echo.
echo Sending test message "assalamualaikum"...
curl -X POST http://localhost:3003/api/webhooks/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"message\":{\"id\":\"test2_%random%\",\"from\":\"%phone%@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"assalamualaikum\",\"type\":\"text\",\"fromMe\":false,\"timestamp\":1234567891}}"

echo.
echo.
timeout /t 3 /nobreak > nul

echo Recent Automation Logs:
curl -s "http://localhost:3003/api/automation/logs?limit=5" | findstr /C:"status" /C:"rule" /C:"success"

echo.
echo.
echo ==========================================
echo FIXED: fromMe field mapping issue
echo 
echo Backend has been restarted with the fix.
echo Check the backend console for:
echo - "AUTOMATION ENGINE: PROCESSING MESSAGE"
echo - "Rule matched"
echo - "Sending response"
echo ==========================================
echo.
pause