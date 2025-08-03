@echo off
echo === FIXING ALL PORT CONFIGURATIONS ===
echo.
echo This will update all files from port 3001 to 3003
echo.

:: Run PowerShell script
powershell -ExecutionPolicy Bypass -File "fix-all-ports.ps1"

echo.
pause