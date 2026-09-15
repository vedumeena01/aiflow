import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Trash2, 
  Sparkles, 
  Cpu, 
  Code2, 
  Copy, 
  ExternalLink, 
  Info, 
  Database,
  Play,
  Terminal,
  Check,
  AlertTriangle
} from 'lucide-react';
import { NODE_CATEGORIES, NODE_DEFINITIONS, AI_MODELS } from '../data/nodeDefinitions';
import { CODE_SANDBOX_PRESETS, executeSandboxCode } from '../services/sandboxService';

export default function NodeInspector({
  selectedNode,
  onUpdateConfig,
  onUpdateTitle,
  onToggleBreakpoint,
  onOpenKnowledgeModal,
  onClose,
  onDeleteNode
}) {
  if (!selectedNode) return null;

  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const nodeDef = NODE_DEFINITIONS.find(d => d.type === selectedNode.type) || {
    name: selectedNode.title,
    category: 'agent',
    defaultConfig: {}
  };

  const category = NODE_CATEGORIES[nodeDef.category] || NODE_CATEGORIES.agent;
  const config = selectedNode.config || {};

  const handleConfigChange = (key, value) => {
    onUpdateConfig(selectedNode.id, {
      ...config,
      [key]: value
    });
  };

  const handleInsertVariable = (varName) => {
    const current = config.userPromptTemplate || '';
    handleConfigChange('userPromptTemplate', `${current} {{${varName}}}`);
  };

  return (
    <aside className="inspector-drawer">
      {/* Header */}
      <div className="inspector-header">
        <div className="inspector-title-box">
          <div 
            style={{ 
              width: 28, 
              height: 28, 
              borderRadius: 6, 
              background: category.glowColor,
              color: category.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${category.borderHover}`
            }}
          >
            <Sliders size={15} />
          </div>
          <div>
            <div className="inspector-title">Node Configuration</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{nodeDef.name}</div>
          </div>
        </div>
        <button 
          className="node-mini-btn" 
          onClick={onClose}
          title="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="inspector-body">
        {/* Node Custom Title */}
        <div className="form-group">
          <label className="form-label">Node Title</label>
          <input 
            type="text" 
            className="form-input" 
            value={selectedNode.title || ''}
            onChange={(e) => onUpdateTitle(selectedNode.id, e.target.value)}
            placeholder="Label this node..."
          />
        </div>

        {/* Execution Breakpoint Toggle */}
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.08)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
              Execution Breakpoint
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Pause pipeline run at this node for inspection</div>
          </div>
          <input 
            type="checkbox"
            checked={!!selectedNode.breakpoint}
            onChange={() => onToggleBreakpoint && onToggleBreakpoint(selectedNode.id)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ef4444' }}
          />
        </div>

        {/* AI MODEL SELECTOR (If node is an AI agent) */}
        {nodeDef.category === 'agent' && selectedNode.type !== 'vector_rag' && (
          <>
            <div className="form-group">
              <label className="form-label">
                <span>Inference Model</span>
                <span className="form-helper">Multi-provider</span>
              </label>
              <select 
                className="form-select"
                value={config.model || 'gpt-4o'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
              >
                {AI_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider} • {m.latency})
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature Slider */}
            <div className="form-group">
              <label className="form-label">
                <span>Temperature</span>
                <span className="range-val">{config.temperature ?? 0.7}</span>
              </label>
              <div className="range-wrap">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  className="form-range"
                  value={config.temperature ?? 0.7}
                  onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)' }}>
                <span>Deterministic (0.0)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            {/* System Prompt */}
            <div className="form-group">
              <label className="form-label">
                <span>System Role & Persona</span>
                <span className="form-helper">Instructions</span>
              </label>
              <textarea 
                className="form-textarea"
                rows={3}
                value={config.systemPrompt || ''}
                onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                placeholder="Describe how the agent should think and respond..."
              />
            </div>

            {/* User Prompt Template (for llm_prompt) */}
            {selectedNode.type === 'llm_prompt' && (
              <div className="form-group">
                <label className="form-label">
                  <span>User Prompt Template</span>
                  <span className="form-helper">Supports &#123;&#123;vars&#125;&#125;</span>
                </label>
                <textarea 
                  className="form-textarea"
                  rows={4}
                  value={config.userPromptTemplate || ''}
                  onChange={(e) => handleConfigChange('userPromptTemplate', e.target.value)}
                  placeholder="Template with {{variables}} from incoming connections..."
                />

                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Quick-Insert Variables:
                  </div>
                  <div className="variable-chips-container">
                    <span className="var-chip" onClick={() => handleInsertVariable('trigger.customer_query')}>
                      + customer_query
                    </span>
                    <span className="var-chip" onClick={() => handleInsertVariable('agent.intent')}>
                      + agent.intent
                    </span>
                    <span className="var-chip" onClick={() => handleInsertVariable('agent.research_summary')}>
                      + research_summary
                    </span>
                    <span className="var-chip" onClick={() => handleInsertVariable('trigger.email')}>
                      + trigger.email
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* VECTOR RAG & KNOWLEDGE BASE FIELDS */}
        {selectedNode.type === 'vector_rag' && (
          <>
            <div className="form-group">
              <label className="form-label">Knowledge Base Title</label>
              <input 
                type="text" 
                className="form-input"
                value={config.knowledgeStoreName || 'Enterprise Knowledge Base'}
                onChange={(e) => handleConfigChange('knowledgeStoreName', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Top-K Chunks Retrieved</span>
                <span className="range-val">{config.topK ?? 3}</span>
              </label>
              <div className="range-wrap">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="1"
                  className="form-range"
                  value={config.topK ?? 3}
                  onChange={(e) => handleConfigChange('topK', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Similarity Threshold</span>
                <span className="range-val">{config.similarityThreshold ?? 0.70}</span>
              </label>
              <div className="range-wrap">
                <input 
                  type="range" 
                  min="0.30" 
                  max="0.95" 
                  step="0.05"
                  className="form-range"
                  value={config.similarityThreshold ?? 0.70}
                  onChange={(e) => handleConfigChange('similarityThreshold', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Chunk Size (Characters)</label>
              <input 
                type="number" 
                className="form-input"
                value={config.chunkSize || 400}
                onChange={(e) => handleConfigChange('chunkSize', parseInt(e.target.value) || 400)}
              />
            </div>

            <div className="form-group">
              <button
                type="button"
                onClick={() => onOpenKnowledgeModal && onOpenKnowledgeModal(selectedNode)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)',
                  border: '1px solid #818cf8',
                  color: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.35)',
                  marginTop: '6px'
                }}
              >
                <Database size={15} style={{ color: '#818cf8' }} />
                <span>Manage Knowledge Docs ({config.documents?.length || 0} Loaded)</span>
              </button>
            </div>
          </>
        )}

        {/* WEBHOOK TRIGGER FIELDS */}
        {selectedNode.type === 'webhook_trigger' && (
          <>
            <div className="form-group">
              <label className="form-label">HTTP Method</label>
              <select 
                className="form-select"
                value={config.method || 'POST'}
                onChange={(e) => handleConfigChange('method', e.target.value)}
              >
                <option value="POST">POST (Standard Payload)</option>
                <option value="GET">GET (Query Params)</option>
                <option value="PUT">PUT (Update Stream)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Endpoint Path</label>
              <input 
                type="text" 
                className="form-input"
                value={config.path || '/api/v1/webhook'}
                onChange={(e) => handleConfigChange('path', e.target.value)}
              />
            </div>
          </>
        )}

        {/* SCHEDULE TRIGGER FIELDS */}
        {selectedNode.type === 'schedule_trigger' && (
          <div className="form-group">
            <label className="form-label">Cron Expression</label>
            <input 
              type="text" 
              className="form-input"
              value={config.cron || '0 */4 * * *'}
              onChange={(e) => handleConfigChange('cron', e.target.value)}
              placeholder="0 */4 * * *"
            />
            <span className="form-helper">e.g. 0 8 * * 1-5 for weekday 8am runs</span>
          </div>
        )}

        {/* CONDITION LOGIC FIELDS */}
        {selectedNode.type === 'condition' && (
          <>
            <div className="form-group">
              <label className="form-label">Field to Evaluate</label>
              <input 
                type="text" 
                className="form-input"
                value={config.field || 'intent'}
                onChange={(e) => handleConfigChange('field', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Operator</label>
              <select 
                className="form-select"
                value={config.operator || 'equals'}
                onChange={(e) => handleConfigChange('operator', e.target.value)}
              >
                <option value="equals">Equals (===)</option>
                <option value="not_equals">Not Equals (!==)</option>
                <option value="contains">Contains substring</option>
                <option value="greater_than">Greater than (&gt;)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Compare Target Value</label>
              <input 
                type="text" 
                className="form-input"
                value={config.compareValue || ''}
                onChange={(e) => handleConfigChange('compareValue', e.target.value)}
              />
            </div>
          </>
        )}

        {/* HITL HUMAN APPROVAL GATE FIELDS */}
        {selectedNode.type === 'hitl_gate' && (
          <>
            <div className="form-group">
              <label className="form-label">Review Action Title</label>
              <input 
                type="text" 
                className="form-input"
                value={config.actionTitle || ''}
                onChange={(e) => handleConfigChange('actionTitle', e.target.value)}
                placeholder="E.g., Authorize Stripe Refund Dispatch"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Risk Level Gate</label>
              <select 
                className="form-select"
                value={config.riskLevel || 'HIGH'}
                onChange={(e) => handleConfigChange('riskLevel', e.target.value)}
              >
                <option value="LOW">Low (Informational Review)</option>
                <option value="MEDIUM">Medium (Data Mutation)</option>
                <option value="HIGH">High (External API / Queue Dispatch)</option>
                <option value="CRITICAL">Critical (Financial / Production DB)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Review Timeout (Minutes)</label>
              <input 
                type="number" 
                className="form-input"
                value={config.timeoutMinutes || 15}
                onChange={(e) => handleConfigChange('timeoutMinutes', parseInt(e.target.value) || 15)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ops Notification Channel</label>
              <input 
                type="text" 
                className="form-input"
                value={config.notificationChannel || '#ops-approvals'}
                onChange={(e) => handleConfigChange('notificationChannel', e.target.value)}
              />
            </div>
          </>
        )}

        {/* CODE SANDBOX FIELDS */}
        {selectedNode.type === 'code_sandbox' && (
          <>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pre-bundled Preset</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>1-Click Insert</span>
              </label>
              <select
                className="form-select"
                defaultValue=""
                onChange={(e) => {
                  const preset = CODE_SANDBOX_PRESETS.find(p => p.id === e.target.value);
                  if (preset) {
                    handleConfigChange('code', preset.code);
                    e.target.value = "";
                  }
                }}
              >
                <option value="" disabled>Load Transformation Preset...</option>
                {CODE_SANDBOX_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Runtime Engine</label>
                <select
                  className="form-select"
                  value={config.language || 'javascript'}
                  onChange={(e) => handleConfigChange('language', e.target.value)}
                >
                  <option value="javascript">JavaScript (V8 In-Browser)</option>
                  <option value="python">Python (LangGraph Node)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Timeout (ms)</label>
                <input
                  type="number"
                  className="form-input"
                  min="500"
                  max="10000"
                  step="500"
                  value={config.timeoutMs || 2500}
                  onChange={(e) => handleConfigChange('timeoutMs', parseInt(e.target.value) || 2500)}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Script Code</label>
                <span style={{ fontSize: 10, color: '#a5b4fc', fontFamily: 'monospace' }}>function transform(input, context)</span>
              </div>
              <textarea
                rows={11}
                className="form-input"
                style={{
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: 12,
                  lineHeight: 1.5,
                  background: '#090d16',
                  borderColor: 'rgba(99, 102, 241, 0.4)',
                  color: '#e2e8f0',
                  tabSize: 2,
                  whiteSpace: 'pre',
                  overflowX: 'auto'
                }}
                value={config.code || ''}
                onChange={(e) => handleConfigChange('code', e.target.value)}
                placeholder="// function transform(input) { return input; }"
                spellCheck="false"
              />
            </div>

            {/* Test Run Action */}
            <div className="form-group">
              <button
                type="button"
                disabled={isTesting}
                onClick={async () => {
                  setIsTesting(true);
                  setTestResult(null);
                  const sampleInput = {
                    event: 'test_event',
                    user: 'sarah@techcorp.io',
                    message: 'Payment of $499 failed due to timeout. Please escalate urgently.',
                    timestamp: new Date().toISOString()
                  };
                  const res = await executeSandboxCode({
                    code: config.code || '',
                    inputData: sampleInput,
                    timeoutMs: config.timeoutMs || 2500
                  });
                  setTestResult(res);
                  setIsTesting(false);
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.2) 100%)',
                  border: '1px solid #10b981',
                  color: '#ffffff',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.25)'
                }}
              >
                <Play size={13} fill="white" />
                <span>{isTesting ? 'Executing Sandbox...' : 'Test Run Script on Sample Payload'}</span>
              </button>
            </div>

            {/* Test Output Panel */}
            {testResult && (
              <div
                style={{
                  background: '#06090e',
                  border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 8,
                  fontSize: 11
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {testResult.success ? (
                      <span style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={13} /> SCRIPT PASSED
                      </span>
                    ) : (
                      <span style={{ color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={13} /> EXECUTION FAILED
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>⏱ {testResult.latencyMs}ms</span>
                </div>

                {testResult.logs?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, marginBottom: 2 }}>Console Logs:</div>
                    <pre style={{ margin: 0, padding: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 4, color: '#a5b4fc', fontSize: 10 }}>
                      {testResult.logs.join('\n')}
                    </pre>
                  </div>
                )}

                <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, marginBottom: 2 }}>Returned Output:</div>
                <pre style={{ margin: 0, padding: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 4, color: '#f1f5f9', fontSize: 10, maxHeight: 150, overflowY: 'auto' }}>
                  {JSON.stringify(testResult.result, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}

        {/* SLACK ACTION FIELDS */}
        {selectedNode.type === 'slack_dispatch' && (
          <>
            <div className="form-group">
              <label className="form-label">Channel / Webhook Target</label>
              <input 
                type="text" 
                className="form-input"
                value={config.channel || '#general-alerts'}
                onChange={(e) => handleConfigChange('channel', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Embed Theme</label>
              <select 
                className="form-select"
                value={config.cardTheme || 'urgent-red'}
                onChange={(e) => handleConfigChange('cardTheme', e.target.value)}
              >
                <option value="urgent-red">High Alert (Crimson Glow)</option>
                <option value="intel-violet">Intelligence Brief (Violet)</option>
                <option value="standard-emerald">Standard Success (Emerald)</option>
              </select>
            </div>
          </>
        )}

        {/* EMAIL ACTION FIELDS */}
        {selectedNode.type === 'email_send' && (
          <>
            <div className="form-group">
              <label className="form-label">Recipient Email</label>
              <input 
                type="text" 
                className="form-input"
                value={config.to || '{{trigger.email}}'}
                onChange={(e) => handleConfigChange('to', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Line</label>
              <input 
                type="text" 
                className="form-input"
                value={config.subject || ''}
                onChange={(e) => handleConfigChange('subject', e.target.value)}
              />
            </div>
          </>
        )}

        {/* REST API CALL FIELDS */}
        {selectedNode.type === 'http_request' && (
          <>
            <div className="form-group">
              <label className="form-label">Destination URL</label>
              <input 
                type="text" 
                className="form-input"
                value={config.endpoint || 'https://api.example.com/v1'}
                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">HTTP Method</label>
              <select 
                className="form-select"
                value={config.method || 'POST'}
                onChange={(e) => handleConfigChange('method', e.target.value)}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
          </>
        )}

        {/* Delete Action Button */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button 
            className="btn btn-ghost" 
            style={{ width: '100%', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)' }}
            onClick={() => onDeleteNode(selectedNode.id)}
          >
            <Trash2 size={14} />
            <span>Delete This Node</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
