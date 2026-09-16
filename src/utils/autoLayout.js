/**
 * AutoFlow AI — Sugiyama Hierarchical DAG Auto-Layout Engine
 * Computes deterministic, aesthetic topological column layouts to eliminate spaghetti graphs.
 */

/**
 * Normalizes connection objects to extract source and target IDs
 */
function getEdgeEndpoints(conn) {
  const source = conn.fromNodeId || conn.fromNode || conn.source;
  const target = conn.toNodeId || conn.toNode || conn.target;
  return { source, target };
}

/**
 * Calculates hierarchical layer assignments and coordinates for DAG pipeline graphs.
 * 
 * @param {Array} nodes - Array of workflow nodes
 * @param {Array} connections - Array of directed wire connections
 * @param {Object} options - Configuration overrides
 * @returns {Array} Updated nodes with calculated { x, y } positions
 */
export function applyAutoLayout(nodes = [], connections = [], options = {}) {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];
  if (nodes.length === 1) {
    return [{ ...nodes[0], x: options.startX || 120, y: options.startY || 160 }];
  }

  const {
    nodeWidth = 280,
    nodeHeight = 150,
    layerSpacingX = 140,
    nodeSpacingY = 50,
    startX = 100,
    startY = 120
  } = options;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inEdges = new Map(nodes.map(n => [n.id, []]));
  const outEdges = new Map(nodes.map(n => [n.id, []]));

  // Build adjacency maps
  for (const conn of connections) {
    const { source, target } = getEdgeEndpoints(conn);
    if (nodeMap.has(source) && nodeMap.has(target) && source !== target) {
      outEdges.get(source).push(target);
      inEdges.get(target).push(source);
    }
  }

  // --- Step 1: Layer Assignment (Topological Ranking) ---
  const nodeLayers = new Map();
  const visited = new Set();

  // Root nodes: in-degree === 0 (or trigger nodes)
  const roots = nodes
    .filter(n => (inEdges.get(n.id) || []).length === 0)
    .map(n => n.id);

  // If all nodes have in-degrees > 0 (graph has cycles), pick triggers or first node
  if (roots.length === 0) {
    const trigger = nodes.find(n => n.type?.includes('trigger')) || nodes[0];
    roots.push(trigger.id);
  }

  // Assign layers via Breadth-First / Longest Path
  const queue = roots.map(id => ({ id, layer: 0 }));
  roots.forEach(id => {
    nodeLayers.set(id, 0);
    visited.add(id);
  });

  let safetyCounter = 0;
  const maxIterations = nodes.length * nodes.length + 50;

  while (queue.length > 0 && safetyCounter++ < maxIterations) {
    const { id, layer } = queue.shift();
    const children = outEdges.get(id) || [];

    for (const childId of children) {
      const currentChildLayer = nodeLayers.get(childId) || 0;
      const candidateLayer = layer + 1;

      if (!nodeLayers.has(childId) || candidateLayer > currentChildLayer) {
        nodeLayers.set(childId, candidateLayer);
        queue.push({ id: childId, layer: candidateLayer });
      }
    }
  }

  // Ensure any orphan/disconnected nodes are assigned to a layer
  let unassignedLayer = 0;
  for (const node of nodes) {
    if (!nodeLayers.has(node.id)) {
      nodeLayers.set(node.id, unassignedLayer++);
    }
  }

  // Group nodes by layer index
  const layerBuckets = new Map();
  let maxLayer = 0;

  for (const [id, layer] of nodeLayers.entries()) {
    if (!layerBuckets.has(layer)) layerBuckets.set(layer, []);
    layerBuckets.get(layer).push(id);
    if (layer > maxLayer) maxLayer = layer;
  }

  // --- Step 2: Crossing Minimization (Barycenter Ordering) ---
  for (let l = 1; l <= maxLayer; l++) {
    const currentLayerNodes = layerBuckets.get(l) || [];
    if (currentLayerNodes.length <= 1) continue;

    // Calculate barycenter (average position of predecessor nodes)
    const prevLayerPositions = new Map();
    (layerBuckets.get(l - 1) || []).forEach((id, index) => {
      prevLayerPositions.set(id, index);
    });

    currentLayerNodes.sort((a, b) => {
      const predsA = inEdges.get(a) || [];
      const predsB = inEdges.get(b) || [];

      const avgA = predsA.length > 0
        ? predsA.reduce((sum, p) => sum + (prevLayerPositions.get(p) ?? 0), 0) / predsA.length
        : 0;
      const avgB = predsB.length > 0
        ? predsB.reduce((sum, p) => sum + (prevLayerPositions.get(p) ?? 0), 0) / predsB.length
        : 0;

      return avgA - avgB;
    });
  }

  // --- Step 3: Coordinate Assignment (Balanced Alignment) ---
  // Find maximum column vertical extent to vertically center shorter columns
  let maxColumnHeight = 0;
  for (let l = 0; l <= maxLayer; l++) {
    const count = (layerBuckets.get(l) || []).length;
    const colHeight = count * nodeHeight + Math.max(0, count - 1) * nodeSpacingY;
    if (colHeight > maxColumnHeight) maxColumnHeight = colHeight;
  }

  const updatedNodes = [];

  for (let l = 0; l <= maxLayer; l++) {
    const layerNodeIds = layerBuckets.get(l) || [];
    const count = layerNodeIds.length;
    const colHeight = count * nodeHeight + Math.max(0, count - 1) * nodeSpacingY;
    const verticalOffset = Math.max(0, (maxColumnHeight - colHeight) / 2);

    const x = startX + l * (nodeWidth + layerSpacingX);

    layerNodeIds.forEach((nodeId, idx) => {
      const originalNode = nodeMap.get(nodeId);
      const y = startY + verticalOffset + idx * (nodeHeight + nodeSpacingY);

      updatedNodes.push({
        ...originalNode,
        x: Math.round(x),
        y: Math.round(y)
      });
    });
  }

  return updatedNodes;
}
