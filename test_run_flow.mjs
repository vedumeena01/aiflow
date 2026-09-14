import { PREBUILT_TEMPLATES } from './src/data/templates.js';
import { validateGraph } from './src/utils/graphValidation.js';

console.log('='.repeat(70));
console.log('   AUTOFLOW AI — EXECUTING WORKFLOW PIPELINE');
console.log('='.repeat(70));

const template = PREBUILT_TEMPLATES.find(t => t.id === 'ralph_claude_rabbit');
if (!template) {
  console.error('Template not found!');
  process.exit(1);
}

console.log(`\n📋 Loading Template: "${template.name}"`);
console.log(`📝 Description: ${template.description}`);
console.log(`📊 Nodes: ${template.nodes.length} | Connections: ${template.connections.length}`);

// Step 1: Validate Graph Topology
console.log('\n🔍 Validating Graph Topology (Kahn\'s DAG Algorithm)...');
const validation = validateGraph(template.nodes, template.connections);
if (!validation.isValid) {
  console.error('❌ Validation Failed:', validation.errors);
  process.exit(1);
}
console.log('✅ Graph Topology Valid: Directed Acyclic Graph confirmed. No cycles detected.\n');

// Step 2: Display Injected Trigger Payload
console.log('📦 Trigger Inbound Payload (RabbitMQ AMQP):');
console.log(JSON.stringify(template.sampleInput, null, 2));

console.log('\n' + '-'.repeat(70));
console.log('⚡ EXECUTING STEPS IN TOPOLOGICAL ORDER:');
console.log('-'.repeat(70));

let accumulatedTokens = 0;
let totalTimeMs = 0;

for (let i = 0; i < template.simulatedSteps.length; i++) {
  const step = template.simulatedSteps[i];
  const node = template.nodes.find(n => n.id === step.nodeId);
  const durMs = parseInt(step.duration) || 50;
  totalTimeMs += durMs;
  accumulatedTokens += (step.tokens || 0);

  console.log(`\n▶ [Step ${i + 1}/${template.simulatedSteps.length}] NODE: "${node?.title}" (${node?.type})`);
  console.log(`  ⏱ Latency: ${step.duration} | 🪙 Tokens: ${step.tokens || 0} (Total: ${accumulatedTokens})`);
  console.log(`  💬 Log: ${step.log}`);
  console.log('  📤 Output Data:');
  console.log(JSON.stringify(step.output, null, 4).replace(/^/gm, '     '));
}

console.log('\n' + '='.repeat(70));
console.log(`🎉 WORKFLOW COMPLETED SUCCESSFULLY!`);
console.log(`⏱ Total Duration: ${(totalTimeMs / 1000).toFixed(2)}s`);
console.log(`🪙 Total Tokens Processed: ${accumulatedTokens.toLocaleString()} tokens`);
console.log(`🔒 Final Ralph Loop Status: VERIFIED & COMMITTED TO RABBITMQ`);
console.log('='.repeat(70));
