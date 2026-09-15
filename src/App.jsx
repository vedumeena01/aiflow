import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import NodeInspector from './components/NodeInspector';
import ExecutionConsole from './components/ExecutionConsole';
import TestRunModal from './components/TestRunModal';
import ApiSettingsModal from './components/ApiSettingsModal';
import ChatPlayground from './components/ChatPlayground';
import CodeExportModal from './components/CodeExportModal';
import CloudDeployModal from './components/CloudDeployModal';
import WorkflowDiffModal from './components/WorkflowDiffModal';
import HitlApprovalModal from './components/HitlApprovalModal';
import KnowledgeBaseModal from './components/KnowledgeBaseModal';
import WorkflowVaultModal from './components/WorkflowVaultModal';
import OnboardingModal from './components/OnboardingModal';
import FeedbackModal from './components/FeedbackModal';
import ErrorBoundary from './components/ErrorBoundary';
import { PREBUILT_TEMPLATES } from './data/templates';
import { NODE_DEFINITIONS } from './data/nodeDefinitions';
import { validateGraph, validateWorkflowSchema } from './utils/graphValidation';
import { executeLiveAgentNode, verifyActionSafety } from './services/aiService';
import { queryKnowledgeBase } from './services/ragService';
import { executeSandboxCode } from './services/sandboxService';
import { hasCompletedOnboarding, trackTelemetryEvent } from './services/feedbackService';
import { 
  getVaultWorkflows, 
  saveWorkflowToVault, 
  exportWorkflowPackage, 
  parseAndValidateWorkflowFile,
  saveDraftToStorage 
} from './services/workflowStorage';
import { getShareableLink, checkUrlForSharedWorkflow } from './utils/shareUrl';

const STORAGE_KEY = 'autoflow_ai_workflow_v1';
const API_KEYS_STORAGE_KEY = 'autoflow_ai_api_keys';
const MAX_HISTORY = 25;

