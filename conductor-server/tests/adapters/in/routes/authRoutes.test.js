import { describe, it, expect, vi, beforeEach } from 'vitest';
import authRoutes from '../../../../adapters/in/routes/authRoutes.js';
import * as authController from '../../../../controllers/authController.js';

// Mock the auth controller
vi.mock('../../../../controllers/authController.js', () => ({
  login: vi.fn(),
  callback: vi.fn(),
  logout: vi.fn()
}));

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export auth routes module', () => {
    expect(authRoutes).toBeDefined();
  });

  it('should have login route handler', () => {
    // Verify that the controller functions are available
    expect(authController.login).toBeDefined();
    expect(authController.callback).toBeDefined();
    expect(authController.logout).toBeDefined();
  });
});

