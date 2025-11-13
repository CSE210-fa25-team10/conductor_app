import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeSearchUsers } from '../../../app/usecases/searchUsers.js';
import { User } from '../../../domain/entities/User.js';

describe('searchUsers Use Case', () => {
  let mockClassQueryRepo;
  let searchUsers;

  beforeEach(() => {
    // Create a mock repository that implements ClassQueryPort
    mockClassQueryRepo = {
      search: vi.fn()
    };

    searchUsers = makeSearchUsers({ classQueryRepo: mockClassQueryRepo });
  });

  it('should search users with default parameters', async () => {
    const mockRows = [
      { id: 1, class_name: 'CSE210', user_name: 'John Doe' },
      { id: 2, class_name: 'CSE210', user_name: 'Jane Smith' }
    ];

    mockClassQueryRepo.search.mockResolvedValue(mockRows);

    const result = await searchUsers();

    expect(mockClassQueryRepo.search).toHaveBeenCalledWith({
      filter: '',
      limit: 50
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(User({ id: 1, className: 'CSE210', userName: 'John Doe' }));
    expect(result[1]).toEqual(User({ id: 2, className: 'CSE210', userName: 'Jane Smith' }));
  });

  it('should search users with custom filter and limit', async () => {
    const mockRows = [
      { id: 1, class_name: 'CSE210', user_name: 'John Doe' }
    ];

    mockClassQueryRepo.search.mockResolvedValue(mockRows);

    const result = await searchUsers({ filter: 'John', limit: 10 });

    expect(mockClassQueryRepo.search).toHaveBeenCalledWith({
      filter: 'John',
      limit: 10
    });
    expect(result).toHaveLength(1);
  });

  it('should return empty array when no users found', async () => {
    mockClassQueryRepo.search.mockResolvedValue([]);

    const result = await searchUsers({ filter: 'NonExistent' });

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should map database rows to User entities correctly', async () => {
    const mockRows = [
      { id: 1, class_name: 'CSE210', user_name: 'Alice' },
      { id: 2, class_name: 'CSE210', user_name: 'Bob' },
      { id: 3, class_name: 'CSE110', user_name: 'Charlie' }
    ];

    mockClassQueryRepo.search.mockResolvedValue(mockRows);

    const result = await searchUsers();

    result.forEach((user, index) => {
      expect(user).toEqual(User({
        id: mockRows[index].id,
        className: mockRows[index].class_name,
        userName: mockRows[index].user_name
      }));
    });
  });

  it('should handle repository errors', async () => {
    const error = new Error('Database connection failed');
    mockClassQueryRepo.search.mockRejectedValue(error);

    await expect(searchUsers()).rejects.toThrow('Database connection failed');
  });
});

