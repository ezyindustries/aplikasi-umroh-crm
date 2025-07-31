@echo off
echo ===============================================
echo RUNNING DATABASE MIGRATIONS
echo ===============================================
echo.

cd /d "%~dp0backend\whatsapp"

echo [1/2] Running group chat and media support migration...
node migrations\add_group_chat_support.js

echo.
echo [2/2] Running resolved_by column migration...
node migrations\add_resolved_by_column.js

echo.
echo ✅ All migrations completed!
echo.
echo You can now:
echo - Send and receive media messages (images, videos, documents, etc.)
echo - Participate in group chats
echo - See group member names in messages
echo - View different types of media with proper UI
echo.
pause