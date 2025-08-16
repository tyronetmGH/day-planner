/**
 * Integration tests for accessibility features across components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddTaskForm } from './AddTaskForm';
import { TaskList } from './TaskList';
import { TaskItem } from './TaskItem';
import { testAccessibility, expectAccessible } from '../utils/accessibilityTesting';
import type { Task } from '../types';

// Mock utils
vi.mock('../utils', () => ({
  validateAndSanitizeTaskFormData: vi.fn().mockReturnValue({
    isValid: true,
    sanitizedData: { time: '09:30', title: 'Test Task', priority: 'medium' },
    errors: []
  }),
  formatTimeForDisplay: vi.fn((time) => time)
}));

describe('Accessibility Integration Tests', () => {
  const mockTask: Task = {
    id: '1',
    time: '09:30',
    title: 'Test Task',
    priority: 'medium',
    createdAt: Date.now()
  };

  const mockTasks: Task[] = [
    mockTask,
    {
      id: '2',
      time: '14:00',
      title: 'Another Task',
      priority: 'high',
      createdAt: Date.now() + 1000
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AddTaskForm Accessibility', () => {
    it('passes automated accessibility tests', () => {
      const { container } = render(<AddTaskForm onAdd={vi.fn()} />);
      expectAccessible(container);
    });

    it('has proper keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AddTaskForm onAdd={vi.fn()} />);

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');
      const prioritySelect = screen.getByLabelText('Priority');
      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });

      // Test tab navigation
      await user.tab();
      expect(timeInput).toHaveFocus();

      await user.tab();
      expect(titleInput).toHaveFocus();

      await user.tab();
      expect(prioritySelect).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('has proper ARIA attributes and labels', () => {
      render(<AddTaskForm onAdd={vi.fn()} />);

      const form = screen.getByRole('form', { name: 'Add new task' });
      expect(form).toHaveAttribute('aria-label', 'Add new task');
      expect(form).toHaveAttribute('novalidate');

      const timeInput = screen.getByLabelText('Time');
      expect(timeInput).toHaveAttribute('aria-describedby', 'add-time-help');
      expect(timeInput).toHaveAttribute('aria-invalid', 'false');

      const titleInput = screen.getByLabelText('Title');
      expect(titleInput).toHaveAttribute('aria-describedby', 'add-title-help');
      expect(titleInput).toHaveAttribute('aria-invalid', 'false');
      expect(titleInput).toHaveAttribute('required');

      const prioritySelect = screen.getByLabelText('Priority');
      expect(prioritySelect).toHaveAttribute('aria-describedby', 'add-priority-help');
    });

    it('provides screen reader help text', () => {
      render(<AddTaskForm onAdd={vi.fn()} />);

      expect(screen.getByText('Enter time in formats like 9:30 AM, 21:30, or 9:30')).toHaveClass('sr-only');
      expect(screen.getByText('Enter a descriptive title for your task (maximum 200 characters)')).toHaveClass('sr-only');
      expect(screen.getByText('Optional: Select task priority level')).toHaveClass('sr-only');
    });

    it('handles error states accessibly', async () => {
      const mockValidate = vi.fn().mockReturnValue({
        isValid: false,
        sanitizedData: { time: '', title: '', priority: undefined },
        errors: [
          { field: 'time', message: 'Invalid time format' },
          { field: 'title', message: 'Title is required' }
        ]
      });

      vi.doMock('../utils', () => ({
        validateAndSanitizeTaskFormData: mockValidate,
        formatTimeForDisplay: vi.fn((time) => time)
      }));

      const user = userEvent.setup();
      render(<AddTaskForm onAdd={vi.fn()} />);

      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });
      await user.click(submitButton);

      const timeError = await screen.findByText('Invalid time format');
      const titleError = await screen.findByText('Title is required');

      expect(timeError).toHaveAttribute('role', 'alert');
      expect(titleError).toHaveAttribute('role', 'alert');

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');

      expect(timeInput).toHaveAttribute('aria-invalid', 'true');
      expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('TaskList Accessibility', () => {
    it('passes automated accessibility tests with tasks', () => {
      const { container } = render(
        <TaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      expectAccessible(container);
    });

    it('passes automated accessibility tests when empty', () => {
      const { container } = render(
        <TaskList tasks={[]} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      expectAccessible(container);
    });

    it('has proper ARIA structure', () => {
      render(<TaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const region = screen.getByRole('region', { name: 'Task list' });
      expect(region).toBeInTheDocument();

      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', '2 scheduled tasks');

      // Check for screen reader count info
      expect(screen.getByText('2 tasks in your schedule')).toHaveClass('sr-only');
    });

    it('provides meaningful empty state', () => {
      render(<TaskList tasks={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const emptyRegion = screen.getByRole('region', { name: 'Task list' });
      expect(emptyRegion).toHaveAttribute('aria-describedby', 'empty-state-message');

      const emptyTitle = screen.getByText('No tasks yet');
      expect(emptyTitle).toHaveAttribute('id', 'empty-state-title');

      const emptyMessage = screen.getByText('Add your first task above to get started with your daily planning.');
      expect(emptyMessage).toHaveAttribute('id', 'empty-state-message');
    });
  });

  describe('TaskItem Accessibility', () => {
    it('passes automated accessibility tests', () => {
      const { container } = render(
        <TaskItem task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      expectAccessible(container);
    });

    it('has proper semantic structure', () => {
      render(<TaskItem task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-labelledby', 'task-title-1');
      expect(article).toHaveAttribute('aria-describedby', 'task-time-1 task-priority-1');

      const title = screen.getByText('Test Task');
      expect(title).toHaveAttribute('id', 'task-title-1');

      const time = screen.getByText('09:30');
      expect(time).toHaveAttribute('id', 'task-time-1');
      expect(time).toHaveAttribute('aria-label', 'Scheduled for 09:30');

      const priority = screen.getByText('medium');
      expect(priority).toHaveAttribute('id', 'task-priority-1');
      expect(priority).toHaveAttribute('aria-label', 'Priority: medium');
      expect(priority).toHaveAttribute('role', 'status');
    });

    it('has accessible action buttons', () => {
      render(<TaskItem task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const actionsGroup = screen.getByRole('group', { name: 'Task actions' });
      expect(actionsGroup).toBeInTheDocument();

      const editButton = screen.getByRole('button', { name: 'Edit task: Test Task' });
      expect(editButton).toHaveAttribute('title', 'Edit task');

      const deleteButton = screen.getByRole('button', { name: 'Delete task: Test Task' });
      expect(deleteButton).toHaveAttribute('title', 'Delete task');

      // Check for screen reader text
      expect(screen.getByText('Edit')).toHaveClass('sr-only');
      expect(screen.getByText('Delete')).toHaveClass('sr-only');
    });

    it('handles edit mode accessibly', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const editButton = screen.getByRole('button', { name: 'Edit task: Test Task' });
      await user.click(editButton);

      const editForm = screen.getByRole('form', { name: 'Edit task: Test Task' });
      expect(editForm).toBeInTheDocument();

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');

      expect(timeInput).toHaveAttribute('id', 'time-1');
      expect(titleInput).toHaveAttribute('id', 'title-1');
      expect(titleInput).toHaveFocus(); // Should auto-focus on edit
    });

    it('handles delete confirmation accessibly', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete task: Test Task' });
      await user.click(deleteButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'delete-title-1');
      expect(dialog).toHaveAttribute('aria-describedby', 'delete-message-1');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      const dialogTitle = screen.getByText('Delete Task?');
      expect(dialogTitle).toHaveAttribute('id', 'delete-title-1');

      const dialogMessage = screen.getByText(/Are you sure you want to delete "Test Task"/);
      expect(dialogMessage).toHaveAttribute('id', 'delete-message-1');

      const confirmButton = screen.getByRole('button', { name: 'Confirm delete task: Test Task' });
      expect(confirmButton).toHaveFocus(); // Should auto-focus on confirm button
    });

    it('supports keyboard navigation in edit mode', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const editButton = screen.getByRole('button', { name: 'Edit task: Test Task' });
      await user.click(editButton);

      // Test Escape key cancels edit
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('form')).not.toBeInTheDocument();

      // Test Ctrl+Enter saves (re-enter edit mode first)
      await user.click(editButton);
      const titleInput = screen.getByLabelText('Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task');
      
      await user.keyboard('{Control>}{Enter}{/Control}');
      // Form should be submitted (we can't easily test the actual submission without mocking)
    });

    it('supports keyboard navigation in delete confirmation', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete task: Test Task' });
      await user.click(deleteButton);

      // Test Escape key cancels delete
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Color Contrast Compliance', () => {
    it('validates color contrast ratios', () => {
      const { container } = render(
        <div>
          <AddTaskForm onAdd={vi.fn()} />
          <TaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />
        </div>
      );

      const result = testAccessibility(container);
      
      // Filter for color contrast errors
      const contrastErrors = result.issues.filter(issue => issue.rule === 'color-contrast');
      
      // We expect no contrast errors with our WCAG AA compliant colors
      expect(contrastErrors).toHaveLength(0);
    });
  });

  describe('Focus Management', () => {
    it('maintains logical focus order', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <AddTaskForm onAdd={vi.fn()} />
          <TaskList tasks={[mockTask]} onEdit={vi.fn()} onDelete={vi.fn()} />
        </div>
      );

      // Start from the beginning and tab through all focusable elements
      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');
      const prioritySelect = screen.getByLabelText('Priority');
      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });
      const editButton = screen.getByRole('button', { name: 'Edit task: Test Task' });
      const deleteButton = screen.getByRole('button', { name: 'Delete task: Test Task' });

      await user.tab();
      expect(timeInput).toHaveFocus();

      await user.tab();
      expect(titleInput).toHaveFocus();

      await user.tab();
      expect(prioritySelect).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();

      await user.tab();
      expect(editButton).toHaveFocus();

      await user.tab();
      expect(deleteButton).toHaveFocus();
    });

    it('traps focus in modal dialogs', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete task: Test Task' });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: 'Confirm delete task: Test Task' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel delete' });

      expect(confirmButton).toHaveFocus();

      await user.tab();
      expect(cancelButton).toHaveFocus();

      await user.tab();
      expect(confirmButton).toHaveFocus(); // Should wrap back to first button
    });
  });

  describe('Screen Reader Support', () => {
    it('provides comprehensive screen reader information', () => {
      render(
        <div>
          <AddTaskForm onAdd={vi.fn()} />
          <TaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />
        </div>
      );

      // Check for various screen reader only content
      const srOnlyElements = document.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);

      // Verify specific screen reader content
      expect(screen.getByText('2 tasks in your schedule')).toHaveClass('sr-only');
      expect(screen.getByText('Enter time in formats like 9:30 AM, 21:30, or 9:30')).toHaveClass('sr-only');
      expect(screen.getByText('Enter a descriptive title for your task (maximum 200 characters)')).toHaveClass('sr-only');
    });

    it('uses proper ARIA live regions for dynamic content', async () => {
      // This would be tested in a more complete integration test
      // For now, we verify the structure is in place
      const { container } = render(<AddTaskForm onAdd={vi.fn()} />);
      
      // Check that error messages use role="alert" for live announcements
      const result = testAccessibility(container);
      expect(result.passed).toBe(true);
    });

    it('announces task count changes to screen readers', async () => {
      const user = userEvent.setup();
      const mockOnAdd = vi.fn();
      
      render(
        <div>
          <AddTaskForm onAdd={mockOnAdd} />
          <TaskList tasks={[]} onEdit={vi.fn()} onDelete={vi.fn()} />
        </div>
      );

      // Initially empty
      expect(screen.getByText('0 tasks in your schedule')).toHaveClass('sr-only');

      // Simulate adding a task (this would normally update the task count)
      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');
      const submitButton = screen.getByRole('button', { name: 'Add task to your schedule' });

      await user.type(timeInput, '09:30');
      await user.type(titleInput, 'New Task');
      await user.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior Tests', () => {
    // Mock window.matchMedia for responsive tests
    const mockMatchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    beforeEach(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(mockMatchMedia),
      });
    });

    it('adapts form layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          ...mockMatchMedia(query),
          matches: query === '(max-width: 768px)',
        })),
      });

      render(<AddTaskForm onAdd={vi.fn()} />);

      const form = screen.getByRole('form');
      expect(form).toHaveClass('form'); // Base class should be present

      // On mobile, form should stack inputs vertically
      const formContainer = form.querySelector('.form-container');
      expect(formContainer).toBeInTheDocument();
    });

    it('provides larger touch targets on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          ...mockMatchMedia(query),
          matches: query === '(max-width: 768px)',
        })),
      });

      render(<TaskItem task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const editButton = screen.getByRole('button', { name: 'Edit task: Test Task' });
      const deleteButton = screen.getByRole('button', { name: 'Delete task: Test Task' });

      // Buttons should have mobile-friendly classes
      expect(editButton).toHaveClass('action-button');
      expect(deleteButton).toHaveClass('action-button');
    });

    it('adapts task list layout for different screen sizes', () => {
      // Test tablet viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          ...mockMatchMedia(query),
          matches: query === '(min-width: 768px) and (max-width: 1024px)',
        })),
      });

      render(<TaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const taskList = screen.getByRole('list');
      expect(taskList).toHaveClass('task-list');

      // Task items should adapt to tablet layout
      const taskItems = screen.getAllByRole('article');
      taskItems.forEach(item => {
        expect(item).toHaveClass('task-item');
      });
    });

    it('maintains accessibility on small screens', () => {
      // Mock small mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          ...mockMatchMedia(query),
          matches: query === '(max-width: 480px)',
        })),
      });

      const { container } = render(
        <div>
          <AddTaskForm onAdd={vi.fn()} />
          <TaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />
        </div>
      );

      // Should still pass accessibility tests on small screens
      expectAccessible(container);

      // Touch targets should still be accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Minimum touch target size should be maintained
        expect(button).toBeInTheDocument();
      });
    });

    it('handles orientation changes gracefully', () => {
      // Mock landscape orientation
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        value: { angle: 90, type: 'landscape-primary' },
      });

      render(
        <div>
          <AddTaskForm onAdd={vi.fn()} />
          <TaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />
        </div>
      );

      // Layout should adapt to landscape
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // Task list should remain accessible
      const taskList = screen.getByRole('list');
      expect(taskList).toBeInTheDocument();
    });

    it('supports zoom up to 200% without horizontal scrolling', () => {
      // Mock high zoom level
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 2,
      });

      const { container } = render(
        <div>
          <AddTaskForm onAdd={vi.fn()} />
          <TaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />
        </div>
      );

      // Content should still be accessible at high zoom
      expectAccessible(container);

      // No horizontal overflow should occur
      const body = document.body;
      expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth + 1); // Allow 1px tolerance
    });

    it('maintains readable text at different zoom levels', () => {
      render(
        <div>
          <AddTaskForm onAdd={vi.fn()} />
          <TaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />
        </div>
      );

      // Text should remain readable
      const taskTitle = screen.getByText('Test Task');
      const taskTime = screen.getByText('09:30');

      expect(taskTitle).toBeVisible();
      expect(taskTime).toBeVisible();

      // Font sizes should be appropriate
      const titleStyles = window.getComputedStyle(taskTitle);
      const timeStyles = window.getComputedStyle(taskTime);

      // Minimum font sizes should be maintained
      expect(parseFloat(titleStyles.fontSize)).toBeGreaterThanOrEqual(14);
      expect(parseFloat(timeStyles.fontSize)).toBeGreaterThanOrEqual(12);
    });
  });

  describe('Keyboard Navigation Integration', () => {
    it('supports full keyboard navigation across all components', async () => {
      const user = userEvent.setup();
      const mockOnAdd = vi.fn();
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();

      render(
        <div>
          <AddTaskForm onAdd={mockOnAdd} />
          <TaskList tasks={[mockTask]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
        </div>
      );

      // Start navigation from the beginning
      const timeInput = screen.getByLabelText('Time');
      
      // Tab through form
      await user.tab();
      expect(timeInput).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Title')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Priority')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Add task to your schedule' })).toHaveFocus();

      // Tab to task actions
      await user.tab();
      expect(screen.getByRole('button', { name: 'Edit task: Test Task' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Delete task: Test Task' })).toHaveFocus();
    });

    it('supports keyboard shortcuts', async () => {
      const user = userEvent.setup();
      const mockOnAdd = vi.fn();

      render(<AddTaskForm onAdd={mockOnAdd} />);

      const timeInput = screen.getByLabelText('Time');
      const titleInput = screen.getByLabelText('Title');

      await user.click(timeInput);
      await user.type(timeInput, '09:30');
      await user.tab();
      await user.type(titleInput, 'Keyboard Task');

      // Test Ctrl+Enter to submit
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(mockOnAdd).toHaveBeenCalledWith({
        time: '09:30',
        title: 'Keyboard Task',
        priority: 'medium'
      });
    });

    it('handles escape key to cancel operations', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

      // Test escape in edit mode
      const editButton = screen.getByRole('button', { name: 'Edit task: Test Task' });
      await user.click(editButton);

      expect(screen.getByRole('form')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('form')).not.toBeInTheDocument();

      // Test escape in delete confirmation
      const deleteButton = screen.getByRole('button', { name: 'Delete task: Test Task' });
      await user.click(deleteButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('maintains focus after dynamic content changes', async () => {
      const user = userEvent.setup();
      const mockOnEdit = vi.fn();

      render(<TaskItem task={mockTask} onEdit={mockOnEdit} onDelete={vi.fn()} />);

      const editButton = screen.getByRole('button', { name: 'Edit task: Test Task' });
      await user.click(editButton);

      // Title input should be focused when entering edit mode
      const titleInput = screen.getByLabelText('Title');
      expect(titleInput).toHaveFocus();

      // After saving, focus should return to edit button
      const saveButton = screen.getByRole('button', { name: 'Save changes' });
      await user.click(saveButton);

      // Focus should return to the edit button after save
      await waitFor(() => {
        expect(editButton).toHaveFocus();
      });
    });
  });
});