export const PREBUILT_TEMPLATES = [
  {
    id: 'ralph_claude_rabbit',
    name: 'Ralph Autonomous Loop (Claude 3.5 & RabbitMQ)',
    tag: 'Advanced AI',
    description: 'Consumes real-time task queues from RabbitMQ, decomposes objectives via GSD orchestrator, executes Claude 3.5 Sonnet in a self-evaluating Ralph loop until all verification criteria pass, then dispatches verified results back to RabbitMQ.',
    stats: { nodes: 5, estLatency: '1.6s', tokens: '~1,850' },
    sampleInput: {
      task_id: 'tsk_ralph_9921',
      amqp_routing_key: 'tasks.critical.data_reconciliation',
      source: 'RabbitMQ Broker (amq.topic)',
      objective: 'Verify payment discrepancies between Stripe webhook events and Ledger DB. Auto-correct formatting and output audit JSON.',
      criteria: 'Zero data truncation, ISO8601 timestamps, signed hash verification.',
      priority: 'critical'
    },
    nodes: [
      {
        id: 'node_rabbit_in',
        type: 'rabbitmq_trigger',
        title: 'RabbitMQ Task Consumer',
        x: 60,
        y: 180,
        config: {
          queue: 'agent.tasks.inbound',
          exchange: 'amq.topic',
          routingKey: 'tasks.critical.*'
        }
      },
      {
        id: 'node_gsd_planner',
        type: 'gsd_orchestrator',
        title: 'GSD Milestone Planner',
        x: 400,
        y: 180,
        config: {
          model: 'claude-3-5-sonnet',
          executionFramework: 'GSD-Standard (Phase-Plan-Execute-Verify)'
        }
      },
      {
        id: 'node_claude_worker',
        type: 'llm_prompt',
        title: 'Claude 3.5 Sonnet Reasoning Worker',
        x: 750,
        y: 100,
        config: {
          model: 'claude-3-5-sonnet',
          systemPrompt: 'You are an autonomous engineering reasoning agent. Process the incoming RabbitMQ payload, extract discrepancies, and construct the audit ledger.',
          temperature: 0.2
        }
      },
      {
        id: 'node_ralph_eval',
        type: 'ralph_loop',
        title: 'Ralph Autonomous Loop (Self-Eval)',
        x: 750,
        y: 280,
        config: {
          model: 'claude-3-5-sonnet',
          maxIterations: 3,
          passThreshold: 0.95,
          evaluationCriteria: 'Verify zero schema mismatches, complete transaction IDs, and cryptographic audit hash.'
        }
      },
      {
        id: 'node_rabbit_out',
        type: 'rabbitmq_publish',
        title: 'RabbitMQ Verified Dispatcher',
        x: 1140,
        y: 180,
        config: {
          exchange: 'amq.topic',
          routingKey: 'agent.results.verified',
          mandatory: true
        }
      }
    ],
    connections: [
      { id: 'conn_r1', fromNode: 'node_rabbit_in', fromOutput: 'message_body', toNode: 'node_gsd_planner', toInput: 'high_level_goal' },
      { id: 'conn_r2', fromNode: 'node_gsd_planner', fromOutput: 'execution_plan', toNode: 'node_claude_worker', toInput: 'prompt_vars' },
      { id: 'conn_r3', fromNode: 'node_claude_worker', fromOutput: 'generated_text', toNode: 'node_ralph_eval', toInput: 'objective_context' },
      { id: 'conn_r4', fromNode: 'node_ralph_eval', fromOutput: 'verified_output', toNode: 'node_rabbit_out', toInput: 'payload_to_publish' }
    ],
    simulatedSteps: [
      {
        nodeId: 'node_rabbit_in',
        status: 'success',
        duration: '18ms',
        tokens: 0,
        log: 'RabbitMQ AMQP: Consumed message from queue "agent.tasks.inbound" (routing key: tasks.critical.*)',
        output: {
          queue: 'agent.tasks.inbound',
          delivery_tag: 4092,
          payload_bytes: 842,
          task: 'data_reconciliation'
        }
      },
      {
        nodeId: 'node_gsd_planner',
        status: 'success',
        duration: '420ms',
        tokens: 380,
        log: 'GSD Planner decomposed objective into 3 atomic phases: [1: Parse Payload, 2: Run Claude Verification, 3: Self-Eval in Ralph Loop]',
        output: {
          framework: 'GSD-Standard',
          state_file: 'STATE.md (updated)',
          milestones: ['Phase 1: Ingest', 'Phase 2: Reconcile', 'Phase 3: Ralph Self-Eval']
        }
      },
      {
        nodeId: 'node_claude_worker',
        status: 'success',
        duration: '760ms',
        tokens: 840,
        log: 'Claude 3.5 Sonnet completed ledger reconstruction. Reconciled 28 transactions, identified 1 pending balance hold.',
        output: {
          reconciliation_status: 'reconciled_clean',
          audit_hash: 'sha256:8f2a49b01c...',
          records_processed: 28
        }
      },
      {
        nodeId: 'node_ralph_eval',
        status: 'success',
        duration: '520ms',
        tokens: 630,
        log: 'Ralph Loop Self-Evaluation: Iteration 1 Score = 0.98 (exceeds 0.95 threshold). No correction cycle needed. PASSED.',
        output: {
          ralph_iterations_run: 1,
          validation_score: 0.98,
          criteria_passed: true,
          verdict: 'APPROVED_FOR_DISPATCH'
        }
      },
      {
        nodeId: 'node_rabbit_out',
        status: 'success',
        duration: '35ms',
        tokens: 0,
        log: 'RabbitMQ AMQP: Published verified payload to exchange "amq.topic" (routingKey: agent.results.verified). Delivery confirmed.',
        output: {
          exchange: 'amq.topic',
          routing_key: 'agent.results.verified',
          ack: true,
          status: 'COMMITTED'
        }
      }
    ]
  },
  {
    id: 'support_triage',
    name: 'Autonomous Customer Support Auto-Triage',
    tag: 'Popular',
    description: 'Intercepts customer issues via webhook, analyzes intent and severity with Claude, invokes a reasoning agent to formulate solutions, and either drafts an email or escalates to Slack.',
    stats: { nodes: 5, estLatency: '1.4s', tokens: '~1,250' },
    sampleInput: {
      event: 'customer.ticket_created',
      customer_id: 'usr_premium_782',
      email: 'alex.rivera@fintechlabs.com',
      subject: 'Critical: Stripe Webhook Synchronization Failing on Production',
      message: 'Our automated payouts did not trigger today at 09:00 UTC. The dashboard gives Error 502 Bad Gateway during webhook verification. We are losing transactions.',
      account_tier: 'Enterprise Platinum',
      priority: 'high'
    },
    nodes: [
      {
        id: 'node_trig_1',
        type: 'webhook_trigger',
        title: 'Support Ticket Webhook',
        x: 60,
        y: 200,
        config: {
          path: '/api/v1/support/inbound-tickets',
          method: 'POST',
          authRequired: true
        }
      },
      {
        id: 'node_agent_1',
        type: 'classifier',
        title: 'Intent & Urgency Triage',
        x: 420,
        y: 200,
        config: {
          model: 'claude-3-5-sonnet',
          labels: ['production_outage', 'billing_issue', 'general_faq', 'account_settings'],
          temperature: 0.1
        }
      },
      {
        id: 'node_agent_2',
        type: 'reasoning_agent',
        title: 'Incident Resolution Strategist',
        x: 800,
        y: 120,
        config: {
          model: 'claude-3-5-sonnet',
          systemPrompt: 'Analyze the outage telemetry, assess enterprise SLA violation risks, and formulate direct remediation steps for Stripe webhook gateway failures.',
          temperature: 0.2,
          maxTokens: 1400
        }
      },
      {
        id: 'node_action_1',
        type: 'slack_dispatch',
        title: 'Escalate to #war-room-alerts',
        x: 1200,
        y: 60,
        config: {
          channel: '#war-room-alerts',
          cardTheme: 'urgent-red',
          mentionTeam: true
        }
      },
      {
        id: 'node_action_2',
        type: 'email_send',
        title: 'Dispatch SLA Priority Response',
        x: 1200,
        y: 280,
        config: {
          provider: 'Resend API',
          to: '{{trigger.email}}',
          subject: '[URGENT UPDATE] Senior Engineering On-Call Assigned to Ticket #{{trigger.customer_id}}',
          from: 'sla-incident@autoflow.ai'
        }
      }
    ],
    connections: [
      { id: 'conn_1', fromNode: 'node_trig_1', fromOutput: 'payload', toNode: 'node_agent_1', toInput: 'raw_text' },
      { id: 'conn_2', fromNode: 'node_agent_1', fromOutput: 'intent', toNode: 'node_agent_2', toInput: 'input_context' },
      { id: 'conn_3', fromNode: 'node_agent_2', fromOutput: 'decision', toNode: 'node_action_1', toInput: 'alert_message' },
      { id: 'conn_4', fromNode: 'node_agent_2', fromOutput: 'thought_plan', toNode: 'node_action_2', toInput: 'body_content' }
    ],
    simulatedSteps: [
      {
        nodeId: 'node_trig_1',
        status: 'success',
        duration: '42ms',
        tokens: 0,
        log: 'HTTP 200 Received payload from webhook /api/v1/support/inbound-tickets',
        output: {
          ticket_id: 'TCK-8921',
          customer: 'alex.rivera@fintechlabs.com',
          tier: 'Enterprise Platinum',
          severity: 'P0'
        }
      },
      {
        nodeId: 'node_agent_1',
        status: 'success',
        duration: '410ms',
        tokens: 312,
        log: 'Claude 3.5 Sonnet classification complete. Intent: production_outage (Confidence: 99.4%). Severity: Critical.',
        output: {
          classified_intent: 'production_outage',
          confidence_score: 0.994,
          sentiment: 'highly_frustrated',
          sla_window_minutes: 15
        }
      },
      {
        nodeId: 'node_agent_2',
        status: 'success',
        duration: '780ms',
        tokens: 840,
        log: 'Claude 3.5 Sonnet completed multi-step reasoning. Verified TLS handshake failure on reverse proxy port 443. Action: Escalate immediately.',
        output: {
          root_cause_hypothesis: 'SSL cert rotation failed on proxy ingress',
          recommended_action: 'Invoke on-call SRE & dispatch executive holding response',
          draft_email_ready: true
        }
      },
      {
        nodeId: 'node_action_1',
        status: 'success',
        duration: '110ms',
        tokens: 0,
        log: 'Slack Webhook dispatched to channel #war-room-alerts with interactive Incident Acknowledge button.',
        output: {
          channel: '#war-room-alerts',
          message_ts: '1726309812.001920',
          notified: ['@oncall-sre', '@incident-commander']
        }
      },
      {
        nodeId: 'node_action_2',
        status: 'success',
        duration: '95ms',
        tokens: 0,
        log: 'Email delivered via Resend API to alex.rivera@fintechlabs.com. Tracked delivery ID: rsd_88491.',
        output: {
          delivered_to: 'alex.rivera@fintechlabs.com',
          status: 'queued_and_signed',
          resend_id: 'msg_998123048'
        }
      }
    ]
  },
  {
    id: 'lead_qualifier',
    name: 'Autonomous Lead Enrichment & Outreach',
    tag: 'Growth',
    description: 'Detects high-intent demo requests, researches the prospect company across the web via Gemini, synthesizes personalization hooks, and registers enriched data in the CRM.',
    stats: { nodes: 5, estLatency: '1.8s', tokens: '~1,800' },
    sampleInput: {
      prospect_name: 'Elena Rostova',
      work_email: 'elena@novapulse.tech',
      company: 'NovaPulse Technologies',
      interest: 'Deploying multi-agent workflows across 40 customer success reps',
      employee_count: '250 - 500'
    },
    nodes: [
      {
        id: 'node_trig_lead',
        type: 'event_trigger',
        title: 'Demo Request Form Submitted',
        x: 60,
        y: 200,
        config: {
          source: 'HubSpot / Typeform',
          eventName: 'form.demo_request'
        }
      },
      {
        id: 'node_agent_research',
        type: 'researcher',
        title: 'Company Deep-Dive Researcher',
        x: 420,
        y: 200,
        config: {
          model: 'gemini-1-5-pro',
          searchDepth: 'comprehensive',
          maxSources: 4
        }
      },
      {
        id: 'node_agent_prompt',
        type: 'llm_prompt',
        title: 'Hyper-Personalized Email Generator',
        x: 820,
        y: 120,
        config: {
          model: 'claude-3-5-sonnet',
          systemPrompt: 'You are an enterprise account executive. Reference company recent funding and scale.',
          temperature: 0.65
        }
      },
      {
        id: 'node_action_crm',
        type: 'http_request',
        title: 'Sync Enriched Lead to Salesforce',
        x: 1220,
        y: 80,
        config: {
          endpoint: 'https://api.salesforce.com/services/data/v58.0/sobjects/Lead',
          method: 'POST'
        }
      },
      {
        id: 'node_action_email',
        type: 'email_send',
        title: 'Send Personalized Founder Note',
        x: 1220,
        y: 280,
        config: {
          provider: 'Resend API',
          to: '{{trigger.work_email}}',
          subject: 'Quick question regarding NovaPulse agent workflows',
          from: 'founders@autoflow.ai'
        }
      }
    ],
    connections: [
      { id: 'conn_l1', fromNode: 'node_trig_lead', fromOutput: 'event_record', toNode: 'node_agent_research', toInput: 'query' },
      { id: 'conn_l2', fromNode: 'node_agent_research', fromOutput: 'summary', toNode: 'node_agent_prompt', toInput: 'prompt_vars' },
      { id: 'conn_l3', fromNode: 'node_agent_prompt', fromOutput: 'generated_text', toNode: 'node_action_crm', toInput: 'request_payload' },
      { id: 'conn_l4', fromNode: 'node_agent_prompt', fromOutput: 'generated_text', toNode: 'node_action_email', toInput: 'body_content' }
    ],
    simulatedSteps: [
      {
        nodeId: 'node_trig_lead',
        status: 'success',
        duration: '28ms',
        tokens: 0,
        log: 'Typeform trigger captured: Elena Rostova from NovaPulse Technologies.',
        output: { company: 'NovaPulse Technologies', title: 'VP of Operations', estimated_arr: '$18M' }
      },
      {
        nodeId: 'node_agent_research',
        status: 'success',
        duration: '690ms',
        tokens: 680,
        log: 'Gemini 1.5 Pro gathered 4 live sources. Found Series B funding ($24M) announced 3 weeks ago.',
        output: { tech_stack: ['Zendesk', 'Salesforce', 'React'], funding: 'Series B ($24M)', key_focus: 'CS Automation' }
      },
      {
        nodeId: 'node_agent_prompt',
        status: 'success',
        duration: '720ms',
        tokens: 540,
        log: 'Claude 3.5 Sonnet generated executive email tailored to NovaPulse recent funding.',
        output: { generated_pitch: 'Congratulated on the $24M Series B, highlighted CS automation.' }
      },
      {
        nodeId: 'node_action_crm',
        status: 'success',
        duration: '140ms',
        tokens: 0,
        log: 'Salesforce REST API: Record created #00Q4W00000abc12 with lead score 94/100.',
        output: { lead_id: '00Q4W00000abc12', assignment: 'Enterprise Pod 1' }
      },
      {
        nodeId: 'node_action_email',
        status: 'success',
        duration: '85ms',
        tokens: 0,
        log: 'Founder welcome note queued for dispatch via Resend.',
        output: { status: 'scheduled', dispatch_time: 'immediate' }
      }
    ]
  }
];
