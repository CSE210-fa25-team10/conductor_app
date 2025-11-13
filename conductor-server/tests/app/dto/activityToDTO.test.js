import { describe, it, expect } from 'vitest';
import { activityToDTO } from '../../../app/dto/activityToDTO.js';
import { Activity } from '../../../domain/entities/Activity.js';

describe('activityToDTO', () => {
  it('should convert Activity entity to DTO format', () => {
    const activity = Activity({
      activityId: 1,
      courseId: 10,
      name: 'Lecture 1',
      time: new Date('2024-01-15T10:00:00Z'),
      type: 'lecture'
    });

    const dto = activityToDTO(activity);

    expect(dto).toEqual({
      'activity.activityId': 1,
      'activity.courseId': 10,
      'activity.name': 'Lecture 1',
      'activity.time': new Date('2024-01-15T10:00:00Z'),
      'activity.type': 'lecture'
    });
  });

  it('should handle Activity with partial data', () => {
    const activity = Activity({
      activityId: 2,
      name: 'Office Hours'
    });

    const dto = activityToDTO(activity);

    expect(dto['activity.activityId']).toBe(2);
    expect(dto['activity.name']).toBe('Office Hours');
    expect(dto['activity.courseId']).toBeUndefined();
    expect(dto['activity.time']).toBeUndefined();
    expect(dto['activity.type']).toBeUndefined();
  });

  it('should handle different activity types', () => {
    const types = ['lecture', 'oh', 'lab', 'discussion'];
    
    types.forEach(type => {
      const activity = Activity({
        activityId: 1,
        courseId: 1,
        name: 'Test',
        time: new Date(),
        type
      });
      const dto = activityToDTO(activity);
      expect(dto['activity.type']).toBe(type);
    });
  });
});

