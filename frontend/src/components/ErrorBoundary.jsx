/**
 * Error Boundary Component
 * Catches and handles React component errors gracefully
 */

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Send error to logging service (if implemented)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to API endpoint
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.toString(),
            errorInfo: errorInfo.componentStack,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            url: window.location.href
          })
        }).catch(err => console.error('Failed to log error:', err));
      } catch (loggingError) {
        console.error('Error logging failed:', loggingError);
      }
    }
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  reloadPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(this.state.error, this.resetError)
          : fallback;
      }

      // Default error UI
      return (
        <div style={{
          padding: '2rem',
          maxWidth: '600px',
          margin: '4rem auto',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#fee',
            border: '2px solid #fcc',
            borderRadius: '8px',
            padding: '2rem'
          }}>
            <h1 style={{ color: '#c33', marginBottom: '1rem', fontSize: '1.5rem' }}>
              ⚠️ Something went wrong
            </h1>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              We apologize for the inconvenience. An unexpected error occurred.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                backgroundColor: '#f5f5f5',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '200px',
                  color: '#c33'
                }}>
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre style={{
                    fontSize: '0.7rem',
                    overflow: 'auto',
                    maxHeight: '150px',
                    color: '#666',
                    marginTop: '0.5rem'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={this.resetError}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.reloadPage}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Reload Page
              </button>
            </div>

            {this.state.errorCount > 2 && (
              <p style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                color: '#856404'
              }}>
                <strong>Persistent Error Detected</strong><br />
                If this error continues, please contact support or try clearing your browser cache.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
