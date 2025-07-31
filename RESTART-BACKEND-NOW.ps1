Write-Host "=== Restarting Backend ===" -ForegroundColor Green

# Kill processes on port 3001
Write-Host "Stopping existing backend..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $processes) {
    Write-Host "Killing process $pid"
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2

# Start backend
Write-Host "Starting backend..." -ForegroundColor Green
Set-Location "$PSScriptRoot\backend\whatsapp"
Start-Process npm -ArgumentList "start" -WindowStyle Minimized

Write-Host "Backend restarted! Waiting for it to initialize..." -ForegroundColor Green
Start-Sleep -Seconds 5

Write-Host "Testing API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method Get
    Write-Host "Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "Backend may still be starting up. Please wait a moment." -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")