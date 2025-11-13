import { describe, it, expect } from 'vitest';
import { User } from '../../../domain/entities/User.js';

describe('User Entity', () => {
  it('should create a User entity with all properties', () => {
    const userData = {
      id: 1,
      name: 'John Doe',
      pronunciation: 'jon doh',
      pronouns: 'he/him',
      profilePhoto: 'https://example.com/photo.jpg',
      email: 'john@example.com',
      slack: '@johndoe',
      phone: 1234567890,
      avaliability: 'Mon-Fri 9-5'
    };

    const user = User(userData);

    expect(user.id).toBe(1);
    expect(user.name).toBe('John Doe');
    expect(user.pronunciation).toBe('jon doh');
    expect(user.pronouns).toBe('he/him');
    expect(user.profilePhoto).toBe('https://example.com/photo.jpg');
    expect(user.email).toBe('john@example.com');
    expect(user.slack).toBe('@johndoe');
    expect(user.phone).toBe(1234567890);
    expect(user.avaliability).toBe('Mon-Fri 9-5');
  });

  it('should create a User entity with partial data', () => {
    const userData = {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com'
    };

    const user = User(userData);

    expect(user.id).toBe(2);
    expect(user.name).toBe('Jane Smith');
    expect(user.email).toBe('jane@example.com');
    expect(user.pronunciation).toBeUndefined();
    expect(user.pronouns).toBeUndefined();
  });

  it('should return a frozen object (immutable)', () => {
    const userData = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    };

    const user = User(userData);

    expect(Object.isFrozen(user)).toBe(true);
    
    // Attempting to modify should fail silently or throw in strict mode
    expect(() => {
      'use strict';
      user.name = 'Modified';
    }).toThrow();
  });

  it('should handle undefined values', () => {
    const user = User({});

    expect(user.id).toBeUndefined();
    expect(user.name).toBeUndefined();
    expect(user.email).toBeUndefined();
  });
});

