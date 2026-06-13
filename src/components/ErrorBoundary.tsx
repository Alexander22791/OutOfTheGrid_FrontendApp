'use client';

import React from 'react';
import { IoReloadOutline } from 'react-icons/io5';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
          <span className="mb-4 text-6xl">⚠️</span>
          <h2 className="mb-2 text-xl font-bold text-text-primary">Qualcosa è andato storto</h2>
          <p className="mb-6 text-center text-text-secondary">
            Si è verificato un errore imprevisto. Riprova.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent-light"
          >
            <IoReloadOutline size={20} />
            Riprova
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
