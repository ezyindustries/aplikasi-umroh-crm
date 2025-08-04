@echo off
echo Checking Automation Database...
echo.

cd backend\whatsapp

echo Running SQLite query to check automation rules...
sqlite3 data\whatsapp-crm.db "SELECT id, rule_name, rule_type, is_active, priority FROM automation_rules;"

echo.
echo Checking automation logs (last 5)...
sqlite3 data\whatsapp-crm.db "SELECT event_type, event_description, created_at FROM automation_logs ORDER BY created_at DESC LIMIT 5;"

echo.
pause