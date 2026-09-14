import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Edit3, RotateCcw, AlertTriangle, Play, Sparkles } from 'lucide-react';

export default function HitlApprovalModal({
  isOpen,
  node,
  inputData,
  isBreakpoint,
  onApprove,
  onReject
}) {
  if (!isOpen || !node) return null;

  const initialPayloadString = typeof inputData === 'object' 
    ? JSON.stringify(inputData, null, 2) 
    : String(inputData || '');

  const [payloadText, setPayloadText] = useState(initialPayloadString);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [parseError, setParseError] = useState(null);

  useEffect(() => {
    setPayloadText(initialPayloadString);
    setShowRejectInput(false);
    setRejectReason('');
    setParseError(null);
  }, [isOpen, node, inputData]);

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(payloadText);
      setPayloadText(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (e) {
      setParseError('Cannot format: invalid JSON syntax');
    }
  };

  const handleReset = () => {
    setPayloadText(initialPayloadString);
    setParseError(null);
  };

  const handleApprove = () => {
    let finalPayload = payloadText;
    try {
      finalPayload = JSON.parse(payloadText);
    } catch {
      // If it is regular text, pass as string
    }
    onApprove(finalPayload);
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    onReject(rejectReason || 'Operator manual rejection');
  };

  const riskLevel = node.config?.riskLevel || (isBreakpoint ? 'DEBUG' : 'HIGH');
  const riskColors = {
    LOW: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
    MEDIUM: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
    HIGH: { border: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c' },
    CRITICAL: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
    DEBUG: { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6' }
  };
  const currentRisk = riskColors[riskLevel] || riskColors.HIGH;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div 
        className="modal-container"
        style={{
          maxWidth: '680px',
          width: '90%',
          border: `1px solid ${currentRisk.border}`,
          boxShadow: `0 0 35px ${currentRisk.bg}, 0 25px 50px -12px rgba(0, 0, 0, 0.9)`
        }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentRisk.bg,
                color: currentRisk.text,
                border: `1px solid ${currentRisk.border}`
              }}
            >
              {isBreakpoint ? <AlertTriangle size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>
                  {isBreakpoint ? 'Breakpoint Encountered' : 'Human-in-the-Loop Review Gate'}
                </h3>
                <span 
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                    background: currentRisk.bg,
                    color: currentRisk.text,
                    border: `1px solid ${currentRisk.border}`
                  }}
                >
                  {isBreakpoint ? 'BREAKPOINT' : `RISK: ${riskLevel}`}
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Pipeline paused at node: <strong style={{ color: '#e2e8f0' }}>{node.title || node.type}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '18px 22px' }}>
          <div style={{ marginBottom: '14px', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Action / Prompt Title:</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>Node ID: {node.id}</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#f1f5f9' }}>
              {node.config?.actionTitle || node.title || (isBreakpoint ? 'Paused for operator state inspection' : 'External Dispatch / Mutation Gate')}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={13} style={{ color: '#38bdf8' }} />
              Inbound Payload / Output Data (Operator Editable):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button"
                onClick={handleFormatJson}
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#38bdf8',
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={11} /> Format JSON
              </button>
              <button 
                type="button"
                onClick={handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>
          </div>

          <textarea
            value={payloadText}
            onChange={(e) => {
              setPayloadText(e.target.value);
              setParseError(null);
            }}
            rows={9}
            style={{
              width: '100%',
              background: '#090d16',
              border: parseError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#e2e8f0',
              padding: '12px',
              fontSize: '0.82rem',
              fontFamily: "'Fira Code', 'Consolas', monospace",
              lineHeight: 1.5,
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />

          {parseError && (
            <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>
              {parseError}
            </div>
          )}

          {showRejectInput && (
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Rejection Audit Reason:
              </label>
              <input 
                type="text"
                placeholder="E.g., Prompt hallucination / Unverified recipient parameter"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: '100%',
                  background: '#160b0e',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  color: '#fca5a5',
                  padding: '8px 10px',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div 
          className="modal-footer" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 22px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(10, 15, 28, 0.5)'
          }}
        >
          <div>
            <button
              type="button"
              onClick={handleReject}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <XCircle size={15} />
              {showRejectInput ? 'Confirm Rejection' : 'Reject & Terminate'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleApprove}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '1px solid #34d399',
                color: '#ffffff',
                padding: '8px 20px',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.15s'
              }}
            >
              {isBreakpoint ? <Play size={15} /> : <CheckCircle2 size={15} />}
              {isBreakpoint ? 'Resume Execution' : 'Approve & Forward'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
