@echo off
echo ==============================================
echo CHECK AUTOREPLY STATUS
echo ==============================================
echo.

:: Check WAHA
echo [WAHA STATUS]
echo -------------
curl -s http://localhost:3000/api/sessions/default > waha_status.json
type waha_status.json | findstr /C:"status" /C:"me"
echo.

:: Check Backend
echo [BACKEND STATUS]
echo ----------------
curl -s http://localhost:3003/api/health
echo.
echo.

:: Check Webhook Config
echo [WEBHOOK CONFIG]
echo ----------------
type waha_status.json | findstr /C:"webhooks" /C:"url"
echo.

:: Check Automation Rules
echo [AUTOMATION RULES]
echo ------------------
curl -s http://localhost:3003/api/automation/rules | findstr /C:"name" /C:"isActive" /C:"ruleType"
echo.
echo.

:: Test Webhook
echo [TEST WEBHOOK]
echo --------------
echo Sending test message...
curl -X POST http://localhost:3003/api/webhooks/waha -H "Content-Type: application/json" -d "{\"event\":\"message\",\"session\":\"default\",\"payload\":{\"from\":\"6281234567890@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"test autoreply\",\"type\":\"text\",\"id\":\"test_%date:~-4%%date:~3,2%%date:~0,2%%time:~0,2%%time:~3,2%%time:~6,2%\",\"fromMe\":false}}"
echo.
echo.

:: Cleanup
del waha_status.json 2>nul

echo ==============================================
echo If webhook test shows {"success":true}
echo but no autoreply, check backend console!
echo ==============================================
pause