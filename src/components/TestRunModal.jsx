import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sliders, 
  Play, 
  FileJson, 
  Check, 
  Radio, 
  Copy, 
  Terminal, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Clock,
  Send,
  AlertCircle
} from 'lucide-react';

const EVENT_PRESETS = [
  {
    id: 'stripe_charge_failed',
    label: 'Stripe Payout Failed (P0)',
    badge: 'PAYMENTS',
    badgeColor: '#ef4444',
    headers: {
      'Content-Type': 'application/json',
      'X-Stripe-Event': 'charge.failed',
      'X-Stripe-Signature': 't=1757912400,v1=9f82a7c4e...'
    },
    payload: {
      event_type: 'charge.failed',
      charge_id: 'ch_3M4k92Ksl201',
      amount_cents: 145000,
      currency: 'usd',
      customer_email: 'billing@enterprise-corp.com',
      failure_code: 'insufficient_funds_or_hold',
      failure_message: 'Customer settlement balance hold detected on payment gateway',
      risk_level: 'critical',
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'zendesk_outage',
    label: 'Zendesk Critical Incident',
    badge: 'SUPPORT',
    badgeColor: '#f59e0b',
    headers: {
      'Content-Type': 'application/json',
      'X-Zendesk-Webhook-Source': 'production-monitoring',
      'Authorization': 'Bearer sec_live_9921841029'
    },
    payload: {
      ticket_id: 'INC-88902',
      customer_tier: 'Enterprise Platinum',
      reporter: 'devops-lead@cloudtech.io',
      summary: 'Postgres primary connection pool exhausted in region eu-central-1',
      severity: 'P0',
      affected_users: 1240,
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'github_pr',
    label: 'GitHub PR Review Event',
    badge: 'DEVOPS',
    badgeColor: '#818cf8',
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': 'pull_request',
      'X-Hub-Signature-256': 'sha256=d3a9b1c7...'
    },
    payload: {
      action: 'opened',
      repository: 'enterprise/payment-service',
      pull_request_number: 142,
      author: 'alex-engineer',
      title: 'feat: add exponential backoff retry for Stripe webhook dispatcher',
      changed_files: 8,
      additions: 342,
      deletions: 48,
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'amqp_reconcile',
    label: 'RabbitMQ Ledger Task',
    badge: 'AMQP',
    badgeColor: '#10b981',
    headers: {
      'Content-Type': 'application/json',
      'X-RabbitMQ-Exchange': 'amq.topic',
      'X-RabbitMQ-Routing-Key': 'tasks.critical.data_reconciliation'
    },
    payload: {
      task_id: 'tsk_amqp_9941',
      queue: 'agent.tasks.inbound',
      exchange: 'amq.topic',
      routing_key: 'tasks.critical.reconciliation',
      objective: 'Reconcile billing ledger transactions against Stripe charges',
      priority: 'critical',
      delivery_tag: 4098,
      timestamp: new Date().toISOString()
    }
  }
];

export default function TestRunModal({
  isOpen,
  onClose,
  mockPayload,
  onSavePayload,
  onRunTest,
  workflowName = 'Pipeline'
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('dispatcher'); // 'dispatcher' | 'curl' | 'history'
  const [selectedPresetId, setSelectedPresetId] = useState('stripe_charge_failed');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(EVENT_PRESETS[0].payload, null, 2));
  const [headersText, setHeadersText] = useState(() => JSON.stringify(EVENT_PRESETS[0].headers, null, 2));
  const [parseError, setParseError] = useState(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [inboundHistory, setInboundHistory] = useState([
    {
      id: 'evt_init_1',
      name: 'Stripe Payout Failed (P0)',
      status: '200 OK',
      time: '1 min ago',
      bytes: 412
    }
  ]);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setJsonText(JSON.stringify(preset.payload, null, 2));
    setHeadersText(JSON.stringify(preset.headers, null, 2));
    setParseError(null);
  };

  const handleDispatch = () => {
    try {
      const parsedPayload = JSON.parse(jsonText);
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headersText);
      } catch (e) {}

      // Add to inbound log
      const historyItem = {
        id: `evt_${Date.now().toString(36)}`,
        name: EVENT_PRESETS.find(p => p.id === selectedPresetId)?.label || 'Custom Inbound Event',
        status: 'DISPATCHED',
        time: 'Just now',
        bytes: jsonText.length
      };
      setInboundHistory(prev => [historyItem, ...prev.slice(0, 9)]);

      onSavePayload({
        ...parsedPayload,
        _inboundHeaders: parsedHeaders
      });

      onRunTest({
        ...parsedPayload,
        _inboundHeaders: parsedHeaders
      });

      onClose();
    } catch (err) {
      setParseError(`JSON Syntax Error: ${err.message}`);
    }
  };

  // Generate cURL command for external testing
  const generatedCurl = useMemo(() => {
    const safePayload = jsonText.replace(/\n/g, '').replace(/"/g, '\\"');
    return `curl -X POST http://localhost:5173/api/v1/webhook/incoming-event \\
  -H "Content-Type: application/json" \\
  -H "X-AutoFlow-Signature: sha256=8f2a49b01c..." \\
  -H "X-AutoFlow-Event: ${selectedPresetId}" \\
  -d "${safePayload}"`;
  }, [jsonText, selectedPresetId]);

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generatedCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 780,
          width: '95%',
          background: 'rgba(13, 17, 23, 0.98)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.18)'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, transparent 100%)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div 
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(239, 68, 68, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.25)'
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  Live Webhook Inbound Tester & Mock Event Dispatcher
                </h3>
                <span 
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}
                >
                  LIVE SIMULATOR
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Inject realistic event payloads into entry trigger nodes or test external cURL webhooks.
              </p>
            </div>
          </div>

          <button 
            className="btn btn-ghost" 
            onClick={onClose}
            style={{ padding: '6px 8px', color: '#94a3b8' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div 
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '0 24px',
            gap: 8
          }}
        >
          <button
            onClick={() => setActiveTab('dispatcher')}
            style={{
              padding: '12px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'dispatcher' ? '2px solid #818cf8' : '2px solid transparent',
              color: activeTab === 'dispatcher' ? '#f8fafc' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Zap size={14} style={{ color: '#fbbf24' }} />
            <span>Event Dispatcher</span>
          </button>

          <button
            onClick={() => setActiveTab('curl')}
            style={{
              padding: '12px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'curl' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'curl' ? '#38bdf8' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Terminal size={14} />
            <span>External cURL Ingress</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'history' ? '#34d399' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Clock size={14} />
            <span>Inbound Log ({inboundHistory.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: 24, maxHeight: '65vh', overflowY: 'auto' }}>
          {/* TAB: DISPATCHER */}
          {activeTab === 'dispatcher' && (
            <div>
              {/* Event Presets Toolbar */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                  Select Production Event Preset:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
                  {EVENT_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: selectedPresetId === preset.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: selectedPresetId === preset.id ? '1px solid rgba(99, 102, 241, 0.6)' : '1px solid var(--border-subtle)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span 
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: `${preset.badgeColor}25`,
                            color: preset.badgeColor
                          }}
                        >
                          {preset.badge}
                        </span>
                        {selectedPresetId === preset.id && <Check size={12} style={{ color: '#818cf8' }} />}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {preset.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* JSON Payload Editor */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', margin: 0 }}>
                    Inbound Event Payload (JSON)
                  </label>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {jsonText.length} bytes
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={jsonText}
                  onChange={e => {
                    setJsonText(e.target.value);
                    setParseError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: 12,
                    lineHeight: 1.45,
                    background: '#090d16',
                    border: parseError ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    color: '#e2e8f0',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Headers Editor Collapsible */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                  HTTP / AMQP Inbound Headers
                </label>
                <textarea
                  rows={3}
                  value={headersText}
                  onChange={e => setHeadersText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: 11,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    color: '#a5b4fc',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {parseError && (
                <div 
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 16
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Target: Entry Trigger Node • Workflow: "{workflowName}"
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={onClose}>
                    Cancel
                  </button>
                  <button 
                    type="button"
                    className="btn btn-primary"
                    onClick={handleDispatch}
                    style={{
                      padding: '8px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Send size={13} />
                    <span>Dispatch Payload & Run Flow</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CURL INGRESS */}
          {activeTab === 'curl' && (
            <div>
              <p style={{ fontSize: 13, color: '#e2e8f0', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                Test inbound webhook connectivity from your terminal, Postman, or external services (Stripe, GitHub, AWS):
              </p>

              <div 
                style={{
                  position: 'relative',
                  background: '#090d16',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 18
                }}
              >
                <button
                  onClick={handleCopyCurl}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: copiedCurl ? '#34d399' : '#cbd5e1',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer'
                  }}
                >
                  {copiedCurl ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                </button>

                <pre 
                  style={{
                    margin: 0,
                    padding: 0,
                    color: '#38bdf8',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: 12,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {generatedCurl}
                </pre>
              </div>

              <div 
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: 12,
                  color: '#bae6fd'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} style={{ color: '#38bdf8' }} />
                  <span>Webhook Security Specifications</span>
                </div>
                <div>
                  • Endpoints accept standard JSON HTTP POST requests with HMAC-SHA256 signature verification.<br />
                  • Prefetch rate limits configured at 100 requests / minute per client token.
                </div>
              </div>
            </div>
          )}

          {/* TAB: INBOUND LOG */}
          {activeTab === 'history' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {inboundHistory.map((item, idx) => (
                  <div 
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {item.bytes} bytes payload • {item.time}
                      </div>
                    </div>

                    <span 
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
