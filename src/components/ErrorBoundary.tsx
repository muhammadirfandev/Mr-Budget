import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, LogOut, ShieldAlert, Home } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught React Runtime Error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  private handleSignOutAndReset = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to sign out during error recovery:', e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      let isFirestorePermissionErr = false;
      let parsedFirestoreError: any = null;

      try {
        if (this.state.errorInfo && this.state.errorInfo.trim().startsWith('{')) {
          const parsed = JSON.parse(this.state.errorInfo);
          if (parsed && typeof parsed === 'object' && ('error' in parsed || 'operationType' in parsed)) {
            parsedFirestoreError = parsed;
            if (parsed.error && parsed.error.includes('permission')) {
              isFirestorePermissionErr = true;
            }
          }
        }
      } catch (e) {
        // Not a JSON error message, ignore
      }

      const errorMessage = this.state.error?.message || 'An unexpected problem has occurred.';

      return (
        <div id="error-boundary-screen" className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 font-sans selection:bg-rose-500/30 selection:text-rose-200">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Decorative background pulse */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full filter blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full filter blur-3xl" />

            {/* Error header icon */}
            <div className="flex items-center gap-4 mb-6">
              <div id="error-alert-icon" className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shrink-0">
                {isFirestorePermissionErr ? (
                  <ShieldAlert className="w-8 h-8" />
                ) : (
                  <AlertCircle className="w-8 h-8" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">
                  Application Exception Detected
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  {isFirestorePermissionErr ? 'Database Access Violation' : 'Unhandled Runtime Exception'}
                </p>
              </div>
            </div>

            {/* Diagnostic Details */}
            <div className="bg-neutral-950 text-neutral-300 rounded-xl p-5 border border-neutral-800/80 mb-6 font-mono text-xs overflow-auto max-h-[220px] scrollbar-thin scrollbar-thumb-neutral-800">
              {parsedFirestoreError ? (
                <div className="space-y-2">
                  <p className="text-rose-400 font-semibold mb-1">
                    Firestore Rule Rejection Summary
                  </p>
                  <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-neutral-400">
                    <span className="font-bold text-neutral-500">Operation:</span>
                    <span className="col-span-3 text-neutral-200 uppercase">{parsedFirestoreError.operationType}</span>

                    <span className="font-bold text-neutral-500">Path:</span>
                    <span className="col-span-3 text-neutral-200 break-all">{parsedFirestoreError.path || 'N/A'}</span>

                    <span className="font-bold text-neutral-500">User ID:</span>
                    <span className="col-span-3 text-neutral-200 break-all">{parsedFirestoreError.authInfo?.userId || 'Not Logged In'}</span>

                    <span className="font-bold text-neutral-500">Email:</span>
                    <span className="col-span-3 text-neutral-200">{parsedFirestoreError.authInfo?.email || 'N/A'}</span>
                  </div>
                  <div className="border-t border-neutral-800/60 pt-2 mt-2">
                    <p className="font-bold text-neutral-500 mb-0.5">Underlying Secret/Error Code:</p>
                    <p className="text-neutral-300 break-words leading-relaxed">{parsedFirestoreError.error}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-rose-400 font-bold">Error Stack / Details:</p>
                  <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{errorMessage}</p>
                </div>
              )}
            </div>

            {/* Recovery Actions description */}
            <div className="mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Suggested Recovery Steps
              </h2>
              <ul className="text-xs text-neutral-400 space-y-2 list-none p-0">
                <li className="flex gap-2">
                  <span className="text-rose-400">•</span>
                  <span><strong>Guest Fallback:</strong> If database connection cannot be fetched or provisioned, click <strong>"Go to Guest Mode"</strong> to continue offline without signing in.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">•</span>
                  <span><strong>Refresh Browser State:</strong> Use <strong>"Reload Page"</strong> to clear local states if corrupted items exist.</span>
                </li>
              </ul>
            </div>

            {/* Actions button strip */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                id="btn-recover-guest"
                onClick={this.handleSignOutAndReset}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/20 active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                Go to Guest Mode
              </button>

              <button
                type="button"
                id="btn-recover-reload"
                onClick={this.handleReset}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                Reload Page & Clear Local
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
