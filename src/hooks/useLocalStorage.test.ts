import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock console.error to avoid noise in tests
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  describe('initial value handling', () => {
    it('should return initial value when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      expect(result.current[0]).toBe('initial');
      expect(result.current[2]).toBe(null); // no error
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should return stored value when localStorage has valid data', () => {
      const storedData = { name: 'test', value: 42 };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));
      
      const { result } = renderHook(() => useLocalStorage('test-key', {}));
      
      expect(result.current[0]).toEqual(storedData);
      expect(result.current[2]).toBe(null); // no error
    });

    it('should handle arrays correctly', () => {
      const storedArray = [1, 2, 3, 'test'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedArray));
      
      const { result } = renderHook(() => useLocalStorage('test-key', []));
      
      expect(result.current[0]).toEqual(storedArray);
      expect(result.current[2]).toBe(null);
    });
  });

  describe('corrupted data handling', () => {
    it('should handle corrupted JSON data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json{');
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
      
      expect(result.current[0]).toBe('fallback');
      expect(result.current[2]).toBe('Data was corrupted and has been reset');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle localStorage access errors during corruption cleanup', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json{');
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Access denied');
      });
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
      
      expect(result.current[0]).toBe('fallback');
      expect(result.current[2]).toBe('Unable to access localStorage');
    });
  });

  describe('setValue functionality', () => {
    it('should save value to localStorage successfully', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[1]('new-value');
      });
      
      expect(result.current[0]).toBe('new-value');
      expect(result.current[2]).toBe(null); // no error
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"new-value"');
    });

    it('should save complex objects correctly', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useLocalStorage('test-key', {}));
      const complexObject = { id: 1, data: [1, 2, 3], nested: { value: true } };
      
      act(() => {
        result.current[1](complexObject);
      });
      
      expect(result.current[0]).toEqual(complexObject);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key', 
        JSON.stringify(complexObject)
      );
    });
  });

  describe('error handling during save', () => {
    it('should handle quota exceeded error', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[1]('new-value');
      });
      
      expect(result.current[0]).toBe('new-value'); // Still updates in-memory
      expect(result.current[2]).toBe('Storage quota exceeded. Please clear some data.');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle quota exceeded error by message content', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const quotaError = new Error('Storage quota has been exceeded');
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[1]('new-value');
      });
      
      expect(result.current[2]).toBe('Storage quota exceeded. Please clear some data.');
    });

    it('should handle access denied errors', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const accessError = new Error('Access denied to localStorage');
      localStorageMock.setItem.mockImplementation(() => {
        throw accessError;
      });
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[1]('new-value');
      });
      
      expect(result.current[0]).toBe('new-value');
      expect(result.current[2]).toBe('Unable to access localStorage. Data will not persist.');
    });

    it('should handle generic localStorage errors', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const genericError = new Error('Some other error');
      localStorageMock.setItem.mockImplementation(() => {
        throw genericError;
      });
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[1]('new-value');
      });
      
      expect(result.current[2]).toBe('Failed to save data to localStorage');
    });

    it('should handle non-Error exceptions', () => {
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockImplementation(() => {
        throw 'String error';
      });
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[1]('new-value');
      });
      
      expect(result.current[2]).toBe('Unknown error occurred while saving data');
    });
  });

  describe('error clearing', () => {
    it('should clear error on successful save after previous error', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      // First, cause an error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      
      act(() => {
        result.current[1]('error-value');
      });
      
      expect(result.current[2]).toBe('Failed to save data to localStorage');
      
      // Then, make it succeed
      localStorageMock.setItem.mockImplementation(() => {});
      
      act(() => {
        result.current[1]('success-value');
      });
      
      expect(result.current[2]).toBe(null); // Error should be cleared
    });
  });

  describe('key changes', () => {
    it('should reload data when key changes', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('"value1"')
        .mockReturnValueOnce('"value2"');
      
      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage(key, 'default'),
        { initialProps: { key: 'key1' } }
      );
      
      expect(result.current[0]).toBe('value1');
      
      rerender({ key: 'key2' });
      
      expect(result.current[0]).toBe('value2');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('key1');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('key2');
    });
  });
});