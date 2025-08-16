import { describe, it, expect } from 'vitest';
import { sortTasks, groupTasksByTime, findTasksWithSameTime, isTaskListSorted } from './taskUtils';
import { Task } from '../types';

// Helper function to create test tasks
function createTask(
  id: string,
  time: string,
  title: string,
  priority?: 'low' | 'medium' | 'high',
  createdAt?: number
): Task {
  return {
    id,
    time,
    title,
    priority,
    createdAt: createdAt || Date.now()
  };
}

describe('sortTasks', () => {
  describe('time-based sorting', () => {
    it('should sort tasks by time in ascending order', () => {
      const tasks = [
        createTask('3', '15:30', 'Afternoon task'),
        createTask('1', '09:00', 'Morning task'),
        createTask('2', '12:00', 'Lunch task')
      ];

      const sorted = sortTasks(tasks);
      
      expect(sorted[0].time).toBe('09:00');
      expect(sorted[1].time).toBe('12:00');
      expect(sorted[2].time).toBe('15:30');
    });

    it('should handle edge case times correctly', () => {
      const tasks = [
        createTask('3', '23:59', 'Late night'),
        createTask('1', '00:00', 'Midnight'),
        createTask('2', '12:00', 'Noon')
      ];

      const sorted = sortTasks(tasks);
      
      expect(sorted[0].time).toBe('00:00');
      expect(sorted[1].time).toBe('12:00');
      expect(sorted[2].time).toBe('23:59');
    });
  });

  describe('priority-based sorting for same time', () => {
    it('should sort by priority when times are the same (high > medium > low)', () => {
      const baseTime = Date.now();
      const tasks = [
        createTask('1', '09:00', 'Low priority', 'low', baseTime),
        createTask('2', '09:00', 'High priority', 'high', baseTime + 1),
        createTask('3', '09:00', 'Medium priority', 'medium', baseTime + 2)
      ];

      const sorted = sortTasks(tasks);
      
      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('medium');
      expect(sorted[2].priority).toBe('low');
    });

    it('should treat undefined priority as low priority', () => {
      const baseTime = Date.now();
      const tasks = [
        createTask('1', '09:00', 'No priority', undefined, baseTime),
        createTask('2', '09:00', 'High priority', 'high', baseTime + 1),
        createTask('3', '09:00', 'Medium priority', 'medium', baseTime + 2)
      ];

      const sorted = sortTasks(tasks);
      
      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('medium');
      expect(sorted[2].priority).toBeUndefined();
    });

    it('should handle all priority combinations correctly', () => {
      const baseTime = Date.now();
      const tasks = [
        createTask('1', '09:00', 'Low 1', 'low', baseTime),
        createTask('2', '09:00', 'High 1', 'high', baseTime + 1),
        createTask('3', '09:00', 'Medium 1', 'medium', baseTime + 2),
        createTask('4', '09:00', 'Low 2', 'low', baseTime + 3),
        createTask('5', '09:00', 'High 2', 'high', baseTime + 4)
      ];

      const sorted = sortTasks(tasks);
      
      // Should be: high, high, medium, low, low (in creation order within same priority)
      expect(sorted[0].priority).toBe('high');
      expect(sorted[0].title).toBe('High 1'); // Earlier creation time
      expect(sorted[1].priority).toBe('high');
      expect(sorted[1].title).toBe('High 2'); // Later creation time
      expect(sorted[2].priority).toBe('medium');
      expect(sorted[3].priority).toBe('low');
      expect(sorted[3].title).toBe('Low 1'); // Earlier creation time
      expect(sorted[4].priority).toBe('low');
      expect(sorted[4].title).toBe('Low 2'); // Later creation time
    });
  });

  describe('creation time-based sorting for same time and priority', () => {
    it('should sort by creation time when time and priority are the same', () => {
      const baseTime = Date.now();
      const tasks = [
        createTask('3', '09:00', 'Third created', 'medium', baseTime + 2000),
        createTask('1', '09:00', 'First created', 'medium', baseTime),
        createTask('2', '09:00', 'Second created', 'medium', baseTime + 1000)
      ];

      const sorted = sortTasks(tasks);
      
      expect(sorted[0].title).toBe('First created');
      expect(sorted[1].title).toBe('Second created');
      expect(sorted[2].title).toBe('Third created');
    });

    it('should preserve insertion order for tasks with same time, priority, and creation time', () => {
      const sameTime = Date.now();
      const tasks = [
        createTask('1', '09:00', 'Task A', 'medium', sameTime),
        createTask('2', '09:00', 'Task B', 'medium', sameTime),
        createTask('3', '09:00', 'Task C', 'medium', sameTime)
      ];

      const sorted = sortTasks(tasks);
      
      // Should maintain original order when all sorting criteria are equal
      expect(sorted[0].title).toBe('Task A');
      expect(sorted[1].title).toBe('Task B');
      expect(sorted[2].title).toBe('Task C');
    });
  });

  describe('complex sorting scenarios', () => {
    it('should handle mixed times, priorities, and creation times correctly', () => {
      const baseTime = Date.now();
      const tasks = [
        createTask('1', '15:00', 'Afternoon low', 'low', baseTime),
        createTask('2', '09:00', 'Morning high', 'high', baseTime + 1000),
        createTask('3', '09:00', 'Morning medium', 'medium', baseTime + 2000),
        createTask('4', '12:00', 'Noon high', 'high', baseTime + 3000),
        createTask('5', '09:00', 'Morning low', 'low', baseTime + 4000),
        createTask('6', '09:00', 'Morning high 2', 'high', baseTime + 5000)
      ];

      const sorted = sortTasks(tasks);
      
      // Expected order:
      // 09:00 high (Morning high) - earliest creation time
      // 09:00 high (Morning high 2) - later creation time
      // 09:00 medium (Morning medium)
      // 09:00 low (Morning low)
      // 12:00 high (Noon high)
      // 15:00 low (Afternoon low)
      
      expect(sorted[0].title).toBe('Morning high');
      expect(sorted[1].title).toBe('Morning high 2');
      expect(sorted[2].title).toBe('Morning medium');
      expect(sorted[3].title).toBe('Morning low');
      expect(sorted[4].title).toBe('Noon high');
      expect(sorted[5].title).toBe('Afternoon low');
    });

    it('should not mutate the original array', () => {
      const tasks = [
        createTask('2', '15:00', 'Later task'),
        createTask('1', '09:00', 'Earlier task')
      ];
      const originalOrder = tasks.map(t => t.id);

      sortTasks(tasks);
      
      // Original array should remain unchanged
      expect(tasks.map(t => t.id)).toEqual(originalOrder);
    });

    it('should handle empty array', () => {
      const result = sortTasks([]);
      expect(result).toEqual([]);
    });

    it('should handle single task', () => {
      const task = createTask('1', '09:00', 'Single task');
      const result = sortTasks([task]);
      expect(result).toEqual([task]);
    });
  });
});

