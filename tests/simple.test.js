import { describe, it, expect } from 'vitest';

describe('Basic Test Suite', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect(true).toBeTruthy();
  });

  it('should have access to vi globally', () => {
    const mockFn = vi.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should have test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.VAPI_SERVER_SECRET).toBe('test-secret');
  });
});