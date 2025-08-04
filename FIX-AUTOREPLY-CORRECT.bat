@echo off
echo ==========================================
echo Fixing Auto-Reply Issue (Corrected)
echo ==========================================
echo.

echo Step 1: Checking Master Switch Status
echo -----------------------------
curl -s http://localhost:3003/api/automation/master-switch/status
echo.
echo.

echo Step 2: Creating Simple Keyword Rule
echo -----------------------------
echo Creating a keyword-based rule that will work...
curl -X POST http://localhost:3003/api/automation/rules ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Simple Test Reply\",\"ruleType\":\"keyword\",\"triggerType\":\"keyword\",\"triggerConditions\":{\"keywords\":[\"test\",\"halo\",\"hello\",\"hi\"],\"matchType\":\"contains\"},\"responseType\":\"text\",\"responseMessage\":\"Halo! Terima kasih telah menghubungi kami. Ini adalah pesan otomatis untuk memastikan sistem automation berfungsi. Tim kami akan segera membalas pesan Anda.\",\"priority\":1,\"isActive\":true,\"cooldownMinutes\":0,\"description\":\"Test rule for auto-reply\"}"

echo.
echo.

echo Step 3: Creating All-Message Rule (Backup)
echo -----------------------------
echo Creating a rule that responds to ALL messages...
curl -X POST http://localhost:3003/api/automation/rules ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Welcome All Messages\",\"ruleType\":\"keyword\",\"triggerType\":\"all\",\"triggerConditions\":{},\"responseType\":\"text\",\"responseMessage\":\"Selamat datang! Kami telah menerima pesan Anda. Tim kami akan segera merespons. Terima kasih.\",\"priority\":10,\"isActive\":true,\"cooldownMinutes\":60,\"description\":\"Catch-all rule for any message\"}"

echo.
echo.

echo Step 4: Checking All Rules
echo -----------------------------
curl -s "http://localhost:3003/api/automation/rules?limit=10"

echo.
echo.
echo ==========================================
echo Rules created! Now test by sending a message.
echo ==========================================
echo.
pause