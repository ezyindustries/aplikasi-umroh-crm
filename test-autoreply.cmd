@echo off
echo Creating test automation rule...

curl -X POST http://localhost:3003/api/automation/rules ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Autoreply\",\"description\":\"Test rule\",\"ruleType\":\"keyword\",\"keywords\":[\"test\",\"halo\",\"hi\"],\"responseMessages\":[{\"type\":\"text\",\"content\":\"Terima kasih telah menghubungi kami!\",\"order\":0}],\"responseDelay\":1,\"messageDelay\":1,\"isActive\":true}"

echo.
echo Done! Try sending "test", "halo", or "hi" to WhatsApp.
pause