import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'white', backgroundColor: '#0f172a', minHeight: '100vh' }}>
          <h2 style={{ color: '#ef4444' }}>אופס! משהו השתבש.</h2>
          <p>האפליקציה נתקלה בשגיאה. אנא צלם מסך זה ושלח למפתח:</p>
          <div style={{ 
            backgroundColor: 'rgba(255,0,0,0.1)', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginTop: '1rem',
            border: '1px solid #ef4444',
            direction: 'ltr',
            textAlign: 'left',
            overflowX: 'auto'
          }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>{this.state.error && this.state.error.toString()}</h4>
            <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            איפוס הגדרות ורענון (מחיקת נתונים)
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
