<# 
.SYNOPSIS
    Database migration script for TRADENEST
.DESCRIPTION
    Runs Prisma migrations against the database
#>

Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan

# Generate Prisma client
Write-Host "📦 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate --schema=./prisma/schema.prisma

# Run migrations
Write-Host "🚀 Applying migrations..." -ForegroundColor Yellow
npx prisma migrate deploy --schema=./prisma/schema.prisma

Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green