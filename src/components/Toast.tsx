import React, { useEffect, useState } from 'react';
import type { ToastMessage } from '../types';
import './Toast.css';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-dismiss after duration
    const duration = toast.duration ?? 5000;
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300); // Match CSS transition duration
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleDismiss();
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  };

  return (
    <div
      className={`toast toast--${toast.type} ${isVisible ? 'toast--visible' : ''} ${isExiting ? 'toast--exiting' : ''}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="toast__content">
        <div className="toast__icon" aria-hidden="true">
          {getIcon()}
        </div>
        <div className="toast__message">
          {toast.message}
        </div>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="toast__action"
            type="button"
          >
            {toast.action.label}
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="toast__dismiss"
          aria-label="Dismiss notification"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="toast-container"
      aria-label="Notifications"
      role="region"
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default Toast;