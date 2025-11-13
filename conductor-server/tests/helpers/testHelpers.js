import { vi } from 'vitest';

/**
 * Test helper utilities
 */

/**
 * Creates a mock Express request object
 */
export function createMockRequest(overrides = {}) {
  return {
    body: {},
    query: {},
    params: {},
    session: {},
    ...overrides
  };
}

/**
 * Creates a mock Express response object
 */
export function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis()
  };
  return res;
}

/**
 * Creates a mock next function for Express middleware
 */
export function createMockNext() {
  return vi.fn();
}

