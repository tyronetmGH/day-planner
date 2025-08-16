/**
 * Time parsing and validation utilities for the Day Planner application
 */

export interface TimeParseResult {
  success: boolean;
  time?: string; // Normalized 24-hour format "HH:MM"
  error?: string;
}

/**
 * Parses various time input formats and normalizes to 24-hour format
 * Supports: "9:30", "09:30", "9:30 AM", "9:30 PM", "21:30"
 */
export function parseTime(input: string): TimeParseResult {
  if (!input || typeof input !== 'string') {
    return {
      success: false,
      error: 'Time is required'
    };
  }

  const trimmedInput = input.trim();
  
  if (trimmedInput === '') {
    return {
      success: false,
      error: 'Time is required'
    };
  }

  // Check for AM/PM format (with optional space)
  const amPmMatch = trimmedInput.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (amPmMatch) {
    const [, hourStr, minuteStr, period] = amPmMatch;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Validate hour and minute ranges
    if (hour < 1 || hour > 12) {
      return {
        success: false,
        error: 'Hour must be between 1 and 12 for AM/PM format'
      };
    }

    if (minute < 0 || minute > 59) {
      return {
        success: false,
        error: 'Minutes must be between 00 and 59'
      };
    }

    // Convert to 24-hour format
    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    return {
      success: true,
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    };
  }

  // Check for 24-hour format
  const twentyFourHourMatch = trimmedInput.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const [, hourStr, minuteStr] = twentyFourHourMatch;
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Validate hour and minute ranges
    if (hour < 0 || hour > 23) {
      return {
        success: false,
        error: 'Hour must be between 00 and 23 for 24-hour format'
      };
    }

    if (minute < 0 || minute > 59) {
      return {
        success: false,
        error: 'Minutes must be between 00 and 59'
      };
    }

    return {
      success: true,
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    };
  }

  return {
    success: false,
    error: 'Invalid time format. Use formats like "9:30", "09:30", "9:30 AM", or "21:30"'
  };
}

/**
 * Validates if a time string is in the correct normalized format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  if (!time || typeof time !== 'string') {
    return false;
  }

  const result = parseTime(time);
  return result.success && result.time === time;
}

/**
 * Formats a 24-hour time string to a user-friendly 12-hour format
 */
export function formatTimeForDisplay(time: string): string {
  if (!isValidTimeFormat(time)) {
    return time; // Return as-is if invalid
  }

  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}