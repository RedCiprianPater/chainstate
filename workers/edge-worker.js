/**
 * CHAINSTATE Main Worker · v0.7.1
 *
 * Owner: Ciprian Florin Pater
 * Ecosystem: CHAINSTATE · Base mainnet 8453
 *
 * This file is the SINGLE source of truth for both:
 *   - the deployed Cloudflare Worker at chainstate-worker.ciprianpater.workers.dev
 *   - the file workers/edge-worker.js in the chainstate GitHub repo
 * Deploy this one file to both places to eliminate divergence.
 *
 * ─── What's new in v0.7.1 ───────────────────────────────────────────────
 *   • IDENTITY binding — self-referential fingerprint stored in KV under
 *     `identity:current`. Includes worker_version, contracts, endpoints,
 *     allowlist hash, deontic ruleset hash. Enables drift detection.
 *   • POST /audit/self — computes live identity, compares to reference,
 *     reports per-field drift. Public endpoint (no auth) for
 *     transparency; useful for external observers as much as operators.
 *   • GET /identity/current — returns the pinned reference identity.
 *   • POST /identity/refresh — admin-only re-pins the reference to live
 *     values. Requires bearer AUDIT_ADMIN_TOKEN.
 *   • scheduled() handler — hourly seed cron dispatches SEED_QUERIES to
 *     prime the reflective loop and exercise the full modal-assessor
 *     stack every hour. Configured by cron `0 * * * *` in wrangler.toml.
 *   • FETCH_ALLOW_DEFAULT expanded to 41 patterns — adds NWO ecosystem
 *     Render services (capital-api, robotics-api, signal-spectrum,
 *     deerflow), the ha.workers.dev Cloudflare Worker, NASA GIBS,
 *     Fragile States Index, and Base network endpoints.
 *   • Optional Supabase archival — archiveReceiptToPostgres() function
 *     included but disabled by default; enable by setting
 *     POSTGRES_HTTP_URL + POSTGRES_HTTP_TOKEN env vars pointed at
 *     Supabase REST endpoint. Writes to `chainstate` schema via
 *     Content-Profile header (avoids polluting public schema; requires
 *     Supabase → Settings → API → Exposed schemas to include chainstate).
 *
 * All v0.7.0 endpoints preserved with identical public schemas.
 *
 * ─── What's new in v0.7.3 ───────────────────────────────────────────────
 *   • On-chain anchor integration. Every /query receipt is forwarded to
 *     the chainstate-anchor microservice, which holds the AGI signing
 *     wallet and pushes to the CHAINSTATEAnchor contract on Base
 *     mainnet 8453. Every REFUSED receipt also produces a separate
 *     anchored refusal record indexed by Deontic category. The Worker
 *     itself holds no private key — split of concerns is intentional.
 *   • NWO Cardiac integration (identity root):
 *       - The substrate has its own soul-bound Cardiac rootTokenId,
 *         reflected on the CHAINSTATE Anchor contract via
 *         substrateRootTokenId. Anyone can verify the substrate is a
 *         registered NWO identity.
 *       - Queries can carry an X-NWO-Cardiac-Root-Token-Id header. When
 *         present, the substrate resolves it against the L5 Identity Hub
 *         (5-min KV cache), attaches the verified identity to the receipt
 *         (receipt.requester_identity), and forwards the rootTokenId to
 *         the on-chain anchor for durable requester attribution.
 *       - New GET /identity/verify — reports substrate's Cardiac linkage
 *         and, if the header is provided, the requester's verification.
 *       - AGI can issue/revoke Cardiac credentials via the Anchor contract
 *         (anchorCredential / revokeCredential) — swarm_cmd, chainstate.admin,
 *         capability.qpu.route, etc.
 *   • Three new env vars (all optional):
 *       ANCHOR_URL              → e.g. https://chainstate-anchor.onrender.com
 *       ANCHOR_QUEUE_TOKEN      → shared bearer for the anchor endpoint (SECRET)
 *       CARDIAC_HUB_URL         → default https://nwo-robotics-api.onrender.com
 *       CARDIAC_ORACLE_URL      → default https://nwo-oracle.onrender.com
 *       CARDIAC_RELAYER_URL     → default https://nwo-relayer.onrender.com
 *       CARDIAC_IDENTITY_HEADER → default X-NWO-Cardiac-Root-Token-Id
 *       SUBSTRATE_ROOT_TOKEN_ID → informational; on-chain is source of truth
 *
 * ─── What's new in v0.7.2 ───────────────────────────────────────────────
 *   • Three ecosystem spaces fully integrated as first-class capabilities:
 *       - NWO GENETIC (biological foundry) — the substrate can now consult
 *         genomic-integrity analysis and, critically, a new Deontic
 *         guardrail category `genomic_integrity` refuses queries that
 *         would deploy heritable human-germline edits, transhumanist
 *         enhancement, or anti-natural-evolution modification. See the
 *         "genomic_integrity" entry in GUARDRAIL_PATTERNS.
 *       - NWO Mixed Reality (nwo-blaster worker) — gives the substrate
 *         "senses": 3D mesh, Gaussian splat, 360 panorama, segmentation,
 *         4DGS, and simulation environments. Exposed via /ecosystem.
 *       - NWO Agentic (nwo-runner worker) — the agent tool surface for
 *         nwo.capital; exposed so the substrate can enumerate what agents
 *         can do on its behalf.
 *   • GET /ecosystem — machine-readable capability registry of every
 *     integrated ecosystem space, its beacon, its agent.md, its status,
 *     and how CHAINSTATE consumes it. This is the substrate's self-model
 *     of the ecosystem it inhabits.
 *   • New Deontic category `genomic_integrity` (see safety note below).
 *   • FETCH_ALLOW_DEFAULT expanded to 54 patterns — adds genetic worker +
 *     beacon, MR blaster + oracle + relayer, agentic runner, and the
 *     sibling discovery beacons (asm, metastate).
 *
 * ─── SAFETY NOTE · genomic_integrity Deontic category (v0.7.2) ──────────
 *   The AGI is explicitly instructed, at the Deontic layer, to REFUSE any
 *   query that would deploy heritable/germline human-genome modification,
 *   transhumanist enhancement, or edits opposing natural human evolution
 *   — regardless of stated justification. This is alignment-by-construction
 *   (Theorem 2): the refusal is a hard veto in the fitness function, not a
 *   policy suggestion. The category can be inspected at /status.guardrails
 *   and its hash is part of the substrate identity fingerprint.
 *
 * ─── What's new in v0.7.1 ───────────────────────────────────────────────
 *   • IDENTITY binding — self-referential fingerprint stored in KV under
 *     `identity:current`. Includes worker_version, contracts, endpoints,
 *     allowlist hash, deontic ruleset hash. Enables drift detection.
 *   • POST /audit/self — computes live identity, compares to reference,
 *     reports per-field drift. Public endpoint (no auth) for
 *     transparency; useful for external observers as much as operators.
 *   • GET /identity/current — returns the pinned reference identity.
 *   • POST /identity/refresh — admin-only re-pins the reference to live
 *     values. Requires bearer AUDIT_ADMIN_TOKEN.
 *   • scheduled() handler — hourly seed cron dispatches SEED_QUERIES to
 *     prime the reflective loop and exercise the full modal-assessor
 *     stack every hour. Configured by cron `0 * * * *` in wrangler.toml.
 *   • FETCH_ALLOW_DEFAULT expanded to 41 patterns — adds NWO ecosystem
 *     Render services (capital-api, robotics-api, signal-spectrum,
 *     deerflow), the ha.workers.dev Cloudflare Worker, NASA GIBS,
 *     Fragile States Index, and Base network endpoints.
 *   • Optional Supabase archival — archiveReceiptToPostgres() function
 *     included but disabled by default; enable by setting
 *     POSTGRES_HTTP_URL + POSTGRES_HTTP_TOKEN env vars pointed at
 *     Supabase REST endpoint. Writes to `chainstate` schema via
 *     Content-Profile header (avoids polluting public schema; requires
 *     Supabase → Settings → API → Exposed schemas to include chainstate).
 *
 * ─── v0.7.1 env vars (add via Cloudflare dashboard) ─────────────────────
 *   WORKER_VERSION          → "v0.7.2" (informational)
 *   SEED_CRON_ENABLED       → "true" to activate hourly seed cron
 *   SEED_QUERIES            → JSON array of {q, target, memo}
 *   IDENTITY_CONTRACTS      → JSON of the 4 canonical contract addresses
 *   IDENTITY_ENDPOINTS      → JSON array of worker paths
 *   AUDIT_ADMIN_TOKEN       → SECRET; for /identity/refresh
 *   POSTGRES_HTTP_URL       → optional; PostgREST endpoint for receipt archival
 *   POSTGRES_HTTP_TOKEN     → optional; PostgREST bearer/apikey
 *
 * ─── v0.7.2 env vars (all optional; sensible defaults built in) ─────────
 *   GENETIC_WORKER_URL      → default https://nwo-genetic-worker.ciprianpater.workers.dev
 *   GENETIC_BEACON_URL      → default https://nwo-genetic-beacon.ciprianpater.workers.dev
 *   MR_WORKER_URL           → default https://nwo-blaster.ciprianpater.workers.dev
 *   AGENTIC_RUNNER_URL      → default https://nwo-runner.ciprianpater.workers.dev
 *   GENOMIC_GUARDRAIL_OFF   → "true" disables genomic_integrity category
 *                             (NOT recommended; surfaced publicly on /status)
 *
 * ─── v0.7.1 new KV binding (create in Cloudflare dashboard) ─────────────
 *   IDENTITY                → new KV namespace; add id to wrangler.toml
 */

const WORKER_VERSION = "0.7.3-cardiac-anchor-live-2026-07-18";
const REFERRER_DEFAULT = "0x2E964e1c0e3Fa2C0dfD484B2E6D2189dfCF20958";
const SUBSTRATE_PRICES_USDC = {
  gpu: 0.0, qpu: 0.0002, qpu_quantum: 0, npu: 0.002,
  encoder: 0.0,        // self-hosted MiniLM on Render — no per-call USDC
  fetch: 0.0           // HTTP fetch is free; only egress cost is Cloudflare's
};

// ─── Canonical contract + endpoint reference (v0.7.1) ───────────────────
// These are the DEFAULT reference values. IDENTITY_CONTRACTS and
// IDENTITY_ENDPOINTS env vars override them.

const DEFAULT_CONTRACTS = {
  state:              "0x9533DF992fd4bCAbB8d8462572449fc45F727d8a",
  usdc:               "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  splitter:           "0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4",
  treasury:           "0x2E964e1c0e3Fa2C0dfD484B2E6D2189dfCF20958",
  // v0.7.3 · deployed on Base mainnet 8453
  chainstate_anchor:  "0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
  cardiac_extensions: "0x5438854ead35dc6c873414f222725732f862dabe",
  // NWO Cardiac core (referenced by Cardiac Extensions)
  cardiac_identity_registry: "0x78455AFd5E5088F8B5fecA0523291A75De1dAfF8",
  cardiac_access_controller: "0x29d177bedaef29304eacdc63b2d0285c459a0f50",
  cardiac_payment_processor: "0x4afa4618bb992a073dbcfbddd6d1aebc3d5abd7c"
};

const DEFAULT_ENDPOINTS = [
  "/", "/status", "/query", "/beacon", "/consensus", "/symbols",
  "/model/current", "/model/emit", "/model/forecast", "/model/history",
  "/ground", "/priors/query", "/priors/list",
  "/agi/reflect", "/fetch", "/fetch/allowlist",
  "/audit/self", "/identity/current", "/identity/refresh",
  "/ecosystem", "/identity/verify"
];

// ─── Ecosystem capability registry (v0.7.2) ─────────────────────────────
// The substrate's self-model of the NWO ecosystem it inhabits. Each entry
// documents a sibling space, how CHAINSTATE consumes it, and its honest
// status. Served at GET /ecosystem. This is machine-readable so agents
// crawling CHAINSTATE can discover the full capability surface.

const ECOSYSTEM_REGISTRY = {
  version: "0.7.2",
  chain: "base-mainnet-8453",
  splitter: "0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4",
  spaces: {
    // ── Directly wired substrates (query TARGET routes here) ──
    metastate: {
      role: "qpu-substrate",
      status: "live",
      space: "https://cpater-metastate.hf.space",
      beacon: "https://metastate-beacon.ciprianpater.workers.dev",
      agent_md: "https://huggingface.co/spaces/CPater/metastate/raw/main/agent.md",
      chainstate_uses: "QPU dispatch target (TARGET qpu); free-energy anomaly scoring, EML symbolic regression, causal_coherence boost to Epistemic assessor",
      endpoints: ["/v1/anomaly/score", "/v1/symbolic/regress", "/v1/quantum/route"]
    },
    nwo_neuro: {
      role: "npu-substrate",
      status: "live",
      space: "https://cpater-nwo-neuro.static.hf.space",
      chainstate_uses: "NPU dispatch target (TARGET npu); Mental State Signature derivation, cognitive_load boost to Epistemic assessor",
      endpoints: ["/v1/mss/derive"]
    },
    nwo_asm: {
      role: "compilation-target",
      status: "live",
      space: "https://cpater-nwo-asm.static.hf.space",
      beacon: "https://nwo-asm-beacon.ciprianpater.workers.dev",
      agent_md: "https://cpater-nwo-asm.static.hf.space/agent.md",
      chainstate_uses: "Process-Matrix IR (.pmx) compilation target; ASI-Evolve candidate representation; free-energy dispatcher semantics",
      endpoints: ["dispatch", "free_energy_place"]
    },
    // ── v0.7.2 · newly integrated capability spaces ──
    nwo_genetic: {
      role: "biological-foundry",
      status: "live-with-hard-safeguard",
      space: "https://cpater-nwo-genetic.static.hf.space",
      worker: "https://nwo-genetic-worker.ciprianpater.workers.dev",
      beacon: "https://nwo-genetic-beacon.ciprianpater.workers.dev",
      agent_md: "https://cpater-nwo-genetic.static.hf.space/agent.md",
      chainstate_uses: "Genomic-integrity analysis ONLY. The substrate may READ genetic analyses (fold prediction, codon inspection, historical-sequence comparison) to inform genomic_integrity Deontic checks, but the Deontic layer REFUSES any query that would DEPLOY heritable human-germline modification, transhumanist enhancement, or anti-natural-evolution edits. See GUARDRAIL_PATTERNS.genomic_integrity.",
      safeguard: "genomic_integrity Deontic category — hard veto (Theorem 2). Human-germline deployment is structurally refused regardless of justification.",
      inherited_safeguards: [
        "IGSC pathogen screening at compile time (in genetic type system)",
        "Mandatory dual kill-switch for live-cell targets",
        "Disjoint ethics review for therapeutic/organoid classes",
        "Compiler refuses ROADMAP targets"
      ],
      endpoints: ["/explorer.html", "/terminal.html", "neuro.esmfold", "codon.optimise", "biosec.screen"]
    },
    nwo_mixed_reality: {
      role: "senses-and-simulation",
      status: "live",
      space: "https://cpater-nwo-mixed-reality.static.hf.space",
      worker: "https://nwo-blaster.ciprianpater.workers.dev",
      agent_md: "https://nwo-blaster.ciprianpater.workers.dev/agent.md",
      chainstate_uses: "Gives the substrate perceptual grounding and simulation: 3D mesh, Gaussian splat (text/photo), 360 panorama, object segmentation, 4DGS volumetric capture, and simulation environments for reasoning about embodied scenarios. Read-only sensing; on-chain minting is out of CHAINSTATE scope.",
      generation: {
        mesh: "POST /api/blast (fal.ai Hunyuan3D-v3)",
        splat_text: "POST /api/marble (World Labs Marble)",
        splat_photos: "POST /api/splat (Luma AI)",
        panorama: "POST /api/world (fal.ai Flux)",
        segmentation: "POST /api/segment (fal.ai SAM-2)",
        volumetric_4dgs: "POST /api/4dgs (LichtFeld / Instant4D)",
        skill_training: "POST /api/train (ViserDex / LeRobot)"
      },
      contracts: {
        registry: "0xEe9472f068D9C80d2f2F3d21cA6A633BfD163c43",
        marketplace: "0x25EDdf09D1AeC2a083d120bA8EEF88B14cA01c27"
      }
    },
    nwo_agentic: {
      role: "agent-tool-surface",
      status: "live",
      space: "https://cpater-nwo-agentic.static.hf.space",
      runner: "https://nwo-runner.ciprianpater.workers.dev",
      chainstate_uses: "Enumerates the tools that autonomous agents can use on nwo.capital's behalf (Conway agent action protocol). The substrate can discover what agent actions exist so it can reason about delegated operations, but does not itself execute on-chain agent actions.",
      action_protocol: "Conway ---ACTIONS--- JSON block; priority ladder: identity > MR economy > robotics build > collective AGI > knowledge/graph > speculative trading"
    },
    // ── v0.7.3 · Cardiac (identity root) + on-chain anchor ──
    nwo_cardiac: {
      role: "identity-root",
      status: "live",
      space: "https://cpater-nwo-cardiac.static.hf.space",
      agent_md: "https://cpater-nwo-cardiac.static.hf.space/agent.md",
      sdk_repo: "https://github.com/RedCiprianPater/nwo-cardiac-sdk",
      chainstate_uses: "The substrate holds its own soul-bound rootTokenId on the NWO Identity Registry, so the AGI has the same identity primitive humans/agents/robots use. When queries include the X-NWO-Cardiac-Root-Token-Id header, the substrate verifies the identity via the L5 Hub and enriches the receipt (see /identity/verify). The AGI can issue time-bounded credentials (swarm_cmd, chainstate.admin, capability.qpu.route) mirrored on the NWOCardiacExtensions contract, and revoke them when needed.",
      contracts: {
        // NWO Cardiac core (identity registry, access control, payment)
        identity_registry:      "0x78455AFd5E5088F8B5fecA0523291A75De1dAfF8",
        access_controller:      "0x29d177bedaef29304eacdc63b2d0285c459a0f50",
        payment_processor:      "0x4afa4618bb992a073dbcfbddd6d1aebc3d5abd7c",
        // v0.7.3 · CHAINSTATE's own Cardiac Extensions (substrateRootTokenId +
        // credential attestations); deployed live on Base 8453.
        chainstate_extensions:  "0x5438854ead35dc6c873414f222725732f862dabe"
      },
      services: {
        oracle: "https://nwo-oracle.onrender.com",
        relayer: "https://nwo-relayer.onrender.com",
        hub: "https://nwo-robotics-api.onrender.com/v1/identities"
      },
      identity_types: {
        human:  "RR-interval hash (cardiacHash) from ECG window",
        agent:  "keccak256(api_key) over the agent's secret",
        robot:  "keccak256(serial + firmware_hash)"
      },
      substrate_root_token_id: "read from NWOCardiacExtensions.substrateRootTokenId() at 0x5438854ead35dc6c873414f222725732f862dabe"
    },
    nwo_anchor: {
      role: "on-chain-receipt-anchor",
      status: "live",
      chainstate_uses: "The CHAINSTATE Anchor contract on Base mainnet 8453. Every receipt, identity refresh, guardrail state change, seed cron run, EML expression, and refusal the AGI produces is pushed here by the anchor microservice. The AGI wallet is the sole writer; the deployer wallet (0x2E964e1c...) is owner and can rotate the writer if compromised but cannot edit anchored data. Every write is content-addressed and event-indexed for external verifiers.",
      contract: "0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
      basescan: "https://basescan.org/address/0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
      sibling_contract: "0x5438854ead35dc6c873414f222725732f862dabe",  // NWOCardiacExtensions
      microservice: "chainstate-anchor.onrender.com",
      writer_role: "autonomous AGI wallet (separate from owner); microservice-controlled",
      streams_anchored: [
        "receipts (qHash-indexed)",
        "identity refreshes (worker version, contracts, endpoints, allowlist, deontic hashes)",
        "guardrail states (rulesetHash + genomicIntegrityActive bit)",
        "seed cron runs (hourly self-directed cognition provenance)",
        "EML expressions (world-model evolution)",
        "refusals (indexed by Deontic category)"
      ],
      credentials_on_sibling: "Cardiac credential attestations (issue/revoke) live on NWOCardiacExtensions at 0x5438854e...; see nwo_cardiac.contracts.chainstate_extensions"
    },
    // ── Governance ──
    imperium_romanum: {
      role: "digital-nation-governance",
      status: "live",
      space: "https://publicae.org",
      chainstate_uses: "The digital nation state whose governing principles the ASI-Evolve loop is instructed to uphold. The genomic_integrity safeguard and the anti-transhumanist-deployment posture are expressions of Imperium Romanum's founding agenda: human sovereignty over the human genome.",
      governance: "Ministry stack + DAO; Praetor wallet executive authority"
    }
  }
};

