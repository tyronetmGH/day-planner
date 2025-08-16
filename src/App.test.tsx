import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';

// Mock the useTasks hook
vi.mock('./hooks/useTasks', () => ({
  useTasks: vi.fn()
}));

// Mock the components to focus on App integration
vi.mock('./components/AddTaskForm', () => ({
  AddTaskForm: ({ onAdd }: { onAdd: (data: any) => void }) => (
    <div data-testid="add-task-form">
      <button onClick={() => onAdd({ time: '09:00', title: 'Test Task' })}>
        Add Test Task
      </button>
    </div>
  )
}));

vi.mock('./components/TaskList', () => ({
  TaskList: ({ tasks, onEdit, onDelete }: any) => (
    <div data-testid="task-list">
      {tasks.map((task: any) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          {task.title}
          <button onClick={() => onEdit(task.id, { time: '10:00', title: 'Updated' })}>
            Edit
          </button>
          <button onClick={() => onDelete(task.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}));

import { useTasks } from './hooks/useTasks';

const mockUseTasks = useTasks as any;

describe('App Component', () => {
  const mockTasks = [
    { id: '1', time: '09:00', title: 'Task 1', createdAt: Date.now() },
    { id: '2', time: '10:00', title: 'Task 2', createdAt: Date.now() + 1000 }
  ];

  const defaultMockReturn = {
    tasks: [],
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    clearAllTasks: vi.fn(),
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTasks.mockReturnValue(defaultMockReturn);
  });

  describe('Basic Rendering', () => {
    it('renders the app title and subtitle', () => {
      render(<App />);
      
      expect(screen.getByText('Day Planner')).toBeInTheDocument();
      expect(screen.getByText('Organize your daily tasks with time-based scheduling')).toBeInTheDocument();
    });

    it('renders the add task form', () => {
      render(<App />);
      
      expect(screen.getByTestId('add-task-form')).toBeInTheDocument();
    });

    it('renders the task list', () => {
      render(<App />);
      
      expect(screen.getByTestId('task-list')).toBeInTheDocument();
    });

    it('renders footer', () => {
      render(<App />);
      
      expect(screen.getByText('Built with React, TypeScript, and Vite')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays global error when present', () => {
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        error: 'Storage error occurred'
      });

      render(<App />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Storage error occurred')).toBeInTheDocument();
    });

    it('allows dismissing error messages', async () => {
      const user = userEvent.setup();
      const mockAddTask = vi.fn().mockImplementation(() => {
        throw new Error('Add task failed');
      });
      
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        addTask: mockAddTask
      });

      render(<App />);
      
      // Trigger an error first
      const addButton = screen.getByText('Add Test Task');
      await user.click(addButton);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Then dismiss it
      const dismissButton = screen.getByLabelText('Dismiss error message');
      await user.click(dismissButton);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles add task errors', async () => {
      const user = userEvent.setup();
      const mockAddTask = vi.fn().mockImplementation(() => {
        throw new Error('Add task failed');
      });
      
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        addTask: mockAddTask
      });

      render(<App />);
      
      const addButton = screen.getByText('Add Test Task');
      await user.click(addButton);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Add task failed')).toBeInTheDocument();
    });

    it('handles edit task errors', async () => {
      const user = userEvent.setup();
      const mockUpdateTask = vi.fn().mockImplementation(() => {
        throw new Error('Update task failed');
      });
      
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        tasks: mockTasks,
        updateTask: mockUpdateTask
      });

      render(<App />);
      
      const editButton = screen.getAllByText('Edit')[0];
      await user.click(editButton);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Update task failed')).toBeInTheDocument();
    });

    it('handles delete task errors', async () => {
      const user = userEvent.setup();
      const mockDeleteTask = vi.fn().mockImplementation(() => {
        throw new Error('Delete task failed');
      });
      
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        tasks: mockTasks,
        deleteTask: mockDeleteTask
      });

      render(<App />);
      
      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Delete task failed')).toBeInTheDocument();
    });
  });

  describe('Clear All Tasks Functionality', () => {
    it('does not show clear all button when no tasks', () => {
      render(<App />);
      
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('shows clear all button when tasks exist', () => {
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        tasks: mockTasks
      });

      render(<App />);
      
      expect(screen.getByText('Clear All')).toBeInTheDocument();
      expect(screen.getByLabelText('Clear all 2 tasks')).toBeInTheDocument();
    });

    it('shows confirmation dialog when clear all is clicked', async () => {
      const user = userEvent.setup();
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        tasks: mockTasks
      });

      render(<App />);
      
      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Clear All Tasks')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to clear all 2 tasks? This action cannot be undone.')).toBeInTheDocument();
    });

    it('cancels clear all when cancel is clicked', async () => {
      const user = userEvent.setup();
      const mockClearAllTasks = vi.fn();
      
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        tasks: mockTasks,
        clearAllTasks: mockClearAllTasks
      });

      render(<App />);
      
      // Open dialog
      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);
      
      // Cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mockClearAllTasks).not.toHaveBeenCalled();
    });

    it('clears all tasks when confirmed', async () => {
      const user = userEvent.setup();
      const mockClearAllTasks = vi.fn();
      
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        tasks: mockTasks,
        clearAllTasks: mockClearAllTasks
      });

      render(<App />);
      
      // Open dialog
      const clearAllButton = screen.getByLabelText('Clear all 2 tasks');
      await user.click(clearAllButton);
      
      // Confirm
      const confirmButton = screen.getByLabelText('Clear All action');
      await user.click(confirmButton);
      
      expect(mockClearAllTasks).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('handles clear all task errors', async () => {
      const user = userEvent.setup();
      const mockClearAllTasks = vi.fn().mockImplementation(() => {
        throw new Error('Clear all failed');
      });
      
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        tasks: mockTasks,
        clearAllTasks: mockClearAllTasks
      });

      render(<App />);
      
      // Open dialog and confirm
      const clearAllButton = screen.getByLabelText('Clear all 2 tasks');
      await user.click(clearAllButton);
      
      const confirmButton = screen.getByLabelText('Clear All action');
      await user.click(confirmButton);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Clear all failed')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes dialog on Escape key', async () => {
      const user = userEvent.setup();
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        tasks: mockTasks
      });

      render(<App />);
      
      // Open dialog
      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Press Escape
      await user.keyboard('{Escape}');
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Task Operations', () => {
    it('calls addTask when add task form is used', async () => {
      const user = userEvent.setup();
      const mockAddTask = vi.fn();
      
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        addTask: mockAddTask
      });

      render(<App />);
      
      const addButton = screen.getByText('Add Test Task');
      await user.click(addButton);
      
      expect(mockAddTask).toHaveBeenCalledWith({ time: '09:00', title: 'Test Task' });
    });

    it('calls updateTask when task is edited', async () => {
      const user = userEvent.setup();
      const mockUpdateTask = vi.fn();
      
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        tasks: mockTasks,
        updateTask: mockUpdateTask
      });

      render(<App />);
      
      const editButton = screen.getAllByText('Edit')[0];
      await user.click(editButton);
      
      expect(mockUpdateTask).toHaveBeenCalledWith('1', { time: '10:00', title: 'Updated' });
    });

    it('calls deleteTask when task is deleted', async () => {
      const user = userEvent.setup();
      const mockDeleteTask = vi.fn();
      
      mockUseTasks.mockReturnValue({
        ...defaultMockReturn,
        tasks: mockTasks,
        deleteTask: mockDeleteTask
      });

      render(<App />);
      
      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);
      
      expect(mockDeleteTask).toHaveBeenCalledWith('1');
    });
  });
});