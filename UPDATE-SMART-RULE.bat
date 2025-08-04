@echo off
echo ==========================================
echo Updating Smart Template Response Rule
echo ==========================================
echo.

echo Current Rule ID: fb60da65-380d-4735-9f9c-beed3eacf378
echo.

echo Converting to keyword-based rule...
echo -----------------------------
curl -X PUT "http://localhost:3003/api/automation/rules/fb60da65-380d-4735-9f9c-beed3eacf378" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Smart Auto Reply\",\"ruleType\":\"keyword\",\"triggerType\":\"keyword\",\"triggerConditions\":{\"keywords\":[\"halo\",\"hello\",\"hi\",\"assalamualaikum\",\"info\",\"tanya\",\"berapa\",\"paket\",\"umroh\",\"haji\"],\"matchType\":\"contains\"},\"responseType\":\"text\",\"responseMessage\":\"Assalamualaikum, terima kasih telah menghubungi kami. Kami adalah travel umroh terpercaya. Ada yang bisa kami bantu? Silakan tanyakan tentang paket umroh, jadwal keberangkatan, atau informasi lainnya. Tim kami akan segera membantu Anda.\",\"isActive\":true,\"priority\":1,\"cooldownMinutes\":5}"

echo.
echo.
echo Checking updated rule:
echo -----------------------------
curl -s "http://localhost:3003/api/automation/rules/fb60da65-380d-4735-9f9c-beed3eacf378"

echo.
echo.
echo ==========================================
echo Rule updated! The system will now respond to:
echo - halo, hello, hi
echo - assalamualaikum
echo - info, tanya
echo - berapa (for price inquiries)
echo - paket, umroh, haji
echo ==========================================
echo.
pause