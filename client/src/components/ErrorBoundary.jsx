import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
            Something went wrong rendering this section.
          </p>
          <p className="text-xs text-red-500 dark:text-red-500 font-mono mb-3">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-secondary text-xs"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
