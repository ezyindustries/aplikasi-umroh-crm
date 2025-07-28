@echo off
echo Checking what's using port 3001...
echo.

netstat -ano | findstr :3001
echo.

echo To kill the process using port 3001:
echo 1. Find the PID in the last column above
echo 2. Run: taskkill /PID [PID_NUMBER] /F
echo.
echo Or use Docker commands:
echo docker ps --filter "publish=3001"
echo docker stop [CONTAINER_ID]
echo.
pause