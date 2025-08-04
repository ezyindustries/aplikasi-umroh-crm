@echo off
echo Checking Templates in Database...
echo.

cd backend\whatsapp

echo Running query to check templates...
echo SELECT id, template_name, category, is_active FROM custom_templates; > temp_query.sql
sqlite3 data\whatsapp-crm.db < temp_query.sql
del temp_query.sql

echo.
echo Checking automation rules details...
echo SELECT id, rule_name, trigger_conditions FROM automation_rules WHERE rule_type = 'template'; > temp_query.sql
sqlite3 data\whatsapp-crm.db < temp_query.sql
del temp_query.sql

echo.
pause