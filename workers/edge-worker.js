/**
 * CHAINSTATE Edge Worker — single-file Cloudflare Worker
 * --------------------------------------------------------
 * Routes:
 *   GET  /              · welcome message
 *   GET  /status        · network health snapshot
 *   POST /query         · submit a cognitive query, returns consensus result
 *   GET  /beacon        · list active swarm nodes (reputation-sorted)
 *   POST /beacon        · register a swarm node (heartbeat)
 *   GET  /consensus     · current consensus state hash
 *   GET  /symbols       · sample symbols from a subspace (?sub=math|sci|lang|occ|emo|ctrl)
 *
 * KV bindings (set in wrangler.toml):
 *   CHAINSTATE_NODES      · live swarm nodes (5-min TTL on inactivity)
 *   CHAINSTATE_CACHE      · result cache, 5-min TTL on queries
 *   CHAINSTATE_CONSENSUS  · latest consensus state (rolling)
 *
 * Env vars (set in wrangler.toml [vars]):
 *   SWARM_SIZE        · default 50
 *   CONSENSUS_DEPTH   · default 3
 *   CACHE_TTL         · default 300 (seconds)
 *   RATE_LIMIT        · per-IP per-minute (default 60)
 *
 * Deploy:
 *   npx wrangler kv:namespace create CHAINSTATE_NODES
 *   npx wrangler kv:namespace create CHAINSTATE_CACHE
 *   npx wrangler kv:namespace create CHAINSTATE_CONSENSUS
 *   # paste namespace IDs into wrangler.toml, then:
 *   npx wrangler deploy
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-NWO-Wallet, X-NWO-Ref',
  'Access-Control-Max-Age':       '86400',
};

const SUBSPACE_SAMPLES = {
  math:  ['∫','∂','∇','∆','∑','∏','∈','∉','∪','∩','∀','∃','⊕','⊗','∞','∝','≈','≠','≤','≥','≡','√','∛','⌊','⌋'],
  sci:   ['ℏ','ℵ','ℂ','ℕ','ℚ','ℝ','ℤ','ℙ','ℍ','⚗','⚛','🧬','🧪','🦠','🔬','🔭','🔮','☢','☣','⚡','🌡','🩺','⚕','🧲','🌊'],
  lang:  ['Α','Β','Γ','Δ','Ε','α','β','γ','δ','А','Б','В','Г','一','二','三','道','心','学','智','ا','ب','ت','ث','א','ב','ג','अ','आ','क','가','나','다','라','마','한','국'],
  occ:   ['☉','☽','☿','♀','♁','♂','♃','♄','☤','☥','☦','☧','☪','☮','☯','✝','✠','♈','♉','♊','♋','🜀','🜁','🜂','🜃','🜄','🜅','🜆'],
  emo:   ['😀','😎','🤔','🧠','👽','🤖','🐉','🦠','🌍','🌐','⛓','🔗','💎','🎯','🚀','✨','🔥','💧','🌟','⚡'],
  ctrl:  ['⇒','⇐','⇑','⇓','⇔','↺','↻','⟳','⟲','⇄','⇆','⇋','⇌','→','←','↑','↓','↔','↕','⟶','⟵','⟷','⟸','⟹','⟺','⤴','⤵'],
};

function j(data, init){
  init = init || {};
  return new Response(JSON.stringify(data), {
    status:  init.status || 200,
    headers: Object.assign({ 'Content-Type':'application/json' }, CORS, init.headers || {}),
  });
}

async function sha3(text){
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function rateLimit(env, ip, limit){
  if(!env.CHAINSTATE_CACHE) return true;
  const window = Math.floor(Date.now()/60000);
  const key = `rl:${ip}:${window}`;
  const v = parseInt((await env.CHAINSTATE_CACHE.get(key))||'0', 10);
  if(v >= limit) return false;
  await env.CHAINSTATE_CACHE.put(key, String(v+1), { expirationTtl: 70 });
  return true;
}

// ----- /status -----
async function handleStatus(env){
  let nodeCount = 0;
  if(env.CHAINSTATE_NODES){
    try{ const list = await env.CHAINSTATE_NODES.list({ limit: 1000 }); nodeCount = list.keys.length; } catch(e){}
  }
  return j({
    network:      'chainstate',
    chain:        'base-mainnet-8453',
    block_time_s: 2,
    swarm_size:   parseInt(env.SWARM_SIZE  || '50', 10),
    cons_depth:   parseInt(env.CONSENSUS_DEPTH || '3', 10),
    cache_ttl_s:  parseInt(env.CACHE_TTL  || '300', 10),
    rate_limit:   parseInt(env.RATE_LIMIT || '60', 10),
    active_nodes: nodeCount,
    timestamp:    new Date().toISOString(),
  });
}

// ----- /symbols -----
async function handleSymbols(req){
  const url = new URL(req.url);
  const sub = (url.searchParams.get('sub') || 'math').toLowerCase();
  const key = ({science:'sci', language:'lang', occult:'occ', emoji:'emo', control:'ctrl'})[sub] || sub;
  if(!SUBSPACE_SAMPLES[key]) return j({ error:'unknown subspace', valid:Object.keys(SUBSPACE_SAMPLES) }, { status: 400 });
  return j({ subspace: key, samples: SUBSPACE_SAMPLES[key] });
}

// ----- /query — simulated swarm + consensus -----
async function handleQuery(req, env){
  let body;
  try{ body = await req.json(); } catch(e){ return j({ error:'invalid JSON' }, { status: 400 }); }
  const query = (body.query || '').toString();
  if(!query) return j({ error:'`query` required' }, { status: 400 });

  const swarmSize     = Math.min(100, Math.max(10, parseInt(body.swarmSize || env.SWARM_SIZE || '50', 10)));
  const consensusDepth= Math.min(7,   Math.max(1,  parseInt(body.consensusDepth || env.CONSENSUS_DEPTH || '3', 10)));
  const useCache      = body.cache !== false;
  const quantumOff    = body.quantumOffload || null;

  // cache check
  const qHash = await sha3(query);
  const cacheKey = `q:${qHash}`;
  if(useCache && env.CHAINSTATE_CACHE){
    const hit = await env.CHAINSTATE_CACHE.get(cacheKey);
    if(hit){
      return new Response(hit, { status: 200, headers: Object.assign({ 'Content-Type':'application/json', 'X-Cache':'HIT' }, CORS) });
    }
  }

  // Determine which subspace dominates the query
  const subSig = {math:0, sci:0, lang:0, occ:0, emo:0, ctrl:0};
  for(const c of query){
    for(const [k,arr] of Object.entries(SUBSPACE_SAMPLES)){
      if(arr.includes(c)) subSig[k]++;
    }
    if(/[A-Za-z]/.test(c)) subSig.lang++;
    if(/[0-9]/.test(c))    subSig.math++;
  }
  const dominantSub = Object.entries(subSig).sort((a,b)=>b[1]-a[1])[0][0];

  // Simulate per-node states (this is intentionally lightweight — real swarm is offboard)
  const nodes = [];
  const n = Math.min(swarmSize, 30);
  for(let i=0;i<n;i++){
    nodes.push({
      node_id:    `node-${i.toString().padStart(3,'0')}`,
      reputation: 50 + Math.random()*40,
      confidence: 0.70 + Math.random()*0.28,
      ms:         Math.floor(200 + Math.random()*900),
    });
  }
  // weight by reputation
  const totalRep = nodes.reduce((s,nd)=>s+nd.reputation,0);
  const meanConf = nodes.reduce((s,nd)=>s + nd.confidence * (nd.reputation/totalRep), 0);

  const exec_ms = Math.max(...nodes.map(n=>n.ms));
  const gas = +(0.001 + n*0.00001 + consensusDepth*0.00005 + exec_ms*0.000001).toFixed(6);

  // top-1 symbol guesses by dominant subspace
  const topSamples = SUBSPACE_SAMPLES[dominantSub] || SUBSPACE_SAMPLES.math;
  const top_symbols = [topSamples[Math.floor(Math.random()*topSamples.length)],
                       topSamples[Math.floor(Math.random()*topSamples.length)],
                       topSamples[Math.floor(Math.random()*topSamples.length)]];

  const result = {
    query,
    qHash,
    top_symbols,
    dominant_subspace:  dominantSub,
    confidence:         +meanConf.toFixed(3),
    participatingNodes: nodes.length,
    consensusDepth,
    executionTime:      exec_ms,
    gasUsed:            gas,
    quantumOffload:     quantumOff ? { provider: quantumOff, status:'queued' } : null,
    timestamp:          new Date().toISOString(),
  };

  if(useCache && env.CHAINSTATE_CACHE){
    await env.CHAINSTATE_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: parseInt(env.CACHE_TTL||'300',10) });
  }
  // update CONSENSUS rolling state
  if(env.CHAINSTATE_CONSENSUS){
    await env.CHAINSTATE_CONSENSUS.put('latest', JSON.stringify({ qHash, ts: result.timestamp, depth: consensusDepth, n: nodes.length }), { expirationTtl: 600 });
  }
  return new Response(JSON.stringify(result), { status: 200, headers: Object.assign({ 'Content-Type':'application/json', 'X-Cache':'MISS' }, CORS) });
}

// ----- /beacon (GET=list, POST=register) -----
async function handleBeacon(req, env){
  if(req.method === 'GET'){
    if(!env.CHAINSTATE_NODES) return j({ nodes: [] });
    const list = await env.CHAINSTATE_NODES.list({ limit: 200 });
    const nodes = [];
    for(const k of list.keys){
      try{
        const v = await env.CHAINSTATE_NODES.get(k.name);
        if(v) nodes.push(JSON.parse(v));
      }catch(e){}
    }
    nodes.sort((a,b)=>(b.reputation||0) - (a.reputation||0));
    return j({ nodes, count: nodes.length });
  }
  if(req.method === 'POST'){
    let body;
    try{ body = await req.json(); } catch(e){ return j({ error:'invalid JSON' }, { status: 400 }); }
    if(!body.node_id || !body.endpoint) return j({ error:'`node_id` and `endpoint` required' }, { status: 400 });
    const record = {
      node_id:       body.node_id,
      reputation:    typeof body.reputation === 'number' ? body.reputation : 50,
      capabilities:  Array.isArray(body.capabilities) ? body.capabilities : ['embedding','attention'],
      endpoint:      body.endpoint,
      dilithium_pk:  body.dilithium_pk || null,
      region:        body.region || null,
      last_ping:     new Date().toISOString(),
    };
    if(env.CHAINSTATE_NODES){
      await env.CHAINSTATE_NODES.put(record.node_id, JSON.stringify(record), { expirationTtl: 300 });
    }
    return j({ ok:true, record });
  }
  return j({ error:'method not allowed' }, { status: 405 });
}

// ----- /consensus (GET) -----
async function handleConsensus(env){
  if(!env.CHAINSTATE_CONSENSUS) return j({ latest: null });
  const v = await env.CHAINSTATE_CONSENSUS.get('latest');
  return j({ latest: v ? JSON.parse(v) : null });
}

// ----- dispatch -----
export default {
  async fetch(req, env){
    if(req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(req.url);
    const ip  = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown';

    // Rate limit (skip on /status, /symbols, GET /beacon)
    const skipRate = (url.pathname === '/status') || (url.pathname === '/symbols')
                   || (url.pathname === '/beacon' && req.method === 'GET')
                   || (url.pathname === '/' );
    if(!skipRate){
      const ok = await rateLimit(env, ip, parseInt(env.RATE_LIMIT||'60',10));
      if(!ok) return j({ error:'rate limited' }, { status: 429 });
    }

    try{
      if(url.pathname === '/'                                    ) return new Response('CHAINSTATE worker · symbolic-weight blockchain · /query /beacon /consensus /status /symbols', { status:200, headers: CORS });
      if(url.pathname === '/status'                              ) return handleStatus(env);
      if(url.pathname === '/symbols'    && req.method === 'GET'  ) return handleSymbols(req);
      if(url.pathname === '/query'      && req.method === 'POST' ) return handleQuery(req, env);
      if(url.pathname === '/beacon'                              ) return handleBeacon(req, env);
      if(url.pathname === '/consensus'  && req.method === 'GET'  ) return handleConsensus(env);
      return j({ error:'not found', path: url.pathname }, { status: 404 });
    } catch(e){
      return j({ error: String(e && e.message || e) }, { status: 500 });
    }
  },
};
