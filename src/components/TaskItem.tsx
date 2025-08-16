import React, { useState, useRef, useEffect } from 'react';
import type { Task, TaskFormData, ValidationError } from '../types';
import { validateAndSanitizeTaskFormData, formatTimeForDisplay } from '../utils';
import './TaskItem.css';

interface TaskItemProps {
  task: Task;
  onEdit: (id: string, taskData: TaskFormData) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    time: task.time,
    title: task.title,
    priority: task.priority
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editFormRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management for editing
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  // Focus management for delete confirmation
  useEffect(() => {
    if (showDeleteConfirm && deleteButtonRef.current) {
      deleteButtonRef.current.focus();
    }
  }, [showDeleteConfirm]);

  const handleEditClick = () => {
    setFormData({
      time: task.time,
      title: task.title,
      priority: task.priority
    });
    setErrors([]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      time: task.time,
      title: task.title,
      priority: task.priority
    });
    setErrors([]);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validation = validateAndSanitizeTaskFormData(formData);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      await onEdit(task.id, validation.sanitizedData);
      setIsEditing(false);
      setErrors([]);
    } catch (error) {
      setErrors([{ field: 'general', message: 'Failed to save task. Please try again.' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await onDelete(task.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Error handling is done in the parent component
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Escape') {
        handleCancelEdit();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        handleSaveEdit(e as any);
      }
    } else if (showDeleteConfirm) {
      if (e.key === 'Escape') {
        handleCancelDelete();
      }
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const getPriorityClass = (priority?: string): string => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-none';
    }
  };

  const formatDisplayTime = (time: string): string => {
    try {
      return formatTimeForDisplay(time);
    } catch {
      return time; // Fallback to original time if formatting fails
    }
  };

  if (isEditing) {
    return (
      <li className="task-item task-item--editing" onKeyDown={handleKeyDown}>
        <form 
          ref={editFormRef}
          onSubmit={handleSaveEdit}
          className="task-edit-form"
          aria-label={`Edit task: ${task.title}`}
          role="form"
          noValidate
        >
          <div className="task-edit-form__fields">
            <div className="form-field">
              <label htmlFor={`time-${task.id}`} className="form-field__label">
                Time
              </label>
              <input
                id={`time-${task.id}`}
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={`form-field__input ${getFieldError('time') ? 'form-field__input--error' : ''}`}
                placeholder="9:30 AM or 21:30"
                aria-describedby={getFieldError('time') ? `time-error-${task.id}` : undefined}
                disabled={isSubmitting}
              />
              {getFieldError('time') && (
                <div id={`time-error-${task.id}`} className="form-field__error" role="alert">
                  {getFieldError('time')}
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor={`title-${task.id}`} className="form-field__label">
                Title
              </label>
              <input
                id={`title-${task.id}`}
                ref={titleInputRef}
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`form-field__input ${getFieldError('title') ? 'form-field__input--error' : ''}`}
                placeholder="Task title"
                aria-describedby={getFieldError('title') ? `title-error-${task.id}` : undefined}
                disabled={isSubmitting}
                required
              />
              {getFieldError('title') && (
                <div id={`title-error-${task.id}`} className="form-field__error" role="alert">
                  {getFieldError('title')}
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor={`priority-${task.id}`} className="form-field__label">
                Priority
              </label>
              <select
                id={`priority-${task.id}`}
                value={formData.priority || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  priority: e.target.value as 'low' | 'medium' | 'high' | undefined 
                })}
                className="form-field__select"
                disabled={isSubmitting}
              >
                <option value="">No priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {getFieldError('general') && (
            <div className="form-field__error" role="alert">
              {getFieldError('general')}
            </div>
          )}

          <div className="task-edit-form__actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
              aria-label="Save changes"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="btn btn--secondary"
              disabled={isSubmitting}
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </div>
          
          <div className="task-edit-form__help">
            <small>Press Ctrl+Enter to save, Escape to cancel</small>
          </div>
        </form>
      </li>
    );
  }

  if (showDeleteConfirm) {
    return (
      <li className="task-item task-item--delete-confirm" onKeyDown={handleKeyDown}>
        <div 
          className="task-delete-confirm" 
          role="dialog" 
          aria-labelledby={`delete-title-${task.id}`}
          aria-describedby={`delete-message-${task.id}`}
          aria-modal="true"
        >
          <div className="task-delete-confirm__content">
            <h3 id={`delete-title-${task.id}`} className="task-delete-confirm__title">
              Delete Task?
            </h3>
            <p id={`delete-message-${task.id}`} className="task-delete-confirm__message">
              Are you sure you want to delete "{task.title}" at {formatDisplayTime(task.time)}? 
              This action cannot be undone.
            </p>
            <div className="task-delete-confirm__actions">
              <button
                ref={deleteButtonRef}
                onClick={handleConfirmDelete}
                className="btn btn--danger"
                aria-label={`Confirm delete task: ${task.title}`}
              >
                Delete
              </button>
              <button
                onClick={handleCancelDelete}
                className="btn btn--secondary"
                aria-label="Cancel delete"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li 
      className={`task-item ${getPriorityClass(task.priority)}`}
      role="article"
      aria-labelledby={`task-title-${task.id}`}
      aria-describedby={`task-time-${task.id} ${task.priority ? `task-priority-${task.id}` : ''}`}
    >
      <div className="task-item__content">
        <div className="task-item__time">
          <time 
            id={`task-time-${task.id}`}
            dateTime={task.time} 
            className="task-time"
            aria-label={`Scheduled for ${formatDisplayTime(task.time)}`}
          >
            {formatDisplayTime(task.time)}
          </time>
        </div>
        
        <div className="task-item__details">
          <h3 id={`task-title-${task.id}`} className="task-item__title">{task.title}</h3>
          {task.priority && (
            <span 
              id={`task-priority-${task.id}`}
              className={`task-item__priority priority-badge priority-badge--${task.priority}`}
              aria-label={`Priority: ${task.priority}`}
              role="status"
            >
              {task.priority}
            </span>
          )}
        </div>

        <div className="task-item__actions" role="group" aria-label="Task actions">
          <button
            onClick={handleEditClick}
            className="btn btn--icon"
            aria-label={`Edit task: ${task.title}`}
            title="Edit task"
            type="button"
          >
            <span className="icon-edit" aria-hidden="true">✏️</span>
            <span className="sr-only">Edit</span>
          </button>
          <button
            onClick={handleDeleteClick}
            className="btn btn--icon btn--danger"
            aria-label={`Delete task: ${task.title}`}
            title="Delete task"
            type="button"
          >
            <span className="icon-delete" aria-hidden="true">🗑️</span>
            <span className="sr-only">Delete</span>
          </button>
        </div>
      </div>
    </li>
  );
};

export default TaskItem;