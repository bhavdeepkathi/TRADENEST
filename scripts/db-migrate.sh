#!/bin/bash
# Database migration script for TRADENEST

set -e

echo "🔄 Running database migrations..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate --schema=./prisma/schema.prisma

# Run migrations
echo "🚀 Applying migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "✅ Migrations completed successfully!"