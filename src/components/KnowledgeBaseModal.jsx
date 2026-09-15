import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  Check, 
  Sparkles, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { queryKnowledgeBase, chunkText } from '../services/ragService';

export default function KnowledgeBaseModal({
  isOpen,
  onClose,
  node,
  onSaveNodeConfig
}) {
  if (!isOpen || !node) return null;

  const initialDocs = node.config?.documents || [];
  const [documents, setDocuments] = useState(initialDocs);
  const [selectedDocId, setSelectedDocId] = useState(initialDocs[0]?.id || null);

  // New doc form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Semantic test search query
  const [testQuery, setTestQuery] = useState('How are SLA refunds handled?');
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    setDocuments(node.config?.documents || []);
    if (node.config?.documents?.length > 0) {
      setSelectedDocId(node.config.documents[0].id);
    }
  }, [node, isOpen]);

  const handleTestSearch = () => {
    if (!testQuery.trim()) return;
    const res = queryKnowledgeBase({
      documents,
      query: testQuery,
      topK: node.config?.topK || 3,
      similarityThreshold: 0.2
    });
    setSearchResults(res);
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newDoc = {
      id: `doc_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
      title: newTitle.trim(),
      content: newContent.trim()
    };

    const updated = [...documents, newDoc];
    setDocuments(updated);
    setSelectedDocId(newDoc.id);
    setNewTitle('');
    setNewContent('');
    setIsAddingDoc(false);
  };

  const handleDeleteDoc = (docId) => {
    const updated = documents.filter(d => d.id !== docId);
    setDocuments(updated);
    if (selectedDocId === docId) {
      setSelectedDocId(updated[0]?.id || null);
    }
  };

  const handleSaveAndClose = () => {
    onSaveNodeConfig(node.id, {
      ...node.config,
      documents
    });
    onClose();
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId) || null;
  const totalChunks = documents.reduce((acc, d) => acc + chunkText(d.content).length, 0);

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div 
        className="modal-container"
        style={{
          maxWidth: '860px',
          width: '92%',
          height: '80vh',
          maxHeight: '720px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>
                Vector Knowledge Base Manager
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                {documents.length} Documents • {totalChunks} Total Semantic Vector Chunks
              </p>
            </div>
          </div>

          <button className="node-mini-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body Layout: 2 Columns */}
        <div 
          className="modal-body" 
          style={{ 
            display: 'flex', 
            flex: 1, 
            minHeight: 0, 
            padding: 0,
            overflow: 'hidden' 
          }}
        >
          {/* Left Column: Documents List & Add CTA */}
          <div 
            style={{ 
              width: '280px', 
              borderRight: '1px solid rgba(255, 255, 255, 0.08)', 
              display: 'flex', 
              flexDirection: 'column',
              background: 'rgba(9, 13, 22, 0.7)'
            }}
          >
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase' }}>
                Documents ({documents.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddingDoc(true)}
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#818cf8',
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={12} /> Add Doc
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {documents.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.75rem', padding: '16px', textAlign: 'center' }}>
                  No documents in store.
                </div>
              ) : (
                documents.map(doc => {
                  const isSelected = doc.id === selectedDocId;
                  const docChunks = chunkText(doc.content).length;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setIsAddingDoc(false);
                      }}
                      style={{
                        padding: '9px 10px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        border: isSelected ? '1px solid #818cf8' : '1px solid transparent',
                        cursor: 'pointer',
                        marginBottom: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '6px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                          {docChunks} chunks • {doc.content.length} chars
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(doc.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                        title="Delete Document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Test Retrieval Drawer Trigger */}
            <div style={{ padding: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(4, 7, 14, 0.6)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={11} /> Semantic Test Query
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input 
                  type="text"
                  value={testQuery}
                  onChange={e => setTestQuery(e.target.value)}
                  placeholder="Test search..."
                  style={{
                    flex: 1,
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    fontSize: '0.72rem',
                    padding: '4px 6px'
                  }}
                />
                <button
                  type="button"
                  onClick={handleTestSearch}
                  style={{
                    background: '#38bdf8',
                    border: 'none',
                    color: '#000',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Query
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Active Document Viewer or Add Document Form */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '16px 20px', overflowY: 'auto' }}>
            {isAddingDoc ? (
              <form onSubmit={handleAddDocument} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#f8fafc' }}>Add New Knowledge Document</h4>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingDoc(false)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>Document Title</label>
                  <input 
                    type="text"
                    placeholder="E.g., Payment Gateway Troubleshooting Guide"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '8px 10px',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>Document Content (Markdown / Text)</label>
                  <textarea 
                    placeholder="Paste documentation, policies, or knowledge..."
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    rows={10}
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '10px',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    alignSelf: 'flex-start',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: '1px solid #818cf8',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save Document & Generate Vectors
                </button>
              </form>
            ) : searchResults ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#38bdf8' }}>
                    Semantic Retrieval Results for "{testQuery}" ({searchResults.retrievedChunks.length} chunks)
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setSearchResults(null)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Close Test
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {searchResults.retrievedChunks.map((chunk, idx) => (
                    <div 
                      key={idx}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: '6px',
                        padding: '10px 12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc' }}>
                          Chunk #{idx + 1} — {chunk.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                          Score: {Math.round(chunk.score * 100)}%
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.4, fontFamily: 'monospace' }}>
                        {chunk.chunkText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedDoc ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc' }}>{selectedDoc.title}</h4>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: {selectedDoc.id}</span>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Document Content:
                  </label>
                  <div 
                    style={{
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      fontSize: '0.82rem',
                      color: '#e2e8f0',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {selectedDoc.content}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <Layers size={13} /> Generated Vector Chunks Preview ({chunkText(selectedDoc.content).length} Chunks):
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {chunkText(selectedDoc.content).map((chunk, i) => (
                      <div 
                        key={i}
                        style={{
                          background: 'rgba(15, 23, 42, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '0.74rem',
                          fontFamily: 'monospace',
                          color: '#94a3b8'
                        }}
                      >
                        <strong style={{ color: '#818cf8' }}>Chunk {i + 1}:</strong> {chunk}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button 
            type="button" 
            className="node-mini-btn" 
            onClick={onClose}
            style={{ padding: '6px 14px', borderRadius: '6px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid #34d399',
              color: '#ffffff',
              padding: '7px 20px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Check size={14} /> Save & Apply Knowledge Base
          </button>
        </div>
      </div>
    </div>
  );
}
