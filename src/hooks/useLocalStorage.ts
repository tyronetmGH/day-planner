import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing localStorage with JSON serialization and error handling
 * @param key - The localStorage key
 * @param initialValue - The initial value to use if no stored value exists
 * @returns [value, setValue, error] - The current value, setter function, and any error
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, string | null] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  // Load initial value from localStorage
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedValue = JSON.parse(item);
        setStoredValue(parsedValue);
        setError(null);
      }
    } catch (err) {
      console.error(`Error loading from localStorage key "${key}":`, err);
      // Handle corrupted data by clearing it and using initial value
      try {
        window.localStorage.removeItem(key);
        setError('Data was corrupted and has been reset');
      } catch (clearErr) {
        setError('Unable to access localStorage');
      }
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  // Function to save value to localStorage
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
      setError(null);
    } catch (err) {
      console.error(`Error saving to localStorage key "${key}":`, err);
      
      // Handle different types of localStorage errors
      if (err instanceof Error) {
        if (err.name === 'QuotaExceededError' || err.message.includes('quota')) {
          setError('Storage quota exceeded. Please clear some data.');
        } else if (err.message.includes('access')) {
          setError('Unable to access localStorage. Data will not persist.');
        } else {
          setError('Failed to save data to localStorage');
        }
      } else {
        setError('Unknown error occurred while saving data');
      }
      
      // Still update the in-memory state even if localStorage fails
      setStoredValue(value);
    }
  }, [key]);

  return [storedValue, setValue, error];
}