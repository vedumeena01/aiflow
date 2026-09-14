import React from 'react';
import { 
  Zap, 
  Bot, 
  GitBranch, 
  Send, 
  Webhook, 
  Clock, 
  Mail, 
  Sparkles, 
  BrainCircuit, 
  Layers, 
  Globe, 
  FileSearch, 
  Split, 
  Filter, 
  Hourglass, 
  MessageSquare, 
  Network, 
  Database,
  Trash2,
  Copy,
  Sliders,
  CheckCircle2,
  Loader2,
  AlertOctagon,
  Repeat,
  Target,
  Radio
} from 'lucide-react';
import { NODE_CATEGORIES, NODE_DEFINITIONS } from '../data/nodeDefinitions';

const ICON_MAP = {
  Zap,
  Bot,
  GitBranch,
  Send,
  Webhook,
  Clock,
  Mail,
  Sparkles,
  BrainCircuit,
  Layers,
  Globe,
  FileSearch,
  Split,
  Filter,
  Hourglass,
  MessageSquare,
  Network,
  Database,
  Repeat,
  Target,
  Radio
};

export default function NodeCard({
  node,
  isSelected,
  executionStatus,
  isCycleNode,
  onSelect,
  onDelete,
  onDuplicate,
  onStartConnection,
  onPortMouseUp
}) {
  const nodeDef = NODE_DEFINITIONS.find(d => d.type === node.type) || {
    name: node.title,
    category: 'agent',
    icon: 'Bot',
    inputs: ['input'],
    outputs: ['output']
  };

  const category = NODE_CATEGORIES[nodeDef.category] || NODE_CATEGORIES.agent;
  const NodeIcon = ICON_MAP[nodeDef.icon] || Bot;

  let subTag = null;
  if (node.config?.model) {
    subTag = node.config.model;
  } else if (node.config?.queue) {
    subTag = `Queue: ${node.config.queue.split('.').pop()}`;
  } else if (node.config?.exchange) {
    subTag = `AMQP: ${node.config.exchange}`;
  } else if (node.config?.method) {
    subTag = `${node.config.method} Webhook`;
  } else if (node.config?.cron) {
    subTag = node.config.intervalName || node.config.cron;
  } else if (node.config?.operator) {
    subTag = `${node.config.field || 'if'} ${node.config.operator}`;
  } else if (node.config?.channel) {
    subTag = node.config.channel;
  }

  const handlePortMouseDown = (e, outputKey) => {
    e.stopPropagation();
    onStartConnection(node.id, outputKey, e);
  };

  const handlePortUp = (e, inputKey) => {
    e.stopPropagation();
    onPortMouseUp(node.id, inputKey);
  };

  return (
    <div 
      className={`node-card ${isSelected ? 'is-selected' : ''} ${executionStatus === 'running' ? 'is-running' : ''} ${executionStatus === 'success' ? 'is-success' : ''}`}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        borderColor: isCycleNode 
          ? '#ef4444' 
          : isSelected 
          ? category.borderHover 
          : category.borderColor,
        boxShadow: isCycleNode ? '0 0 16px rgba(239, 68, 68, 0.4)' : undefined
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
    >
      <div 
        className="node-header"
        style={{ 
          background: isCycleNode ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.05) 100%)' : category.bgGradient,
          borderBottom: `1px solid ${isCycleNode ? '#ef4444' : category.borderColor}`
        }}
      >
        <div className="node-title-wrap">
          <div 
            className="node-icon-box"
            style={{ 
              background: isCycleNode ? 'rgba(239, 68, 68, 0.3)' : category.glowColor,
              color: isCycleNode ? '#f87171' : category.color,
              border: `1px solid ${isCycleNode ? '#ef4444' : category.borderHover}`
            }}
          >
            <NodeIcon size={16} />
          </div>
          <div className="node-title" title={node.title || nodeDef.name}>
            {node.title || nodeDef.name}
          </div>
        </div>

        <div className="node-actions" onClick={e => e.stopPropagation()}>
          <button 
            className="node-mini-btn" 
            title="Inspect & Edit Parameters"
            onClick={() => onSelect(node)}
          >
            <Sliders size={13} />
          </button>
          <button 
            className="node-mini-btn" 
            title="Duplicate Node"
            onClick={() => onDuplicate(node)}
          >
            <Copy size={13} />
          </button>
          <button 
            className="node-mini-btn btn-delete" 
            title="Delete Node"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="node-body">
        <div className="node-meta-row">
          <span 
            className="node-badge"
            style={{ 
              background: isCycleNode ? 'rgba(239, 68, 68, 0.2)' : category.glowColor, 
              color: isCycleNode ? '#f87171' : category.color,
              border: `1px solid ${isCycleNode ? '#ef4444' : category.borderColor}`
            }}
          >
            {isCycleNode ? 'CYCLE LOOP' : category.badge}
          </span>
          {subTag && (
            <span className="node-pill-tag">
              {subTag}
            </span>
          )}
        </div>

        <div className="node-summary-text">
          {node.config?.systemPrompt 
            ? node.config.systemPrompt 
            : nodeDef.description}
        </div>
      </div>

      {/* Port Handles for Inputs & Outputs */}
      <div className="node-ports-layer" style={{ padding: '0 0 4px 0', minHeight: '28px' }}>
        <div className="ports-column" style={{ left: 0 }}>
          {nodeDef.inputs.map((inp, idx) => (
            <div 
              key={inp}
              className="port-handle port-input"
              style={{ top: `${8 + idx * 22}px` }}
              onMouseUp={(e) => handlePortUp(e, inp)}
              title={`Input: ${inp}`}
            >
              <span className="port-label">{inp}</span>
            </div>
          ))}
        </div>

        <div className="ports-column" style={{ right: 0 }}>
          {nodeDef.outputs.map((out, idx) => (
            <div 
              key={out}
              className="port-handle port-output"
              style={{ top: `${8 + idx * 22}px` }}
              onMouseDown={(e) => handlePortMouseDown(e, out)}
              title={`Output: ${out} (Drag to connect)`}
            >
              <span className="port-label">{out}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="node-status-bar">
        <div className={`status-badge-indicator ${executionStatus || 'idle'}`}>
          {isCycleNode ? (
            <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertOctagon size={11} />
              <span>Cycle Error</span>
            </span>
          ) : executionStatus === 'running' ? (
            <>
              <Loader2 size={11} className="spin-animate" />
              <span>Processing...</span>
            </>
          ) : executionStatus === 'success' ? (
            <>
              <CheckCircle2 size={11} />
              <span>Success</span>
            </>
          ) : (
            <span>Ready</span>
          )}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)' }}>id: {node.id.slice(-4)}</span>
      </div>
    </div>
  );
}
