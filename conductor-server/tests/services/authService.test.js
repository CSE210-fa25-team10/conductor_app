import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before imports
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn()
}));

vi.mock('pg', () => ({
  default: {
    Pool: vi.fn()
  },
  Pool: vi.fn()
}));

vi.mock('dotenv', () => ({
  default: {
    config: vi.fn()
  },
  config: vi.fn()
}));

describe('Auth Service', () => {
  let mockOAuthClient;
  let mockPool;
  let authService;
  let OAuth2Client;
  let Pool;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Get mocked modules
    const googleAuth = await import('google-auth-library');
    const pg = await import('pg');
    OAuth2Client = googleAuth.OAuth2Client;
    Pool = pg.Pool || pg.default.Pool;
    
    // Mock OAuth2Client instance
    mockOAuthClient = {
      generateAuthUrl: vi.fn(),
      getToken: vi.fn(),
      setCredentials: vi.fn(),
      verifyIdToken: vi.fn()
    };
    OAuth2Client.mockImplementation(() => mockOAuthClient);

    // Mock Pool instance
    mockPool = {
      query: vi.fn()
    };
    Pool.mockImplementation(() => mockPool);

    // Import after mocks are set up
    authService = await import('../../services/authService.js');
  });

  describe('generateAuthUrl', () => {
    it('should generate Google OAuth URL', () => {
      const expectedUrl = 'https://accounts.google.com/o/oauth2/auth?client_id=test';
      mockOAuthClient.generateAuthUrl.mockReturnValue(expectedUrl);

      const url = authService.generateAuthUrl();

      expect(mockOAuthClient.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: ['profile', 'email']
      });
      expect(url).toBe(expectedUrl);
    });
  });

  describe('getUserFromCode', () => {
    const mockCode = 'auth_code_123';
    const mockTokens = {
      id_token: 'id_token_123',
      access_token: 'access_token_123'
    };
    const mockPayload = {
      name: 'John Doe',
      email: 'john@example.com',
      picture: 'https://example.com/photo.jpg'
    };

    beforeEach(() => {
      // Reset mocks for each test
      mockOAuthClient.getToken.mockResolvedValue({ tokens: mockTokens });
      mockOAuthClient.verifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload
      });
      mockPool.query.mockClear();
    });

    it('should return existing user from database', async () => {
      const existingUser = {
        user_id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        profile_photo: 'https://example.com/photo.jpg'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [existingUser]
      });

      const result = await authService.getUserFromCode(mockCode);

      expect(mockOAuthClient.getToken).toHaveBeenCalledWith(mockCode);
      expect(mockOAuthClient.setCredentials).toHaveBeenCalledWith(mockTokens);
      expect(mockOAuthClient.verifyIdToken).toHaveBeenCalled();
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT user_id, name, email, profile_photo FROM users WHERE email = $1',
        [mockPayload.email]
      );
      expect(result).toEqual({
        id: existingUser.user_id,
        name: existingUser.name,
        email: existingUser.email,
        picture: existingUser.profile_photo
      });
    });

    it('should create new user if not exists', async () => {
      const newUser = {
        user_id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        profile_photo: 'https://example.com/jane.jpg'
      };

      // First query: user not found
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [newUser] });

      const result = await authService.getUserFromCode(mockCode);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO users'),
        [mockPayload.name, mockPayload.email, mockPayload.picture]
      );
      expect(result).toEqual({
        id: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        picture: newUser.profile_photo
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPool.query.mockRejectedValue(dbError);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await authService.getUserFromCode(mockCode);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error inserting user into database:',
        dbError
      );
      expect(result).toBeUndefined();

      consoleErrorSpy.mockRestore();
    });
  });
});

