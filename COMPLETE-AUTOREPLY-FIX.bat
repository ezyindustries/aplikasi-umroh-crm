@echo off
echo ==========================================
echo COMPLETE AUTO-REPLY FIX WITH WAHA CHECK
echo ==========================================
echo.

echo STEP 1: Check WAHA Connection
echo -----------------------------
echo Testing WAHA API...
curl -s http://localhost:3000/api/sessions 2>nul | findstr "Unauthorized" >nul
if %errorlevel% equ 0 (
    echo.
    echo WARNING: WAHA requires authentication!
    echo ========================================
    echo Run UPDATE-WAHA-CONFIG.bat first
    echo Choose option 1 (empty API key)
    echo Then restart backend
    echo ========================================
    echo.
    pause
    exit
)
echo WAHA connection OK!
echo.

echo STEP 2: Master Switch ON
echo -----------------------
curl -X POST http://localhost:3003/api/automation/master-switch ^
  -H "Content-Type: application/json" ^
  -d "{\"enabled\":true}"
echo.
echo.

echo STEP 3: Create Test Rule
echo -----------------------
echo Creating keyword rule for "123123"...
curl -X POST http://localhost:3003/api/automation/rules ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test 123 Reply\",\"description\":\"Test auto-reply\",\"ruleType\":\"keyword\",\"triggerType\":\"keyword\",\"triggerConditions\":{\"keywords\":[\"123123\",\"test\",\"halo\"],\"matchType\":\"contains\"},\"responseType\":\"text\",\"responseMessage\":\"✅ AUTO-REPLY BERHASIL! Pesan 123123 diterima. Sistem berfungsi normal.\",\"isActive\":true,\"priority\":100}"
echo.
echo.

echo STEP 4: Test Webhook
echo -------------------
set /p phone="Your phone (628xxx): "
echo.
echo Sending "123123" test...
curl -X POST http://localhost:3003/api/webhooks/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"payload\":{\"id\":\"test_%random%\",\"from\":\"%phone%@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"123123\",\"type\":\"text\",\"fromMe\":false}}"
echo.
echo.

timeout /t 3 /nobreak > nul

echo STEP 5: Check Results
echo --------------------
echo Messages:
curl -s "http://localhost:3003/api/messages/search?phoneNumber=%phone%&limit=5" | findstr /C:"123123" /C:"AUTO-REPLY BERHASIL"
echo.
echo.
echo Logs:
curl -s "http://localhost:3003/api/automation/logs?limit=5" | findstr /C:"Test 123 Reply" /C:"success"
echo.
echo.

echo ==========================================
echo HASIL:
echo.
echo ✅ Jika ada "AUTO-REPLY BERHASIL",
echo    sistem berfungsi!
echo.
echo ❌ Jika tidak ada:
echo    1. Cek console backend
echo    2. Pastikan WAHA API key benar
echo    3. Kirim "123123" dari WA asli
echo ==========================================
echo.
pause