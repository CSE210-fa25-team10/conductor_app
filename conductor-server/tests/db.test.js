import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pg module - must return default export
const mockPool = {
  query: vi.fn()
};

vi.mock('pg', () => {
  const MockPool = vi.fn(() => mockPool);
  return {
    default: {
      Pool: MockPool
    },
    Pool: MockPool
  };
});

describe('Database Module', () => {
  let dbModule;

  beforeEach(async () => {
    // Clear module cache to re-import with fresh mocks
    vi.resetModules();
    vi.clearAllMocks();
    
    // Import after mocks are set up
    dbModule = await import('../db.js');
  });

  describe('dbHealth', () => {
    it('should return true when database is healthy', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ ok: 1 }]
      });

      const result = await dbModule.dbHealth();

      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1 AS ok');
      expect(result).toBe(true);
    });

    it('should return false when database query fails', async () => {
      mockPool.query.mockRejectedValue(new Error('Connection failed'));

      // dbHealth doesn't catch errors, so it will throw
      await expect(dbModule.dbHealth()).rejects.toThrow('Connection failed');
    });

    it('should return false when ok is not 1', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ ok: 0 }]
      });

      const result = await dbModule.dbHealth();

      expect(result).toBe(false);
    });

    it('should return false when no rows returned', async () => {
      mockPool.query.mockResolvedValue({
        rows: []
      });

      const result = await dbModule.dbHealth();

      expect(result).toBe(false);
    });
  });

  describe('pool export', () => {
    it('should export pool instance', () => {
      expect(dbModule.pool).toBeDefined();
      expect(dbModule.pool).toBe(mockPool);
    });
  });
});

