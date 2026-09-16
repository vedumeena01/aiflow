/**
 * AutoFlow AI — Automated Verification Suite for Workflow Vault & Storage Engine
 */

import { validateGraph, validateWorkflowSchema } from './src/utils/graphValidation.js';
import { PREBUILT_TEMPLATES } from './src/data/templates.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('⚡ AutoFlow AI — Workflow Vault & Package Verification Suite');
console.log('======================================================\n');

// Test Suite 1: Template Validation
console.log('▶ Suite 1: Prebuilt Enterprise Templates Integrity');
assert(Array.isArray(PREBUILT_TEMPLATES) && PREBUILT_TEMPLATES.length >= 3, 'Prebuilt templates catalog contains at least 3 production designs');

PREBUILT_TEMPLATES.forEach(tmpl => {
  const validation = validateGraph(tmpl.nodes, tmpl.connections);
  assert(validation.isValid, `Template "${tmpl.name}" is a valid DAG with 0 circular dependencies`);
  assert(tmpl.nodes.length >= 2, `Template "${tmpl.name}" has sufficient topological depth (${tmpl.nodes.length} nodes)`);
});

// Test Suite 2: Schema Validation & Sanitization
console.log('\n▶ Suite 2: Strict Workflow Schema & Sanitization Engine');

const validWorkflow = {
  name: 'Financial Audit Pipeline',
  nodes: [
    { id: 'node_1', type: 'rabbitmq_trigger', title: 'AMQP Inbound', x: 100, y: 100, config: {} },
    { id: 'node_2', type: 'ralph_loop', title: 'Ralph Evaluator', x: 400, y: 100, config: { passThreshold: 0.95 } }
  ],
  connections: [
    { id: 'conn_1', fromNode: 'node_1', fromOutput: 'output', toNode: 'node_2', toInput: 'input' }
  ],
  mockPayload: { transaction_id: 'tx_9981' }
};

const validRes = validateWorkflowSchema(validWorkflow);
assert(validRes.valid === true, 'Valid workflow passes schema check');
assert(validRes.sanitizedWorkflow.nodes.length === 2, 'Sanitized workflow preserves 2 nodes');
assert(validRes.sanitizedWorkflow.connections.length === 1, 'Sanitized workflow preserves 1 connection');

// Test with invalid schema
const invalidWorkflowNoNodes = { name: 'Broken' };
const invalidRes1 = validateWorkflowSchema(invalidWorkflowNoNodes);
assert(invalidRes1.valid === false, 'Missing nodes array correctly rejected');

const duplicateNodes = {
  nodes: [
    { id: 'dup_1', type: 'llm_prompt' },
    { id: 'dup_1', type: 'llm_prompt' }
  ]
};
const invalidRes2 = validateWorkflowSchema(duplicateNodes);
assert(invalidRes2.valid === false && invalidRes2.error.includes('Duplicate node id'), 'Duplicate node IDs correctly detected and rejected');

// Test Suite 3: .autoflow.json Package Import Compatibility
console.log('\n▶ Suite 3: Enterprise .autoflow.json Package Envelope Compatibility');

const enterprisePackage = {
  $schema: 'https://autoflow.ai/schemas/workflow-v1.json',
  format: 'autoflow-package',
  specVersion: '1.2.0',
  metadata: {
    name: 'Enterprise Customer Escalation Flow',
    description: 'Deconstructs incoming Zendesk tickets and executes sentiment analysis.',
    tags: ['Customer Support', 'Production'],
    version: '1.0.0'
  },
  graph: {
    nodeCount: 3,
    connectionCount: 2,
    nodes: [
      { id: 'node_t1', type: 'webhook_trigger', title: 'Webhook', x: 50, y: 150, config: {} },
      { id: 'node_t2', type: 'classifier', title: 'Sentiment Triage', x: 350, y: 150, config: {} },
      { id: 'node_t3', type: 'hitl_gate', title: 'HITL Review', x: 650, y: 150, config: {} }
    ],
    connections: [
      { id: 'c1', fromNode: 'node_t1', toNode: 'node_t2' },
      { id: 'c2', fromNode: 'node_t2', toNode: 'node_t3' }
    ]
  },
  sampleInput: { ticket_id: 'tk_4410' }
};

