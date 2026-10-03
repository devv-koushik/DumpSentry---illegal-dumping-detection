import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[DumpSentry ErrorBoundary caught an error]:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-paper p-6 font-cmd text-center">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-line shadow-pop">
            <div className="h-12 w-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-base font-bold text-ink mb-1">Application Render Error</h2>
            <p className="text-xs text-muted mb-4">
              A temporary display error occurred while rendering the interface.
            </p>
            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-paper2 font-mono text-[11px] text-danger mb-4 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent-deep transition-all shadow-sm"
            >
              <RefreshCw size={13} />
              <span>Reload Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
