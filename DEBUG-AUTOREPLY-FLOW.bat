@echo off
echo ==========================================
echo DEBUG AUTO-REPLY FLOW (STEP BY STEP)
echo ==========================================
echo.

echo STEP 1: Check Master Switch
echo --------------------------
curl -s http://localhost:3003/api/automation/master-switch/status
echo.
echo.

echo STEP 2: List Active Rules
echo ------------------------
echo Rules dengan keyword "123123":
curl -s "http://localhost:3003/api/automation/rules?isActive=true" | findstr /C:"123123" /C:"name" /C:"keywords"
echo.
echo.

echo STEP 3: Send Real Message via CRM
echo ---------------------------------
echo Kirim pesan "123123" dari WhatsApp Anda
echo ke nomor yang terhubung dengan sistem.
echo.
echo Tekan Enter setelah mengirim pesan...
pause > nul
echo.

echo STEP 4: Check Message in Database
echo --------------------------------
set /p phone="Masukkan nomor Anda (628xxx): "
echo.
echo Mencari pesan terbaru...
curl -s "http://localhost:3003/api/messages/search?phoneNumber=%phone%&limit=5" > recent_msg.json
type recent_msg.json | findstr /C:"123123" /C:"content" /C:"direction"
echo.
echo.

echo STEP 5: Check Automation Logs
echo -----------------------------
echo Log automation terbaru:
curl -s "http://localhost:3003/api/automation/logs?limit=10" > auto_logs.json
type auto_logs.json | findstr /C:"status" /C:"error" /C:"skippedReason" /C:"messageId"
echo.
echo.

echo STEP 6: Test Rule Matching Directly
echo ----------------------------------
echo Test apakah "123123" match dengan rule...
curl -X POST "http://localhost:3003/api/automation/test-rule-match" ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"123123\",\"ruleType\":\"keyword\"}"
echo.
echo.

del recent_msg.json auto_logs.json 2>nul

echo ==========================================
echo ANALISIS:
echo.
echo 1. Jika pesan "123123" ada di database (Step 4)
echo    = Webhook berfungsi
echo.
echo 2. Jika tidak ada log automation (Step 5)  
echo    = AutomationEngine tidak dipanggil
echo.
echo 3. Jika ada log dengan error/skipped
echo    = Ada masalah dengan rule matching
echo.
echo CHECK BACKEND CONSOLE untuk log detail!
echo ==========================================
echo.
pause