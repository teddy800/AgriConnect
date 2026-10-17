/**
 * Test Setup and Configuration
 * Runs before all tests
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_NAME = 'agriconnect_test';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Close database connections, cleanup resources
  console.log('✅ Tests completed, cleaning up...');
});

export default {};
