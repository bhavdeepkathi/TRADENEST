#!/bin/bash
# Complete development setup for TRADENEST

set -e

echo "🚀 Setting up TRADENEST development environment..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "⚠️  Please update .env with your configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Start database services
echo "🐳 Starting database services (PostgreSQL, Redis, MinIO)..."
docker-compose up -d postgres redis minio mailhog

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
npm run db:migrate

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "✅ Development environment ready!"
echo ""
echo "📋 Available services:"
echo "   Frontend:     http://localhost:3000"
echo "   Auth API:     http://localhost:4001"
echo "   Catalog API:  http://localhost:4002"
echo "   Order API:    http://localhost:4003"
echo "   Payment API:  http://localhost:4004"
echo "   AI API:       http://localhost:4005"
echo "   Notification: http://localhost:4006"
echo "   MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo "   Mailhog UI:   http://localhost:8025"
echo ""
echo "🔐 Test credentials:"
echo "   Super Admin:  superadmin@tradenest.local / SuperAdmin@123"
echo "   Admin:        admin@tradenest.local / Admin@123"
echo "   Customer:     customer@tradenest.local / Customer@123"
echo "   Seller:       seller@tradenest.local / Seller@123"
echo ""
echo "🚀 Start all services with: npm run dev"