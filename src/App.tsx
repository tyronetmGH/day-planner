import { useState, useCallback, useEffect } from 'react';
import type { TaskFormData } from './types';
import { useTasks } from './hooks/useTasks';
import { useToast } from './hooks/useToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AddTaskForm } from './components/AddTaskForm';
import { TaskList } from './components/TaskList';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { ToastContainer } from './components/Toast';
import { LoadingOverlay } from './components/LoadingSpinner';
import './App.css';

/**
 * Main App component that manages global state and integrates all child components
 * Provides centralized error handling and task management
 */
function App() {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    clearAllTasks,
    error: tasksError
  } = useTasks();

  const {
    toasts,
    showError,
    dismissToast,
    showStorageError,
    showTaskSuccess
  } = useToast();

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  /**
   * Handles adding a new task with error handling and user feedback
   */
  const handleAddTask = useCallback(async (taskData: TaskFormData) => {
    setIsLoading(true);
    setLoadingMessage('Adding task...');
    
    try {
      setGlobalError(null);
      // Simulate brief loading for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      addTask(taskData);
      showTaskSuccess('added', taskData.title);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add task';
      showError(errorMessage, {
        action: {
          label: 'Retry',
          onClick: () => handleAddTask(taskData)
        }
      });
      console.error('Error adding task:', error);
    } finally {
      setIsLoading(false);
    }
  }, [addTask, showTaskSuccess, showError]);

  /**
   * Handles editing an existing task with error handling and user feedback
   */
  const handleEditTask = useCallback(async (id: string, taskData: TaskFormData) => {
    setIsLoading(true);
    setLoadingMessage('Updating task...');
    
    try {
      setGlobalError(null);
      // Simulate brief loading for better UX
      await new Promise(resolve => setTimeout(resolve, 200));
      updateTask(id, taskData);
      showTaskSuccess('updated', taskData.title);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      showError(errorMessage, {
        action: {
          label: 'Retry',
          onClick: () => handleEditTask(id, taskData)
        }
      });
      console.error('Error updating task:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateTask, showTaskSuccess, showError]);

  /**
   * Handles deleting a task with error handling and user feedback
   */
  const handleDeleteTask = useCallback(async (id: string) => {
    // Find task title for feedback before deletion
    const task = tasks.find(t => t.id === id);
    const taskTitle = task?.title;
    
    setIsLoading(true);
    setLoadingMessage('Deleting task...');
    
    try {
      setGlobalError(null);
      // Simulate brief loading for better UX
      await new Promise(resolve => setTimeout(resolve, 200));
      deleteTask(id);
      showTaskSuccess('deleted', taskTitle);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      showError(errorMessage, {
        action: {
          label: 'Retry',
          onClick: () => handleDeleteTask(id)
        }
      });
      console.error('Error deleting task:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deleteTask, tasks, showTaskSuccess, showError]);

  /**
   * Shows the clear all confirmation dialog
   */
  const handleShowClearAllDialog = useCallback(() => {
    setShowClearAllDialog(true);
  }, []);

  /**
   * Handles clearing all tasks with error handling and user feedback
   */
  const handleClearAllTasks = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage('Clearing all tasks...');
    
    try {
      setGlobalError(null);
      // Simulate brief loading for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      clearAllTasks();
      setShowClearAllDialog(false);
      showTaskSuccess('cleared');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear tasks';
      showError(errorMessage, {
        action: {
          label: 'Retry',
          onClick: () => handleClearAllTasks()
        }
      });
      console.error('Error clearing tasks:', error);
      setShowClearAllDialog(false);
    } finally {
      setIsLoading(false);
    }
  }, [clearAllTasks, showTaskSuccess, showError]);

  /**
   * Cancels the clear all dialog
   */
  const handleCancelClearAll = useCallback(() => {
    setShowClearAllDialog(false);
  }, []);

  /**
   * Dismisses the global error message
   */
  const dismissError = useCallback(() => {
    setGlobalError(null);
  }, []);

  // Handle storage errors with toast notifications
  useEffect(() => {
    if (tasksError) {
      showStorageError(tasksError);
    }
  }, [tasksError, showStorageError]);

  // Determine if there are any errors to display
  const displayError = globalError;

  return (
    <ErrorBoundary>
      <LoadingOverlay isVisible={isLoading} message={loadingMessage}>
        <div className="app">
          <header className="app__header">
            <h1 className="app__title">Day Planner</h1>
            <p className="app__subtitle">Organize your daily tasks with time-based scheduling</p>
          </header>

          <main className="app__main">
            {/* Global error display - only for critical errors now */}
            {displayError && (
              <div 
                className="app__error" 
                role="alert"
                aria-labelledby="error-title"
                aria-describedby="error-message"
              >
                <div className="error-banner">
                  <div className="error-banner__content">
                    <h2 id="error-title" className="error-banner__title">
                      Critical Error
                    </h2>
                    <p id="error-message" className="error-banner__message">
                      {displayError}
                    </p>
                  </div>
                  <button
                    onClick={dismissError}
                    className="error-banner__dismiss"
                    aria-label="Dismiss error message"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Add task form */}
            <section className="app__section" aria-labelledby="add-task-heading">
              <h2 id="add-task-heading" className="app__section-title">
                Add New Task
              </h2>
              <AddTaskForm onAdd={handleAddTask} />
            </section>

            {/* Task list */}
            <section className="app__section" aria-labelledby="task-list-heading">
              <div className="app__section-header">
                <h2 id="task-list-heading" className="app__section-title">
                  Your Schedule
                </h2>
                {tasks.length > 0 && (
                  <button
                    onClick={handleShowClearAllDialog}
                    className="btn btn--secondary btn--small"
                    aria-label={`Clear all ${tasks.length} tasks`}
                    type="button"
                    disabled={isLoading}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <TaskList
                tasks={tasks}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            </section>
          </main>

          <footer className="app__footer">
            <p className="app__footer-text">
              Built with React, TypeScript, and Vite
            </p>
          </footer>

          {/* Clear All Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={showClearAllDialog}
            title="Clear All Tasks"
            message={`Are you sure you want to clear all ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}? This action cannot be undone.`}
            confirmText="Clear All"
            cancelText="Cancel"
            onConfirm={handleClearAllTasks}
            onCancel={handleCancelClearAll}
            variant="danger"
          />

          {/* Toast notifications */}
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
      </LoadingOverlay>
    </ErrorBoundary>
  );
}

export default App;
