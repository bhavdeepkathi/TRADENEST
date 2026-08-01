-- TRADENEST Database Initialization Script
-- Runs automatically when PostgreSQL container starts for the first time

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS analytics;
-- CREATE SCHEMA IF NOT EXISTS audit;

-- Set default search path
-- ALTER DATABASE tradenest SET search_path = public, analytics, audit;

-- Create indexes for better performance (will be created by Prisma migrations)
-- This file is mainly for extensions and initial setup

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'TRADENEST database initialized with extensions: uuid-ossp, pgcrypto, pg_trgm, btree_gin';
END $$;