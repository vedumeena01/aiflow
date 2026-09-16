import React, { useState, useRef, useMemo } from 'react';
import { Compass, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * AutoFlow AI — High-Density Interactive Canvas Minimap
 * Renders a scaled bird's-eye thumbnail with interactive viewport panning.
 */
export default function Minimap({
  nodes = [],
  connections = [],
  transform = { x: 0, y: 0, zoom: 1 },
  containerRect = null,
  onPanTo = null
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const minimapRef = useRef(null);

  const MAP_WIDTH = 200;
  const MAP_HEIGHT = 130;
  const PADDING = 150;

  // Calculate global graph bounding box
  const bounds = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return { minX: 0, maxX: 1000, minY: 0, maxY: 700, width: 1000, height: 700 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const nx = node.x ?? 0;
      const ny = node.y ?? 0;
      if (nx < minX) minX = nx;
      if (nx + 280 > maxX) maxX = nx + 280;
      if (ny < minY) minY = ny;
      if (ny + 160 > maxY) maxY = ny + 160;
    }

    // Add padding around graph bounds
    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    const width = Math.max(maxX - minX, 600);
    const height = Math.max(maxY - minY, 400);

    return { minX, maxX, minY, maxY, width, height };
  }, [nodes]);

  // Coordinate transformation: World coordinates to Minimap coordinates
  const worldToMinimap = (wx, wy) => {
    const scaleX = MAP_WIDTH / bounds.width;
    const scaleY = MAP_HEIGHT / bounds.height;
    const scale = Math.min(scaleX, scaleY);

    const mx = (wx - bounds.minX) * scale + (MAP_WIDTH - bounds.width * scale) / 2;
    const my = (wy - bounds.minY) * scale + (MAP_HEIGHT - bounds.height * scale) / 2;

    return { x: mx, y: my, scale };
  };

  // Minimap coordinates to World coordinates
  const minimapToWorld = (mx, my) => {
    const scaleX = MAP_WIDTH / bounds.width;
    const scaleY = MAP_HEIGHT / bounds.height;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (MAP_WIDTH - bounds.width * scale) / 2;
    const offsetY = (MAP_HEIGHT - bounds.height * scale) / 2;

    const wx = (mx - offsetX) / scale + bounds.minX;
    const wy = (my - offsetY) / scale + bounds.minY;

    return { x: wx, y: wy };
  };

  // Viewport rectangle calculation
  const viewportRect = useMemo(() => {
    if (!containerRect) return { x: 0, y: 0, width: 0, height: 0 };

    // Visible canvas area in world coordinates
    const worldVisibleLeft = -transform.x / transform.zoom;
    const worldVisibleTop = -transform.y / transform.zoom;
    const worldVisibleWidth = containerRect.width / transform.zoom;
    const worldVisibleHeight = containerRect.height / transform.zoom;

    const topLeft = worldToMinimap(worldVisibleLeft, worldVisibleTop);
    const scale = topLeft.scale;

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: Math.max(worldVisibleWidth * scale, 12),
      height: Math.max(worldVisibleHeight * scale, 8)
    };
  }, [transform, containerRect, bounds]);

  // Handle click on minimap to pan canvas
  const handleMinimapClick = (e) => {
    if (!onPanTo || !minimapRef.current || !containerRect) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const clickMx = e.clientX - rect.left;
    const clickMy = e.clientY - rect.top;

    const targetWorld = minimapToWorld(clickMx, clickMy);

    // Center target world coordinate in viewport
    const nextPanX = containerRect.width / 2 - targetWorld.x * transform.zoom;
    const nextPanY = containerRect.height / 2 - targetWorld.y * transform.zoom;

    onPanTo(Math.round(nextPanX), Math.round(nextPanY));
  };

  const getNodeColor = (type = '') => {
    if (type.includes('trigger') || type.includes('webhook')) return '#38bdf8'; // Sky
    if (type.includes('agent') || type.includes('llm')) return '#818cf8';        // Indigo
    if (type.includes('router') || type.includes('filter') || type.includes('loop')) return '#fbbf24'; // Amber
    if (type.includes('output') || type.includes('publish') || type.includes('slack')) return '#34d399'; // Emerald
    if (type.includes('sandbox') || type.includes('code')) return '#c084fc';     // Purple
    return '#94a3b8'; // Slate
  };

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: 80,
        right: 20,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      {/* Header / Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="btn btn-ghost"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: isCollapsed ? 8 : '8px 8px 0 0',
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 600,
          color: '#c7d2fe',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          marginBottom: isCollapsed ? 0 : -1
        }}
        title={isCollapsed ? 'Show Graph Minimap' : 'Collapse Minimap'}
      >
        <Compass size={13} style={{ color: '#818cf8' }} />
        <span>Minimap ({nodes.length})</span>
        {isCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Minimap Body */}
      {!isCollapsed && (
        <div 
          ref={minimapRef}
          onClick={handleMinimapClick}
          style={{
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
            background: 'rgba(10, 15, 30, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '8px 0 8px 8px',
            overflow: 'hidden',
            position: 'relative',
            cursor: 'crosshair',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6), 0 0 15px rgba(99, 102, 241, 0.15)'
          }}
          title="Click to pan viewport"
        >
          <svg 
            width={MAP_WIDTH} 
            height={MAP_HEIGHT} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          >
            {/* Grid Dots */}
            <pattern id="minimap-grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.75" fill="rgba(255, 255, 255, 0.08)" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#minimap-grid)" />

            {/* Connection Wires */}
            {connections.map((c, i) => {
              const source = nodes.find(n => n.id === (c.fromNodeId || c.fromNode));
              const target = nodes.find(n => n.id === (c.toNodeId || c.toNode));
              if (!source || !target) return null;

              const sPos = worldToMinimap((source.x ?? 0) + 140, (source.y ?? 0) + 75);
              const tPos = worldToMinimap((target.x ?? 0) + 140, (target.y ?? 0) + 75);

              return (
                <line 
                  key={c.id || i}
                  x1={sPos.x}
                  y1={sPos.y}
                  x2={tPos.x}
                  y2={tPos.y}
                  stroke="rgba(99, 102, 241, 0.35)"
                  strokeWidth="1.2"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const pos = worldToMinimap(node.x ?? 0, node.y ?? 0);
              const nw = Math.max(280 * pos.scale, 8);
              const nh = Math.max(150 * pos.scale, 5);
              const color = getNodeColor(node.type);

              return (
                <g key={node.id}>
                  <rect 
                    x={pos.x}
                    y={pos.y}
                    width={nw}
                    height={nh}
                    rx={2}
                    fill={color}
                    fillOpacity="0.85"
                    stroke="#ffffff"
                    strokeOpacity="0.2"
                    strokeWidth="0.5"
                  />
                </g>
              );
            })}

            {/* Viewport Box */}
            <rect 
              x={viewportRect.x}
              y={viewportRect.y}
              width={viewportRect.width}
              height={viewportRect.height}
              rx={3}
              fill="rgba(99, 102, 241, 0.12)"
              stroke="#818cf8"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
