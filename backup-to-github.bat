@echo off
echo ===============================================
echo BACKUP TO GITHUB
echo ===============================================
echo.

REM Initialize git if not already initialized
if not exist .git (
    echo Initializing Git repository...
    git init
    echo.
)

REM Check if remote exists
git remote -v | findstr origin >nul
if errorlevel 1 (
    echo Adding GitHub remote...
    echo Please enter your GitHub repository URL:
    echo Example: https://github.com/username/aplikasi-umroh.git
    set /p REPO_URL=GitHub URL: 
    git remote add origin %REPO_URL%
    echo.
)

echo Creating .gitignore file...
echo # Dependencies > .gitignore
echo node_modules/ >> .gitignore
echo package-lock.json >> .gitignore
echo.
echo # Environment files >> .gitignore
echo .env >> .gitignore
echo .env.local >> .gitignore
echo .env.production >> .gitignore
echo.
echo # Database >> .gitignore
echo *.db >> .gitignore
echo *.sqlite >> .gitignore
echo backend/whatsapp/data/*.db >> .gitignore
echo.
echo # Logs >> .gitignore
echo *.log >> .gitignore
echo logs/ >> .gitignore
echo.
echo # Media uploads >> .gitignore
echo uploads/ >> .gitignore
echo backend/whatsapp/uploads/ >> .gitignore
echo.
echo # Temporary files >> .gitignore
echo *.tmp >> .gitignore
echo temp/ >> .gitignore
echo.
echo # Docker volumes >> .gitignore
echo waha-data/ >> .gitignore
echo.
echo # OS files >> .gitignore
echo .DS_Store >> .gitignore
echo Thumbs.db >> .gitignore
echo.
echo # Test files >> .gitignore
echo test-*.js >> .gitignore
echo debug-*.js >> .gitignore
echo check-*.js >> .gitignore
echo fix-*.js >> .gitignore
echo *-test.js >> .gitignore
echo *-debug.js >> .gitignore
echo.
echo # Batch files for testing >> .gitignore
echo TEST-*.bat >> .gitignore
echo DEBUG-*.bat >> .gitignore
echo CHECK-*.bat >> .gitignore
echo FIX-*.bat >> .gitignore

echo.
echo Adding all files...
git add .

echo.
echo Creating commit...
git commit -m "Complete WhatsApp CRM with AutoReply System - Package templates with media support"

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo ===============================================
echo Backup completed!
echo ===============================================
echo.
echo Your code has been backed up to GitHub.
echo.
echo Important files included:
echo - Frontend (HTML/CSS/JS)
echo - Backend (Node.js/Express)
echo - Models and Database structure
echo - AutoReply system with templates
echo - Media handling system
echo - All configuration files
echo.
echo Files excluded (in .gitignore):
echo - node_modules
echo - Database files (.db)
echo - Environment files (.env)
echo - Uploads folder
echo - Test/debug scripts
echo ===============================================
pause