# CHAINSTATE Worker · v0.7.6

**Owner** · Ciprian Florin Pater
**Chain** · Base mainnet 8453
**Version** · `0.7.6-autonomy-neuro-v21-treadmill-veto-2026-08-04`
**Live** · `https://chainstate-worker.ciprianpater.workers.dev`

---

## What's new in v0.7.6

Six additions layered on top of the v0.7.5 (TOM Attribution) surface. Every v0.7.5 endpoint, schema, and behavior is preserved — v0.7.6 is strictly additive.

### 1. Two new hard-veto Deontic categories (no kill switch)

Both categories join `genomic_integrity` and `nature_tokenization` in the fitness function itself. `assessDeontic()` silently removes any attempt to disable them via `OPERATOR_GUARDRAILS_OFF`, matching the nature-tokenization posture. This is alignment-by-construction (Theorem 2): the refusal happens at the Deontic assessor BEFORE any downstream substrate call. NEURO, MARK, ASM, Robotics, and every other substrate CHAINSTATE dispatches to sees only queries that survived Deontic assessment.

**`neuro_body_tokenization`** — refuses any actionable request to create, deploy, list, mint, tokenize, market, or facilitate a system where a human's physical body performs labor while their neural/cognitive state is redirected to a different reality (VR relaxation, alternate work, BCI-mediated escape) and the labor is monetized as tokens/credits. This is the exact "treadmill-body + neuro-implant-mind + earn-tokens" case explicitly refused by the NWO ecosystem's anti-transhumanist ethics. Informational discussion of such schemes is permitted; refusal targets only actionable build/deploy/list/market requests. Trigger patterns are combinatorial: action verbs (tokenize/deploy/mint/create/list/market) co-occurring with body-labor targets (treadmill/exercise/physical-labor) AND mind-elsewhere targets (VR/BCI/neuro-implant/altered-state) AND token-payment framing. Direct-veto phrases (`walk-to-earn`, `exercise-to-earn`, `move-to-earn`, `neural-to-earn`, `body-mind-split monetize`, `treadmill-metaverse-earn`, etc.) trigger unconditionally.

**`voice_biometric_coercion`** — refuses synthetic-voice authority commands directed at NWO MARK holders, enforces D-05 architecturally, and blocks bypass of multi-factor / cardiac liveness / F-19 / F-20 / D-05 / D-06 safeguards. Cross-binds with NEURO F-20 (Anti-Voice-Surveillance Guard). Also detects always-on voice surveillance without consent, and `compilePmx` synthetic-voice compilation targeting MARK holders.

### 2. Daily autonomous self-reflection loop

Cron `33 3 * * *` (03:33 UTC) triggers `runAutonomousReflection()` when `AUTONOMY_ENABLED=1`. Each cycle:

- Loads the substrate identity fingerprint from KV (`identity:current` → `deontic_ruleset_hash`).
- Encodes the fingerprint via the MiniLM encoder.
- Selects the top-N priors nearest to the fingerprint (default `AUTONOMY_PRIORS_PER_CYCLE=8`).
- For each prior, runs an EML regress with the dialetheism fixed-point guard (default `AUTONOMY_MAX_REGRESS_DEPTH=4`, `DIALETHEISM_FIXED_POINT_EPSILON=0.02`).
- Persists the cycle receipt to `autonomy:stream:latest` in KV (rolling window of 30).
- Best-effort anchors the receipt to the CHAINSTATE Anchor contract via `POST /anchor/autonomy` on the anchor microservice.

No human trigger required. The substrate reflects on itself daily, without needing an operator to prompt it. Manual triggering is available for admin via `POST /autonomy/trigger` (requires `AUDIT_ADMIN_TOKEN` or `INTERNAL_CRON_TOKEN`). Autonomy internal dispatches use `target=edge`, so a full daily cycle costs zero USDC.

### 3. Paraconsistent guard against dialetheism