// Simulation of parseAndValidateWorkflowFile
let packageRaw = enterprisePackage;
if (packageRaw.format === 'autoflow-package' && packageRaw.graph) {
  packageRaw = {
    name: enterprisePackage.metadata?.name,
    nodes: enterprisePackage.graph.nodes,
    connections: enterprisePackage.graph.connections,
    mockPayload: enterprisePackage.sampleInput
  };
}

const packageCheck = validateWorkflowSchema(packageRaw);
assert(packageCheck.valid === true, '.autoflow.json package envelope unwraps and validates correctly');
assert(packageCheck.sanitizedWorkflow.nodes.length === 3, 'Package graph nodes correctly parsed');
assert(packageCheck.sanitizedWorkflow.name === 'Enterprise Customer Escalation Flow', 'Package metadata name preserved');

// Test Suite 4: Custom Code Sandbox Engine & Presets
console.log('\n▶ Suite 4: Code Sandbox Execution & Transformation Presets');

import { executeSandboxCode, CODE_SANDBOX_PRESETS } from './src/services/sandboxService.js';
import { generatePythonLangGraph, generateTypeScriptCode } from './src/utils/codeGenerator.js';

const samplePayload = {
  order_id: 'ord_9981',
  amount_usd: 1200,
  customer_email: 'finance@enterprise.com',
  notes: 'Urgent downtime refund request for AWS outage incident'
};

// Test basic transform
const basicTransform = `function transform(input) {
  return { ...input, verified: true, tax_usd: input.amount_usd * 0.1 };
}`;

const basicRes = await executeSandboxCode({
  code: basicTransform,
  inputData: samplePayload
});

assert(basicRes.success === true, 'Basic JS transformation executes cleanly');
assert(basicRes.result.verified === true && basicRes.result.tax_usd === 120, 'Mathematical calculation returns accurate output');

// Test Presets
for (const preset of CODE_SANDBOX_PRESETS) {
  const pRes = await executeSandboxCode({
    code: preset.code,
    inputData: samplePayload
  });
  assert(pRes.success === true, `Sandbox Preset "${preset.name}" executes without errors`);
}

// Test Runtime Error Handling
const brokenCode = `function transform(input) {
  throw new Error("Simulated division by zero or parse failure");
}`;
const errRes = await executeSandboxCode({
  code: brokenCode,
  inputData: samplePayload
});
assert(errRes.success === false && errRes.error.includes('Simulated division'), 'Runtime errors trapped and returned gracefully');

// Test Code Generator with code_sandbox node
const sandboxNode = {
  id: 'node_sbx_1',
  type: 'code_sandbox',
  title: 'Custom Data Sanitizer',
  config: { language: 'javascript' }
};
const pyCode = generatePythonLangGraph('Sandbox Test', [sandboxNode], []);
assert(pyCode.includes('[Code Sandbox] Executing payload transformation'), 'Python LangGraph generator produces code_sandbox node handler');

const tsCode = generateTypeScriptCode('Sandbox Test', [sandboxNode], []);
assert(tsCode.includes('[Code Sandbox] Running custom transformation'), 'TypeScript generator produces code_sandbox node handler');

// Test Suite 5: Product Feedback & Telemetry Services
console.log('\n▶ Suite 5: In-App Feedback Portal & Telemetry Tracker');

// Polyfills for headless CLI execution
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = { innerWidth: 1920, innerHeight: 1080 };
}
if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = { userAgent: 'NodeTestRunner/AutoFlow-CLI' };
}

