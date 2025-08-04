@echo off
echo ==========================================
echo UPDATE WAHA CONFIGURATION
echo ==========================================
echo.

echo Current WAHA configuration in .env:
echo ----------------------------------
cd backend\whatsapp
findstr "WAHA_" .env
cd ..\..
echo.
echo.

echo Options:
echo --------
echo 1. Set WAHA_API_KEY to empty (no authentication)
echo 2. Keep current configuration
echo 3. Set custom API key
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Setting WAHA_API_KEY to empty...
    cd backend\whatsapp
    powershell -Command "(Get-Content .env) -replace 'WAHA_API_KEY=.*', 'WAHA_API_KEY=' | Set-Content .env"
    echo Done! WAHA_API_KEY is now empty.
    cd ..\..
) else if "%choice%"=="3" (
    echo.
    set /p apikey="Enter WAHA API Key: "
    cd backend\whatsapp
    powershell -Command "(Get-Content .env) -replace 'WAHA_API_KEY=.*', 'WAHA_API_KEY=%apikey%' | Set-Content .env"
    echo Done! WAHA_API_KEY updated.
    cd ..\..
) else (
    echo No changes made.
)

echo.
echo.
echo ==========================================
echo IMPORTANT: Restart backend after changes!
echo.
echo Run: npm start (in backend\whatsapp)
echo ==========================================
echo.
pause