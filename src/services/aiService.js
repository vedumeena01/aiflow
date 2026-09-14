/**
 * AutoFlow AI — Live Multi-Agent Inference Engine
 * Supports Google Gemini, Anthropic Claude, OpenAI, Groq, and RabbitMQ event streaming.
 */

export async function executeLiveAgentNode({
  node,
  inputData,
  apiKeys,
  systemInstructions
}) {
  const model = node.config?.model || 'claude-3-5-sonnet';
  const temperature = typeof node.config?.temperature === 'number' ? node.config.temperature : 0.7;
  const userTemplate = node.config?.userPromptTemplate || 'Analyze the context:\n{{input_context}}';

  // 1. Interpolate variables into prompt
  const serializedInput = typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2);
  let promptText = userTemplate
    .replace(/\{\{input_context\}\}/g, serializedInput)
    .replace(/\{\{trigger\.payload\}\}/g, serializedInput)
    .replace(/\{\{raw_text\}\}/g, serializedInput);

  if (promptText === userTemplate && !promptText.includes(serializedInput)) {
    promptText = `${promptText}\n\n[INPUT DATA]:\n${serializedInput}`;
  }

  const systemPrompt = systemInstructions || node.config?.systemPrompt || 'You are an autonomous AI specialist running in a Ralph iterative loop.';

  const startTime = Date.now();

  // Route by provider
  // 1. Anthropic Claude (Claude 3.5 Sonnet, Claude 3 Opus)
  if (model.includes('claude') && apiKeys.anthropic) {
    return await callAnthropicClaudeAPI({
      apiKey: apiKeys.anthropic,
      model: model === 'claude-3-5-sonnet' ? 'claude-3-5-sonnet-20241022' : 'claude-3-haiku-20240307',
      systemPrompt,
      promptText,
      temperature,
      startTime
    });
  } 
  // 2. Google Gemini
  else if (model.startsWith('gemini') || (!apiKeys.openai && !apiKeys.anthropic && apiKeys.gemini)) {
    return await callGeminiAPI({
      apiKey: apiKeys.gemini,
      model: model.includes('pro') ? 'gemini-1.5-pro' : 'gemini-1.5-flash',
      systemPrompt,
      promptText,
      temperature,
      startTime
    });
  } 
  // 3. Groq Llama 3.3
  else if (model.startsWith('llama') && apiKeys.groq) {
    return await callOpenAICompatibleAPI({
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: apiKeys.groq,
      model: 'llama-3.3-70b-versatile',
      systemPrompt,
      promptText,
      temperature,
      startTime
    });
  } 
  // 4. OpenAI
  else if (apiKeys.openai) {
    const openaiModel = model.includes('deepseek') ? 'gpt-4o-mini' : 'gpt-4o';
    return await callOpenAICompatibleAPI({
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: apiKeys.openai,
      model: openaiModel,
      systemPrompt,
      promptText,
      temperature,
      startTime
    });
  } else {
    throw new Error('No valid API Key provided for live inference. Please configure an API key (Claude, Gemini, Groq, or OpenAI) in Settings.');
  }
}

/**
 * Direct Anthropic Claude API Caller (Messages API)
 */
async function callAnthropicClaudeAPI({ apiKey, model, systemPrompt, promptText, temperature, startTime }) {
  if (!apiKey) throw new Error('Anthropic API Key missing. Please configure your key in Settings.');

  const url = 'https://api.anthropic.com/v1/messages';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'dangerously-allow-browser': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: systemPrompt,
      temperature: Math.min(Math.max(temperature, 0), 1),
      messages: [
        { role: 'user', content: promptText }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic Claude API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  const responseText = data.content?.[0]?.text || '';
  const tokenCount = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

  let parsedPayload = responseText;
  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedPayload = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  } catch (e) {}

  return {
    rawOutput: responseText,
    parsedPayload,
    tokens: tokenCount,
    latencyMs,
    provider: 'Anthropic Claude',
    model
  };
}

/**
 * Direct Google Gemini API Caller
 */
async function callGeminiAPI({ apiKey, model, systemPrompt, promptText, temperature, startTime }) {
  if (!apiKey) throw new Error('Gemini API Key missing. Please configure your key in Settings.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n${promptText}` }]
      }
    ],
    generationConfig: {
      temperature: Math.min(Math.max(temperature, 0), 1),
      maxOutputTokens: 1500
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  const candidate = data.candidates?.[0];
  const responseText = candidate?.content?.parts?.[0]?.text || '';
  const tokenCount = data.usageMetadata?.totalTokenCount || Math.ceil(responseText.length / 4);

  let parsedPayload = responseText;
  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedPayload = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  } catch (e) {}

  return {
    rawOutput: responseText,
    parsedPayload,
    tokens: tokenCount,
    latencyMs,
    provider: 'Google Gemini',
    model
  };
}

/**
 * OpenAI / Groq Compatible Chat Completions Caller
 */
async function callOpenAICompatibleAPI({ endpoint, apiKey, model, systemPrompt, promptText, temperature, startTime }) {
  if (!apiKey) throw new Error('API Key missing for inference.');

  const requestBody = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: promptText }
    ],
    temperature
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Inference API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  const responseText = data.choices?.[0]?.message?.content || '';
  const tokenCount = data.usage?.total_tokens || Math.ceil(responseText.length / 4);

  let parsedPayload = responseText;
  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedPayload = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  } catch (e) {}

  return {
    rawOutput: responseText,
    parsedPayload,
    tokens: tokenCount,
    latencyMs,
    provider: endpoint.includes('groq') ? 'Groq (Llama)' : 'OpenAI',
    model
  };
}

/**
 * Safety Verification Agent: Scans agent payload before Action nodes fire
 */
export function verifyActionSafety(payload) {
  const stringified = typeof payload === 'string' ? payload : JSON.stringify(payload);
  
  const warnings = [];
  if (/sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{30,}/.test(stringified)) {
    warnings.push('Potential secret or API key exposed in action payload.');
  }
  if (/DROP\s+TABLE|DELETE\s+FROM|rm\s+-rf/i.test(stringified)) {
    warnings.push('Potentially destructive query or command detected in payload.');
  }

  return {
    passed: warnings.length === 0,
    warnings
  };
}
