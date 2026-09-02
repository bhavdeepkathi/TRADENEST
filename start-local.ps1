# TRADENEST Local Development Startup Script
# Run this in PowerShell as Administrator

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "TRADENEST Local Development Startup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
$nodeVersion = node --version
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pgResult = & pg_isready -U tradenest -d tradenest -h localhost -p 5432 -q
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL: Running" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL: NOT RUNNING - Please start PostgreSQL service" -ForegroundColor Red
    }
} catch {
    Write-Host "PostgreSQL: NOT FOUND - Please install PostgreSQL" -ForegroundColor Red
}

# Check Redis
Write-Host "Checking Redis..." -ForegroundColor Yellow
try {
    $redisResult = & redis-cli -h localhost -p 6379 ping
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Redis: Running" -ForegroundColor Green
    } else {
        Write-Host "Redis: NOT RUNNING - Please start Redis service" -ForegroundColor Red
    }
} catch {
    Write-Host "Redis: NOT FOUND - Please install Redis" -ForegroundColor Red
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan

# Kill any existing node processes on our ports
$ports = @(4000, 4001, 4002, 4003, 4004, 4005, 4006, 3000)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Killed process on port $port" -ForegroundColor Yellow
    }
}

# Start all backend services
$services = @(
    @{name="auth"; path="apps/backend/auth"; port=4001; script="dev"},
    @{name="catalog"; path="apps/backend/catalog"; port=4002; script="dev"},
    @{name="order"; path="apps/backend/order"; port=4003; script="dev"},
    @{name="payment"; path="apps/backend/payment"; port=4004; script="dev"},
    @{name="ai"; path="apps/backend/ai"; port=4005; script="dev"},
    @{name="notification"; path="apps/backend/notification"; port=4006; script="dev"},
    @{name="gateway"; path="apps/backend/gateway"; port=4000; script="dev"}
)

$processes = @()

$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

foreach ($svc in $services) {
    $path = Join-Path $root $svc.path
    if (Test-Path $path) {
        Write-Host "Starting $($svc.name) on port $($svc.port)..." -ForegroundColor Cyan
        $proc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$path`"; npm run dev" -PassThru
        $processes += $proc
        Start-Sleep -Seconds 1
    }
}

# Start frontend
Write-Host "Starting Frontend on port 3000..." -ForegroundColor Cyan
$frontendPath = Join-Path $root "apps/frontend"
$frontendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$frontendPath`"; npm run dev" -PassThru

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "All services started!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  Frontend:      http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Gateway:       http://localhost:4000" -ForegroundColor Cyan
Write-Host "  Auth:          http://localhost:4001" -ForegroundColor Cyan
Write-Host "  Catalog:       http://localhost:4002" -ForegroundColor Cyan
Write-Host "  Order:         http://localhost:4003" -ForegroundColor Cyan
Write-Host "  Payment:       http://localhost:4004" -ForegroundColor Cyan
Write-Host "  AI:            http://localhost:4005" -ForegroundColor Cyan
Write-Host "  Notification:  http://localhost:4006" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 10
    }
} finally {
    Write-Host "Stopping all services..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
    Write-Host "All services stopped." -ForegroundColor Green
}
