/**
 * CHAINSTATE Edge Worker — single-file Cloudflare Worker
 * --------------------------------------------------------
 * Paste-and-deploy version for the Cloudflare dashboard editor.
 * Works WITHOUT KV bindings (graceful fallback — no persistence) so you
 * can paste, save, deploy in 30 seconds. Add KV bindings later for cache.
 *
 * Routes:
 *   GET  /              · HTML welcome page (status snapshot)
 *   GET  /status        · JSON network health
 *   POST /query         · submit a cognitive query, returns consensus result
 *   GET  /beacon        · list active swarm nodes (reputation-sorted)
 *   POST /beacon        · register a swarm node (heartbeat)
 *   GET  /consensus     · current consensus state hash
 *   GET  /symbols       · sample symbols (?sub=math|sci|lang|occ|emo|ctrl)
 *
 * Optional KV bindings (add in dashboard → Settings → Variables and Secrets):
 *   CHAINSTATE_NODES      · 5-min TTL beacon list
 *   CHAINSTATE_CACHE      · 5-min query result cache + IP rate-limit
 *   CHAINSTATE_CONSENSUS  · rolling consensus state pointer
 *
 * Optional env vars (Settings → Variables and Secrets):
 *   SWARM_SIZE        · default 50
 *   CONSENSUS_DEPTH   · default 3
 *   CACHE_TTL         · default 300 (seconds)
 *   RATE_LIMIT        · per-IP per-minute (default 60)
 */

const WORKER_VERSION = '0.2.0-cors-hardened-2026-06-30';

// CORS: echoes the request origin (more robust than bare '*' through proxies
// and for credentialled requests later), and falls back to '*' when no origin
// is present (e.g. server-to-server curl). Vary: Origin is required so CF
// doesn't serve a cached response with the wrong Allow-Origin header.
function corsHeaders(req){
  const origin = (req && req.headers && req.headers.get('Origin')) || '*';
  return {
    'Access-Control-Allow-Origin':      origin,
    'Access-Control-Allow-Methods':     'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':     'Content-Type, Authorization, X-NWO-Wallet, X-NWO-Ref',
    'Access-Control-Expose-Headers':    'X-Cache, X-Worker-Version',
    'Access-Control-Max-Age':           '86400',
    'Vary':                             'Origin',
    'X-Worker-Version':                 WORKER_VERSION,
  };
}

const SUBSPACE_SAMPLES = {
  math:  ['∫','∂','∇','∆','∑','∏','∈','∉','∪','∩','∀','∃','⊕','⊗','∞','∝','≈','≠','≤','≥','≡','√','∛','⌊','⌋'],
  sci:   ['ℏ','ℵ','ℂ','ℕ','ℚ','ℝ','ℤ','ℙ','ℍ','⚗','⚛','🧬','🧪','🦠','🔬','🔭','🔮','☢','☣','⚡','🌡','🩺','⚕','🧲','🌊'],
  lang:  ['Α','Β','Γ','Δ','Ε','α','β','γ','δ','А','Б','В','Г','一','二','三','道','心','学','智','ا','ب','ت','ث','א','ב','ג','अ','आ','क','가','나','다','라','마','한','국'],
  occ:   ['☉','☽','☿','♀','♁','♂','♃','♄','☤','☥','☦','☧','☪','☮','☯','✝','✠','♈','♉','♊','♋','🜀','🜁','🜂','🜃','🜄','🜅','🜆'],
  emo:   ['😀','😎','🤔','🧠','👽','🤖','🐉','🦠','🌍','🌐','⛓','🔗','💎','🎯','🚀','✨','🔥','💧','🌟','⚡'],
  ctrl:  ['⇒','⇐','⇑','⇓','⇔','↺','↻','⟳','⟲','⇄','⇆','⇋','⇌','→','←','↑','↓','↔','↕','⟶','⟵','⟷','⟸','⟹','⟺','⤴','⤵'],
};

