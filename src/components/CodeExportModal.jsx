import React, { useState } from 'react';
import { X, Code2, Copy, Check, Download, FileCode, Terminal } from 'lucide-react';
import { generatePythonLangGraph, generateTypeScriptCode } from '../utils/codeGenerator';

export default function CodeExportModal({
  isOpen,
  onClose,
  workflowName,
  nodes,
  connections
}) {
  if (!isOpen) return null;

  const [activeLang, setActiveLang] = useState('python'); // 'python' | 'typescript'
  const [copied, setCopied] = useState(false);

  const pythonCode = generatePythonLangGraph(workflowName, nodes, connections);
  const tsCode = generateTypeScriptCode(workflowName, nodes, connections);
  const currentCode = activeLang === 'python' ? pythonCode : tsCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const ext = activeLang === 'python' ? 'py' : 'ts';
    const filename = `${(workflowName || 'pipeline').toLowerCase().replace(/[^a-z0-9]/g, '_')}_workflow.${ext}`;
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '92%', maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Code2 size={18} style={{ color: '#818cf8' }} />
            <span>1-Click Production Code Exporter</span>
          </div>
          <button className="node-mini-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ gap: 14 }}>
          {/* Language Selector Bar & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255, 255, 255, 0.05)', padding: 3, borderRadius: 8 }}>
              <button
                className="btn"
                style={{
                  padding: '5px 14px',
                  fontSize: 12,
                  borderRadius: 6,
                  background: activeLang === 'python' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: activeLang === 'python' ? '#ffffff' : '#94a3b8',
                  border: activeLang === 'python' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent'
                }}
                onClick={() => setActiveLang('python')}
              >
                🐍 Python (LangGraph)
              </button>
              <button
                className="btn"
                style={{
                  padding: '5px 14px',
                  fontSize: 12,
                  borderRadius: 6,
                  background: activeLang === 'typescript' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: activeLang === 'typescript' ? '#ffffff' : '#94a3b8',
                  border: activeLang === 'typescript' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent'
                }}
                onClick={() => setActiveLang('typescript')}
              >
                ⚡ TypeScript (Node.js)
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-ghost"
                onClick={handleCopy}
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>

              <button 
                className="btn btn-primary"
                onClick={handleDownload}
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                <Download size={14} />
                <span>Download .{activeLang === 'python' ? 'py' : 'ts'}</span>
              </button>
            </div>
          </div>

          {/* Setup / Execution Hint */}
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.95)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            padding: '10px 14px', 
            borderRadius: 8,
            fontSize: 11.5,
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <Terminal size={15} style={{ color: '#818cf8', flexShrink: 0 }} />
            <span>
              {activeLang === 'python' ? (
                <>Run in terminal: <code style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>pip install langgraph langchain-core && python workflow.py</code></>
              ) : (
                <>Run in terminal: <code style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>npm install && npx ts-node workflow.ts</code></>
              )}
            </span>
          </div>

          {/* Code Viewer */}
          <pre 
            style={{
              background: '#04070e',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: '14px 18px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              color: '#cbd5e1',
              lineHeight: 1.5,
              overflowX: 'auto',
              maxHeight: '440px',
              overflowY: 'auto'
            }}
          >
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
