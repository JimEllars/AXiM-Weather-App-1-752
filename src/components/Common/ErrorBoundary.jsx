import React from 'react';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 w-full bg-axim-dark flex flex-col items-center justify-center p-6 text-center rounded-xl">
          <div className="glass-panel p-10 max-w-lg w-full border border-axim-danger/50 shadow-[0_0_30px_rgba(255,51,102,0.15)] flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-axim-danger/10 flex items-center justify-center mb-6">
              <SafeIcon icon={FiIcons.FiAlertOctagon} className="text-5xl text-axim-danger" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Connection Interrupted</h1>
            <p className="text-slate-400 mb-6 font-mono text-sm">
              A critical failure has occurred in this module's rendering pipeline.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="px-6 py-3 bg-axim-accent/20 border border-axim-accent/50 text-white font-bold rounded-full hover:bg-axim-accent/40 shadow-lg backdrop-blur-md transition-all flex items-center gap-2"
            >
              <SafeIcon icon={FiIcons.FiRotateCcw} />
              Reload Component
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ErrorBoundary = ({ children }) => {
  const navigate = useNavigate();
  return <ErrorBoundaryInner navigate={navigate}>{children}</ErrorBoundaryInner>;
};

export default ErrorBoundary;
