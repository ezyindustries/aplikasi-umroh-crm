@echo off
title Kill Port 3001
color 0C

echo Killing process on port 3001...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Killing PID: %%a
    taskkill /PID %%a /F
)

echo.
echo Port 3001 is now free!
echo.
pause