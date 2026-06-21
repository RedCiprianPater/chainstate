/**
 * CHAINSTATE Edge Worker
 * Deploy to Cloudflare Workers for global edge distribution
 * 
 * This worker handles:
 * - Query dispatch to swarm nodes
 * - Beacon protocol for node discovery
 * - Consensus coordination
 * - Result caching
 */

// Configuration
const CONFIG = {
  SWARM_SIZE: 50,
  CONSENSUS_DEPTH: 3,
  CACHE_TTL: 300, // 5 minutes
  MAX_QUERY_LENGTH: 10000,
  RATE_LIMIT_PER_MINUTE: 60,
  QUANTUM_ENDPOINTS: {
    ibm: 'https://quantum-computing.ibm.com/api/',
    chinese: 'https://api.originqc.com.cn/'
  }
};

// In-memory rate limiting (use Durable Objects in production)
const rateLimitMap = new Map();

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route requests
      switch (path) {
        case '/query':
          return await handleQuery(request, env, corsHeaders);
        
        case '/beacon':
          return await handleBeacon(request, env, corsHeaders);
        
        case '/consensus':
          return await handleConsensus(request, env, corsHeaders);
        
        case '/status':
          return await handleStatus(request, env, corsHeaders);
        
        case '/symbols':
          return await handleSymbols(request, env, corsHeaders);
        
        default:
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders
          });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

/**
 * Handle cognitive query
 */
async function handleQuery(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
  }

  // Rate limiting
  const clientId = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded'
    }), {
      status: 429,
      headers: corsHeaders
    });
  }

  // Parse request
  const body = await request.json();
  const { query, consensusDepth, swarmSize, quantumOffload } = body;

  // Validate
  if (!query || query.length > CONFIG.MAX_QUERY_LENGTH) {
    return new Response(JSON.stringify({
      error: 'Invalid query'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Check cache
  const cacheKey = `query:${hashString(query)}`;
  const cached = await env.CHAINSTATE_CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'HIT'
      }
    });
  }

  // Dispatch to swarm
  const startTime = Date.now();
  
  try {
    // Get available nodes from beacon
    const nodes = await getAvailableNodes(env);
    
    // Select top nodes by reputation
    const selectedNodes = selectTopNodes(nodes, swarmSize || CONFIG.SWARM_SIZE);
    
    // Dispatch query to nodes
    const nodePromises = selectedNodes.map(node => 
      dispatchToNode(node, query, env)
    );
    
    // Wait for responses (with timeout)
    const nodeOutputs = await Promise.allSettled(
      nodePromises.map(p => 
        Promise.race([
          p,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Node timeout')), 30000)
          )
        ])
      )
    );
    
    // Filter successful responses
    const successfulOutputs = nodeOutputs
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
    
    if (successfulOutputs.length < CONFIG.SWARM_SIZE / 2) {
      throw new Error('Insufficient node responses');
    }

    // Quantum offload if requested
    let quantumResult = null;
    if (quantumOffload && quantumOffload !== 'none') {
      quantumResult = await quantumCompute(query, quantumOffload, env);
    }

    // Reach consensus
    const consensusResult = await reachConsensus(
      successfulOutputs,
      consensusDepth || CONFIG.CONSENSUS_DEPTH,
      env
    );

    // Calculate gas
    const gasUsed = calculateGas(
      successfulOutputs.length,
      consensusResult.depth,
      Date.now() - startTime
    );

    // Build response
    const response = {
      query,
      result: consensusResult.state,
      confidence: consensusResult.confidence,
      participatingNodes: successfulOutputs.length,
      consensusDepth: consensusResult.depth,
      executionTime: Date.now() - startTime,
      gasUsed,
      quantumOffload: quantumResult,
      timestamp: new Date().toISOString()
    };

    const responseJson = JSON.stringify(response);

    // Cache result
    await env.CHAINSTATE_CACHE.put(cacheKey, responseJson, {
      expirationTtl: CONFIG.CACHE_TTL
    });

    return new Response(responseJson, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      query,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Handle beacon protocol
 * Nodes register themselves and report status
 */
async function handleBeacon(request, env, corsHeaders) {
  if (request.method === 'POST') {
    // Node registration
    const body = await request.json();
    const { nodeId, reputation, capabilities, endpoint } = body;

    // Store in Durable Object (simplified here)
    const nodeData = {
      nodeId,
      reputation,
      capabilities,
      endpoint,
      lastSeen: new Date().toISOString(),
      region: request.cf?.colo || 'unknown'
    };

    await env.CHAINSTATE_NODES.put(nodeId, JSON.stringify(nodeData));

    return new Response(JSON.stringify({
      status: 'registered',
      nodeId
    }), {
      headers: corsHeaders
    });

  } else if (request.method === 'GET') {
    // Get active nodes
    const nodes = await getAvailableNodes(env);
    
    return new Response(JSON.stringify({
      nodes: nodes.length,
      nodeList: nodes.map(n => ({
        nodeId: n.nodeId,
        reputation: n.reputation,
        region: n.region
      }))
    }), {
      headers: corsHeaders
    });
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: corsHeaders
  });
}

/**
 * Handle consensus status
 */