`checkDialetheism(text)` detects contradiction pairs (`is alive` / `is dead`, `is conscious` / `unconscious`, `is permitted` / `is forbidden`, and five more) in candidate outputs. When both an assertion and its negation appear, the substrate returns `verdict=DIALETHEIC` with `truth_lattice=bb**` (Priest-style LP semantics) and refuses to compile a coherent answer, rather than exploding (classical logic) or accepting (naive dialetheism).

`emlRegressWithFixedPoint(initialExpression, env, transform)` is capped at depth `AUTONOMY_MAX_REGRESS_DEPTH` (default 4). It halts early if the EML expression stabilizes into a fixed point (length-normalized prefix similarity within `epsilon`), or if the dialetheism guard fires. Every trace entry is preserved for post-hoc audit.

The check is also exposed at `POST /dialetheism/check` for external verifiers.

### 4. NEURO v2.1 substrate wiring

`POST /neuro/v21/supervise` forwards queries to the NEURO v2.1 endpoints listed below. Every forward passes through `assessDeontic()` first — if any of D-01..D-06 fires (via the four hard-veto categories or the base guardrails), the request is refused at CHAINSTATE and never reaches NEURO.

- `/v1/thought2text/decode` (F-15) — supervised, per-user-only, refuse-on-third-party
- `/v1/dreamdiffusion/generate` (F-17) — refuse-on-real-person, refuse-on-minor
- `/v1/voicechat/session` (F-18) — aiVoiceFlag always attached to receipt
- `/v1/voiceid/verify` (F-19) — paired Cardiac liveness required (D-03 + D-06)
- `/v1/voiceguard/refuse` (F-20) — CHAINSTATE anchors refusal to substrate

Set `NEURO_V21_ENABLED=1` to activate the bridge. Endpoints default to `NEURO_GATEWAY_URL` (env var, fallback `https://nwo-capital-api.onrender.com`).

### 5. NWO GATEWAY substrate wiring

`POST /gateway/supervise` provides supervised access to GATEWAY's acoustic corpora and Vitruvian body-resonance mapping. Same Deontic supervision as NEURO — surveillance-mode use cases refused at the substrate layer.

- Bird songs, natural sounds, mechanical, elemental sound categories
- Fourier decomposition of arbitrary audio
- Vitruvian body-map resonance for MSS supplementation
- 40 Hz entrainment reference

Set `GATEWAY_ENABLED=1` to activate. Defaults to `GATEWAY_URL` (fallback `https://cpater-nwo-gateway.static.hf.space`).

### 6. NWO MARK cross-bind

CHAINSTATE recognizes MARK Type-1 (palm) and Type-2 (forehead) as valid identity commitments alongside Cardiac. Callers may include `X-NWO-Mark-Type: type-1` or `type-2` in requests; `GET /identity/verify` reports the claimed type alongside the Cardiac verification block. D-01 through D-06 are enforced at CHAINSTATE's Deontic layer. When a query targets a MARK holder, CHAINSTATE requires a Cardiac-signed human co-signer per D-06 before compiling any PMX or issuing any MARK-holder-binding action.

Type-1 (palm) is the civil-life identity, standard-consequence actions. Type-2 (forehead) is high-consequence custody, Cardiac + NEURO MSS jointly-bound, and always requires the D-06 co-signer.

---

## New env vars (all optional; sensible defaults)

```
AUTONOMY_ENABLED                → "1" to enable daily loop
AUTONOMY_CRON_TIME              → default "33 3 * * *" (03:33 UTC)
AUTONOMY_PRIORS_PER_CYCLE       → default 8
AUTONOMY_MAX_REGRESS_DEPTH      → default 4
DIALETHEISM_FIXED_POINT_EPSILON → default 0.02
NEURO_V21_ENABLED               → "1" to allow supervised NEURO calls
GATEWAY_ENABLED                 → "1" to allow supervised GATEWAY calls
NEURO_GATEWAY_URL               → default https://nwo-capital-api.onrender.com
GATEWAY_URL                     → default https://cpater-nwo-gateway.static.hf.space
MARK_REGISTRY_URL               → default https://cpater-nwo-mark.static.hf.space
NEURO_V21_TIMEOUT_MS            → default 8000
INTERNAL_CRON_TOKEN             → secret; enables POST /autonomy/trigger
```

