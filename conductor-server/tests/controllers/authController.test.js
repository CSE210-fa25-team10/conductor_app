import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, callback, logout } from '../../controllers/authController.js';
import * as authService from '../../services/authService.js';

// Mock the auth service
vi.mock('../../services/authService.js', () => ({
  generateAuthUrl: vi.fn(),
  getUserFromCode: vi.fn()
}));

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      session: {}
    };
    res = {
      redirect: vi.fn(),
      send: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should redirect to Google auth URL', () => {
      const authUrl = 'https://accounts.google.com/o/oauth2/auth?client_id=test';
      authService.generateAuthUrl.mockReturnValue(authUrl);

      login(req, res);

      expect(authService.generateAuthUrl).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(authUrl);
    });
  });

  describe('callback', () => {
    it('should handle successful OAuth callback', async () => {
      const code = 'auth_code_123';
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        picture: 'https://example.com/photo.jpg'
      };

      req.query.code = code;
      authService.getUserFromCode.mockResolvedValue(mockUser);

      await callback(req, res);

      expect(authService.getUserFromCode).toHaveBeenCalledWith(code);
      expect(req.session.user).toEqual(mockUser);
      expect(res.redirect).toHaveBeenCalledWith('/');
    });

    it('should redirect to login if no code provided', async () => {
      req.query.code = undefined;

      await callback(req, res);

      expect(authService.getUserFromCode).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('should handle authentication errors', async () => {
      const code = 'invalid_code';
      const error = new Error('Authentication failed');

      req.query.code = code;
      authService.getUserFromCode.mockRejectedValue(error);

      // Mock console.error to avoid noise in test output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await callback(req, res);

      expect(authService.getUserFromCode).toHaveBeenCalledWith(code);
      expect(res.send).toHaveBeenCalledWith('Authentication failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should destroy session and redirect', () => {
      const destroyCallback = vi.fn((cb) => cb(null));
      req.session.destroy = destroyCallback;

      logout(req, res);

      expect(destroyCallback).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/users');
    });

    it('should handle session destroy errors', () => {
      const error = new Error('Session destroy failed');
      const destroyCallback = vi.fn((cb) => cb(error));
      req.session.destroy = destroyCallback;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logout(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      expect(res.redirect).toHaveBeenCalledWith('/users');

      consoleErrorSpy.mockRestore();
    });
  });
});

