/**
 * AutoFlow AI — Canvas Spotlight Search & Filter Engine
 * Multi-domain search indexing for canvas nodes, palette templates, and quick actions.
 */

import { NODE_DEFINITIONS } from '../data/nodeDefinitions.js';

/**
 * Searches across canvas nodes, available palette catalog, and application commands.
 * 
 * @param {Object} params
 * @param {string} params.query - Search query string
 * @param {Array} params.nodes - Active canvas nodes
 * @param {Array} [params.customActions] - Additional runnable application actions
 * @returns {Array} Ranked list of search result items
 */
export function searchSpotlight({ query = '', nodes = [], customActions = [] }) {
  const q = (query || '').trim().toLowerCase();

  // Predefined Application Commands
  const defaultActions = [
    {
      id: 'action_run',
      title: 'Run Workflow',
      subtitle: 'Execute full multi-agent pipeline DAG',
      category: 'action',
      keyword: 'play run start execute invoke pipeline'
    },
    {
      id: 'action_step_debug',
      title: 'Step Debugger',
      subtitle: 'Step through pipeline execution node-by-node (F10 / F5)',
      category: 'action',
      keyword: 'debug step breakpoint walk pause'
    },
    {
      id: 'action_auto_layout',
      title: 'Auto-Arrange Graph',
      subtitle: 'Format canvas using Sugiyama hierarchical DAG layout',
      category: 'action',
      keyword: 'auto layout clean arrange format columns grid align'
    },
    {
      id: 'action_share',
      title: 'Share Workflow Link',
      subtitle: 'Copy zero-backend shareable permalink to clipboard',
      category: 'action',
      keyword: 'share link url copy collaborate export'
    },
    {
      id: 'action_deploy',
      title: 'Deploy to Cloud',
      subtitle: 'Generate Dockerfile, FastAPI server & cloud deploy guide',
      category: 'action',
      keyword: 'deploy cloud docker container fastapi run fly aws'
    },
    {
      id: 'action_export_json',
      title: 'Export .autoflow.json Package',
      subtitle: 'Download complete workflow package file',
      category: 'action',
      keyword: 'export download save json package envelope'
    },
    {
      id: 'action_vault',
      title: 'Open Workflow Vault',
      subtitle: 'Browse versioned drafts and enterprise templates',
      category: 'action',
      keyword: 'vault templates drafts history versions'
    },
    {
      id: 'action_clear',
      title: 'Clear Canvas',
      subtitle: 'Remove all nodes and connection wires from canvas',
      category: 'action',
      keyword: 'clear reset delete remove canvas empty'
    }
  ];

  const actions = customActions.length > 0 ? customActions : defaultActions;

  // 1. Search Active Canvas Nodes
  const matchedCanvasNodes = [];
  for (const node of nodes) {
    const nodeDef = NODE_DEFINITIONS.find(d => d.type === node.type);
    const title = (node.title || '').toLowerCase();
    const type = (node.type || '').toLowerCase();
    const id = (node.id || '').toLowerCase();
    const category = (nodeDef?.category || '').toLowerCase();
    const defName = (nodeDef?.name || '').toLowerCase();
    const configStr = JSON.stringify(node.config || {}).toLowerCase();

    let score = 0;
    if (!q) {
      score = 1; // Return all when query is empty
    } else {
      if (title === q) score += 100;
      else if (title.startsWith(q)) score += 60;
      else if (title.includes(q)) score += 40;

      if (type.includes(q) || defName.includes(q)) score += 30;
      if (id.includes(q)) score += 25;
      if (category.includes(q)) score += 20;
      if (configStr.includes(q)) score += 15;
    }

    if (score > 0) {
      matchedCanvasNodes.push({
        itemType: 'node',
        id: node.id,
        title: node.title || nodeDef?.name || node.type,
        subtitle: `Canvas Node • ${nodeDef?.name || node.type} • ID: ${node.id.slice(-4)}`,
        category: nodeDef?.category || 'agent',
        score,
        node
      });
    }
  }

  // 2. Search Application Actions
  const matchedActions = [];
  for (const action of actions) {
    const title = action.title.toLowerCase();
    const subtitle = action.subtitle.toLowerCase();
    const kw = (action.keyword || '').toLowerCase();

    let score = 0;
    if (!q) {
      score = 1;
    } else {
      if (title.includes(q)) score += 50;
      else if (kw.includes(q)) score += 35;
      else if (subtitle.includes(q)) score += 20;
    }

    if (score > 0) {
      matchedActions.push({
        itemType: 'action',
        id: action.id,
        title: action.title,
        subtitle: action.subtitle,
        category: 'action',
        score,
        action
      });
    }
  }

  // 3. Search Palette Catalog (Quick Add)
  const matchedPalette = [];
  for (const def of NODE_DEFINITIONS) {
    const name = def.name.toLowerCase();
    const type = def.type.toLowerCase();
    const desc = (def.description || '').toLowerCase();
    const category = def.category.toLowerCase();

    let score = 0;
    if (q) {
      if (name.includes(q)) score += 35;
      else if (type.includes(q)) score += 25;
      else if (desc.includes(q)) score += 15;
      else if (category.includes(q)) score += 10;
    }

    if (score > 0) {
      matchedPalette.push({
        itemType: 'palette',
        id: `palette_${def.type}`,
        title: `Add ${def.name}`,
        subtitle: `Create new node • ${def.description}`,
        category: def.category,
        score,
        nodeDef: def
      });
    }
  }

  // Sort by relevance score
  matchedCanvasNodes.sort((a, b) => b.score - a.score);
  matchedActions.sort((a, b) => b.score - a.score);
  matchedPalette.sort((a, b) => b.score - a.score);

  return [
    ...matchedCanvasNodes,
    ...matchedActions,
    ...matchedPalette
  ];
}

/**
 * Filter nodes by category tag
 */
export function filterNodesByCategory(nodes = [], categoryFilter = 'all') {
  if (!categoryFilter || categoryFilter === 'all') return nodes;

  return nodes.filter(node => {
    const def = NODE_DEFINITIONS.find(d => d.type === node.type);
    return def?.category === categoryFilter;
  });
}
