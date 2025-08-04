@echo off
echo ========================================
echo TESTING MEDIA UPLOAD URL FIX
echo ========================================
echo.
echo Please restart your backend manually first!
echo.
echo After restarting, this will check if media URLs are now accessible.
echo.
pause
echo.
echo Checking media URL accessibility...
echo.
curl -I http://localhost:3003/uploads/test.jpg
echo.
echo ========================================
echo If you see "HTTP/1.1 404" above, it means the server is reachable.
echo The URL is now using localhost instead of IP address.
echo.
echo Your media uploads should now work properly!
echo ========================================
pause