@echo off
echo ==========================================
echo Testing Auto-Reply System (Fixed)
echo ==========================================
echo.

echo Step 1: Check Master Switch
echo -----------------------------
curl -s http://localhost:3003/api/automation/master-switch/status
echo.
echo.

echo Step 2: Update Smart Rule to Keyword Type
echo -----------------------------
echo Converting template rule to keyword rule...
curl -X PUT "http://localhost:3003/api/automation/rules/fb60da65-380d-4735-9f9c-beed3eacf378" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Smart Auto Reply\",\"ruleType\":\"keyword\",\"triggerType\":\"keyword\",\"triggerConditions\":{\"keywords\":[\"halo\",\"hello\",\"hi\",\"test\",\"info\",\"paket\",\"umroh\"],\"matchType\":\"contains\"},\"responseType\":\"text\",\"responseMessage\":\"Assalamualaikum! Terima kasih telah menghubungi kami. Ada yang bisa kami bantu terkait paket umroh? Silakan tanyakan informasi yang Anda butuhkan.\",\"isActive\":true,\"priority\":1,\"cooldownMinutes\":5,\"description\":\"Smart keyword-based auto reply\"}"

echo.
echo.

echo Step 3: Test with Real Webhook
echo -----------------------------
set /p phone="Enter your phone number (format: 628xxx): "
echo.

echo Sending test webhook message...
curl -X POST http://localhost:3003/api/webhooks/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"message\":{\"id\":\"test_%random%\",\"from\":\"%phone%@c.us\",\"to\":\"628113032232@c.us\",\"body\":\"halo, info paket umroh dong\",\"type\":\"text\",\"fromMe\":false,\"pushname\":\"Test User\",\"timestamp\":1234567890}}"

echo.
echo.

echo Step 4: Alternative - Send via API
echo -----------------------------
echo Trying alternative API endpoint...
curl -X POST http://localhost:3003/api/messages/test-automation ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\":\"%phone%\",\"message\":\"test auto reply sistem\"}"

echo.
echo.

echo Step 5: Check Recent Messages
echo -----------------------------
timeout /t 2 /nobreak > nul
curl -s "http://localhost:3003/api/messages/search?phoneNumber=%phone%&limit=5"

echo.
echo.
echo ==========================================
echo Check backend console for:
echo - "=== WEBHOOK RECEIVED ==="
echo - "AUTOMATION ENGINE: PROCESSING MESSAGE"
echo - "Rule matched: Smart Auto Reply"
echo ==========================================
echo.
pause