describe('groupTasksByTime', () => {
  it('should group tasks by their time', () => {
    const tasks = [
      createTask('1', '09:00', 'Morning 1'),
      createTask('2', '12:00', 'Noon'),
      createTask('3', '09:00', 'Morning 2'),
      createTask('4', '15:00', 'Afternoon')
    ];

    const grouped = groupTasksByTime(tasks);
    
    expect(Object.keys(grouped)).toEqual(['09:00', '12:00', '15:00']);
    expect(grouped['09:00']).toHaveLength(2);
    expect(grouped['12:00']).toHaveLength(1);
    expect(grouped['15:00']).toHaveLength(1);
  });

  it('should handle empty array', () => {
    const result = groupTasksByTime([]);
    expect(result).toEqual({});
  });
});

describe('findTasksWithSameTime', () => {
  it('should find all tasks with the same time', () => {
    const tasks = [
      createTask('1', '09:00', 'Morning 1'),
      createTask('2', '12:00', 'Noon'),
      createTask('3', '09:00', 'Morning 2'),
      createTask('4', '09:00', 'Morning 3')
    ];

    const sameTimes = findTasksWithSameTime(tasks, '09:00');
    
    expect(sameTimes).toHaveLength(3);
    expect(sameTimes.every(task => task.time === '09:00')).toBe(true);
  });

  it('should return empty array when no tasks match', () => {
    const tasks = [
      createTask('1', '09:00', 'Morning'),
      createTask('2', '12:00', 'Noon')
    ];

    const sameTimes = findTasksWithSameTime(tasks, '15:00');
    expect(sameTimes).toEqual([]);
  });
});

describe('isTaskListSorted', () => {
  it('should return true for properly sorted task list', () => {
    const baseTime = Date.now();
    const tasks = [
      createTask('1', '09:00', 'Morning high', 'high', baseTime),
      createTask('2', '09:00', 'Morning medium', 'medium', baseTime + 1000),
      createTask('3', '12:00', 'Noon low', 'low', baseTime + 2000),
      createTask('4', '15:00', 'Afternoon high', 'high', baseTime + 3000)
    ];

    expect(isTaskListSorted(tasks)).toBe(true);
  });

  it('should return false for incorrectly sorted task list', () => {
    const tasks = [
      createTask('1', '12:00', 'Noon'),
      createTask('2', '09:00', 'Morning') // Wrong time order
    ];

    expect(isTaskListSorted(tasks)).toBe(false);
  });

  it('should return false for incorrect priority order', () => {
    const baseTime = Date.now();
    const tasks = [
      createTask('1', '09:00', 'Morning low', 'low', baseTime),
      createTask('2', '09:00', 'Morning high', 'high', baseTime + 1000) // Wrong priority order
    ];

    expect(isTaskListSorted(tasks)).toBe(false);
  });

  it('should return true for empty array', () => {
    expect(isTaskListSorted([])).toBe(true);
  });

  it('should return true for single task', () => {
    const task = createTask('1', '09:00', 'Single task');
    expect(isTaskListSorted([task])).toBe(true);
  });
});