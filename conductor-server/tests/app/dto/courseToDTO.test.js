import { describe, it, expect } from 'vitest';
import { courseToDTO } from '../../../app/dto/courseToDTO.js';
import { Course } from '../../../domain/entities/Course.js';

describe('courseToDTO', () => {
  it('should convert Course entity to DTO format', () => {
    const course = Course({ id: 1 });
    const dto = courseToDTO(course);

    expect(dto).toEqual({
      'course.id': 1
    });
  });

  it('should handle Course with string id', () => {
    const course = Course({ id: '123' });
    const dto = courseToDTO(course);

    expect(dto['course.id']).toBe('123');
  });

  it('should handle Course with undefined id', () => {
    const course = Course({});
    const dto = courseToDTO(course);

    expect(dto['course.id']).toBeUndefined();
    expect(dto).toHaveProperty('course.id');
  });
});