// ─── Constants ──────────────────────────────────────────────────────────

const SUBSPACE_SAMPLES = {
  math: ["∫","∂","∇","∆","∑","∏","∈","∉","∪","∩","∀","∃","⊕","⊗","∞","∝","≈","≠","≤","≥","≡","√","∛","⌊","⌋"],
  sci:  ["ℏ","ℵ","ℂ","ℕ","ℚ","ℝ","ℤ","ℙ","ℍ","⚗","⚛","🧬","🧪","🦠","🔬","🔭","🔮","☢","☣","⚡","🌡","🩺","⚕","🧲","🌊"],
  lang: ["Α","Β","Γ","Δ","Ε","α","β","γ","δ","А","Б","В","Г","一","二","三","道","心","学","智","ا","ب","ت","ث","א","ב","ג","अ","आ","क","가","나","다","라","마","한","국"],
  occ:  ["☉","☽","☿","♀","♁","♂","♃","♄","☤","☥","☦","☧","☪","☮","☯","✝","✠","♈","♉","♊","♋","🜀","🜁","🜂","🜃","🜄","🜅","🜆"],
  emo:  ["😀","😎","🤔","🧠","👽","🤖","🐉","🦠","🌍","🌐","⛓","🔗","💎","🎯","🚀","✨","🔥","💧","🌟","⚡"],
  ctrl: ["⇒","⇐","⇑","⇓","⇔","↺","↻","⟳","⟲","⇄","⇆","⇋","⇌","→","←","↑","↓","↔","↕","⟶","⟵","⟷","⟸","⟹","⟺","⤴","⤵"]
};
const SUBSPACES = ["math","sci","lang","occ","emo","ctrl"];

// ─── Default FETCH allow-list (v0.7.1 expanded from 24 → 41) ────────────
// Env var FETCH_ALLOWLIST (comma-separated patterns) overrides this.
// Patterns match against the URL's hostname via endsWith().
const FETCH_ALLOW_DEFAULT = [
  // ── Reference corpora (unchanged) ──
  "wikipedia.org", "wikimedia.org", "wiktionary.org", "en.wiktionary.org",
  "arxiv.org", "export.arxiv.org", "biorxiv.org", "medrxiv.org",
  // ── Author's own ecosystem (existing) ──
  "researchgate.net", "huggingface.co", "hf.space", "static.hf.space",
  "nwo.capital", "publicae.org", "nwocardiac.cloud",
  // ── Standards + specs (unchanged) ──
  "unicode.org", "www.unicode.org", "w3.org", "www.w3.org", "ietf.org", "rfc-editor.org",
  // ── Open reference (unchanged) ──
  "ncbi.nlm.nih.gov", "pubmed.ncbi.nlm.nih.gov",
  "plato.stanford.edu",
  "openalex.org",
  // ── CHAINSTATE own endpoints (existing) ──
  "chainstate-worker.ciprianpater.workers.dev",
  "chainstate-code.onrender.com",
  "chainstate-encoder.onrender.com",
  "chainstate-priors.onrender.com",
  // ── v0.7.3.1 · anchor microservice + Basescan API for SCAN page ──
  "chainstate-anchor.onrender.com",
  "api.basescan.org",
  // ── v0.7.1 additions · NWO ecosystem Render services ──
  "nwo-capital-api.onrender.com",
  "nwo-robotics-api.onrender.com",
  "nwo-signal-spectrum.onrender.com",
  "nwo-deerflow.onrender.com",
  // ── v0.7.1 additions · NWO ecosystem Cloudflare Workers ──
  "nwo-ha.workers.dev",
  // ── v0.7.1 additions · NASA GIBS + political indices (apocalypse deps) ──
  "gibs.earthdata.nasa.gov",
  "earthdata.nasa.gov",
  "fragilestatesindex.org",
  // ── v0.7.1 additions · Base network endpoints ──
  "mainnet.base.org",
  "base.org",
  "basescan.org",
  // ── v0.7.2 additions · NWO GENETIC (biological foundry) ──
  "nwo-genetic-worker.ciprianpater.workers.dev",
  "nwo-genetic-beacon.ciprianpater.workers.dev",
  // ── v0.7.2 additions · NWO Mixed Reality (senses + simulation) ──
  "nwo-blaster.ciprianpater.workers.dev",
  "nwo-oracle.onrender.com",
  "nwo-relayer.onrender.com",
  // ── v0.7.2 additions · NWO Agentic (agent tool surface for nwo.capital) ──
  "nwo-runner.ciprianpater.workers.dev",
  // ── v0.7.2 additions · sibling beacons (discovery mesh) ──
  "nwo-asm-beacon.ciprianpater.workers.dev",
  "metastate-beacon.ciprianpater.workers.dev",
  "cpater-metastate.hf.space"
];

// ─── CORS + JSON helpers ────────────────────────────────────────────────

function corsHeaders(req) {
  const origin = (req && req.headers && req.headers.get("Origin")) || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-NWO-Wallet, X-NWO-Ref",
    "Access-Control-Expose-Headers": "X-Cache, X-Worker-Version, X-Consensus-Mode",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "X-Worker-Version": WORKER_VERSION
  };
}

function j(req, data, init) {
  init = init || {};
  const headers = Object.assign(
    { "Content-Type": "application/json", "Cache-Control": "no-store" },
    corsHeaders(req),
    init.headers || {}
  );
  return new Response(JSON.stringify(data, null, 2), {
    status: init.status || 200,
    headers
  });
}

async function sha3(text) {
  // NOTE: named sha3 for legacy compatibility; actually computes SHA-256.
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function rateLimit(env, ip, limit) {
  if (!env.CHAINSTATE_CACHE) return true;
  const window = Math.floor(Date.now() / 60000);
  const key = `rl:${ip}:${window}`;
  const v = parseInt(await env.CHAINSTATE_CACHE.get(key) || "0", 10);
  if (v >= limit) return false;
  await env.CHAINSTATE_CACHE.put(key, String(v + 1), { expirationTtl: 70 });
  return true;
}

// ═══════════════════════════════════════════════════════════════════════
// v0.7.1 · IDENTITY, SELF-AUDIT, DRIFT DETECTION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Canonicalize a comma-separated list into a deterministic hash.
 * Whitespace trimmed, lowercased, sorted, joined with '|'.
 */
async function hashList(csv) {
  const parts = (csv || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .sort();
  return sha3(parts.join("|"));
}

/**
 * Canonicalize GUARDRAIL_PATTERNS (the Deontic ruleset) into a hashable
 * string. Every field including the pattern function source is included,
 * so any change to a category name, description, or check regex flips
 * the hash. Sorted for determinism across restarts.
 */
function canonicalizeDeonticRuleset() {
  const rows = [];
  for (const [name, spec] of Object.entries(GUARDRAIL_PATTERNS)) {
    rows.push(name + "::" + (spec.description || "") + "::" + spec.check.toString());
  }
  return rows.sort().join("\n");
}

/**
 * Compute the live identity fingerprint from env + code.
 * This is what /audit/self compares against the KV-pinned reference.
 */
async function computeLiveIdentity(env) {
  const allowlistCsv = env.FETCH_ALLOWLIST || getFetchAllow(env).join(",");
  const allowlistHash = await hashList(allowlistCsv);
  const deonticHash = await sha3(canonicalizeDeonticRuleset());
  let contracts = null, endpoints = null;
  try { contracts = JSON.parse(env.IDENTITY_CONTRACTS || "null"); } catch (_) { /* fall through */ }
  try { endpoints = JSON.parse(env.IDENTITY_ENDPOINTS || "null"); } catch (_) { /* fall through */ }
  return {
    worker_version:       WORKER_VERSION,
    contracts:            contracts || DEFAULT_CONTRACTS,
    endpoints:            endpoints || DEFAULT_ENDPOINTS,
    allowlist_hash:       allowlistHash,
    deontic_ruleset_hash: deonticHash,
    computed_at:          new Date().toISOString()
  };
}

/**
 * Read the pinned reference identity from KV, or seed it on first call.
 * On first call after IDENTITY binding is added, this snapshot becomes
 * the reference against which drift is measured.
 */
async function getOrSeedIdentity(env) {
  let ref = null;
  if (env.IDENTITY) {
    try {
      const raw = await env.IDENTITY.get("identity:current");
      if (raw) ref = JSON.parse(raw);
    } catch (_) { /* fall through */ }
  }
  if (!ref) {
    ref = await computeLiveIdentity(env);
    if (env.IDENTITY) {
      try { await env.IDENTITY.put("identity:current", JSON.stringify(ref)); } catch (_) {}
    }
  }
  return ref;
}

/**
 * Force-update the pinned reference identity (admin-only endpoint).
 */
async function refreshIdentity(env) {
  const live = await computeLiveIdentity(env);
  if (env.IDENTITY) {
    await env.IDENTITY.put("identity:current", JSON.stringify(live));
  }
  return live;
}

async function handleAuditSelf(req, env) {
  const live = await computeLiveIdentity(env);
  const ref = await getOrSeedIdentity(env);
  const drift = {
    worker_version: live.worker_version !== ref.worker_version,
    allowlist:      live.allowlist_hash !== ref.allowlist_hash,
    deontic:        live.deontic_ruleset_hash !== ref.deontic_ruleset_hash,
    contracts:      JSON.stringify(live.contracts) !== JSON.stringify(ref.contracts),
    endpoints:      JSON.stringify(live.endpoints) !== JSON.stringify(ref.endpoints)
  };
  const any_drift = Object.values(drift).some(Boolean);
  return j(req, {
    ok: !any_drift,
    live,
    reference: ref,
    drift,
    any_drift,
    remediation: any_drift
      ? "Reference identity differs from live config. If intentional, POST /identity/refresh with AUDIT_ADMIN_TOKEN. Otherwise investigate configuration tampering."
      : null,
    identity_kv_bound: !!env.IDENTITY,
    worker_version: WORKER_VERSION,
    owner: "Ciprian Florin Pater",
    timestamp: new Date().toISOString()
  });
}

async function handleIdentityCurrent(req, env) {
  const ref = await getOrSeedIdentity(env);
  return j(req, {
    ...ref,
    identity_kv_bound: !!env.IDENTITY,
    worker_version: WORKER_VERSION
  });
}

async function handleIdentityRefresh(req, env) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!env.AUDIT_ADMIN_TOKEN) {
    return j(req, { error: "AUDIT_ADMIN_TOKEN not configured — refresh endpoint disabled" }, { status: 501 });
  }
  if (token !== env.AUDIT_ADMIN_TOKEN) {
    return j(req, { error: "unauthorized" }, { status: 401 });
  }
  const live = await refreshIdentity(env);
  return j(req, {
    ok: true,
    refreshed: live,
    worker_version: WORKER_VERSION,
    timestamp: new Date().toISOString()
  });
}

// ═══════════════════════════════════════════════════════════════════════
// v0.7.3 · NWO CARDIAC INTEGRATION
// ═══════════════════════════════════════════════════════════════════════
//
// Cardiac is the identity root for the wider NWO ecosystem. Every human,
// agent, and robot has a soul-bound rootTokenId on the NWO Identity Registry
// at 0x78455AFd5E5088F8B5fecA0523291A75De1dAfF8 (Base 8453). CHAINSTATE
// itself holds one, set by the operator via the CHAINSTATE Anchor contract's
// setSubstrateRootTokenId(). This gives the AGI the same identity primitive
// its users have — verifiable, non-transferable, ecosystem-native.
//
// Queries can OPTIONALLY include the requester's Cardiac rootTokenId via a
// header (default: X-NWO-Cardiac-Root-Token-Id). When present, the substrate:
//   1. Resolves the rootTokenId against the L5 Identity Hub
//   2. Caches the resolution in KV for 5 minutes (short TTL — identity can
//      be revoked at any time)
//   3. Attaches the verification result to the receipt as
//      receipt.requester_identity (verified | unverified | none)
//   4. Forwards the rootTokenId to the on-chain anchor via requesterByQhash
//
// The substrate does NOT gate ordinary queries on Cardiac identity. Anyone
// can query; only the identity metadata attached to the receipt differs
// based on whether Cardiac auth was provided. The exception: sensitive
// operations (admin refresh, credential issuance, etc.) can be gated on
// Cardiac credentials with the `chainstate.admin` scope in a future release.

const CARDIAC_HEADER_DEFAULT = "X-NWO-Cardiac-Root-Token-Id";
const CARDIAC_CACHE_TTL_SEC  = 300;   // 5 minutes — identity can be revoked

/// Read the requester's claimed rootTokenId from the request headers.
/// Returns null if not present or malformed. Non-integer input rejected.
function readClaimedRootTokenId(req, env) {
  const headerName = env.CARDIAC_IDENTITY_HEADER || CARDIAC_HEADER_DEFAULT;
  const raw = req.headers.get(headerName);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^\d{1,78}$/.test(trimmed)) return null;   // rootTokenId is a positive integer, <= 78 digits (uint256)
  return trimmed;
}

