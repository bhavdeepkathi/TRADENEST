<#
.SYNOPSIS
    Database seed script for TRADENEST
.DESCRIPTION
    Seeds the database with initial data
#>

Write-Host "🌱 Seeding database..." -ForegroundColor Cyan

# Run seed
npx tsx prisma/seed.ts --schema=./prisma/schema.prisma

Write-Host "✅ Database seeded successfully!" -ForegroundColor Green