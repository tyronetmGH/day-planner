import { describe, it, expect } from 'vitest';
import {
  validateTaskFormData,
  validateTimeField,
  validateTitleField,
  validatePriorityField,
  isValidTaskFormData,
  sanitizeTaskFormData,
  validateAndSanitizeTaskFormData,
  getErrorMessage,
  getErrorsByField,
  hasFieldError
} from './validationUtils';
import { TaskFormData } from '../types';

describe('validateTimeField', () => {
  it('should return no errors for valid time formats', () => {
    expect(validateTimeField('09:30')).toEqual([]);
    expect(validateTimeField('9:30')).toEqual([]);
    expect(validateTimeField('9:30 AM')).toEqual([]);
    expect(validateTimeField('9:30 PM')).toEqual([]);
    expect(validateTimeField('21:30')).toEqual([]);
  });

  it('should return error for empty or missing time', () => {
    expect(validateTimeField('')).toEqual([
      { field: 'time', message: 'Time is required' }
    ]);
    expect(validateTimeField('   ')).toEqual([
      { field: 'time', message: 'Time is required' }
    ]);
    expect(validateTimeField(null as any)).toEqual([
      { field: 'time', message: 'Time is required' }
    ]);
    expect(validateTimeField(undefined as any)).toEqual([
      { field: 'time', message: 'Time is required' }
    ]);
  });

  it('should return error for invalid time formats', () => {
    const result = validateTimeField('invalid');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('time');
    expect(result[0].message).toContain('Invalid time format');
  });

  it('should return error for out-of-range times', () => {
    const result = validateTimeField('25:00');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('time');
    expect(result[0].message).toContain('Hour must be between 00 and 23');
  });
});

describe('validateTitleField', () => {
  it('should return no errors for valid titles', () => {
    expect(validateTitleField('Valid title')).toEqual([]);
    expect(validateTitleField('A')).toEqual([]);
    expect(validateTitleField('A'.repeat(200))).toEqual([]);
  });

  it('should return error for empty or missing title', () => {
    expect(validateTitleField('')).toEqual([
      { field: 'title', message: 'Title cannot be empty' }
    ]);
    expect(validateTitleField('   ')).toEqual([
      { field: 'title', message: 'Title cannot be empty' }
    ]);
    expect(validateTitleField(null as any)).toEqual([
      { field: 'title', message: 'Title is required' }
    ]);
    expect(validateTitleField(undefined as any)).toEqual([
      { field: 'title', message: 'Title is required' }
    ]);
  });

  it('should return error for title that is too long', () => {
    const longTitle = 'A'.repeat(201);
    const result = validateTitleField(longTitle);
    expect(result).toEqual([
      { field: 'title', message: 'Title must be 200 characters or less' }
    ]);
  });
});

describe('validatePriorityField', () => {
  it('should return no errors for valid priorities', () => {
    expect(validatePriorityField('low')).toEqual([]);
    expect(validatePriorityField('medium')).toEqual([]);
    expect(validatePriorityField('high')).toEqual([]);
    expect(validatePriorityField(undefined)).toEqual([]);
    expect(validatePriorityField(null as any)).toEqual([]);
  });

  it('should return error for invalid priority values', () => {
    expect(validatePriorityField('invalid' as any)).toEqual([
      { field: 'priority', message: 'Priority must be one of: low, medium, high' }
    ]);
    expect(validatePriorityField('HIGH' as any)).toEqual([
      { field: 'priority', message: 'Priority must be one of: low, medium, high' }
    ]);
  });
});

describe('validateTaskFormData', () => {
  it('should return no errors for valid form data', () => {
    const validData: TaskFormData = {
      time: '09:30',
      title: 'Valid task',
      priority: 'medium'
    };
    expect(validateTaskFormData(validData)).toEqual([]);
  });

  it('should return no errors for valid form data without priority', () => {
    const validData: TaskFormData = {
      time: '09:30',
      title: 'Valid task'
    };
    expect(validateTaskFormData(validData)).toEqual([]);
  });

  it('should return multiple errors for invalid form data', () => {
    const invalidData: TaskFormData = {
      time: '',
      title: '',
      priority: 'invalid' as any
    };
    const errors = validateTaskFormData(invalidData);
    expect(errors).toHaveLength(3);
    expect(errors.some(e => e.field === 'time')).toBe(true);
    expect(errors.some(e => e.field === 'title')).toBe(true);
    expect(errors.some(e => e.field === 'priority')).toBe(true);
  });

  it('should validate all fields independently', () => {
    const invalidData: TaskFormData = {
      time: '25:00', // Invalid time
      title: 'A'.repeat(201), // Too long
      priority: 'extreme' as any // Invalid priority
    };
    const errors = validateTaskFormData(invalidData);
    expect(errors).toHaveLength(3);
  });
});

