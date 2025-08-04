@echo off
echo ===============================================
echo TESTING PACKAGE AUTOREPLY WITH IMAGES
echo ===============================================
echo.
echo This will simulate a customer asking about a package
echo and verify that the system sends images + text.
echo.
echo Make sure:
echo 1. Backend server is running
echo 2. WAHA is connected (WhatsApp logged in)
echo 3. Template-based rule is active
echo.
echo Test keywords to try:
echo - "paket dubai"
echo - "10 hari dubai"  
echo - "dbx sep"
echo - "paket 10 hari"
echo.
echo The system should respond with:
echo 1. 3 images from the package folder
echo 2. Text with package details
echo.
echo You can monitor the response in:
echo - Autoreply Management page
echo - Backend console logs
echo - WhatsApp conversation
echo.
echo ===============================================
pause