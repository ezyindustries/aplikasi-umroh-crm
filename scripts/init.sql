-- Database initialization script for Vauza Tamma Management System
-- This script creates the database and sets up initial configuration

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'Asia/Jakarta';

-- Create database (this will be handled by docker-compose)
-- But we can ensure proper encoding
-- Note: This script runs after database creation, so we just set up tables

-- The actual table creation will be handled by Sequelize migrations
-- This script is for initial setup and seeding

COMMENT ON DATABASE vauza_tamma_db IS 'Vauza Tamma Umroh Management System Database';