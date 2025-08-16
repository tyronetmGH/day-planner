import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ToastMessage } from '../types';
import { Toast, ToastContainer } from './Toast';

describe('Toast', () => {
  const mockOnDismiss = vi.fn();
  
  const defaultToast: ToastMessage = {
    id: 'test-toast',
    message: 'Test message',
    type: 'info'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders toast message correctly', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays correct icon for each toast type', () => {
    const types: Array<{ type: ToastMessage['type']; icon: string }> = [
      { type: 'success', icon: '✓' },
      { type: 'error', icon: '✕' },
      { type: 'warning', icon: '⚠' },
      { type: 'info', icon: 'ℹ' }
    ];

    types.forEach(({ type, icon }) => {
      const { unmount } = render(
        <Toast 
          toast={{ ...defaultToast, type }} 
          onDismiss={mockOnDismiss} 
        />
      );
      
      expect(screen.getByText(icon)).toBeInTheDocument();
      unmount();
    });
  });

  it('auto-dismisses after default duration', async () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    // Fast-forward past the default duration (5000ms)
    vi.advanceTimersByTime(5300); // Include animation time
    
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('test-toast');
    });
  });

  it('auto-dismisses after custom duration', async () => {
    const customToast = { ...defaultToast, duration: 2000 };
    render(<Toast toast={customToast} onDismiss={mockOnDismiss} />);
    
    // Fast-forward past the custom duration
    vi.advanceTimersByTime(2300); // Include animation time
    
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('test-toast');
    });
  });

  it('dismisses when dismiss button is clicked', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const dismissButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissButton);
    
    // Should trigger exit animation, then call onDismiss after timeout
    vi.advanceTimersByTime(300);
    
    expect(mockOnDismiss).toHaveBeenCalledWith('test-toast');
  });

  it('dismisses when Escape key is pressed', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const toast = screen.getByRole('alert');
    fireEvent.keyDown(toast, { key: 'Escape' });
    
    // Should trigger exit animation, then call onDismiss after timeout
    vi.advanceTimersByTime(300);
    
    expect(mockOnDismiss).toHaveBeenCalledWith('test-toast');
  });

  it('renders action button when provided', () => {
    const actionToast: ToastMessage = {
      ...defaultToast,
      action: {
        label: 'Retry',
        onClick: vi.fn()
      }
    };
    
    render(<Toast toast={actionToast} onDismiss={mockOnDismiss} />);
    
    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(actionToast.action!.onClick).toHaveBeenCalled();
  });

  it('applies correct CSS classes for toast types', () => {
    const types: ToastMessage['type'][] = ['success', 'error', 'warning', 'info'];
    
    types.forEach(type => {
      const { unmount } = render(
        <Toast toast={{ ...defaultToast, type }} onDismiss={mockOnDismiss} />
      );
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass(`toast--${type}`);
      unmount();
    });
  });
});

describe('ToastContainer', () => {
  const mockOnDismiss = vi.fn();
  
  const sampleToasts: ToastMessage[] = [
    { id: '1', message: 'First toast', type: 'info' },
    { id: '2', message: 'Second toast', type: 'success' },
    { id: '3', message: 'Third toast', type: 'error' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no toasts provided', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onDismiss={mockOnDismiss} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders all provided toasts', () => {
    render(<ToastContainer toasts={sampleToasts} onDismiss={mockOnDismiss} />);
    
    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
    expect(screen.getByText('Third toast')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ToastContainer toasts={sampleToasts} onDismiss={mockOnDismiss} />);
    
    const container = screen.getByRole('region');
    expect(container).toHaveAttribute('aria-label', 'Notifications');
  });

  it('passes onDismiss to individual toasts', () => {
    render(<ToastContainer toasts={sampleToasts} onDismiss={mockOnDismiss} />);
    
    const dismissButtons = screen.getAllByLabelText('Dismiss notification');
    fireEvent.click(dismissButtons[0]);
    
    expect(mockOnDismiss).toHaveBeenCalledWith('1');
  });
});