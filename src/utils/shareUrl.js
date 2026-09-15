/**
 * AutoFlow AI — Workflow URL Share Engine
 * Encodes/decodes workflow definitions to/from URL hash fragments for zero-backend sharing.
 */

/**
 * Universal Base64 encoder (works in Node.js and Browser)
 */
function toBase64(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/**
 * Universal Base64 decoder (works in Node.js and Browser)
 */
function fromBase64(base64) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return decodeURIComponent(
    Array.prototype.map.call(bytes, (byte) => '%' + ('00' + byte.toString(16)).slice(-2)).join('')
  );
}

/**
 * Encodes workflow into a URL-safe hash fragment
 */
export function encodeWorkflowToShareUrl(workflow) {
  if (!workflow) return '';

  const minimal = {
    name: workflow.name || 'Shared Workflow',
    nodes: (workflow.nodes || []).map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      position: n.position || { x: 100, y: 100 },
      config: n.config || {}
    })),
    connections: (workflow.connections || []).map(c => ({
      id: c.id,
      fromNodeId: c.fromNodeId,
      toNodeId: c.toNodeId,
      label: c.label || ''
    })),
    v: 1
  };

  const json = JSON.stringify(minimal);
  const b64 = toBase64(json);
  // URL-safe replacement
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes workflow from a URL-safe hash fragment
 */
export function decodeWorkflowFromShareUrl(encoded) {
  if (!encoded || typeof encoded !== 'string') return null;

  try {
    let b64 = encoded.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) {
      b64 += '=';
    }

    const json = fromBase64(b64);
    const parsed = JSON.parse(json);

    if (!parsed || !Array.isArray(parsed.nodes)) {
      return null;
    }

    return {
      name: parsed.name || 'Shared Workflow',
      nodes: parsed.nodes,
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
      isShared: true
    };
  } catch (err) {
    console.error('AutoFlow URL share parser error:', err);
    return null;
  }
}

/**
 * Returns the full browser shareable URL
 */
export function getShareableLink(workflow) {
  const token = encodeWorkflowToShareUrl(workflow);
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}${window.location.pathname}#share=${token}`;
  }
  return `http://localhost:5173/#share=${token}`;
}

/**
 * Checks current window URL for incoming shared workflow
 */
export function checkUrlForSharedWorkflow() {
  if (typeof window === 'undefined' || !window.location || !window.location.hash) {
    return null;
  }

  const hash = window.location.hash;
  const match = hash.match(/#share=([^&]+)/);
  if (match && match[1]) {
    return decodeWorkflowFromShareUrl(match[1]);
  }
  return null;
}
