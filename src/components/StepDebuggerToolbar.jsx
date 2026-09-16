import React, { useEffect } from 'react';
import { PlayCircle, FastForward, Square, Bug, ArrowRight } from 'lucide-react';

/**
 * AutoFlow AI — Floating Step-Through Debugger Controls Toolbar
 * Enables real-time node-by-node stepping, inspection, and resumption.
 */
export default function StepDebuggerToolbar({
  isActive = false,
  currentStepIndex = 0,
  totalSteps = 0,
  currentNode = null,
  onStepNext = null,
  onResumeAll = null,
  onStop = null
}) {
  // Listen for keyboard shortcuts (F10 for Step, F5 for Resume)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'F10') {
        e.preventDefault();
        onStepNext && onStepNext();
      } else if (e.key === 'F5' && !e.shiftKey) {
        e.preventDefault();
        onResumeAll && onResumeAll();
      } else if (e.key === 'Escape' || (e.key === 'F5' && e.shiftKey)) {
        e.preventDefault();
        onStop && onStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onStepNext, onResumeAll, onStop]);

  if (!isActive) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        top: 18,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(245, 158, 11, 0.5)',
        borderRadius: 14,
        padding: '8px 16px',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 158, 11, 0.25)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Title & Step Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div 
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24'
          }}
        >
          <Bug size={14} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Step Debugger Active
          </div>
          <div style={{ fontSize: 12, color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Step {currentStepIndex + 1}/{totalSteps}:</span>
            <span style={{ color: '#818cf8' }}>{currentNode?.title || currentNode?.type || 'Next Step'}</span>
          </div>
        </div>
      </div>

      <div style={{ width: 1, height: 26, background: 'var(--border-subtle)' }} />

      {/* Control Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Step Next */}
        <button
          onClick={onStepNext}
          className="btn"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#ffffff',
            border: 'none',
            fontSize: 12,
            fontWeight: 700,
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
          }}
          title="Execute next node and pause (Shortcut: F10)"
        >
          <PlayCircle size={14} />
          <span>Step Next</span>
          <span style={{ fontSize: 9, opacity: 0.8, background: 'rgba(0,0,0,0.25)', padding: '1px 4px', borderRadius: 3 }}>F10</span>
        </button>

        {/* Resume All */}
        <button
          onClick={onResumeAll}
          className="btn btn-ghost"
          style={{
            color: '#34d399',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            fontSize: 12,
            fontWeight: 600,
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
          title="Resume continuous execution without pausing (Shortcut: F5)"
        >
          <FastForward size={14} />
          <span>Resume</span>
          <span style={{ fontSize: 9, opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: 3 }}>F5</span>
        </button>

        {/* Stop Run */}
        <button
          onClick={onStop}
          className="btn btn-ghost"
          style={{
            color: '#f87171',
            borderColor: 'rgba(239, 68, 68, 0.4)',
            fontSize: 12,
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
          title="Abort execution run"
        >
          <Square size={13} fill="#f87171" />
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
}