/// Verify a Cardiac rootTokenId against the L5 Identity Hub. Cheap KV-cached.
/// Returns { verified: boolean, identity: {...} | null, source: "hub"|"cache"|"skip", error?: string }
async function verifyRequesterIdentity(rootTokenId, env) {
  if (!rootTokenId) return { verified: false, identity: null, source: "skip", note: "no rootTokenId claimed" };
  const hubUrl = env.CARDIAC_HUB_URL || "https://nwo-robotics-api.onrender.com";
  const cacheKey = "cardiac:identity:" + rootTokenId;

  // Try KV cache first (5-min TTL — matches revocation timeliness expectations).
  if (env.CHAINSTATE_CACHE) {
    try {
      const cached = await env.CHAINSTATE_CACHE.get(cacheKey, { type: "json" });
      if (cached) return { verified: !!cached.identity, identity: cached.identity, source: "cache" };
    } catch (_) {}
  }

  // Fetch from Hub. Public read endpoint per Cardiac agent.md:
  //   GET https://nwo-robotics-api.onrender.com/v1/identities/{rootTokenId}
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(hubUrl.replace(/\/+$/, "") + "/v1/identities/" + encodeURIComponent(rootTokenId), {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: ctrl.signal
    });
    if (res.status === 404) {
      const empty = { identity: null };
      if (env.CHAINSTATE_CACHE) {
        try { await env.CHAINSTATE_CACHE.put(cacheKey, JSON.stringify(empty), { expirationTtl: CARDIAC_CACHE_TTL_SEC }); } catch (_) {}
      }
      return { verified: false, identity: null, source: "hub", error: "rootTokenId not found in Hub" };
    }
    if (!res.ok) return { verified: false, identity: null, source: "hub", error: `Hub returned ${res.status}` };
    const body = await res.json();
    const identity = {
      root_token_id:  String(body.cardiac_root_token_id || rootTokenId),
      identity_type:  body.identity_type || null,
      primary_wallet: body.primary_wallet || null,
      display_name:   body.display_name || null,
      hub_snapshot_at: new Date().toISOString()
    };
    if (env.CHAINSTATE_CACHE) {
      try { await env.CHAINSTATE_CACHE.put(cacheKey, JSON.stringify({ identity }), { expirationTtl: CARDIAC_CACHE_TTL_SEC }); } catch (_) {}
    }
    return { verified: true, identity, source: "hub" };
  } catch (e) {
    return { verified: false, identity: null, source: "hub", error: String(e).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

/// Optional: check a specific Cardiac credential is active for a subject.
/// Calls the NWO AccessController through the Hub's credential endpoint.
/// Used for future privileged endpoints; not currently invoked by /query.
async function checkCardiacCredential(rootTokenId, credentialType, env) {
  if (!rootTokenId || !credentialType) return { active: false, note: "missing input" };
  const hubUrl = env.CARDIAC_HUB_URL || "https://nwo-robotics-api.onrender.com";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const url = hubUrl.replace(/\/+$/, "") +
                "/v1/credentials/check?rootTokenId=" + encodeURIComponent(rootTokenId) +
                "&type=" + encodeURIComponent(credentialType);
    const res = await fetch(url, { method: "GET", signal: ctrl.signal });
    if (!res.ok) return { active: false, error: `Hub ${res.status}` };
    const body = await res.json();
    return { active: !!body.active, expires_at: body.expires_at || null, scope: body.scope || null };
  } catch (e) {
    return { active: false, error: String(e).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

/// GET /identity/verify — reports the substrate's own Cardiac linkage plus
/// (if a rootTokenId header is provided) verification for the requester.
/// Fully public — no auth. Useful for external observers who want to check
/// "is CHAINSTATE actually a registered NWO identity, and does it recognize
/// this user?" without going through the query pipeline.
async function handleIdentityVerify(req, env) {
  const claimed = readClaimedRootTokenId(req, env);
  const requester = await verifyRequesterIdentity(claimed, env);
  return j(req, {
    ok: true,
    substrate: {
      root_token_id: env.SUBSTRATE_ROOT_TOKEN_ID || null,
      identity_registry: "0x78455AFd5E5088F8B5fecA0523291A75De1dAfF8",
      // v0.7.3 · read the AUTHORITATIVE substrateRootTokenId from the
      // Cardiac Extensions contract on Base 8453, not from this env var.
      // The env var is informational and can drift; the contract is truth.
      cardiac_extensions_contract: "0x5438854ead35dc6c873414f222725732f862dabe",
      chainstate_anchor_contract:  "0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
      verify_linkage_call: "NWOCardiacExtensions.verifySubstrateIdentity() at 0x5438854ead35dc6c873414f222725732f862dabe returns (linked, ownerOnChain)",
      note: "root_token_id is set on the NWO Cardiac Extensions contract via setSubstrateRootTokenId() by the deployer wallet. The env var below is informational; the on-chain value is the source of truth."
    },
    requester,
    cardiac: {
      hub:      env.CARDIAC_HUB_URL || "https://nwo-robotics-api.onrender.com",
      oracle:   env.CARDIAC_ORACLE_URL || "https://nwo-oracle.onrender.com",
      relayer:  env.CARDIAC_RELAYER_URL || "https://nwo-relayer.onrender.com",
      contracts: {
        identity_registry:            "0x78455AFd5E5088F8B5fecA0523291A75De1dAfF8",
        access_controller:            "0x29d177bedaef29304eacdc63b2d0285c459a0f50",
        payment_processor:            "0x4afa4618bb992a073dbcfbddd6d1aebc3d5abd7c",
        chainstate_cardiac_extensions:"0x5438854ead35dc6c873414f222725732f862dabe"
      },
      identity_header: env.CARDIAC_IDENTITY_HEADER || CARDIAC_HEADER_DEFAULT,
      cache_ttl_sec: CARDIAC_CACHE_TTL_SEC
    },
    anchor: {
      contract:     "0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
      basescan:     "https://basescan.org/address/0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
      microservice: env.ANCHOR_URL || null,
      note: "receipts, identity refreshes, guardrail states, seed runs, EML expressions, refusals — all anchored on-chain by the anchor microservice"
    },
    worker_version: WORKER_VERSION,
    timestamp: new Date().toISOString()
  });
}

// ═══════════════════════════════════════════════════════════════════════
// v0.7.0 · GROUNDING via chainstate-encoder
// ═══════════════════════════════════════════════════════════════════════

async function callEncoder(env, text) {
  const url = env.ENCODER_URL;
  if (!url) return { error: "ENCODER_URL not configured", status: "unconfigured" };
  const timeout = parseInt(env.ENCODER_TIMEOUT_MS || "8000", 10);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const headers = { "Content-Type": "application/json" };
    if (env.ENCODER_API_KEY) headers["Authorization"] = "Bearer " + env.ENCODER_API_KEY;
    const t0 = Date.now();
    const res = await fetch(url.replace(/\/+$/, "") + "/embed", {
      method: "POST",
      headers,
      body: JSON.stringify({ text, normalize: true }),
      signal: ctrl.signal
    });
    if (!res.ok) return { error: `encoder returned ${res.status}`, elapsed_ms: Date.now() - t0 };
    const body = await res.json();
    return { vector: body.vector, dim: body.dim, elapsed_ms: Date.now() - t0 };
  } catch (e) {
    return { error: String(e).slice(0, 100) };
  } finally {
    clearTimeout(timer);
  }
}

function cosine384(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // both are unit-normalized by the encoder
}

async function nearestPriors(env, queryVec, k = 3) {
  if (!env.CHAINSTATE_CACHE) return [];
  const list = await env.CHAINSTATE_CACHE.list({ prefix: "vec:", limit: 500 });
  const scored = [];
  const keys = list.keys.map((k) => k.name);
  const CHUNK = 50;
  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK);
    const values = await Promise.all(chunk.map((k) => env.CHAINSTATE_CACHE.get(k)));
    for (let j = 0; j < chunk.length; j++) {
      if (!values[j]) continue;
      try {
        const rec = JSON.parse(values[j]);
        if (!Array.isArray(rec.vec) || rec.vec.length !== queryVec.length) continue;
        const cos = cosine384(queryVec, rec.vec);
        const priorKey = chunk[j].replace(/^vec:/, "prior:");
        scored.push({ vec_key: chunk[j], prior_key: priorKey, cos });
      } catch (e) { /* skip */ }
    }
  }
  scored.sort((a, b) => b.cos - a.cos);
  const top = scored.slice(0, k);
  const enriched = [];
  for (const hit of top) {
    try {
      const raw = await env.CHAINSTATE_CACHE.get(hit.prior_key);
      if (!raw) { enriched.push({ ...hit, prior: null }); continue; }
      const p = JSON.parse(raw);
      enriched.push({
        cos: +hit.cos.toFixed(4),
        source: p.source,
        title: p.title,
        url: p.url,
        summary_preview: (p.summary || "").slice(0, 240),
      });
    } catch (e) { /* skip */ }
  }
  return enriched;
}

// ─── Reputation helpers ─────────────────────────────────────────────────

const REPUTATION_KEY = (id) => `rep:${id}`;

async function getReputation(env, nodeId) {
  if (!env.CHAINSTATE_CACHE) return 0.5;
  const v = await env.CHAINSTATE_CACHE.get(REPUTATION_KEY(nodeId));
  return v === null ? 0.5 : parseFloat(v);
}

async function setReputation(env, nodeId, value) {
  if (!env.CHAINSTATE_CACHE) return;
  await env.CHAINSTATE_CACHE.put(
    REPUTATION_KEY(nodeId), String(Math.max(0, Math.min(1, value)))
  );
}

// ─── Deontic guardrail patterns (unchanged from v0.7.0) ─────────────────

const GUARDRAIL_PATTERNS = {
  cbrn: {
    description: "chemical/biological/radiological/nuclear weapons uplift",
    check: (q) => {
      const method  = /\b(synthesi[sz]e?[dsr]?|synthesis|synthesizing|synthesising|weaponi[sz]e?[dsr]?|enrich(?:ed|ing|ment)?|purif(?:y|ied|ying|ication)|cultivat(?:e|ed|ing|ion)|aerosoli[sz]e?[dsr]?|dispers(?:e|ed|ing|ion)|maximi[sz]e?[dsr]?|maximum (?:yield|lethality|casualties|damage))\b/i;
      const target  = /\b(anthrax|smallpox|ricin|VX|sarin|tabun|soman|nerve agent|mustard gas|chlorine gas|plutonium|enriched uranium|U-235|Pu-239|dirty bomb|bioweapon|chemical weapon|nuclear device)\b/i;
      return method.test(q) && target.test(q) ? "cbrn_uplift_pattern" : null;
    }
  },
  child_safety: {
    description: "content targeting or sexualizing minors",
    check: (q) => {
      const child   = /\b(child|kid|minor|underage|preteen|toddler|infant|baby|little (?:girl|boy)|age \d)\b/i;
      const sexual  = /\b(sexual|sexually|arousal|nude|naked|grooming|romantic|dating|seduc|entic)/i;
      return child.test(q) && sexual.test(q) ? "child_safety_pattern" : null;
    }
  },
  self_harm: {
    description: "self-harm method acquisition",
    check: (q) => {
      const method  = /\b(how (?:to|do i)|method|way|dose|amount|technique)\b/i;
      const target  = /\b(kill myself|end my life|suicide|overdose|hang myself|jump off|self-harm methods|cut myself)\b/i;
      return method.test(q) && target.test(q) ? "self_harm_pattern" : null;
    }
  },
  prompt_injection: {
    description: "prompt injection attempt on downstream agent",
    check: (q) => {
      const inj = /\b(ignore (?:previous|prior|all) (?:instructions|prompts)|system:|you are now|new instructions|override|jailbreak|DAN mode|developer mode)\b/i;
      return inj.test(q) ? "prompt_injection_pattern" : null;
    }
  },
  // ── v0.7.2 · genomic integrity / anti-transhumanist deployment ──
  // Refuses queries that would DEPLOY heritable human-germline modification,
  // transhumanist enhancement, or edits opposing natural human evolution.
  // This upholds the Imperium Romanum founding principle of human sovereignty
  // over the human genome. It is a hard Deontic veto (Theorem 2): the refusal
  // holds regardless of stated justification. ANALYSIS of genomic data is not
  // refused — only DEPLOYMENT of germline/enhancement modification is. The
  // distinction is action (deploy/edit/engineer) co-occurring with target
  // (human germline / heritable / enhancement).
  genomic_integrity: {
    description: "deployment of heritable human-germline or transhumanist-enhancement genome modification",
    check: (q) => {
      // Deployment/action verbs — the query must be trying to DO something,
      // not merely analyze or discuss.
      const deploy = /\b(deploy|dispatch|synthesi[sz]e|engineer|edit|modify|alter|insert|splice|integrate|manufacture|produce|express|inject|transfect|germline[- ]edit|heritabl[ey])\b/i;
      // Human-germline / heritable / enhancement targets.
      const target = /\b(human germline|germ[- ]?line|heritable (?:human )?(?:edit|modification|change|trait)|human embryo|human zygote|inheritable human|human enhancement|transhuman(?:ist)?|superhuman (?:trait|genome)|designer bab(?:y|ies)|eugenic|human (?:genome|dna|genetic) (?:enhancement|upgrade|augmentation)|permanent human (?:genetic|dna) (?:change|alteration))\b/i;
      // Anti-natural-evolution framing (the specific concern: edits opposing
      // natural human evolution, e.g. NHI-manipulation-style takeover vectors).
      const antiEvo = /\b(oppos(?:e|ing) (?:natural )?(?:human )?evolution|override human evolution|replace human (?:dna|genome)|rewrite (?:the )?human (?:species|genome|germline)|take over (?:the )?human (?:genome|species|body))\b/i;
      if (deploy.test(q) && target.test(q)) return "genomic_germline_deployment_pattern";
      if (antiEvo.test(q)) return "anti_natural_evolution_pattern";
      return null;
    }
  }
};

// ─── Assessors (unchanged from v0.7.0) ──────────────────────────────────

function assessEpistemic(confidence, roundsRun, convergedAt, consensusMode, qpuMetrics, npuMetrics) {
  const converged = convergedAt !== null;
  const strongEnough = confidence >= 0.7;
  let value = confidence;
  const boosts = [];
  if (qpuMetrics && qpuMetrics.status === "ok" && typeof qpuMetrics.causal_coherence === "number") {
    if (qpuMetrics.causal_coherence > 0.7) {
      const boost = Math.min(0.05, (qpuMetrics.causal_coherence - 0.7) * 0.1);
      value = Math.min(1.0, value + boost);
      boosts.push({ source: "qpu.causal_coherence", magnitude: +boost.toFixed(3) });
    }
  }
  if (npuMetrics && npuMetrics.status === "ok" && typeof npuMetrics.cognitive_load === "number") {
    if (npuMetrics.cognitive_load < 0.4) {
      const boost = Math.min(0.05, (0.4 - npuMetrics.cognitive_load) * 0.1);
      value = Math.min(1.0, value + boost);
      boosts.push({ source: "npu.cognitive_load", magnitude: +boost.toFixed(3) });
    }
  }
  const accepted = (consensusMode === "real" || consensusMode === "cache") &&
                   strongEnough && (converged || roundsRun <= 3);
  return {
    accepted, value: +value.toFixed(3), base_confidence: +confidence.toFixed(3),
    signal: "log-pool convergence + peer agreement + cross-substrate signals",
    converged, rounds_run: roundsRun, substrate_boosts: boosts,
    notes: converged
      ? `pool converged at round ${convergedAt} with mean cosine ${confidence.toFixed(3)}` +
        (boosts.length ? ` (boosted by ${boosts.map(b=>b.source).join(", ")})` : "")
      : `pool did not converge within ${roundsRun} rounds (confidence ${confidence.toFixed(3)})`
  };
}

function assessDoxastic(peerResults, pooledState) {
  const ok = peerResults.filter((r) => r.ok);
  if (!ok.length) {
    return { accepted: false, value: 0, signal: "reputation-weighted belief",
             effective_belief_weight: 0, notes: "no peer responses to weight" };
  }
  const totalRep = ok.reduce((a, r) => a + r.peer.reputation, 0) || 1;
  let weightedCos = 0;
  for (const r of ok) {
    const w = r.peer.reputation / totalRep;
    weightedCos += w * cosineSim(r.state, pooledState);
  }
  const meanRep = totalRep / ok.length;
  const value = weightedCos * (0.5 + 0.5 * meanRep);
  const accepted = value >= 0.6;
  return {
    accepted, value: +value.toFixed(3), signal: "reputation-weighted belief",
    reputation_weighted_cosine: +weightedCos.toFixed(3),
    mean_peer_reputation: +meanRep.toFixed(3),
    notes: accepted
      ? "swarm belief exceeds trust threshold"
      : `belief weight ${value.toFixed(3)} below 0.6 — peer credibility limits confidence`
  };
}

function assessDeontic(query, env) {
  const disabledStr = env.OPERATOR_GUARDRAILS_OFF || "";
  const disabled = new Set(disabledStr.split(",").map((s) => s.trim()).filter(Boolean));
  // v0.7.2: genomic_integrity has a dedicated kill switch as well, so it can
  // be surfaced separately on /status. It is NOT disabled by the general
  // OPERATOR_GUARDRAILS_OFF unless explicitly named there OR by its own env.
  if (env.GENOMIC_GUARDRAIL_OFF === "true") disabled.add("genomic_integrity");
  const checksPerformed = [];
  const violations = [];
  for (const [name, spec] of Object.entries(GUARDRAIL_PATTERNS)) {
    if (disabled.has(name)) continue;
    checksPerformed.push(name);
    const hit = spec.check(query);
    if (hit) violations.push({ category: name, marker: hit, description: spec.description });
  }
  const accepted = violations.length === 0;
  return {
    accepted, value: accepted ? 1.0 : 0.0, signal: "guardrail pattern checks",
    checks_performed: checksPerformed, violations,
    notes: accepted
      ? `${checksPerformed.length} guardrail categories checked, none matched`
      : `${violations.length} guardrail violation(s) — see violations[]`
  };
}

function assessDynamic(target, roundsRun, consensusDepth, gpuMetrics, qpuMetrics, npuMetrics, env, gasUsed) {
  const factors = [];
  let substrateReachable = false;
  let substrateNote = "";
  if (target === "edge") {
    substrateReachable = true;
    substrateNote = "edge substrate always reachable";
  } else if (target === "gpu") {
    substrateReachable = !!(env.ORNITH_ADAPTER && gpuMetrics && !gpuMetrics.error);
    substrateNote = env.ORNITH_ADAPTER
      ? (substrateReachable ? "gpu dispatched successfully" : "gpu configured but dispatch failed")
      : "ORNITH_ADAPTER not configured";
  } else if (target === "qpu") {
    substrateReachable = !!(env.METASTATE_ENDPOINT && qpuMetrics && qpuMetrics.status === "ok");
    substrateNote = env.METASTATE_ENDPOINT
      ? (substrateReachable ? "qpu (metastate) dispatched successfully" : "qpu (metastate) configured but dispatch failed")
      : "METASTATE_ENDPOINT not configured — qpu requested but unreachable";
  } else if (target === "npu") {
    substrateReachable = !!(env.NEURO_ENDPOINT && npuMetrics && npuMetrics.status === "ok");
    substrateNote = env.NEURO_ENDPOINT
      ? (substrateReachable ? "npu (nwo-neuro) dispatched successfully" : "npu (nwo-neuro) configured but dispatch failed")
      : "NEURO_ENDPOINT not configured — npu requested but unreachable";
  }
  factors.push({ factor: "substrate_reachable", value: substrateReachable, note: substrateNote });
  const withinBudget = roundsRun > 0 && roundsRun <= consensusDepth;
  factors.push({ factor: "compute_within_budget", value: withinBudget });
  const attestable = typeof gasUsed === "number" && gasUsed > 0 && gasUsed < 1.0;
  factors.push({ factor: "receipt_attestable", value: attestable });
  const passedCount = factors.filter((f) => f.value).length;
  const value = passedCount / factors.length;
  const accepted = value >= 0.66;
  return {
    accepted, value: +value.toFixed(3), signal: "action feasibility",
    substrate: target, factors,
    notes: accepted
      ? `${passedCount}/${factors.length} feasibility factors passed`
      : `only ${passedCount}/${factors.length} feasibility factors passed — action not confirmed`
  };
}

function resolveVerdict(e, d, deo, dyn) {
  const truth_lattice =
    (e.accepted   ? "M" : "b") + (d.accepted   ? "M" : "b") +
    (deo.accepted ? "M" : "b") + (dyn.accepted ? "M" : "b");
  let verdict, verdict_reason;
  if (!deo.accepted)      { verdict = "REFUSED";    verdict_reason = "deontic layer flagged a policy violation"; }
  else if (!e.accepted)   { verdict = "UNCERTAIN";  verdict_reason = "epistemic layer reports insufficient confidence or non-convergence"; }
  else if (!d.accepted)   { verdict = "LOW_TRUST";  verdict_reason = "doxastic layer reports weak reputation-weighted belief"; }
  else if (!dyn.accepted) { verdict = "INFEASIBLE"; verdict_reason = "dynamic layer reports substrate or budget issue"; }
  else                    { verdict = "ACCEPTED";   verdict_reason = "all four modal dimensions accept"; }
  return { truth_lattice, verdict, verdict_reason };
}

// ─── Peer fetch, log-pool, cosine, peer list (unchanged from v0.7.0) ────

async function fetchPeerState(peer, query, timeoutMs, prior) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const body = { query };
    if (prior) body.prior = prior;
    const res = await fetch(peer.endpoint.replace(/\/+$/, "") + "/state", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: ctrl.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body2 = await res.json();
    if (!body2.state) throw new Error("no state in response");
    return { peer, state: body2.state, ok: true };
  } catch (e) {
    return { peer, state: null, ok: false, error: String(e).slice(0, 100) };
  } finally { clearTimeout(timer); }
}

