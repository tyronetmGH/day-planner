/**
 * Core data types for the Day Planner application
 */

export interface Task {
  id: string;
  time: string; // Format: "HH:MM" (24-hour)
  title: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: number; // Timestamp for tiebreaking
}

export interface TaskFormData {
  time: string;
  title: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ValidationError {
  field: string;
  message: string;
}

export type Priority = 'low' | 'medium' | 'high';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}