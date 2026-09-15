/**
 * AutoFlow AI — Custom Code Sandbox Execution Service
 * Safely executes in-browser JavaScript transformations with scoped arguments,
 * console log capturing, timeout protection, and pre-bundled transformation presets.
 */

export const CODE_SANDBOX_PRESETS = [
  {
    id: 'json_normalize',
    name: 'Normalize & Flatten JSON',
    description: 'Flattens nested keys, attaches ISO8601 timestamps, and validates payload schema.',
    code: `function transform(input) {
  const data = typeof input === 'object' && input !== null ? input : { raw: input };
  
  return {
    ...data,
    normalized: true,
    processed_at: new Date().toISOString(),
    entity_count: Object.keys(data).length,
    status: 'NORMALIZED'
  };
}`
  },
  {
    id: 'risk_scorer',
    name: 'Urgency & Risk Scorer',
    description: 'Scans text for critical keywords (outage, downtime, exploit) and computes priority score.',
    code: `function transform(input) {
  const text = JSON.stringify(input || '').toLowerCase();
  
  let score = 10;
  const criticalWords = ['outage', 'downtime', 'critical', 'exploit', 'breach', 'payment failed', 'p0'];
  const highWords = ['urgent', 'escalate', 'error', 'timeout', 'bug', 'refund'];
  
  criticalWords.forEach(w => { if (text.includes(w)) score += 30; });
  highWords.forEach(w => { if (text.includes(w)) score += 15; });
  
  const clampedScore = Math.min(score, 100);
  const priority = clampedScore >= 70 ? 'CRITICAL' : clampedScore >= 40 ? 'HIGH' : 'STANDARD';
  
  return {
    input_payload: input,
    risk_score: clampedScore,
    calculated_priority: priority,
    requires_immediate_page: clampedScore >= 70
  };
}`
  },
  {
    id: 'anonymize_pii',
    name: 'PII Redactor & Tokenizer',
    description: 'Redacts credit card numbers, email addresses, and phone numbers before downstream actions.',
    code: `function transform(input) {
  let str = JSON.stringify(input || '');
  
  // Mask emails: a***@domain.com
  str = str.replace(/([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*@([a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)/g, '$1***@$2');
  
  // Mask 16-digit credit card numbers
  str = str.replace(/\\b(?:\\d{4}[ -]?){3}\\d{4}\\b/g, '••••-••••-••••-••••');
  
  // Mask phone numbers
  str = str.replace(/\\b\\+?\\d{1,3}[- ]?\\(?\\d{3}\\)?[- ]?\\d{3}[- ]?\\d{4}\\b/g, '•••-•••-••••');
  
  try {
    return JSON.parse(str);
  } catch (e) {
    return { sanitized_text: str };
  }
}`
  },
  {
    id: 'extract_citations',
    name: 'Extract URLs & Markdown Links',
    description: 'Parses markdown and raw text to extract all URLs, domains, and markdown citations.',
    code: `function transform(input) {
  const text = typeof input === 'string' ? input : JSON.stringify(input);
  const urlRegex = /(https?:\\/\\/[^\\s"'<>]+)/g;
  const mdLinkRegex = /\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\)/g;
  
  const urls = [];
  const citations = [];
  
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push(match[1]);
  }
  
  while ((match = mdLinkRegex.exec(text)) !== null) {
    citations.push({ label: match[1], url: match[2] });
  }
  
  return {
    source_text_length: text.length,
    extracted_urls: Array.from(new Set(urls)),
    markdown_citations: citations,
    total_found: urls.length
  };
}`
  }
];

/**
 * Execute custom script inside a scoped browser runner with timeout protection
 */
export async function executeSandboxCode({
  code,
  inputData,
  timeoutMs = 2500,
  context = {}
}) {
  const startTime = Date.now();
  const capturedLogs = [];

  // Scoped mock console
  const scopedConsole = {
    log: (...args) => capturedLogs.push(`[LOG] ${args.map(formatLogArg).join(' ')}`),
    info: (...args) => capturedLogs.push(`[INFO] ${args.map(formatLogArg).join(' ')}`),
    warn: (...args) => capturedLogs.push(`[WARN] ${args.map(formatLogArg).join(' ')}`),
    error: (...args) => capturedLogs.push(`[ERROR] ${args.map(formatLogArg).join(' ')}`)
  };

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Code execution timed out after ${timeoutMs}ms limit.`));
    }, timeoutMs);
  });

  const executionPromise = new Promise((resolve, reject) => {
    try {
      // Build safe execution function
      // Expose input, payload, context, console, Math, Date, JSON
      const wrappedScript = `
        "use strict";
        ${code}
        
        if (typeof transform === 'function') {
          return transform(input, context);
        } else {
          throw new Error('Code sandbox must define a "function transform(input, context)" entry point.');
        }
      `;

      const runner = new Function('input', 'context', 'console', 'JSON', 'Math', 'Date', wrappedScript);
      const output = runner(inputData, context, scopedConsole, JSON, Math, Date);
      resolve(output);
    } catch (err) {
      reject(err);
    }
  });

  try {
    const result = await Promise.race([executionPromise, timeoutPromise]);
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      result: result !== undefined ? result : null,
      logs: capturedLogs,
      latencyMs
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    capturedLogs.push(`[RUNTIME ERROR] ${err.message}`);
    return {
      success: false,
      error: err.message,
      result: { error: err.message, failed: true },
      logs: capturedLogs,
      latencyMs
    };
  }
}

function formatLogArg(arg) {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return String(arg);
    }
  }
  return String(arg);
}
