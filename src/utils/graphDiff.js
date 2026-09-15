/**
 * AutoFlow AI — Visual Graph Diff Engine
 * Computes structural and configuration differences between two workflow graphs.
 */

/**
 * Deep equality check for node configs
 */
function isConfigEqual(a, b) {
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

/**
 * Compares two workflow states and produces a comprehensive diff report.
 * @param {Object} baseWorkflow - Baseline workflow (e.g. current canvas state)
 * @param {Object} targetWorkflow - Incoming/comparison workflow (e.g. from Vault or Import)
 */
export function computeGraphDiff(baseWorkflow, targetWorkflow) {
  const baseNodes = Array.isArray(baseWorkflow?.nodes) ? baseWorkflow.nodes : [];
  const targetNodes = Array.isArray(targetWorkflow?.nodes) ? targetWorkflow.nodes : [];

  const baseConnections = Array.isArray(baseWorkflow?.connections) ? baseWorkflow.connections : [];
  const targetConnections = Array.isArray(targetWorkflow?.connections) ? targetWorkflow.connections : [];

  const baseName = baseWorkflow?.name || 'Current Canvas';
  const targetName = targetWorkflow?.name || 'Incoming Workflow';
  const nameChanged = baseName !== targetName;

  const baseNodeMap = new Map(baseNodes.map(n => [n.id, n]));
  const targetNodeMap = new Map(targetNodes.map(n => [n.id, n]));

  // Categorize nodes
  const addedNodes = [];
  const removedNodes = [];
  const modifiedNodes = [];
  const unchangedNodes = [];

  // Find added and modified
  for (const [id, targetNode] of targetNodeMap.entries()) {
    if (!baseNodeMap.has(id)) {
      addedNodes.push(targetNode);
    } else {
      const baseNode = baseNodeMap.get(id);
      const changes = [];

      if (baseNode.title !== targetNode.title) {
        changes.push({
          field: 'title',
          label: 'Node Title',
          from: baseNode.title,
          to: targetNode.title
        });
      }

      if (baseNode.type !== targetNode.type) {
        changes.push({
          field: 'type',
          label: 'Node Type',
          from: baseNode.type,
          to: targetNode.type
        });
      }

      if (!isConfigEqual(baseNode.config, targetNode.config)) {
        changes.push({
          field: 'config',
          label: 'Configuration Parameters',
          from: baseNode.config,
          to: targetNode.config
        });
      }

      if (changes.length > 0) {
        modifiedNodes.push({
          id,
          title: targetNode.title || baseNode.title,
          type: targetNode.type || baseNode.type,
          baseNode,
          targetNode,
          changes
        });
      } else {
        unchangedNodes.push(targetNode);
      }
    }
  }

  // Find removed
  for (const [id, baseNode] of baseNodeMap.entries()) {
    if (!targetNodeMap.has(id)) {
      removedNodes.push(baseNode);
    }
  }

  // Categorize connections
  // A connection is uniquely identified by its wire tuple: `${fromNodeId}->${toNodeId}`
  const baseConnKeyMap = new Map(
    baseConnections.map(c => [`${c.fromNodeId}->${c.toNodeId}`, c])
  );
  const targetConnKeyMap = new Map(
    targetConnections.map(c => [`${c.fromNodeId}->${c.toNodeId}`, c])
  );

  const addedConnections = [];
  const removedConnections = [];
  const unchangedConnections = [];

  for (const [key, conn] of targetConnKeyMap.entries()) {
    if (!baseConnKeyMap.has(key)) {
      addedConnections.push(conn);
    } else {
      unchangedConnections.push(conn);
    }
  }

  for (const [key, conn] of baseConnKeyMap.entries()) {
    if (!targetConnKeyMap.has(key)) {
      removedConnections.push(conn);
    }
  }

  const hasChanges = (
    nameChanged ||
    addedNodes.length > 0 ||
    removedNodes.length > 0 ||
    modifiedNodes.length > 0 ||
    addedConnections.length > 0 ||
    removedConnections.length > 0
  );

  return {
    hasChanges,
    baseName,
    targetName,
    nameChanged,
    summary: {
      addedNodesCount: addedNodes.length,
      removedNodesCount: removedNodes.length,
      modifiedNodesCount: modifiedNodes.length,
      unchangedNodesCount: unchangedNodes.length,
      addedWiresCount: addedConnections.length,
      removedWiresCount: removedConnections.length,
      totalChanges: addedNodes.length + removedNodes.length + modifiedNodes.length + addedConnections.length + removedConnections.length
    },
    addedNodes,
    removedNodes,
    modifiedNodes,
    unchangedNodes,
    addedConnections,
    removedConnections,
    unchangedConnections
  };
}
