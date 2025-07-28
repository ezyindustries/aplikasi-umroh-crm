@echo off
title Fix Backend Dependencies - Aplikasi Umroh
color 0E
cls

echo ================================================
echo    FIXING BACKEND DEPENDENCIES
echo ================================================
echo.

cd backend

echo Installing missing dependencies...
echo.

echo [1/6] Installing node-cron...
call npm install node-cron --save

echo [2/6] Installing other potentially missing packages...
call npm install express-mongo-sanitize --save
call npm install dotenv --save
call npm install winston --save
call npm install socket.io --save
call npm install openai --save

echo.
echo [3/6] Installing all dependencies from package.json...
call npm install

echo.
echo [4/6] Checking for audit issues...
call npm audit fix --force

echo.
echo ================================================
echo    STARTING BACKEND SERVER
echo ================================================
echo.
echo If you see any errors, they will be shown below.
echo DO NOT CLOSE THIS WINDOW!
echo ================================================
echo.

npm start

pause