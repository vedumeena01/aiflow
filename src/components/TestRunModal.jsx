import React, { useState } from 'react';
import { X, Sliders, Play, FileJson, Check } from 'lucide-react';

export default function TestRunModal({
  isOpen,
  onClose,
  mockPayload,
  onSavePayload,
  onRunTest
}) {
  if (!isOpen) return null;

  const [jsonText, setJsonText] = useState(
    JSON.stringify(mockPayload, null, 2)
  );
  const [parseError, setParseError] = useState(null);

  const handleSaveAndRun = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onSavePayload(parsed);
      onRunTest(parsed);
      onClose();
    } catch (err) {
      setParseError('Invalid JSON format: ' + err.message);
    }
  };

  const handleLoadSample = (sampleType) => {
    let sample = {};
    if (sampleType === 'support') {
      sample = {
        event: "customer.ticket_created",
        customer_id: "usr_fintech_881",
        email: "sarah.chen@stripe-partner.org",
        priority: "critical",
        message: "Stripe payout batch failed on node cluster us-east-1. Error 502."
      };
    } else if (sampleType === 'lead') {
      sample = {
        prospect_name: "Marcus Vance",
        work_email: "m.vance@ai-dynamics.co",
        company: "AI Dynamics Group",
        interest: "Enterprise agent deployment for 150 team members",
        tier: "Enterprise Tier 1"
      };
    } else {
      sample = {
        timestamp: new Date().toISOString(),
        interval: "cron_daily_0800",
        targets: ["AgentForce", "Dust.tt", "Retool AI"]
      };
    }
    setJsonText(JSON.stringify(sample, null, 2));
    setParseError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Sliders size={18} style={{ color: '#818cf8' }} />
            <span>Test Run Trigger Payload</span>
          </div>
          <button className="node-mini-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Provide mock data to inject into the entry trigger node when running simulated agent execution:
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quick Presets:</span>
            <button 
              className="btn btn-ghost" 
              style={{ fontSize: 11, padding: '3px 8px' }}
              onClick={() => handleLoadSample('support')}
            >
              Support Ticket
            </button>
            <button 
              className="btn btn-ghost" 
              style={{ fontSize: 11, padding: '3px 8px' }}
              onClick={() => handleLoadSample('lead')}
            >
              Enterprise Lead
            </button>
            <button 
              className="btn btn-ghost" 
              style={{ fontSize: 11, padding: '3px 8px' }}
              onClick={() => handleLoadSample('cron')}
            >
              Cron Pulse
            </button>
          </div>

          <textarea 
            className="form-textarea"
            rows={10}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setParseError(null);
            }}
            placeholder="{ ... }"
          />

          {parseError && (
            <div style={{ color: '#ef4444', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {parseError}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-run" onClick={handleSaveAndRun}>
            <Play size={14} fill="#ffffff" />
            <span>Save & Execute Flow</span>
          </button>
        </div>
      </div>
    </div>
  );
}
