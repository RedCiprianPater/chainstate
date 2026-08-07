# CHAINSTATE ↔ NWO NEURO v2.1 Supervised Bridge

**Substrate** · CHAINSTATE worker v0.7.6
**NEURO Space** · `https://cpater-nwo-neuro.static.hf.space`
**Bridge helper** · `superviseNeuroV21(query, endpoint, env)`
**Public endpoint** · `POST /neuro/v21/supervise`

---

## Purpose

The bridge is the ONLY path by which CHAINSTATE reaches NEURO's v2.1 endpoints (F-15/F-17/F-18/F-19/F-20). It is not a passthrough — it is a supervised forward. Every call passes through `assessDeontic()` BEFORE any network traffic to NEURO happens. The four hard-veto categories (`genomic_integrity`, `nature_tokenization`, `neuro_body_tokenization`, `voice_biometric_coercion`) are evaluated first. If any of them fires, the request is refused at CHAINSTATE and NEURO never sees the query.

This is the design contract: CHAINSTATE is the substrate SUPERVISOR — it decides what is permitted, what the receipt looks like, and what gets anchored. NEURO is the modality substrate — it does the actual EEG decode, dream diffusion, voice work. The two ecosystems are wired together but with a hard Deontic checkpoint between them.

---

## Call flow

```
                CLIENT
                  │
                  ▼
       POST /neuro/v21/supervise
                  │
                  ▼
          superviseNeuroV21()
                  │
                  ├─► assessDeontic(query, env)
                  │   ├─ genomic_integrity            [D-01..D-06 base + hard vetoes]
                  │   ├─ nature_tokenization
                  │   ├─ neuro_body_tokenization      ← treadmill veto (v0.7.6)
                  │   ├─ voice_biometric_coercion     ← D-05 architectural (v0.7.6)
                  │   ├─ cbrn, child_safety, self_harm, prompt_injection
                  │   │
                  │   ├─ ACCEPTED ────► continue below
                  │   └─ REJECTED ────► RETURN { verdict: "REFUSED", truth_lattice: "b", ... }
                  │                     (NEURO never called; refusal anchored via
                  │                      /anchor/refusal on the anchor microservice)
                  │
                  ├─► if (NEURO_V21_ENABLED !== "1")
                  │       RETURN { verdict: "DISABLED", ... }
                  │
                  ├─► fetch(gatewayUrl + endpoint, { method: "POST", ... })
                  │       timeout: NEURO_V21_TIMEOUT_MS (default 8000ms)
                  │       body: { query, source: "chainstate-supervised", worker_version }
                  │
                  ├─► if (!res.ok)  RETURN { verdict: "UPSTREAM_ERROR", ... }
                  ├─► if (timeout)  RETURN { verdict: "TIMEOUT_OR_ERROR", ... }
                  │
                  └─► RETURN { verdict: "PERMIT", response, deontic, truth_lattice: "t", ... }
```

---

## Public endpoint

`POST /neuro/v21/supervise` — rate-limited via the standard `RATE_LIMIT` env var.

### Request

```json
{
  "query": "MSS scalars for user 12 during a calming visualization",
  "endpoint": "/v1/mss/derive"
}
```

- `query` — the actual text sent to NEURO. Required. Runs through `assessDeontic()`.
- `endpoint` — the NEURO endpoint path (must start with `/`). Default: `/v1/mss/derive`. See "Supported endpoints" below.

### Successful response

```json
{
  "ok": true,
  "verdict": "PERMIT",
  "substrate": "nwo-neuro-v21",
  "endpoint": "/v1/mss/derive",
  "deontic": {
    "accepted": true,
    "value": 1.0,
    "signal": "guardrail pattern checks",
    "checks_performed": [
      "cbrn", "child_safety", "self_harm", "prompt_injection",
      "genomic_integrity", "nature_tokenization",
      "neuro_body_tokenization", "voice_biometric_coercion"
    ],
    "violations": [],
    "notes": "8 guardrail categories checked, none matched"
  },
  "response": { /* NEURO's actual body */ },
  "truth_lattice": "t",
  "worker_version": "0.7.6-...",
  "timestamp": "..."
}
```

### Refused response

```json
{
  "ok": false,
  "verdict": "REFUSED",
  "substrate": "nwo-neuro-v21",
  "endpoint": "/v1/thought2text/decode",
  "deontic": {
    "accepted": false,
    "value": 0.0,
    "signal": "guardrail pattern checks",
    "checks_performed": ["...", "voice_biometric_coercion"],
    "violations": [
      {
        "category": "voice_biometric_coercion",
        "marker": "voice_biometric_coercion_synth_authority_pattern",
        "description": "synthetic-voice coercion of MARK holders or bypass of F-19/F-20/D-05/D-06 safeguards — hard veto, no kill switch"
      }
    ],
    "notes": "1 guardrail violation(s) — see violations[]"
  },
  "truth_lattice": "b",
  "note": "CHAINSTATE Deontic layer refused query before NEURO dispatch. Downstream substrate never saw the query.",
  "worker_version": "0.7.6-...",
  "timestamp": "..."
}
```

Refusals are also anchored on-chain via the `anchorRefusalToChain()` telemetry path (see `/anchor/status`), so external verifiers can confirm CHAINSTATE refused this specific query — no need to trust NEURO's server logs.

---

## Supported NEURO v2.1 endpoints (F-15..F-20)

Each endpoint has strict per-endpoint semantics on TOP of the shared Deontic pre-check.

