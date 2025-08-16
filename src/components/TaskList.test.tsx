import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskList } from './TaskList';
import type { Task } from '../types';
import { vi } from 'vitest';

// Mock the TaskItem component
vi.mock('./TaskItem', () => ({
  TaskItem: ({ task, onEdit, onDelete }: any) => (
    <li data-testid={`task-item-${task.id}`}>
      <div>Task: {task.title}</div>
      <div>Time: {task.time}</div>
      <div>Priority: {task.priority || 'none'}</div>
      <button onClick={() => onEdit(task.id, { time: task.time, title: task.title, priority: task.priority })}>
        Edit
      </button>
      <button onClick={() => onDelete(task.id)}>Delete</button>
    </li>
  )
}));

describe('TaskList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      time: '09:00',
      title: 'Morning Meeting',
      priority: 'high',
      createdAt: Date.now() - 1000
    },
    {
      id: 'task-2',
      time: '14:30',
      title: 'Lunch Break',
      priority: 'medium',
      createdAt: Date.now() - 500
    },
    {
      id: 'task-3',
      time: '17:00',
      title: 'Review Code',
      createdAt: Date.now()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('renders empty state when no tasks are provided', () => {
      render(<TaskList tasks={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      expect(screen.getByText('Add your first task above to get started with your daily planning.')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Task list' })).toBeInTheDocument();
    });

    it('has proper accessibility attributes for empty state', () => {
      render(<TaskList tasks={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const taskListRegion = screen.getByRole('region', { name: 'Task list' });
      expect(taskListRegion).toHaveClass('task-list--empty');

      const icon = screen.getByText('📝');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('displays helpful messaging in empty state', () => {
      render(<TaskList tasks={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveTextContent('No tasks yet');

      const message = screen.getByText(/Add your first task above/);
      expect(message).toBeInTheDocument();
    });
  });

  describe('Task List Rendering', () => {
    it('renders all tasks when tasks are provided', () => {
      render(<TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByTestId('task-item-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-task-2')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-task-3')).toBeInTheDocument();

      expect(screen.getByText('Task: Morning Meeting')).toBeInTheDocument();
      expect(screen.getByText('Task: Lunch Break')).toBeInTheDocument();
      expect(screen.getByText('Task: Review Code')).toBeInTheDocument();
    });

    it('has proper semantic HTML structure', () => {
      render(<TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const taskListRegion = screen.getByRole('region', { name: 'Task list' });
      expect(taskListRegion).toHaveClass('task-list');

      const list = screen.getByRole('list');
      expect(list).toHaveClass('task-list__items');

      // Check that all tasks are rendered as list items
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(sampleTasks.length);
    });

    it('passes correct props to TaskItem components', () => {
      render(<TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Verify task data is displayed correctly
      expect(screen.getByText('Time: 09:00')).toBeInTheDocument();
      expect(screen.getByText('Time: 14:30')).toBeInTheDocument();
      expect(screen.getByText('Time: 17:00')).toBeInTheDocument();

      expect(screen.getByText('Priority: high')).toBeInTheDocument();
      expect(screen.getByText('Priority: medium')).toBeInTheDocument();
      expect(screen.getByText('Priority: none')).toBeInTheDocument();
    });
  });

  describe('Task Interactions', () => {
    it('handles edit actions correctly', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledWith('task-1', {
        time: '09:00',
        title: 'Morning Meeting',
        priority: 'high'
      });
    });

    it('handles delete actions correctly', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[1]);

      expect(mockOnDelete).toHaveBeenCalledWith('task-2');
    });

    it('handles multiple task interactions independently', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');

      await user.click(editButtons[0]);
      await user.click(deleteButtons[2]);

      expect(mockOnEdit).toHaveBeenCalledWith('task-1', {
        time: '09:00',
        title: 'Morning Meeting',
        priority: 'high'
      });
      expect(mockOnDelete).toHaveBeenCalledWith('task-3');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const region = screen.getByRole('region', { name: 'Task list' });
      expect(region).toBeInTheDocument();

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('maintains proper focus management', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const firstEditButton = screen.getAllByText('Edit')[0];
      await user.click(firstEditButton);

      expect(firstEditButton).toHaveFocus();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButtons = screen.getAllByText('Edit');
      
      // Focus first button
      editButtons[0].focus();
      expect(editButtons[0]).toHaveFocus();

      // Tab to next button
      await user.tab();
      expect(screen.getAllByText('Delete')[0]).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles single task correctly', () => {
      const singleTask = [sampleTasks[0]];
      render(<TaskList tasks={singleTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByTestId('task-item-task-1')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    it('handles tasks without priority', () => {
      const taskWithoutPriority: Task = {
        id: 'task-no-priority',
        time: '12:00',
        title: 'Task without priority',
        createdAt: Date.now()
      };

      render(<TaskList tasks={[taskWithoutPriority]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText('Priority: none')).toBeInTheDocument();
    });

    it('handles empty task list after having tasks', () => {
      const { rerender } = render(
        <TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      expect(screen.getByRole('list')).toBeInTheDocument();

      rerender(<TaskList tasks={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders large number of tasks efficiently', () => {
      const manyTasks: Task[] = Array.from({ length: 100 }, (_, index) => ({
        id: `task-${index}`,
        time: `${9 + Math.floor(index / 10)}:${(index % 10) * 6}0`.padStart(5, '0'),
        title: `Task ${index + 1}`,
        priority: ['low', 'medium', 'high'][index % 3] as 'low' | 'medium' | 'high',
        createdAt: Date.now() + index
      }));

      const startTime = performance.now();
      render(<TaskList tasks={manyTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
      expect(screen.getAllByRole('listitem')).toHaveLength(100);
    });
  });

  describe('Component Integration', () => {
    it('integrates properly with TaskItem component', () => {
      render(<TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Verify that TaskItem components are rendered with correct data
      sampleTasks.forEach(task => {
        expect(screen.getByTestId(`task-item-${task.id}`)).toBeInTheDocument();
      });
    });

    it('maintains component state correctly during updates', () => {
      const { rerender } = render(
        <TaskList tasks={sampleTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      expect(screen.getAllByRole('listitem')).toHaveLength(3);

      const updatedTasks = [...sampleTasks, {
        id: 'task-4',
        time: '20:00',
        title: 'Evening Task',
        priority: 'low' as const,
        createdAt: Date.now() + 1000
      }];

      rerender(<TaskList tasks={updatedTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getAllByRole('listitem')).toHaveLength(4);
      expect(screen.getByTestId('task-item-task-4')).toBeInTheDocument();
    });
  });
});