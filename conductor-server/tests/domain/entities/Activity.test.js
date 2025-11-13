import { describe, it, expect } from 'vitest';
import { Activity } from '../../../domain/entities/Activity.js';

describe('Activity Entity', () => {
  it('should create an Activity entity with all properties', () => {
    const activityData = {
      activityId: 1,
      courseId: 10,
      name: 'Lecture 1',
      time: new Date('2024-01-15T10:00:00Z'),
      type: 'lecture'
    };

    const activity = Activity(activityData);

    expect(activity.activityId).toBe(1);
    expect(activity.courseId).toBe(10);
    expect(activity.name).toBe('Lecture 1');
    expect(activity.time).toEqual(new Date('2024-01-15T10:00:00Z'));
    expect(activity.type).toBe('lecture');
  });

  it('should create an Activity with different types', () => {
    const types = ['lecture', 'oh', 'lab', 'discussion'];
    
    types.forEach(type => {
      const activity = Activity({
        activityId: 1,
        courseId: 1,
        name: 'Test',
        time: new Date(),
        type
      });
      expect(activity.type).toBe(type);
    });
  });

  it('should return a frozen object (immutable)', () => {
    const activityData = {
      activityId: 1,
      courseId: 1,
      name: 'Test',
      time: new Date(),
      type: 'lecture'
    };

    const activity = Activity(activityData);

    expect(Object.isFrozen(activity)).toBe(true);
    
    expect(() => {
      'use strict';
      activity.name = 'Modified';
    }).toThrow();
  });

  it('should handle partial data', () => {
    const activity = Activity({
      activityId: 1,
      name: 'Test Activity'
    });

    expect(activity.activityId).toBe(1);
    expect(activity.name).toBe('Test Activity');
    expect(activity.courseId).toBeUndefined();
    expect(activity.time).toBeUndefined();
    expect(activity.type).toBeUndefined();
  });
});