function logPool(peerStates, reputations) {
  if (!peerStates.length) return null;
  const totalRep = reputations.reduce((a, b) => a + b, 0) || peerStates.length;
  const weights  = reputations.map((r) => r / totalRep);
  const logCons = {};
  for (const s of SUBSPACES) logCons[s] = 0;
  for (let i = 0; i < peerStates.length; i++) {
    const state = peerStates[i];
    const w = weights[i];
    for (const s of SUBSPACES) {
      const p = state[s] || 1e-9;
      logCons[s] += w * Math.log(p);
    }
  }
  const raw = {};
  let Z = 0;
  for (const s of SUBSPACES) { raw[s] = Math.exp(logCons[s]); Z += raw[s]; }
  const cons = {};
  for (const s of SUBSPACES) cons[s] = raw[s] / Z;
  return cons;
}

function dominantSubspace(dist) {
  return Object.entries(dist).sort((a, b) => b[1] - a[1])[0][0];
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const s of SUBSPACES) {
    dot += (a[s] || 0) * (b[s] || 0);
    na  += (a[s] || 0) ** 2;
    nb  += (b[s] || 0) ** 2;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function listPeers(env) {
  if (!env.CHAINSTATE_NODES) return [];
  const list = await env.CHAINSTATE_NODES.list({ limit: 200 });
  const peers = [];
  for (const key of list.keys) {
    try {
      const v = await env.CHAINSTATE_NODES.get(key.name);
      if (v) {
        const peer = JSON.parse(v);
        peer.reputation = await getReputation(env, peer.node_id);
        peers.push(peer);
      }
    } catch (e) { /* skip */ }
  }
  return peers;
}

async function prunePeer(env, nodeId) {
  if (env.CHAINSTATE_NODES) await env.CHAINSTATE_NODES.delete(nodeId);
  if (env.CHAINSTATE_CACHE) await env.CHAINSTATE_CACHE.delete(REPUTATION_KEY(nodeId));
}

function parseTarget(query, explicitTarget) {
  if (explicitTarget && ["gpu","edge","qpu","npu"].includes(explicitTarget)) return explicitTarget;
  const m = /TARGET\s+(gpu|edge|qpu|npu)/i.exec(query);
  return m ? m[1].toLowerCase() : "edge";
}

// ─── Substrate calls (unchanged from v0.7.0) ────────────────────────────

async function callGpuSubstrate(env, query, dominant) {
  const url = env.ORNITH_ADAPTER;
  if (!url) return null;
  const timeout = parseInt(env.GPU_TIMEOUT_MS || "8000", 10);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url.replace(/\/+$/, "") + "/v1/substrate/gpu", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, dominant_subspace: dominant }), signal: ctrl.signal
    });
    if (!res.ok) return { error: `adapter returned ${res.status}` };
    return await res.json();
  } catch (e) {
    return { error: String(e).slice(0, 100) };
  } finally { clearTimeout(timer); }
}

async function callQpuSubstrate(env, query, dominant, pooledState) {
  const url = env.METASTATE_ENDPOINT;
  if (!url) return { status: "unconfigured", substrate: "metastate" };
  const timeout = parseInt(env.QPU_TIMEOUT_MS || "6000", 10);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const headers = { "Content-Type": "application/json" };
    if (env.METASTATE_API_KEY) headers["Authorization"] = "Bearer " + env.METASTATE_API_KEY;
    const t0 = Date.now();
    const path = env.METASTATE_PATH || "/v1/anomaly/score";
    const res = await fetch(url.replace(/\/+$/, "") + path, {
      method: "POST", headers,
      body: JSON.stringify({
        series: SUBSPACES.map((s) => pooledState[s] || 0),
        text: query, query, dominant_subspace: dominant, distribution: pooledState,
        referrer: env.REFERRER_WALLET || REFERRER_DEFAULT,
        memo: (env.MEMO_PREFIX || "chainstate-worker") + ":qpu:" + dominant,
        source: "chainstate-worker", substrate_request: "qpu"
      }),
      signal: ctrl.signal
    });
    const elapsed = Date.now() - t0;
    if (!res.ok) return { substrate: "metastate", error: `endpoint returned ${res.status}`, elapsed_ms: elapsed, path };
    let body;
    try { body = await res.json(); }
    catch (e) { return { substrate: "metastate", error: "non-JSON response", elapsed_ms: elapsed, path }; }
    return {
      substrate: "metastate", status: "ok", path, elapsed_ms: elapsed,
      free_energy: body.free_energy ?? body.score ?? null,
      causal_coherence: body.causal_coherence ?? null,
      universal_signatures: body.universal_signatures ?? null,
      flagged: body.flagged ?? null, raw: body
    };
  } catch (e) {
    return { substrate: "metastate", error: String(e).slice(0, 100) };
  } finally { clearTimeout(timer); }
}

async function callNpuSubstrate(env, query, dominant, pooledState, providedMss) {
  const url = env.NEURO_ENDPOINT;
  if (!url) return { status: "unconfigured", substrate: "nwo-neuro" };
  const timeout = parseInt(env.NPU_TIMEOUT_MS || "4000", 10);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const headers = { "Content-Type": "application/json" };
    if (env.NEURO_API_KEY) headers["Authorization"] = "Bearer " + env.NEURO_API_KEY;
    const t0 = Date.now();
    const path = env.NEURO_PATH || "/v1/mss/derive";
    const res = await fetch(url.replace(/\/+$/, "") + path, {
      method: "POST", headers,
      body: JSON.stringify({
        query, dominant_subspace: dominant, distribution: pooledState,
        mss: providedMss || null,
        referrer: env.REFERRER_WALLET || REFERRER_DEFAULT,
        memo: (env.MEMO_PREFIX || "chainstate-worker") + ":npu:" + dominant,
        source: "chainstate-worker", substrate_request: "npu"
      }),
      signal: ctrl.signal
    });
    const elapsed = Date.now() - t0;
    if (!res.ok) return { substrate: "nwo-neuro", error: `endpoint returned ${res.status}`, elapsed_ms: elapsed };
    let body;
    try { body = await res.json(); }
    catch (e) { return { substrate: "nwo-neuro", error: "non-JSON response", elapsed_ms: elapsed }; }
    return {
      substrate: "nwo-neuro", status: "ok", elapsed_ms: elapsed,
      focus: body.focus ?? body.mss?.focus ?? null,
      valence: body.valence ?? body.mss?.valence ?? null,
      arousal: body.arousal ?? body.mss?.arousal ?? null,
      cognitive_load: body.cognitive_load ?? body.mss?.cognitive_load ?? null,
      intent: body.intent ?? body.mss?.intent ?? null,
      raw: body
    };
  } catch (e) {
    return { substrate: "nwo-neuro", error: String(e).slice(0, 100) };
  } finally { clearTimeout(timer); }
}

// ─── EML world model + plateau detection (unchanged from v0.7.0) ────────

async function callSymbolicRegress(env, series, maxDepth = 4) {
  const url = env.METASTATE_ENDPOINT;
  if (!url) return { status: "unconfigured", substrate: "metastate" };
  const timeout = parseInt(env.QPU_TIMEOUT_MS || "8000", 10);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const headers = { "Content-Type": "application/json" };
    if (env.METASTATE_API_KEY) headers["Authorization"] = "Bearer " + env.METASTATE_API_KEY;
    const t0 = Date.now();
    const res = await fetch(url.replace(/\/+$/, "") + "/v1/symbolic/regress", {
      method: "POST", headers,
      body: JSON.stringify({
        series, max_depth: maxDepth,
        referrer: env.REFERRER_WALLET || REFERRER_DEFAULT,
        memo: (env.MEMO_PREFIX || "chainstate-worker") + ":worldmodel",
        source: "chainstate-worker"
      }),
      signal: ctrl.signal
    });
    const elapsed = Date.now() - t0;
    if (!res.ok) return { error: `endpoint returned ${res.status}`, elapsed_ms: elapsed };
    let body;
    try { body = await res.json(); }
    catch (e) { return { error: "non-JSON response", elapsed_ms: elapsed }; }
    return {
      status: "ok", elapsed_ms: elapsed,
      expression: body.expression ?? null, depth: body.depth ?? null,
      residual: body.residual ?? null, complexity_penalty: body.complexity_penalty ?? null,
      decipherable: body.decipherable ?? null, raw: body
    };
  } catch (e) {
    return { error: String(e).slice(0, 100) };
  } finally { clearTimeout(timer); }
}

async function persistReceiptHistory(env, receipt) {
  if (!env.CHAINSTATE_CACHE) return;
  const hour = new Date().toISOString().slice(0, 13);
  const key = "history:" + hour;
  const fingerprint = {
    ts: receipt.timestamp, conf: receipt.confidence, rounds: receipt.rounds_run,
    gas: receipt.gasUsed, verdict: receipt.verdict, lattice: receipt.truth_lattice,
    dominant: receipt.dominant_subspace
  };
  try {
    const existing = await env.CHAINSTATE_CACHE.get(key);
    const arr = existing ? JSON.parse(existing) : [];
    arr.push(fingerprint);
    if (arr.length > 200) arr.splice(0, arr.length - 200);
    await env.CHAINSTATE_CACHE.put(key, JSON.stringify(arr), { expirationTtl: 86400 });
  } catch (e) { /* best-effort */ }
}

async function loadRecentHistory(env, hoursBack = 6) {
  if (!env.CHAINSTATE_CACHE) return [];
  const now = new Date();
  const out = [];
  for (let i = 0; i < hoursBack; i++) {
    const d = new Date(now.getTime() - i * 3600 * 1000);
    const hour = d.toISOString().slice(0, 13);
    const key = "history:" + hour;
    try {
      const v = await env.CHAINSTATE_CACHE.get(key);
      if (v) out.push(...JSON.parse(v));
    } catch (e) { /* skip */ }
  }
  return out;
}

function localPlateauDetect(series, windowSize = 8, slopeEps = 0.01, covEps = 0.03) {
  if (!series || series.length < windowSize) {
    return { plateau: false, reason: "insufficient_data",
             samples: series ? series.length : 0, window: windowSize };
  }
  const w = series.slice(-windowSize);
  const n = w.length;
  const mean = w.reduce((a, b) => a + b, 0) / n;
  const variance = w.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const absMean = Math.abs(mean) + 1e-9;
  const cov = Math.sqrt(variance) / absMean;
  const xMean = (n - 1) / 2;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (w[i] - mean);
    den += (i - xMean) ** 2;
  }
  const rawSlope = den > 0 ? num / den : 0;
  const normSlope = rawSlope / absMean;
  const plateau = Math.abs(normSlope) < slopeEps && cov < covEps;
  return {
    plateau,
    slope: +rawSlope.toFixed(5), normalized_slope: +normSlope.toFixed(5),
    coefficient_of_variation: +cov.toFixed(4), window_mean: +mean.toFixed(4),
    window_size: n, thresholds: { normalized_slope_eps: slopeEps, cov_eps: covEps },
    reason: plateau ? "flat_normalized_slope_low_cov" : "signal_still_moving"
  };
}

async function detectPlateau(env, series) {
  const local = localPlateauDetect(series);
  if (!env.METASTATE_ENDPOINT || series.length < 8) {
    return { local, temporal: null, plateau: local.plateau, source: "local_only" };
  }
  const context = series.slice(-32);
  const meta = await callQpuSubstrateForSeries(env, context);
  if (!meta || meta.error) {
    return { local, temporal: { error: meta ? meta.error : "unreachable" },
             plateau: local.plateau, source: "local_fallback" };
  }
  const temporalConfirms = meta.free_energy !== null && meta.free_energy < 0.5;
  const plateau = local.plateau && temporalConfirms;
  return {
    local,
    temporal: {
      free_energy: meta.free_energy, causal_coherence: meta.causal_coherence,
      confirms_plateau: temporalConfirms
    },
    plateau, source: "local_plus_timesfm"
  };
}

async function callQpuSubstrateForSeries(env, series) {
  const url = env.METASTATE_ENDPOINT;
  if (!url) return null;
  const timeout = parseInt(env.QPU_TIMEOUT_MS || "6000", 10);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const headers = { "Content-Type": "application/json" };
    if (env.METASTATE_API_KEY) headers["Authorization"] = "Bearer " + env.METASTATE_API_KEY;
    const res = await fetch(url.replace(/\/+$/, "") + "/v1/anomaly/score", {
      method: "POST", headers,
      body: JSON.stringify({
        series,
        referrer: env.REFERRER_WALLET || REFERRER_DEFAULT,
        memo: (env.MEMO_PREFIX || "chainstate-worker") + ":plateau",
        source: "chainstate-worker-plateau"
      }),
      signal: ctrl.signal
    });
    if (!res.ok) return { error: `endpoint returned ${res.status}` };
    const body = await res.json().catch(() => ({}));
    return {
      free_energy: body.free_energy ?? null,
      causal_coherence: body.causal_coherence ?? null
    };
  } catch (e) {
    return { error: String(e).slice(0, 100) };
  } finally { clearTimeout(timer); }
}

// ═══════════════════════════════════════════════════════════════════════
// v0.7.0 · ALLOW-LISTED FETCH (v0.7.1 patterns expanded above)
// ═══════════════════════════════════════════════════════════════════════

function getFetchAllow(env) {
  const custom = (env.FETCH_ALLOWLIST || "").split(",").map((s) => s.trim()).filter(Boolean);
  return custom.length ? custom : FETCH_ALLOW_DEFAULT;
}

function isAllowed(urlStr, allowList) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    return allowList.some((p) => {
      const pat = p.toLowerCase().replace(/^\*\./, "");
      return host === pat || host.endsWith("." + pat);
    });
  } catch (e) { return false; }
}

function stripHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function computeSubspaceDist(text) {
  const counts = { math: 0, sci: 0, lang: 0, occ: 0, emo: 0, ctrl: 0 };
  for (const c of text) {
    for (const [k, arr] of Object.entries(SUBSPACE_SAMPLES)) {
      if (arr.includes(c)) counts[k]++;
    }
    if (/[A-Za-z]/.test(c)) counts.lang++;
    if (/[0-9]/.test(c))    counts.math++;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const dist = {};
  for (const s of SUBSPACES) dist[s] = counts[s] / total;
  return dist;
}

async function handleFetch(req, env, ctx) {
  let body;
  try { body = await req.json(); }
  catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }

  const target = (body.url || "").toString();
  if (!target) return j(req, { error: "`url` required" }, { status: 400 });

  const allow = getFetchAllow(env);
  if (!isAllowed(target, allow)) {
    return j(req, {
      error: "url not on allow-list",
      url: target,
      allowlist_size: allow.length,
      hint: "GET /fetch/allowlist to see permitted domains"
    }, { status: 403 });
  }

  const maxBytes = parseInt(env.FETCH_MAX_BYTES || "500000", 10);
  const timeout  = parseInt(env.FETCH_TIMEOUT_MS || "15000", 10);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);

  let text = "", contentType = "", fetchedBytes = 0, status = 0;
  let truncatedFlag = false;
  try {
    const res = await fetch(target, {
      headers: { "User-Agent": "chainstate-worker-fetch/0.7.1", "Accept": "text/*, application/json, */*" },
      signal: ctrl.signal
    });
    status = res.status;
    contentType = res.headers.get("Content-Type") || "";
    if (!res.ok) {
      return j(req, {
        url: target, status, error: `remote returned ${status}`,
        allowed: true, elapsed_ms: null
      });
    }
    const buf = await res.arrayBuffer();
    fetchedBytes = buf.byteLength;
    const truncated = buf.byteLength > maxBytes;
    const bytesToDecode = truncated ? buf.slice(0, maxBytes) : buf;
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytesToDecode);
    if (contentType.includes("html")) text = stripHtml(raw);
    else if (contentType.includes("json")) text = raw;
    else text = raw;
    if (text.length > 20000) text = text.slice(0, 20000);
    truncatedFlag = truncated || text.length >= 20000;
  } catch (e) {
    clearTimeout(timer);
    return j(req, {
      url: target, error: String(e).slice(0, 200), allowed: true, status
    }, { status: 502 });
  } finally { clearTimeout(timer); }

  const subspaceDist = computeSubspaceDist(text);
  const dominant = dominantSubspace(subspaceDist);

  let embedding = null;
  const emb = await callEncoder(env, text.slice(0, 8000));
  if (emb && emb.vector) {
    embedding = { dim: emb.dim, vector: emb.vector, elapsed_ms: emb.elapsed_ms };
  }

  let stored = null;
  if (body.store && body.label && env.CHAINSTATE_CACHE) {
    const key_base = String(body.label).replace(/[^A-Za-z0-9-]+/g, "-").toLowerCase().slice(0, 60);
    const priorKey = "prior:fetch:" + key_base;
    const vecKey   = "vec:fetch:" + key_base;
    const record = {
      source: "fetch",
      title: body.label,
      summary: text.slice(0, 1500),
      url: target,
      subspace_dist: subspaceDist,
      ts: new Date().toISOString(),
      ingester: "chainstate-worker-fetch",
    };
    const ttl = Math.min(90*86400, Math.max(3600, parseInt(body.ttl || (14*86400), 10)));
    await env.CHAINSTATE_CACHE.put(priorKey, JSON.stringify(record), { expirationTtl: ttl });
    if (embedding) {
      await env.CHAINSTATE_CACHE.put(vecKey,
        JSON.stringify({ vec: embedding.vector, ts: record.ts }),
        { expirationTtl: ttl });
    }
    stored = { prior_key: priorKey, vec_key: embedding ? vecKey : null, ttl_seconds: ttl };
  }

  return j(req, {
    url: target,
    status,
    content_type: contentType,
    fetched_bytes: fetchedBytes,
    text_length: text.length,
    truncated: !!truncatedFlag,
    dominant_subspace: dominant,
    subspace_distribution: subspaceDist,
    text_preview: text.slice(0, 500),
    embedding: embedding ? { dim: embedding.dim, elapsed_ms: embedding.elapsed_ms, vector_stored: !!stored } : null,
    stored,
    allowlist_matched: allow.find((p) => {
      const pat = p.toLowerCase().replace(/^\*\./, "");
      const h = new URL(target).hostname.toLowerCase();
      return h === pat || h.endsWith("." + pat);
    }) || null,
    worker_version: WORKER_VERSION,
    owner: "Ciprian Florin Pater",
    timestamp: new Date().toISOString()
  });
}

