import React, { useState, useMemo, useRef } from 'react';
import { 
  FolderKanban, 
  Search, 
  Sparkles, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Clock, 
  Tag, 
  Layers, 
  FileJson, 
  AlertCircle,
  Play,
  Save,
  ShieldCheck
} from 'lucide-react';
import { 
  getVaultWorkflows, 
  saveWorkflowToVault, 
  deleteWorkflowFromVault, 
  duplicateWorkflowInVault, 
  exportWorkflowPackage, 
  parseAndValidateWorkflowFile 
} from '../services/workflowStorage';
import { PREBUILT_TEMPLATES } from '../data/templates';

export default function WorkflowVaultModal({
  isOpen,
  onClose,
  currentWorkflowState, // { workflowName, nodes, connections, mockPayload }
  onLoadWorkflow,
  onNotification
}) {
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'templates' | 'save_current' | 'import'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [savedWorkflows, setSavedWorkflows] = useState(() => getVaultWorkflows());
  
  // Save Current Form state
  const [saveName, setSaveName] = useState(currentWorkflowState?.workflowName || '');
  const [saveDesc, setSaveDesc] = useState('');
  const [saveTags, setSaveTags] = useState('Production, Custom');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Import State
  const [importedPreview, setImportedPreview] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  // Refresh workflows list
  const refreshList = () => {
    setSavedWorkflows(getVaultWorkflows());
  };

  // Filtered saved workflows
  const filteredWorkflows = useMemo(() => {
    return savedWorkflows.filter(wf => {
      const matchesSearch = 
        wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wf.description && wf.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (wf.tags && wf.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesTag = selectedTag === 'ALL' || (wf.tags && wf.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    });
  }, [savedWorkflows, searchQuery, selectedTag]);

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    savedWorkflows.forEach(w => {
      if (Array.isArray(w.tags)) w.tags.forEach(t => set.add(t));
    });
    return ['ALL', ...Array.from(set)];
  }, [savedWorkflows]);

  if (!isOpen) return null;

  // Handlers
  const handleSaveCurrent = (e) => {
    e.preventDefault();
    if (!saveName.trim()) return;

    setIsSaving(true);
    try {
      const tagsArray = saveTags.split(',').map(t => t.trim()).filter(Boolean);
      const saved = saveWorkflowToVault({
        name: saveName,
        description: saveDesc,
        tags: tagsArray,
        nodes: currentWorkflowState.nodes,
        connections: currentWorkflowState.connections,
        mockPayload: currentWorkflowState.mockPayload
      });

      refreshList();
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('saved');
      }, 1000);
      onNotification?.(`Workflow "${saved.name}" successfully saved to Vault!`);
    } catch (err) {
      alert(`Failed to save workflow: ${err.message}`);
      setIsSaving(false);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from your vault?`)) {
      deleteWorkflowFromVault(id);
      refreshList();
      onNotification?.(`Deleted "${name}" from vault.`);
    }
  };

  const handleDuplicate = (id) => {
    try {
      const dup = duplicateWorkflowInVault(id);
      refreshList();
      onNotification?.(`Created copy "${dup.name}".`);
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  const handleExport = (wf) => {
    exportWorkflowPackage(wf);
    onNotification?.(`Exported "${wf.name}.autoflow.json"`);
  };

  const handleLoad = (wf) => {
    onLoadWorkflow(wf);
    onClose();
    onNotification?.(`Loaded "${wf.name}" into canvas.`);
  };

  const handleFileDropOrSelect = (file) => {
    if (!file) return;
    setImportError(null);
    setImportedPreview(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      const res = parseAndValidateWorkflowFile(content);
      if (!res.valid) {
        setImportError(res.error);
      } else {
        setImportedPreview(res.workflow);
      }
    };
    reader.onerror = () => setImportError('Failed to read selected file.');
    reader.readAsText(file);
  };

  const handleCommitImport = (targetAction = 'load') => {
    if (!importedPreview) return;

    if (targetAction === 'vault') {
      saveWorkflowToVault(importedPreview);
      refreshList();
      setActiveTab('saved');
      onNotification?.(`Imported and saved "${importedPreview.name}" to vault.`);
    } else {
      onLoadWorkflow(importedPreview);
      onClose();
      onNotification?.(`Imported "${importedPreview.name}" directly to canvas.`);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 960,
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: 'rgba(13, 17, 23, 0.96)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div 
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)'
              }}
            >
              <FolderKanban size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Enterprise Workflow Vault
                </h2>
                <span 
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.4)'
                  }}
                >
                  PERSISTENT STORAGE
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                Manage saved multi-agent pipelines, import .autoflow.json bundles, and switch enterprise templates.
              </p>
            </div>
          </div>

          <button 
            className="btn btn-ghost" 
            onClick={onClose}
            style={{ padding: '6px 10px', color: '#94a3b8' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div 
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0 24px',
            gap: 8
          }}
        >
          <button
            onClick={() => setActiveTab('saved')}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'saved' ? '2px solid #818cf8' : '2px solid transparent',
              color: activeTab === 'saved' ? '#f8fafc' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FolderKanban size={15} />
            <span>Saved Workflows</span>
            <span 
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1'
              }}
            >
              {savedWorkflows.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'templates' ? '2px solid #818cf8' : '2px solid transparent',
              color: activeTab === 'templates' ? '#f8fafc' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Sparkles size={15} style={{ color: '#fbbf24' }} />
            <span>Prebuilt Templates</span>
            <span 
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 10,
                background: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24'
              }}
            >
              {PREBUILT_TEMPLATES.length}
            </span>
          </button>

          <button
            onClick={() => {
              setSaveName(currentWorkflowState?.workflowName || '');
              setActiveTab('save_current');
            }}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'save_current' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'save_current' ? '#34d399' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Save size={15} style={{ color: '#10b981' }} />
            <span>Save Current Canvas</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'import' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'import' ? '#38bdf8' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Upload size={15} style={{ color: '#38bdf8' }} />
            <span>Import Package</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {/* --- TAB: SAVED WORKFLOWS --- */}
          {activeTab === 'saved' && (
            <div>
              {/* Search & Tag Toolbar */}
              <div 
                style={{
                  display: 'flex',
                  gap: 12,
                  marginBottom: 18,
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <div 
                  style={{
                    position: 'relative',
                    flex: 1,
                    minWidth: 260
                  }}
                >
                  <Search 
                    size={15} 
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }} 
                  />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search workflows by name, tags, or description..."
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      color: '#f8fafc',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Filter tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: selectedTag === tag ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        color: selectedTag === tag ? '#a5b4fc' : 'var(--text-muted)',
                        border: selectedTag === tag ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Workflows */}
              {filteredWorkflows.length === 0 ? (
                <div 
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 12,
                    border: '1px dashed var(--border-subtle)'
                  }}
                >
                  <FolderKanban size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>No workflows found</p>
                  <p style={{ margin: '4px 0 16px', fontSize: 12 }}>Try adjusting your search filter or save your current canvas.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('save_current')}
                    style={{ fontSize: 12 }}
                  >
                    <Plus size={14} />
                    <span>Save Current Workflow</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
                  {filteredWorkflows.map(wf => (
                    <div 
                      key={wf.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      }}
                    >
                      <div>
                        {/* Title & Version */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                            {wf.name}
                          </h3>
                          <span 
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: wf.isPreset ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                              color: wf.isPreset ? '#fbbf24' : '#818cf8',
                              border: `1px solid ${wf.isPreset ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {wf.isPreset ? 'ENTERPRISE PRESET' : `v${wf.version || '1.0.0'}`}
                          </span>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                          {wf.description || 'Enterprise agentic workflow pipeline.'}
                        </p>

                        {/* Badges */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          <span 
                            style={{
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              color: '#94a3b8',
                              background: 'rgba(255, 255, 255, 0.04)',
                              padding: '2px 8px',
                              borderRadius: 4
                            }}
                          >
                            <Layers size={12} style={{ color: '#818cf8' }} />
                            {wf.nodes?.length || wf.nodeCount || 0} Nodes
                          </span>
                          <span 
                            style={{
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              color: '#94a3b8',
                              background: 'rgba(255, 255, 255, 0.04)',
                              padding: '2px 8px',
                              borderRadius: 4
                            }}
                          >
                            <Clock size={12} style={{ color: '#10b981' }} />
                            {new Date(wf.updatedAt || Date.now()).toLocaleDateString()}
                          </span>
                          {Array.isArray(wf.tags) && wf.tags.slice(0, 3).map((tag, idx) => (
                            <span 
                              key={idx}
                              style={{
                                fontSize: 10,
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: '#a5b4fc',
                                padding: '2px 6px',
                                borderRadius: 4,
                                border: '1px solid rgba(99, 102, 241, 0.2)'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div 
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: 12,
                          marginTop: 4
                        }}
                      >
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '5px 8px', fontSize: 11, color: '#38bdf8' }}
                            onClick={() => handleExport(wf)}
                            title="Export as .autoflow.json package"
                          >
                            <Download size={13} />
                            <span>Export</span>
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '5px 8px', fontSize: 11, color: '#94a3b8' }}
                            onClick={() => handleDuplicate(wf.id)}
                            title="Duplicate workflow in vault"
                          >
                            <Copy size={13} />
                          </button>
                          {!wf.isPreset && (
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '5px 8px', fontSize: 11, color: '#ef4444' }}
                              onClick={() => handleDelete(wf.id, wf.name)}
                              title="Delete from vault"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <button
                          className="btn btn-primary"
                          style={{
                            padding: '6px 14px',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                          onClick={() => handleLoad(wf)}
                        >
                          <Play size={12} fill="white" />
                          <span>Load to Canvas</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- TAB: ENTERPRISE TEMPLATES --- */}
          {activeTab === 'templates' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
              {PREBUILT_TEMPLATES.map(tmpl => (
                <div 
                  key={tmpl.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: 10,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                        {tmpl.name}
                      </h3>
                      <span 
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'rgba(251, 191, 36, 0.15)',
                          color: '#fbbf24',
                          border: '1px solid rgba(251, 191, 36, 0.3)'
                        }}
                      >
                        {tmpl.tag}
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                      {tmpl.description}
                    </p>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      <span 
                        style={{
                          fontSize: 11,
                          color: '#cbd5e1',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 8px',
                          borderRadius: 4
                        }}
                      >
                        ⚡ {tmpl.nodes.length} Configured Nodes
                      </span>
                      <span 
                        style={{
                          fontSize: 11,
                          color: '#cbd5e1',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 8px',
                          borderRadius: 4
                        }}
                      >
                        🔗 {tmpl.connections.length} Directed Wires
                      </span>
                    </div>
                  </div>

                  <div 
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: 12
                    }}
                  >
                    <button
                      className="btn btn-primary"
                      style={{
                        padding: '6px 14px',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      onClick={() => handleLoad(tmpl)}
                    >
                      <Play size={12} fill="white" />
                      <span>Instantiate Template</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- TAB: SAVE CURRENT WORKFLOW --- */}
          {activeTab === 'save_current' && (
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div 
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  padding: 24
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0' }}>
                  Save Active Canvas to Vault
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                  Persist your configured nodes, topological connections, and mock payloads into the local storage vault.
                </p>

                {/* Canvas Summary Pill */}
                <div 
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-around',
                    marginBottom: 20
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#818cf8' }}>
                      {currentWorkflowState.nodes?.length || 0}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nodes</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                      {currentWorkflowState.connections?.length || 0}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Connections</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>
                      {Object.keys(currentWorkflowState.mockPayload || {}).length}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Payload Keys</div>
                  </div>
                </div>

                <form onSubmit={handleSaveCurrent}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                      Workflow Name *
                    </label>
                    <input 
                      type="text"
                      required
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      placeholder="e.g. Multi-Agent Customer Support Pipeline"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        color: '#f8fafc',
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                      Description
                    </label>
                    <textarea 
                      rows={3}
                      value={saveDesc}
                      onChange={e => setSaveDesc(e.target.value)}
                      placeholder="Describe what this pipeline does, SLA requirements, or agent objectives..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        color: '#f8fafc',
                        fontSize: 13,
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                      Tags (comma separated)
                    </label>
                    <input 
                      type="text"
                      value={saveTags}
                      onChange={e => setSaveTags(e.target.value)}
                      placeholder="e.g. Production, RAG, Financial, RabbitMQ"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        color: '#f8fafc',
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setActiveTab('saved')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || saveSuccess}
                      className="btn btn-primary"
                      style={{
                        padding: '8px 20px',
                        background: saveSuccess ? '#10b981' : undefined
                      }}
                    >
                      {saveSuccess ? (
                        <>
                          <Check size={14} />
                          <span>Saved Successfully!</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          <span>{isSaving ? 'Saving...' : 'Save to Vault'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* --- TAB: IMPORT PACKAGE --- */}
          {activeTab === 'import' && (
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <div 
                style={{
                  border: '2px dashed rgba(99, 102, 241, 0.4)',
                  borderRadius: 12,
                  padding: 36,
                  textAlign: 'center',
                  background: 'rgba(99, 102, 241, 0.04)',
                  cursor: 'pointer',
                  marginBottom: 20
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileDropOrSelect(file);
                }}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".json,.autoflow.json"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileDropOrSelect(file);
                    e.target.value = '';
                  }}
                />
                <FileJson size={40} style={{ color: '#818cf8', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
                  Drop your .autoflow.json or standard JSON workflow here
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Supports both AutoFlow packages and raw graph definitions.
                </p>
              </div>

              {/* Error feedback */}
              {importError && (
                <div 
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 20,
                    fontSize: 13
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview on Valid Import */}
              {importedPreview && (
                <div 
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 20
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#34d399' }}>
                    <ShieldCheck size={18} />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Package Schema Verified</span>
                  </div>

                  <h4 style={{ fontSize: 16, color: '#f8fafc', margin: '0 0 6px' }}>
                    {importedPreview.name}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
                    {importedPreview.description}
                  </p>

                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>
                      Nodes: {importedPreview.nodes?.length || 0}
                    </span>
                    <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>
                      Connections: {importedPreview.connections?.length || 0}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleCommitImport('vault')}
                      style={{ color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                    >
                      <Save size={14} />
                      <span>Save to Vault</span>
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleCommitImport('load')}
                    >
                      <Play size={14} fill="white" />
                      <span>Load into Canvas Now</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
