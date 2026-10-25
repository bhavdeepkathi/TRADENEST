import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-950 p-6">
          <div className="card max-w-lg w-full p-8 text-center space-y-4 shadow-xl border border-secondary-200 dark:border-secondary-800">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-50">
              Something went wrong
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              An unexpected error occurred while displaying this page.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-secondary-100 dark:bg-secondary-900 p-3 rounded overflow-x-auto text-red-600 dark:text-red-400 max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={this.handleReset} className="btn btn-primary flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Reload Page
              </button>
              <a href="/" className="btn btn-outline flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to Home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
export default ErrorBoundary
