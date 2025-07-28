@echo off
title Open Beautiful Conversation Page
color 0A
cls

echo ================================================
echo    OPENING BEAUTIFUL CONVERSATION PAGE
echo ================================================
echo.

echo Checking if frontend server is running...
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting frontend server...
    cd frontend
    start "Frontend Server" /min cmd /c "python -m http.server 8080"
    cd ..
    echo Waiting for server to start...
    timeout /t 3 /nobreak >nul
)

echo.
echo Opening conversation page in browser...
start "" "http://localhost:8080/conversations-beautiful.html"

echo.
echo ================================================
echo    CONVERSATION PAGE OPENED
echo ================================================
echo.
echo Features:
echo - Beautiful glass morphism design
echo - 3-column layout (contacts, chat, info)
echo - Smooth animations
echo - Typing indicators
echo - Voice messages
echo - File attachments
echo - Emoji picker
echo - Quick replies
echo - Search functionality
echo.
pause