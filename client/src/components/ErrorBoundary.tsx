import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Zenith ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#070A0F] text-slate-100">
          <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-rose-900/40 shadow-2xl relative overflow-hidden text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>

            <h2 className="text-xl font-extrabold text-white tracking-tight mb-2">
              Something unexpected happened
            </h2>
            
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Zenith Finance encountered a temporary component render error. Your financial data in the cloud is safe.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left mb-5 max-h-32 overflow-y-auto">
                <code className="text-[11px] text-rose-300 font-mono break-all">
                  {this.state.error.message || 'Unknown render exception'}
                </code>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
