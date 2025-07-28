@echo off
title Fix All Backend Dependencies
color 0E
cls

echo ================================================
echo    FIXING ALL BACKEND DEPENDENCIES
echo ================================================
echo.

cd backend

echo Installing all missing dependencies...
echo.

echo [1/10] Installing marked (for docs)...
call npm install marked --save

echo [2/10] Installing other potentially missing packages...
call npm install node-cron express-mongo-sanitize dotenv winston socket.io openai multer xlsx bcryptjs jsonwebtoken cors helmet compression express-rate-limit --save

echo.
echo [3/10] Installing Sequelize dependencies...
call npm install sequelize pg pg-hstore --save

echo.
echo [4/10] Installing development dependencies...
call npm install --save-dev nodemon jest supertest

echo.
echo [5/10] Running npm install to catch any missing...
call npm install

echo.
echo [6/10] Fixing any vulnerabilities...
call npm audit fix --force

echo.
echo ================================================
echo    DEPENDENCIES FIXED! STARTING SERVER...
echo ================================================
echo.

npm start

pause