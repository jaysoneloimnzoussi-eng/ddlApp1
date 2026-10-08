import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
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
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  Une erreur inattendue est survenue
                </h2>
                <p className="text-xs text-rose-400 font-mono">
                  DDL-PN Sovereign Recovery Console
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              L'application a intercepté une anomalie d'exécution. Vous pouvez recharger l'interface ou réinitialiser le cache local corrompu pour restaurer l'état normal.
            </p>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-6 font-mono text-[11px] text-rose-300 max-h-40 overflow-y-auto break-all">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recharger la page</span>
              </button>

              <button
                onClick={this.handleHardReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purger le cache local & Réparer</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
