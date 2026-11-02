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
    console.error('ErrorBoundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="bg-white p-8 rounded shadow max-w-md text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">Algo salió mal</h1>
            <p className="text-sm text-slate-600 mb-4">{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-4 py-2 rounded">Recargar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
