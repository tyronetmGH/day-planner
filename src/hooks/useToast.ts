import { useState, useCallback } from 'react';
import type { ToastMessage } from '../types';

/**
 * Custom hook for managing toast notifications
 * Provides functions to show different types of toasts and manage their lifecycle
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /**
   * Generates a unique ID for toast messages
   */
  const generateToastId = useCallback((): string => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Adds a new toast message
   */
  const addToast = useCallback((
    message: string,
    type: ToastMessage['type'] = 'info',
    options?: {
      duration?: number;
      action?: ToastMessage['action'];
    }
  ): string => {
    const id = generateToastId();
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration: options?.duration,
      action: options?.action
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, [generateToastId]);

  /**
   * Shows a success toast
   */
  const showSuccess = useCallback((
    message: string,
    options?: { duration?: number; action?: ToastMessage['action'] }
  ): string => {
    return addToast(message, 'success', options);
  }, [addToast]);

  /**
   * Shows an error toast
   */
  const showError = useCallback((
    message: string,
    options?: { duration?: number; action?: ToastMessage['action'] }
  ): string => {
    return addToast(message, 'error', { duration: 7000, ...options });
  }, [addToast]);

  /**
   * Shows a warning toast
   */
  const showWarning = useCallback((
    message: string,
    options?: { duration?: number; action?: ToastMessage['action'] }
  ): string => {
    return addToast(message, 'warning', { duration: 6000, ...options });
  }, [addToast]);

  /**
   * Shows an info toast
   */
  const showInfo = useCallback((
    message: string,
    options?: { duration?: number; action?: ToastMessage['action'] }
  ): string => {
    return addToast(message, 'info', options);
  }, [addToast]);

  /**
   * Dismisses a specific toast by ID
   */
  const dismissToast = useCallback((id: string): void => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Dismisses all toasts
   */
  const dismissAllToasts = useCallback((): void => {
    setToasts([]);
  }, []);

  /**
   * Shows a toast for localStorage errors with helpful actions
   */
  const showStorageError = useCallback((error: string): string => {
    if (error.includes('quota')) {
      return showError(
        'Storage is full. Some data may not be saved.',
        {
          duration: 10000,
          action: {
            label: 'Clear Data',
            onClick: () => {
              if (confirm('Clear all stored tasks? This cannot be undone.')) {
                localStorage.removeItem('dayPlannerTasks');
                window.location.reload();
              }
            }
          }
        }
      );
    } else if (error.includes('corrupted')) {
      return showWarning(
        'Your saved data was corrupted and has been reset.',
        { duration: 8000 }
      );
    } else if (error.includes('access')) {
      return showWarning(
        'Cannot access storage. Your tasks will not be saved.',
        { duration: 8000 }
      );
    } else {
      return showError(error, { duration: 6000 });
    }
  }, [showError, showWarning]);

  /**
   * Shows a success toast for task operations
   */
  const showTaskSuccess = useCallback((action: string, taskTitle?: string): string => {
    const messages = {
      added: taskTitle ? `Task "${taskTitle}" added successfully` : 'Task added successfully',
      updated: taskTitle ? `Task "${taskTitle}" updated successfully` : 'Task updated successfully',
      deleted: taskTitle ? `Task "${taskTitle}" deleted` : 'Task deleted',
      cleared: 'All tasks cleared successfully'
    };
    
    return showSuccess(messages[action as keyof typeof messages] || `Task ${action} successfully`);
  }, [showSuccess]);

  return {
    toasts,
    addToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    dismissAllToasts,
    showStorageError,
    showTaskSuccess
  };
}

export default useToast;