@echo off
echo ==========================================
echo Testing Template Toggle Endpoint
echo ==========================================
echo.

echo Step 1: List all templates
echo --------------------------
curl -s "http://localhost:3003/api/templates"
echo.
echo.

echo Step 2: Test toggle endpoint
echo ----------------------------
set /p templateId="Enter template ID to toggle: "
echo.
echo Toggling template %templateId%...
curl -X POST "http://localhost:3003/api/templates/%templateId%/toggle" -H "Content-Type: application/json"
echo.
echo.

echo Step 3: Verify template status changed
echo --------------------------------------
curl -s "http://localhost:3003/api/templates/%templateId%"
echo.
echo.

echo ==========================================
echo Toggle endpoint test complete!
echo The template active status should have changed.
echo ==========================================
echo.
pause