import { 
  submitUserFeedback, 
  getStoredFeedback, 
  trackTelemetryEvent, 
  getTelemetrySummary, 
  hasCompletedOnboarding, 
  markOnboardingCompleted 
} from './src/services/feedbackService.js';

// Test Feedback Submission
const fbRecord = submitUserFeedback({
  type: 'rating',
  rating: 5,
  title: 'Great Canvas Navigation',
  description: 'Infinite canvas zoom and Bezier wire snapping is extremely smooth.',
  diagnostics: { nodeCount: 5, connectionCount: 4 }
});

assert(fbRecord && fbRecord.id.startsWith('fb_'), 'Feedback record generated with unique ID');
assert(fbRecord.rating === 5, 'Feedback rating saved accurately');
assert(fbRecord.diagnostics.nodeCount === 5, 'Auto-captured diagnostic telemetry recorded');

const storedList = getStoredFeedback();
assert(storedList.length >= 1, 'Feedback persisted in local storage');

// Test Telemetry Event Tracking
trackTelemetryEvent('canvas_node_added', { type: 'code_sandbox' });
trackTelemetryEvent('workflow_executed', { mode: 'simulated', duration: '1.2s' });

const summary = getTelemetrySummary();
assert(summary.totalEvents >= 2, 'Telemetry summary aggregates recorded events');
assert(summary.eventCounts['workflow_executed'] >= 1, 'Workflow execution event properly categorized');

// Test Onboarding Lifecycle
markOnboardingCompleted();
assert(hasCompletedOnboarding() === true, 'Onboarding completion flag set and verified');

// Test Suite 6: 1-Click Docker & FastAPI Cloud Deployment Packager
console.log('\n▶ Suite 6: 1-Click Docker & FastAPI Cloud Deployment Packager');

import { generateCloudDeploymentPackage } from './src/services/cloudDeployService.js';

const testWorkflowNodes = [
  { id: 'trigger_1', type: 'trigger', title: 'Webhook Inbound Trigger', config: { event: 'ticket_opened' } },
  { id: 'agent_1', type: 'agent', title: 'Classifier Agent', config: { model: 'claude-3-5-sonnet', systemPrompt: 'Classify ticket urgency.' } },
  { id: 'output_1', type: 'output', title: 'Slack Notification', config: { channel: '#support-alerts' } }
];

const testWorkflowWires = [
  { id: 'w1', fromNodeId: 'trigger_1', toNodeId: 'agent_1' },
  { id: 'w2', fromNodeId: 'agent_1', toNodeId: 'output_1' }
];

const deployPkg = generateCloudDeploymentPackage('Enterprise Support Triage', testWorkflowNodes, testWorkflowWires);

assert(deployPkg.packageName === 'enterprise-support-triage', 'Package name correctly slugified');
assert(deployPkg.files && typeof deployPkg.files === 'object', 'Files manifest dictionary created');

const expectedFiles = ['main.py', 'Dockerfile', 'requirements.txt', 'docker-compose.yml', '.env.example', 'README.md'];
for (const file of expectedFiles) {
  assert(Boolean(deployPkg.files[file]), `Manifest contains container artifact: ${file}`);
}

// Inspect main.py microservice code
const mainPy = deployPkg.files['main.py'];
assert(mainPy.includes('from fastapi import FastAPI, HTTPException'), 'FastAPI framework imported in main.py');
assert(mainPy.includes('app.add_middleware'), 'CORS middleware configured in microservice');
assert(mainPy.includes('@app.get("/health"'), 'Healthcheck probe endpoint /health exposed');
assert(mainPy.includes('@app.post("/api/v1/run"'), 'Pipeline synchronous execution endpoint /api/v1/run exposed');
assert(mainPy.includes('@app.post("/api/v1/webhook"'), 'Background queue async webhook endpoint /api/v1/webhook exposed');
assert(mainPy.includes('app_graph = workflow.compile()'), 'Compiled LangGraph state graph initialized');

