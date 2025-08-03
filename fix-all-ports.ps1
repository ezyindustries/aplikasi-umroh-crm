# Fix all port references from 3001 to 3003
Write-Host "=== FIXING PORT CONFIGURATION IN ALL FILES ===" -ForegroundColor Green
Write-Host ""

# Define directories to search
$directories = @(
    "D:\ezyin\Documents\aplikasi umroh\frontend",
    "D:\ezyin\Documents\aplikasi umroh"
)

# File patterns to search
$filePatterns = @("*.html", "*.js", "*.bat", "*.cmd")

$totalFixed = 0

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "Searching in: $dir" -ForegroundColor Yellow
        
        foreach ($pattern in $filePatterns) {
            $files = Get-ChildItem -Path $dir -Filter $pattern -File -ErrorAction SilentlyContinue
            
            foreach ($file in $files) {
                $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
                if ($content -match "localhost:3001") {
                    Write-Host "  Fixing: $($file.Name)" -ForegroundColor Cyan
                    $newContent = $content -replace 'localhost:3001', 'localhost:3003'
                    Set-Content -Path $file.FullName -Value $newContent -NoNewline
                    $totalFixed++
                }
            }
        }
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host "Total files fixed: $totalFixed" -ForegroundColor White
Write-Host ""
Write-Host "Port configuration update complete!" -ForegroundColor Green
Write-Host "Please restart any open browser tabs." -ForegroundColor Yellow