function AppContent() {
  const defaultTemplate = PREBUILT_TEMPLATES[0];

  const [workflowName, setWorkflowName] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) return parsed.name;
      } catch (e) {}
    }
    return defaultTemplate.name;
  });

  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.nodes)) return parsed.nodes;
      } catch (e) {}
    }
    return defaultTemplate.nodes;
  });

  const [connections, setConnections] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.connections)) return parsed.connections;
      } catch (e) {}
    }
    return defaultTemplate.connections;
  });

  const [mockPayload, setMockPayload] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.mockPayload) return parsed.mockPayload;
      } catch (e) {}
    }
    return defaultTemplate.sampleInput;
  });

  // API Keys & Live Execution Mode
  const [executionMode, setExecutionMode] = useState('simulated');
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem(API_KEYS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { gemini: '', anthropic: '', openai: '', groq: '' };
    } catch (e) {
      return { gemini: '', anthropic: '', openai: '', groq: '' };
    }
  });
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [codeExportOpen, setCodeExportOpen] = useState(false);
  const [cloudDeployOpen, setCloudDeployOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [diffModalState, setDiffModalState] = useState({
    isOpen: false,
    incomingWorkflow: null,
    title: 'Visual Workflow Comparison & Diff'
  });
  const [vaultCount, setVaultCount] = useState(() => getVaultWorkflows().length);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [toastMessage, setToastMessage] = useState(null);
  const [onboardingOpen, setOnboardingOpen] = useState(() => !hasCompletedOnboarding());
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleSaveApiKeys = (newKeys) => {
    setApiKeys(newKeys);
    try {
      localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(newKeys));
    } catch (e) {}
  };

  const hasActiveApiKey = Boolean(apiKeys.gemini || apiKeys.anthropic || apiKeys.openai || apiKeys.groq);

  // Undo / Redo History Stack
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const pushHistory = useCallback((prevNodes, prevConnections) => {
    setHistory(h => [
      ...h.slice(-MAX_HISTORY),
      { nodes: prevNodes, connections: prevConnections }
    ]);
    setFuture([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture(f => [{ nodes, connections }, ...f]);
    setHistory(h => h.slice(0, -1));
    setNodes(previous.nodes);
    setConnections(previous.connections);
    setSelectedNodeId(null);
  }, [history, nodes, connections]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(h => [...h, { nodes, connections }]);
    setFuture(f => f.slice(1));
    setNodes(next.nodes);
    setConnections(next.connections);
    setSelectedNodeId(null);
  }, [future, nodes, connections]);

  const handleQuickSave = useCallback(() => {
    try {
      const record = saveWorkflowToVault({
        name: workflowName,
        nodes,
        connections,
        mockPayload
      });
      setVaultCount(getVaultWorkflows().length);
      setAutoSaveStatus('saved');
      showToast(`Saved "${record.name}" to Vault!`);
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    }
  }, [workflowName, nodes, connections, mockPayload, showToast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleQuickSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleQuickSave]);

  const validationResult = useMemo(() => {
    return validateGraph(nodes, connections);
  }, [nodes, connections]);

  // UI States
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [knowledgeModalNode, setKnowledgeModalNode] = useState(null);

  // Execution & Simulation States
  const [isRunning, setIsRunning] = useState(false);
  const [executionStates, setExecutionStates] = useState({});
  const [activeWireIds, setActiveWireIds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [totalTokens, setTotalTokens] = useState('0');
  const [totalLatency, setTotalLatency] = useState('0ms');

  // Time-Travel Replay States
  const [executionSnapshots, setExecutionSnapshots] = useState([]);
  const [replayStepIndex, setReplayStepIndex] = useState(null);

  // HITL & Breakpoint States
  const [hitlModalState, setHitlModalState] = useState(null);
  const hitlResolverRef = useRef(null);

  const requestHitlApproval = useCallback((node, inputData, isBreakpoint = false) => {
    return new Promise((resolve) => {
      hitlResolverRef.current = resolve;
      setHitlModalState({
        isOpen: true,
        node,
        inputData,
        isBreakpoint
      });
    });
  }, []);

  const handleHitlApprove = useCallback((modifiedPayload) => {
    if (hitlResolverRef.current) {
      hitlResolverRef.current({ approved: true, payload: modifiedPayload });
      hitlResolverRef.current = null;
    }
    setHitlModalState(null);
  }, []);

  const handleHitlReject = useCallback((reason) => {
    if (hitlResolverRef.current) {
      hitlResolverRef.current({ approved: false, reason });
      hitlResolverRef.current = null;
    }
    setHitlModalState(null);
  }, []);

  const handleToggleBreakpoint = useCallback((nodeId) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, breakpoint: !n.breakpoint };
      }
      return n;
    }));
  }, []);

  const simulationAbortRef = useRef(false);

  // Quota-Safe LocalStorage Sync & Debounced Auto-Save Draft
  useEffect(() => {
    setAutoSaveStatus('unsaved');
    const timer = setTimeout(() => {
      const cleanNodes = nodes.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        x: n.x,
        y: n.y,
        config: n.config,
        breakpoint: n.breakpoint
      }));

      const cleanConnections = connections.map(c => ({
        id: c.id,
        fromNode: c.fromNode,
        fromOutput: c.fromOutput,
        toNode: c.toNode,
        toInput: c.toInput
      }));

      const data = {
        name: workflowName,
        nodes: cleanNodes,
        connections: cleanConnections,
        mockPayload
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setAutoSaveStatus('saved');
      } catch (e) {
        console.warn('LocalStorage quota warning:', e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [workflowName, nodes, connections, mockPayload]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  // Node Management
  const handleAddNode = (nodeDef) => {
    pushHistory(nodes, connections);
    const id = `node_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
    const offset = (nodes.length % 5) * 35;
    const newNode = {
      id,
      type: nodeDef.type,
      title: nodeDef.name,
      x: 350 + offset,
      y: 180 + offset,
      config: { ...(nodeDef.defaultConfig || {}) }
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const handleAddNodeAtPosition = (nodeDef, x, y) => {
    pushHistory(nodes, connections);
    const id = `node_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
    const newNode = {
      id,
      type: nodeDef.type,
      title: nodeDef.name,
      x: Math.max(x, 20),
      y: Math.max(y, 20),
      config: { ...(nodeDef.defaultConfig || {}) }
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const handleUpdateNodePosition = (id, x, y) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const handleDeleteNode = (id) => {
    pushHistory(nodes, connections);
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.fromNode !== id && c.toNode !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleDuplicateNode = (node) => {
    pushHistory(nodes, connections);
    const id = `node_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
    const dup = {
      ...node,
      id,
      title: `${node.title || 'Node'} (Copy)`,
      x: node.x + 40,
      y: node.y + 40
    };
    setNodes(prev => [...prev, dup]);
    setSelectedNodeId(id);
  };

  const handleUpdateNodeConfig = (id, newConfig) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, config: newConfig } : n));
  };

  const handleUpdateNodeTitle = (id, newTitle) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, title: newTitle } : n));
  };

  // Connection Management
  const handleCreateConnection = (fromNode, fromOutput, toNode, toInput) => {
    const exists = connections.some(
      c => c.fromNode === fromNode && c.fromOutput === fromOutput && c.toNode === toNode && c.toInput === toInput
    );
    if (exists) return;

    pushHistory(nodes, connections);
    const newConn = {
      id: `conn_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
      fromNode,
      fromOutput,
      toNode,
      toInput
    };
    setConnections(prev => [...prev, newConn]);
  };

  const handleDeleteConnection = (connId) => {
    pushHistory(nodes, connections);
    setConnections(prev => prev.filter(c => c.id !== connId));
  };

  // Template Loader
  const handleLoadTemplate = (template) => {
    if (isRunning) return;
    pushHistory(nodes, connections);
    setWorkflowName(template.name);
    setNodes(template.nodes);
    setConnections(template.connections);
    setMockPayload(template.sampleInput || {});
    setSelectedNodeId(null);
    setExecutionStates({});
    setActiveWireIds([]);
    setLogs([]);
    setExecutionSnapshots([]);
    setReplayStepIndex(null);
    setTotalTokens('0');
    setTotalLatency('0ms');
  };

  // Export / Import & Vault Load
  const handleExportWorkflow = () => {
    exportWorkflowPackage({
      name: workflowName,
      nodes,
      connections,
      mockPayload
    });
    showToast(`Exported "${workflowName}.autoflow.json" package`);
  };

  const handleImportWorkflow = (rawJson) => {
    const res = parseAndValidateWorkflowFile(rawJson);
    if (!res.valid) {
      alert(`Import Rejected: ${res.error}`);
      return;
    }

    pushHistory(nodes, connections);
    const wf = res.workflow;
    setWorkflowName(wf.name);
    setNodes(wf.nodes);
    setConnections(wf.connections);
    setMockPayload(wf.mockPayload || {});
    setSelectedNodeId(null);
    setExecutionStates({});
    setActiveWireIds([]);
    setLogs([]);
    setExecutionSnapshots([]);
    setReplayStepIndex(null);
    showToast(`Imported "${wf.name}" (${wf.nodes.length} nodes)`);
  };

  const handleLoadWorkflowFromVault = (wf) => {
    if (isRunning) return;
    pushHistory(nodes, connections);
    setWorkflowName(wf.name);
    setNodes(wf.nodes || []);
    setConnections(wf.connections || []);
    setMockPayload(wf.mockPayload || wf.sampleInput || {});
    setSelectedNodeId(null);
    setExecutionStates({});
    setActiveWireIds([]);
    setLogs([]);
    setExecutionSnapshots([]);
    setReplayStepIndex(null);
    setTotalTokens('0');
    setTotalLatency('0ms');
    showToast(`Loaded "${wf.name}" to canvas`);
  };

  // URL Sharing & Visual Diff Handlers
  const handleShareLink = () => {
    const link = getShareableLink({ name: workflowName, nodes, connections });
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => showToast('🔗 Shareable workflow link copied to clipboard!'))
        .catch(() => {
          window.prompt('Copy workflow share link:', link);
        });
    } else if (typeof window !== 'undefined') {
      window.prompt('Copy workflow share link:', link);
    }
  };

  const handleOpenDiff = (incoming) => {
    const res = parseAndValidateWorkflowFile(incoming);
    const wf = res.valid ? res.workflow : incoming;
    setDiffModalState({
      isOpen: true,
      incomingWorkflow: wf,
      title: `Review Changes: "${wf.name || 'Incoming Workflow'}"`
    });
  };

  const handleApplyDiffWorkflow = (incoming) => {
    pushHistory(nodes, connections);
    setWorkflowName(incoming.name || workflowName);
    setNodes(incoming.nodes || []);
    setConnections(incoming.connections || []);
    if (incoming.mockPayload) setMockPayload(incoming.mockPayload);
    setSelectedNodeId(null);
    setExecutionStates({});
    setActiveWireIds([]);
    setLogs([]);
    setExecutionSnapshots([]);
    setReplayStepIndex(null);
    showToast(`✅ Applied "${incoming.name || 'workflow'}" to canvas`);
  };

  // Detect shared workflow in URL hash on mount
  useEffect(() => {
    const sharedWf = checkUrlForSharedWorkflow();
    if (sharedWf) {
      setDiffModalState({
        isOpen: true,
        incomingWorkflow: sharedWf,
        title: `Shared Workflow Received: "${sharedWf.name}"`
      });
      showToast(`🔗 Shared workflow received: "${sharedWf.name}"`);
    }
  }, []);

  const handleClearCanvas = () => {
    if (window.confirm('Clear all nodes and connections on canvas?')) {
      pushHistory(nodes, connections);
      setNodes([]);
      setConnections([]);
      setSelectedNodeId(null);
      setExecutionStates({});
      setActiveWireIds([]);
      setLogs([]);
      setExecutionSnapshots([]);
      setReplayStepIndex(null);
    }
  };

  const handleStopWorkflow = () => {
    simulationAbortRef.current = true;
    setIsRunning(false);
    setActiveWireIds([]);
  };

  // Chat Playground Execution Caller
  const handleSendChatMessage = async (userQuery) => {
    const inputOverride = {
      user_query: userQuery,
      message: userQuery,
      timestamp: new Date().toISOString()
    };
    return await executePipelineInternal(inputOverride);
  };

  const handleRunWorkflow = async () => {
    await executePipelineInternal(mockPayload);
  };

  // Core Pipeline Execution Function
  const executePipelineInternal = async (payloadToRun, startStepIndex = 0) => {
    if (nodes.length === 0) return { responseText: 'No nodes in canvas' };

    if (!validationResult.isValid) {
      alert(`Cannot execute: Cyclic dependency detected!\n${validationResult.errors.join('\n')}`);
      return { responseText: 'Pipeline blocked by cyclic loop.' };
    }

    if (executionMode === 'live' && !hasActiveApiKey) {
      setApiSettingsOpen(true);
      alert('Live Mode requires an API key (Claude, Gemini, Groq, or OpenAI).');
      return { responseText: 'API key required.' };
    }

    setIsRunning(true);
    simulationAbortRef.current = false;
    setExecutionStates({});
    setActiveWireIds([]);

    if (startStepIndex === 0) {
      setLogs([]);
      setExecutionSnapshots([]);
      setReplayStepIndex(null);
    } else {
      setLogs(prev => prev.slice(0, startStepIndex));
      setExecutionSnapshots(prev => prev.slice(0, startStepIndex));
      setReplayStepIndex(null);
    }

    const startTime = Date.now();
    let accumulatedTokens = 0;
    const currentTemplate = PREBUILT_TEMPLATES.find(t => t.name === workflowName);

    const addLog = (message, nodeTitle, status = 'running', output = null) => {
      setLogs(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          nodeTitle,
          message,
          status,
          output
        }
      ]);
    };

    addLog(
      startStepIndex > 0
        ? `🔄 Re-running pipeline starting from Step ${startStepIndex + 1} with custom operator state...`
        : executionMode === 'live'
        ? '🚀 Initiating LIVE multi-agent pipeline with real LLM inference...'
        : 'Initiating autonomous simulated workflow pipeline...',
      'System',
      'running'
    );

    // Topological order
    const incomingMap = new Set(connections.map(c => c.toNode));
    let startNodes = nodes.filter(n => !incomingMap.has(n.id));
    if (startNodes.length === 0) startNodes = [nodes[0]];

    const executionQueue = [];
    const visited = new Set();
    const queue = [...startNodes];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!visited.has(current.id)) {
        visited.add(current.id);
        executionQueue.push(current);

        const outgoingConns = connections.filter(c => c.fromNode === current.id);
        for (const conn of outgoingConns) {
          const nextNode = nodes.find(n => n.id === conn.toNode);
          if (nextNode && !visited.has(nextNode.id)) {
            queue.push(nextNode);
          }
        }
      }
    }

    nodes.forEach(n => {
      if (!visited.has(n.id)) executionQueue.push(n);
    });

    const nodeOutputs = new Map();
    const traversedNodeTitles = [];
    let finalPayload = null;

    for (let i = 0; i < executionQueue.length; i++) {
      if (simulationAbortRef.current) break;

      const currentNode = executionQueue[i];
      const nodeDef = NODE_DEFINITIONS.find(d => d.type === currentNode.type);

      // Fast-forward upstream nodes when re-running from step
      if (i < startStepIndex) {
        const cachedSnap = executionSnapshots[i];
        if (cachedSnap) {
          nodeOutputs.set(currentNode.id, cachedSnap.outputData);
          setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'success' }));
        }
        continue;
      }

      traversedNodeTitles.push(currentNode.title || nodeDef?.name);

      const incomingConns = connections.filter(c => c.toNode === currentNode.id);
      const wireIds = incomingConns.map(c => c.id);
      setActiveWireIds(wireIds);

      setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'running' }));

      let currentInput = (i === startStepIndex && startStepIndex > 0 && payloadToRun !== undefined)
        ? payloadToRun
        : payloadToRun;

      if (incomingConns.length > 0 && (startStepIndex === 0 || i > startStepIndex)) {
        const upstreamOutputs = incomingConns
          .map(c => nodeOutputs.get(c.fromNode))
          .filter(Boolean);
        if (upstreamOutputs.length === 1) {
          currentInput = upstreamOutputs[0];
        } else if (upstreamOutputs.length > 1) {
          currentInput = upstreamOutputs;
        }
      }

      let stepOutput = null;
      let nodeTokens = 0;

      // --- INTERACTIVE BREAKPOINT INTERCEPTION ---
      if (currentNode.breakpoint) {
        addLog(`⏸️ Breakpoint encountered at [${currentNode.title || currentNode.type}]. Pausing execution for inspection...`, currentNode.title, 'running');
        setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'paused' }));
        const decision = await requestHitlApproval(currentNode, currentInput, true);
        if (!decision.approved) {
          addLog(`🛑 Execution halted at breakpoint by operator (${decision.reason || 'User cancelled'}).`, currentNode.title, 'error');
          setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'error' }));
          simulationAbortRef.current = true;
          break;
        }
        currentInput = decision.payload;
        setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'running' }));
        addLog(`▶️ Breakpoint resumed by operator. Continuing pipeline...`, currentNode.title, 'success', currentInput);
      }

      // --- HUMAN-IN-THE-LOOP REVIEW GATE ---
      if (currentNode.type === 'hitl_gate') {
        addLog(`🛡️ Human-in-the-Loop Gate activated: Pausing pipeline for operator authorization...`, currentNode.title, 'running');
        setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'paused' }));
        const decision = await requestHitlApproval(currentNode, currentInput, false);
        if (!decision.approved) {
          addLog(`⛔ Action REJECTED by Human Operator: "${decision.reason || 'Security gate rejected'}"`, currentNode.title, 'error');
          setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'error' }));
          stepOutput = { approved: false, rejectedBy: 'Human Operator', reason: decision.reason, input: currentInput };
          nodeOutputs.set(currentNode.id, stepOutput);

          // Snapshot rejected gate
          setExecutionSnapshots(prev => {
            const next = [...prev];
            next[i] = {
              stepIndex: i,
              nodeId: currentNode.id,
              nodeTitle: currentNode.title || nodeDef?.name,
              nodeType: currentNode.type,
              category: nodeDef?.category,
              status: 'error',
              inputData: currentInput,
              outputData: stepOutput,
              tokens: 0,
              timestamp: new Date().toLocaleTimeString(),
              elapsedMs: Date.now() - startTime,
              wireIds: wireIds
            };
            return next;
          });

          simulationAbortRef.current = true;
          break;
        } else {
          addLog(`✅ Action APPROVED by Human Operator. Authorized payload forwarded.`, currentNode.title, 'success', decision.payload);
          stepOutput = decision.payload;
          nodeOutputs.set(currentNode.id, stepOutput);
          finalPayload = stepOutput;
          setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'success' }));

          // Snapshot approved gate
          setExecutionSnapshots(prev => {
            const next = [...prev];
            next[i] = {
              stepIndex: i,
              nodeId: currentNode.id,
              nodeTitle: currentNode.title || nodeDef?.name,
              nodeType: currentNode.type,
              category: nodeDef?.category,
              status: 'success',
              inputData: currentInput,
              outputData: stepOutput,
              tokens: 0,
              timestamp: new Date().toLocaleTimeString(),
              elapsedMs: Date.now() - startTime,
              wireIds: wireIds
            };
            return next;
          });

          continue;
        }
      }

      // --- VECTOR RAG & KNOWLEDGE BASE RETRIEVAL ---
      if (currentNode.type === 'vector_rag') {
        addLog(`📚 Querying Vector Knowledge Base "${currentNode.config?.knowledgeStoreName || 'Enterprise Docs'}"...`, currentNode.title, 'running');
        const queryText = typeof currentInput === 'object'
          ? (currentInput.user_query || currentInput.message || currentInput.query || JSON.stringify(currentInput))
          : String(currentInput || '');

        const ragResult = queryKnowledgeBase({
          documents: currentNode.config?.documents || [],
          query: queryText,
          topK: currentNode.config?.topK || 3,
          similarityThreshold: currentNode.config?.similarityThreshold || 0.35,
          chunkSize: currentNode.config?.chunkSize || 400
        });

        stepOutput = {
          query: queryText,
          matchCount: ragResult.matchCount,
          retrieved_chunks: ragResult.retrievedChunks,
          augmented_context: ragResult.augmentedContext,
          user_query: typeof currentInput === 'object' ? currentInput.user_query || currentInput.message : currentInput,
          grounded_prompt: `[GROUNDED KNOWLEDGE CONTEXT]:\n${ragResult.augmentedContext}\n\n[USER INQUIRY]:\n${queryText}`
        };

        const scoresList = ragResult.retrievedChunks.map(c => `${Math.round(c.score * 100)}%`).join(', ');
        addLog(
          `Retrieved ${ragResult.matchCount} semantic chunk(s) [Relevance: ${scoresList || 'default'}]`,
          currentNode.title,
          'success',
          stepOutput
        );

        nodeTokens = ragResult.matchCount * 65;
        await new Promise(r => setTimeout(r, 350));
      } 
      // --- CUSTOM CODE SANDBOX EXECUTION ---
      else if (currentNode.type === 'code_sandbox') {
        const lang = currentNode.config?.language || 'javascript';
        addLog(`⚡ Executing Code Sandbox script (${lang === 'python' ? 'Python / LangGraph Logic' : 'V8 JavaScript Sandbox'})...`, currentNode.title, 'running');
        
        const sandboxRes = await executeSandboxCode({
          code: currentNode.config?.code || 'function transform(input) { return input; }',
          inputData: currentInput,
          timeoutMs: currentNode.config?.timeoutMs || 2500
        });

        if (sandboxRes.logs?.length > 0) {
          sandboxRes.logs.forEach(l => addLog(l, currentNode.title, 'running'));
        }

        if (!sandboxRes.success) {
          addLog(`❌ Sandbox Execution Error: ${sandboxRes.error}`, currentNode.title, 'error', { error: sandboxRes.error });
          stepOutput = { error: sandboxRes.error, failed: true, input: currentInput };
          setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'error' }));
        } else {
          stepOutput = sandboxRes.result;
          addLog(`✅ Script transformation executed successfully in ${sandboxRes.latencyMs}ms.`, currentNode.title, 'success', stepOutput);
        }

        await new Promise(r => setTimeout(r, 200));
      }
      // --- LIVE MODE EXECUTION ---
      else if (executionMode === 'live') {
        if (nodeDef?.category === 'trigger') {
          stepOutput = payloadToRun;
          addLog(`Injected live trigger input payload`, currentNode.title, 'success', stepOutput);
          await new Promise(r => setTimeout(r, 200));
        } else if (nodeDef?.category === 'agent') {
          addLog(`Calling ${currentNode.config?.model || 'Claude/Gemini'} API with live prompt...`, currentNode.title, 'running');
          try {
            const res = await executeLiveAgentNode({
              node: currentNode,
              inputData: currentInput,
              apiKeys
            });
            stepOutput = res.parsedPayload;
            nodeTokens = res.tokens;
            addLog(
              `Live AI inference response received from ${res.provider} (${res.latencyMs}ms, ${res.tokens} tokens)`,
              currentNode.title,
              'success',
              stepOutput
            );
          } catch (err) {
            addLog(`API execution failed: ${err.message}`, currentNode.title, 'error', { error: err.message });
            stepOutput = { error: err.message };
          }
        } else if (nodeDef?.category === 'action') {
          const safetyCheck = verifyActionSafety(currentInput);
          if (!safetyCheck.passed) {
            addLog(`Safety Guardrail Triggered: ${safetyCheck.warnings.join(', ')}`, currentNode.title, 'error');
          } else {
            addLog(`Action verified by Safety Agent. Dispatched to ${currentNode.config?.channel || currentNode.config?.routingKey || 'Endpoint'}`, currentNode.title, 'success', {
              dispatched: true,
              payload: currentInput
            });
          }
          stepOutput = { status: 'dispatched', verified: safetyCheck.passed, payload: currentInput };
          await new Promise(r => setTimeout(r, 350));
        } else {
          stepOutput = {
            evaluated: true,
            branch: 'true_branch',
            input: currentInput
          };
          addLog(`Logic evaluated successfully`, currentNode.title, 'success', stepOutput);
          await new Promise(r => setTimeout(r, 250));
        }
      } 
      // --- SIMULATED MODE EXECUTION ---
      else {
        const templateStep = currentTemplate?.simulatedSteps?.find(s => s.nodeId === currentNode.id);
        const stepLogMsg = templateStep?.log || 
          `Executing ${nodeDef?.name || currentNode.title} with model ${currentNode.config?.model || 'engine'}...`;
        
        addLog(stepLogMsg, currentNode.title, 'running');

        const delayMs = templateStep ? 600 : 450;
        await new Promise(r => setTimeout(r, delayMs));

        if (simulationAbortRef.current) break;

        stepOutput = templateStep?.output;
        if (!stepOutput) {
          if (nodeDef?.category === 'trigger') {
            stepOutput = payloadToRun;
          } else if (nodeDef?.category === 'agent') {
            stepOutput = {
              model: currentNode.config?.model || 'claude-3-5-sonnet',
              status: 'completed',
              tokens_generated: Math.floor(Math.random() * 500) + 300,
              analysis: typeof payloadToRun === 'object' && payloadToRun.user_query
                ? `Deconstructed query "${payloadToRun.user_query}". Reconciled constraints and formulated execution strategy.`
                : 'Synthesized context and satisfied evaluation criteria.'
            };
          } else if (nodeDef?.category === 'logic') {
            stepOutput = {
              evaluated_field: currentNode.config?.field || 'intent',
              evaluation_result: true,
              branch: 'true_branch'
            };
          } else {
            stepOutput = {
              status: 'delivered',
              timestamp: new Date().toISOString(),
              status_code: 200
            };
          }
        }
        nodeTokens = templateStep?.tokens || (nodeDef?.category === 'agent' ? 480 : 0);
        addLog(`Step completed successfully [${nodeDef?.category || 'node'}]`, currentNode.title, 'success', stepOutput);
      }

      nodeOutputs.set(currentNode.id, stepOutput);
      finalPayload = stepOutput;
      accumulatedTokens += nodeTokens;
      setTotalTokens(accumulatedTokens.toLocaleString());
      setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'success' }));

      // Record Time-Travel Replay Snapshot
      setExecutionSnapshots(prev => {
        const next = [...prev];
        next[i] = {
          stepIndex: i,
          nodeId: currentNode.id,
          nodeTitle: currentNode.title || nodeDef?.name,
          nodeType: currentNode.type,
          category: nodeDef?.category,
          status: 'success',
          inputData: currentInput,
          outputData: stepOutput,
          tokens: nodeTokens,
          timestamp: new Date().toLocaleTimeString(),
          elapsedMs: Date.now() - startTime,
          wireIds: wireIds
        };
        return next;
      });
    }

    const elapsed = Date.now() - startTime;
    const durationFormatted = `${(elapsed / 1000).toFixed(2)}s`;
    setTotalLatency(durationFormatted);
    setActiveWireIds([]);
    setIsRunning(false);

    if (!simulationAbortRef.current) {
      addLog(
        `Autonomous pipeline completed in ${durationFormatted} (${executionMode === 'live' ? 'Live AI Mode' : 'Simulation Mode'}).`,
        'System',
        'success'
      );
    }

    let responseString = '';
    if (finalPayload) {
      if (typeof finalPayload === 'string') {
        responseString = finalPayload;
      } else if (finalPayload.analysis) {
        responseString = finalPayload.analysis;
      } else if (finalPayload.reconciliation_status) {
        responseString = `Reconciliation complete: ${finalPayload.reconciliation_status}. Audit hash: ${finalPayload.audit_hash} (${finalPayload.records_processed} records processed).`;
      } else if (finalPayload.generated_pitch) {
        responseString = finalPayload.generated_pitch;
      } else {
        responseString = JSON.stringify(finalPayload, null, 2);
      }
    } else {
      responseString = 'Pipeline execution finished successfully.';
    }

    return {
      responseText: responseString,
      payload: finalPayload,
      nodesTraversed: traversedNodeTitles,
      latency: durationFormatted,
      tokens: accumulatedTokens
    };
  };

  const handleRerunFromStep = useCallback(async (stepIndex, modifiedInput) => {
    if (isRunning) return;
    await executePipelineInternal(modifiedInput, stepIndex);
  }, [isRunning]);

  const activeReplaySnapshot = replayStepIndex !== null && executionSnapshots[replayStepIndex]
    ? executionSnapshots[replayStepIndex]
    : null;

  const displayedExecutionStates = activeReplaySnapshot
    ? { [activeReplaySnapshot.nodeId]: 'replay' }
    : executionStates;

  const displayedActiveWires = activeReplaySnapshot
    ? (activeReplaySnapshot.wireIds || [])
    : activeWireIds;

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header 
        workflowName={workflowName}
        setWorkflowName={setWorkflowName}
        isRunning={isRunning}
        executionMode={executionMode}
        onChangeExecutionMode={setExecutionMode}
        onOpenApiSettings={() => setApiSettingsOpen(true)}
        hasActiveApiKey={hasActiveApiKey}
        onOpenChatPlayground={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        onOpenCodeExport={() => setCodeExportOpen(true)}
        onOpenCloudDeploy={() => setCloudDeployOpen(true)}
        onShareLink={handleShareLink}
        onOpenDiff={handleOpenDiff}
        onOpenVault={() => setVaultOpen(true)}
        onQuickSave={handleQuickSave}
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onOpenFeedback={() => setFeedbackOpen(true)}
        savedCount={vaultCount}
        autoSaveStatus={autoSaveStatus}
        onRunWorkflow={handleRunWorkflow}
        onStopWorkflow={handleStopWorkflow}
        onOpenTestModal={() => setTestModalOpen(true)}
        onLoadTemplate={handleLoadTemplate}
        onExportWorkflow={handleExportWorkflow}
        onImportWorkflow={handleImportWorkflow}
        onClearCanvas={handleClearCanvas}
        nodeCount={nodes.length}
        connectionCount={connections.length}
        validationResult={validationResult}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
      />

      {/* Main Workspace Body */}
      <div className="workspace-body">
        <Sidebar onAddNode={handleAddNode} />

        <Canvas 
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          executionStates={displayedExecutionStates}
          activeWireIds={displayedActiveWires}
          cycleNodeIds={validationResult.cycleNodeIds}
          onSelectNode={(node) => setSelectedNodeId(node ? node.id : null)}
          onUpdateNodePosition={handleUpdateNodePosition}
          onAddNodeAtPosition={handleAddNodeAtPosition}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onToggleBreakpoint={handleToggleBreakpoint}
          onCreateConnection={handleCreateConnection}
          onDeleteConnection={handleDeleteConnection}
          onLoadSampleTemplate={() => handleLoadTemplate(PREBUILT_TEMPLATES[0])}
        />

        {selectedNode && (
          <NodeInspector 
            selectedNode={selectedNode}
            onUpdateConfig={handleUpdateNodeConfig}
            onUpdateTitle={handleUpdateNodeTitle}
            onToggleBreakpoint={handleToggleBreakpoint}
            onOpenKnowledgeModal={(node) => setKnowledgeModalNode(node)}
            onClose={() => setSelectedNodeId(null)}
            onDeleteNode={handleDeleteNode}
          />
        )}

        {/* Live Chat Playground Drawer */}
        <ChatPlayground 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          workflowName={workflowName}
          executionMode={executionMode}
          onSendChatMessage={handleSendChatMessage}
          isProcessing={isRunning}
        />
      </div>

      <ExecutionConsole 
        logs={logs}
        isRunning={isRunning}
        onClearLogs={() => {
          setLogs([]);
          setExecutionSnapshots([]);
          setReplayStepIndex(null);
        }}
        totalTokens={totalTokens}
        totalLatency={totalLatency}
        executionSnapshots={executionSnapshots}
        replayStepIndex={replayStepIndex}
        onSelectReplayStep={(idxOrFn) => setReplayStepIndex(idxOrFn)}
        onClearReplay={() => setReplayStepIndex(null)}
        onRerunFromStep={handleRerunFromStep}
      />

      {/* Live Webhook Inbound Tester & Mock Event Dispatcher */}
      <TestRunModal 
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        mockPayload={mockPayload}
        onSavePayload={(p) => setMockPayload(p)}
        onRunTest={(p) => {
          setMockPayload(p);
          handleRunWorkflow();
        }}
        workflowName={workflowName}
      />

      {/* Live AI Key Settings Modal */}
      <ApiSettingsModal 
        isOpen={apiSettingsOpen}
        onClose={() => setApiSettingsOpen(false)}
        apiKeys={apiKeys}
        onSaveKeys={handleSaveApiKeys}
      />

      {/* 1-Click Code Export Modal */}
      <CodeExportModal 
        isOpen={codeExportOpen}
        onClose={() => setCodeExportOpen(false)}
        workflowName={workflowName}
        nodes={nodes}
        connections={connections}
      />

      {/* 1-Click Docker & FastAPI Cloud Deployment Packager Modal */}
      <CloudDeployModal 
        isOpen={cloudDeployOpen}
        onClose={() => setCloudDeployOpen(false)}
        workflowName={workflowName}
        nodes={nodes}
        connections={connections}
      />

      {/* Visual Workflow Diff & Version Comparison Modal */}
      <WorkflowDiffModal 
        isOpen={diffModalState.isOpen}
        onClose={() => setDiffModalState({ isOpen: false, incomingWorkflow: null, title: '' })}
        baseWorkflow={{ name: workflowName, nodes, connections }}
        incomingWorkflow={diffModalState.incomingWorkflow}
        onApplyChanges={handleApplyDiffWorkflow}
        title={diffModalState.title}
      />

      {/* Human-in-the-Loop & Breakpoint Approval Modal */}
      <HitlApprovalModal 
        isOpen={!!hitlModalState?.isOpen}
        node={hitlModalState?.node}
        inputData={hitlModalState?.inputData}
        isBreakpoint={hitlModalState?.isBreakpoint}
        onApprove={handleHitlApprove}
        onReject={handleHitlReject}
      />

      {/* Vector Knowledge Base Manager Modal */}
      <KnowledgeBaseModal 
        isOpen={!!knowledgeModalNode}
        node={knowledgeModalNode}
        onClose={() => setKnowledgeModalNode(null)}
        onSaveNodeConfig={handleUpdateNodeConfig}
      />

      {/* Enterprise Workflow Vault & Templates Modal */}
      <WorkflowVaultModal 
        isOpen={vaultOpen}
        onClose={() => {
          setVaultOpen(false);
          setVaultCount(getVaultWorkflows().length);
        }}
        currentWorkflowState={{
          workflowName,
          nodes,
          connections,
          mockPayload
        }}
        onLoadWorkflow={handleLoadWorkflowFromVault}
        onNotification={showToast}
      />

      {/* Interactive Quickstart Onboarding Tour */}
      <OnboardingModal 
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onLoadSampleWorkflow={() => {
          handleLoadTemplate(PREBUILT_TEMPLATES[0]);
          showToast('Loaded Ralph Loop Sample Workflow!');
        }}
      />

      {/* In-App Feedback & Telemetry Portal */}
      <FeedbackModal 
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        currentDiagnostics={{
          nodeCount: nodes.length,
          connectionCount: connections.length,
          executionMode,
          workflowName
        }}
        onNotification={showToast}
      />

      {/* Persistent Toast Notification Pill */}
      {toastMessage && (
        <div 
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(99, 102, 241, 0.5)',
            color: '#f8fafc',
            padding: '10px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(99, 102, 241, 0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <span 
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}
          />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