// Inspect Dockerfile security & health standards
const dockerfile = deployPkg.files['Dockerfile'];
assert(dockerfile.includes('FROM python:3.11-slim'), 'Container standardizes on lightweight Python 3.11 base');
assert(dockerfile.includes('useradd -m -u 1000 appuser'), 'Security best practice: non-root execution user created');
assert(dockerfile.includes('HEALTHCHECK --interval=30s'), 'Container healthcheck instruction defined');
assert(dockerfile.includes('uvicorn.workers.UvicornWorker') || dockerfile.includes('uvicorn'), 'High-performance ASGI server configured as entrypoint');

// Inspect Cloud Deployment Documentation
const readme = deployPkg.files['README.md'];
assert(readme.includes('gcloud run deploy'), 'README includes Google Cloud Run deployment instructions');
assert(readme.includes('fly launch'), 'README includes Fly.io launch guide');
assert(readme.includes('aws ecr'), 'README includes AWS ECS / ECR push commands');

// Test Suite 7: Visual Graph Diff Engine & URL Share System
console.log('\n▶ Suite 7: Visual Graph Diff Engine & URL Sharing System');

import { computeGraphDiff } from './src/utils/graphDiff.js';
import { encodeWorkflowToShareUrl, decodeWorkflowFromShareUrl } from './src/utils/shareUrl.js';

const baseGraph = {
  name: 'Production Invoicing Pipeline v1',
  nodes: [
    { id: 'n1', type: 'trigger', title: 'Stripe Webhook', config: { endpoint: '/stripe' } },
    { id: 'n2', type: 'agent', title: 'Invoice Auditor', config: { model: 'gpt-4o', temp: 0.2 } }
  ],
  connections: [
    { id: 'c1', fromNodeId: 'n1', toNodeId: 'n2' }
  ]
};

const updatedGraph = {
  name: 'Production Invoicing Pipeline v2',
  nodes: [
    { id: 'n1', type: 'trigger', title: 'Stripe Webhook (Enhanced)', config: { endpoint: '/stripe/v2' } }, // modified
    { id: 'n2', type: 'agent', title: 'Invoice Auditor', config: { model: 'gpt-4o', temp: 0.2 } },          // unchanged
    { id: 'n3', type: 'output', title: 'Slack Dispatcher', config: { channel: '#finance' } }                // added
  ],
  connections: [
    { id: 'c2', fromNodeId: 'n2', toNodeId: 'n3' } // c1 removed, c2 added
  ]
};

const diffResult = computeGraphDiff(baseGraph, updatedGraph);

assert(diffResult.hasChanges === true, 'Diff engine detects structural and metadata differences');
assert(diffResult.nameChanged === true, 'Workflow name alteration tracked');
assert(diffResult.summary.addedNodesCount === 1, 'Node additions accurately counted');
assert(diffResult.addedNodes[0].id === 'n3', 'Added node ID correctly identified');
assert(diffResult.summary.modifiedNodesCount === 1, 'Node modifications accurately counted');
assert(diffResult.modifiedNodes[0].id === 'n1', 'Modified node ID correctly identified');
assert(diffResult.modifiedNodes[0].changes.length === 2, 'Field-level diff records title and config changes');
assert(diffResult.summary.unchangedNodesCount === 1, 'Unchanged node preserved without false positive diff');
assert(diffResult.summary.addedWiresCount === 1, 'Wire addition accurately detected');
assert(diffResult.summary.removedWiresCount === 1, 'Wire removal accurately detected');

// Test Identical Graphs
const identicalDiff = computeGraphDiff(baseGraph, baseGraph);
assert(identicalDiff.hasChanges === false, 'Identical graphs yield 0 changes');
assert(identicalDiff.summary.totalChanges === 0, 'Total changes score is 0 on identical graph');

