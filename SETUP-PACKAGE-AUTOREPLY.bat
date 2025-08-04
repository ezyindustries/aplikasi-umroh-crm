@echo off
echo ===============================================
echo SETTING UP PACKAGE AUTOREPLY SYSTEM
echo ===============================================
echo.

echo IMPORTANT: Please restart your backend server first!
echo The controller has been updated to accept JSON directly.
echo.
echo Press any key after restarting the backend...
pause >nul

echo.
echo [1] Enabling master automation switch...
node enable-automation.js

echo.
echo [2] Creating package autoreply rule...
node create-package-autoreply-rule.js

echo.
echo ===============================================
echo Setup complete!
echo.
echo Test the system by sending messages like:
echo - "paket dubai 10 hari"
echo - "#2026_9H_SBY_MED_JAN_FEB"
echo - "umroh september"
echo - "paket 12 hari"
echo.
echo The system will:
echo 1. Match keywords to find the right template
echo 2. Send 3-5 package images
echo 3. Send package details text
echo.
echo Monitor responses in:
echo - Autoreply Management page
echo - Backend console logs
echo ===============================================
pause