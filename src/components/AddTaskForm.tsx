import React, { useState } from 'react';
import type { TaskFormData, ValidationError } from '../types';
import { validateAndSanitizeTaskFormData } from '../utils';
import './AddTaskForm.css';

interface AddTaskFormProps {
  onAdd: (taskData: TaskFormData) => Promise<void> | void;
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAdd }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    time: '',
    title: '',
    priority: undefined
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validation = validateAndSanitizeTaskFormData(formData);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      await onAdd(validation.sanitizedData);
      
      // Reset form after successful submission
      setFormData({
        time: '',
        title: '',
        priority: undefined
      });
      setErrors([]);
    } catch (error) {
      setErrors([{ field: 'general', message: 'Failed to add task. Please try again.' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Clear form on Escape
      setFormData({
        time: '',
        title: '',
        priority: undefined
      });
      setErrors([]);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  return (
    <form 
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="add-task-form"
      aria-label="Add new task"
      role="form"
      noValidate
    >
      <div className="add-task-form__fields">
        <div className="form-field">
          <label htmlFor="add-time" className="form-field__label">
            Time
          </label>
          <input
            id="add-time"
            type="text"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className={`form-field__input ${getFieldError('time') ? 'form-field__input--error' : ''}`}
            placeholder="9:30 AM or 21:30"
            aria-describedby={getFieldError('time') ? 'add-time-error add-time-help' : 'add-time-help'}
            aria-invalid={getFieldError('time') ? 'true' : 'false'}
            disabled={isSubmitting}
            autoComplete="off"
          />
          <div id="add-time-help" className="sr-only">
            Enter time in formats like 9:30 AM, 21:30, or 9:30
          </div>
          {getFieldError('time') && (
            <div id="add-time-error" className="form-field__error" role="alert">
              {getFieldError('time')}
            </div>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="add-title" className="form-field__label">
            Title
          </label>
          <input
            id="add-title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`form-field__input ${getFieldError('title') ? 'form-field__input--error' : ''}`}
            placeholder="Task title"
            aria-describedby={getFieldError('title') ? 'add-title-error add-title-help' : 'add-title-help'}
            aria-invalid={getFieldError('title') ? 'true' : 'false'}
            disabled={isSubmitting}
            required
            autoComplete="off"
            maxLength={200}
          />
          <div id="add-title-help" className="sr-only">
            Enter a descriptive title for your task (maximum 200 characters)
          </div>
          {getFieldError('title') && (
            <div id="add-title-error" className="form-field__error" role="alert">
              {getFieldError('title')}
            </div>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="add-priority" className="form-field__label">
            Priority
          </label>
          <select
            id="add-priority"
            value={formData.priority || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              priority: e.target.value as 'low' | 'medium' | 'high' | undefined || undefined
            })}
            className="form-field__select"
            disabled={isSubmitting}
            aria-describedby="add-priority-help"
          >
            <option value="">No priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <div id="add-priority-help" className="sr-only">
            Optional: Select task priority level
          </div>
        </div>

        <div className="form-field form-field--submit">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isSubmitting}
            aria-label={isSubmitting ? 'Adding task, please wait' : 'Add task to your schedule'}
            aria-describedby="add-form-help"
          >
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </div>

      {getFieldError('general') && (
        <div className="form-field__error" role="alert">
          {getFieldError('general')}
        </div>
      )}

      <div id="add-form-help" className="add-task-form__help">
        <small>Press Escape to clear form • Use Tab to navigate between fields</small>
      </div>
    </form>
  );
};

export default AddTaskForm;