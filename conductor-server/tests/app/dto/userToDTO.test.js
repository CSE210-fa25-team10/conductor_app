import { describe, it, expect } from 'vitest';
import { userToDTO } from '../../../app/dto/userToDTO.js';
import { User } from '../../../domain/entities/User.js';

describe('userToDTO', () => {
  it('should convert User entity to DTO format', () => {
    const user = User({
      id: 1,
      name: 'John Doe',
      pronunciation: 'jon doh',
      pronouns: 'he/him',
      profilePhoto: 'https://example.com/photo.jpg',
      email: 'john@example.com',
      slack: '@johndoe',
      phone: 1234567890,
      avaliability: 'Mon-Fri 9-5'
    });

    const dto = userToDTO(user);

    expect(dto).toEqual({
      'user.id': 1,
      'user.name': 'John Doe',
      'user.pronounciation': 'jon doh',
      'user.pronouns': 'he/him',
      'user.profilePhoto': 'https://example.com/photo.jpg',
      'user.email': 'john@example.com',
      'user.slack': '@johndoe',
      'user.phone': 1234567890,
      'user.avaliability': 'Mon-Fri 9-5'
    });
  });

  it('should handle User with partial data', () => {
    const user = User({
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com'
    });

    const dto = userToDTO(user);

    expect(dto['user.id']).toBe(2);
    expect(dto['user.name']).toBe('Jane Smith');
    expect(dto['user.email']).toBe('jane@example.com');
    expect(dto['user.pronounciation']).toBeUndefined();
  });

  it('should handle User with undefined values', () => {
    const user = User({});
    const dto = userToDTO(user);

    expect(dto['user.id']).toBeUndefined();
    expect(dto['user.name']).toBeUndefined();
    expect(dto).toHaveProperty('user.id');
    expect(dto).toHaveProperty('user.name');
  });
});