async function handleConsensus(request, env, corsHeaders) {
  const consensusState = await env.CHAINSTATE_CONSENSUS.get('current');
  
  return new Response(consensusState || JSON.stringify({
    status: 'idle',
    lastConsensus: null
  }), {
    headers: corsHeaders
  });
}

/**
 * Handle status check
 */
async function handleStatus(request, env, corsHeaders) {
  const nodes = await getAvailableNodes(env);
  
  const status = {
    status: 'online',
    version: '0.1.0',
    nodes: {
      total: nodes.length,
      online: nodes.filter(n => n.isOnline).length
    },
    region: request.cf?.colo || 'unknown',
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(status), {
    headers: corsHeaders
  });
}

/**
 * Handle symbol listing
 */
async function handleSymbols(request, env, corsHeaders) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');

  const symbols = {
    math: ['∫', '∂', '∇', '∆', '∑', '∏', '∀', '∃', '∈', '∉', '∪', '∩', '⊂', '⊃', '⊆', '∞'],
    science: ['ℏ', 'ℵ', '⚗', '⚛', '🧬', '🔬', '⚡', '☢', '☣', '♨'],
    occult: ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '♅', '♆', '♇', '⚹', '☤', '☥', '☦', '☪'],
    emoji: ['🧠', '⚡', '🔮', '🌐', '⛓', '🔒', '🔓', '💎', '⚙', '🎯', '🌟', '🔥', '💧', '🌍', '🚀', '✨']
  };

  if (category && symbols[category]) {
    return new Response(JSON.stringify({
      category,
      symbols: symbols[category]
    }), {
      headers: corsHeaders
    });
  }

  return new Response(JSON.stringify(symbols), {
    headers: corsHeaders
  });
}

/**
 * Helper: Get available nodes from KV
 */
async function getAvailableNodes(env) {
  const nodes = [];
  const nodeList = await env.CHAINSTATE_NODES.list();
  
  for (const key of nodeList.keys) {
    const nodeData = await env.CHAINSTATE_NODES.get(key.name);
    if (nodeData) {
      const node = JSON.parse(nodeData);
      // Check if node is recent (within 5 minutes)
      const lastSeen = new Date(node.lastSeen);
      if (Date.now() - lastSeen.getTime() < 300000) {
        nodes.push(node);
      }
    }
  }
  
  return nodes;
}

/**
 * Helper: Select top nodes by reputation
 */
function selectTopNodes(nodes, count) {
  return nodes
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, count);
}

/**
 * Helper: Dispatch query to node
 */
async function dispatchToNode(node, query, env) {
  const response = await fetch(node.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, nodeId: node.nodeId })
  });

  if (!response.ok) {
    throw new Error(`Node ${node.nodeId} returned ${response.status}`);
  }

  return await response.json();
}

/**
 * Helper: Reach consensus (simplified)
 */
async function reachConsensus(outputs, depth, env) {
  // In production, this would use the Durable Object for coordination
  // Here we simulate log-pooling
  
  let consensusState = outputs[0].state;
  
  for (let round = 0; round < depth; round++) {
    // Weighted average of states
    let weightedSum = new Array(65536).fill(0);
    let totalWeight = 0;
    
    for (const output of outputs) {
      const weight = output.reputation || 50;
      const state = output.state;
      
      for (let i = 0; i < 65536; i++) {
        weightedSum[i] += state[i] * weight;
      }
      totalWeight += weight;
    }
    
    // Normalize
    consensusState = weightedSum.map(v => v / totalWeight);
    
    // Filter agreeing nodes
    outputs = outputs.filter(output => {
      const agreement = calculateAgreement(output.state, consensusState);
      return agreement > 0.7;
    });
  }

  return {
    state: consensusState,
    depth,
    confidence: Math.max(...consensusState)
  };
}

/**
 * Helper: Calculate agreement between states
 */
function calculateAgreement(state1, state2) {
  let dot = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < state1.length; i++) {
    dot += state1[i] * state2[i];
    norm1 += state1[i] * state1[i];
    norm2 += state2[i] * state2[i];
  }
  
  return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Helper: Quantum computation offload
 */
async function quantumCompute(query, provider, env) {
  const endpoint = CONFIG.QUANTUM_ENDPOINTS[provider];
  
  if (!endpoint) {
    return null;
  }

  try {
    // This would integrate with actual quantum APIs
    // For now, return placeholder
    return {
      provider,
      status: 'simulated',
      result: null
    };
  } catch (error) {
    return {
      provider,
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Helper: Calculate gas cost
 */
function calculateGas(numNodes, depth, executionTime) {
  const baseCost = 0.001;
  const coordinationCost = numNodes * 0.00001;
  const verificationCost = depth * 0.00005;
  const computeCost = executionTime * 0.000001;
  
  return baseCost + coordinationCost + verificationCost + computeCost;
}

/**
 * Helper: Check rate limit
 */
function checkRateLimit(clientId) {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, []);
  }
  
  const requests = rateLimitMap.get(clientId);
  
  // Remove old requests
  while (requests.length > 0 && requests[0] < windowStart) {
    requests.shift();
  }
  
  // Check limit
  if (requests.length >= CONFIG.RATE_LIMIT_PER_MINUTE) {
    return false;
  }
  
  // Add current request
  requests.push(now);
  return true;
}

/**
 * Helper: Simple hash function
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
