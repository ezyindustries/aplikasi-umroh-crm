@echo off
echo Running WAHA Setup with PowerShell...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0Setup-WAHA.ps1"
pause