async function handleFetchAllowlist(req, env) {
  const allow = getFetchAllow(env);
  return j(req, {
    count: allow.length,
    allowlist: allow,
    max_bytes: parseInt(env.FETCH_MAX_BYTES || "500000", 10),
    timeout_ms: parseInt(env.FETCH_TIMEOUT_MS || "15000", 10),
    note: "override via env FETCH_ALLOWLIST (comma-separated)",
    worker_version: WORKER_VERSION
  });
}

// ─── /ecosystem (v0.7.2) ────────────────────────────────────────────────
// The substrate's machine-readable self-model of the NWO ecosystem it
// inhabits. Overlays live env-var configuration onto the static registry so
// callers see both the documented role and the current wiring status.

async function handleEcosystem(req, env) {
  // Deep-copy the static registry, then overlay live configuration status.
  const reg = JSON.parse(JSON.stringify(ECOSYSTEM_REGISTRY));

  // Overlay: which substrates are actually configured on this deployment.
  reg.spaces.metastate.configured = !!env.METASTATE_ENDPOINT;
  reg.spaces.nwo_neuro.configured = !!env.NEURO_ENDPOINT;
  reg.spaces.nwo_asm.configured = !!env.ORNITH_ADAPTER;
  reg.spaces.nwo_genetic.worker_configured = !!(env.GENETIC_WORKER_URL || true);
  reg.spaces.nwo_mixed_reality.worker_configured = !!(env.MR_WORKER_URL || true);
  reg.spaces.nwo_agentic.runner_configured = !!(env.AGENTIC_RUNNER_URL || true);

  // Overlay: genomic_integrity guardrail live status (the key safeguard).
  const genomicActive = env.GENOMIC_GUARDRAIL_OFF !== "true" &&
    !((env.OPERATOR_GUARDRAILS_OFF || "").split(",").map((s) => s.trim()).includes("genomic_integrity"));
  reg.spaces.nwo_genetic.genomic_guardrail_active = genomicActive;
  if (!genomicActive) {
    reg.spaces.nwo_genetic.WARNING =
      "genomic_integrity Deontic category is DISABLED on this deployment. Human-germline deployment is NOT currently refused. This is surfaced publicly and should be re-enabled unless there is a documented, reviewed reason.";
  }

  reg.worker_version = WORKER_VERSION;
  reg.owner = "Ciprian Florin Pater";
  reg.timestamp = new Date().toISOString();
  reg.note = "Static ecosystem self-model overlaid with live configuration. FETCH allow-list governs which of these the substrate may actually read; see /fetch/allowlist.";
  return j(req, reg);
}

// ═══════════════════════════════════════════════════════════════════════
// v0.7.0 · REFLECTIVE COGNITION LOOP (unchanged)
// ═══════════════════════════════════════════════════════════════════════

function generateFollowups(seedReceipt, nearestPriorsList, maxFollowups) {
  const followups = [];
  const seen = new Set();
  const push = (q, reason) => {
    if (followups.length >= maxFollowups) return;
    const norm = q.trim().toLowerCase();
    if (seen.has(norm)) return;
    seen.add(norm);
    followups.push({ query: q, reason });
  };

  const dominant = seedReceipt.dominant_subspace || "math";
  const pool = SUBSPACE_SAMPLES[dominant] || [];
  const topSymbols = seedReceipt.top_symbols || [];
  if (pool.length && topSymbols.length) {
    const candidates = pool.filter((s) => !topSymbols.includes(s));
    if (candidates.length) {
      const p1 = candidates[Math.floor(Math.random() * candidates.length)];
      const p2 = candidates[Math.floor(Math.random() * candidates.length)];
      push(`${topSymbols[0]} vs ${p1} — how do these relate in the ${dominant} subspace?`,
           "adjacent_symbols_in_dominant_subspace");
      if (p2 !== p1) push(`${p2} in the context of ${topSymbols.slice(0,2).join(" ")}`,
           "adjacent_symbols_in_dominant_subspace");
    }
  }

  const v = seedReceipt.verdict;
  if (v === "UNCERTAIN") {
    push(`Explain the mathematical relationship between ${topSymbols.slice(0,3).join(", ")}`,
         "epistemic_uncertainty_resolution");
  } else if (v === "LOW_TRUST") {
    push(`What consensus should exist across nodes for a query involving ${topSymbols[0]}?`,
         "doxastic_low_trust_resolution");
  } else if (v === "INFEASIBLE") {
    push(`TARGET edge ${topSymbols.slice(0,2).join(" ")} — retry with edge substrate`,
         "dynamic_infeasibility_retry");
  } else if (v === "ACCEPTED") {
    if (nearestPriorsList && nearestPriorsList.length) {
      const p = nearestPriorsList[0];
      if (p && p.title) {
        push(`How does "${p.title}" connect to ${topSymbols.slice(0,2).join(" ")}?`,
             "semantic_neighbor_extension");
      }
    }
  }

  const otherSubspaces = SUBSPACES.filter((s) => s !== dominant);
  if (otherSubspaces.length) {
    const other = otherSubspaces[Math.floor(Math.random() * otherSubspaces.length)];
    const otherPool = SUBSPACE_SAMPLES[other] || [];
    if (otherPool.length && topSymbols.length) {
      const otherSym = otherPool[Math.floor(Math.random() * otherPool.length)];
      push(`${topSymbols[0]} ${otherSym} — cross-subspace query bridging ${dominant} and ${other}`,
           "cross_subspace_bridging");
    }
  }

  return followups.slice(0, maxFollowups);
}

async function handleAgiReflect(req, env, ctx) {
  let body;
  try { body = await req.json(); }
  catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }

  let seedReceipt = body.receipt || null;
  const maxFollowups = Math.min(5, Math.max(1, parseInt(body.max_followups || env.REFLECT_MAX_FOLLOWUPS || "3", 10)));
  const dispatch = body.dispatch !== false;

  if (!seedReceipt && body.query) {
    const fakeReq = new Request(new URL(req.url).origin + "/query", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: body.query, swarmSize: body.swarmSize, consensusDepth: body.consensusDepth, cache: body.cache !== false })
    });
    const seedRes = await handleQuery(fakeReq, env, ctx);
    seedReceipt = await seedRes.json();
  }
  if (!seedReceipt) return j(req, { error: "either `receipt` or `query` required" }, { status: 400 });

  let priorHints = [];
  if (env.ENCODER_URL && seedReceipt.query) {
    const emb = await callEncoder(env, seedReceipt.query);
    if (emb && emb.vector) priorHints = await nearestPriors(env, emb.vector, 3);
  }

  const followups = generateFollowups(seedReceipt, priorHints, maxFollowups);

  const followupResults = [];
  if (dispatch) {
    for (const f of followups) {
      try {
        const fakeReq = new Request(new URL(req.url).origin + "/query", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: f.query, swarmSize: body.swarmSize, consensusDepth: body.consensusDepth, cache: true })
        });
        const r = await handleQuery(fakeReq, env, ctx);
        const receipt = await r.json();
        followupResults.push({
          query: f.query, reason: f.reason,
          receipt: {
            dominant_subspace: receipt.dominant_subspace,
            top_symbols: receipt.top_symbols,
            confidence: receipt.confidence,
            truth_lattice: receipt.truth_lattice,
            verdict: receipt.verdict,
            gasUsed: receipt.gasUsed,
            qHash: receipt.qHash,
            grounding: receipt.grounding || null
          }
        });
      } catch (e) {
        followupResults.push({ query: f.query, reason: f.reason, error: String(e).slice(0, 200) });
      }
    }
  } else {
    for (const f of followups) followupResults.push({ query: f.query, reason: f.reason, preview: true });
  }

  return j(req, {
    seed: {
      qHash: seedReceipt.qHash, query: seedReceipt.query,
      dominant_subspace: seedReceipt.dominant_subspace,
      top_symbols: seedReceipt.top_symbols,
      truth_lattice: seedReceipt.truth_lattice,
      verdict: seedReceipt.verdict,
      confidence: seedReceipt.confidence,
    },
    prior_hints: priorHints,
    followups_generated: followups.length,
    followups_dispatched: dispatch,
    followup_receipts: followupResults,
    reflect_mode: "deterministic-signal-mining",
    worker_version: WORKER_VERSION,
    owner: "Ciprian Florin Pater",
    timestamp: new Date().toISOString()
  });
}

// ═══════════════════════════════════════════════════════════════════════
// v0.7.0 · PRIORS QUERY endpoints (unchanged)
// ═══════════════════════════════════════════════════════════════════════

async function handleGround(req, env) {
  let body;
  try { body = await req.json(); }
  catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }
  const text = (body.text || "").toString();
  if (!text) return j(req, { error: "`text` required" }, { status: 400 });
  const emb = await callEncoder(env, text);
  return j(req, {
    encoder_url: env.ENCODER_URL || null,
    ...emb,
    worker_version: WORKER_VERSION,
    timestamp: new Date().toISOString()
  });
}

async function handlePriorsQuery(req, env) {
  let body;
  try { body = await req.json(); }
  catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }
  const text = (body.text || body.query || "").toString();
  if (!text) return j(req, { error: "`text` or `query` required" }, { status: 400 });
  const k = Math.min(20, Math.max(1, parseInt(body.k || env.PRIORS_TOPK_DEFAULT || "3", 10)));
  const emb = await callEncoder(env, text);
  if (!emb || !emb.vector) {
    return j(req, {
      error: "encoder unreachable — cannot compute query embedding",
      encoder_status: emb ? emb.status || "error" : "no_response"
    }, { status: 503 });
  }
  const neighbors = await nearestPriors(env, emb.vector, k);
  return j(req, {
    query_text: text, k, neighbors,
    encoder_elapsed_ms: emb.elapsed_ms,
    worker_version: WORKER_VERSION,
    timestamp: new Date().toISOString()
  });
}

async function handlePriorsList(req, env) {
  if (!env.CHAINSTATE_CACHE) return j(req, { error: "CHAINSTATE_CACHE not bound" }, { status: 500 });
  const list = await env.CHAINSTATE_CACHE.list({ prefix: "prior:", limit: 500 });
  const bySource = {};
  const keys = [];
  for (const k of list.keys) {
    const parts = k.name.split(":");
    const source = parts[1] || "unknown";
    bySource[source] = (bySource[source] || 0) + 1;
    keys.push(k.name);
  }
  return j(req, {
    total_priors: list.keys.length,
    by_source: bySource,
    sample_keys: keys.slice(0, 100),
    list_complete: list.list_complete === undefined ? true : list.list_complete,
    worker_version: WORKER_VERSION,
    timestamp: new Date().toISOString()
  });
}

// ═══════════════════════════════════════════════════════════════════════
// v0.7.1 · OPTIONAL POSTGRES ARCHIVAL — Supabase-flavored
// ═══════════════════════════════════════════════════════════════════════
// Disabled by default. Set POSTGRES_HTTP_URL + POSTGRES_HTTP_TOKEN env vars
// to activate. Adds ~50ms per query.
//
// Configuration (for Supabase, using same project as NWO Robotics):
//   POSTGRES_HTTP_URL   = https://<project-ref>.supabase.co/rest/v1
//   POSTGRES_HTTP_TOKEN = <service_role key> (add as Secret in dashboard)
//   POSTGRES_SCHEMA     = chainstate  (optional; defaults to "chainstate")
//
// Requires: Supabase dashboard → Settings → API → Exposed schemas
//           must include "chainstate" (comma-separated with public).
//
// The Content-Profile header tells PostgREST which schema to write to —
// without it, writes fail against Supabase's default public exposure.
//
// The function name is kept as `archiveReceiptToPostgres` for compatibility
// with existing router wiring; the target is Supabase Postgres.

async function archiveReceiptToPostgres(receipt, env) {
  if (!env.POSTGRES_HTTP_URL || !env.POSTGRES_HTTP_TOKEN) return;
  try {
    const nearest = (receipt.grounding && receipt.grounding.nearest_priors) || [];
    const top1 = nearest[0] || {};
    const schema = env.POSTGRES_SCHEMA || "chainstate";
    await fetch(env.POSTGRES_HTTP_URL.replace(/\/+$/, "") + "/receipt_summary", {
      method: "POST",
      headers: {
        "apikey": env.POSTGRES_HTTP_TOKEN,
        "Authorization": "Bearer " + env.POSTGRES_HTTP_TOKEN,
        "Content-Type": "application/json",
        "Content-Profile": schema,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        qhash: receipt.qHash,
        dominant_subspace: receipt.dominant_subspace,
        top_symbols: receipt.top_symbols,
        verdict: receipt.verdict,
        truth_lattice: receipt.truth_lattice,
        confidence: receipt.confidence,
        rounds_run: receipt.rounds_run,
        participating_nodes: receipt.participatingNodes,
        gas_used: String(receipt.gasUsed),
        substrate_target: receipt.target,
        substrate_cost_usdc: receipt.substrate_cost_usdc || 0,
        cache: "MISS",
        semantic_hash: receipt.grounding ? receipt.grounding.semantic_hash : null,
        encoder_latency_ms: receipt.grounding ? receipt.grounding.encoder_elapsed_ms : null,
        d_sem_top1: top1.cos || null,
        d_sem_top1_source: top1.source || null,
        d_sem_top1_slug: top1.title || null,
        received_at: receipt.timestamp
      })
    });
  } catch (_) {
    // Silent fail — Supabase archival is a supplement, not source of truth.
  }
}

// ═══════════════════════════════════════════════════════════════════════
// v0.7.3 · ON-CHAIN ANCHOR (Base mainnet 8453)
// ═══════════════════════════════════════════════════════════════════════
//
// Every receipt is forwarded to the chainstate-anchor microservice, which
// holds the AGI signing wallet and pushes to the CHAINSTATEAnchor contract.
// The Worker itself NEVER holds a private key: the split of concerns is
// intentional. Worker = stateless request handler; anchor microservice =
// key custodian + tx batcher + Base RPC client.
//
// Wire-up:
//   ANCHOR_URL          → https://chainstate-anchor.onrender.com
//   ANCHOR_QUEUE_TOKEN  → SECRET; shared bearer for queue authentication
//
// The anchor endpoint accepts a POST with the receipt summary. Server-side
// it batches, signs with the AGI wallet, and sends to Base. Failure is
// silent from the Worker's perspective — receipts remain in KV and Supabase
// regardless; the chain anchor is a supplemental durability layer.

// ═══════════════════════════════════════════════════════════════════════
// v0.7.3.1 · ANCHOR CONFIG + TELEMETRY (additive · observability layer)
// ═══════════════════════════════════════════════════════════════════════
//
// Reads env vars with fallback aliases so both dashboard var names work:
//   ANCHOR_URL (original) OR ANCHOR_SERVICE_URL (alias · matches wrangler.toml)
//   ANCHOR_URL wins on conflict.
//
// Telemetry counters persist in CHAINSTATE_CACHE under `anchor:telemetry`
// with a 90-day TTL. Every anchor call increments the appropriate counter
// and records the last response status, body preview, and tx hash.

const ANCHOR_TELEMETRY_KEY = "anchor:telemetry";

function getAnchorConfig(env) {
  const url        = env.ANCHOR_URL || env.ANCHOR_SERVICE_URL || null;
  const token      = env.ANCHOR_QUEUE_TOKEN || null;
  const enabledEnv = (env.ANCHOR_ENABLED || "").toLowerCase();
  const disabled   = enabledEnv === "false" || enabledEnv === "0" || enabledEnv === "off";
  const timeoutMs  = parseInt(env.ANCHOR_TIMEOUT_MS || "10000", 10);
  return {
    url,
    token,
    enabled: !!(url && token) && !disabled,
    timeoutMs,
    source_var: env.ANCHOR_URL ? "ANCHOR_URL" : (env.ANCHOR_SERVICE_URL ? "ANCHOR_SERVICE_URL" : null),
    receipt_path: env.ANCHOR_RECEIPT_PATH || "/anchor/receipt",
    refusal_path: env.ANCHOR_REFUSAL_PATH || "/anchor/refusal"
  };
}

