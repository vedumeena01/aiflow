import React, { useState } from 'react';
import { 
  GitCompare, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  ArrowRight, 
  X, 
  Check, 
  AlertCircle, 
  Boxes, 
  Network,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { computeGraphDiff } from '../utils/graphDiff';

export default function WorkflowDiffModal({
  isOpen,
  onClose,
  baseWorkflow,
  incomingWorkflow,
  onApplyChanges,
  title = 'Visual Workflow Comparison & Diff'
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'nodes' | 'wires'
  const [expandedNodes, setExpandedNodes] = useState({});

  if (!isOpen || !incomingWorkflow) return null;

  const diff = computeGraphDiff(baseWorkflow, incomingWorkflow);

  const toggleNodeExpand = (id) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="modal-backdrop">
      <div 
        className="modal-content"
        style={{
          width: 820,
          maxWidth: '92vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 14,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(99, 102, 241, 0.2)'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div 
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}
            >
              <GitCompare size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                {title}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Comparing <strong style={{ color: '#94a3b8' }}>{diff.baseName}</strong> → <strong style={{ color: '#818cf8' }}>{diff.targetName}</strong>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: 6, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Diff Metrics Bar */}
        <div 
          style={{
            padding: '12px 22px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Diff Summary:</span>
            <span 
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <PlusCircle size={11} /> +{diff.summary.addedNodesCount} Nodes
            </span>
            <span 
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <RefreshCw size={11} /> ~{diff.summary.modifiedNodesCount} Modified
            </span>
            <span 
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <MinusCircle size={11} /> -{diff.summary.removedNodesCount} Removed
            </span>
            <span 
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Network size={11} /> {diff.summary.addedWiresCount > 0 ? `+${diff.summary.addedWiresCount}` : 0} / -{diff.summary.removedWiresCount} Wires
            </span>
          </div>

          {/* Tab Filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setActiveTab('all')}
              className="btn btn-ghost"
              style={{
                padding: '4px 10px',
                fontSize: 11,
                background: activeTab === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeTab === 'all' ? '#c7d2fe' : 'var(--text-secondary)'
              }}
            >
              All Diffs
            </button>
            <button
              onClick={() => setActiveTab('nodes')}
              className="btn btn-ghost"
              style={{
                padding: '4px 10px',
                fontSize: 11,
                background: activeTab === 'nodes' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeTab === 'nodes' ? '#c7d2fe' : 'var(--text-secondary)'
              }}
            >
              Nodes ({diff.summary.addedNodesCount + diff.summary.modifiedNodesCount + diff.summary.removedNodesCount})
            </button>
            <button
              onClick={() => setActiveTab('wires')}
              className="btn btn-ghost"
              style={{
                padding: '4px 10px',
                fontSize: 11,
                background: activeTab === 'wires' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeTab === 'wires' ? '#c7d2fe' : 'var(--text-secondary)'
              }}
            >
              Wires ({diff.summary.addedWiresCount + diff.summary.removedWiresCount})
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div 
          style={{
            flex: 1,
            padding: '18px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          {!diff.hasChanges ? (
            <div 
              style={{
                padding: 30,
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)'
              }}
            >
              <Check size={28} style={{ color: '#10b981', marginBottom: 8 }} />
              <h4 style={{ margin: 0, color: '#f8fafc', fontSize: 15 }}>Workflows Are Identical</h4>
              <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                Both graphs have matching topology, node definitions, and configurations.
              </p>
            </div>
          ) : (
            <>
              {/* Added Nodes */}
              {(activeTab === 'all' || activeTab === 'nodes') && diff.addedNodes.length > 0 && (
                <div>
                  <div 
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 8
                    }}
                  >
                    <PlusCircle size={14} />
                    <span>Added Nodes ({diff.addedNodes.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {diff.addedNodes.map(node => (
                      <div 
                        key={node.id}
                        style={{
                          background: 'rgba(16, 185, 129, 0.06)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '8px 12px',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Boxes size={14} style={{ color: '#34d399' }} />
                          <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: 13 }}>{node.title}</span>
                          <span style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                            {node.type}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>+ ADDED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modified Nodes */}
              {(activeTab === 'all' || activeTab === 'nodes') && diff.modifiedNodes.length > 0 && (
                <div>
                  <div 
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 8
                    }}
                  >
                    <RefreshCw size={14} />
                    <span>Modified Nodes ({diff.modifiedNodes.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {diff.modifiedNodes.map(mod => {
                      const isExpanded = !!expandedNodes[mod.id];
                      return (
                        <div 
                          key={mod.id}
                          style={{
                            background: 'rgba(245, 158, 11, 0.06)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: 8,
                            overflow: 'hidden'
                          }}
                        >
                          <div 
                            onClick={() => toggleNodeExpand(mod.id)}
                            style={{
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              background: 'rgba(0,0,0,0.1)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {isExpanded ? <ChevronDown size={14} style={{ color: '#fbbf24' }} /> : <ChevronRight size={14} style={{ color: '#fbbf24' }} />}
                              <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: 13 }}>{mod.title}</span>
                              <span style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                                {mod.type}
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>
                              ~ {mod.changes.length} change{mod.changes.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          {isExpanded && (
                            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(245, 158, 11, 0.2)', fontSize: 12 }}>
                              {mod.changes.map((ch, idx) => (
                                <div key={idx} style={{ marginBottom: 6 }}>
                                  <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: 3 }}>
                                    {ch.label} ({ch.field}):
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 6, borderRadius: 4, color: '#fca5a5', fontFamily: 'monospace', fontSize: 11 }}>
                                      {typeof ch.from === 'object' ? JSON.stringify(ch.from) : String(ch.from || '(empty)')}
                                    </div>
                                    <ArrowRight size={12} style={{ color: '#94a3b8' }} />
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 6, borderRadius: 4, color: '#86efac', fontFamily: 'monospace', fontSize: 11 }}>
                                      {typeof ch.to === 'object' ? JSON.stringify(ch.to) : String(ch.to || '(empty)')}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Removed Nodes */}
              {(activeTab === 'all' || activeTab === 'nodes') && diff.removedNodes.length > 0 && (
                <div>
                  <div 
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 8
                    }}
                  >
                    <MinusCircle size={14} />
                    <span>Removed Nodes ({diff.removedNodes.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {diff.removedNodes.map(node => (
                      <div 
                        key={node.id}
                        style={{
                          background: 'rgba(239, 68, 68, 0.06)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '8px 12px',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Boxes size={14} style={{ color: '#f87171' }} />
                          <span style={{ fontWeight: 600, color: '#fca5a5', fontSize: 13, textDecoration: 'line-through' }}>{node.title}</span>
                          <span style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                            {node.type}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>- REMOVED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wire Connections Diff */}
              {(activeTab === 'all' || activeTab === 'wires') && (diff.addedConnections.length > 0 || diff.removedConnections.length > 0) && (
                <div>
                  <div 
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 8
                    }}
                  >
                    <Network size={14} />
                    <span>Wire Routing Changes</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {diff.addedConnections.map(c => (
                      <div 
                        key={c.id || `${c.fromNodeId}->${c.toNodeId}`}
                        style={{
                          background: 'rgba(16, 185, 129, 0.06)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '6px 12px',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12
                        }}
                      >
                        <span style={{ color: '#86efac', fontFamily: 'monospace' }}>
                          + Wire: {c.fromNodeId} → {c.toNodeId}
                        </span>
                        <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>CONNECTED</span>
                      </div>
                    ))}
                    {diff.removedConnections.map(c => (
                      <div 
                        key={c.id || `${c.fromNodeId}->${c.toNodeId}`}
                        style={{
                          background: 'rgba(239, 68, 68, 0.06)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '6px 12px',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12
                        }}
                      >
                        <span style={{ color: '#fca5a5', fontFamily: 'monospace', textDecoration: 'line-through' }}>
                          - Wire: {c.fromNodeId} → {c.toNodeId}
                        </span>
                        <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>DISCONNECTED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div 
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <button 
            onClick={onClose}
            className="btn btn-ghost"
            style={{ fontSize: 13 }}
          >
            Keep Current Canvas
          </button>

          <button 
            onClick={() => {
              onApplyChanges(incomingWorkflow);
              onClose();
            }}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Check size={15} />
            <span>Apply Incoming Workflow</span>
          </button>
        </div>
      </div>
    </div>
  );
}
