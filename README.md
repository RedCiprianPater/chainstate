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

**Symbolic-weight blockchain.** Transactions ARE cognitive queries. Weights are universal symbols. Consensus emerges from reputation-weighted Bayesian log-pooling over a distributed language-model swarm.

**Live**: [cpater-chainstate.static.hf.space](https://cpater-chainstate.static.hf.space) · **Chain**: Base mainnet 8453 · **GitHub**: [RedCiprianPater/chainstate](https://github.com/RedCiprianPater/chainstate)

CHAINSTATE is a layer-6 service in the NWO Capital stack, composed with:

- **[NWO-ASM](https://cpater-nwo-asm.static.hf.space)** — Process-Matrix IR for substrate-agnostic dispatch (GPU, photonic, neuromorphic, IBM/Origin quantum)
- **[NWO NEURO](https://cpater-nwo-neuro.static.hf.space)** — live Mental State Signature (MSS) conditioning of cognitive transactions
- **[METASTATE](https://cpater-metastate.static.hf.space)** — substrate-of-substrates index, Φ-anchored discovery beacon

The frontend in this repo is a single-file static HTML site (`index.html`). The chain edge is a single-file Cloudflare Worker (`workers/edge-worker.js`). Both ship via one GitHub Actions workflow.

---

## What's inside

| File | What it does |
|---|---|
| `index.html` | The frontend. SPA with hero canvas, CHAINSTATE SCAN, terminal, symbolic register, 16 feature pages, architecture circle, instructions, roadmap, API mission control, R&D, deploy guide, affiliates. |
| `workers/edge-worker.js` | Single-file Cloudflare Worker. Routes `/query`, `/beacon`, `/consensus`, `/status`, `/symbols`. KV-backed result cache (5 min), per-IP rate limit (60/min). |
| `wrangler.toml` | Worker config. Three KV namespace bindings + env vars. |
| `.github/workflows/deploy.yml` | One workflow: pushes Worker via `cloudflare/wrangler-action@v3` and the Space via `huggingface_hub`. |
| `src/symbolic/embedding.py` | `UniversalSemioticEmbedding` + `SymbolicCrossAttention` + `SymbolicComposition` (PyTorch). |
| `src/consensus/protocol.py` | `ReputationSystem` + `LogPoolingConsensus` + `CognitiveTransaction` + `SwarmNode`. |
| `requirements.txt` | Python deps for swarm-node operators (torch, fastapi, qiskit, web3, redis, qdrant, transformers, etc.). |
| `package.json` | `wrangler` dev dependency + deploy scripts. |
| `SECRETS.md` | Step-by-step on how to fetch `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `HF_TOKEN`. |
| `agent.md` | Operational manual for AI agents and assistants embedded on the Space. |

The HF Space upload step ignores `workers/`, `wrangler.toml`, `package.json`, `src/`, `contracts/` — only the static frontend assets land on the Space.

---

## Quickstart

```bash
# 1. Clone
git clone https://github.com/RedCiprianPater/chainstate.git
cd chainstate

# 2. Add the three secrets to GitHub
#    Settings → Secrets and variables → Actions → New repository secret
#      CF_API_TOKEN     (from https://dash.cloudflare.com/profile/api-tokens)
#      CF_ACCOUNT_ID    (from CF dashboard right sidebar)
#      HF_TOKEN         (from https://huggingface.co/settings/tokens, fine-grained, scoped to CPater/chainstate Space)
#    Full step-by-step in SECRETS.md

# 3. Create CF KV namespaces (one time)
npx wrangler kv:namespace create CHAINSTATE_NODES
npx wrangler kv:namespace create CHAINSTATE_CACHE
npx wrangler kv:namespace create CHAINSTATE_CONSENSUS
# paste the printed IDs into wrangler.toml

# 4. First push deploys everything
git add . && git commit -m "first deploy" && git push origin main
```

After the workflow finishes:

- **Worker URL** appears in the Actions log (`https://chainstate-worker.<your-cf-subdomain>.workers.dev`)
- **HF Space** updates at `https://huggingface.co/spaces/CPater/chainstate`

Verify both:

```bash
curl https://chainstate-worker.<your-cf>.workers.dev/status

curl -X POST https://chainstate-worker.<your-cf>.workers.dev/query \
  -H 'Content-Type: application/json' \
  -d '{"query": "∫∂x → ?", "swarmSize": 20, "consensusDepth": 3}'
```

Then on the deployed Space, open browser DevTools console and run:

```js
window.__CHAINSTATE_WORKER = "https://chainstate-worker.<your-cf>.workers.dev"
```

The Query, Terminal, and SCAN pages will now hit the live Worker. **Refresh-persistent variant**: bake the URL into the Space by adding `<script>window.__CHAINSTATE_WORKER="…"</script>` near the top of `index.html` (already done in this repo for `chainstate-worker.ciprianpater.workers.dev`).

---

## Architecture · 10 layers

```
L0  WALLET           ← EVM wallet on Base mainnet 8453
L1  EDGE WORKER      ← single-file Cloudflare Worker
L2  USE              ← Universal Semiotic Embedding (65,536d × 6 subspaces)
L3  SAM              ← Symbolic Attention Mechanism (64 heads × 1,024d)
L4  SWARM            ← geo-distributed inference nodes (reputation-weighted)
L5  CONSENSUS        ← Bayesian log-pooling, 0.95 cosine threshold
L6  BLOCK PRODUCTION ← VRF proposer, 2s blocks, 64 tx/block
L7  SCAN             ← block explorer
L8  NWO-ASM          ← Process-Matrix IR for substrate dispatch
L9  NWO NEURO        ← live MSS conditioning of queries

Everything wrapped by: CRYSTALS-Dilithium + Kyber-1024 + SHA3-256
```

---

## Six subspaces · 65,536 dimensions

| subspace | glyph | dims  | range            | role                                                  |
|----------|-------|------:|------------------|-------------------------------------------------------|
| Math     | ∫     | 4,096 | 0 – 4,095        | operators, set theory, logic                          |
| Science  | ⚛     | 8,192 | 4,096 – 12,287   | letterlike, units, chemistry, biology, physics, astro |
| Language | 文    | 16,384| 12,288 – 28,671  | Greek, Cyrillic, CJK, Arabic, Hebrew, Devanagari, Korean |
| Occult   | ☉     | 4,096 | 28,672 – 32,767  | astrological, alchemical, religious, esoteric         |
| Emoji    | 🧠    | 16,384| 32,768 – 49,151  | full Unicode 15.1 emoji set                           |
| Control  | ⇒     | 16,384| 49,152 – 65,535  | arrows, APL, flow-control                             |

Cross-subspace interaction mask:

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

## Pricing · USDC on Base

| endpoint                              | price                |
|---------------------------------------|----------------------|
| `/v1/query` (20 nodes, 3 rounds)      | $0.00190             |
| `/v1/query` cache hit                  | $0.00012             |
| `/v1/asm-compile`                     | $0.00040             |
| `/v1/asm-dispatch` (GPU, /sec)        | $0.00250             |
| `/v1/asm-dispatch` (quantum, /shot)   | $0.04000             |
| `/v1/neuro-bind` (MSS query)          | $0.00220             |
| `/v1/stake`                           | $0.00010 + gas       |
| `/v1/mint` (ERC-1155 listing)         | $0.00500             |
| `/beacon`, `/status`, `/symbols`      | free                 |

Splitter on every paid call: **35% founder · 35% agent · 15% ops · 15% referrer** (when ref is set on wallet). Contract: `0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4` on Base.

---

## R&D · papers

- **CHAINSTATE Whitepaper v1.0** — *A Symbolic-Weight Blockchain for Cognitive Transactions: Reputation-Weighted Bayesian Consensus over Distributed Language-Model Swarms with Post-Quantum Security and NWO-ASM / NEURO Composition.* 19-page A4 paper, 9 numbered equations, 7 figures, 4 tables, 20 references. Live at [ResearchGate publication 407444375](https://www.researchgate.net/publication/407444375_CHAINSTATE_WHITEPAPER_A_Symbolic-Weight_Blockchain_for_Cognitive_Transactions) and mirrored on the Space at `whitepaper.pdf`.
- **Foundational paper**: *Distributed Cognitive Work in Edge-Resident Language-Model Networks* — 14-page A4 preprint, 22 equations, 5 figures. The thermodynamic and information-theoretic framework that motivates CHAINSTATE; cited as reference [5] in the whitepaper above. Live at [ResearchGate publication 406896310](https://www.researchgate.net/publication/406896310_Distributed_Cognitive_Work_in_Edge-Resident_Language-Model_Networks) and mirrored on the Space at `NWOWorkfield.pdf`.
- **Audio companion**: `podcast.m4a` on the Space — author commentary on the CHAINSTATE Whitepaper only (the foundational paper has no audio companion). The R&D page on the Space wires the player up automatically.

---

## License

MIT.
