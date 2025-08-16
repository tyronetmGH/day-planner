import { useCallback } from 'react';
import type { Task, TaskFormData } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { sortTasks } from '../utils/taskUtils';
import { validateAndSanitizeTaskFormData } from '../utils/validationUtils';

const STORAGE_KEY = 'dayPlannerTasks';

/**
 * Custom hook for centralized task management with CRUD operations
 * Provides automatic sorting after mutations and localStorage persistence
 */
export function useTasks() {
  const [tasks, setTasks, storageError] = useLocalStorage<Task[]>(STORAGE_KEY, []);

  /**
   * Generates a unique ID for new tasks
   */
  const generateTaskId = useCallback((): string => {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Adds a new task to the list
   * @param taskData - The task form data to add
   * @throws Error if validation fails
   */
  const addTask = useCallback((taskData: TaskFormData): void => {
    // Validate and sanitize the input data
    const validationResult = validateAndSanitizeTaskFormData(taskData);
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(err => err.message).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    const sanitizedData = validationResult.sanitizedData!;
    
    // Create new task with generated ID and timestamp
    const newTask: Task = {
      id: generateTaskId(),
      time: sanitizedData.time,
      title: sanitizedData.title,
      priority: sanitizedData.priority,
      createdAt: Date.now()
    };

    // Add task and sort the list
    setTasks((prevTasks: Task[]) => sortTasks([...prevTasks, newTask]));
  }, [generateTaskId, setTasks]);

  /**
   * Updates an existing task
   * @param id - The ID of the task to update
   * @param taskData - The new task data
   * @throws Error if task not found or validation fails
   */
  const updateTask = useCallback((id: string, taskData: TaskFormData): void => {
    // Validate and sanitize the input data
    const validationResult = validateAndSanitizeTaskFormData(taskData);
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(err => err.message).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    const sanitizedData = validationResult.sanitizedData!;

    setTasks((prevTasks: Task[]) => {
      const taskIndex = prevTasks.findIndex((task: Task) => task.id === id);
      if (taskIndex === -1) {
        throw new Error(`Task with ID "${id}" not found`);
      }

      const existingTask = prevTasks[taskIndex];
      const updatedTask: Task = {
        ...existingTask,
        time: sanitizedData.time,
        title: sanitizedData.title,
        priority: sanitizedData.priority
        // Keep original createdAt timestamp
      };

      const updatedTasks = [...prevTasks];
      updatedTasks[taskIndex] = updatedTask;
      
      // Re-sort the list after update
      return sortTasks(updatedTasks);
    });
  }, [setTasks]);

  /**
   * Deletes a task by ID
   * @param id - The ID of the task to delete
   * @throws Error if task not found
   */
  const deleteTask = useCallback((id: string): void => {
    setTasks((prevTasks: Task[]) => {
      const taskExists = prevTasks.some((task: Task) => task.id === id);
      if (!taskExists) {
        throw new Error(`Task with ID "${id}" not found`);
      }
      
      return prevTasks.filter((task: Task) => task.id !== id);
    });
  }, [setTasks]);

  /**
   * Clears all tasks from the list
   */
  const clearAllTasks = useCallback((): void => {
    setTasks([]);
  }, [setTasks]);

  /**
   * Gets a task by ID
   * @param id - The ID of the task to find
   * @returns The task if found, undefined otherwise
   */
  const getTaskById = useCallback((id: string): Task | undefined => {
    return tasks.find(task => task.id === id);
  }, [tasks]);

  /**
   * Gets tasks by time
   * @param time - The time to search for
   * @returns Array of tasks at the specified time
   */
  const getTasksByTime = useCallback((time: string): Task[] => {
    return tasks.filter(task => task.time === time);
  }, [tasks]);

  /**
   * Checks if a task with the given ID exists
   * @param id - The ID to check
   * @returns True if task exists, false otherwise
   */
  const taskExists = useCallback((id: string): boolean => {
    return tasks.some(task => task.id === id);
  }, [tasks]);

  return {
    // State
    tasks,
    
    // CRUD operations
    addTask,
    updateTask,
    deleteTask,
    clearAllTasks,
    
    // Query operations
    getTaskById,
    getTasksByTime,
    taskExists,
    
    // Error state from localStorage
    error: storageError
  };
}