// Test URL Sharing Serialization & Hydration
const shareToken = encodeWorkflowToShareUrl(updatedGraph);
assert(typeof shareToken === 'string' && shareToken.length > 20, 'Workflow encodes to URL-safe token');
assert(!shareToken.includes('+') && !shareToken.includes('/'), 'Token is sanitised for URL hash fragments');

const hydrated = decodeWorkflowFromShareUrl(shareToken);
assert(hydrated !== null, 'Encoded token hydrates back to workflow object');
assert(hydrated.name === updatedGraph.name, 'Hydrated workflow preserves name');
assert(hydrated.nodes.length === 3, 'Hydrated workflow preserves all 3 nodes');
assert(hydrated.connections.length === 1, 'Hydrated workflow preserves wire connections');
assert(hydrated.isShared === true, 'Hydrated workflow flagged as shared');

// Test Suite 8: Sugiyama Hierarchical DAG Auto-Layout Engine
console.log('\n▶ Suite 8: Sugiyama Hierarchical DAG Auto-Layout Engine');

import { applyAutoLayout } from './src/utils/autoLayout.js';

// 1. Edge cases: Empty and single node
assert(applyAutoLayout([]).length === 0, 'Auto-layout returns empty array for empty graph');
const singleResult = applyAutoLayout([{ id: 'n1', title: 'Solo Node' }]);
assert(singleResult.length === 1 && typeof singleResult[0].x === 'number', 'Auto-layout handles single node gracefully');

// 2. 3-stage linear pipeline: Trigger -> Agent -> Output
const linearNodes = [
  { id: 't1', type: 'trigger', title: 'Start', x: 500, y: 300 },
  { id: 'a1', type: 'agent', title: 'Process', x: 100, y: 800 },
  { id: 'o1', type: 'output', title: 'Finish', x: 200, y: 100 }
];
const linearWires = [
  { id: 'w1', fromNodeId: 't1', toNodeId: 'a1' },
  { id: 'w2', fromNodeId: 'a1', toNodeId: 'o1' }
];

const arrangedLinear = applyAutoLayout(linearNodes, linearWires);
const t1Pos = arrangedLinear.find(n => n.id === 't1');
const a1Pos = arrangedLinear.find(n => n.id === 'a1');
const o1Pos = arrangedLinear.find(n => n.id === 'o1');

assert(t1Pos.x < a1Pos.x, 'Trigger node positioned in earliest topological column (Layer 0)');
assert(a1Pos.x < o1Pos.x, 'Agent node positioned in intermediate column (Layer 1)');
assert(arrangedLinear.length === 3, 'All nodes preserved during auto-arrangement');

// 3. Diamond/Branching DAG (1 Root -> 2 Workers -> 1 Aggregator)
const diamondNodes = [
  { id: 'root', type: 'trigger', title: 'Webhook' },
  { id: 'w1', type: 'agent', title: 'Worker Alpha' },
  { id: 'w2', type: 'agent', title: 'Worker Beta' },
  { id: 'agg', type: 'output', title: 'Collector' }
];
const diamondWires = [
  { fromNodeId: 'root', toNodeId: 'w1' },
  { fromNodeId: 'root', toNodeId: 'w2' },
  { fromNodeId: 'w1', toNodeId: 'agg' },
  { fromNodeId: 'w2', toNodeId: 'agg' }
];

const arrangedDiamond = applyAutoLayout(diamondNodes, diamondWires);
const rootArr = arrangedDiamond.find(n => n.id === 'root');
const w1Arr = arrangedDiamond.find(n => n.id === 'w1');
const w2Arr = arrangedDiamond.find(n => n.id === 'w2');
const aggArr = arrangedDiamond.find(n => n.id === 'agg');

assert(w1Arr.x === w2Arr.x, 'Parallel workers aligned to the same layer column');
assert(w1Arr.y !== w2Arr.y, 'Parallel workers vertically spaced to prevent node collision');
assert(aggArr.x > w1Arr.x, 'Aggregator positioned after parallel worker layer');

