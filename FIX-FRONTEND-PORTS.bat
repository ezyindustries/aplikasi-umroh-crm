@echo off
echo === FIXING FRONTEND PORT CONFIGURATION ===
echo.
echo Checking all HTML files for old port 3001...
echo.

cd /d "D:\ezyin\Documents\aplikasi umroh\frontend"

:: Find all files with localhost:3003
echo Files using old port 3001:
findstr /m "localhost:3003" *.html

echo.
echo Updating port from 3001 to 3003 in all HTML files...

:: Update all HTML files
powershell -Command "(Get-Content -Path '*.html' -Raw) -replace 'localhost:3003', 'localhost:3003' | Set-Content -Path $_.FullName -NoNewline" 2>nul

:: Verify changes
echo.
echo Verification - Files still using port 3001:
findstr /m "localhost:3003" *.html 2>nul
if %errorlevel% equ 1 (
    echo None found - All files updated successfully!
)

echo.
echo Files now using port 3003:
findstr /m "localhost:3003" *.html

echo.
echo Port configuration update complete!
echo Please refresh your browser to see the changes.
echo.
pause