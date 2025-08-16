import React from 'react';
import type { Task, TaskFormData } from '../types';
import { TaskItem } from './TaskItem';
import './TaskList.css';

interface TaskListProps {
  tasks: Task[];
  onEdit: (id: string, taskData: TaskFormData) => void;
  onDelete: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, onDelete }) => {
  // Handle empty state
  if (tasks.length === 0) {
    return (
      <div 
        className="task-list task-list--empty" 
        role="region" 
        aria-label="Task list"
        aria-describedby="empty-state-message"
      >
        <div className="task-list__empty-state">
          <div className="empty-state">
            <div className="empty-state__icon" aria-hidden="true">
              📝
            </div>
            <h2 className="empty-state__title" id="empty-state-title">No tasks yet</h2>
            <p className="empty-state__message" id="empty-state-message">
              Add your first task above to get started with your daily planning.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="task-list" 
      role="region" 
      aria-label="Task list"
      aria-describedby="task-count-info"
    >
      <div id="task-count-info" className="sr-only">
        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} in your schedule
      </div>
      <ul 
        className="task-list__items" 
        role="list"
        aria-label={`${tasks.length} scheduled ${tasks.length === 1 ? 'task' : 'tasks'}`}
      >
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
};

export default TaskList;