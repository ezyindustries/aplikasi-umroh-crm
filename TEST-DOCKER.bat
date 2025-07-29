@echo off
echo Testing Docker...
echo.

docker --version
if %errorlevel% neq 0 (
    echo Docker NOT installed
) else (
    echo Docker is installed
)

echo.
docker ps
if %errorlevel% neq 0 (
    echo Docker is NOT running
) else (
    echo Docker is running
)

echo.
echo Press any key to exit...
pause >nul