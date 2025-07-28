@echo off
echo ========================================
echo Starting WAHA (WhatsApp HTTP API)
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js first from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking if WAHA is installed...
waha --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WAHA not found. Installing now...
    echo This may take a few minutes...
    call npm install -g @devlikeapro/waha
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install WAHA!
        echo Try running as Administrator
        pause
        exit /b 1
    )
)

echo.
echo Starting WAHA on port 3000...
echo.
echo ========================================
echo IMPORTANT: Keep this window open!
echo WAHA API will be available at:
echo http://localhost:3000
echo.
echo Press Ctrl+C to stop WAHA
echo ========================================
echo.

REM Start WAHA
set WAHA_BASE_URL=http://localhost:3000
waha

pause