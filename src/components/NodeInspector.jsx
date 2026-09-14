import React from 'react';
import { 
  X, 
  Sliders, 
  Trash2, 
  Sparkles, 
  Cpu, 
  Code2, 
  Copy, 
  ExternalLink,
  Info
} from 'lucide-react';
import { NODE_CATEGORIES, NODE_DEFINITIONS, AI_MODELS } from '../data/nodeDefinitions';

export default function NodeInspector({
  selectedNode,
  onUpdateConfig,
  onUpdateTitle,
  onClose,
  onDeleteNode
}) {
  if (!selectedNode) return null;

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

        {/* AI MODEL SELECTOR (If node is an AI agent) */}
        {nodeDef.category === 'agent' && (
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

            {/* System Prompt / Persona */}
            <div className="form-group">
              <label className="form-label">System Role & Directives</label>
              <textarea 
                className="form-textarea" 
                rows={4}
                value={config.systemPrompt || ''}
                onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                placeholder="You are an autonomous AI specialist..."
              />
            </div>

            {/* Prompt Template with Variable Chips */}
            {selectedNode.type === 'llm_prompt' && (
              <div className="form-group">
                <label className="form-label">
                  <span>User Prompt Template</span>
                  <span className="form-helper">Interpolation ready</span>
                </label>
                <textarea 
                  className="form-textarea" 
                  rows={4}
                  value={config.userPromptTemplate || ''}
                  onChange={(e) => handleConfigChange('userPromptTemplate', e.target.value)}
                  placeholder="Analyze the incoming inquiry: {{input_context}}"
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