// 4. Resilience to cycles
const cyclicNodes = [
  { id: 'c1', type: 'trigger', title: 'Loop Trigger' },
  { id: 'c2', type: 'agent', title: 'Loop Worker' },
  { id: 'c3', type: 'agent', title: 'Evaluator' }
];
const cyclicWires = [
  { fromNodeId: 'c1', toNodeId: 'c2' },
  { fromNodeId: 'c2', toNodeId: 'c3' },
  { fromNodeId: 'c3', toNodeId: 'c2' } // Cycle feedback
];

const arrangedCyclic = applyAutoLayout(cyclicNodes, cyclicWires);
assert(arrangedCyclic.length === 3, 'Layout engine gracefully resolves cyclic graph without infinite loop');

// Test Suite 9: Production Node Telemetry Profiler & Stepper Engine
console.log('\n▶ Suite 9: Node Telemetry Profiler & Pipeline Stepper Controller');

import { analyzePipelineMetrics, PipelineStepController } from './src/utils/telemetryProfiler.js';

// 1. Profiler empty snapshots fallback
const emptyProfile = analyzePipelineMetrics([]);
assert(emptyProfile.totalLatencyMs === 0, 'Empty snapshots returns 0ms total latency');
assert(emptyProfile.bottleneckNodeId === null, 'Empty snapshots returns null bottleneck ID');

// 2. Profiler multi-step bottleneck identification & token aggregation
const mockSnapshots = [
  { nodeId: 'node_webhook', nodeTitle: 'Webhook Trigger', stepDurationMs: 45, tokens: 0, status: 'success' },
  { nodeId: 'node_claude_agent', nodeTitle: 'Claude 3.5 Sonnet Worker', stepDurationMs: 1450, tokens: 920, status: 'success' },
  { nodeId: 'node_slack_out', nodeTitle: 'Slack Notification', stepDurationMs: 30, tokens: 0, status: 'success' }
];

const profilerReport = analyzePipelineMetrics(mockSnapshots);
assert(profilerReport.totalLatencyMs === 1525, 'Pipeline total latency computed accurately (1525ms)');
assert(profilerReport.totalTokens === 920, 'Pipeline total token usage aggregated accurately (920)');
assert(profilerReport.bottleneckNodeId === 'node_claude_agent', 'Slowest pipeline step (Bottleneck) correctly isolated');
assert(profilerReport.bottleneckDurationMs === 1450, 'Bottleneck step latency recorded precisely');
assert(profilerReport.nodeMetrics['node_claude_agent'].isBottleneck === true, 'Bottleneck flag set on slowest node');
assert(profilerReport.nodeMetrics['node_webhook'].isBottleneck === false, 'Non-bottleneck node correctly flagged');

// 3. Step-Through Debugger Controller State Machine
const stepper = new PipelineStepController(3);
assert(stepper.currentStep === 0 && stepper.isPaused === false, 'Stepper initializes in ready state at Step 0');

// Trigger pause and stepNext
const stepPromise = stepper.waitForStep();
assert(stepper.isPaused === true, 'Stepper pauses execution and waits for operator input');

stepper.stepNext();
const stepRes = await stepPromise;
assert(stepRes.action === 'step', 'Stepper yields step action on operator F10');
assert(stepper.currentStep === 1 && stepper.isPaused === false, 'Stepper advances to Step 1 and unpauses');

// Trigger pause and resumeAll
const resumePromise = stepper.waitForStep();
stepper.resumeAll();
const resumeRes = await resumePromise;
assert(resumeRes.action === 'resume', 'Stepper yields resume action on operator F5');

console.log('\n------------------------------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} checks.`);
console.log('------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All AutoFlow AI verification suites (Vault, Sandbox, Feedback, Telemetry, Cloud Deploy, Diff & Share, Auto-Layout, Debugger) passed 100%!\n');
}




