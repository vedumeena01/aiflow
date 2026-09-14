import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  Coins, 
  Trash2, 
  Loader2,
  Activity,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles
} from 'lucide-react';

export default function ExecutionConsole({
  logs,
  isRunning,
  onClearLogs,
  totalTokens,
  totalLatency
}) {
  // 'collapsed' | 'medium' | 'maximized'
  const [viewState, setViewState] = useState('medium');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom as logs stream in
  useEffect(() => {
    if (scrollRef.current && logs.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleExpand = () => {
    setViewState(prev => (prev === 'collapsed' ? 'medium' : 'collapsed'));
  };

  const toggleMaximize = (e) => {
    e.stopPropagation();
    setViewState(prev => (prev === 'maximized' ? 'medium' : 'maximized'));
  };

  const consoleHeight = viewState === 'collapsed' ? '46px' : viewState === 'maximized' ? '540px' : '300px';

  return (
    <div 
      className="execution-console"
      style={{
        height: consoleHeight,
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.8)'
      }}
    >
      {/* Console Header Bar */}
      <div 
        className="console-header"
        onClick={toggleExpand}
        style={{ 
          height: '46px', 
          minHeight: '46px',
          maxHeight: '46px',
          flexShrink: 0,
          cursor: 'pointer', 
          background: 'rgba(15, 23, 42, 0.98)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}
      >
        <div className="console-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Terminal size={16} style={{ color: '#818cf8' }} />
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.01em', color: '#f8fafc' }}>
            Execution Telemetry & Live Stream
          </span>
          {isRunning ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 11, background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: 4 }}>
              <Loader2 size={12} className="spin-animate" />
              <span>Pipeline Running...</span>
            </div>
          ) : logs.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981', fontSize: 11, background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 4 }}>
              <CheckCircle2 size={12} />
              <span>Run Finished</span>
            </div>
          ) : null}
        </div>

        <div className="console-metrics-row" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="metric-item">
            <Clock size={13} style={{ color: '#818cf8' }} />
            <span style={{ fontSize: 12 }}>Duration: <strong style={{ color: '#ffffff' }}>{totalLatency || '0ms'}</strong></span>
          </div>
          <div className="metric-item">
            <Coins size={13} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 12 }}>Tokens: <strong style={{ color: '#ffffff' }}>{totalTokens || '0'}</strong></span>
          </div>
          <div className="metric-item">
            <Activity size={13} style={{ color: '#34d399' }} />
            <span style={{ fontSize: 12 }}>Events: <strong style={{ color: '#ffffff' }}>{logs.length}</strong></span>
          </div>

          <button 
            className="node-mini-btn" 
            title="Clear all logs"
            onClick={onClearLogs}
          >
            <Trash2 size={14} />
          </button>

          <button 
            className="node-mini-btn" 
            onClick={toggleMaximize}
            title={viewState === 'maximized' ? "Restore height (300px)" : "Maximize height (540px)"}
          >
            {viewState === 'maximized' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button 
            className="node-mini-btn" 
            onClick={toggleExpand}
            title={viewState === 'collapsed' ? "Expand drawer" : "Collapse drawer"}
          >
            {viewState === 'collapsed' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Console Log Stream Body */}
      {viewState !== 'collapsed' && (
        <div 
          ref={scrollRef}
          className="console-body"
          style={{
            height: 'calc(100% - 46px)',
            maxHeight: 'calc(100% - 46px)',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            background: '#070b12',
            padding: '16px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: 12, padding: '30px', textAlign: 'center' }}>
              No execution events recorded yet. Click <strong>"Run Workflow"</strong> in the top header to start execution.
            </div>
          ) : (
            logs.map((item, index) => (
              <div 
                key={index}
                className={`log-stream-row ${item.status || 'success'}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: item.status === 'error' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ color: '#64748b', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {item.time}
                  </span>
                  <span style={{ 
                    color: '#818cf8', 
                    fontWeight: 700, 
                    fontSize: 11.5,
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(99, 102, 241, 0.18)',
                    padding: '2px 7px',
                    borderRadius: 4
                  }}>
                    {item.nodeTitle || 'Pipeline'}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    background: item.status === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                    color: item.status === 'error' ? '#f87171' : '#34d399'
                  }}>
                    {item.status || 'SUCCESS'}
                  </span>
                </div>

                <div style={{ color: '#f1f5f9', fontSize: 12.5, lineHeight: 1.45, fontFamily: 'var(--font-sans)', marginTop: 2 }}>
                  {item.message}
                </div>

                {item.output && (
                  <div 
                    className="log-payload-preview"
                    style={{
                      marginTop: 8,
                      background: '#030509',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      color: '#38bdf8',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      maxHeight: '180px',
                      overflowY: 'auto'
                    }}
                  >
                    {typeof item.output === 'string' 
                      ? item.output 
                      : JSON.stringify(item.output, null, 2)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
