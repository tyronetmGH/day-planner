import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner, LoadingOverlay } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Saving task..." />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Saving task...');
    expect(screen.getByText('Saving task...')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const { unmount } = render(<LoadingSpinner size={size} />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass(`loading-spinner--${size}`);
      unmount();
    });
  });

  it('renders as inline when specified', () => {
    render(<LoadingSpinner inline />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--inline');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });

  it('renders inline spinner as span element', () => {
    const { container } = render(<LoadingSpinner inline />);
    
    const spinner = container.querySelector('span.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders block spinner as div element', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('div.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });
});

describe('LoadingOverlay', () => {
  const TestComponent = () => <div>Test content</div>;

  it('renders children when not visible', () => {
    render(
      <LoadingOverlay isVisible={false} message="Loading...">
        <TestComponent />
      </LoadingOverlay>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders overlay when visible', () => {
    render(
      <LoadingOverlay isVisible={true} message="Loading data...">
        <TestComponent />
      </LoadingOverlay>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveAttribute('aria-label', 'Loading data...');
  });

  it('uses default message when none provided', () => {
    render(
      <LoadingOverlay isVisible={true}>
        <TestComponent />
      </LoadingOverlay>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveAttribute('aria-label', 'Loading...');
  });

  it('has proper overlay structure', () => {
    const { container } = render(
      <LoadingOverlay isVisible={true} message="Processing...">
        <TestComponent />
      </LoadingOverlay>
    );
    
    const overlayContainer = container.querySelector('.loading-overlay-container');
    const overlay = container.querySelector('.loading-overlay');
    const overlayContent = container.querySelector('.loading-overlay__content');
    
    expect(overlayContainer).toBeInTheDocument();
    expect(overlay).toBeInTheDocument();
    expect(overlayContent).toBeInTheDocument();
  });

  it('contains loading spinner when visible', () => {
    render(
      <LoadingOverlay isVisible={true}>
        <TestComponent />
      </LoadingOverlay>
    );
    
    const spinner = screen.getByRole('status');
    expect(spinner.querySelector('.loading-spinner__circle')).toBeInTheDocument();
  });
});