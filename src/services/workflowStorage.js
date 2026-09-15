/**
 * AutoFlow AI — Enterprise Workflow Vault & Storage Service
 * Manages local persistent workflow storage, versioning, auto-save drafts,
 * schema validation, and .autoflow.json package export/import.
 */

import { validateWorkflowSchema } from '../utils/graphValidation';
import { PREBUILT_TEMPLATES } from '../data/templates';

const VAULT_STORAGE_KEY = 'autoflow_enterprise_vault_v1';
const DRAFT_STORAGE_KEY = 'autoflow_ai_workflow_v1';

/**
 * Seed initial enterprise workflows into the vault if first run
 */
function getInitialVaultSeed() {
  return PREBUILT_TEMPLATES.map((tmpl, idx) => ({
    id: `vault_preset_${tmpl.id || idx}`,
    name: tmpl.name,
    description: tmpl.description || 'Enterprise multi-agent autonomous workflow pipeline.',
    tags: [tmpl.tag || 'Production', 'Prebuilt', `${tmpl.nodes.length} Nodes`],
    createdAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
    version: '1.0.0',
    nodeCount: tmpl.nodes.length,
    connectionCount: tmpl.connections.length,
    nodes: tmpl.nodes,
    connections: tmpl.connections,
    mockPayload: tmpl.sampleInput || {},
    isPreset: true
  }));
}

/**
 * Retrieve all workflows from the persistent vault
 */
export function getVaultWorkflows() {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) {
      const seed = getInitialVaultSeed();
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const seed = getInitialVaultSeed();
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch (e) {
    console.error('Failed to parse workflow vault storage:', e);
    return getInitialVaultSeed();
  }
}

/**
 * Save or update a workflow in the vault
 */
export function saveWorkflowToVault({
  id,
  name,
  description = '',
  tags = [],
  nodes = [],
  connections = [],
  mockPayload = {}
}) {
  if (!name || name.trim() === '') {
    throw new Error('Workflow name cannot be empty.');
  }

  const workflows = getVaultWorkflows();
  const existingIdx = id ? workflows.findIndex(w => w.id === id) : -1;

  const now = new Date().toISOString();
  const cleanTags = Array.isArray(tags) 
    ? tags.filter(t => typeof t === 'string' && t.trim() !== '') 
    : [typeof tags === 'string' ? tags : 'Custom'];

  if (cleanTags.length === 0) {
    cleanTags.push('Custom', `${nodes.length} Nodes`);
  }

  const workflowRecord = {
    id: id || `wf_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
    name: name.trim(),
    description: description.trim() || 'Custom agentic workflow built in AutoFlow AI Studio.',
    tags: cleanTags,
    createdAt: existingIdx >= 0 ? workflows[existingIdx].createdAt : now,
    updatedAt: now,
    version: existingIdx >= 0 ? incrementVersion(workflows[existingIdx].version) : '1.0.0',
    nodeCount: nodes.length,
    connectionCount: connections.length,
    nodes,
    connections,
    mockPayload,
    isPreset: false
  };

  if (existingIdx >= 0) {
    workflows[existingIdx] = workflowRecord;
  } else {
    workflows.unshift(workflowRecord);
  }

  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(workflows));
  return workflowRecord;
}

/**
 * Delete a workflow by ID from the vault
 */
export function deleteWorkflowFromVault(id) {
  const workflows = getVaultWorkflows();
  const filtered = workflows.filter(w => w.id !== id);
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

/**
 * Duplicate a workflow in the vault
 */
export function duplicateWorkflowInVault(id) {
  const workflows = getVaultWorkflows();
  const target = workflows.find(w => w.id === id);
  if (!target) throw new Error('Target workflow not found in vault.');

  const now = new Date().toISOString();
  const duplicate = {
    ...target,
    id: `wf_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
    name: `${target.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
    version: '1.0.0',
    isPreset: false
  };

  workflows.unshift(duplicate);
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(workflows));
  return duplicate;
}

/**
 * Export workflow as an enterprise .autoflow.json package
 */
export function exportWorkflowPackage(workflow) {
  const exportPayload = {
    $schema: 'https://autoflow.ai/schemas/workflow-v1.json',
    format: 'autoflow-package',
    specVersion: '1.2.0',
    metadata: {
      id: workflow.id || `wf_${Date.now().toString(36)}`,
      name: workflow.name || 'Untitled Pipeline',
      description: workflow.description || 'AutoFlow AI Multi-Agent Pipeline',
      version: workflow.version || '1.0.0',
      exportedAt: new Date().toISOString(),
      tags: workflow.tags || ['AutoFlow', 'Agentic'],
      engine: 'AutoFlow Studio',
      runtimeCompatibility: ['langgraph-python', 'langchain-ts', 'autoflow-sim']
    },
    graph: {
      nodeCount: workflow.nodes?.length || 0,
      connectionCount: workflow.connections?.length || 0,
      nodes: workflow.nodes || [],
      connections: workflow.connections || []
    },
    sampleInput: workflow.mockPayload || {}
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeFilename = (workflow.name || 'workflow')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');

  link.href = url;
  link.download = `${safeFilename}.autoflow.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate incoming .autoflow.json or standard JSON workflow
 */
export function parseAndValidateWorkflowFile(jsonContent) {
  let parsed;
  try {
    parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
  } catch (err) {
    return { valid: false, error: `Invalid JSON syntax: ${err.message}` };
  }

  // Handle standard .autoflow.json package format
  let rawData = parsed;
  if (parsed.format === 'autoflow-package' && parsed.graph) {
    rawData = {
      name: parsed.metadata?.name || 'Imported AutoFlow Package',
      nodes: parsed.graph.nodes || [],
      connections: parsed.graph.connections || [],
      mockPayload: parsed.sampleInput || {}
    };
  }

  const validation = validateWorkflowSchema(rawData);
  if (!validation.valid) {
    return { valid: false, error: validation.error };
  }

  return {
    valid: true,
    workflow: {
      id: parsed.metadata?.id || `wf_${Date.now().toString(36)}`,
      name: validation.sanitizedWorkflow.name,
      description: parsed.metadata?.description || 'Imported agentic pipeline.',
      tags: parsed.metadata?.tags || ['Imported', `${validation.sanitizedWorkflow.nodes.length} Nodes`],
      nodes: validation.sanitizedWorkflow.nodes,
      connections: validation.sanitizedWorkflow.connections,
      mockPayload: validation.sanitizedWorkflow.mockPayload,
      version: parsed.metadata?.version || '1.0.0',
      updatedAt: new Date().toISOString()
    }
  };
}

/**
 * Auto-Save Draft Management
 */
export function saveDraftToStorage(state) {
  try {
    const draft = {
      name: state.workflowName,
      nodes: state.nodes,
      connections: state.connections,
      mockPayload: state.mockPayload,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (e) {
    console.warn('Auto-save draft failed:', e);
  }
}

export function getDraftFromStorage() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Helper to bump semantic version
 */
function incrementVersion(ver = '1.0.0') {
  const parts = ver.split('.').map(p => parseInt(p, 10) || 0);
  if (parts.length !== 3) return '1.0.1';
  parts[2] += 1;
  return parts.join('.');
}
