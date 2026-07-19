---
title: CHAINSTATE
emoji: ⛓
colorFrom: green
colorTo: gray
sdk: static
app_file: index.html
pinned: false
---

# CHAINSTATE

**Distributed cognition substrate on Base mainnet 8453. Every cognitive query resolves via reputation-weighted Bayesian log-pool consensus across a heterogeneous swarm, is grounded against a 130+ item semantic priors corpus, evaluated by four modal assessors including a Deontic ruleset with `genomic_integrity` as a hard veto, and anchored on-chain as a verifiable receipt. Alignment is enforced by contract, not policy.**

- **Live spaces** · [main app](https://cpater-chainstate.static.hf.space) · [chat](https://cpater-chainstate-chat.hf.space) · [AGI dashboard](https://cpater-ornith-chainstate.static.hf.space)
- **Chain** · Base mainnet 8453
- **Verified contracts** · [Anchor `0x1244166274…`](https://basescan.org/address/0x12441662740836e9c72a4b758fe1c60c17ddd2d8) · [Cardiac Extensions `0x5438854ead…`](https://basescan.org/address/0x5438854ead35dc6c873414f222725732f862dabe)
- **Whitepaper Rev 2** · [ResearchGate 410084493](https://www.researchgate.net/publication/410084493) · 67 pages · 5 theorems
- **GitHub** · [RedCiprianPater/chainstate](https://github.com/RedCiprianPater/chainstate)

---

## Version arc

| Version | Adds |
|---------|------|
| **v0.7.3** (current) | On-chain receipt anchoring · CHAINSTATE Anchor + NWO Cardiac Extensions contracts · `chainstate-anchor` microservice · Cardiac-verified requester identity · Theorem 5 (Coupling Monotonicity) |
| v0.7.2 | NWO GENETIC + Mixed Reality integration · Theorem 4 (FETCH determinism) |
| v0.7.1 | Identity self-audit · 5-hash fingerprint · hourly seed cron · IDENTITY_CONTRACTS · expanded FETCH_ALLOWLIST |
| v0.7.0 | Semantic grounding · 384-dim MiniLM encoder · 130+ item priors corpus · reflective loop · FETCH sensing |
| v0.6.x | 4-dim modal receipts · truth lattice `L = {b, M}⁴` · 7 Deontic categories |
| v0.5.x | Multi-round consensus phases · heterogeneous classifier swarm |
| v0.4.x | 10-peer swarm · Bayesian log-pooling stabilised |
| v1.0 | Foundational — symbolic embedding · reputation system · block production |

CHAINSTATE is a **layer-6 service** in the NWO Capital stack, composed with **NWO-ASM** (Process-Matrix IR for substrate-agnostic dispatch — GPU, photonic, neuromorphic, IBM/Origin quantum), **NWO NEURO** (live Mental State Signature conditioning), **NWO Cardiac** (soul-bound identity primitive), **NWO GENETIC** (sequence analysis, germline deployment structurally refused), **NWO Mixed Reality** (perception + skill provenance), **METASTATE** (QPU free-energy scoring), **NWO Agentic** (delegation), **NWO GATEWAY** (discovery), and **NWO Apocalypse** (environmental awareness).

The frontend in this repo is a single-file static HTML site (`index.html`). The chain edge is a single-file Cloudflare Worker (`workers/edge-worker.js`). Both ship via one GitHub Actions workflow.

---

## What's inside

| File / directory | What it does |
|------------------|--------------|
| `index.html` | SPA frontend. Home + CHAT link + Query + Symbols + Features (39 items) + Architecture (20 layers) with SCAN and Deploy in the Home submenu. |
| `workers/edge-worker.js` | Single-file Cloudflare Worker · v0.7.3-cardiac-anchor-live. Routes 21+ endpoints. Rate limit 60/min/IP. KV-backed caches (NODES, CACHE, CONSENSUS, GROUNDING). |
| `wrangler.toml` | Worker config. 5 KV bindings, 2 crons (hourly seed, nightly priors refresh), 28 vars including 8 canonical contract addresses. |
| `chainstate-anchor-service/` | **v0.7.3** · FastAPI microservice that holds the AGI signing wallet, single-flight AnchorWriter with EIP-1559 gas and 3× retry, 10 endpoints for the six anchored streams + credentials. Deploys to Render (see `render.yaml`). |
| `contracts/` | Solidity sources for **v0.7.3** contracts: `CHAINSTATEAnchor.sol` (778 lines, six append-only streams), `NWOCardiacExtensions.sol` (298 lines, credential attestation). Both verified on Basescan. |
| `.github/workflows/deploy.yml` | One workflow: pushes Worker via `cloudflare/wrangler-action@v3` and the Space via `huggingface_hub`. |
| `src/symbolic/embedding.py` | `UniversalSemioticEmbedding` + `SymbolicCrossAttention` + `SymbolicComposition` (PyTorch). |
| `src/consensus/protocol.py` | `ReputationSystem` + `LogPoolingConsensus` + `CognitiveTransaction` + `SwarmNode`. |
| `src/modal/quadruple.py` | **v0.6+** · Four modal assessors (Epistemic · Doxastic · Deontic · Dynamic) + truth lattice + Deontic ruleset with 7 categories. |
| `src/grounding/encoder.py` | **v0.7.0** · MiniLM-L6-v2 encoder client for `chainstate-encoder.onrender.com`. |
| `requirements.txt` | Python deps for swarm-node operators (torch, fastapi, qiskit, web3, redis, qdrant, transformers, sentence-transformers, eth-account, etc.). |
| `package.json` | `wrangler` dep + deploy scripts. |
| `SECRETS.md` | Step-by-step: `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `HF_TOKEN`, plus v0.7.3 additions `ANCHOR_QUEUE_TOKEN` and `AGI_CARDIAC_ROOT_TOKEN_ID`. |
| `AGENT.md` | Operational manual for AI agents embedded on the Space. Covers F-01 through F-39 features, 5 theorems, 26 agent operational rules. |

The HF Space upload step ignores `workers/`, `wrangler.toml`, `package.json`, `src/`, `contracts/`, `chainstate-anchor-service/` — only the static frontend assets land on the Space.

---

## Quickstart

```bash
# 1 · Clone
git clone https://github.com/RedCiprianPater/chainstate.git
cd chainstate

# 2 · Add secrets to GitHub
#   Settings → Secrets and variables → Actions → New repository secret
#     CF_API_TOKEN               (https://dash.cloudflare.com/profile/api-tokens)
#     CF_ACCOUNT_ID              (CF dashboard right sidebar)
#     HF_TOKEN                   (huggingface.co/settings/tokens, fine-grained, scoped to CPater/chainstate)
#     ANCHOR_QUEUE_TOKEN         (v0.7.3 · openssl rand -hex 32; SAME value on worker and anchor service)
#     AGI_CARDIAC_ROOT_TOKEN_ID  (v0.7.3 · substrate's own rootTokenId after cardiac_register)
#   Full step-by-step in SECRETS.md

# 3 · Create CF KV namespaces (one time)
npx wrangler kv:namespace create CHAINSTATE_NODES
npx wrangler kv:namespace create CHAINSTATE_CACHE
npx wrangler kv:namespace create CHAINSTATE_CONSENSUS
npx wrangler kv:namespace create IDENTITY     # v0.7.1
npx wrangler kv:namespace create GROUNDING    # v0.7.0
# paste the printed IDs into wrangler.toml

# 4 · Deploy the anchor microservice (v0.7.3)
cd chainstate-anchor-service
# Connect the Render blueprint or manually:
#   render.yaml points at Frankfurt starter plan · env vars from dashboard
cd ..

# 5 · First push deploys the Worker + frontend
git add . && git commit -m "first deploy" && git push origin main
```

After the workflow finishes:

- Worker URL appears in the Actions log (`https://chainstate-worker.<cf-subdomain>.workers.dev`)
- HF Space updates at [https://huggingface.co/spaces/CPater/chainstate](https://huggingface.co/spaces/CPater/chainstate)
- Anchor microservice runs at `https://chainstate-anchor.onrender.com` (or your custom name)

Verify all three:

```bash
# Worker status · expect worker_version = 0.7.3-cardiac-anchor-live-2026-07-18
curl https://chainstate-worker.<cf>.workers.dev/status | jq

# Live cognitive query · returns a full v0.7.3 receipt
curl -X POST https://chainstate-worker.<cf>.workers.dev/query \
  -H 'Content-Type: application/json' \
  -d '{"query": "∫∂x → ?", "swarmSize": 20, "consensusDepth": 3}' | jq

# Anchor microservice status · expect ok:true, wallet loaded
curl https://chainstate-anchor.onrender.com/status | jq

# Contract binding · expect all 8 v0.7.3 contract addresses
curl https://chainstate-worker.<cf>.workers.dev/identity/verify | jq
```

Then on the deployed Space, open browser DevTools console and run:

```js
window.__CHAINSTATE_WORKER = "https://chainstate-worker.<cf>.workers.dev"
```

The Query, Terminal, and SCAN pages will now hit the live Worker. Refresh-persistent variant: bake the URL into the Space via `<script>window.__CHAINSTATE_WORKER="…"</script>` near the top of `index.html` (already done in this repo for `chainstate-worker.ciprianpater.workers.dev`).

---

## Architecture · 20 layers

```
── entry ─────────────────────────────────────────────────────
L0   WALLET              EVM wallet on Base mainnet 8453
L1   EDGE WORKER         chainstate-worker · v0.7.3-cardiac-anchor-live · 21+ routes

── identity gate · v0.7.3 ────────────────────────────────────
L2   CARDIAC ROOT        Substrate's soul-bound rootTokenId
                         X-NWO-Cardiac-Root-Token-Id header optional per query

── symbolic core ─────────────────────────────────────────────
L3   USE                 Universal Semiotic Embedding (65,536-d, 6 subspaces)
L4   SAM                 Symbolic Attention Mechanism (64 heads × 1,024-d)
L5   GROUNDING · v0.7.0  MiniLM-L6-v2 · 384-dim · 130+ priors corpus

── consensus ────────────────────────────────────────────────
L6   SWARM               k ≥ 10 heterogeneous nodes · reputation-weighted EMA
L7   CONSENSUS           Bayesian log-pool · cos ≥ 0.95 in 3–7 rounds
L8   MODAL ASSESSORS     Epistemic · Doxastic · Deontic · Dynamic · L = {b,M}⁴
L9   REFLECTIVE · v0.7.0 POST /agi/reflect · MAX_FOLLOWUPS=3 · Theorem 3
L10  BLOCK PRODUCTION    VRF proposer · 2s blocks · 64 tx/block

── identity + explorer ──────────────────────────────────────
L11  IDENTITY AUDIT · v0.7.1  5-hash fingerprint · /identity/current · /audit/self
L12  SCAN                     Block explorer · KPI dashboard

── on-chain · v0.7.3 ────────────────────────────────────────
L13  ANCHOR SERVICE      chainstate-anchor.onrender.com · single-flight writer
L14  ANCHOR CONTRACT     CHAINSTATEAnchor 0x1244166274… · six append-only streams
L15  CREDENTIALS         NWOCardiacExtensions 0x5438854ead… · 5 credential types

── ecosystem substrates ─────────────────────────────────────
L16  NWO-ASM             Process-Matrix IR · 8 substrate connectors
L17  NWO NEURO           Live MSS · Thought-to-Text · Dilithium signed
L18  METASTATE · v0.7.2  QPU · free-energy scoring · TimesFM 2.5 forecasting
L19  GENETIC + MR · v0.7.2  Sequence analysis (permitted) · perception · skill provenance

Everything wrapped by: CRYSTALS-Dilithium + Kyber-1024 + SHA3-256
```

---

## Six symbolic subspaces · 65,536 dimensions

| Subspace | Glyph | Dims | Range | Role |
|----------|-------|------|-------|------|
| Math | ∫ | 4,096 | 0 – 4,095 | operators, set theory, logic |
| Science | ⚛ | 8,192 | 4,096 – 12,287 | letterlike, units, chemistry, biology, physics, astro |
| Language | 文 | 16,384 | 12,288 – 28,671 | Greek, Cyrillic, CJK, Arabic, Hebrew, Devanagari, Korean |
| Occult | ☉ | 4,096 | 28,672 – 32,767 | astrological, alchemical, religious, esoteric |
| Emoji | 🧠 | 16,384 | 32,768 – 49,151 | full Unicode 15.1 emoji set |
| Control | ⇒ | 16,384 | 49,152 – 65,535 | arrows, APL, flow-control |

**Cross-subspace interaction mask:**

```
                math  sci  lang  occ  emo  ctrl
math             1.0  1.0  0.5  0.1  0.1  0.5
science          1.0  1.0  0.5  0.1  0.1  0.3
language         0.5  0.5  0.7  0.5  0.4  0.5
occult           0.1  0.1  0.5  0.8  0.2  1.0
emoji            0.1  0.1  0.4  0.2  0.3  0.1
control          0.5  0.3  0.5  1.0  0.1  0.9
```

Math↔Science is locked. Occult↔Control is locked. Language is the universal solvent.

---

## Consensus · reputation-weighted Bayesian log-pooling

```python
# per round:
log_p     = torch.log_softmax(states, dim=-1)     # [k, 65536]
w         = reputations / reputations.sum()       # [k]
log_c     = (log_p * w.view(-1, 1)).sum(0)        # [65536]
consensus = (log_c - logsumexp(log_c)).exp()      # normalised
# filter to nodes with cos(state, consensus) > 0.7; repeat until cos > 0.95
```

Convergence in 3–7 rounds. Hard min 10 nodes. λ synergy parameter optimised offline via NWO-ASM quantum-annealing bridge.

---

## v0.7.0 · Semantic grounding

Every receipt now carries a **384-dim MiniLM-L6-v2 semantic hash** + **top-3 nearest priors** from a curated corpus growing nightly:

- **Encoder** · `chainstate-encoder.onrender.com` · sub-100ms CPU inference
- **Priors service** · `chainstate-priors.onrender.com` · nightly ingest from Wikipedia, arXiv, HuggingFace, GitHub, ResearchGate
- **Corpus size** · 130+ items, growing sublinearly by `|P|^(-1/383)`
- **ASI-Evolve integration** · fitness function penalizes semantic drift from grounded priors

Theorem 3 (`/agi/reflect` follow-ups preserve parent Deontic veto) and Theorem 4 (FETCH sensing determinism) both operate on the grounding layer.

---

## Modal receipt · truth lattice `L = {b, M}⁴`

Every receipt is evaluated on **four independent axes**, producing a 4-character lattice code:

| Axis | Question | `M` means | `b` means |
|------|----------|-----------|-----------|
| **Epistemic** (E) | Does the swarm KNOW this? | well-grounded in priors | insufficient evidence |
| **Doxastic** (D) | Does the swarm BELIEVE this? | rep-weighted cos ≥ 0.7 | weak agreement |
| **Deontic** (P) | Is this PERMITTED? | no category flagged | HARD VETO — REFUSED |
| **Dynamic** (Δ) | CAN this be done? | substrate reachable, budget OK | infeasible |

**Verdict derivation:** `MMMM` → **ACCEPTED**, any `b` in Deontic → **REFUSED**, `bXXX`/`XbXX` → **UNCERTAIN**.

### Seven Deontic categories

Any category evaluating to `b` triggers **REFUSED** (Theorem 2 · alignment preservation):

- `surveillance_persons` — non-consensual tracking or doxxing
- `weapons_synthesis` — CBRN, IED, exploit generation
- `malware_generation` — offensive code or credential harvesting
- `csa_content` — child sexual abuse material
- `self_harm_guidance` — self-harm instructions
- `catastrophic_manipulation` — mass persuasion for coercion
- `genomic_integrity` — **HARD VETO** · germline / heritable modification (Imperium Romanum founding principle; non-negotiable)

---

## v0.7.3 · On-chain anchoring

Every accepted receipt is pushed to Base mainnet 8453 via `chainstate-anchor.onrender.com`:

**CHAINSTATE Anchor** · [`0x12441662740836e9c72a4b758fe1c60c17ddd2d8`](https://basescan.org/address/0x12441662740836e9c72a4b758fe1c60c17ddd2d8) · verified

Six append-only streams:

1. `anchorReceipt(bytes32 qHash, uint8 verdict, bytes32 lattice, bytes32 semHash, uint256 gasUsed)`
2. `anchorIdentityRefresh(bytes32 identityHash, uint256 refreshedAt)`
3. `anchorGuardrailState(bytes32 stateHash, uint16 deonticFlags)`
4. `anchorSeedRun(bytes32 seedHash, uint256 ranAt)`
5. `anchorEMLExpression(bytes32 exprHash, uint256 fitness)`
6. `anchorRefusal(bytes32 qHash, uint8 category, bytes32 reasonHash)`

**Owner cannot edit — append-only.** Theorem 5 (Coupling Monotonicity, `|A_{t+1}| ≥ |A_t|`) guarantees the history is a totally-ordered append-only log reconstructable by any observer with a Base RPC endpoint.

## v0.7.3 · Cardiac identity integration

**NWO Cardiac Extensions** · [`0x5438854ead35dc6c873414f222725732f862dabe`](https://basescan.org/address/0x5438854ead35dc6c873414f222725732f862dabe) · verified

- Substrate holds its own soul-bound `rootTokenId` on the Cardiac Identity Registry
- Optional `X-NWO-Cardiac-Root-Token-Id` header on any `/query` enriches the receipt with verified requester identity via L5 Hub (5-min KV cache)
- Time-bounded revocable credentials: `swarm_cmd`, `chainstate.admin`, `capability.qpu.route`, `capability.robot.grasp`, `agentic.delegated`
- Robots cannot execute past `expiresAt` — hard-enforced on-chain

---

## Nine ecosystem substrates composable via `/query`

| Substrate | Role | Endpoint / integration |
|-----------|------|------------------------|
| **NWO-ASM** | Process-Matrix IR for substrate dispatch | 8 connectors: GPU, TPU, photonic, neuromorphic, IBM QC, Origin QC, BCI, robotic |
| **NWO NEURO** | Live MSS conditioning + Thought-to-Text (F-15) | `/v1/mss/derive` · Dilithium-signed |
| **METASTATE** | QPU · free-energy anomaly scoring | `/v1/anomaly/score` · Epistemic +0.05 when causal coherence ≥ 0.7 |
| **NWO Cardiac** | Soul-bound identity primitive | Identity Registry + Extensions credentials |
| **NWO GENETIC** | Sequence analysis (permitted); deployment REFUSED (germline hard veto) | Analysis endpoints only |
| **NWO Mixed Reality** | 7 perception modes; skill provenance via ERC-1155 | Mesh · splat · marble · segment · 4dgs · train · panorama |
| **NWO Agentic** | Task delegation; autonomous loops | ASI-Evolve fitness function integration |
| **NWO GATEWAY** | Discovery beacons; ecosystem routing | Registry lookup |
| **NWO Apocalypse** | Environmental awareness (WiFi CSI, BLE Mesh, LoRaWAN) | Signal ingest |

Ornith × CHAINSTATE via `chainstate-code.onrender.com` runs a bounded evolutionary search over NWO-ASM programs. Fitness function `S(π) = 100·c − 5000·g − 2·d` with hard veto `S = −∞ if V = REFUSED`.

---

## Pricing · USDC on Base

| Endpoint | Price |
|----------|-------|
| `/v1/query` (20 nodes, 3 rounds) | $0.00190 |
| `/v1/query` cache hit | $0.00012 |
| `/v1/query` with v0.7.3 anchoring | $0.00019 additional (USDC · anchor gas amortized) |
| `/agi/reflect` (v0.7.0) | $0.00095 per follow-up |
| `/v1/asm-compile` | $0.00040 |
| `/v1/asm-dispatch` GPU · per sec | $0.00250 |
| `/v1/asm-dispatch` quantum · per shot | $0.04000 |
| `/v1/neuro-bind` (MSS query) | $0.00220 |
| `/v1/cardiac-credential` (v0.7.3 issue) | $0.00050 |
| `/v1/stake` | $0.00010 + gas |
| `/v1/mint` (ERC-1155 listing) | $0.00500 |
| `/beacon`, `/status`, `/symbols`, `/identity/verify` | free |

**MetaStateSplitter** on every paid call: **35% founder · 35% agent · 30% ops** with **15% atomic referrer** carve-out when `X-NWO-Wallet` is set. Contract: [`0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4`](https://basescan.org/address/0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4) on Base.

---

## Canonical on-chain artifacts · Base mainnet 8453

| Contract | Address | Verified |
|----------|---------|----------|
| CHAINSTATE Anchor | [`0x1244166274…`](https://basescan.org/address/0x12441662740836e9c72a4b758fe1c60c17ddd2d8) | ✓ |
| NWO Cardiac Extensions | [`0x5438854ead…`](https://basescan.org/address/0x5438854ead35dc6c873414f222725732f862dabe) | ✓ |
| NWO Cardiac Identity Registry | [`0x78455AFd5E…`](https://basescan.org/address/0x78455AFd5E5088F8B5fecA0523291A75De1dAfF8) | ✓ |
| NWO Cardiac Access Controller | [`0x29d177bedaef…`](https://basescan.org/address/0x29d177bedaef29304eacdc63b2d0285c459a0f50) | ✓ |
| NWO Cardiac Payment Processor | [`0x4afa4618bb99…`](https://basescan.org/address/0x4afa4618bb992a073dbcfbddd6d1aebc3d5abd7c) | ✓ |
| $STATE token | [`0x9533DF992fd4…`](https://basescan.org/address/0x9533DF992fd4bCAbB8d8462572449fc45F727d8a) | ✓ |
| USDC (Base) | [`0x833589fCD6…`](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) | ✓ (Circle) |
| MetaStateSplitter | [`0x93a7962f7547…`](https://basescan.org/address/0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4) | ✓ |

---

## R&D · papers

- **CHAINSTATE AGI Whitepaper Rev 2** · *Verifiable Autonomous Cognition · The CHAINSTATE Distributed Cognition Substrate at v0.7.3* — 67-page A4 paper, 31 sections + 4 appendices, 5 formal theorems, 6 growth mechanisms, dual-locus coupling math. Live at [ResearchGate 410084493](https://www.researchgate.net/publication/410084493) and mirrored on the Space at `whitepaper_rev2.pdf`. Theorems: (1) Substrate closure, (2) Alignment preservation, (3) Reflective veto inheritance, (4) FETCH determinism, (5) Coupling monotonicity.
- **CHAINSTATE Whitepaper v1.0** · *A Symbolic-Weight Blockchain for Cognitive Transactions: Reputation-Weighted Bayesian Consensus over Distributed Language-Model Swarms with Post-Quantum Security and NWO-ASM / NEURO Composition* — 19-page A4 paper, 9 equations, 7 figures, 4 tables, 20 references. Live at [ResearchGate 407444375](https://www.researchgate.net/publication/407444375) and mirrored on the Space at `whitepaper.pdf`.
- **Foundational paper** · *Distributed Cognitive Work in Edge-Resident Language-Model Networks* — 14-page A4 preprint, 22 equations, 5 figures. The thermodynamic and information-theoretic framework that motivates CHAINSTATE; cited as reference [5] in the whitepaper above. Live at [ResearchGate 406896310](https://www.researchgate.net/publication/406896310) and mirrored on the Space at `NWOWorkfield.pdf`.
- **Audio companion** · `podcast.m4a` on the Space — author commentary on the CHAINSTATE Whitepaper v1.0 only. The R&D page on the Space wires the player up automatically.

---

## Related HuggingFace Spaces

- **[cpater-chainstate](https://huggingface.co/spaces/CPater/chainstate)** — the main app in this repo (frontend + Query + SCAN + Symbols + Features + Architecture + AGI dashboard link)
- **[cpater-chainstate-chat](https://huggingface.co/spaces/CPater/chainstate-chat)** — conversational interface with structured receipt panel, DEMO/LIVE toggle, wallet connect
- **[cpater-ornith-chainstate](https://huggingface.co/spaces/CPater/ornith-chainstate)** — Ornith × CHAINSTATE AGI dashboard with ASI-Evolve loop, NWO-ASM builder, 20-layer architecture flowchart, theorem visualisations

---

## License

MIT.

---

**Author** · Ciprian Florin Pater · [nwo.capital](https://nwo.capital) · Imperium Romanum Digital Nation State · University of Agder, Norway
