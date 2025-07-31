# WhatsApp CRM System Status Check
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "SYSTEM STATUS CHECK" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Function to check service
function Test-Service {
    param($Name, $Url, $Expected = "")
    
    Write-Host "Checking $Name..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ $Name is running" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "✗ $Name is NOT running" -ForegroundColor Red
        return $false
    }
    Write-Host ""
}

# 1. Check Docker
Write-Host "[1] Docker Status:" -ForegroundColor White
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "✓ Docker installed: $dockerVersion" -ForegroundColor Green
        
        $dockerRunning = docker ps 2>$null
        if ($?) {
            Write-Host "✓ Docker is running" -ForegroundColor Green
            
            $wahaContainer = docker ps --filter "name=whatsapp-http-api" --format "{{.Names}}" 2>$null
            if ($wahaContainer -eq "whatsapp-http-api") {
                Write-Host "✓ WAHA container is running" -ForegroundColor Green
            } else {
                Write-Host "✗ WAHA container NOT running" -ForegroundColor Red
                Write-Host "  Fix: docker start whatsapp-http-api" -ForegroundColor Yellow
            }
        } else {
            Write-Host "✗ Docker daemon not running" -ForegroundColor Red
            Write-Host "  Fix: Start Docker Desktop" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ Docker not installed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error checking Docker" -ForegroundColor Red
}
Write-Host ""

# 2. Check WAHA API
$wahaOk = Test-Service -Name "WAHA API" -Url "http://localhost:3000/api/health"

# 3. Check Backend
$backendOk = Test-Service -Name "Backend API" -Url "http://localhost:3001/api/health"

# 4. Check Frontend
$frontendOk = Test-Service -Name "Frontend Server" -Url "http://localhost:8080"

# 5. Check WhatsApp Session (if WAHA is running)
if ($wahaOk) {
    Write-Host "[5] WhatsApp Session:" -ForegroundColor White
    try {
        $sessions = Invoke-RestMethod -Uri "http://localhost:3000/api/sessions" -Method Get
        if ($sessions.Count -gt 0) {
            Write-Host "✓ Found $($sessions.Count) session(s)" -ForegroundColor Green
            foreach ($session in $sessions) {
                Write-Host "  - $($session.name): $($session.status)" -ForegroundColor Cyan
            }
        } else {
            Write-Host "✗ No sessions found" -ForegroundColor Red
            Write-Host "  Fix: Run SETUP-WHATSAPP-SESSION.bat" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ Could not check sessions" -ForegroundColor Red
    }
    Write-Host ""
}

# 6. Database check (if backend is running)
if ($backendOk) {
    Write-Host "[6] Database Statistics:" -ForegroundColor White
    try {
        $stats = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard/test" -Method Get
        Write-Host "✓ Contacts: $($stats.data.contacts)" -ForegroundColor Green
        Write-Host "✓ Conversations: $($stats.data.conversations)" -ForegroundColor Green
        Write-Host "✓ Messages: $($stats.data.messages)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Could not get database stats" -ForegroundColor Red
    }
    Write-Host ""
}

# Summary
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

if (-not $wahaOk -or -not $backendOk -or -not $frontendOk) {
    Write-Host ""
    Write-Host "QUICK FIX COMMANDS:" -ForegroundColor Yellow
    
    if (-not $wahaOk) {
        Write-Host "Start WAHA:" -ForegroundColor White
        Write-Host "  docker start whatsapp-http-api" -ForegroundColor Gray
    }
    
    if (-not $backendOk) {
        Write-Host "Start Backend:" -ForegroundColor White
        Write-Host "  cd backend\whatsapp && npm start" -ForegroundColor Gray
    }
    
    if (-not $frontendOk) {
        Write-Host "Start Frontend:" -ForegroundColor White
        Write-Host "  cd frontend && python -m http.server 8080" -ForegroundColor Gray
    }
} else {
    Write-Host "✓ All services are running!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")