@echo off
echo ==========================================
echo DEBUG WEBHOOK DATA STRUCTURE
echo ==========================================
echo.

echo Testing webhook with full data logging...
echo.

set /p phone="Your phone number (628xxx): "
echo.

echo Sending test message with complete structure...
curl -X POST http://localhost:3003/api/webhooks/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"engine\":{\"name\":\"WAHA\",\"version\":\"latest\"},\"payload\":{\"id\":\"debug_%random%\",\"timestamp\":1234567890,\"from\":\"%phone%@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"DEBUG TEST 123123\",\"hasMedia\":false,\"ack\":1,\"type\":\"text\",\"fromMe\":false,\"author\":null,\"authorName\":null,\"chatName\":null}}"

echo.
echo.
echo ==========================================
echo CHECK BACKEND CONSOLE untuk:
echo.
echo 1. "=== WEBHOOK RECEIVED ==="
echo    Lihat struktur data lengkap
echo.
echo 2. "Full Payload:"
echo    Cek apakah ada field "fromMe"
echo.
echo 3. "=== PROCESSING INCOMING MESSAGE ==="
echo    Lihat apakah message diproses
echo.
echo 4. "AUTOMATION ENGINE: PROCESSING MESSAGE"
echo    Lihat apakah automation dipanggil
echo ==========================================
echo.
pause