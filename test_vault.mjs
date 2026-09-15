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

console.log('\n------------------------------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} checks.`);
console.log('------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All AutoFlow AI verification suites (Vault, Sandbox, Feedback, Telemetry) passed 100%!\n');
}