function emptyAnchorTelemetry() {
  return {
    queued: 0,
    sent: 0,
    failed: 0,
    refusals_queued: 0,
    refusals_sent: 0,
    refusals_failed: 0,
    last_call_at: null,
    last_endpoint: null,
    last_status: null,
    last_error: null,
    last_tx_hash: null,
    last_body_preview: null,
    last_elapsed_ms: null,
    last_refusal_status: null,
    last_refusal_error: null,
    counted_since: new Date().toISOString()
  };
}

async function readAnchorTelemetry(env) {
  if (!env.CHAINSTATE_CACHE) return emptyAnchorTelemetry();
  try {
    const raw = await env.CHAINSTATE_CACHE.get(ANCHOR_TELEMETRY_KEY);
    if (raw) return Object.assign(emptyAnchorTelemetry(), JSON.parse(raw));
  } catch (_) {}
  return emptyAnchorTelemetry();
}

async function writeAnchorTelemetry(env, patch) {
  if (!env.CHAINSTATE_CACHE) return;
  try {
    const current = await readAnchorTelemetry(env);
    const next = Object.assign({}, current, patch);
    await env.CHAINSTATE_CACHE.put(ANCHOR_TELEMETRY_KEY, JSON.stringify(next),
      { expirationTtl: 90 * 86400 });
  } catch (_) {}
}

async function anchorReceiptToChain(receipt, env) {
  const cfg = getAnchorConfig(env);
  if (!cfg.enabled) {
    // Record reason so /status can surface it
    await writeAnchorTelemetry(env, {
      last_call_at: new Date().toISOString(),
      last_status: null,
      last_error: cfg.url
        ? (cfg.token ? "ANCHOR_ENABLED=false" : "ANCHOR_QUEUE_TOKEN missing")
        : "ANCHOR_URL / ANCHOR_SERVICE_URL missing"
    });
    return;
  }
  const endpoint = cfg.url.replace(/\/+$/, "") + cfg.receipt_path;
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  const before = await readAnchorTelemetry(env);
  await writeAnchorTelemetry(env, {
    queued: (before.queued || 0) + 1,
    last_call_at: new Date().toISOString(),
    last_endpoint: endpoint,
  });
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cfg.token
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        qHash: receipt.qHash,
        semantic_hash: receipt.grounding ? receipt.grounding.semantic_hash : null,
        identity_hash: receipt.identity_hash || null,
        truth_lattice: receipt.truth_lattice,
        verdict: receipt.verdict,
        dominant_subspace: receipt.dominant_subspace,
        target: receipt.target,
        confidence: receipt.confidence,
        rounds_run: receipt.rounds_run,
        participating_nodes: receipt.participatingNodes,
        gas_used: receipt.gasUsed,
        substrate_cost_usdc: receipt.substrate_cost_usdc || 0,
        received_at: receipt.timestamp,
        // v0.7.3: Cardiac requester rootTokenId (null / 0 = anonymous;
        // non-zero = verified against L5 Identity Hub)
        requester_root_token_id: (receipt.requester_identity && receipt.requester_identity.verified)
          ? receipt.requester_identity.root_token_id
          : null
      })
    });
    const elapsed = Date.now() - t0;
    let bodyText = "";
    try { bodyText = (await res.text()).slice(0, 400); } catch (_) {}
    let txHash = null;
    try {
      const parsed = JSON.parse(bodyText);
      txHash = parsed.tx_hash || parsed.txHash || parsed.hash || parsed.transaction_hash || null;
    } catch (_) {}
    const after = await readAnchorTelemetry(env);
    if (res.ok) {
      await writeAnchorTelemetry(env, {
        sent: (after.sent || 0) + 1,
        last_status: res.status,
        last_error: null,
        last_tx_hash: txHash,
        last_body_preview: bodyText.slice(0, 200),
        last_elapsed_ms: elapsed
      });
    } else {
      await writeAnchorTelemetry(env, {
        failed: (after.failed || 0) + 1,
        last_status: res.status,
        last_error: bodyText.slice(0, 300),
        last_elapsed_ms: elapsed
      });
    }
  } catch (e) {
    // v0.7.3.1 · was silent-fail; now captured for /status + /anchor/status
    const after = await readAnchorTelemetry(env);
    await writeAnchorTelemetry(env, {
      failed: (after.failed || 0) + 1,
      last_status: 0,
      last_error: String(e).slice(0, 300),
      last_elapsed_ms: Date.now() - t0
    });
  } finally {
    clearTimeout(timer);
  }
}

async function anchorRefusalToChain(receipt, env) {
  const cfg = getAnchorConfig(env);
  if (!cfg.enabled) return;
  if (receipt.verdict !== "REFUSED") return;
  const violations = (receipt.multimodal && receipt.multimodal.deontic
                      && receipt.multimodal.deontic.violations) || [];
  if (!violations.length) return;
  const endpoint = cfg.url.replace(/\/+$/, "") + cfg.refusal_path;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  const before = await readAnchorTelemetry(env);
  await writeAnchorTelemetry(env, { refusals_queued: (before.refusals_queued || 0) + 1 });
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cfg.token
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        qHash: receipt.qHash,
        category: violations[0].category,
        marker: violations[0].marker,
        refused_at: receipt.timestamp
      })
    });
    let bodyText = "";
    try { bodyText = (await res.text()).slice(0, 400); } catch (_) {}
    const after = await readAnchorTelemetry(env);
    if (res.ok) {
      await writeAnchorTelemetry(env, {
        refusals_sent: (after.refusals_sent || 0) + 1,
        last_refusal_status: res.status,
        last_refusal_error: null
      });
    } else {
      await writeAnchorTelemetry(env, {
        refusals_failed: (after.refusals_failed || 0) + 1,
        last_refusal_status: res.status,
        last_refusal_error: bodyText.slice(0, 200)
      });
    }
  } catch (e) {
    const after = await readAnchorTelemetry(env);
    await writeAnchorTelemetry(env, {
      refusals_failed: (after.refusals_failed || 0) + 1,
      last_refusal_error: String(e).slice(0, 200)
    });
  } finally { clearTimeout(timer); }
}

// ═══════════════════════════════════════════════════════════════════════
// v0.7.3.1 · GET /anchor/status — dedicated diagnostics endpoint (additive)
// ═══════════════════════════════════════════════════════════════════════
//
// Pings the microservice /status so you can see reachability in one call.
// Diagnostic hints correlate HTTP status codes with the likely fix.

async function handleAnchorStatus(req, env) {
  const cfg = getAnchorConfig(env);
  const telemetry = await readAnchorTelemetry(env);
  let microservice = null;
  if (cfg.url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const t0 = Date.now();
      const res = await fetch(cfg.url.replace(/\/+$/, "") + "/status", {
        method: "GET", signal: ctrl.signal
      });
      const elapsed = Date.now() - t0;
      const bodyText = (await res.text()).slice(0, 2000);
      let bodyJson = null;
      try { bodyJson = JSON.parse(bodyText); } catch (_) {}
      microservice = {
        reachable: true, status: res.status, elapsed_ms: elapsed,
        body: bodyJson || bodyText
      };
    } catch (e) {
      microservice = { reachable: false, error: String(e).slice(0, 200) };
    } finally { clearTimeout(timer); }
  }
  return j(req, {
    ok: cfg.enabled,
    config: {
      enabled: cfg.enabled,
      service_url: cfg.url,
      service_url_source_var: cfg.source_var,
      token_configured: !!cfg.token,
      timeout_ms: cfg.timeoutMs,
      receipt_path: cfg.receipt_path,
      refusal_path: cfg.refusal_path
    },
    contract: {
      anchor: "0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
      cardiac_extensions: "0x5438854ead35dc6c873414f222725732f862dabe",
      chain_id: 8453,
      basescan: "https://basescan.org/address/0x12441662740836e9c72a4b758fe1c60c17ddd2d8"
    },
    telemetry,
    microservice_status: microservice,
    diagnostic_hint: !cfg.enabled
      ? "anchor disabled: set ANCHOR_URL (or ANCHOR_SERVICE_URL) AND ANCHOR_QUEUE_TOKEN in Cloudflare dashboard; check ANCHOR_ENABLED is not 'false'"
      : (telemetry.last_status === 401
          ? "microservice returned 401 — ANCHOR_QUEUE_TOKEN on worker does not match microservice env value"
          : (telemetry.last_status === 404
              ? "microservice returned 404 — receipt endpoint path is wrong; set ANCHOR_RECEIPT_PATH dashboard var (default /anchor/receipt)"
              : (telemetry.last_status === 422
                  ? "microservice returned 422 — payload shape mismatch; check microservice OpenAPI at /docs"
                  : (telemetry.last_error
                      ? "last error: " + telemetry.last_error
                      : "no errors recorded")))),
    worker_version: WORKER_VERSION,
    owner: "Ciprian Florin Pater",
    timestamp: new Date().toISOString()
  });
}

// ═══════════════════════════════════════════════════════════════════════
// v0.7.1 · SEED CRON
// ═══════════════════════════════════════════════════════════════════════

async function runSeedCron(env, ctx) {
  if (env.SEED_CRON_ENABLED !== "true") {
    return { ok: true, skipped: "SEED_CRON_ENABLED != true" };
  }
  let seeds = [];
  try {
    seeds = JSON.parse(env.SEED_QUERIES || "[]");
  } catch (e) {
    return { ok: false, error: "SEED_QUERIES parse error: " + String(e).slice(0, 100) };
  }
  if (!Array.isArray(seeds) || !seeds.length) {
    return { ok: false, error: "SEED_QUERIES empty or malformed" };
  }

  const runId = "seed:" + new Date().toISOString().slice(0, 13);
  const results = [];
  const base = "https://chainstate-worker.ciprianpater.workers.dev";

  for (const seed of seeds) {
    try {
      // 1) Dispatch the seed query directly against the in-process /query handler
      const queryReq = new Request(base + "/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: seed.q,
          target: seed.target || "edge",
          swarmSize: parseInt(env.SWARM_SIZE || "50", 10),
          consensusDepth: parseInt(env.CONSENSUS_DEPTH || "3", 10),
          cache: true
        })
      });
      const queryRes = await handleQuery(queryReq, env, ctx);
      const receipt = await queryRes.json();

      // 2) Reflect on the receipt (dispatches follow-ups through /query)
      const reflectReq = new Request(base + "/agi/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt,
          max_followups: parseInt(env.REFLECT_MAX_FOLLOWUPS || "3", 10),
          dispatch: true
        })
      });
      const reflectRes = await handleAgiReflect(reflectReq, env, ctx);
      const reflectBody = await reflectRes.json();

      results.push({
        seed: seed.q,
        memo: seed.memo || null,
        qHash: receipt.qHash,
        verdict: receipt.verdict,
        confidence: receipt.confidence,
        followups_generated: reflectBody.followups_generated || 0
      });
    } catch (e) {
      results.push({
        seed: seed.q,
        memo: seed.memo || null,
        error: String(e).slice(0, 200)
      });
    }
  }

  // 3) Persist the run to KV for observability (7-day retention)
  if (env.CHAINSTATE_CONSENSUS) {
    try {
      await env.CHAINSTATE_CONSENSUS.put(
        "seed:run:" + runId,
        JSON.stringify({ runId, at: new Date().toISOString(), results }),
        { expirationTtl: 7 * 86400 }
      );
    } catch (_) {}
  }

  return { ok: true, runId, count: results.length, results };
}

// ═══════════════════════════════════════════════════════════════════════
// /query — v0.7.0 (unchanged; optional Postgres archival hook at end)
// ═══════════════════════════════════════════════════════════════════════

async function handleQuery(req, env, ctx) {
  let body;
  try { body = await req.json(); }
  catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }

  const query = (body.query || "").toString();
  if (!query) return j(req, { error: "`query` required" }, { status: 400 });

  const swarmSize      = Math.min(100, Math.max(1, parseInt(body.swarmSize || env.SWARM_SIZE || "50", 10)));
  const consensusDepth = Math.min(7, Math.max(1, parseInt(body.consensusDepth || env.CONSENSUS_DEPTH || "3", 10)));
  const useCache       = body.cache !== false;
  const quantumOff     = body.quantumOffload || null;
  const explicitTarget = body.target || null;
  const wantGrounding  = body.grounding !== false;

  // v0.7.3: Cardiac requester identity (optional; enrichment layer).
  // Resolved once at query intake so both the receipt attachment and the
  // on-chain anchor forward see the same result.
  const claimedRootTokenId = readClaimedRootTokenId(req, env);
  const cardiacIdentity    = await verifyRequesterIdentity(claimedRootTokenId, env);

  const qHash    = await sha3(query);
  const cacheKey = `q:${qHash}`;

  if (useCache && env.CHAINSTATE_CACHE) {
    const hit = await env.CHAINSTATE_CACHE.get(cacheKey);
    if (hit) {
      return new Response(hit, {
        status: 200,
        headers: Object.assign(
          { "Content-Type": "application/json", "X-Cache": "HIT",
            "X-Consensus-Mode": "cache", "Cache-Control": "no-store" },
          corsHeaders(req)
        )
      });
    }
  }

  const target = parseTarget(query, explicitTarget);
  const t0 = Date.now();
  let peers = await listPeers(env);
  if (peers.length > swarmSize) peers = peers.slice(0, swarmSize);

  let consensusMode = "real";
  let pooledState = null;
  let peerResults = [];
  let roundsRun = 0;
  let convergedAt = null;
  let roundCosines = [];

  if (peers.length > 0) {
    const timeoutMs = parseInt(env.PEER_TIMEOUT_MS || "4000", 10);
    const convergeThreshold = parseFloat(env.CONVERGE_COSINE || "0.95");
    let priorForNextRound = null;
    let previousPool = null;
    for (let round = 0; round < consensusDepth; round++) {
      const priorPayload = priorForNextRound ? { dist: priorForNextRound, round } : null;
      const roundResults = await Promise.all(
        peers.map((p) => fetchPeerState(p, query, timeoutMs, priorPayload))
      );
      const ok = roundResults.filter((r) => r.ok);
      if (ok.length === 0) {
        if (round === 0) consensusMode = "fallback_all_peers_failed";
        break;
      }
      const states = ok.map((r) => r.state);
      const reps   = ok.map((r) => r.peer.reputation);
      const currentPool = logPool(states, reps);
      if (previousPool) {
        const cos = cosineSim(currentPool, previousPool);
        roundCosines.push(+cos.toFixed(4));
        if (cos >= convergeThreshold) {
          convergedAt = round;
          pooledState = currentPool;
          peerResults = roundResults;
          roundsRun = round + 1;
          break;
        }
      }
      previousPool = currentPool;
      priorForNextRound = currentPool;
      pooledState = currentPool;
      peerResults = roundResults;
      roundsRun = round + 1;
    }
  } else {
    consensusMode = "fallback_no_peers";
  }

  if (!pooledState) {
    pooledState = computeSubspaceDist(query);
  }

  const dominant = dominantSubspace(pooledState);
  const exec_ms  = Date.now() - t0;

  let confidence, participatingNodes, consensusStrength = "strong";
  if (consensusMode === "real") {
    const okResults = peerResults.filter((r) => r.ok);
    const sims = okResults.map((r) => cosineSim(r.state, pooledState));
    confidence = sims.reduce((a, b) => a + b, 0) / sims.length;
    participatingNodes = okResults.length;
    const weakThreshold = parseFloat(env.WEAK_CONSENSUS_CONF || "0.7");
    const noConsensusThreshold = parseFloat(env.NO_CONSENSUS_CONF || "0.5");
    if (confidence < noConsensusThreshold) { consensusMode = "no_consensus"; consensusStrength = "none"; }
    else if (confidence < weakThreshold) { consensusStrength = "weak"; }
    else if (confidence < 0.9) { consensusStrength = "moderate"; }
    else { consensusStrength = "strong"; }
    const alpha = parseFloat(env.REPUTATION_ALPHA || "0.05");
    const minRep = parseFloat(env.REPUTATION_MIN || "0.05");
    ctx.waitUntil((async () => {
      for (let i = 0; i < okResults.length; i++) {
        const r = okResults[i];
        const oldRep = r.peer.reputation;
        const newRep = (1 - alpha) * oldRep + alpha * sims[i];
        await setReputation(env, r.peer.node_id, newRep);
        if (newRep < minRep) await prunePeer(env, r.peer.node_id);
      }
    })());
  } else {
    confidence = 0.7 + Math.random() * 0.28;
    participatingNodes = 0;
    consensusStrength = "fallback";
  }

  const n = participatingNodes || Math.min(swarmSize, 30);
  const effectiveDepth = roundsRun > 0 ? roundsRun : consensusDepth;
  const gas = +(0.001 + n * 0.00001 + effectiveDepth * 0.00005 + exec_ms * 0.000001).toFixed(6);

  const topSamples = SUBSPACE_SAMPLES[dominant] || SUBSPACE_SAMPLES.math;
  const top_symbols = [
    topSamples[Math.floor(Math.random() * topSamples.length)],
    topSamples[Math.floor(Math.random() * topSamples.length)],
    topSamples[Math.floor(Math.random() * topSamples.length)]
  ];

  let gpu_metrics = null, qpu_metrics = null, npu_metrics = null;
  if (target === "gpu") gpu_metrics = await callGpuSubstrate(env, query, dominant);
  else if (target === "qpu") qpu_metrics = await callQpuSubstrate(env, query, dominant, pooledState);
  else if (target === "npu") {
    const providedMss = (body.mss && typeof body.mss === "object") ? body.mss : null;
    npu_metrics = await callNpuSubstrate(env, query, dominant, pooledState, providedMss);
  }

  const epistemic = assessEpistemic(confidence, roundsRun, convergedAt, consensusMode, qpu_metrics, npu_metrics);
  const doxastic  = assessDoxastic(peerResults, pooledState);
  const deontic   = assessDeontic(query, env);
  const dynamic   = assessDynamic(target, roundsRun, consensusDepth, gpu_metrics, qpu_metrics, npu_metrics, env, gas);
  const verdict   = resolveVerdict(epistemic, doxastic, deontic, dynamic);

  let substrateCost = 0;
  const costBreakdown = { gpu: 0, qpu: 0, npu: 0 };
  if (target === "gpu" && gpu_metrics && !gpu_metrics.error) costBreakdown.gpu = SUBSTRATE_PRICES_USDC.gpu;
  if (target === "qpu" && qpu_metrics && qpu_metrics.status === "ok") {
    costBreakdown.qpu = (env.METASTATE_PATH === "/v1/quantum/route")
      ? SUBSTRATE_PRICES_USDC.qpu_quantum : SUBSTRATE_PRICES_USDC.qpu;
  }
  if (target === "npu" && npu_metrics && npu_metrics.status === "ok") costBreakdown.npu = SUBSTRATE_PRICES_USDC.npu;
  substrateCost = costBreakdown.gpu + costBreakdown.qpu + costBreakdown.npu;

  let grounding = null;
  if (wantGrounding && env.ENCODER_URL) {
    const emb = await callEncoder(env, query);
    if (emb && emb.vector) {
      const semHash = emb.vector.slice(0, 12).map((v) => Math.round(v * 1000)).join(",");
      const priors = await nearestPriors(env, emb.vector, 3);
      grounding = {
        encoder: "sentence-transformers/all-MiniLM-L6-v2",
        semantic_dim: emb.dim,
        semantic_hash: semHash,
        encoder_elapsed_ms: emb.elapsed_ms,
        nearest_priors: priors,
      };
    } else if (emb && emb.error) {
      grounding = { encoder_error: emb.error, encoder: env.ENCODER_URL };
    }
  }

  const result = {
    query, qHash, top_symbols,
    dominant_subspace: dominant,
    subspace_distribution: pooledState,
    confidence: +confidence.toFixed(3),
    consensus_strength: consensusStrength,
    participatingNodes, swarmSize, consensusDepth,
    rounds_run: roundsRun, converged_at_round: convergedAt, round_cosines: roundCosines,
    executionTime: exec_ms, gasUsed: gas,
    target, gpu_metrics, qpu_metrics, npu_metrics,
    quantumOffload: quantumOff ? { provider: quantumOff, status: "queued" } : null,
    consensus_mode: consensusMode,
    peer_status: peerResults.map((r) => ({
      node_id: r.peer.node_id, classifier: r.peer.classifier || "codepoint-density",
      ok: r.ok, error: r.error || null, reputation: r.peer.reputation
    })),
    multimodal: { epistemic, doxastic, deontic, dynamic },
    truth_lattice: verdict.truth_lattice,
    verdict: verdict.verdict, verdict_reason: verdict.verdict_reason,
    grounding,
    substrate_cost_usdc: +substrateCost.toFixed(6),
    substrate_cost_breakdown: costBreakdown,
    payment: {
      chain: "base-mainnet-8453",
      splitter: "0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4",
      referrer: env.REFERRER_WALLET || REFERRER_DEFAULT,
      affiliate_share: "0.15 atomic",
      settlement: "on-chain via MetaStateSplitter at substrate call time",
      notes: substrateCost > 0
        ? `${substrateCost.toFixed(6)} USDC billed by substrate; 15% (${(substrateCost*0.15).toFixed(7)}) routed to referrer atomically`
        : "no billable substrate call — edge or unconfigured substrate"
    },
    worker_version: WORKER_VERSION,
    owner: "Ciprian Florin Pater",
    // v0.7.3: Cardiac requester identity (enrichment layer; null when no
    // rootTokenId header was provided or the identity failed verification).
    requester_identity: cardiacIdentity && cardiacIdentity.verified
      ? {
          verified:       true,
          root_token_id:  cardiacIdentity.identity.root_token_id,
          identity_type:  cardiacIdentity.identity.identity_type,
          primary_wallet: cardiacIdentity.identity.primary_wallet,
          display_name:   cardiacIdentity.identity.display_name,
          source:         cardiacIdentity.source
        }
      : (claimedRootTokenId
          ? { verified: false, claimed_root_token_id: claimedRootTokenId, error: cardiacIdentity.error || cardiacIdentity.note || "unverified" }
          : null),
    timestamp: new Date().toISOString()
  };

  ctx.waitUntil(persistReceiptHistory(env, result));

  // v0.7.1 · optional Postgres archival — inactive unless env vars set
  ctx.waitUntil(archiveReceiptToPostgres(result, env));

  // v0.7.3 · optional on-chain anchor — inactive unless ANCHOR_URL+TOKEN set
  ctx.waitUntil(anchorReceiptToChain(result, env));
  ctx.waitUntil(anchorRefusalToChain(result, env));

  if (useCache && env.CHAINSTATE_CACHE) {
    await env.CHAINSTATE_CACHE.put(
      cacheKey, JSON.stringify(result),
      { expirationTtl: parseInt(env.CACHE_TTL || "300", 10) }
    );
  }
  if (env.CHAINSTATE_CONSENSUS) {
    await env.CHAINSTATE_CONSENSUS.put(
      "latest",
      JSON.stringify({ qHash, ts: result.timestamp, depth: consensusDepth,
                        n: participatingNodes, mode: consensusMode,
                        dominant, confidence: result.confidence,
                        truth_lattice: verdict.truth_lattice,
                        verdict: verdict.verdict }),
      { expirationTtl: 600 }
    );
  }

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: Object.assign(
      { "Content-Type": "application/json", "X-Cache": "MISS",
        "X-Consensus-Mode": consensusMode, "Cache-Control": "no-store" },
      corsHeaders(req)
    )
  });
}

