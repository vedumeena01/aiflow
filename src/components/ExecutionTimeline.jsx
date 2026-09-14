import React, { useState, useEffect } from 'react';
import { 
  History, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Bot, 
  Zap, 
  Send, 
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders
} from 'lucide-react';

export default function ExecutionTimeline({
  snapshots = [],
  activeStepIndex = null,
  onSelectStep,
  onClearReplay,
  onRerunFromStep,
  isRunning
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [isEditingPayload, setIsEditingPayload] = useState(false);
  const [editedPayloadText, setEditedPayloadText] = useState('');

  // Auto-play scrubber
  useEffect(() => {
    let timer = null;
    if (isPlaying && snapshots.length > 0) {
      timer = setInterval(() => {
        onSelectStep(prev => {
          const current = prev === null ? -1 : prev;
          if (current >= snapshots.length - 1) {
            setIsPlaying(false);
            return current;
          }
          return current + 1;
        });
      }, 1400);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, snapshots.length, onSelectStep]);

  if (!snapshots || snapshots.length === 0) return null;

  const currentSnapshot = activeStepIndex !== null && snapshots[activeStepIndex] 
    ? snapshots[activeStepIndex] 
    : snapshots[snapshots.length - 1];

  const currentIndex = activeStepIndex !== null ? activeStepIndex : snapshots.length - 1;

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentIndex > 0) {
      onSelectStep(currentIndex - 1);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (currentIndex < snapshots.length - 1) {
      onSelectStep(currentIndex + 1);
    }
  };

  const handleFirst = () => {
    setIsPlaying(false);
    onSelectStep(0);
  };

  const handleLatest = () => {
    setIsPlaying(false);
    onSelectStep(snapshots.length - 1);
  };

  const handleStartRerun = () => {
    let finalInput = currentSnapshot.inputData;
    if (isEditingPayload) {
      try {
        finalInput = JSON.parse(editedPayloadText);
      } catch {
        finalInput = editedPayloadText;
      }
    }
    onRerunFromStep(currentIndex, finalInput);
    setIsEditingPayload(false);
  };

  const getCategoryIcon = (category, type) => {
    if (type === 'hitl_gate') return <ShieldCheck size={13} style={{ color: '#f59e0b' }} />;
    if (category === 'trigger') return <Zap size={13} style={{ color: '#f59e0b' }} />;
    if (category === 'agent') return <Bot size={13} style={{ color: '#8b5cf6' }} />;
    if (category === 'action') return <Send size={13} style={{ color: '#ec4899' }} />;
    return <Sparkles size={13} style={{ color: '#10b981' }} />;
  };

  return (
    <div 
      className="execution-timeline-bar"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 28, 0.95) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        borderTop: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Top Controls Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.78rem', 
              fontWeight: 700,
              color: '#818cf8',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}
          >
            <History size={13} />
            <span>TIME-TRAVEL REPLAY</span>
          </div>

          {/* Stepper Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="node-mini-btn"
              title="Jump to Start"
              onClick={handleFirst}
              disabled={currentIndex === 0 || isRunning}
            >
              <SkipBack size={13} />
            </button>
            <button
              className="node-mini-btn"
              title="Previous Step"
              onClick={handlePrev}
              disabled={currentIndex === 0 || isRunning}
            >
              ◀
            </button>
            <button
              className="node-mini-btn"
              title={isPlaying ? "Pause Auto-Scrub" : "Auto-Play Step Scrubber"}
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isRunning}
              style={{
                color: isPlaying ? '#f59e0b' : '#38bdf8',
                borderColor: isPlaying ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)'
              }}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              className="node-mini-btn"
              title="Next Step"
              onClick={handleNext}
              disabled={currentIndex === snapshots.length - 1 || isRunning}
            >
              ▶
            </button>
            <button
              className="node-mini-btn"
              title="Jump to Latest Step"
              onClick={handleLatest}
              disabled={currentIndex === snapshots.length - 1 || isRunning}
            >
              <SkipForward size={13} />
            </button>
          </div>

          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', marginLeft: '6px' }}>
            Step <strong style={{ color: '#f8fafc' }}>{currentIndex + 1}</strong> of <strong style={{ color: '#f8fafc' }}>{snapshots.length}</strong>
          </span>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowInspector(!showInspector)}
            style={{
              background: showInspector ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showInspector ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
              color: showInspector ? '#38bdf8' : '#94a3b8',
              fontSize: '0.74rem',
              padding: '4px 10px',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 600
            }}
          >
            <Eye size={13} />
            {showInspector ? 'Hide Snapshot Details' : 'View Snapshot Details'}
          </button>

          <button
            onClick={handleStartRerun}
            disabled={isRunning}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: '1px solid #818cf8',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
            }}
            title="Re-executes the pipeline starting from this exact step forward"
          >
            <RefreshCw size={13} />
            <span>Re-run From Step {currentIndex + 1}</span>
          </button>

          {activeStepIndex !== null && (
            <button
              onClick={onClearReplay}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
              title="Exit replay mode and return to live canvas"
            >
              Reset Live
            </button>
          )}
        </div>
      </div>

      {/* Step Breadcrumb Scrubber Strip */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'thin'
        }}
      >
        {snapshots.map((snap, idx) => {
          const isSelected = idx === currentIndex;
          return (
            <React.Fragment key={snap.stepIndex || idx}>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  onSelectStep(idx);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(139, 92, 246, 0.25) 100%)' 
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 0 14px rgba(99, 102, 241, 0.5)' : undefined,
                  transition: 'all 0.15s ease'
                }}
              >
                {getCategoryIcon(snap.category, snap.nodeType)}
                <span style={{ fontWeight: isSelected ? 700 : 500 }}>
                  {idx + 1}. {snap.nodeTitle}
                </span>
                {snap.status === 'success' ? (
                  <CheckCircle2 size={11} style={{ color: '#10b981' }} />
                ) : (
                  <AlertCircle size={11} style={{ color: '#ef4444' }} />
                )}
              </button>

              {idx < snapshots.length - 1 && (
                <ArrowRight size={11} style={{ color: '#475569', flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Snapshot Inspector Details Pane */}
      {showInspector && currentSnapshot && (
        <div 
          style={{
            background: 'rgba(9, 13, 22, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginTop: '2px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '12px'
          }}
        >
          {/* Inbound State Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Inbound Payload at Step {currentIndex + 1}:
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!isEditingPayload) {
                    setEditedPayloadText(JSON.stringify(currentSnapshot.inputData || {}, null, 2));
                  }
                  setIsEditingPayload(!isEditingPayload);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isEditingPayload ? '#34d399' : '#94a3b8',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isEditingPayload ? 'Save Edits' : 'Edit Before Re-run'}
              </button>
            </div>

            {isEditingPayload ? (
              <textarea
                value={editedPayloadText}
                onChange={e => setEditedPayloadText(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  background: '#040711',
                  border: '1px solid #38bdf8',
                  borderRadius: '5px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  padding: '6px',
                  boxSizing: 'border-box'
                }}
              />
            ) : (
              <pre
                style={{
                  margin: 0,
                  maxHeight: '110px',
                  overflowY: 'auto',
                  background: '#040711',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '5px',
                  padding: '8px',
                  color: '#cbd5e1',
                  fontSize: '0.73rem',
                  fontFamily: 'monospace',
                  lineHeight: 1.4
                }}
              >
                {typeof currentSnapshot.inputData === 'object' 
                  ? JSON.stringify(currentSnapshot.inputData, null, 2) 
                  : String(currentSnapshot.inputData || 'None')}
              </pre>
            )}
          </div>

          {/* Outbound Output State Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Produced Output State:
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                {currentSnapshot.tokens ? `${currentSnapshot.tokens} tokens` : ''} • {currentSnapshot.elapsedMs ? `${currentSnapshot.elapsedMs}ms` : ''}
              </span>
            </div>

            <pre
              style={{
                margin: 0,
                maxHeight: '110px',
                overflowY: 'auto',
                background: '#040711',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '5px',
                padding: '8px',
                color: '#cbd5e1',
                fontSize: '0.73rem',
                fontFamily: 'monospace',
                lineHeight: 1.4
              }}
            >
              {typeof currentSnapshot.outputData === 'object'
                ? JSON.stringify(currentSnapshot.outputData, null, 2)
                : String(currentSnapshot.outputData || 'No output')}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