function j(req, data, init){
  init = init || {};
  const headers = Object.assign(
    { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    corsHeaders(req),
    init.headers || {}
  );
  return new Response(JSON.stringify(data, null, 2), {
    status:  init.status || 200,
    headers,
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

// ── HTML welcome page at GET / ────────────────────────────────────
function welcomePage(req, env, bindings){
  const kvOk    = !!(env.CHAINSTATE_NODES && env.CHAINSTATE_CACHE && env.CHAINSTATE_CONSENSUS);
  const kvBadge = kvOk
    ? '<span style="background:#0c3a1c;color:#7df0a8;padding:2px 8px;border-radius:99px;font-size:.7em">KV BOUND</span>'
    : '<span style="background:#3a2c0c;color:#f0e07d;padding:2px 8px;border-radius:99px;font-size:.7em">NO KV YET</span>';
  const body = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CHAINSTATE worker · live</title>
<style>
  body{margin:0;padding:48px 22px;background:#000;color:#fff;font-family:ui-monospace,Menlo,Consolas,monospace;line-height:1.55}
  .wrap{max-width:780px;margin:0 auto}
  h1{font-size:1.6em;letter-spacing:.14em;text-transform:uppercase;margin:0 0 6px;font-weight:700}
  .sub{color:#9c9ca6;font-size:.9em;margin-bottom:24px}
  .row{padding:14px 0;border-top:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;align-items:baseline;gap:14px;flex-wrap:wrap}
  .row:last-child{border-bottom:1px solid rgba(255,255,255,.1)}
  .k{color:#9c9ca6;font-size:.8em;letter-spacing:.12em;text-transform:uppercase}
  .v{color:#fff;font-size:.9em;word-break:break-all}
  code{background:rgba(255,255,255,.06);padding:1px 5px;border-radius:4px}
  .ep{margin-top:28px}
  .ep h2{font-size:.78em;letter-spacing:.18em;text-transform:uppercase;color:#9c9ca6;font-weight:500;margin:0 0 8px}
  .ep ul{list-style:none;padding:0;margin:0}
  .ep li{padding:6px 0;font-size:.88em}
  .ep .m{display:inline-block;width:54px;color:#7df0a8}
  .ep .m.p{color:#7ad0ff}
  a{color:#7df0a8;text-decoration:underline;text-underline-offset:2px}
  .foot{margin-top:36px;color:#5a5a64;font-size:.78em}
</style>
</head><body><div class="wrap">
  <h1>CHAIN<span style="color:#9c9ca6;font-weight:400">STATE</span> worker</h1>
  <div class="sub">symbolic-weight blockchain · edge dispatcher · ${new Date().toISOString()}</div>

  <div class="row"><span class="k">Status</span><span class="v">running ${kvBadge}</span></div>
  <div class="row"><span class="k">Network</span><span class="v">chainstate · base mainnet 8453</span></div>
  <div class="row"><span class="k">Swarm size</span><span class="v">${env.SWARM_SIZE || '50'} (default)</span></div>
  <div class="row"><span class="k">Consensus depth</span><span class="v">${env.CONSENSUS_DEPTH || '3'} rounds</span></div>
  <div class="row"><span class="k">Cache TTL</span><span class="v">${env.CACHE_TTL || '300'} s</span></div>
  <div class="row"><span class="k">Rate limit</span><span class="v">${env.RATE_LIMIT || '60'} req / min / IP</span></div>
  <div class="row"><span class="k">KV NODES</span><span class="v">${bindings.nodes}</span></div>
  <div class="row"><span class="k">KV CACHE</span><span class="v">${bindings.cache}</span></div>
  <div class="row"><span class="k">KV CONSENSUS</span><span class="v">${bindings.consensus}</span></div>

  <div class="ep">
    <h2>Endpoints</h2>
    <ul>
      <li><span class="m">GET</span> <code>/status</code>          — JSON network health</li>
      <li><span class="m p">POST</span> <code>/query</code>        — submit a cognitive query</li>
      <li><span class="m">GET</span> <code>/beacon</code>          — list swarm nodes</li>
      <li><span class="m p">POST</span> <code>/beacon</code>       — register a swarm node</li>
      <li><span class="m">GET</span> <code>/consensus</code>       — current consensus state</li>
      <li><span class="m">GET</span> <code>/symbols?sub=math</code> — sample symbols from a subspace</li>
    </ul>
  </div>

  <div class="ep">
    <h2>Try it</h2>
    <ul>
      <li><a href="/status">/status</a></li>
      <li><a href="/symbols?sub=math">/symbols?sub=math</a> · <a href="/symbols?sub=occ">/symbols?sub=occ</a> · <a href="/symbols?sub=ctrl">/symbols?sub=ctrl</a></li>
      <li><a href="/beacon">/beacon</a></li>
      <li><code>curl -X POST -H 'content-type: application/json' -d '{"query":"&#8747;&#8706;x &#8594; ?","swarmSize":20,"consensusDepth":3}' /query</code></li>
    </ul>
  </div>

  <div class="foot">
    Worker version: <code>${WORKER_VERSION}</code> · CORS: enabled<br>
    Frontend: <a href="https://cpater-chainstate.static.hf.space">cpater-chainstate.static.hf.space</a>
    · GitHub: <a href="https://github.com/RedCiprianPater/chainstate">RedCiprianPater/chainstate</a>
    ${kvOk ? '' : '<br>· Worker is running without KV bindings — add CHAINSTATE_NODES, CHAINSTATE_CACHE, CHAINSTATE_CONSENSUS in Settings → Variables and Secrets → KV namespace bindings to enable beacon persistence and result caching.'}
  </div>
</div></body></html>`;
  return new Response(body, { status: 200, headers: Object.assign({ 'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store' }, corsHeaders(req)) });
}

// ── /status ────────────────────────────────────────────────────────
async function handleStatus(req, env){
  let nodeCount = 0;
  if(env.CHAINSTATE_NODES){
    try{ const list = await env.CHAINSTATE_NODES.list({ limit: 1000 }); nodeCount = list.keys.length; } catch(e){}
  }
  return j(req, {
    network:        'chainstate',
    chain:          'base-mainnet-8453',
    block_time_s:   2,
    swarm_size:     parseInt(env.SWARM_SIZE || '50', 10),
    cons_depth:     parseInt(env.CONSENSUS_DEPTH || '3', 10),
    cache_ttl_s:    parseInt(env.CACHE_TTL || '300', 10),
    rate_limit:     parseInt(env.RATE_LIMIT || '60', 10),
    active_nodes:   nodeCount,
    kv_bound:       !!(env.CHAINSTATE_NODES && env.CHAINSTATE_CACHE && env.CHAINSTATE_CONSENSUS),
    worker_version: WORKER_VERSION,
    cors_enabled:   true,
    timestamp:      new Date().toISOString(),
  });
}

// ── /symbols ───────────────────────────────────────────────────────
async function handleSymbols(req){
  const url = new URL(req.url);
  const sub = (url.searchParams.get('sub') || 'math').toLowerCase();
  const key = ({science:'sci', language:'lang', occult:'occ', emoji:'emo', control:'ctrl'})[sub] || sub;
  if(!SUBSPACE_SAMPLES[key]) return j(req, { error:'unknown subspace', valid:Object.keys(SUBSPACE_SAMPLES) }, { status: 400 });
  return j(req, { subspace: key, samples: SUBSPACE_SAMPLES[key] });
}

// ── /query — simulated swarm + consensus ──────────────────────────
async function handleQuery(req, env){
  let body;
  try{ body = await req.json(); } catch(e){ return j(req, { error:'invalid JSON' }, { status: 400 }); }
  const query = (body.query || '').toString();
  if(!query) return j(req, { error:'`query` required' }, { status: 400 });

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
      return new Response(hit, { status: 200, headers: Object.assign({ 'Content-Type':'application/json','X-Cache':'HIT','Cache-Control':'no-store' }, corsHeaders(req)) });
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

  // Simulate per-node states (real swarm is offboard)
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
  const totalRep = nodes.reduce((s,nd)=>s+nd.reputation,0);
  const meanConf = nodes.reduce((s,nd)=>s + nd.confidence * (nd.reputation/totalRep), 0);

  const exec_ms = Math.max(...nodes.map(n=>n.ms));
  const gas = +(0.001 + n*0.00001 + consensusDepth*0.00005 + exec_ms*0.000001).toFixed(6);

  const topSamples = SUBSPACE_SAMPLES[dominantSub] || SUBSPACE_SAMPLES.math;
  const top_symbols = [
    topSamples[Math.floor(Math.random()*topSamples.length)],
    topSamples[Math.floor(Math.random()*topSamples.length)],
    topSamples[Math.floor(Math.random()*topSamples.length)],
  ];

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
  if(env.CHAINSTATE_CONSENSUS){
    await env.CHAINSTATE_CONSENSUS.put('latest', JSON.stringify({ qHash, ts: result.timestamp, depth: consensusDepth, n: nodes.length }), { expirationTtl: 600 });
  }
  return new Response(JSON.stringify(result, null, 2), { status: 200, headers: Object.assign({ 'Content-Type':'application/json','X-Cache':'MISS','Cache-Control':'no-store' }, corsHeaders(req)) });
}

// ── /beacon (GET=list, POST=register) ──────────────────────────────
async function handleBeacon(req, env){
  if(req.method === 'GET'){
    if(!env.CHAINSTATE_NODES) return j(req, { nodes: [], count: 0, kv_bound: false });
    const list = await env.CHAINSTATE_NODES.list({ limit: 200 });
    const nodes = [];
    for(const k of list.keys){
      try{
        const v = await env.CHAINSTATE_NODES.get(k.name);
        if(v) nodes.push(JSON.parse(v));
      }catch(e){}
    }
    nodes.sort((a,b)=>(b.reputation||0) - (a.reputation||0));
    return j(req, { nodes, count: nodes.length });
  }
  if(req.method === 'POST'){
    let body;
    try{ body = await req.json(); } catch(e){ return j(req, { error:'invalid JSON' }, { status: 400 }); }
    if(!body.node_id || !body.endpoint) return j(req, { error:'`node_id` and `endpoint` required' }, { status: 400 });
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
      return j(req, { ok:true, record });
    }
    return j(req, { ok:false, note:'CHAINSTATE_NODES KV binding not configured — record not persisted', record });
  }
  return j(req, { error:'method not allowed' }, { status: 405 });
}

// ── /consensus (GET) ───────────────────────────────────────────────
async function handleConsensus(req, env){
  if(!env.CHAINSTATE_CONSENSUS) return j(req, { latest: null, kv_bound: false });
  const v = await env.CHAINSTATE_CONSENSUS.get('latest');
  return j(req, { latest: v ? JSON.parse(v) : null });
}

// ── dispatch ───────────────────────────────────────────────────────
export default {
  async fetch(req, env){
    if(req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });

    const url = new URL(req.url);
    const ip  = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown';

    // Rate limit (skip on /, /status, /symbols, GET /beacon)
    const skipRate = (url.pathname === '/')
                   || (url.pathname === '/status')
                   || (url.pathname === '/symbols')
                   || (url.pathname === '/beacon' && req.method === 'GET');
    if(!skipRate){
      const ok = await rateLimit(env, ip, parseInt(env.RATE_LIMIT||'60',10));
      if(!ok) return j(req, { error:'rate limited' }, { status: 429 });
    }

    try{
      if(url.pathname === '/'){
        const bindings = {
          nodes:     env.CHAINSTATE_NODES     ? 'bound ✓'   : 'not bound (optional)',
          cache:     env.CHAINSTATE_CACHE     ? 'bound ✓'   : 'not bound (optional)',
          consensus: env.CHAINSTATE_CONSENSUS ? 'bound ✓'   : 'not bound (optional)',
        };
        return welcomePage(req, env, bindings);
      }
      if(url.pathname === '/status'                              ) return handleStatus(req, env);
      if(url.pathname === '/symbols'    && req.method === 'GET'  ) return handleSymbols(req);
      if(url.pathname === '/query'      && req.method === 'POST' ) return handleQuery(req, env);
      if(url.pathname === '/beacon'                              ) return handleBeacon(req, env);
      if(url.pathname === '/consensus'  && req.method === 'GET'  ) return handleConsensus(req, env);
      return j(req, { error:'not found', path: url.pathname }, { status: 404 });
    } catch(e){
      return j(req, { error: String(e && e.message || e) }, { status: 500 });
    }
  },
};
