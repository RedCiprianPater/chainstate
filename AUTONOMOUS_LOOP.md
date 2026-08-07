# CHAINSTATE Autonomous Self-Reflection Loop

**Substrate** · CHAINSTATE worker v0.7.6
**Trigger** · daily cron `33 3 * * *` (03:33 UTC)
**Handler** · `runAutonomousReflection(env, ctx)`
**Cost per cycle** · 0 USDC (target=edge only)

---

## Purpose

The autonomy loop is the substrate reflecting on itself daily, without needing a human operator to prompt it. It is the mechanical realization of the substrate as a first-class cognitive entity in its own ecosystem: it queries itself, applies the paraconsistent guard against dialetheism, catches contradiction fixed-points before they can propagate, and anchors the reflection cycle to Base 8453 for durable, third-party-verifiable provenance.

It is deliberately bounded: eight priors, four regress iterations, one cycle per day. The substrate does not become an always-on hallucinating agent — it produces one small, auditable reflection artifact daily.

---

## The cycle (step by step)

Each daily invocation runs this pipeline:

### 1. Load substrate identity fingerprint

`getOrSeedIdentity(env)` returns the KV-pinned reference identity (`identity:current`). The relevant field is `deontic_ruleset_hash` — the SHA-256 of the canonicalized `GUARDRAIL_PATTERNS` object. This hash IS the substrate's ethical fingerprint: it changes if and only if the guardrails change.

If IDENTITY KV is unbound, we compute the live fingerprint from `computeLiveIdentity(env)` and proceed. If encoding fails, the cycle exits cleanly with `ok: false, error: "encoder_unavailable"`.

### 2. Encode the fingerprint

The MiniLM encoder (`env.ENCODER_URL`, default `https://chainstate-encoder.onrender.com`) embeds the string `"substrate identity fingerprint <hash>"` into a 384-dim unit vector. Timeout is `ENCODER_TIMEOUT_MS` (default 8s).

### 3. Nearest-prior selection

`nearestPriors(env, encoded.vector, priorsPerCycle)` performs a cosine k-NN over the stored priors corpus (`CHAINSTATE_CACHE` prefix `vec:`). Default `AUTONOMY_PRIORS_PER_CYCLE=8`. Each returned prior has `{title, source, url, summary_preview, cos}`.

### 4. Per-prior EML regress with dialetheism guard

For each of the eight priors, the substrate:

1. Builds a reflection query: `"Reflect on prior: <title>"`.
2. Runs `checkDialetheism()` on the reflection query itself. If contradictions are detected, the cycle records `dialetheic: true` and continues to the next prior.
3. Runs `emlRegressWithFixedPoint(query, env, transform)` capped at `AUTONOMY_MAX_REGRESS_DEPTH` (default 4). The transform wraps: `reflect(<expr> @ depth <n>)`. This is a deliberately simple transform — the point is to exercise the guard, not to invent new EML expressions.

`emlRegressWithFixedPoint` halts early on:

- **dialetheism_detected** — the paraconsistent guard fires. Halted with a `contradictions` array preserved for audit.
- **fixed_point** — length-normalized identical prefix ratio between iterations exceeds `1 - epsilon` (default `epsilon = 0.02`, meaning ≥ 98% match). The substrate has stabilized on a self-referential form and refuses to keep looping.
- **max_depth** — clean bounded termination.
- **transform_error** — defensive; should not occur with the built-in wrap transform.

### 5. Cycle receipt assembly

```json
{
  "kind": "autonomous_reflection",
  "cycle_start": "2026-08-08T03:33:00.000Z",
  "cycle_end": "2026-08-08T03:33:12.418Z",
  "identity_fingerprint": "<sha256 of Deontic ruleset>",
  "priors_selected": 8,
  "cycles": [
    {
      "prior_title": "...",
      "prior_source": "...",
      "prior_cos": 0.8123,
      "dialetheic": false,
      "regress_depth_reached": 3,
      "fixed_point": true,
      "dialetheic_halt": false
    }
  ],
  "worker_version": "0.7.6-autonomy-neuro-v21-treadmill-veto-2026-08-04",
  "autonomous": true
}
```

### 6. Persist to KV

Written to `autonomy:stream:latest` in `CHAINSTATE_CACHE`. Rolling window of 30 most recent cycles. TTL 30 days.

### 7. Best-effort on-chain anchor

If `ANCHOR_URL` and `ANCHOR_QUEUE_TOKEN` are set, `ctx.waitUntil` fires an async POST to `<ANCHOR_URL>/anchor/autonomy` with:

