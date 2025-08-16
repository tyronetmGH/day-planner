import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTasks } from './useTasks';
import { Task, TaskFormData } from '../types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock console.error to avoid noise in tests
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('useTasks', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    // Mock Date.now for consistent timestamps
    vi.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start with empty tasks array when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTasks());
      
      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should load existing tasks from localStorage', () => {
      const existingTasks: Task[] = [
        {
          id: 'task1',
          time: '09:00',
          title: 'Morning task',
          priority: 'high',
          createdAt: 1000000
        },
        {
          id: 'task2',
          time: '14:00',
          title: 'Afternoon task',
          priority: 'medium',
          createdAt: 1000001
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTasks));
      
      const { result } = renderHook(() => useTasks());
      
      expect(result.current.tasks).toEqual(existingTasks);
    });
  });

  describe('addTask', () => {
    it('should add a valid task and sort the list', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTasks());
      const taskData: TaskFormData = {
        time: '09:30',
        title: 'New task',
        priority: 'medium'
      };
      
      act(() => {
        result.current.addTask(taskData);
      });
      
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0]).toMatchObject({
        time: '09:30',
        title: 'New task',
        priority: 'medium',
        createdAt: 1000000
      });
      expect(result.current.tasks[0].id).toMatch(/^task_\d+_[a-z0-9]+$/);
    });

    it('should add multiple tasks and maintain sorted order', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTasks());
      
      act(() => {
        result.current.addTask({ time: '14:00', title: 'Afternoon', priority: 'low' });
      });
      
      act(() => {
        result.current.addTask({ time: '09:00', title: 'Morning', priority: 'high' });
      });
      
      act(() => {
        result.current.addTask({ time: '12:00', title: 'Noon', priority: 'medium' });
      });
      
      expect(result.current.tasks).toHaveLength(3);
      expect(result.current.tasks[0].time).toBe('09:00'); // Morning first
      expect(result.current.tasks[1].time).toBe('12:00'); // Noon second
      expect(result.current.tasks[2].time).toBe('14:00'); // Afternoon last
    });

    it('should handle tasks with same time by priority', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTasks());
      
      act(() => {
        result.current.addTask({ time: '09:00', title: 'Low priority', priority: 'low' });
      });
      
      act(() => {
        result.current.addTask({ time: '09:00', title: 'High priority', priority: 'high' });
      });
      
      act(() => {
        result.current.addTask({ time: '09:00', title: 'Medium priority', priority: 'medium' });
      });
      
      expect(result.current.tasks).toHaveLength(3);
      expect(result.current.tasks[0].title).toBe('High priority');
      expect(result.current.tasks[1].title).toBe('Medium priority');
      expect(result.current.tasks[2].title).toBe('Low priority');
    });

    it('should throw error for invalid task data', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTasks());
      const invalidTaskData: TaskFormData = {
        time: 'invalid-time',
        title: '',
        priority: 'medium'
      };
      
      expect(() => {
        act(() => {
          result.current.addTask(invalidTaskData);
        });
      }).toThrow('Validation failed');
    });

    it('should save to localStorage after adding task', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTasks());
      
      act(() => {
        result.current.addTask({ time: '09:00', title: 'Test task', priority: 'medium' });
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dayPlannerTasks',
        expect.stringContaining('"time":"09:00"')
      );
    });
  });

  describe('updateTask', () => {
    it('should update an existing task and re-sort', () => {
      const existingTasks: Task[] = [
        {
          id: 'task1',
          time: '09:00',
          title: 'Original task',
          priority: 'low',
          createdAt: 1000000
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTasks));
      
      const { result } = renderHook(() => useTasks());
      
      act(() => {
        result.current.updateTask('task1', {
          time: '10:00',
          title: 'Updated task',
          priority: 'high'
        });
      });
      
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0]).toMatchObject({
        id: 'task1',
        time: '10:00',
        title: 'Updated task',
        priority: 'high',
        createdAt: 1000000 // Should preserve original createdAt
      });
    });

    it('should throw error when updating non-existent task', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTasks());
      
      expect(() => {
        act(() => {
          result.current.updateTask('non-existent', {
            time: '09:00',
            title: 'Test',
            priority: 'medium'
          });
        });
      }).toThrow('Task with ID "non-existent" not found');
    });

    it('should throw error for invalid update data', () => {
      const existingTasks: Task[] = [
        {
          id: 'task1',
          time: '09:00',
          title: 'Original task',
          priority: 'low',
          createdAt: 1000000
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTasks));
      
      const { result } = renderHook(() => useTasks());
      
      expect(() => {
        act(() => {
          result.current.updateTask('task1', {
            time: 'invalid-time',
            title: '',
            priority: 'medium'
          });
        });
      }).toThrow('Validation failed');
    });

    it('should re-sort tasks after update changes time', () => {
      const existingTasks: Task[] = [
        {
          id: 'task1',
          time: '09:00',
          title: 'First task',
          priority: 'medium',
          createdAt: 1000000
        },
        {
          id: 'task2',
          time: '10:00',
          title: 'Second task',
          priority: 'medium',
          createdAt: 1000001
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTasks));
      
      const { result } = renderHook(() => useTasks());
      
      // Update first task to have later time
      act(() => {
        result.current.updateTask('task1', {
          time: '11:00',
          title: 'Updated first task',
          priority: 'medium'
        });
      });
      
      expect(result.current.tasks[0].id).toBe('task2'); // Second task now first
      expect(result.current.tasks[1].id).toBe('task1'); // First task now second
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task', () => {
      const existingTasks: Task[] = [
        {
          id: 'task1',
          time: '09:00',
          title: 'Task to delete',
          priority: 'medium',
          createdAt: 1000000
        },
        {
          id: 'task2',
          time: '10:00',
          title: 'Task to keep',
          priority: 'medium',
          createdAt: 1000001
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTasks));
      
      const { result } = renderHook(() => useTasks());
      
      act(() => {
        result.current.deleteTask('task1');
      });
      
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe('task2');
    });

    it('should throw error when deleting non-existent task', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTasks());
      
      expect(() => {
        act(() => {
          result.current.deleteTask('non-existent');
        });
      }).toThrow('Task with ID "non-existent" not found');
    });
  });

  describe('clearAllTasks', () => {
    it('should clear all tasks', () => {
      const existingTasks: Task[] = [
        {
          id: 'task1',
          time: '09:00',
          title: 'Task 1',
          priority: 'medium',
          createdAt: 1000000
        },
        {
          id: 'task2',
          time: '10:00',
          title: 'Task 2',
          priority: 'medium',
          createdAt: 1000001
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTasks));
      
      const { result } = renderHook(() => useTasks());
      
      act(() => {
        result.current.clearAllTasks();
      });
      
      expect(result.current.tasks).toEqual([]);
    });
  });

  describe('query operations', () => {
    const existingTasks: Task[] = [
      {
        id: 'task1',
        time: '09:00',
        title: 'Morning task',
        priority: 'high',
        createdAt: 1000000
      },
      {
        id: 'task2',
        time: '09:00',
        title: 'Another morning task',
        priority: 'medium',
        createdAt: 1000001
      },
      {
        id: 'task3',
        time: '14:00',
        title: 'Afternoon task',
        priority: 'low',
        createdAt: 1000002
      }
    ];

    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTasks));
    });

    describe('getTaskById', () => {
      it('should return task when found', () => {
        const { result } = renderHook(() => useTasks());
        
        const task = result.current.getTaskById('task2');
        
        expect(task).toEqual(existingTasks[1]);
      });

      it('should return undefined when task not found', () => {
        const { result } = renderHook(() => useTasks());
        
        const task = result.current.getTaskById('non-existent');
        
        expect(task).toBeUndefined();
      });
    });

    describe('getTasksByTime', () => {
      it('should return tasks at specified time', () => {
        const { result } = renderHook(() => useTasks());
        
        const morningTasks = result.current.getTasksByTime('09:00');
        
        expect(morningTasks).toHaveLength(2);
        expect(morningTasks[0].id).toBe('task1');
        expect(morningTasks[1].id).toBe('task2');
      });

      it('should return empty array when no tasks at specified time', () => {
        const { result } = renderHook(() => useTasks());
        
        const tasks = result.current.getTasksByTime('12:00');
        
        expect(tasks).toEqual([]);
      });
    });

    describe('taskExists', () => {
      it('should return true when task exists', () => {
        const { result } = renderHook(() => useTasks());
        
        expect(result.current.taskExists('task1')).toBe(true);
        expect(result.current.taskExists('task3')).toBe(true);
      });

      it('should return false when task does not exist', () => {
        const { result } = renderHook(() => useTasks());
        
        expect(result.current.taskExists('non-existent')).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should propagate localStorage errors', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json{');
      
      const { result } = renderHook(() => useTasks());
      
      expect(result.current.error).toBe('Data was corrupted and has been reset');
    });

    it('should handle localStorage quota exceeded errors', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });
      
      const { result } = renderHook(() => useTasks());
      
      act(() => {
        result.current.addTask({ time: '09:00', title: 'Test', priority: 'medium' });
      });
      
      expect(result.current.error).toBe('Storage quota exceeded. Please clear some data.');
    });
  });

  describe('ID generation', () => {
    it('should generate unique IDs for different tasks', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTasks());
      
      act(() => {
        result.current.addTask({ time: '09:00', title: 'Task 1', priority: 'medium' });
      });
      
      act(() => {
        result.current.addTask({ time: '10:00', title: 'Task 2', priority: 'medium' });
      });
      
      const task1Id = result.current.tasks[0].id;
      const task2Id = result.current.tasks[1].id;
      
      expect(task1Id).not.toBe(task2Id);
      expect(task1Id).toMatch(/^task_\d+_[a-z0-9]+$/);
      expect(task2Id).toMatch(/^task_\d+_[a-z0-9]+$/);
    });
  });
});