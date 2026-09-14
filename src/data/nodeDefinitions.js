export const NODE_CATEGORIES = {
  trigger: {
    label: 'Triggers',
    badge: 'EVENT',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.04) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderHover: '#fbbf24',
    icon: 'Zap'
  },
  agent: {
    label: 'AI Agents',
    badge: 'INTELLIGENCE',
    color: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(99, 102, 241, 0.05) 100%)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderHover: '#a78bfa',
    icon: 'Bot'
  },
  logic: {
    label: 'Logic & Flow',
    badge: 'CONTROL',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.04) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderHover: '#34d399',
    icon: 'GitBranch'
  },
  action: {
    label: 'Actions & Outputs',
    badge: 'EXECUTION',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.04) 100%)',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    borderHover: '#f472b6',
    icon: 'Send'
  }
};

export const AI_MODELS = [
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', latency: '~740ms', context: '200k' },
  { id: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', latency: '~620ms', context: '2M' },
  { id: 'gpt-4o', name: 'GPT-4o (Omni)', provider: 'OpenAI', latency: '~820ms', context: '128k' },
  { id: 'llama-3-3-70b', name: 'Llama 3.3 70B Instruct', provider: 'Meta (Groq)', latency: '~280ms', context: '128k' },
  { id: 'deepseek-r1', name: 'DeepSeek R1 (Reasoning)', provider: 'DeepSeek', latency: '~1200ms', context: '64k' }
];

export const NODE_DEFINITIONS = [
  // --- TRIGGERS ---
  {
    type: 'webhook_trigger',
    category: 'trigger',
    name: 'Webhook Event',
    description: 'Listens for incoming HTTP POST payloads from third-party apps',
    icon: 'Webhook',
    inputs: [],
    outputs: ['payload'],
    defaultConfig: {
      path: '/api/v1/webhook/incoming-event',
      method: 'POST',
      authRequired: true,
      samplePayload: '{\n  "event": "customer.inquiry",\n  "customer_id": "usr_9981",\n  "email": "sarah@techcorp.io",\n  "message": "Need urgent assistance with enterprise billing sync error",\n  "priority": "high"\n}'
    }
  },
  {
    type: 'rabbitmq_trigger',
    category: 'trigger',
    name: 'RabbitMQ / AMQP Consumer',
    description: 'Consumes real-time streaming messages from RabbitMQ exchange or queue',
    icon: 'Radio',
    inputs: [],
    outputs: ['message_body'],
    defaultConfig: {
      queue: 'agent.tasks.inbound',
      exchange: 'amq.topic',
      routingKey: 'tasks.critical.*',
      prefetchCount: 10
    }
  },
  {
    type: 'schedule_trigger',
    category: 'trigger',
    name: 'Cron Scheduler',
    description: 'Triggers agent workflow on intervals or predefined cron expressions',
    icon: 'Clock',
    inputs: [],
    outputs: ['timestamp'],
    defaultConfig: {
      cron: '0 */4 * * *',
      intervalName: 'Every 4 hours',
      timezone: 'UTC'
    }
  },
  {
    type: 'email_trigger',
    category: 'trigger',
    name: 'Inbound Email',
    description: 'Listens for incoming emails delivered to a dedicated AI inbox',
    icon: 'Mail',
    inputs: [],
    outputs: ['email_data'],
    defaultConfig: {
      inbox: 'agent@autoflow.ai',
      filterSender: '*@*',
      parseAttachments: true
    }
  },

  // --- AI AGENTS ---
  {
    type: 'ralph_loop',
    category: 'agent',
    name: 'Ralph Autonomous Loop (Self-Eval)',
    description: 'Self-refining feedback loop that evaluates criteria and iterates until criteria pass',
    icon: 'Repeat',
    inputs: ['objective_context'],
    outputs: ['verified_output', 'eval_score'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      maxIterations: 3,
      passThreshold: 0.9,
      evaluationCriteria: 'Completeness, zero hallucination, strict adherence to enterprise SLA constraints.',
      systemPrompt: 'You are an autonomous self-evaluating Ralph Agent. Critique your own reasoning, verify edge cases, and output only verified results.'
    }
  },
  {
    type: 'gsd_orchestrator',
    category: 'agent',
    name: 'GSD Milestone Planner & Orchestrator',
    description: 'Get-Shit-Done execution agent: decomposes goals into atomic phases and tracks STATE.md',
    icon: 'Target',
    inputs: ['high_level_goal'],
    outputs: ['execution_plan', 'current_milestone'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      systemPrompt: 'You are a GSD (Get Shit Done) Orchestrator. Formulate a milestone roadmap, maintain strict task state, and output actionable sub-agent directives.',
      executionFramework: 'GSD-Standard (Phase-Plan-Execute-Verify)'
    }
  },
  {
    type: 'reasoning_agent',
    category: 'agent',
    name: 'Autonomous Reasoning Agent',
    description: 'Multi-step CoT thinking agent that plans, evaluates, and selects actions',
    icon: 'BrainCircuit',
    inputs: ['input_context'],
    outputs: ['thought_plan', 'decision'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      systemPrompt: 'You are an autonomous operations intelligence agent. Deconstruct the user query, analyze risk level, outline reasoning steps, and formulate an optimal action plan.',
      temperature: 0.2,
      maxTokens: 1200
    }
  },
  {
    type: 'llm_prompt',
    category: 'agent',
    name: 'Claude / LLM Prompt & Generator',
    description: 'Executes high-fidelity prompts with variable interpolation and role context',
    icon: 'Bot',
    inputs: ['prompt_vars'],
    outputs: ['generated_text'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      systemPrompt: 'You are an articulate, precise AI agent powered by Claude 3.5 Sonnet. Generate helpful, personalized, clear responses.',
      userPromptTemplate: 'Review the context:\n{{input_context}}\n\nDraft an empathetic response resolving the inquiry.',
      temperature: 0.7,
      maxTokens: 800
    }
  },
  {
    type: 'classifier',
    category: 'agent',
    name: 'Intent & Sentiment Triage',
    description: 'Classifies input into discrete categories, urgency scores, and intent labels',
    icon: 'Layers',
    inputs: ['raw_text'],
    outputs: ['intent', 'confidence', 'sentiment'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      labels: ['production_outage', 'billing_issue', 'sales_inquiry', 'feature_request'],
      temperature: 0.1,
      outputFormat: 'JSON'
    }
  },
  {
    type: 'researcher',
    category: 'agent',
    name: 'Web Research Agent',
    description: 'Searches the live web, parses documentation, and synthesizes key citations',
    icon: 'Globe',
    inputs: ['query'],
    outputs: ['summary', 'sources'],
    defaultConfig: {
      model: 'gemini-1-5-pro',
      searchDepth: 'comprehensive',
      maxSources: 5
    }
  },

  // --- LOGIC ---
  {
    type: 'condition',
    category: 'logic',
    name: 'Condition (If / Else)',
    description: 'Evaluates logical expressions to branch execution path',
    icon: 'GitBranch',
    inputs: ['eval_data'],
    outputs: ['true_branch', 'false_branch'],
    defaultConfig: {
      field: 'intent',
      operator: 'equals',
      compareValue: 'billing_dispute'
    }
  },
  {
    type: 'router',
    category: 'logic',
    name: 'Intent Router (Multi-Path)',
    description: 'Routes payloads across multiple branch outputs based on triage tag',
    icon: 'Split',
    inputs: ['classified_input'],
    outputs: ['urgent_path', 'standard_path', 'escalation_path'],
    defaultConfig: {
      routingKey: 'priority',
      fallback: 'standard_path'
    }
  },
  {
    type: 'filter',
    category: 'logic',
    name: 'Gate & Filter',
    description: 'Drops payloads that do not meet strict quality or confidence thresholds',
    icon: 'Filter',
    inputs: ['stream'],
    outputs: ['accepted'],
    defaultConfig: {
      field: 'confidence',
      operator: 'greater_than',
      threshold: '0.85'
    }
  },
  {
    type: 'hitl_gate',
    category: 'logic',
    name: 'Human Approval Gate (HITL)',
    description: 'Pauses pipeline execution for human operator review, payload edits, or action sign-off',
    icon: 'ShieldCheck',
    inputs: ['inbound_action'],
    outputs: ['approved', 'rejected'],
    defaultConfig: {
      actionTitle: 'External Action Authorization',
      riskLevel: 'HIGH',
      requireApproval: true,
      timeoutMinutes: 15,
      notificationChannel: '#ops-approvals'
    }
  },

  // --- ACTIONS ---
  {
    type: 'rabbitmq_publish',
    category: 'action',
    name: 'RabbitMQ Dispatcher',
    description: 'Publishes routing payload into RabbitMQ broker exchange for downstream consumers',
    icon: 'Radio',
    inputs: ['payload_to_publish'],
    outputs: ['ack_status'],
    defaultConfig: {
      exchange: 'amq.topic',
      routingKey: 'agent.results.verified',
      mandatory: true
    }
  },
  {
    type: 'slack_dispatch',
    category: 'action',
    name: 'Slack / Discord Alert',
    description: 'Broadcasts formatted messages, cards, or urgent alerts to team channels',
    icon: 'MessageSquare',
    inputs: ['alert_message'],
    outputs: ['post_result'],
    defaultConfig: {
      channel: '#support-tier-2',
      mentionTeam: true,
      cardTheme: 'urgent-red'
    }
  },
  {
    type: 'email_send',
    category: 'action',
    name: 'Send Email Notification',
    description: 'Sends rich HTML emails via SendGrid, Resend, or AWS SES',
    icon: 'Mail',
    inputs: ['recipient_info', 'body_content'],
    outputs: ['delivery_status'],
    defaultConfig: {
      provider: 'Resend API',
      to: '{{trigger.email}}',
      subject: 'Update regarding your support inquiry #{{trigger.customer_id}}',
      from: 'support@autoflow.ai'
    }
  },
  {
    type: 'http_request',
    category: 'action',
    name: 'HTTP / REST API Call',
    description: 'Dispatches authenticated HTTP request to external CRM, ERP, or API',
    icon: 'Network',
    inputs: ['request_payload'],
    outputs: ['http_response'],
    defaultConfig: {
      endpoint: 'https://api.crm.io/v2/tickets',
      method: 'POST',
      authHeader: 'Bearer sec_live_9381204891',
      timeoutMs: 5000
    }
  }
];