describe('isValidTaskFormData', () => {
  it('should return true for valid form data', () => {
    const validData: TaskFormData = {
      time: '09:30',
      title: 'Valid task',
      priority: 'medium'
    };
    expect(isValidTaskFormData(validData)).toBe(true);
  });

  it('should return false for invalid form data', () => {
    const invalidData: TaskFormData = {
      time: '',
      title: 'Valid task'
    };
    expect(isValidTaskFormData(invalidData)).toBe(false);
  });
});

describe('sanitizeTaskFormData', () => {
  it('should trim whitespace from string fields', () => {
    const data: TaskFormData = {
      time: '  09:30  ',
      title: '  Task title  ',
      priority: 'medium'
    };
    const sanitized = sanitizeTaskFormData(data);
    expect(sanitized.time).toBe('09:30');
    expect(sanitized.title).toBe('Task title');
    expect(sanitized.priority).toBe('medium');
  });

  it('should normalize time format', () => {
    const data: TaskFormData = {
      time: '9:30 AM',
      title: 'Task title'
    };
    const sanitized = sanitizeTaskFormData(data);
    expect(sanitized.time).toBe('09:30'); // Normalized to 24-hour format
  });

  it('should handle invalid time gracefully', () => {
    const data: TaskFormData = {
      time: 'invalid',
      title: 'Task title'
    };
    const sanitized = sanitizeTaskFormData(data);
    expect(sanitized.time).toBe('invalid'); // Keeps original if invalid
  });

  it('should handle non-string values gracefully', () => {
    const data: TaskFormData = {
      time: null as any,
      title: undefined as any,
      priority: 'low'
    };
    const sanitized = sanitizeTaskFormData(data);
    expect(sanitized.time).toBe('');
    expect(sanitized.title).toBe('');
    expect(sanitized.priority).toBe('low');
  });
});

describe('validateAndSanitizeTaskFormData', () => {
  it('should sanitize and validate in one step', () => {
    const data: TaskFormData = {
      time: '  9:30 AM  ',
      title: '  Task title  ',
      priority: 'medium'
    };
    const result = validateAndSanitizeTaskFormData(data);
    
    expect(result.sanitizedData.time).toBe('09:30');
    expect(result.sanitizedData.title).toBe('Task title');
    expect(result.errors).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it('should return errors for invalid data after sanitization', () => {
    const data: TaskFormData = {
      time: '  invalid  ',
      title: '   ',
      priority: 'medium'
    };
    const result = validateAndSanitizeTaskFormData(data);
    
    expect(result.sanitizedData.time).toBe('invalid');
    expect(result.sanitizedData.title).toBe('');
    expect(result.errors).toHaveLength(2);
    expect(result.isValid).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('should return error message for specified field', () => {
    const errors = [
      { field: 'time', message: 'Time is required' },
      { field: 'title', message: 'Title is required' }
    ];
    expect(getErrorMessage(errors, 'time')).toBe('Time is required');
    expect(getErrorMessage(errors, 'title')).toBe('Title is required');
  });

  it('should return null for field with no errors', () => {
    const errors = [
      { field: 'time', message: 'Time is required' }
    ];
    expect(getErrorMessage(errors, 'title')).toBeNull();
    expect(getErrorMessage(errors, 'priority')).toBeNull();
  });

  it('should return first error message if multiple errors for same field', () => {
    const errors = [
      { field: 'title', message: 'Title is required' },
      { field: 'title', message: 'Title is too long' }
    ];
    expect(getErrorMessage(errors, 'title')).toBe('Title is required');
  });
});

describe('getErrorsByField', () => {
  it('should group errors by field', () => {
    const errors = [
      { field: 'time', message: 'Time is required' },
      { field: 'title', message: 'Title is required' },
      { field: 'title', message: 'Title is too long' }
    ];
    const grouped = getErrorsByField(errors);
    
    expect(grouped.time).toEqual(['Time is required']);
    expect(grouped.title).toEqual(['Title is required', 'Title is too long']);
  });

  it('should return empty object for no errors', () => {
    expect(getErrorsByField([])).toEqual({});
  });
});

describe('hasFieldError', () => {
  it('should return true if field has errors', () => {
    const errors = [
      { field: 'time', message: 'Time is required' },
      { field: 'title', message: 'Title is required' }
    ];
    expect(hasFieldError(errors, 'time')).toBe(true);
    expect(hasFieldError(errors, 'title')).toBe(true);
  });

  it('should return false if field has no errors', () => {
    const errors = [
      { field: 'time', message: 'Time is required' }
    ];
    expect(hasFieldError(errors, 'title')).toBe(false);
    expect(hasFieldError(errors, 'priority')).toBe(false);
  });

  it('should return false for empty error array', () => {
    expect(hasFieldError([], 'time')).toBe(false);
  });
});