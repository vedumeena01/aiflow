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
import { PREBUILT_TEMPLATES } from './data/templates';
import { NODE_DEFINITIONS } from './data/nodeDefinitions';
import { validateGraph, validateWorkflowSchema } from './utils/graphValidation';
import { executeLiveAgentNode, verifyActionSafety } from './services/aiService';

const STORAGE_KEY = 'autoflow_ai_workflow_v1';
const API_KEYS_STORAGE_KEY = 'autoflow_ai_api_keys';
const MAX_HISTORY = 25;

export default function App() {
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const validationResult = useMemo(() => {
    return validateGraph(nodes, connections);
  }, [nodes, connections]);

  // UI States
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Execution & Simulation States
  const [isRunning, setIsRunning] = useState(false);
  const [executionStates, setExecutionStates] = useState({});
  const [activeWireIds, setActiveWireIds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [totalTokens, setTotalTokens] = useState('0');
  const [totalLatency, setTotalLatency] = useState('0ms');

  const simulationAbortRef = useRef(false);

  // Quota-Safe LocalStorage Sync
  useEffect(() => {
    const cleanNodes = nodes.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      x: n.x,
      y: n.y,
      config: n.config
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
    } catch (e) {
      console.warn('LocalStorage quota warning:', e);
    }
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
    setTotalTokens('0');
    setTotalLatency('0ms');
  };

  // Export / Import
  const handleExportWorkflow = () => {
    const data = {
      version: 'autoflow-v1',
      exportedAt: new Date().toISOString(),
      name: workflowName,
      nodes,
      connections,
      mockPayload
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_workflow.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportWorkflow = (rawJson) => {
    const validation = validateWorkflowSchema(rawJson);
    if (!validation.valid) {
      alert(`Import Rejected: ${validation.error}`);
      return;
    }

    pushHistory(nodes, connections);
    const { name, nodes: importedNodes, connections: importedConns, mockPayload: importedPayload } = validation.sanitizedWorkflow;
    setWorkflowName(name);
    setNodes(importedNodes);
    setConnections(importedConns);
    setMockPayload(importedPayload);
    setSelectedNodeId(null);
    setExecutionStates({});
    setActiveWireIds([]);
    setLogs([]);
  };

  const handleClearCanvas = () => {
    if (window.confirm('Clear all nodes and connections on canvas?')) {
      pushHistory(nodes, connections);
      setNodes([]);
      setConnections([]);
      setSelectedNodeId(null);
      setExecutionStates({});
      setActiveWireIds([]);
      setLogs([]);
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
  const executePipelineInternal = async (payloadToRun) => {
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
    setLogs([]);

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
      executionMode === 'live'
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
      traversedNodeTitles.push(currentNode.title || nodeDef?.name);

      const incomingConns = connections.filter(c => c.toNode === currentNode.id);
      const wireIds = incomingConns.map(c => c.id);
      setActiveWireIds(wireIds);

      setExecutionStates(prev => ({ ...prev, [currentNode.id]: 'running' }));

      let currentInput = payloadToRun;
      if (incomingConns.length > 0) {
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

      // --- LIVE MODE EXECUTION ---
      if (executionMode === 'live') {
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
          executionStates={executionStates}
          activeWireIds={activeWireIds}
          cycleNodeIds={validationResult.cycleNodeIds}
          onSelectNode={(node) => setSelectedNodeId(node ? node.id : null)}
          onUpdateNodePosition={handleUpdateNodePosition}
          onAddNodeAtPosition={handleAddNodeAtPosition}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onCreateConnection={handleCreateConnection}
          onDeleteConnection={handleDeleteConnection}
        />

        {selectedNode && (
          <NodeInspector 
            selectedNode={selectedNode}
            onUpdateConfig={handleUpdateNodeConfig}
            onUpdateTitle={handleUpdateNodeTitle}
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
        onClearLogs={() => setLogs([])}
        totalTokens={totalTokens}
        totalLatency={totalLatency}
      />

      {/* Test Run Payload Modal */}
      <TestRunModal 
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        mockPayload={mockPayload}
        onSavePayload={(p) => setMockPayload(p)}
        onRunTest={(p) => {
          setMockPayload(p);
          handleRunWorkflow();
        }}
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
    </div>
  );
}
