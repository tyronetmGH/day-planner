import { describe, it, expect } from 'vitest';
import { parseTime, isValidTimeFormat, formatTimeForDisplay } from './timeUtils';

describe('parseTime', () => {
  describe('valid inputs', () => {
    it('should parse 24-hour format with leading zeros', () => {
      const result = parseTime('09:30');
      expect(result.success).toBe(true);
      expect(result.time).toBe('09:30');
      expect(result.error).toBeUndefined();
    });

    it('should parse 24-hour format without leading zeros', () => {
      const result = parseTime('9:30');
      expect(result.success).toBe(true);
      expect(result.time).toBe('09:30');
    });

    it('should parse AM format', () => {
      const result = parseTime('9:30 AM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('09:30');
    });

    it('should parse PM format', () => {
      const result = parseTime('9:30 PM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('21:30');
    });

    it('should parse 12:00 AM as midnight', () => {
      const result = parseTime('12:00 AM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('00:00');
    });

    it('should parse 12:00 PM as noon', () => {
      const result = parseTime('12:00 PM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('12:00');
    });

    it('should parse case-insensitive AM/PM', () => {
      expect(parseTime('9:30 am').time).toBe('09:30');
      expect(parseTime('9:30 pm').time).toBe('21:30');
      expect(parseTime('9:30 Am').time).toBe('09:30');
      expect(parseTime('9:30 Pm').time).toBe('21:30');
    });

    it('should parse AM/PM format with or without space', () => {
      expect(parseTime('9:30AM').time).toBe('09:30');
      expect(parseTime('9:30PM').time).toBe('21:30');
      expect(parseTime('9:30 AM').time).toBe('09:30');
      expect(parseTime('9:30 PM').time).toBe('21:30');
    });

    it('should handle edge times correctly', () => {
      expect(parseTime('00:00').time).toBe('00:00');
      expect(parseTime('23:59').time).toBe('23:59');
      expect(parseTime('1:00 AM').time).toBe('01:00');
      expect(parseTime('11:59 PM').time).toBe('23:59');
    });

    it('should handle whitespace around input', () => {
      expect(parseTime('  9:30  ').time).toBe('09:30');
      expect(parseTime('  9:30 AM  ').time).toBe('09:30');
    });
  });

  describe('invalid inputs', () => {
    it('should reject null or undefined input', () => {
      expect(parseTime(null as any).success).toBe(false);
      expect(parseTime(undefined as any).success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = parseTime('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Time is required');
    });

    it('should reject whitespace-only string', () => {
      const result = parseTime('   ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Time is required');
    });

    it('should reject invalid hour in 24-hour format', () => {
      expect(parseTime('24:00').success).toBe(false);
      expect(parseTime('-1:00').success).toBe(false);
      expect(parseTime('25:30').success).toBe(false);
    });

    it('should reject invalid minutes', () => {
      expect(parseTime('09:60').success).toBe(false);
      expect(parseTime('09:-1').success).toBe(false);
      expect(parseTime('09:99').success).toBe(false);
    });

    it('should reject invalid hour in AM/PM format', () => {
      expect(parseTime('0:30 AM').success).toBe(false);
      expect(parseTime('13:30 AM').success).toBe(false);
      expect(parseTime('0:30 PM').success).toBe(false);
    });

    it('should reject malformed time strings', () => {
      expect(parseTime('9').success).toBe(false);
      expect(parseTime('9:').success).toBe(false);
      expect(parseTime(':30').success).toBe(false);
      expect(parseTime('9:3').success).toBe(false);
      expect(parseTime('abc:def').success).toBe(false);
      expect(parseTime('9:30:00').success).toBe(false);
    });

    it('should reject invalid AM/PM format', () => {
      expect(parseTime('9:30 XM').success).toBe(false);
      expect(parseTime('9:30 A').success).toBe(false);
    });

    it('should provide helpful error messages', () => {
      expect(parseTime('25:00').error).toContain('Hour must be between 00 and 23');
      expect(parseTime('09:60').error).toContain('Minutes must be between 00 and 59');
      expect(parseTime('13:30 AM').error).toContain('Hour must be between 1 and 12');
      expect(parseTime('invalid').error).toContain('Invalid time format');
    });
  });
});

describe('isValidTimeFormat', () => {
  it('should return true for valid normalized time format', () => {
    expect(isValidTimeFormat('09:30')).toBe(true);
    expect(isValidTimeFormat('00:00')).toBe(true);
    expect(isValidTimeFormat('23:59')).toBe(true);
  });

  it('should return false for non-normalized formats', () => {
    expect(isValidTimeFormat('9:30')).toBe(false); // Missing leading zero
    expect(isValidTimeFormat('9:30 AM')).toBe(false); // AM/PM format
  });

  it('should return false for invalid inputs', () => {
    expect(isValidTimeFormat('')).toBe(false);
    expect(isValidTimeFormat('invalid')).toBe(false);
    expect(isValidTimeFormat('24:00')).toBe(false);
    expect(isValidTimeFormat(null as any)).toBe(false);
  });
});

describe('formatTimeForDisplay', () => {
  it('should format morning times correctly', () => {
    expect(formatTimeForDisplay('00:00')).toBe('12:00 AM');
    expect(formatTimeForDisplay('01:30')).toBe('1:30 AM');
    expect(formatTimeForDisplay('09:15')).toBe('9:15 AM');
    expect(formatTimeForDisplay('11:59')).toBe('11:59 AM');
  });

  it('should format afternoon/evening times correctly', () => {
    expect(formatTimeForDisplay('12:00')).toBe('12:00 PM');
    expect(formatTimeForDisplay('13:30')).toBe('1:30 PM');
    expect(formatTimeForDisplay('18:45')).toBe('6:45 PM');
    expect(formatTimeForDisplay('23:59')).toBe('11:59 PM');
  });

  it('should handle invalid input gracefully', () => {
    expect(formatTimeForDisplay('invalid')).toBe('invalid');
    expect(formatTimeForDisplay('25:00')).toBe('25:00');
    expect(formatTimeForDisplay('')).toBe('');
  });

  it('should preserve minutes with leading zeros', () => {
    expect(formatTimeForDisplay('09:05')).toBe('9:05 AM');
    expect(formatTimeForDisplay('15:01')).toBe('3:01 PM');
  });
});