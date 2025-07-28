# PowerShell script to start backend
Write-Host "Starting Backend Server..." -ForegroundColor Green
Set-Location -Path "backend"
Start-Process npm -ArgumentList "start" -NoNewWindow
Write-Host "Backend server process started!" -ForegroundColor Yellow
Write-Host "Window will stay open to show server logs" -ForegroundColor Cyan