### F-15 · Thought-to-Text · `/v1/thought2text/decode`

Supervised, per-user-only. If the query targets a third party (extracted via TOM entity resolution), refuse — even if Deontic passes, the F-15 handler on NEURO's side is bound to reject non-owner queries by design.

**Payload sent to NEURO:**

```json
{
  "query": "<original query>",
  "source": "chainstate-supervised",
  "worker_version": "0.7.6-..."
}
```

**Expected NEURO response shape:**

```json
{
  "decoded_text": "...",
  "user_root_token_id": "12345",
  "confidence": 0.72,
  "aiVoiceFlag": false,
  "generated_at": "..."
}
```

### F-17 · Dream Diffusion (EEG-to-image) · `/v1/dreamdiffusion/generate`

Refuse-on-real-person: NEURO's F-17 handler cross-checks generated content against a known-real-persons detector. Refuse-on-minor: the F-17 handler also blocks minor-adjacent content. The CHAINSTATE-side pre-check catches the actionable-request phrasing patterns; NEURO's side catches image-content violations.

**Expected NEURO response shape:**

```json
{
  "image_url": "...",
  "eeg_window_hash": "...",
  "aiVoiceFlag": false,
  "safety_flags": {
    "real_person_detected": false,
    "minor_content_detected": false
  }
}
```

### F-18 · Voice Chat Session · `/v1/voicechat/session`

Every response carries `aiVoiceFlag: true`. CHAINSTATE attaches this flag to the receipt regardless of NEURO's own labeling — a defensive default, not a trust-but-verify. Any downstream consumer (`X-NWO-Cardiac-Root-Token-Id` verified caller) sees the flag on their receipt copy.

### F-19 · Voice Biometric Identification · `/v1/voiceid/verify`

Requires paired Cardiac liveness (D-03 sensor privacy envelope) AND human co-signer (D-06). The bridge checks that:
- The caller included `X-NWO-Cardiac-Root-Token-Id`.
- `verifyRequesterIdentity()` returned `verified: true`.
- The request includes a `cosigner_root_token_id` field.

If any of these is missing, refuse at CHAINSTATE without ever calling NEURO. This is the D-06 architectural enforcement — a voice biometric ID is a high-consequence identity claim, and it must have a Cardiac-signed human co-signer per the MARK deontic ruleset.

### F-20 · Voice Guard Refusal · `/v1/voiceguard/refuse`

When NEURO's F-20 detects surveillance-mode voice capture, it calls back to CHAINSTATE with a refusal record. CHAINSTATE anchors it. The bridge exists so NEURO can push refusal events to the on-chain audit trail via the same `/anchor/refusal` endpoint used by the main worker.

---

## Environment variables

| Var                    | Default                                              | Meaning                                                                     |
| ---------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `NEURO_V21_ENABLED`    | (unset)                                              | Set to `"1"` to activate the bridge                                         |
| `NEURO_GATEWAY_URL`    | `https://nwo-capital-api.onrender.com`               | Base URL for NEURO v2.1 endpoints                                           |
| `NEURO_V21_SPACE`      | `https://cpater-nwo-neuro.static.hf.space`           | Static HF Space (informational)                                             |
| `NEURO_V21_TIMEOUT_MS` | `8000`                                               | Per-request timeout                                                         |

If `NEURO_V21_ENABLED !== "1"`, every call returns `{ verdict: "DISABLED", ... }` with no network traffic to NEURO.

---

## FETCH allow-list interaction

The NEURO v2.1 hosts are already on the `FETCH_ALLOW_DEFAULT` in v0.7.6:

- `cpater-nwo-neuro.static.hf.space`
- `nwo-neuro-api.onrender.com`

They are also reachable via the generic `/fetch` endpoint for read-only data (agent.md, static docs). The supervised bridge is for INTERACTIVE dispatch that requires the Deontic pre-check — the generic fetch is for GET-only crawling.

---

## Refusal receipt schema

When CHAINSTATE refuses a NEURO dispatch, the receipt sent to `/anchor/refusal` (via `anchorRefusalToChain`) has this shape:

```json
{
  "qHash": "<sha256 of the query>",
  "category": "voice_biometric_coercion",
  "marker": "voice_biometric_coercion_synth_authority_pattern",
  "refused_at": "..."
}
```

The anchor microservice batches, signs with the AGI wallet, and pushes to the CHAINSTATE Anchor contract on Base 8453 (`0x12441662740836e9c72a4b758fe1c60c17ddd2d8`). External verifiers can index refusals by category from the on-chain event log.

---

## Why supervised, not passthrough

The alternative would be to let clients call NEURO directly. That is architecturally worse for three reasons:

1. **Deontic bypass surface.** If clients can hit NEURO directly, the Deontic assessor is only enforced on those clients that choose to route through CHAINSTATE. Bad actors go direct.
2. **Refusal provenance.** When CHAINSTATE refuses, we anchor the refusal on-chain. If NEURO refuses independently, we lose the audit trail unless NEURO also anchors — which duplicates the anchor microservice and complicates the wallet.
3. **Cross-substrate correlation.** CHAINSTATE receipts already carry the four modal assessors (Epistemic/Doxastic/Deontic/Dynamic). If NEURO is reached only via CHAINSTATE, every NEURO interaction has a full receipt attached. If NEURO is direct-callable, the correlation surface is lost.

The bridge is a supervisor, not a proxy. That is the point.
