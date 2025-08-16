/**
 * Task sorting and manipulation utilities for the Day Planner application
 */

import type { Task, Priority } from '../types';

/**
 * Priority order mapping for sorting (higher number = higher priority)
 */
const PRIORITY_ORDER: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1
};

/**
 * Sorts tasks by time → priority → creation order logic
 * Primary sort: by time (earliest first)
 * Secondary sort: by priority (high > medium > low)
 * Tertiary sort: by creation time (preserve insertion order for same time/priority)
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Primary sort: by time
    const timeComparison = a.time.localeCompare(b.time);
    if (timeComparison !== 0) {
      return timeComparison;
    }
    
    // Secondary sort: by priority (high > medium > low)
    const aPriority = PRIORITY_ORDER[a.priority || 'low'];
    const bPriority = PRIORITY_ORDER[b.priority || 'low'];
    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }
    
    // Tertiary sort: by creation time (preserve insertion order)
    return a.createdAt - b.createdAt;
  });
}

/**
 * Groups tasks by time for easier duplicate time handling
 */
export function groupTasksByTime(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce((groups, task) => {
    const time = task.time;
    if (!groups[time]) {
      groups[time] = [];
    }
    groups[time].push(task);
    return groups;
  }, {} as Record<string, Task[]>);
}

/**
 * Finds tasks that have the same time as the given task
 */
export function findTasksWithSameTime(tasks: Task[], targetTime: string): Task[] {
  return tasks.filter(task => task.time === targetTime);
}

/**
 * Checks if a task list is properly sorted according to our sorting rules
 */
export function isTaskListSorted(tasks: Task[]): boolean {
  for (let i = 1; i < tasks.length; i++) {
    const prev = tasks[i - 1];
    const curr = tasks[i];
    
    // Check time ordering
    const timeComparison = prev.time.localeCompare(curr.time);
    if (timeComparison > 0) {
      return false; // Previous time is later than current
    }
    
    // If same time, check priority ordering
    if (timeComparison === 0) {
      const prevPriority = PRIORITY_ORDER[prev.priority || 'low'];
      const currPriority = PRIORITY_ORDER[curr.priority || 'low'];
      
      if (prevPriority < currPriority) {
        return false; // Previous priority is lower than current
      }
      
      // If same time and priority, check creation time ordering
      if (prevPriority === currPriority && prev.createdAt > curr.createdAt) {
        return false; // Previous was created later than current
      }
    }
  }
  
  return true;
}