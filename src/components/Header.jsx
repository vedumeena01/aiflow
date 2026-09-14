import React, { useRef } from 'react';
import { 
  Bot, 
  Play, 
  Square, 
  Download, 
  Upload, 
  Sliders, 
  Trash2,
  Undo2,
  Redo2,
  AlertTriangle,
  Key,
  MessageSquare,
  Sparkles,
  Code2
} from 'lucide-react';
import { PREBUILT_TEMPLATES } from '../data/templates';

export default function Header({
  workflowName,
  setWorkflowName,
  isRunning,
  executionMode, // 'simulated' | 'live'
  onChangeExecutionMode,
  onOpenApiSettings,
  hasActiveApiKey,
  onOpenChatPlayground,
  isChatOpen,
  onOpenCodeExport,
  onRunWorkflow,
  onStopWorkflow,
  onOpenTestModal,
  onLoadTemplate,
  onExportWorkflow,
  onImportWorkflow,
  onClearCanvas,
  nodeCount,
  connectionCount,
  validationResult,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        onImportWorkflow(parsed);
      } catch (err) {
        alert('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const hasCycle = validationResult && !validationResult.isValid;

  return (
    <header className="top-header">
      {/* Brand */}
      <div className="brand-section">
        <div className="brand-logo">
          <Bot size={20} />
        </div>
        <div className="brand-info">
          <div className="brand-title">
            AutoFlow AI
            <span className="brand-version">
              {executionMode === 'live' ? 'LIVE AGENTS' : 'SIMULATOR'}
            </span>
          </div>
          <div className="workflow-status-tag">
            <span className={`status-dot ${isRunning ? 'simulating' : hasCycle ? 'error-dot' : ''}`} />
            {isRunning ? (
              executionMode === 'live' ? 'Invoking live multi-agent API...' : 'Simulating agent data flow...'
            ) : hasCycle ? (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>Cycle Detected (DAG Broken)</span>
            ) : (
              `${nodeCount} nodes • ${connectionCount} wires • ${executionMode === 'live' ? 'Live Mode' : 'Simulated'}`
            )}
          </div>
        </div>
      </div>

      {/* Center Controls */}
      <div className="header-center">
        {/* Mode Switcher Pill */}
        <div 
          style={{ 
            display: 'flex', 
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: 3, 
            borderRadius: 8, 
            border: '1px solid var(--border-subtle)',
            gap: 2 
          }}
        >
          <button
            className="btn"
            style={{
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 6,
              background: executionMode === 'simulated' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: executionMode === 'simulated' ? '#a5b4fc' : 'var(--text-muted)',
              border: executionMode === 'simulated' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent'
            }}
            onClick={() => onChangeExecutionMode('simulated')}
            title="Simulated Mode: Fast, zero API cost demonstration"
          >
            Simulation
          </button>
          <button
            className="btn"
            style={{
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 6,
              background: executionMode === 'live' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: executionMode === 'live' ? '#34d399' : 'var(--text-muted)',
              border: executionMode === 'live' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
            onClick={() => onChangeExecutionMode('live')}
            title="Live Inference Mode: Executes real calls to Claude / Gemini / Groq"
          >
            <Sparkles size={11} />
            <span>Live AI</span>
          </button>
        </div>

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: 2 }}>
          <button 
            className="btn btn-ghost"
            style={{ padding: '6px 8px', opacity: canUndo ? 1 : 0.4 }}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button 
            className="btn btn-ghost"
            style={{ padding: '6px 8px', opacity: canRedo ? 1 : 0.4 }}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Template Quick Loader */}
        <div style={{ position: 'relative' }}>
          <select 
            className="template-dropdown-btn"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                const template = PREBUILT_TEMPLATES.find(t => t.id === e.target.value);
                if (template) onLoadTemplate(template);
                e.target.value = "";
              }
            }}
          >
            <option value="" disabled>✨ Load Template Workflow...</option>
            {PREBUILT_TEMPLATES.map(tmpl => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name} ({tmpl.tag})
              </option>
            ))}
          </select>
        </div>

        {/* Workflow Title */}
        <input 
          type="text" 
          className="workflow-name-input" 
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Workflow Title..."
          title="Click to rename workflow"
        />
      </div>

      {/* Actions */}
      <div className="header-actions">
        {/* LIVE CHAT PLAYGROUND BUTTON */}
        <button
          className="btn"
          onClick={onOpenChatPlayground}
          style={{
            background: isChatOpen 
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(168, 85, 247, 0.4))'
              : 'rgba(99, 102, 241, 0.15)',
            color: '#c7d2fe',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
          title="Open interactive pipeline chat playground"
        >
          <MessageSquare size={14} style={{ color: '#818cf8' }} />
          <span>Playground</span>
        </button>

        {/* 1-CLICK CODE EXPORT BUTTON */}
        <button 
          className="btn btn-ghost" 
          onClick={onOpenCodeExport}
          title="Export runnable Python (LangGraph) & TypeScript code"
          style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
        >
          <Code2 size={14} />
          <span>Export Code</span>
        </button>

        {/* API Keys Configuration Button */}
        <button 
          className="btn btn-ghost" 
          onClick={onOpenApiSettings}
          title="Configure API Keys for Live Inference"
          style={{ position: 'relative' }}
        >
          <Key size={14} style={{ color: hasActiveApiKey ? '#10b981' : 'var(--text-secondary)' }} />
          <span>API Keys</span>
          {hasActiveApiKey && (
            <span 
              style={{ 
                position: 'absolute', 
                top: 4, 
                right: 4, 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                background: '#10b981',
                boxShadow: '0 0 6px #10b981'
              }} 
            />
          )}
        </button>

        {/* Validation Warning Badge if issues exist */}
        {hasCycle && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600
            }}
            title={validationResult.errors.join('\n')}
          >
            <AlertTriangle size={13} />
            <span>Invalid Loop</span>
          </div>
        )}

        {/* Test Trigger Input Modal */}
        <button 
          className="btn btn-ghost" 
          onClick={onOpenTestModal}
          title="Configure mock payload for triggers"
        >
          <Sliders size={14} />
          <span>Payload Mock</span>
        </button>

        {/* Import JSON */}
        <button 
          className="btn btn-ghost" 
          onClick={() => fileInputRef.current?.click()}
          title="Import workflow JSON"
        >
          <Upload size={14} />
          <span>Import</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".json" 
          onChange={handleFileChange}
        />

        {/* Export JSON */}
        <button 
          className="btn btn-ghost" 
          onClick={onExportWorkflow}
          title="Export current workflow graph as JSON"
        >
          <Download size={14} />
          <span>JSON</span>
        </button>

        {/* Clear Canvas */}
        <button 
          className="btn btn-ghost" 
          onClick={onClearCanvas}
          title="Clear all nodes and wires"
          style={{ color: '#94a3b8' }}
        >
          <Trash2 size={14} />
        </button>

        {/* Run Workflow CTA */}
        {isRunning ? (
          <button 
            className="btn btn-ghost" 
            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            onClick={onStopWorkflow}
          >
            <Square size={14} fill="#ef4444" />
            <span>Stop Run</span>
          </button>
        ) : (
          <button 
            className="btn btn-run" 
            onClick={onRunWorkflow}
            disabled={nodeCount === 0 || hasCycle}
            title={hasCycle ? 'Execution blocked: resolve cyclic loop first' : 'Execute workflow pipeline'}
            style={hasCycle ? { opacity: 0.4, cursor: 'not-allowed', filter: 'grayscale(0.6)' } : {}}
          >
            <Play size={14} fill="#ffffff" />
            <span>{executionMode === 'live' ? 'Run Live AI' : 'Run Workflow'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
