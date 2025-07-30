# WAHA Docker Setup Script
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "    WAHA DOCKER SETUP (PowerShell)" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "[1/6] Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# Check if Docker is running
Write-Host ""
Write-Host "[2/6] Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# Stop and remove old container
Write-Host ""
Write-Host "[3/6] Cleaning up old containers..." -ForegroundColor Yellow
docker stop whatsapp-http-api 2>$null
docker rm whatsapp-http-api 2>$null
Write-Host "Cleanup complete" -ForegroundColor Green

# Create data directory
Write-Host ""
Write-Host "[4/6] Creating data directory..." -ForegroundColor Yellow
$dataPath = Join-Path $PSScriptRoot "waha-data"
if (!(Test-Path $dataPath)) {
    New-Item -ItemType Directory -Path $dataPath | Out-Null
    Write-Host "Created: $dataPath" -ForegroundColor Green
} else {
    Write-Host "Directory exists: $dataPath" -ForegroundColor Green
}

# Pull WAHA image
Write-Host ""
Write-Host "[5/6] Pulling WAHA image..." -ForegroundColor Yellow
docker pull devlikeapro/whatsapp-http-api:latest

# Create container
Write-Host ""
Write-Host "[6/6] Creating WAHA container..." -ForegroundColor Yellow
$result = docker run -d `
    --name whatsapp-http-api `
    --restart unless-stopped `
    -p 3000:3000 `
    -v "${dataPath}:/app/data" `
    -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha `
    -e WHATSAPP_HOOK_EVENTS=* `
    devlikeapro/whatsapp-http-api:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "Container created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for WAHA to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Show status
    Write-Host ""
    Write-Host "Container Status:" -ForegroundColor Cyan
    docker ps --filter "name=whatsapp-http-api"
    
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "    SETUP COMPLETE!" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "WAHA API: http://localhost:3000" -ForegroundColor Green
    Write-Host "Swagger UI: http://localhost:3000/swagger" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to create container!" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"