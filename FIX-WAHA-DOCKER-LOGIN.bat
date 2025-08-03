@echo off
echo === FIX WAHA PLUS DOCKER LOGIN ===
echo.
echo I see you're logged in with personal Docker Hub (muchammad)
echo We need to logout and login with WAHA credentials instead
echo.
pause

echo.
echo Step 1: Logout from current Docker account...
docker logout
echo.
echo [OK] Logged out from Docker Hub
echo.

echo Step 2: Login with WAHA Plus credentials
echo.
echo IMPORTANT: You need credentials from WAHA email:
echo - Username: waha-customer-xxxxx (NOT 'muchammad')
echo - Password: From WAHA email (NOT your personal password)
echo.
echo If you don't have these, check:
echo 1. Email from WAHA/DevLike after purchase
echo 2. Spam/Junk folder
echo 3. Purchase confirmation page
echo.
pause

echo.
echo Now logging in with WAHA credentials...
echo When prompted, enter:
echo - Username from WAHA email (e.g., waha-customer-12345)
echo - Password from WAHA email
echo.
docker login

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Login failed!
    echo.
    echo Make sure you're using credentials from WAHA email
    echo NOT your personal Docker Hub account
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Docker login successful!
echo.

echo Step 3: Verify correct login...
docker pull devlikeapro/waha-plus:latest

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Cannot pull WAHA Plus image!
    echo This means wrong credentials were used.
    echo.
    echo Please run this script again with correct WAHA credentials
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] WAHA Plus access confirmed!
echo.
echo Now run: INSTALL-WAHA-PLUS-LICENSE.bat
echo.
pause