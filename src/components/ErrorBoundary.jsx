import React from 'react';
import { AlertOctagon, RotateCcw, Home, Sparkles } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught unhandled application exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('autoflow_ai_workflow_v1');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            minHeight: '100vh',
            background: '#090d16',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}
        >
          <div 
            style={{
              maxWidth: 580,
              width: '100%',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(239, 68, 68, 0.15)',
              textAlign: 'center'
            }}
          >
            <div 
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto'
              }}
            >
              <AlertOctagon size={28} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px 0', color: '#f8fafc' }}>
              AutoFlow Studio Encountered an Unexpected Error
            </h2>

            <p style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              A client-side exception was trapped by the production safety guardrail. Your saved workflow vault is intact.
            </p>

            {this.state.error && (
              <div 
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 8,
                  padding: 12,
                  color: '#fca5a5',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  maxHeight: 120,
                  overflowY: 'auto',
                  marginBottom: 24
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
              >
                <RotateCcw size={15} />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetState}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Home size={15} />
                <span>Reset to Default Template</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
