@echo off
echo ========================================
echo FIXING ALL MODEL IMPORTS
echo ========================================
echo.

cd backend

echo Fixing model imports in controllers...

REM Fix all controllers
powershell -Command "(Get-Content controllers\groupController.js) -replace \"const Group = require\('../models/Group'\);\", \"const { Group } = require('../models');\" | Set-Content controllers\groupController.js"
powershell -Command "(Get-Content controllers\paymentController.js) -replace \"const Payment = require\('../models/Payment'\);\", \"const { Payment } = require('../models');\" | Set-Content controllers\paymentController.js"
powershell -Command "(Get-Content controllers\documentController.js) -replace \"const Document = require\('../models/Document'\);\", \"const { Document } = require('../models');\" | Set-Content controllers\documentController.js"
powershell -Command "(Get-Content controllers\familyController.js) -replace \"const FamilyRelation = require\('../models/FamilyRelation'\);\", \"const { FamilyRelation } = require('../models');\" | Set-Content controllers\familyController.js"
powershell -Command "(Get-Content controllers\brosurController.js) -replace \"const PackageBrosur = require\('../models/PackageBrosur'\);\", \"const { PackageBrosur } = require('../models');\" | Set-Content controllers\brosurController.js"

echo.
echo Fixing model imports in other files...

REM Fix User model imports
powershell -Command "(Get-Content controllers\excelController.js) -replace \"const User = require\('../models/User'\);\", \"const { User } = require('../models');\" | Set-Content controllers\excelController.js"

echo.
echo All model imports fixed!
echo.
echo ========================================
echo Starting backend server now...
echo ========================================
echo.

start "Backend Server - DO NOT CLOSE" cmd /k npm start

echo.
echo Waiting for server to start (20 seconds)...
timeout /t 20 /nobreak

echo.
echo Testing backend...
curl http://localhost:5000/health

echo.
echo ========================================
echo If you see {"status":"OK"} = Backend is running!
echo.
echo IMPORTANT: DO NOT CLOSE the backend window!
echo ========================================
pause