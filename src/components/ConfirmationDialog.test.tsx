import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfirmationDialog } from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Dialog',
    message: 'This is a test message',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore body overflow
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders nothing when closed', () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog when open', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      expect(screen.getByText('This is a test message')).toBeInTheDocument();
    });

    it('renders default button text', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders custom button text', () => {
      render(
        <ConfirmationDialog 
          {...defaultProps} 
          confirmText="Delete"
          cancelText="Keep"
        />
      );
      
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Keep')).toBeInTheDocument();
    });

    it('applies danger variant styling', () => {
      render(<ConfirmationDialog {...defaultProps} variant="danger" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('confirmation-dialog--danger');
      
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('btn--danger');
    });

    it('applies default variant styling', () => {
      render(<ConfirmationDialog {...defaultProps} variant="default" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveClass('confirmation-dialog--danger');
      
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('btn--primary');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-message');
    });

    it('focuses cancel button on open', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveFocus();
    });

    it('prevents body scroll when open', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      
      expect(document.body.style.overflow).toBe('');
    });

    it('has proper button labels', () => {
      render(
        <ConfirmationDialog 
          {...defaultProps} 
          confirmText="Delete"
          cancelText="Keep"
        />
      );
      
      expect(screen.getByLabelText('Keep and close dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete action')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      
      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);
      
      const backdrop = screen.getByRole('presentation');
      await user.click(backdrop);
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancel when dialog content is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);
      
      const dialog = screen.getByRole('dialog');
      await user.click(dialog);
      
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onCancel when Escape is pressed', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);
      
      await user.keyboard('{Escape}');
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when Enter is pressed on confirm button', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      
      const confirmButton = screen.getByText('Confirm');
      confirmButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not call onConfirm when Enter is pressed on cancel button', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      
      const cancelButton = screen.getByText('Cancel');
      cancelButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('traps focus between buttons with Tab', async () => {
      const user = userEvent.setup();
      
      render(<ConfirmationDialog {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      const confirmButton = screen.getByText('Confirm');
      
      // Cancel button should be focused initially
      expect(cancelButton).toHaveFocus();
      
      // Tab should move to confirm button
      await user.keyboard('{Tab}');
      expect(confirmButton).toHaveFocus();
      
      // Tab again should move back to cancel button
      await user.keyboard('{Tab}');
      expect(cancelButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onConfirm gracefully', () => {
      const props = { ...defaultProps };
      delete (props as any).onConfirm;
      
      expect(() => render(<ConfirmationDialog {...props} />)).not.toThrow();
    });

    it('handles missing onCancel gracefully', () => {
      const props = { ...defaultProps };
      delete (props as any).onCancel;
      
      expect(() => render(<ConfirmationDialog {...props} />)).not.toThrow();
    });

    it('handles empty title and message', () => {
      render(
        <ConfirmationDialog 
          {...defaultProps} 
          title=""
          message=""
        />
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles very long title and message', () => {
      const longText = 'A'.repeat(1000);
      
      render(
        <ConfirmationDialog 
          {...defaultProps} 
          title={longText}
          message={longText}
        />
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getAllByText(longText)).toHaveLength(2); // title and message
    });
  });
});