import { vi } from 'vitest';

// Make vi globally available for all tests
global.vi = vi;

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.VAPI_SERVER_SECRET = 'test-secret';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep log, warn, error for debugging
  // But suppress debug and info in tests
  debug: vi.fn(),
  info: vi.fn(),
  log: console.log,
  warn: console.warn,
  error: console.error
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});