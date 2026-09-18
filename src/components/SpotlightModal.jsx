import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Boxes, 
  PlusCircle, 
  Terminal, 
  ArrowRight, 
  Zap, 
  Command, 
  X,
  Bot,
  GitBranch,
  Send,
  Sliders
} from 'lucide-react';
import { searchSpotlight } from '../utils/spotlightSearch';

export default function SpotlightModal({
  isOpen = false,
  onClose,
  nodes = [],
  onSelectNode,
  onAddPaletteNode,
  onRunAction
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'node' | 'palette' | 'action'
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setFilterType('all');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const rawResults = searchSpotlight({ query, nodes });
  const results = filterType === 'all' 
    ? rawResults 
    : rawResults.filter(r => r.itemType === filterType);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1 < results.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : Math.max(0, results.length - 1)));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          handleExecuteItem(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleExecuteItem = (item) => {
    if (item.itemType === 'node') {
      onSelectNode && onSelectNode(item.id);
    } else if (item.itemType === 'palette') {
      onAddPaletteNode && onAddPaletteNode(item.nodeDef);
    } else if (item.itemType === 'action') {
      onRunAction && onRunAction(item.id);
    }
    onClose();
  };

  const getItemIcon = (item) => {
    if (item.itemType === 'node') {
      if (item.category === 'trigger') return <Zap size={14} style={{ color: '#f59e0b' }} />;
      if (item.category === 'agent') return <Bot size={14} style={{ color: '#818cf8' }} />;
      if (item.category === 'logic') return <GitBranch size={14} style={{ color: '#10b981' }} />;
      return <Send size={14} style={{ color: '#ec4899' }} />;
    }
    if (item.itemType === 'palette') {
      return <PlusCircle size={14} style={{ color: '#38bdf8' }} />;
    }
    return <Command size={14} style={{ color: '#c084fc' }} />;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: 640,
          maxWidth: '92vw',
          maxHeight: '80vh',
          padding: 0,
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 14,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(99, 102, 241, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search Input Bar */}
        <div 
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <Search size={18} style={{ color: '#818cf8', flexShrink: 0 }} />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search nodes, add components, or trigger actions..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: 15,
              fontWeight: 500
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span 
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 600
              }}
            >
              ESC
            </span>
            <button 
              onClick={onClose}
              className="btn btn-ghost"
              style={{ padding: 4, borderRadius: '50%' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div 
          style={{
            padding: '8px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginRight: 4 }}>Filter:</span>
          {[
            { key: 'all', label: 'All Results' },
            { key: 'node', label: `Canvas Nodes (${nodes.length})` },
            { key: 'palette', label: 'Add Node' },
            { key: 'action', label: 'Commands' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setFilterType(tab.key);
                setSelectedIndex(0);
              }}
              style={{
                background: filterType === tab.key ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                color: filterType === tab.key ? '#c7d2fe' : 'var(--text-secondary)',
                border: filterType === tab.key ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          style={{
            flex: 1,
            maxHeight: '52vh',
            overflowY: 'auto',
            padding: '8px'
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Search size={24} style={{ opacity: 0.3, margin: '0 auto 8px auto' }} />
              <div style={{ fontSize: 13 }}>No results found for "{query}"</div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>Try searching by node title, category, or command keyword.</div>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleExecuteItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                    background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                    transition: 'background 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div 
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {getItemIcon(item)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#ffffff' : '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span 
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: item.itemType === 'node' 
                          ? 'rgba(16, 185, 129, 0.15)' 
                          : item.itemType === 'palette'
                          ? 'rgba(56, 189, 248, 0.15)'
                          : 'rgba(168, 85, 247, 0.15)',
                        color: item.itemType === 'node' 
                          ? '#34d399' 
                          : item.itemType === 'palette'
                          ? '#38bdf8'
                          : '#c084fc'
                      }}
                    >
                      {item.itemType === 'node' ? 'Focus Node' : item.itemType === 'palette' ? 'Add Node' : 'Command'}
                    </span>
                    {isSelected && <ArrowRight size={14} style={{ color: '#818cf8' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div 
          style={{
            padding: '8px 18px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-secondary)',
            background: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span><strong style={{ color: '#94a3b8' }}>↑↓</strong> to navigate</span>
            <span><strong style={{ color: '#94a3b8' }}>↵</strong> to select</span>
            <span><strong style={{ color: '#94a3b8' }}>esc</strong> to close</span>
          </div>
          <span>AutoFlow AI Spotlight</span>
        </div>
      </div>
    </div>
  );
}
