import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message
        ?? "Something went wrong. Please try refreshing the page.";

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-xl border-2 border-rose-100 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-slate-800">Unexpected Error</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-all"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