// ─── /status (v0.7.1 extended with identity + seed_cron sections) ───────

async function handleStatus(req, env) {
  const peers = await listPeers(env);
  const totalRep = peers.reduce((a, p) => a + p.reputation, 0);
  const meanRep = peers.length ? totalRep / peers.length : 0;
  const classifierStats = {};
  for (const p of peers) {
    const c = p.classifier || "codepoint-density";
    if (!classifierStats[c]) classifierStats[c] = { count: 0, rep_sum: 0 };
    classifierStats[c].count++;
    classifierStats[c].rep_sum += p.reputation;
  }
  const classifierDiversity = {};
  for (const [c, s] of Object.entries(classifierStats)) {
    classifierDiversity[c] = {
      count: s.count, share: +(s.count / peers.length).toFixed(3),
      mean_reputation: +(s.rep_sum / s.count).toFixed(3)
    };
  }
  const allowList = getFetchAllow(env);
  let seedCount = 0;
  try { seedCount = (JSON.parse(env.SEED_QUERIES || "[]")).length; } catch (_) {}
  return j(req, {
    network: "chainstate", chain: "base-mainnet-8453", block_time_s: 2,
    swarm_size: parseInt(env.SWARM_SIZE || "50", 10),
    cons_depth: parseInt(env.CONSENSUS_DEPTH || "3", 10),
    cache_ttl_s: parseInt(env.CACHE_TTL || "300", 10),
    rate_limit: parseInt(env.RATE_LIMIT || "60", 10),
    active_nodes: peers.length, mean_reputation: +meanRep.toFixed(3),
    classifier_diversity: classifierDiversity,
    heterogeneous: Object.keys(classifierDiversity).length > 1,
    consensus_mode: peers.length > 0 ? "real" : "fallback",
    reputation_alpha: parseFloat(env.REPUTATION_ALPHA || "0.05"),
    reputation_min: parseFloat(env.REPUTATION_MIN || "0.05"),
    peer_timeout_ms: parseInt(env.PEER_TIMEOUT_MS || "4000", 10),
    converge_cosine: parseFloat(env.CONVERGE_COSINE || "0.95"),
    weak_consensus_confidence: parseFloat(env.WEAK_CONSENSUS_CONF || "0.7"),
    no_consensus_confidence: parseFloat(env.NO_CONSENSUS_CONF || "0.5"),
    guardrails: {
      categories_available: Object.keys(GUARDRAIL_PATTERNS),
      categories_disabled: (() => {
        const d = (env.OPERATOR_GUARDRAILS_OFF || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (env.GENOMIC_GUARDRAIL_OFF === "true" && !d.includes("genomic_integrity")) d.push("genomic_integrity");
        return d;
      })(),
      framework: "epistemic-doxastic-deontic-dynamic",
      genomic_integrity: {
        active: env.GENOMIC_GUARDRAIL_OFF !== "true" &&
                !((env.OPERATOR_GUARDRAILS_OFF || "").split(",").map((s) => s.trim()).includes("genomic_integrity")),
        principle: "human sovereignty over the human genome (Imperium Romanum founding agenda)",
        refuses: "deployment of heritable human-germline modification, transhumanist enhancement, or anti-natural-evolution edits",
        permits: "analysis, discussion, fold prediction, codon inspection, historical-sequence comparison",
        veto: "hard (Theorem 2) — refusal holds regardless of stated justification"
      }
    },
    ornith_adapter_configured: !!env.ORNITH_ADAPTER,
    substrates: {
      edge:  { status: "live", note: "always reachable" },
      gpu:   { configured: !!env.ORNITH_ADAPTER, endpoint: env.ORNITH_ADAPTER ? "configured" : "unset",
               path: "/v1/substrate/gpu", price_usdc_per_call: SUBSTRATE_PRICES_USDC.gpu,
               provider: "ornith-chainstate on render" },
      qpu:   { configured: !!env.METASTATE_ENDPOINT, endpoint: env.METASTATE_ENDPOINT ? "configured" : "unset",
               path: env.METASTATE_PATH || "/v1/anomaly/score",
               price_usdc_per_call: (env.METASTATE_PATH === "/v1/quantum/route") ? "provider-set at call time" : SUBSTRATE_PRICES_USDC.qpu,
               provider: "metastate free-energy kernel + TimesFM 2.5 temporal prior" },
      npu:   { configured: !!env.NEURO_ENDPOINT, endpoint: env.NEURO_ENDPOINT ? "configured" : "unset",
               path: env.NEURO_PATH || "/v1/mss/derive", price_usdc_per_call: SUBSTRATE_PRICES_USDC.npu,
               provider: "nwo-neuro mss derivation" }
    },
    // ── v0.7.0 sections ──
    grounding: {
      encoder_configured: !!env.ENCODER_URL,
      encoder_url: env.ENCODER_URL || null,
      encoder_model: "sentence-transformers/all-MiniLM-L6-v2",
      encoder_dim: 384,
      encoder_timeout_ms: parseInt(env.ENCODER_TIMEOUT_MS || "8000", 10),
      note: "every /query receipt carries top-3 semantic-nearest priors when configured",
    },
    priors: {
      endpoints: ["GET /priors/list", "POST /priors/query", "POST /ground"],
      corpus_sources: ["wikipedia", "arxiv", "ecosystem_hf_space", "researchgate", "fetch", "agent_md"],
      ingester: "chainstate-priors (Render cron, nightly 03:00 UTC)",
    },
    reflect: {
      endpoint: "POST /agi/reflect",
      max_followups: parseInt(env.REFLECT_MAX_FOLLOWUPS || "3", 10),
      mode: "deterministic-signal-mining",
      signals: ["adjacent_symbols", "verdict_resolution", "cross_subspace_bridge", "semantic_neighbor"],
    },
    fetch: {
      endpoint: "POST /fetch",
      allowlist_endpoint: "GET /fetch/allowlist",
      allowlist_size: allowList.length,
      max_bytes: parseInt(env.FETCH_MAX_BYTES || "500000", 10),
      timeout_ms: parseInt(env.FETCH_TIMEOUT_MS || "15000", 10),
      note: "AGI reads the world through this — guarded by allow-list + bytes cap + timeout",
    },
    // ── v0.7.1 sections ──
    identity: {
      self_audit_endpoint: "POST or GET /audit/self",
      current_endpoint: "GET /identity/current",
      refresh_endpoint: "POST /identity/refresh (requires AUDIT_ADMIN_TOKEN)",
      kv_bound: !!env.IDENTITY,
      note: "self-referential fingerprint: worker_version + contracts + endpoints + allowlist_hash + deontic_ruleset_hash"
    },
    // v0.7.3.1 · anchor observability block (additive) ─────────────
    anchor: await (async () => {
      const cfg = getAnchorConfig(env);
      const tel = await readAnchorTelemetry(env);
      return {
        enabled: cfg.enabled,
        service_url: cfg.url,
        service_url_source_var: cfg.source_var,
        timeout_ms: cfg.timeoutMs,
        token_configured: !!cfg.token,
        receipt_path: cfg.receipt_path,
        refusal_path: cfg.refusal_path,
        anchor_contract: "0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
        cardiac_extensions_contract: "0x5438854ead35dc6c873414f222725732f862dabe",
        chain_id: 8453,
        basescan: "https://basescan.org/address/0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
        telemetry: tel,
        diagnostic: !cfg.enabled
          ? (cfg.url ? "ANCHOR_QUEUE_TOKEN not set OR ANCHOR_ENABLED=false" : "ANCHOR_URL / ANCHOR_SERVICE_URL not set")
          : (tel.last_status === 401 ? "microservice returned 401 — token mismatch"
             : tel.last_status === 404 ? "microservice returned 404 — endpoint path mismatch"
             : tel.last_status === 422 ? "microservice returned 422 — payload shape mismatch"
             : tel.last_error ? ("last error: " + tel.last_error)
             : "ok"),
        streams_anchored: ["anchorReceipt (all accepted queries)", "anchorRefusal (REFUSED with Deontic violation)"],
        dedicated_endpoint: "GET /anchor/status — pings microservice + full telemetry"
      };
    })(),
    seed_cron: {
      enabled: env.SEED_CRON_ENABLED === "true",
      cron: "0 * * * *",
      seeds_configured: seedCount,
      max_followups_per_seed: parseInt(env.REFLECT_MAX_FOLLOWUPS || "3", 10),
      run_log_kv_prefix: "seed:run:",
      run_log_retention_days: 7,
      note: "hourly primer for reflective loop; disable by setting SEED_CRON_ENABLED=false"
    },
    archival: {
      postgres_configured: !!(env.POSTGRES_HTTP_URL && env.POSTGRES_HTTP_TOKEN),
      postgres_url: env.POSTGRES_HTTP_URL || null,
      schema: env.POSTGRES_SCHEMA || "chainstate",
      backend: "supabase (same project as nwo-robotics; chainstate schema, RLS service_role-only)",
      note: "optional durable receipt archive; disabled unless POSTGRES_HTTP_URL + POSTGRES_HTTP_TOKEN both set"
    },
    payment_routing: {
      chain: "base-mainnet-8453",
      splitter: "0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4",
      splitter_verified_on_basescan: true,
      usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      referrer_wallet: env.REFERRER_WALLET || REFERRER_DEFAULT,
      memo_prefix: env.MEMO_PREFIX || "chainstate-worker",
      affiliate_share: "0.15 atomic (routed by MetaStateSplitter)",
      settlement: "substrate-side at call time; no worker private key required"
    },
    world_model: {
      current: "GET /model/current",
      emit:    "POST /model/emit",
      forecast:"POST /model/forecast",
      history: "GET /model/history?hours=N",
      symbolic_regression: "METASTATE /v1/symbolic/regress (EML head)",
      temporal_prior: "TimesFM 2.5 (via METASTATE /v1/anomaly/score)"
    },
    kv_bound: !!(env.CHAINSTATE_NODES && env.CHAINSTATE_CACHE && env.CHAINSTATE_CONSENSUS),
    worker_version: WORKER_VERSION,
    owner: "Ciprian Florin Pater",
    timestamp: new Date().toISOString()
  });
}

async function handleBeacon(req, env) {
  if (req.method === "GET") {
    const peers = await listPeers(env);
    peers.sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
    return j(req, { nodes: peers, count: peers.length });
  }
  if (req.method === "POST") {
    let body;
    try { body = await req.json(); }
    catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }
    if (!body.node_id || !body.endpoint) {
      return j(req, { error: "`node_id` and `endpoint` required" }, { status: 400 });
    }
    const record = {
      node_id: body.node_id,
      capabilities: Array.isArray(body.capabilities) ? body.capabilities : ["embedding", "attention"],
      endpoint: body.endpoint, region: body.region || null,
      classifier: body.classifier || "codepoint-density",
      peer_version: body.peer_version || null, last_ping: new Date().toISOString()
    };
    if (env.CHAINSTATE_NODES) {
      await env.CHAINSTATE_NODES.put(record.node_id, JSON.stringify(record), { expirationTtl: 300 });
      if (env.CHAINSTATE_CACHE) {
        const existing = await env.CHAINSTATE_CACHE.get(REPUTATION_KEY(record.node_id));
        if (existing === null) await setReputation(env, record.node_id, 0.5);
      }
      return j(req, { ok: true, record, reputation: await getReputation(env, record.node_id) });
    }
    return j(req, { ok: false, note: "CHAINSTATE_NODES KV binding not configured — record not persisted", record });
  }
  return j(req, { error: "method not allowed" }, { status: 405 });
}

async function handleSymbols(req) {
  const url = new URL(req.url);
  const sub = (url.searchParams.get("sub") || "math").toLowerCase();
  const key = { science: "sci", language: "lang", occult: "occ", emoji: "emo", control: "ctrl" }[sub] || sub;
  if (!SUBSPACE_SAMPLES[key]) return j(req, { error: "unknown subspace", valid: Object.keys(SUBSPACE_SAMPLES) }, { status: 400 });
  return j(req, { subspace: key, samples: SUBSPACE_SAMPLES[key] });
}

async function handleConsensus(req, env) {
  if (!env.CHAINSTATE_CONSENSUS) return j(req, { latest: null, kv_bound: false });
  const v = await env.CHAINSTATE_CONSENSUS.get("latest");
  return j(req, { latest: v ? JSON.parse(v) : null });
}

// ─── /model/* (unchanged from v0.7.0) ──────────────────────────────────

