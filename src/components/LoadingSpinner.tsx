import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  inline?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  inline = false,
  className = ''
}) => {
  const spinnerClass = `loading-spinner loading-spinner--${size} ${inline ? 'loading-spinner--inline' : ''} ${className}`.trim();

  if (inline) {
    return (
      <span className={spinnerClass} role="status" aria-label={message || 'Loading'}>
        <span className="loading-spinner__circle" aria-hidden="true"></span>
        {message && <span className="loading-spinner__message">{message}</span>}
      </span>
    );
  }

  return (
    <div className={spinnerClass} role="status" aria-label={message || 'Loading'}>
      <div className="loading-spinner__circle" aria-hidden="true"></div>
      {message && (
        <div className="loading-spinner__message">
          {message}
        </div>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  children
}) => {
  return (
    <div className="loading-overlay-container">
      {children}
      {isVisible && (
        <div className="loading-overlay" role="status" aria-label={message}>
          <div className="loading-overlay__content">
            <LoadingSpinner size="large" />
            <div className="loading-overlay__message">
              {message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;