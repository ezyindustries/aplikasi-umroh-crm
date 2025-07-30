@echo off
echo ===============================================
echo    DOCKER WAHA SETUP
echo ===============================================
echo.

echo Checking Docker...
docker --version

echo.
echo Current containers:
docker ps -a

echo.
echo Press any key to continue...
pause >nul