/**
 * Graph Validation & Cycle Detection Utility (Kahn's Algorithm / DFS)
 */

export function validateGraph(nodes, connections) {
  const errors = [];
  const warnings = [];

  if (!nodes || nodes.length === 0) {
    return { isValid: true, errors, warnings, cycles: [] };
  }

  // 1. Build adjacency list and in-degree map
  const adjList = new Map();
  const inDegree = new Map();
  const nodeMap = new Map();

  nodes.forEach(node => {
    adjList.set(node.id, []);
    inDegree.set(node.id, 0);
    nodeMap.set(node.id, node);
  });

  const validConnections = [];
  connections.forEach(conn => {
    // Check for dangling connection references
    if (!nodeMap.has(conn.fromNode) || !nodeMap.has(conn.toNode)) {
      warnings.push(`Connection ${conn.id} references non-existent node.`);
      return;
    }
    validConnections.push(conn);
    adjList.get(conn.fromNode).push(conn.toNode);
    inDegree.set(conn.toNode, (inDegree.get(conn.toNode) || 0) + 1);
  });

  // 2. Cycle Detection using Kahn's Algorithm
  const queue = [];
  inDegree.forEach((deg, nodeId) => {
    if (deg === 0) queue.push(nodeId);
  });

  let processedCount = 0;
  const processedNodes = new Set();

  while (queue.length > 0) {
    const curr = queue.shift();
    processedCount++;
    processedNodes.add(curr);

    const neighbors = adjList.get(curr) || [];
    for (const neighbor of neighbors) {
      const newDeg = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  const hasCycle = processedCount < nodes.length;
  const cycleNodeIds = [];

  if (hasCycle) {
    // Nodes not processed are part of or downstream of a cycle
    nodes.forEach(node => {
      if (!processedNodes.has(node.id)) {
        cycleNodeIds.push(node.id);
      }
    });

    const cycleNames = cycleNodeIds.map(id => nodeMap.get(id)?.title || id).join(' ↔ ');
    errors.push(`Cyclic dependency detected: [${cycleNames}]. Workflows must be a Directed Acyclic Graph (DAG) to execute.`);
  }

  // 3. Check for disconnected triggers
  const triggerNodes = nodes.filter(n => n.type.includes('trigger'));
  if (triggerNodes.length === 0) {
    warnings.push('Workflow has no designated Trigger node. Execution will start from the top-left node.');
  }

  return {
    isValid: !hasCycle,
    errors,
    warnings,
    cycleNodeIds
  };
}

/**
 * Strict Schema Validation for Workflow JSON Import
 */
export function validateWorkflowSchema(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'File content is not a valid JSON object.' };
  }

  if (!Array.isArray(data.nodes)) {
    return { valid: false, error: 'Schema mismatch: Missing or invalid "nodes" array.' };
  }

  // Validate each node
  const nodeIds = new Set();
  for (let i = 0; i < data.nodes.length; i++) {
    const n = data.nodes[i];
    if (!n.id || typeof n.id !== 'string') {
      return { valid: false, error: `Node at index ${i} is missing a valid string "id".` };
    }
    if (nodeIds.has(n.id)) {
      return { valid: false, error: `Duplicate node id "${n.id}" detected in workflow.` };
    }
    nodeIds.add(n.id);

    if (!n.type || typeof n.type !== 'string') {
      return { valid: false, error: `Node "${n.id}" is missing a valid "type".` };
    }

    if (typeof n.x !== 'number' || isNaN(n.x) || typeof n.y !== 'number' || isNaN(n.y)) {
      // Auto-heal missing coordinates to fallback defaults
      n.x = 100 + (i % 5) * 50;
      n.y = 100 + (i % 5) * 50;
    }

    if (!n.config || typeof n.config !== 'object') {
      n.config = {};
    }
  }

  // Validate connections
  const sanitizedConnections = [];
  if (Array.isArray(data.connections)) {
    for (const c of data.connections) {
      if (c && c.fromNode && c.toNode && nodeIds.has(c.fromNode) && nodeIds.has(c.toNode)) {
        sanitizedConnections.push({
          id: c.id || `conn_${Math.random().toString(36).substr(2, 6)}`,
          fromNode: c.fromNode,
          fromOutput: c.fromOutput || 'output',
          toNode: c.toNode,
          toInput: c.toInput || 'input'
        });
      }
    }
  }

  return {
    valid: true,
    sanitizedWorkflow: {
      name: typeof data.name === 'string' ? data.name : 'Imported Workflow',
      nodes: data.nodes,
      connections: sanitizedConnections,
      mockPayload: data.mockPayload && typeof data.mockPayload === 'object' ? data.mockPayload : {}
    }
  };
}
