/**
 * Validation utilities for the Day Planner application
 */

import type { TaskFormData, ValidationError, Priority } from '../types';
import { parseTime } from './timeUtils';

/**
 * Validates task form data and returns validation errors
 */
export function validateTaskFormData(formData: TaskFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate time field
  const timeErrors = validateTimeField(formData.time);
  errors.push(...timeErrors);

  // Validate title field
  const titleErrors = validateTitleField(formData.title);
  errors.push(...titleErrors);

  // Validate priority field (optional)
  const priorityErrors = validatePriorityField(formData.priority);
  errors.push(...priorityErrors);

  return errors;
}

/**
 * Validates the time field
 */
export function validateTimeField(time: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if time is provided
  if (!time || typeof time !== 'string' || time.trim() === '') {
    errors.push({
      field: 'time',
      message: 'Time is required'
    });
    return errors;
  }

  // Validate time format using parseTime utility
  const parseResult = parseTime(time);
  if (!parseResult.success) {
    errors.push({
      field: 'time',
      message: parseResult.error || 'Invalid time format'
    });
  }

  return errors;
}

/**
 * Validates the title field
 */
export function validateTitleField(title: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if title is provided and is a string
  if (typeof title !== 'string') {
    errors.push({
      field: 'title',
      message: 'Title is required'
    });
    return errors;
  }

  const trimmedTitle = title.trim();

  // Check if title is empty after trimming
  if (trimmedTitle === '') {
    errors.push({
      field: 'title',
      message: 'Title cannot be empty'
    });
    return errors;
  }

  // Check title length constraints
  if (trimmedTitle.length > 200) {
    errors.push({
      field: 'title',
      message: 'Title must be 200 characters or less'
    });
  }

  if (trimmedTitle.length < 1) {
    errors.push({
      field: 'title',
      message: 'Title must be at least 1 character long'
    });
  }

  return errors;
}

/**
 * Validates the priority field (optional)
 */
export function validatePriorityField(priority?: Priority): ValidationError[] {
  const errors: ValidationError[] = [];

  // Priority is optional, so undefined is valid
  if (priority === undefined || priority === null) {
    return errors;
  }

  // Check if priority is a valid value
  const validPriorities: Priority[] = ['low', 'medium', 'high'];
  if (!validPriorities.includes(priority)) {
    errors.push({
      field: 'priority',
      message: 'Priority must be one of: low, medium, high'
    });
  }

  return errors;
}

/**
 * Checks if task form data is valid (has no validation errors)
 */
export function isValidTaskFormData(formData: TaskFormData): boolean {
  const errors = validateTaskFormData(formData);
  return errors.length === 0;
}

/**
 * Sanitizes task form data by trimming strings and normalizing values
 */
export function sanitizeTaskFormData(formData: TaskFormData): TaskFormData {
  const sanitized: TaskFormData = {
    time: typeof formData.time === 'string' ? formData.time.trim() : '',
    title: typeof formData.title === 'string' ? formData.title.trim() : '',
    priority: formData.priority
  };

  // Normalize time format if valid
  const timeParseResult = parseTime(sanitized.time);
  if (timeParseResult.success && timeParseResult.time) {
    sanitized.time = timeParseResult.time;
  }

  return sanitized;
}

/**
 * Validates and sanitizes task form data in one step
 */
export function validateAndSanitizeTaskFormData(formData: TaskFormData): {
  sanitizedData: TaskFormData;
  errors: ValidationError[];
  isValid: boolean;
} {
  const sanitizedData = sanitizeTaskFormData(formData);
  const errors = validateTaskFormData(sanitizedData);
  const isValid = errors.length === 0;

  return {
    sanitizedData,
    errors,
    isValid
  };
}

/**
 * Gets user-friendly error messages for display
 */
export function getErrorMessage(errors: ValidationError[], field: string): string | null {
  const fieldError = errors.find(error => error.field === field);
  return fieldError ? fieldError.message : null;
}

/**
 * Gets all error messages grouped by field
 */
export function getErrorsByField(errors: ValidationError[]): Record<string, string[]> {
  return errors.reduce((grouped, error) => {
    if (!grouped[error.field]) {
      grouped[error.field] = [];
    }
    grouped[error.field].push(error.message);
    return grouped;
  }, {} as Record<string, string[]>);
}

/**
 * Checks if there are any errors for a specific field
 */
export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some(error => error.field === field);
}