@echo off
echo ==========================================
echo Debugging Template Rule Issue
echo ==========================================
echo.

echo Step 1: Check if templates exist
echo -----------------------------
curl -s "http://localhost:3003/api/templates"
echo.
echo.

echo Step 2: Check template matching endpoint
echo -----------------------------
curl -X POST "http://localhost:3003/api/templates/match" ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"halo info paket umroh\",\"category\":\"inquiry\"}"
echo.
echo.

echo Step 3: Check if CustomTemplate model exists
echo -----------------------------
cd backend\whatsapp
echo Checking for CustomTemplate files...
dir /s /b *template*.js 2>nul | findstr /i "model\|service"
cd ..\..
echo.
echo.

echo Step 4: Test rule directly
echo -----------------------------
echo Testing rule fb60da65-380d-4735-9f9c-beed3eacf378...
curl -X POST "http://localhost:3003/api/automation/rules/fb60da65-380d-4735-9f9c-beed3eacf378/test" ^
  -H "Content-Type: application/json" ^
  -d "{\"testMessage\":\"halo test\",\"phoneNumber\":\"628155555000\"}"
echo.
echo.

echo Step 5: Check rule trigger conditions
echo -----------------------------
curl -s "http://localhost:3003/api/automation/rules/fb60da65-380d-4735-9f9c-beed3eacf378"
echo.
echo.

echo ==========================================
echo If templates don't exist or match fails,
echo the template rule cannot work.
echo Run TEST-AUTOREPLY-FIXED.bat to convert
echo to keyword rule instead.
echo ==========================================
echo.
pause