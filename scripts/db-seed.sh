#!/bin/bash
# Database seed script for TRADENEST

set -e

echo "🌱 Seeding database..."

# Run seed
npx tsx prisma/seed.ts --schema=./prisma/schema.prisma

echo "✅ Database seeded successfully!"