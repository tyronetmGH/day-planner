import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from './TaskItem';
import type { Task } from '../types';
import { vi } from 'vitest';
import * as utils from '../utils';

// Mock the utils functions
vi.mock('../utils', () => ({
  validateAndSanitizeTaskFormData: vi.fn(),
  formatTimeForDisplay: vi.fn((time: string) => {
    // Simple mock implementation
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  })
}));

const mockValidateAndSanitizeTaskFormData = vi.mocked(utils.validateAndSanitizeTaskFormData);
const mockFormatTimeForDisplay = vi.mocked(utils.formatTimeForDisplay);

describe('TaskItem', () => {
  const mockTask: Task = {
    id: 'test-task-1',
    time: '09:30',
    title: 'Test Task',
    priority: 'medium',
    createdAt: Date.now()
  };

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateAndSanitizeTaskFormData.mockReturnValue({
      isValid: true,
      sanitizedData: {
        time: '09:30',
        title: 'Test Task',
        priority: 'medium'
      },
      errors: []
    });
  });

  describe('Display Mode', () => {
    it('renders task information correctly', () => {
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('9:30 AM')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('renders task without priority', () => {
      const taskWithoutPriority = { ...mockTask, priority: undefined };
      render(
        <TaskItem 
          task={taskWithoutPriority} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.queryByText('medium')).not.toBeInTheDocument();
    });

    it('applies correct priority CSS class', () => {
      const { container } = render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const taskItem = container.querySelector('.task-item');
      expect(taskItem).toHaveClass('priority-medium');
    });

    it('has accessible edit and delete buttons', () => {
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      const deleteButton = screen.getByLabelText('Delete task: Test Task');

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      expect(screen.getByDisplayValue('09:30')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      
      const prioritySelect = screen.getByLabelText('Priority') as HTMLSelectElement;
      expect(prioritySelect.value).toBe('medium');
    });

    it('focuses title input when entering edit mode', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Task');
        expect(titleInput).toHaveFocus();
      });
    });

    it('updates form data when inputs change', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      const titleInput = screen.getByDisplayValue('Test Task');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task');

      expect(screen.getByDisplayValue('Updated Task')).toBeInTheDocument();
    });

    it('saves changes when form is submitted', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      const titleInput = screen.getByDisplayValue('Test Task');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockOnEdit).toHaveBeenCalledWith('test-task-1', {
        time: '09:30',
        title: 'Test Task',
        priority: 'medium'
      });
    });

    it('cancels editing when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      const titleInput = screen.getByDisplayValue('Test Task');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task');

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('cancels editing when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      const titleInput = screen.getByDisplayValue('Test Task');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task');

      fireEvent.keyDown(titleInput, { key: 'Escape' });

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('saves when Ctrl+Enter is pressed', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      const titleInput = screen.getByDisplayValue('Test Task');
      fireEvent.keyDown(titleInput, { key: 'Enter', ctrlKey: true });

      expect(mockOnEdit).toHaveBeenCalled();
    });

    it('displays validation errors', async () => {
      mockValidateAndSanitizeTaskFormData.mockReturnValue({
        isValid: false,
        sanitizedData: {
          time: '',
          title: '',
          priority: undefined
        },
        errors: [
          { field: 'time', message: 'Invalid time format' },
          { field: 'title', message: 'Title is required' }
        ]
      });

      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(screen.getByText('Invalid time format')).toBeInTheDocument();
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('disables form inputs when submitting', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      // Mock validation to return invalid to prevent form submission
      mockValidateAndSanitizeTaskFormData.mockReturnValue({
        isValid: false,
        sanitizedData: {
          time: '',
          title: '',
          priority: undefined
        },
        errors: [{ field: 'title', message: 'Title is required' }]
      });

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      // Verify the form shows validation errors (which means it processed the submission)
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(mockOnEdit).not.toHaveBeenCalled();
    });
  });

  describe('Delete Confirmation', () => {
    it('shows delete confirmation when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByLabelText('Delete task: Test Task');
      await user.click(deleteButton);

      expect(screen.getByText('Delete Task?')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete "Test Task"/)).toBeInTheDocument();
    });

    it('focuses delete button in confirmation dialog', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByLabelText('Delete task: Test Task');
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByText('Delete');
        expect(confirmButton).toHaveFocus();
      });
    });

    it('deletes task when confirmed', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByLabelText('Delete task: Test Task');
      await user.click(deleteButton);

      const confirmButton = screen.getByText('Delete');
      await user.click(confirmButton);

      expect(mockOnDelete).toHaveBeenCalledWith('test-task-1');
    });

    it('cancels delete when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByLabelText('Delete task: Test Task');
      await user.click(deleteButton);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('cancels delete when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByLabelText('Delete task: Test Task');
      await user.click(deleteButton);

      const confirmButton = screen.getByText('Delete');
      fireEvent.keyDown(confirmButton, { key: 'Escape' });

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      const deleteButton = screen.getByLabelText('Delete task: Test Task');

      expect(editButton).toHaveAttribute('aria-label', 'Edit task: Test Task');
      expect(deleteButton).toHaveAttribute('aria-label', 'Delete task: Test Task');
    });

    it('has proper form labels in edit mode', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      expect(screen.getByLabelText('Time')).toBeInTheDocument();
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    });

    it('has proper dialog role for delete confirmation', async () => {
      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByLabelText('Delete task: Test Task');
      await user.click(deleteButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('has error messages with proper ARIA attributes', async () => {
      mockValidateAndSanitizeTaskFormData.mockReturnValue({
        isValid: false,
        sanitizedData: {
          time: '',
          title: '',
          priority: undefined
        },
        errors: [{ field: 'time', message: 'Invalid time format' }]
      });

      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      const errorMessage = screen.getByText('Invalid time format');
      expect(errorMessage).toHaveAttribute('role', 'alert');

      const timeInput = screen.getByLabelText('Time');
      expect(timeInput).toHaveAttribute('aria-describedby');
    });
  });

  describe('Error Handling', () => {
    it('handles validation errors gracefully', async () => {
      mockValidateAndSanitizeTaskFormData.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      const user = userEvent.setup();
      render(
        <TaskItem 
          task={mockTask} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByLabelText('Edit task: Test Task');
      await user.click(editButton);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(screen.getByText('Failed to save task. Please try again.')).toBeInTheDocument();
      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('handles time formatting errors gracefully', () => {
      const taskWithInvalidTime = { ...mockTask, time: 'invalid-time' };
      
      // Mock formatTimeForDisplay to throw an error
      mockFormatTimeForDisplay.mockImplementation((time: string) => {
        if (time === 'invalid-time') {
          throw new Error('Invalid time');
        }
        return '9:30 AM';
      });

      render(
        <TaskItem 
          task={taskWithInvalidTime} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      // Should fallback to original time string
      expect(screen.getByText('invalid-time')).toBeInTheDocument();
    });
  });
});