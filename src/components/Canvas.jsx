import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Layers,
  AlertTriangle,
  LayoutGrid,
  Filter
} from 'lucide-react';
import NodeCard from './NodeCard';
import Minimap from './Minimap';
import { NODE_DEFINITIONS } from '../data/nodeDefinitions';

export default function Canvas({
  nodes,
  connections,
  selectedNodeId,
  executionStates, // { [nodeId]: 'idle' | 'running' | 'success' }
  activeWireIds,   // Set or Array of active connection ids
  cycleNodeIds,    // Array of node IDs involved in a cycle
  onSelectNode,
  onUpdateNodePosition,
  onAddNodeAtPosition,
  onDeleteNode,
  onDuplicateNode,
  onToggleBreakpoint,
  onCreateConnection,
  onDeleteConnection,
  onLoadSampleTemplate,
  onAutoLayout,
  nodeMetrics = {},
  focusNodeId = null,
  activeCategoryFilter = 'all',
  onSelectCategoryFilter = null
}) {
  const containerRef = useRef(null);
  
  // Viewport transformation: pan and zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Dragging state
  const [draggingNode, setDraggingNode] = useState(null);

  // Connection Dragging state
  const [connecting, setConnecting] = useState(null);

  // Hovered connection for delete action
  const [hoveredWireId, setHoveredWireId] = useState(null);

  // Zoom controls
  const handleZoom = (delta) => {
    setTransform(prev => {
      const nextZoom = Math.min(Math.max(prev.zoom + delta, 0.4), 1.8);
      return { ...prev, zoom: Number(nextZoom.toFixed(2)) };
    });
  };

  const handleResetZoom = () => {
    setTransform({ x: 0, y: 0, zoom: 1 });
  };

  const handleFitToView = () => {
    if (nodes.length === 0) {
      setTransform({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + 280));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y + 160));

    const padding = 80;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    const zoomX = container.width / width;
    const zoomY = container.height / height;
    const zoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.5), 1.2);

    const x = (container.width - (maxX + minX) * zoom) / 2;
    const y = (container.height - (maxY + minY) * zoom) / 2;

    setTransform({ x: Math.round(x), y: Math.round(y), zoom: Number(zoom.toFixed(2)) });
  };

  // Center camera over focusNodeId when triggered via Spotlight Search
  useEffect(() => {
    if (!focusNodeId) return;
    const targetNode = nodes.find(n => n.id === focusNodeId);
    if (!targetNode || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const targetX = container.width / 2 - (targetNode.x + 140) * transform.zoom;
    const targetY = container.height / 2 - (targetNode.y + 80) * transform.zoom;

    setTransform(prev => ({
      ...prev,
      x: Math.round(targetX),
      y: Math.round(targetY)
    }));
  }, [focusNodeId, nodes]);

  // Wheel zoom
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
      handleZoom(zoomDelta);
    } else {
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (e.target === containerRef.current || e.target.classList.contains('canvas-viewport') || e.target.tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      onSelectNode(null);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
      return;
    }

    if (draggingNode) {
      const dx = (e.clientX - draggingNode.startMouseX) / transform.zoom;
      const dy = (e.clientY - draggingNode.startMouseY) / transform.zoom;
      const newX = Math.round(draggingNode.startNodeX + dx);
      const newY = Math.round(draggingNode.startNodeY + dy);
      onUpdateNodePosition(draggingNode.id, newX, newY);
      return;
    }

    if (connecting) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasX = (e.clientX - rect.left - transform.x) / transform.zoom;
      const canvasY = (e.clientY - rect.top - transform.y) / transform.zoom;
      setConnecting(prev => ({ ...prev, mouseX: canvasX, mouseY: canvasY }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
    if (connecting) {
      setConnecting(null);
    }
  };

  // Start dragging node
  const handleNodeMouseDown = (node, e) => {
    setDraggingNode({
      id: node.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: node.x,
      startNodeY: node.y
    });
  };

  // Start drawing connection
  const handleStartConnection = (fromNodeId, fromOutputKey, e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasX = (e.clientX - rect.left - transform.x) / transform.zoom;
    const canvasY = (e.clientY - rect.top - transform.y) / transform.zoom;
    setConnecting({
      fromNode: fromNodeId,
      fromOutput: fromOutputKey,
      mouseX: canvasX,
      mouseY: canvasY
    });
  };

  // Finish connection on port mouse up
  const handlePortMouseUp = (toNodeId, toInputKey) => {
    if (connecting && connecting.fromNode !== toNodeId) {
      onCreateConnection(connecting.fromNode, connecting.fromOutput, toNodeId, toInputKey);
    }
    setConnecting(null);
  };

  // Drag and Drop from Sidebar
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/autoflow-node');
    if (!dataStr) return;
    try {
      const nodeDef = JSON.parse(dataStr);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const dropX = (e.clientX - rect.left - transform.x) / transform.zoom - 135;
      const dropY = (e.clientY - rect.top - transform.y) / transform.zoom - 60;
      onAddNodeAtPosition(nodeDef, Math.round(dropX), Math.round(dropY));
    } catch (err) {
      console.error('Error dropping node', err);
    }
  };

  // Calculate Bezier curve between ports
  const calculateWirePath = (x1, y1, x2, y2) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    const curvature = Math.max(dx, 40);
    return `M ${x1} ${y1} C ${x1 + curvature} ${y1}, ${x2 - curvature} ${y2}, ${x2} ${y2}`;
  };

  // Get port coordinates
  const getNodePortCoord = (nodeId, portKey, isOutput) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const nodeDef = NODE_DEFINITIONS.find(d => d.type === node.type);
    
    let portIdx = 0;
    if (nodeDef) {
      const ports = isOutput ? nodeDef.outputs : nodeDef.inputs;
      portIdx = Math.max(ports.indexOf(portKey), 0);
    }

    const portY = node.y + 112 + portIdx * 22;
    const portX = isOutput ? node.x + 270 : node.x;
    return { x: portX, y: portY };
  };

  const cycleSet = new Set(cycleNodeIds || []);

  return (
    <div 
      ref={containerRef}
      className="canvas-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Canvas Stats Badge & Alert */}
      <div className="canvas-stats-badge">
        <Layers size={13} style={{ color: '#818cf8' }} />
        <span>Nodes: <strong>{nodes.length}</strong></span>
        <span>Wires: <strong>{connections.length}</strong></span>
        {cycleSet.size > 0 ? (
          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={12} />
            <strong>Loop Error Detected</strong>
          </span>
        ) : (
          <span>DAG: <strong style={{ color: '#10b981' }}>Valid</strong></span>
        )}
      </div>

      {/* Canvas Viewport with Pan/Zoom Transform */}
      <div 
        className="canvas-viewport"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`
        }}
      >
        {/* SVG Cable Connections */}
        <svg className="connections-svg">
          <defs>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Existing Wires */}
          {connections.map(conn => {
            const start = getNodePortCoord(conn.fromNode, conn.fromOutput, true);
            const end = getNodePortCoord(conn.toNode, conn.toInput, false);
            const pathData = calculateWirePath(start.x, start.y, end.x, end.y);
            const isActive = activeWireIds?.includes(conn.id);
            const isCycleWire = cycleSet.has(conn.fromNode) && cycleSet.has(conn.toNode);
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            return (
              <g 
                key={conn.id} 
                className="connection-wire-group"
                onMouseEnter={() => setHoveredWireId(conn.id)}
                onMouseLeave={() => setHoveredWireId(null)}
              >
                <path 
                  d={pathData} 
                  stroke="transparent" 
                  strokeWidth="16" 
                  fill="none" 
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                />

                <path 
                  d={pathData} 
                  className={`connection-wire ${isActive ? 'wire-active' : ''}`}
                  style={isCycleWire ? { stroke: '#ef4444', strokeDasharray: '6 4' } : {}}
                />

                {isActive && (
                  <circle r="4.5" fill="#38bdf8" filter="url(#glowEffect)">
                    <animateMotion 
                      path={pathData} 
                      dur="1.2s" 
                      repeatCount="indefinite" 
                    />
                  </circle>
                )}

                <g 
                  className="wire-delete-btn"
                  transform={`translate(${midX}, ${midY})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConnection(conn.id);
                  }}
                >
                  <circle r="11" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="4" y1="-4" x2="-4" y2="4" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                </g>
              </g>
            );
          })}

          {connecting && (
            (() => {
              const start = getNodePortCoord(connecting.fromNode, connecting.fromOutput, true);
              const pathData = calculateWirePath(start.x, start.y, connecting.mouseX, connecting.mouseY);
              return (
                <path 
                  d={pathData} 
                  stroke="#818cf8" 
                  strokeWidth="2.5" 
                  strokeDasharray="6 4" 
                  fill="none" 
                />
              );
            })()
          )}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const nodeDef = NODE_DEFINITIONS.find(d => d.type === node.type);
          const isDimmed = activeCategoryFilter !== 'all' && (
            activeCategoryFilter === 'cycle'
              ? !cycleSet.has(node.id)
              : nodeDef?.category !== activeCategoryFilter
          );

          return (
            <div 
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(node, e)}
              style={{
                opacity: isDimmed ? 0.25 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isDimmed ? 'none' : 'auto'
              }}
            >
              <NodeCard 
                node={node}
                isSelected={selectedNodeId === node.id}
                executionStatus={executionStates[node.id] || 'idle'}
                isCycleNode={cycleSet.has(node.id)}
                onSelect={onSelectNode}
                onDelete={onDeleteNode}
                onDuplicate={onDuplicateNode}
                onToggleBreakpoint={onToggleBreakpoint}
                onStartConnection={handleStartConnection}
                onPortMouseUp={handlePortMouseUp}
                metrics={nodeMetrics[node.id] || null}
              />
            </div>
          );
        })}

        {/* Empty Canvas Quick Launcher Guide */}
        {nodes.length === 0 && (
          <div 
            style={{
              position: 'absolute',
              left: 450,
              top: 240,
              transform: 'translate(-50%, -50%)',
              background: 'rgba(13, 17, 23, 0.94)',
              border: '1px dashed rgba(99, 102, 241, 0.45)',
              borderRadius: 16,
              padding: '32px 36px',
              textAlign: 'center',
              maxWidth: 460,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.12)',
              pointerEvents: 'auto',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div 
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#818cf8'
              }}
            >
              <Layers size={26} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: '#f8fafc' }}>
              Your Visual Canvas is Empty
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Drag nodes from the left palette onto the grid, or load a pre-configured enterprise workflow template below.
            </p>
            {onLoadSampleTemplate && (
              <button
                className="btn btn-primary"
                onClick={onLoadSampleTemplate}
                style={{
                  padding: '9px 18px',
                  fontSize: 13,
                  margin: '0 auto'
                }}
              >
                ✨ Load Ralph Autonomous Loop Template
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Pills Overlay */}
      {nodes.length > 0 && onSelectCategoryFilter && (
        <div 
          style={{
            position: 'absolute',
            top: 18,
            left: 18,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            padding: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <Filter size={12} style={{ color: 'var(--text-secondary)', marginLeft: 6, marginRight: 2 }} />
          {[
            { id: 'all', label: 'All' },
            { id: 'trigger', label: 'Triggers' },
            { id: 'agent', label: 'Agents' },
            { id: 'logic', label: 'Logic' },
            { id: 'action', label: 'Actions' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCategoryFilter(cat.id)}
              style={{
                background: activeCategoryFilter === cat.id ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: activeCategoryFilter === cat.id ? '#ffffff' : 'var(--text-secondary)',
                border: activeCategoryFilter === cat.id ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: activeCategoryFilter === cat.id ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Floating Canvas Controls Toolbar */}
      <div className="canvas-controls">
        <button 
          className="control-btn" 
          onClick={() => handleZoom(0.15)} 
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <span className="zoom-indicator">{Math.round(transform.zoom * 100)}%</span>
        <button 
          className="control-btn" 
          onClick={() => handleZoom(-0.15)} 
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button 
          className="control-btn" 
          onClick={handleResetZoom} 
          title="Reset Zoom (100%)"
        >
          <RotateCcw size={14} />
        </button>
        <button 
          className="control-btn" 
          onClick={handleFitToView} 
          title="Fit to Screen"
        >
          <Maximize2 size={14} />
        </button>
        <button 
          className="control-btn" 
          onClick={onAutoLayout} 
          title="Auto-Arrange Pipeline (Sugiyama DAG Layout)"
          style={{ color: '#818cf8', borderLeft: '1px solid var(--border-subtle)' }}
        >
          <LayoutGrid size={15} />
        </button>
      </div>

      {/* High-Density Interactive Graph Minimap */}
      <Minimap 
        nodes={nodes}
        connections={connections}
        transform={transform}
        containerRect={containerRef.current?.getBoundingClientRect()}
        onPanTo={(x, y) => setTransform(prev => ({ ...prev, x, y }))}
      />
    </div>
  );
}
