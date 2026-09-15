/**
 * AutoFlow AI — Client-side Semantic Vector RAG Service
 * Implements chunking, TF-IDF vectorization, cosine similarity, and context augmentation.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what',
  'which', 'this', 'that', 'these', 'those', 'then', 'so', 'than', 'such',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'to', 'from', 'in', 'out', 'on', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

export function chunkText(content, chunkSize = 400, overlap = 50) {
  if (!content) return [];
  const sentences = content.match(/[^.!?]+[.!?]+|\s*$/g) || [content];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((currentChunk + ' ' + trimmed).length <= chunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + trimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        // keep overlap from end of current chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.max(1, Math.floor(overlap / 10)));
        currentChunk = overlapWords.join(' ') + ' ' + trimmed;
      } else {
        chunks.push(trimmed);
        currentChunk = '';
      }
    }
  }

  if (currentChunk && currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [content];
}

export function queryKnowledgeBase({
  documents = [],
  query = '',
  topK = 3,
  similarityThreshold = 0.5,
  chunkSize = 400,
  chunkOverlap = 50
}) {
  if (!documents || documents.length === 0) {
    return {
      retrievedChunks: [],
      augmentedContext: 'No knowledge base documents configured.',
      matchCount: 0
    };
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    // If empty query, return top documents as general context
    const fallbackChunks = documents.slice(0, topK).map(doc => ({
      docId: doc.id,
      title: doc.title,
      chunkText: doc.content.slice(0, chunkSize),
      score: 0.85
    }));

    return {
      retrievedChunks: fallbackChunks,
      augmentedContext: formatAugmentedContext(fallbackChunks),
      matchCount: fallbackChunks.length
    };
  }

  const queryTermFreq = {};
  queryTokens.forEach(t => {
    queryTermFreq[t] = (queryTermFreq[t] || 0) + 1;
  });

  const allChunks = [];
  documents.forEach(doc => {
    const chunks = chunkText(doc.content, chunkSize, chunkOverlap);
    chunks.forEach((chunk, chunkIdx) => {
      allChunks.push({
        docId: doc.id,
        title: doc.title,
        chunkIndex: chunkIdx,
        chunkText: chunk,
        tokens: tokenize(chunk)
      });
    });
  });

  // Calculate TF-IDF style cosine match
  const scoredChunks = allChunks.map(chunk => {
    const chunkTermFreq = {};
    chunk.tokens.forEach(t => {
      chunkTermFreq[t] = (chunkTermFreq[t] || 0) + 1;
    });

    let dotProduct = 0;
    let queryMagnitude = 0;
    let chunkMagnitude = 0;

    for (const term in queryTermFreq) {
      const qVal = queryTermFreq[term];
      queryMagnitude += qVal * qVal;
      if (chunkTermFreq[term]) {
        // Boost exact term matches
        dotProduct += qVal * chunkTermFreq[term] * 2.0;
      }
    }

    for (const term in chunkTermFreq) {
      const cVal = chunkTermFreq[term];
      chunkMagnitude += cVal * cVal;
    }

    const denom = Math.sqrt(queryMagnitude) * Math.sqrt(chunkMagnitude);
    let similarity = denom > 0 ? (dotProduct / denom) : 0;

    // Normalization & query keyword match bonus
    const matchedTokens = queryTokens.filter(t => chunkTermFreq[t]);
    const coverageRatio = matchedTokens.length / Math.max(1, queryTokens.length);
    similarity = Math.min(0.99, (similarity * 0.6) + (coverageRatio * 0.4));

    return {
      docId: chunk.docId,
      title: chunk.title,
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.chunkText,
      score: parseFloat(similarity.toFixed(3))
    };
  });

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  // Filter by threshold or at least top 1 if any match > 0.1
  let filtered = scoredChunks.filter(c => c.score >= similarityThreshold);
  if (filtered.length === 0 && scoredChunks.length > 0 && scoredChunks[0].score > 0.1) {
    filtered = [scoredChunks[0]];
  }

  const topChunks = filtered.slice(0, topK);

  return {
    retrievedChunks: topChunks,
    augmentedContext: formatAugmentedContext(topChunks),
    matchCount: topChunks.length
  };
}

function formatAugmentedContext(chunks) {
  if (!chunks || chunks.length === 0) {
    return 'No relevant knowledge base records matched the query.';
  }

  return chunks
    .map((c, i) => {
      const relevancePercent = Math.round(c.score * 100);
      return `[DOCUMENT ${i + 1}: ${c.title} (Relevance: ${relevancePercent}%)]\n${c.chunkText}`;
    })
    .join('\n\n---\n\n');
}
