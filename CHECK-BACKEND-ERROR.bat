@echo off
title Backend Error Checker
color 0C
cls

echo ========================================
echo    CHECKING BACKEND ERRORS
echo ========================================
echo.

cd backend

echo Testing database connection...
echo.

REM Create a simple test script
echo const { sequelize } = require('./models'); > test-db.js
echo console.log('Testing database connection...'); >> test-db.js
echo sequelize.authenticate() >> test-db.js
echo   .then(() =^> console.log('DATABASE CONNECTION: SUCCESS')) >> test-db.js
echo   .catch(err =^> console.log('DATABASE CONNECTION FAILED:', err.message)); >> test-db.js

node test-db.js

del test-db.js

echo.
echo ========================================
echo Checking npm dependencies...
echo ========================================
echo.

npm list --depth=0

echo.
echo ========================================
echo If you see missing dependencies above,
echo run: npm install
echo.
echo Common issues:
echo 1. PostgreSQL not running
echo 2. Database 'vauza_tamma_db' doesn't exist
echo 3. Wrong password in .env file
echo 4. Missing npm packages
echo ========================================
echo.
pause