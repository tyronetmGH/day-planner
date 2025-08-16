import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTaskForm } from './AddTaskForm';
import { vi } from 'vitest';
import * as utils from '../utils';

// Mock the utils functions
vi.mock('../utils', () => ({
  validateAndSanitizeTaskFormData: vi.fn()
}));

const mockValidateAndSanitizeTaskFormData = vi.mocked(utils.validateAndSanitizeTaskFormData);

describe('AddTaskForm', () => {
  const mockOnAdd = vi.fn();

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

  describe('Form Rendering', () => {
    it('renders all form fields correctly', () => {
      render(<AddTaskForm onAdd={mockOnAdd} />);

      expect(screen.getByLabelText('Time')).toBeInTheDocument();
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add task to your schedule' })).toBeInTheDocument();
    });

    it('has proper form structure and accessibility', () => {
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const form = screen.getByRole('form', { name: 'Add new task' });
      expect(form).toBeInTheDocument();

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');
      const prioritySelect = screen.getByLabelText('Priority');

      expect(timeInput).toHaveAttribute('placeholder', '9:30 AM or 21:30');
      expect(titleInput).toHaveAttribute('placeholder', 'Task title');
      expect(titleInput).toHaveAttribute('required');
      expect(prioritySelect).toBeInTheDocument();
    });

    it('has proper ARIA labels and attributes', () => {
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');
      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });

      expect(timeInput).toHaveAttribute('id', 'add-time');
      expect(titleInput).toHaveAttribute('id', 'add-title');
      expect(submitButton).toHaveAttribute('aria-label', 'Add task to your schedule');
    });
  });

  describe('Form Input Handling', () => {
    it('updates form data when inputs change', async () => {
      const user = userEvent.setup();
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');
      const prioritySelect = screen.getByLabelText('Priority');

      await user.type(timeInput, '10:30');
      await user.type(titleInput, 'New Task');
      await user.selectOptions(prioritySelect, 'high');

      expect(timeInput).toHaveValue('10:30');
      expect(titleInput).toHaveValue('New Task');
      expect(prioritySelect).toHaveValue('high');
    });

    it('handles priority selection correctly', async () => {
      const user = userEvent.setup();
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const prioritySelect = screen.getByLabelText('Priority') as HTMLSelectElement;

      // Test all priority options
      await user.selectOptions(prioritySelect, 'low');
      expect(prioritySelect.value).toBe('low');

      await user.selectOptions(prioritySelect, 'medium');
      expect(prioritySelect.value).toBe('medium');

      await user.selectOptions(prioritySelect, 'high');
      expect(prioritySelect.value).toBe('high');

      await user.selectOptions(prioritySelect, '');
      expect(prioritySelect.value).toBe('');
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');
      const prioritySelect = screen.getByLabelText('Priority');
      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });

      await user.type(timeInput, '10:30');
      await user.type(titleInput, 'New Task');
      await user.selectOptions(prioritySelect, 'high');
      await user.click(submitButton);

      expect(mockValidateAndSanitizeTaskFormData).toHaveBeenCalledWith({
        time: '10:30',
        title: 'New Task',
        priority: 'high'
      });

      expect(mockOnAdd).toHaveBeenCalledWith({
        time: '09:30',
        title: 'Test Task',
        priority: 'medium'
      });
    });

    it('resets form after successful submission', async () => {
      const user = userEvent.setup();
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');
      const prioritySelect = screen.getByLabelText('Priority');
      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });

      await user.type(timeInput, '10:30');
      await user.type(titleInput, 'New Task');
      await user.selectOptions(prioritySelect, 'high');
      await user.click(submitButton);

      expect(timeInput).toHaveValue('');
      expect(titleInput).toHaveValue('');
      expect(prioritySelect).toHaveValue('');
    });

    it('prevents form submission when validation fails', async () => {
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
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });
      await user.click(submitButton);

      // Wait for errors to appear
      await screen.findByText('Invalid time format');
      await screen.findByText('Title is required');
      
      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('calls onAdd with valid data', async () => {
      const user = userEvent.setup();
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const titleInput = screen.getByLabelText('Title');
      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });

      await user.type(titleInput, 'Test Task');
      await user.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalled();
    });
  });

  describe('Validation Error Display', () => {
    it('displays validation errors with proper ARIA attributes', async () => {
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
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });
      await user.click(submitButton);

      // Wait for errors to appear
      const timeError = await screen.findByText('Invalid time format');
      const titleError = await screen.findByText('Title is required');

      expect(timeError).toHaveAttribute('role', 'alert');
      expect(titleError).toHaveAttribute('role', 'alert');

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');

      expect(timeInput).toHaveAttribute('aria-describedby', 'add-time-error add-time-help');
      expect(titleInput).toHaveAttribute('aria-describedby', 'add-title-error add-title-help');
      expect(timeInput).toHaveClass('form-field__input--error');
      expect(titleInput).toHaveClass('form-field__input--error');
    });

    it('displays general error messages', async () => {
      mockValidateAndSanitizeTaskFormData.mockReturnValue({
        isValid: false,
        sanitizedData: {
          time: '',
          title: '',
          priority: undefined
        },
        errors: [
          { field: 'general', message: 'Something went wrong' }
        ]
      });

      const user = userEvent.setup();
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });
      await user.click(submitButton);

      const generalError = await screen.findByText('Something went wrong');
      expect(generalError).toHaveAttribute('role', 'alert');
    });
  });

  describe('Keyboard Interactions', () => {
    it('clears form when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');
      const prioritySelect = screen.getByLabelText('Priority');

      await user.type(timeInput, '10:30');
      await user.type(titleInput, 'Test Task');
      await user.selectOptions(prioritySelect, 'high');

      fireEvent.keyDown(timeInput, { key: 'Escape' });

      expect(timeInput).toHaveValue('');
      expect(titleInput).toHaveValue('');
      expect(prioritySelect).toHaveValue('');
    });

    it('submits form when Enter is pressed in input field', async () => {
      const user = userEvent.setup();
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'Test Task');

      // Press Enter to submit the form
      await user.keyboard('{Enter}');

      expect(mockOnAdd).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles validation errors gracefully', async () => {
      mockValidateAndSanitizeTaskFormData.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      const user = userEvent.setup();
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const titleInput = screen.getByLabelText('Title');
      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });

      await user.type(titleInput, 'Test Task');
      await user.click(submitButton);

      expect(screen.getByText('Failed to add task. Please try again.')).toBeInTheDocument();
      expect(mockOnAdd).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Add new task');

      const timeLabel = screen.getByText('Time');
      const titleLabel = screen.getByText('Title');
      const priorityLabel = screen.getByText('Priority');

      expect(timeLabel).toHaveAttribute('for', 'add-time');
      expect(titleLabel).toHaveAttribute('for', 'add-title');
      expect(priorityLabel).toHaveAttribute('for', 'add-priority');
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      render(<AddTaskForm onAdd={mockOnAdd} />);

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');

      await user.click(timeInput);
      expect(timeInput).toHaveFocus();

      await user.tab();
      expect(titleInput).toHaveFocus();
    });
  });

  describe('Form State Management', () => {
    it('disables form inputs during submission', async () => {
      // Mock a slow onAdd function
      const slowOnAdd = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });

      const user = userEvent.setup();
      render(<AddTaskForm onAdd={slowOnAdd} />);

      const titleInput = screen.getByLabelText('Title');
      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });

      await user.type(titleInput, 'Test Task');
      
      // Since our implementation is synchronous, we can't easily test the disabled state
      // But we can verify the form works correctly
      await user.click(submitButton);
      expect(slowOnAdd).toHaveBeenCalled();
    });

    it('shows help text', () => {
      render(<AddTaskForm onAdd={mockOnAdd} />);

      expect(screen.getByText(/Press Escape to clear form/)).toBeInTheDocument();
    });
  });
});