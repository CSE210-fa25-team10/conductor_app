import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs module before any imports
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(() => 'SELECT * FROM classes WHERE name LIKE $1 LIMIT $2')
}));

// Mock path module
vi.mock('node:path', async () => {
  const actual = await vi.importActual('node:path');
  return {
    ...actual,
    resolve: vi.fn((path) => path)
  };
});

describe('PgClassRepository', () => {
  let mockPool;
  let repository;
  let makePgClassRepository;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    mockPool = {
      query: vi.fn()
    };

    // Import after mocks are set up
    const module = await import('../../../../adapters/out/db/PgClassRepository.js');
    makePgClassRepository = module.makePgClassRepository;
    repository = makePgClassRepository({ pool: mockPool });
  });

  it('should create a repository with search method', () => {
    expect(repository).toHaveProperty('search');
    expect(typeof repository.search).toBe('function');
    expect(Object.isFrozen(repository)).toBe(true);
  });

  it('should search with filter and limit', async () => {
    const mockRows = [
      { id: 1, class_name: 'CSE210', user_name: 'John' },
      { id: 2, class_name: 'CSE210', user_name: 'Jane' }
    ];

    mockPool.query.mockResolvedValue({ rows: mockRows });

    const result = await repository.search({ filter: 'CSE', limit: 10 });

    // Check that query was called with SQL and parameters
    expect(mockPool.query).toHaveBeenCalled();
    const callArgs = mockPool.query.mock.calls[0];
    expect(callArgs[0]).toBe('SELECT * FROM classes WHERE name LIKE $1 LIMIT $2');
    expect(callArgs[1]).toEqual(['%CSE%', 10]);
    expect(result).toEqual(mockRows);
  });

  it('should handle empty filter', async () => {
    const mockRows = [];
    mockPool.query.mockResolvedValue({ rows: mockRows });

    const result = await repository.search({ filter: '', limit: 50 });

    // Check that query was called with SQL and parameters
    expect(mockPool.query).toHaveBeenCalled();
    const callArgs = mockPool.query.mock.calls[0];
    expect(callArgs[0]).toBe('SELECT * FROM classes WHERE name LIKE $1 LIMIT $2');
    expect(callArgs[1]).toEqual(['%%', 50]);
    expect(result).toEqual(mockRows);
  });

  it('should handle database errors', async () => {
    const error = new Error('Database query failed');
    mockPool.query.mockRejectedValue(error);

    await expect(repository.search({ filter: 'test', limit: 10 }))
      .rejects.toThrow('Database query failed');
  });

  it('should return empty array when no results', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const result = await repository.search({ filter: 'nonexistent', limit: 10 });

    expect(result).toEqual([]);
  });
});

