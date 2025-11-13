import { describe, it, expect } from 'vitest';
import { Course } from '../../../domain/entities/Course.js';

describe('Course Entity', () => {
  it('should create a Course entity with id', () => {
    const courseData = { id: 1 };
    const course = Course(courseData);

    expect(course.id).toBe(1);
  });

  it('should return a frozen object (immutable)', () => {
    const courseData = { id: 1 };
    const course = Course(courseData);

    expect(Object.isFrozen(course)).toBe(true);
    
    expect(() => {
      'use strict';
      course.id = 2;
    }).toThrow();
  });

  it('should handle undefined id', () => {
    const course = Course({});
    expect(course.id).toBeUndefined();
  });

  it('should handle string id', () => {
    const course = Course({ id: '123' });
    expect(course.id).toBe('123');
  });
});

