/**
 * Error Boundary Component
 *
 * Catches React errors and displays a fallback UI instead of crashing the app.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // TODO: Log to error tracking service
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4" role="alert">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Something went wrong
              </h1>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Error details (development only)
                </summary>
                <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Refresh page"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh Page
            </button>

            <button
              onClick={this.handleReset}
              className="w-full mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Try again without refreshing"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper for async error boundaries
 * Use this for components that might fail during async operations
 */
export function AsyncErrorBoundary({
  children,
  fallbackMessage = 'Failed to load component'
}: {
  children: ReactNode;
  fallbackMessage?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4" role="alert">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {fallbackMessage}
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
