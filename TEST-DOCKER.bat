@echo off
echo ===============================================
echo    TEST DOCKER INSTALLATION
echo ===============================================
echo.

echo 1. Checking Docker version...
docker --version
echo.

echo 2. Checking Docker info...
docker info
echo.

echo 3. Listing Docker images...
docker images
echo.

echo 4. Listing all containers...
docker ps -a
echo.

echo 5. Testing Docker with hello-world...
docker run hello-world
echo.

echo ===============================================
echo If you see errors above, Docker is not properly installed or running.
echo Please:
echo 1. Install Docker Desktop from https://www.docker.com/
echo 2. Start Docker Desktop
echo 3. Wait for it to be ready (whale icon in system tray)
echo 4. Run this test again
echo ===============================================
echo.
pause