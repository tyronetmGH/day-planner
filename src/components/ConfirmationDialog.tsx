import React, { useEffect, useRef } from 'react';
import './ConfirmationDialog.css';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
}

/**
 * Accessible confirmation dialog component
 * Provides proper focus management and keyboard navigation
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default'
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button by default (safer option)
      cancelButtonRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onCancel();
          break;
        case 'Tab':
          // Trap focus within dialog
          event.preventDefault();
          const currentFocus = document.activeElement;
          if (currentFocus === cancelButtonRef.current) {
            confirmButtonRef.current?.focus();
          } else {
            cancelButtonRef.current?.focus();
          }
          break;
        case 'Enter':
          // Confirm on Enter if confirm button is focused
          if (document.activeElement === confirmButtonRef.current) {
            event.preventDefault();
            onConfirm();
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onConfirm, onCancel]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="confirmation-dialog-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`confirmation-dialog confirmation-dialog--${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <div className="confirmation-dialog__content">
          <h2 id="dialog-title" className="confirmation-dialog__title">
            {title}
          </h2>
          <p id="dialog-message" className="confirmation-dialog__message">
            {message}
          </p>
        </div>
        
        <div className="confirmation-dialog__actions">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="btn btn--secondary"
            type="button"
            aria-label={`${cancelText} and close dialog`}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`btn ${variant === 'danger' ? 'btn--danger' : 'btn--primary'}`}
            type="button"
            aria-label={`${confirmText} action`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;