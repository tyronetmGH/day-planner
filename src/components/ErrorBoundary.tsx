import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error boundary component to catch and handle unhandled errors
 * Provides graceful error handling for the entire application
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div 
          className="error-boundary"
          role="alert"
          aria-labelledby="error-title"
          aria-describedby="error-description"
        >
          <div className="error-boundary__content">
            <h1 id="error-title" className="error-boundary__title">
              Something went wrong
            </h1>
            <p id="error-description" className="error-boundary__description">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="error-boundary__actions">
              <button 
                onClick={this.handleReset}
                className="btn btn--primary"
                aria-label="Try to recover from error"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn--secondary"
                aria-label="Refresh the page"
              >
                Refresh Page
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error Details (Development)</summary>
                <pre className="error-boundary__stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;