import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToast } from './useToast';

// Mock window.confirm
const mockConfirm = vi.fn();
const mockReload = vi.fn();

Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  removeItem: vi.fn(),
  getItem: vi.fn(),
  setItem: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current.toasts).toEqual([]);
  });

  it('adds info toast with default settings', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.addToast('Test message');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Test message',
      type: 'info'
    });
    expect(result.current.toasts[0].id).toBeDefined();
  });

  it('adds success toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Success message');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Success message',
      type: 'success'
    });
  });

  it('adds error toast with extended duration', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showError('Error message');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Error message',
      type: 'error',
      duration: 7000
    });
  });

  it('adds warning toast with extended duration', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showWarning('Warning message');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Warning message',
      type: 'warning',
      duration: 6000
    });
  });

  it('adds toast with custom duration and action', () => {
    const mockAction = vi.fn();
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.addToast('Custom message', 'info', {
        duration: 3000,
        action: {
          label: 'Retry',
          onClick: mockAction
        }
      });
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Custom message',
      type: 'info',
      duration: 3000,
      action: {
        label: 'Retry',
        onClick: mockAction
      }
    });
  });

  it('dismisses specific toast by id', () => {
    const { result } = renderHook(() => useToast());
    
    let toastId: string;
    act(() => {
      toastId = result.current.addToast('First message');
      result.current.addToast('Second message');
    });
    
    expect(result.current.toasts).toHaveLength(2);
    
    act(() => {
      result.current.dismissToast(toastId);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Second message');
  });

  it('dismisses all toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.addToast('First message');
      result.current.addToast('Second message');
      result.current.addToast('Third message');
    });
    
    expect(result.current.toasts).toHaveLength(3);
    
    act(() => {
      result.current.dismissAllToasts();
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  it('shows storage error for quota exceeded', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showStorageError('Storage quota exceeded');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Storage is full. Some data may not be saved.',
      type: 'error',
      duration: 10000
    });
    expect(result.current.toasts[0].action).toBeDefined();
    expect(result.current.toasts[0].action?.label).toBe('Clear Data');
  });

  it('shows storage error for corrupted data', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showStorageError('Data was corrupted and has been reset');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Your saved data was corrupted and has been reset.',
      type: 'warning',
      duration: 8000
    });
  });

  it('shows storage error for access denied', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showStorageError('Unable to access localStorage');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Cannot access storage. Your tasks will not be saved.',
      type: 'warning',
      duration: 8000
    });
  });

  it('shows generic storage error', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showStorageError('Unknown storage error');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Unknown storage error',
      type: 'error',
      duration: 6000
    });
  });

  it('shows task success messages', () => {
    const { result } = renderHook(() => useToast());
    
    const actions = [
      { action: 'added', expected: 'Task "Test Task" added successfully' },
      { action: 'updated', expected: 'Task "Test Task" updated successfully' },
      { action: 'deleted', expected: 'Task "Test Task" deleted' },
      { action: 'cleared', expected: 'All tasks cleared successfully' }
    ];
    
    actions.forEach(({ action, expected }, index) => {
      act(() => {
        result.current.showTaskSuccess(action, action !== 'cleared' ? 'Test Task' : undefined);
      });
      
      expect(result.current.toasts[index]).toMatchObject({
        message: expected,
        type: 'success'
      });
    });
  });

  it('shows task success without task title', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showTaskSuccess('added');
    });
    
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Task added successfully',
      type: 'success'
    });
  });

  it('handles clear data action in storage error', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showStorageError('Storage quota exceeded');
    });
    
    const toast = result.current.toasts[0];
    expect(toast.action).toBeDefined();
    
    // Mock user confirming the action
    mockConfirm.mockReturnValue(true);
    
    act(() => {
      toast.action!.onClick();
    });
    
    expect(mockConfirm).toHaveBeenCalledWith('Clear all stored tasks? This cannot be undone.');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('dayPlannerTasks');
    expect(mockReload).toHaveBeenCalled();
  });

  it('handles cancel in clear data action', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showStorageError('Storage quota exceeded');
    });
    
    const toast = result.current.toasts[0];
    
    // Mock user canceling the action
    mockConfirm.mockReturnValue(false);
    
    act(() => {
      toast.action!.onClick();
    });
    
    expect(mockConfirm).toHaveBeenCalled();
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    expect(mockReload).not.toHaveBeenCalled();
  });

  it('generates unique toast IDs', () => {
    const { result } = renderHook(() => useToast());
    
    let id1: string, id2: string;
    act(() => {
      id1 = result.current.addToast('First message');
      id2 = result.current.addToast('Second message');
    });
    
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });
});