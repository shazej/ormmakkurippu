/**
 * Integration test setup.
 * Sets environment variables before anything is imported so modules pick them up.
 */
process.env.DEMO_AUTH = 'true';
process.env.DEMO_JWT_SECRET = 'test-secret-integration';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/ormmakurippu_dev';
