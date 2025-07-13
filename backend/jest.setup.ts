import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce logging during tests
  
  // Initialize test database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL
      }
    }
  });
  
  // Clean up test database
  await prisma.$executeRaw`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "orders" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "customers" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "suppliers" RESTART IDENTITY CASCADE`;
  
  await prisma.$disconnect();
});

// Global test teardown
afterAll(async () => {
  // Clean up after all tests
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL
      }
    }
  });
  
  await prisma.$disconnect();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn()
  }))
}));

// Mock Bull queue
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
    clean: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getJobs: jest.fn(() => []),
    getJob: jest.fn(),
    removeJobs: jest.fn()
  }));
});

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  config: {
    update: jest.fn()
  },
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnThis(),
    promise: jest.fn(),
    deleteObject: jest.fn().mockReturnThis(),
    getSignedUrl: jest.fn()
  }))
}));

// Mock external APIs
jest.mock('axios');

// Set test timeout
jest.setTimeout(30000);