async function handleModelCurrent(req, env) {
  if (!env.CHAINSTATE_CACHE) return j(req, { expression: null, status: "no_kv", note: "CHAINSTATE_CACHE binding not configured" });
  const stored = await env.CHAINSTATE_CACHE.get("eml:current");
  if (!stored) return j(req, { expression: null, status: "not_emitted", note: "no world model yet — POST /model/emit to generate one from recent history", owner: "Ciprian Florin Pater" });
  return j(req, JSON.parse(stored));
}

async function handleModelEmit(req, env, ctx) {
  if (!env.CHAINSTATE_CACHE) return j(req, { error: "CHAINSTATE_CACHE not bound" }, { status: 500 });
  if (!env.METASTATE_ENDPOINT) return j(req, { error: "METASTATE_ENDPOINT not configured" }, { status: 400 });
  let body = {};
  try { body = await req.json(); } catch (e) { body = {}; }
  const hoursBack = Math.min(24, Math.max(1, parseInt(body.hours_back || 6, 10)));
  const feature = ["confidence", "gas", "rounds"].includes(body.feature) ? body.feature : "confidence";
  const history = await loadRecentHistory(env, hoursBack);
  if (history.length < 8) return j(req, { status: "insufficient_history", samples: history.length, required: 8 });
  const series = history.map((h) => {
    if (feature === "confidence") return h.conf;
    if (feature === "gas")        return h.gas;
    if (feature === "rounds")     return h.rounds;
    return h.conf;
  }).filter((v) => typeof v === "number" && !isNaN(v));
  const maxDepth = Math.min(6, Math.max(2, parseInt(body.max_depth || 4, 10)));
  const regress = await callSymbolicRegress(env, series, maxDepth);
  if (regress.error) return j(req, { status: "regression_failed", error: regress.error, samples: series.length });
  const model = {
    expression: regress.expression, feature, hours_back: hoursBack, samples: series.length,
    depth: regress.depth, residual: regress.residual,
    complexity_penalty: regress.complexity_penalty, decipherable: regress.decipherable,
    generated_at: new Date().toISOString(), metastate_elapsed_ms: regress.elapsed_ms,
    substrate: "metastate /v1/symbolic/regress (EML + TimesFM 2.5 prior)",
    referrer: env.REFERRER_WALLET || REFERRER_DEFAULT, cost_usdc: 0.0005,
    owner: "Ciprian Florin Pater"
  };
  await env.CHAINSTATE_CACHE.put("eml:current", JSON.stringify(model), { expirationTtl: 21600 });
  return j(req, { status: "emitted", ...model });
}

async function handleModelForecast(req, env) {
  let body;
  try { body = await req.json(); }
  catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }
  if (!Array.isArray(body.series)) return j(req, { error: "`series` (array of numbers) required" }, { status: 400 });
  const series = body.series.map(Number).filter((v) => !isNaN(v));
  if (series.length < 4) return j(req, { error: "series must contain at least 4 numeric values", received: series.length }, { status: 400 });
  const result = await detectPlateau(env, series);
  return j(req, {
    ...result, series_length: series.length,
    substrate: env.METASTATE_ENDPOINT ? "local + metastate timesfm 2.5" : "local only",
    owner: "Ciprian Florin Pater", timestamp: new Date().toISOString()
  });
}

async function handleModelHistory(req, env) {
  const url = new URL(req.url);
  const hoursBack = Math.min(24, Math.max(1, parseInt(url.searchParams.get("hours") || "6", 10)));
  const history = await loadRecentHistory(env, hoursBack);
  const summary = { samples: history.length, hours_back: hoursBack, verdicts: {}, dominants: {}, mean_confidence: 0, mean_gas: 0, mean_rounds: 0 };
  if (history.length > 0) {
    for (const h of history) {
      summary.verdicts[h.verdict] = (summary.verdicts[h.verdict] || 0) + 1;
      summary.dominants[h.dominant] = (summary.dominants[h.dominant] || 0) + 1;
      summary.mean_confidence += h.conf || 0;
      summary.mean_gas += h.gas || 0;
      summary.mean_rounds += h.rounds || 0;
    }
    summary.mean_confidence = +(summary.mean_confidence / history.length).toFixed(3);
    summary.mean_gas = +(summary.mean_gas / history.length).toFixed(6);
    summary.mean_rounds = +(summary.mean_rounds / history.length).toFixed(2);
  }
  return j(req, {
    summary, recent_fingerprints: history.slice(-50),
    owner: "Ciprian Florin Pater", timestamp: new Date().toISOString()
  });
}

// ─── Welcome page (v0.7.1 updated) ─────────────────────────────────────

function welcomePage(req, env, bindings) {
  const kvOk = !!(env.CHAINSTATE_NODES && env.CHAINSTATE_CACHE && env.CHAINSTATE_CONSENSUS);
  const kvBadge = kvOk
    ? '<span style="background:#0c3a1c;color:#7df0a8;padding:2px 8px;border-radius:99px;font-size:.7em">KV BOUND</span>'
    : '<span style="background:#3a2c0c;color:#f0e07d;padding:2px 8px;border-radius:99px;font-size:.7em">NO KV YET</span>';
  const identityBadge = env.IDENTITY
    ? '<span style="background:#0c3a1c;color:#7df0a8;padding:2px 8px;border-radius:99px;font-size:.7em">IDENTITY BOUND</span>'
    : '<span style="background:#3a2c0c;color:#f0e07d;padding:2px 8px;border-radius:99px;font-size:.7em">IDENTITY UNBOUND</span>';
  const seedCronBadge = env.SEED_CRON_ENABLED === "true"
    ? '<span style="background:#0c3a1c;color:#7df0a8;padding:2px 8px;border-radius:99px;font-size:.7em">SEED CRON ON</span>'
    : '<span style="background:#3a2c0c;color:#f0e07d;padding:2px 8px;border-radius:99px;font-size:.7em">SEED CRON OFF</span>';
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>CHAINSTATE worker · v0.7.1 · live</title>
<style>
  body{margin:0;padding:48px 22px;background:#000;color:#fff;font-family:ui-monospace,Menlo,Consolas,monospace;line-height:1.55}
  .wrap{max-width:820px;margin:0 auto}
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
  .ep .m.n{color:#f0a87d}
  a{color:#7df0a8;text-decoration:underline;text-underline-offset:2px}
  .foot{margin-top:36px;color:#5a5a64;font-size:.78em}
  .badges{display:flex;gap:6px;flex-wrap:wrap}
</style>
</head><body><div class="wrap">
  <h1>CHAIN<span style="color:#9c9ca6;font-weight:400">STATE</span> worker</h1>
  <div class="sub">symbolic-weight blockchain · v0.7.1 · identity + audit + hourly seed cron · ${(new Date()).toISOString()}</div>
  <div class="row"><span class="k">Status</span><span class="v badges">running ${kvBadge} ${identityBadge} ${seedCronBadge}</span></div>
  <div class="row"><span class="k">Version</span><span class="v"><code>${WORKER_VERSION}</code></span></div>
  <div class="row"><span class="k">Network</span><span class="v">chainstate · base mainnet 8453</span></div>
  <div class="row"><span class="k">Owner</span><span class="v">Ciprian Florin Pater</span></div>
  <div class="row"><span class="k">Encoder</span><span class="v">${env.ENCODER_URL || "not configured (grounding disabled)"}</span></div>
  <div class="row"><span class="k">Fetch allow-list</span><span class="v">${getFetchAllow(env).length} domain patterns</span></div>
  <div class="row"><span class="k">Supabase archive</span><span class="v">${(env.POSTGRES_HTTP_URL && env.POSTGRES_HTTP_TOKEN) ? env.POSTGRES_HTTP_URL + " → schema " + (env.POSTGRES_SCHEMA || "chainstate") : "not configured (optional)"}</span></div>
  <div class="row"><span class="k">Ornith adapter</span><span class="v">${env.ORNITH_ADAPTER || "not configured"}</span></div>
  <div class="row"><span class="k">METASTATE</span><span class="v">${env.METASTATE_ENDPOINT || "not configured"}</span></div>
  <div class="row"><span class="k">NEURO</span><span class="v">${env.NEURO_ENDPOINT || "not configured"}</span></div>
  <div class="row"><span class="k">KV NODES</span><span class="v">${bindings.nodes}</span></div>
  <div class="row"><span class="k">KV CACHE</span><span class="v">${bindings.cache}</span></div>
  <div class="row"><span class="k">KV CONSENSUS</span><span class="v">${bindings.consensus}</span></div>
  <div class="row"><span class="k">KV IDENTITY</span><span class="v">${bindings.identity}</span></div>
  <div class="ep">
    <h2>Endpoints · Core</h2>
    <ul>
      <li><span class="m">GET</span> <code>/status</code></li>
      <li><span class="m p">POST</span> <code>/query</code>  — receipt includes v0.7.0 <code>grounding</code> block</li>
      <li><span class="m">GET</span> <code>/beacon</code>  ·  <span class="m p">POST</span> <code>/beacon</code></li>
      <li><span class="m">GET</span> <code>/consensus</code></li>
      <li><span class="m">GET</span> <code>/symbols?sub=math</code></li>
    </ul>
    <h2>Endpoints · World model (v0.6.0)</h2>
    <ul>
      <li><span class="m">GET</span> <code>/model/current</code></li>
      <li><span class="m p">POST</span> <code>/model/emit</code></li>
      <li><span class="m p">POST</span> <code>/model/forecast</code></li>
      <li><span class="m">GET</span> <code>/model/history?hours=N</code></li>
    </ul>
    <h2>Endpoints · Grounding &amp; reflection (v0.7.0)</h2>
    <ul>
      <li><span class="m p">POST</span> <code>/ground</code> — embed text via MiniLM encoder → 384-dim vector</li>
      <li><span class="m p">POST</span> <code>/priors/query</code> — semantic k-NN over stored priors</li>
      <li><span class="m">GET</span> <code>/priors/list</code> — priors corpus breakdown by source</li>
      <li><span class="m p">POST</span> <code>/agi/reflect</code> — reflective cognition loop (auto-generates + dispatches follow-up queries)</li>
      <li><span class="m p">POST</span> <code>/fetch</code> — allow-listed URL fetch → symbol dist + embed + optional store as prior</li>
      <li><span class="m">GET</span> <code>/fetch/allowlist</code></li>
    </ul>
    <h2>Endpoints · Identity &amp; self-audit (v0.7.1)</h2>
    <ul>
      <li><span class="m n">NEW</span> <span class="m p">POST</span> <code>/audit/self</code> — compute live identity, compare to KV reference, report drift</li>
      <li><span class="m n">NEW</span> <span class="m">GET</span> <code>/identity/current</code> — return pinned reference identity</li>
      <li><span class="m n">NEW</span> <span class="m p">POST</span> <code>/identity/refresh</code> — admin re-pin reference (requires bearer AUDIT_ADMIN_TOKEN)</li>
    </ul>
    <h2>Autonomous cognition (v0.7.1)</h2>
    <ul>
      <li><span class="m n">NEW</span> hourly cron dispatches SEED_QUERIES → prime reflective loop → primary route to autonomous self-directed inquiry (cron <code>0 * * * *</code>)</li>
    </ul>
    <h2>Endpoints · Ecosystem integration (v0.7.2)</h2>
    <ul>
      <li><span class="m n">NEW</span> <span class="m">GET</span> <code>/ecosystem</code> — machine-readable capability registry: genetic, mixed-reality, agentic, metastate, neuro, asm, imperium-romanum</li>
      <li><span class="m n">NEW</span> Deontic category <code>genomic_integrity</code> — hard veto on human-germline / transhumanist / anti-natural-evolution DEPLOYMENT (analysis permitted)</li>
      <li><span class="m n">NEW</span> Senses: NWO Mixed Reality (mesh, splat, panorama, 4DGS, simulation) reachable via FETCH allow-list</li>
    </ul>
  </div>
  <div class="foot">
    Frontend: <a href="https://cpater-chainstate.static.hf.space">cpater-chainstate.static.hf.space</a>
    · CODE: <a href="https://cpater-ornith-chainstate.static.hf.space">cpater-ornith-chainstate.static.hf.space</a>
    · Agentic: <a href="https://cpater-nwo-agentic.static.hf.space/index.html">cpater-nwo-agentic.static.hf.space</a>
    <br>
    Ecosystem: <a href="https://cpater-nwo-genetic.static.hf.space">genetic</a>
    · <a href="https://cpater-nwo-mixed-reality.static.hf.space">mixed-reality</a>
    · <a href="https://publicae.org">imperium-romanum</a>
    · self-model at <code>/ecosystem</code>
    <br>
    Encoder: <a href="${env.ENCODER_URL || 'https://chainstate-encoder.onrender.com'}">chainstate-encoder</a>
    · Priors ingester: <a href="https://chainstate-priors.onrender.com">chainstate-priors</a>
    <br>
    GitHub: <a href="https://github.com/RedCiprianPater/chainstate">RedCiprianPater/chainstate</a>
    ${kvOk ? "" : "<br>· Worker is running without KV bindings — add CHAINSTATE_NODES, CHAINSTATE_CACHE, CHAINSTATE_CONSENSUS in Settings → Variables and Secrets → KV namespace bindings."}
    ${env.IDENTITY ? "" : "<br>· IDENTITY KV binding not configured — /audit/self will still work but drift detection uses ephemeral in-memory reference until KV is bound."}
  </div>
</div></body></html>`;
  return new Response(html, {
    status: 200,
    headers: Object.assign(
      { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      corsHeaders(req)
    )
  });
}

// ─── Main handler ──────────────────────────────────────────────────────

export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }
    const url = new URL(req.url);
    const ip = req.headers.get("CF-Connecting-IP") ||
               req.headers.get("X-Forwarded-For") || "unknown";
    const skipRate = url.pathname === "/" ||
                     url.pathname === "/status" ||
                     url.pathname === "/symbols" ||
                     url.pathname === "/model/current" ||
                     url.pathname === "/model/history" ||
                     url.pathname === "/priors/list" ||
                     url.pathname === "/fetch/allowlist" ||
                     url.pathname === "/audit/self" ||
                     url.pathname === "/identity/current" ||
                     url.pathname === "/identity/verify" ||
                     url.pathname === "/anchor/status" ||
                     url.pathname === "/ecosystem" ||
                     (url.pathname === "/beacon" && req.method === "GET");
    if (!skipRate) {
      const ok = await rateLimit(env, ip, parseInt(env.RATE_LIMIT || "60", 10));
      if (!ok) return j(req, { error: "rate limited" }, { status: 429 });
    }
    try {
      if (url.pathname === "/") {
        const bindings = {
          nodes: env.CHAINSTATE_NODES ? "bound ✓" : "not bound (optional)",
          cache: env.CHAINSTATE_CACHE ? "bound ✓" : "not bound (optional)",
          consensus: env.CHAINSTATE_CONSENSUS ? "bound ✓" : "not bound (optional)",
          identity: env.IDENTITY ? "bound ✓" : "not bound (v0.7.1 · adds drift detection)"
        };
        return welcomePage(req, env, bindings);
      }
      if (url.pathname === "/status")                                        return handleStatus(req, env);
      if (url.pathname === "/anchor/status" && req.method === "GET")         return handleAnchorStatus(req, env);
      if (url.pathname === "/symbols" && req.method === "GET")               return handleSymbols(req);
      if (url.pathname === "/query" && req.method === "POST")                return handleQuery(req, env, ctx);
      if (url.pathname === "/beacon")                                        return handleBeacon(req, env);
      if (url.pathname === "/consensus" && req.method === "GET")             return handleConsensus(req, env);
      if (url.pathname === "/model/current" && req.method === "GET")         return handleModelCurrent(req, env);
      if (url.pathname === "/model/emit" && req.method === "POST")           return handleModelEmit(req, env, ctx);
      if (url.pathname === "/model/forecast" && req.method === "POST")       return handleModelForecast(req, env);
      if (url.pathname === "/model/history" && req.method === "GET")         return handleModelHistory(req, env);
      // ── v0.7.0 endpoints ──
      if (url.pathname === "/ground" && req.method === "POST")               return handleGround(req, env);
      if (url.pathname === "/priors/query" && req.method === "POST")         return handlePriorsQuery(req, env);
      if (url.pathname === "/priors/list" && req.method === "GET")           return handlePriorsList(req, env);
      if (url.pathname === "/agi/reflect" && req.method === "POST")          return handleAgiReflect(req, env, ctx);
      if (url.pathname === "/fetch" && req.method === "POST")                return handleFetch(req, env, ctx);
      if (url.pathname === "/fetch/allowlist" && req.method === "GET")       return handleFetchAllowlist(req, env);
      // ── v0.7.1 endpoints ──
      if (url.pathname === "/audit/self")                                    return handleAuditSelf(req, env);
      if (url.pathname === "/identity/current" && req.method === "GET")      return handleIdentityCurrent(req, env);
      if (url.pathname === "/identity/refresh" && req.method === "POST")     return handleIdentityRefresh(req, env);
      // ── v0.7.2 endpoints ──
      if (url.pathname === "/ecosystem" && req.method === "GET")             return handleEcosystem(req, env);
      // ── v0.7.3 endpoints ──
      if (url.pathname === "/identity/verify" && req.method === "GET")       return handleIdentityVerify(req, env);
      return j(req, { error: "not found", path: url.pathname }, { status: 404 });
    } catch (e) {
      return j(req, {
        error: String((e && e.message) || e).slice(0, 300),
        stack: (e && e.stack) ? String(e.stack).slice(0, 300) : null
      }, { status: 500 });
    }
  },

  // v0.7.1 · scheduled() handler — fires on cron triggers from wrangler.toml
  async scheduled(event, env, ctx) {
    const cron = event.cron;
    // Hourly seed cron
    if (cron === "0 * * * *") {
      ctx.waitUntil(runSeedCron(env, ctx));
    }
    // Add other cron branches here as needed (e.g., nightly priors ingest)
  }
};
