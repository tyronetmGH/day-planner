/**
 * Utility functions for the Day Planner application
 */

// Time utilities
export {
  parseTime,
  isValidTimeFormat,
  formatTimeForDisplay,
  type TimeParseResult
} from './timeUtils';

// Task utilities
export {
  sortTasks,
  groupTasksByTime,
  findTasksWithSameTime,
  isTaskListSorted
} from './taskUtils';

// Validation utilities
export {
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

// Accessibility utilities
export {
  announceToScreenReader,
  FocusManager,
  prefersReducedMotion,
  prefersHighContrast,
  generateAccessibilityId,
  validateColorContrast,
  KeyboardNavigation,
  ScreenReader,
  TouchAccessibility,
  FormAccessibility
} from './accessibilityUtils';