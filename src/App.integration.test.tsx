import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from './App';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    // Helper methods for testing
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    }
  };
})();

// Replace global localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('App Integration Tests - End-to-End Task Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    mockLocalStorage.clear();
  });

  describe('Complete Task Management Flow', () => {
    it('should handle complete add → display → edit → delete flow', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Verify initial empty state
      expect(screen.getByText('No tasks yet — add one to get started')).toBeInTheDocument();

      // Step 1: Add a task
      const timeInput = screen.getByLabelText(/time/i);
      const titleInput = screen.getByLabelText(/task title/i);
      const addButton = screen.getByRole('button', { name: /add task/i });

      await user.type(timeInput, '09:30');
      await user.type(titleInput, 'Morning Meeting');
      await user.click(addButton);

      // Verify task was added and displayed
      await waitFor(() => {
        expect(screen.getByText('Morning Meeting')).toBeInTheDocument();
        expect(screen.getByText('9:30 AM')).toBeInTheDocument();
      });

      // Verify localStorage persistence
      const storedTasks = JSON.parse(mockLocalStorage.getItem('dayPlannerTasks') || '[]');
      expect(storedTasks).toHaveLength(1);
      expect(storedTasks[0]).toMatchObject({
        time: '09:30',
        title: 'Morning Meeting',
        priority: 'medium'
      });

      // Step 2: Edit the task
      const editButton = screen.getByRole('button', { name: /edit task/i });
      await user.click(editButton);

      // Find edit form inputs
      const editTimeInput = screen.getByDisplayValue('09:30');
      const editTitleInput = screen.getByDisplayValue('Morning Meeting');
      
      await user.clear(editTimeInput);
      await user.type(editTimeInput, '10:00');
      await user.clear(editTitleInput);
      await user.type(editTitleInput, 'Updated Meeting');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify task was updated
      await waitFor(() => {
        expect(screen.getByText('Updated Meeting')).toBeInTheDocument();
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
        expect(screen.queryByText('Morning Meeting')).not.toBeInTheDocument();
      });

      // Verify localStorage was updated
      const updatedTasks = JSON.parse(mockLocalStorage.getItem('dayPlannerTasks') || '[]');
      expect(updatedTasks[0]).toMatchObject({
        time: '10:00',
        title: 'Updated Meeting'
      });

      // Step 3: Delete the task
      const deleteButton = screen.getByRole('button', { name: /delete task/i });
      await user.click(deleteButton);

      // Confirm deletion in dialog
      const confirmDeleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmDeleteButton);

      // Verify task was deleted
      await waitFor(() => {
        expect(screen.queryByText('Updated Meeting')).not.toBeInTheDocument();
        expect(screen.getByText('No tasks yet — add one to get started')).toBeInTheDocument();
      });

      // Verify localStorage was cleared
      const finalTasks = JSON.parse(mockLocalStorage.getItem('dayPlannerTasks') || '[]');
      expect(finalTasks).toHaveLength(0);
    });

    it('should handle multiple tasks with proper sorting', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Add multiple tasks in non-chronological order
      const timeInput = screen.getByLabelText(/time/i);
      const titleInput = screen.getByLabelText(/task title/i);
      const addButton = screen.getByRole('button', { name: /add task/i });

      // Add afternoon task first
      await user.type(timeInput, '14:30');
      await user.type(titleInput, 'Afternoon Task');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Afternoon Task')).toBeInTheDocument();
      });

      // Clear inputs and add morning task
      await user.clear(timeInput);
      await user.clear(titleInput);
      await user.type(timeInput, '09:00');
      await user.type(titleInput, 'Morning Task');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Morning Task')).toBeInTheDocument();
      });

      // Add evening task
      await user.clear(timeInput);
      await user.clear(titleInput);
      await user.type(timeInput, '18:00');
      await user.type(titleInput, 'Evening Task');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Evening Task')).toBeInTheDocument();
      });

      // Verify tasks are displayed in chronological order
      const taskItems = screen.getAllByTestId(/^task-item-/);
      expect(taskItems).toHaveLength(3);
      
      // Check the order by looking at the text content
      expect(taskItems[0]).toHaveTextContent('Morning Task');
      expect(taskItems[0]).toHaveTextContent('9:00 AM');
      expect(taskItems[1]).toHaveTextContent('Afternoon Task');
      expect(taskItems[1]).toHaveTextContent('2:30 PM');
      expect(taskItems[2]).toHaveTextContent('Evening Task');
      expect(taskItems[2]).toHaveTextContent('6:00 PM');
    });

    it('should handle priority-based sorting for same time', async () => {
      const user = userEvent.setup();
      render(<App />);

      const timeInput = screen.getByLabelText(/time/i);
      const titleInput = screen.getByLabelText(/task title/i);
      const prioritySelect = screen.getByLabelText(/priority/i);
      const addButton = screen.getByRole('button', { name: /add task/i });

      // Add low priority task first
      await user.type(timeInput, '10:00');
      await user.type(titleInput, 'Low Priority Task');
      await user.selectOptions(prioritySelect, 'low');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Low Priority Task')).toBeInTheDocument();
      });

      // Add high priority task at same time
      await user.clear(timeInput);
      await user.clear(titleInput);
      await user.type(timeInput, '10:00');
      await user.type(titleInput, 'High Priority Task');
      await user.selectOptions(prioritySelect, 'high');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('High Priority Task')).toBeInTheDocument();
      });

      // Verify high priority task appears first
      const taskItems = screen.getAllByTestId(/^task-item-/);
      expect(taskItems[0]).toHaveTextContent('High Priority Task');
      expect(taskItems[1]).toHaveTextContent('Low Priority Task');
    });
  });

  describe('localStorage Persistence Across Browser Refresh', () => {
    it('should persist tasks across app remounts', async () => {
      const user = userEvent.setup();
      
      // First render - add tasks
      const { unmount } = render(<App />);

      const timeInput = screen.getByLabelText(/time/i);
      const titleInput = screen.getByLabelText(/task title/i);
      const addButton = screen.getByRole('button', { name: /add task/i });

      await user.type(timeInput, '09:00');
      await user.type(titleInput, 'Persistent Task');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Persistent Task')).toBeInTheDocument();
      });

      // Verify localStorage has the task
      const storedTasks = JSON.parse(mockLocalStorage.getItem('dayPlannerTasks') || '[]');
      expect(storedTasks).toHaveLength(1);

      // Unmount component (simulate page refresh)
      unmount();

      // Re-render component (simulate page reload)
      render(<App />);

      // Verify task is still displayed
      await waitFor(() => {
        expect(screen.getByText('Persistent Task')).toBeInTheDocument();
        expect(screen.getByText('9:00 AM')).toBeInTheDocument();
      });
    });

    it('should handle empty localStorage on first visit', async () => {
      // Ensure localStorage is empty
      mockLocalStorage.clear();
      
      render(<App />);

      // Verify empty state is displayed
      expect(screen.getByText('No tasks yet — add one to get started')).toBeInTheDocument();
      expect(screen.queryByTestId(/^task-item-/)).not.toBeInTheDocument();
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Set corrupted data in localStorage
      mockLocalStorage.setItem('dayPlannerTasks', 'invalid-json-data');
      
      render(<App />);

      // Should display empty state and not crash
      expect(screen.getByText('No tasks yet — add one to get started')).toBeInTheDocument();
      
      // localStorage should be cleared
      expect(mockLocalStorage.getItem('dayPlannerTasks')).toBe('[]');
    });
  });

  describe('Error Scenarios and localStorage Failures', () => {
    it('should handle localStorage quota exceeded error', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage.setItem to throw quota exceeded error
      mockLocalStorage.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      render(<App />);

      const timeInput = screen.getByLabelText(/time/i);
      const titleInput = screen.getByLabelText(/task title/i);
      const addButton = screen.getByRole('button', { name: /add task/i });

      await user.type(timeInput, '09:00');
      await user.type(titleInput, 'Test Task');
      await user.click(addButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument();
      });
    });

    it('should handle localStorage access denied error', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage.setItem to throw access denied error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      render(<App />);

      const timeInput = screen.getByLabelText(/time/i);
      const titleInput = screen.getByLabelText(/task title/i);
      const addButton = screen.getByRole('button', { name: /add task/i });

      await user.type(timeInput, '09:00');
      await user.type(titleInput, 'Test Task');
      await user.click(addButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/localStorage access denied/i)).toBeInTheDocument();
      });
    });

    it('should handle localStorage getItem failure', async () => {
      // Mock localStorage.getItem to throw error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage read error');
      });

      render(<App />);

      // Should still render without crashing
      expect(screen.getByText('Day Planner')).toBeInTheDocument();
      expect(screen.getByText('No tasks yet — add one to get started')).toBeInTheDocument();
    });

    it('should recover from localStorage errors and continue working', async () => {
      const user = userEvent.setup();
      
      // Initially mock setItem to fail
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Temporary storage error');
      });

      render(<App />);

      const timeInput = screen.getByLabelText(/time/i);
      const titleInput = screen.getByLabelText(/task title/i);
      const addButton = screen.getByRole('button', { name: /add task/i });

      // First attempt should fail
      await user.type(timeInput, '09:00');
      await user.type(titleInput, 'First Task');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Dismiss error
      const dismissButton = screen.getByLabelText('Dismiss error message');
      await user.click(dismissButton);

      // Restore normal localStorage behavior
      mockLocalStorage.setItem.mockRestore();

      // Second attempt should succeed
      await user.clear(timeInput);
      await user.clear(titleInput);
      await user.type(timeInput, '10:00');
      await user.type(titleInput, 'Second Task');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Second Task')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Clear All Tasks Integration', () => {
    it('should handle complete clear all flow with persistence', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Add multiple tasks
      const timeInput = screen.getByLabelText(/time/i);
      const titleInput = screen.getByLabelText(/task title/i);
      const addButton = screen.getByRole('button', { name: /add task/i });

      // Add first task
      await user.type(timeInput, '09:00');
      await user.type(titleInput, 'Task 1');
      await user.click(addButton);

      // Add second task
      await user.clear(timeInput);
      await user.clear(titleInput);
      await user.type(timeInput, '10:00');
      await user.type(titleInput, 'Task 2');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByText('Task 2')).toBeInTheDocument();
      });

      // Verify localStorage has tasks
      let storedTasks = JSON.parse(mockLocalStorage.getItem('dayPlannerTasks') || '[]');
      expect(storedTasks).toHaveLength(2);

      // Clear all tasks
      const clearAllButton = screen.getByRole('button', { name: /clear all 2 tasks/i });
      await user.click(clearAllButton);

      // Confirm in dialog
      const confirmButton = screen.getByRole('button', { name: /clear all action/i });
      await user.click(confirmButton);

      // Verify all tasks are removed
      await waitFor(() => {
        expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
        expect(screen.getByText('No tasks yet — add one to get started')).toBeInTheDocument();
      });

      // Verify localStorage is cleared
      storedTasks = JSON.parse(mockLocalStorage.getItem('dayPlannerTasks') || '[]');
      expect(storedTasks).toHaveLength(0);
    });
  });

  describe('Form Validation Integration', () => {
    it('should handle invalid time formats with proper error display', async () => {
      const user = userEvent.setup();
      render(<App />);

      const timeInput = screen.getByLabelText(/time/i);
      const titleInput = screen.getByLabelText(/task title/i);
      const addButton = screen.getByRole('button', { name: /add task/i });

      // Try invalid time format
      await user.type(timeInput, '25:00');
      await user.type(titleInput, 'Invalid Time Task');
      await user.click(addButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid time format/i)).toBeInTheDocument();
      });

      // Task should not be added
      expect(screen.queryByText('Invalid Time Task')).not.toBeInTheDocument();
      expect(screen.getByText('No tasks yet — add one to get started')).toBeInTheDocument();
    });

    it('should handle empty required fields', async () => {
      const user = userEvent.setup();
      render(<App />);

      const addButton = screen.getByRole('button', { name: /add task/i });

      // Try to submit without filling fields
      await user.click(addButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/time is required/i)).toBeInTheDocument();
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      // No task should be added
      expect(screen.getByText('No tasks yet — add one to get started')).toBeInTheDocument();
    });
  });
});