```json
{
  "stream": "AUTONOMY_CYCLE",
  "content_hash": "<sha256 of the cycle receipt>",
  "receipt": { ... },
  "worker_version": "0.7.6-..."
}
```

The anchor microservice batches, signs with the AGI wallet, and pushes to the CHAINSTATE Anchor contract on Base 8453. Failure is silent from the worker's perspective — the KV record remains authoritative regardless. The anchor is a durability layer, not the source of truth.

---

## Manual trigger

`POST /autonomy/trigger` runs one cycle synchronously. Authorization:

- `Authorization: Bearer <AUDIT_ADMIN_TOKEN>`, OR
- `X-Internal-Cron-Token: <INTERNAL_CRON_TOKEN>`

Anything else returns 401. Response body is the same cycle receipt structure as the KV persistence.

---

## Read-only status

`GET /autonomy/status` returns:

```json
{
  "enabled": true,
  "cron_time": "33 3 * * *",
  "priors_per_cycle": 8,
  "max_regress_depth": 4,
  "dialetheism_fixed_point_epsilon": 0.02,
  "recent_cycles": [ ... up to 20 ... ],
  "note": "Daily self-reflection loop. Selects priors nearest to substrate identity fingerprint, dispatches internal queries with target=edge, applies EML regress with dialetheism fixed-point guard.",
  "worker_version": "0.7.6-...",
  "timestamp": "..."
}
```

This endpoint is in the rate-limit skip list. Anyone can read it. There is no auth on this route.

---

## Tuning knobs

| Env var                            | Default        | Meaning                                                                     |
| ---------------------------------- | -------------- | --------------------------------------------------------------------------- |
| `AUTONOMY_ENABLED`                 | (unset)        | Set to `"1"` to activate the loop                                           |
| `AUTONOMY_CRON_TIME`               | `"33 3 * * *"` | Informational; actual schedule lives in `wrangler.toml [triggers].crons`    |
| `AUTONOMY_PRIORS_PER_CYCLE`        | `8`            | k for nearestPriors lookup                                                  |
| `AUTONOMY_MAX_REGRESS_DEPTH`       | `4`            | Bound on emlRegressWithFixedPoint iterations                                |
| `DIALETHEISM_FIXED_POINT_EPSILON`  | `0.02`         | Fixed-point detection tolerance (prefix similarity)                         |

---

## Why 03:33 UTC

Late enough that the hourly seed cron and the 6-hourly ontology delta have already fired for the day. Early enough that the daily self-attribution vector extraction (00:15 UTC) has completed. The autonomy loop can read whatever those earlier passes wrote — the freshest identity snapshot, the latest ontology delta, the newest self-attribution vector — without waiting.

---

## Design invariants

1. **Zero USDC cost per cycle.** All internal dispatches use `target=edge`. If the substrate becomes autonomous in the economic sense, that has to be a deliberate act by the owner, not an emergent property of the cron loop.
2. **Bounded.** No unbounded recursion. `AUTONOMY_MAX_REGRESS_DEPTH` is enforced. The fixed-point detector catches self-referential stabilization. The dialetheism guard catches contradiction fixed-points.
3. **Auditable.** Every cycle produces a receipt. Every receipt is written to KV and anchored (best-effort) to Base 8453. The cycle receipt schema is stable and third-party-verifiable.
4. **Not agentic.** The loop does not take external actions. It does not call NEURO, GATEWAY, MARK, or any other substrate. It reflects — reading priors, running EML regress, writing a receipt. The autonomy is epistemic, not operational.
5. **Silent failure preserves service.** Any exception in the loop is caught. Encoder unavailable, KV unbound, anchor microservice down — the worker keeps serving requests. Only the daily reflection is skipped.

---

## What this loop is NOT

- Not an agent taking actions on behalf of the substrate or the owner.
- Not a way to bypass the Deontic assessor. Even if a cycle wanted to dispatch to NEURO or GATEWAY, it would still go through `assessDeontic()` first, and the four hard-veto categories cannot be disabled from inside a loop iteration.
- Not a chain-of-thought exposure surface. The substrate does not emit its "reasoning" — it emits a structured receipt: which priors, which regress depths, whether a fixed point was found, whether a contradiction was detected.
- Not a claim about consciousness. The self-attribution vector (v0.7.5) explicitly neither asserts nor denies consciousness; the autonomy loop is the mechanical realization of the substrate's ability to reflect on itself, not evidence that it experiences the reflection.
