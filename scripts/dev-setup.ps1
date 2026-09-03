<#
.SYNOPSIS
    Complete development setup for TRADENEST
.DESCRIPTION
    Sets up the complete development environment including database, dependencies, and seeding
#>

Write-Host "🚀 Setting up TRADENEST development environment..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Please update .env with your configuration" -ForegroundColor Red
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate

# Start database services
Write-Host "🐳 Starting database services (PostgreSQL, Redis, MinIO)..." -ForegroundColor Yellow
docker-compose up -d postgres redis minio mailhog

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Apply the schema. This repository does not include Prisma migration files,
# so migrate dev cannot initialize a fresh local database.
Write-Host "🔄 Applying database schema..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -ne 0) {
    throw "Database schema setup failed"
}

# Seed database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npm run db:seed

Write-Host ""
Write-Host "✅ Development environment ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Available services:" -ForegroundColor Cyan
Write-Host "   Frontend:     http://localhost:3000" -ForegroundColor Gray
Write-Host "   Auth API:     http://localhost:4001" -ForegroundColor Gray
Write-Host "   Catalog API:  http://localhost:4002" -ForegroundColor Gray
Write-Host "   Order API:    http://localhost:4003" -ForegroundColor Gray
Write-Host "   Payment API:  http://localhost:4004" -ForegroundColor Gray
Write-Host "   AI API:       http://localhost:4005" -ForegroundColor Gray
Write-Host "   Notification: http://localhost:4006" -ForegroundColor Gray
Write-Host "   MinIO Console: http://localhost:9001 (minioadmin/minioadmin)" -ForegroundColor Gray
Write-Host "   Mailhog UI:   http://localhost:8025" -ForegroundColor Gray
Write-Host ""
Write-Host "🔐 Test credentials:" -ForegroundColor Cyan
Write-Host "   Super Admin:  superadmin@tradenest.local / SuperAdmin@123" -ForegroundColor Gray
Write-Host "   Admin:        admin@tradenest.local / Admin@123" -ForegroundColor Gray
Write-Host "   Customer:     customer@tradenest.local / Customer@123" -ForegroundColor Gray
Write-Host "   Seller:       seller@tradenest.local / Seller@123" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Start all services with: npm run dev" -ForegroundColor Green