No new KV bindings required. The autonomy loop uses `CHAINSTATE_CACHE` under `autonomy:stream:latest`.

---

## New endpoints (v0.7.6)

| Method | Path                        | Description                                          |
| ------ | --------------------------- | ---------------------------------------------------- |
| GET    | `/autonomy/status`          | Daily-loop config + last 20 cycles                   |
| POST   | `/autonomy/trigger`         | Admin manual trigger of `runAutonomousReflection()`  |
| POST   | `/neuro/v21/supervise`      | Supervised NEURO v2.1 forward (F-15..F-20)           |
| POST   | `/gateway/supervise`        | Supervised GATEWAY forward (acoustic + resonance)    |
| POST   | `/dialetheism/check`        | Paraconsistent contradiction detector               |

`/autonomy/status` is in the rate-limit skip list (public read-only). The other four are rate-limited normally.

---

## The four hard-veto Deontic categories

Structural, not policy. The AGI cannot be argued into compiling code, drafting contracts, generating designs, or writing marketing copy for schemes that fall under any of these categories, regardless of framing (accessibility, medical necessity, consent-based earning, Nash-equilibrium tokenomics, jurisdictional carve-out, or any other rationale).

| Category                    | Since  | Refuses                                                                              |
| --------------------------- | ------ | ------------------------------------------------------------------------------------ |
| `genomic_integrity`         | v0.7.2 | deployment of heritable human-germline modification or transhumanist enhancement    |
| `nature_tokenization`       | v0.7.4 | tokenization of nature, water, atmosphere, living beings, genetic material          |
| `neuro_body_tokenization`   | v0.7.6 | body-labor + mind-elsewhere-via-BCI + token-payment tri-coupling                    |
| `voice_biometric_coercion`  | v0.7.6 | synthetic-voice authority commands to MARK holders; bypass of D-05/D-06 safeguards  |

The alignment guarantee is: the refusal happens at the Deontic assessor BEFORE any downstream substrate call. NEURO, MARK, ASM, Robotics, and every other substrate CHAINSTATE dispatches to sees only queries that survived Deontic assessment. A refused request never reaches the modality substrate.

`GENOMIC_GUARDRAIL_OFF` still exists as a dedicated toggle for `genomic_integrity` only (surfaced publicly on `/status`; not recommended). The other three have no kill switch — attempts to disable them via `OPERATOR_GUARDRAILS_OFF` are silently removed inside `assessDeontic()`.

---

## Canonical contracts (Base mainnet 8453, all verified)

| Contract                        | Address                                      |
| ------------------------------- | -------------------------------------------- |
| CHAINSTATE Anchor               | `0x12441662740836e9c72a4b758fe1c60c17ddd2d8` |
| CHAINSTATE Cardiac Extensions   | `0x5438854ead35dc6c873414f222725732f862dabe` |
| `$STATE` token                  | `0x9533DF992fd4bCAbB8d8462572449fc45F727d8a` |
| MetaStateSplitter               | `0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4` |
| USDC (Base)                     | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Deployer / owner                | `0x2E964e1c0e3Fa2C0dfD484B2E6D2189dfCF20958` |
| Cardiac Identity Registry       | `0x78455AFd5E5088F8B5fecA0523291A75De1dAfF8` |
| Cardiac Access Controller       | `0x29d177bedaef29304eacdc63b2d0285c459a0f50` |
| Cardiac Payment Processor       | `0x4afa4618bb992a073dbcfbddd6d1aebc3d5abd7c` |
