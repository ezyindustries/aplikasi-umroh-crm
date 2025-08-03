@echo off
echo === RUN WAHA PLUS COMMANDS ===
echo.
echo This will help you run the commands from WAHA email/documentation
echo.
echo First, let's make sure you're in the right directory...
cd /d D:\ezyin\Documents\aplikasi umroh
echo Current directory: %CD%
echo.
pause

echo.
echo Step 1: Open Command Prompt here
echo.
echo You can run commands in:
echo 1. This window (continue below)
echo 2. New CMD window (press Windows+R, type 'cmd', Enter)
echo 3. PowerShell
echo 4. Docker Desktop Terminal
echo.
echo Let's continue in this window...
echo.
pause

echo.
echo Step 2: Logout from personal Docker account first
echo.
docker logout
echo.
echo [OK] Logged out
echo.

echo Step 3: Now paste your WAHA commands
echo.
echo Common WAHA commands format:
echo.
echo   docker login -u waha-customer-xxxxx -p your-password-here
echo   docker pull devlikeapro/waha-plus:latest
echo   docker run ... (with your license key)
echo.
echo You can now type or paste commands below:
echo.
cmd /k