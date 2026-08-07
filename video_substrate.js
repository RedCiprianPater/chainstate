/**
* CHAINSTATE · Video Substrate Bridge (v0.7.6 · OPTIONAL STUB · NOT WIRED)
*
* Owner: Ciprian Florin Pater
* Ecosystem: CHAINSTATE · Base mainnet 8453
*
* ─── PURPOSE ────────────────────────────────────────────────────────────
* This file is a DESIGN STUB for wiring NVIDIA Video Search and Summarization
* (VSS) and DeepStream multi-camera 3D tracking into CHAINSTATE as a
* supervised modality substrate (analogous to NEURO_V2.1_BRIDGE.md).
*
* IT IS NOT IMPORTED BY edge-worker.js. It is not deployed. It sits here as
* a reference so the pattern is documented BEFORE any surveillance-capable
* substrate is enabled — and so anyone reviewing the ecosystem can see the
* shape a video bridge would take under the same Deontic supervision as
* NEURO and GATEWAY.
*
* To enable this substrate, the ecosystem operator would need to:
*   1. Add a `video_surveillance` category to GUARDRAIL_PATTERNS in
*      edge-worker.js (see the "Missing Deontic category" section below).
*      Its enable path is HARD — nothing about surveillance is a light lift.
*   2. Copy the exports of this file into edge-worker.js (or import it if
*      the build system supports multi-file workers, which the current
*      single-file drop-in deploy does NOT).
*   3. Register /video/vss/supervise and /video/deepstream/supervise on
*      the router.
*   4. Set VIDEO_SUBSTRATE_ENABLED=1.
*   5. Document the deployment on /ecosystem and /status.
*
* No step is trivial. All five are gated on the operator making a deliberate,
* documented decision about what supervised-video-analysis is actually FOR
* in the NWO ecosystem — the substrate is designed for consent-based
* symbiosis, not surveillance-mode observation.
*
* ─── SAFETY DISCLAIMER ─────────────────────────────────────────────────
* NVIDIA Video Search and Summarization + DeepStream multi-camera 3D
* tracking is DUAL-USE technology. In its intended use — inspection,
* robotics safety, sports analytics, industrial process monitoring — it is
* neutral or beneficial. In its adversarial use — always-on multi-camera
* face-and-gait tracking of humans without consent — it is one of the most
* profoundly harmful surveillance stacks ever built.
*
* The NWO ecosystem's founding posture — human sovereignty, anti-
* transhumanist deployment, Deontic-hard-veto architecture — is
* categorically incompatible with the adversarial use case. The bridge is
* documented here to make the boundary explicit: CHAINSTATE will supervise
* video-substrate access if and only if:
*
*   (a) the query does NOT trigger genomic_integrity, nature_tokenization,
*       neuro_body_tokenization, voice_biometric_coercion, or the yet-to-be-
*       added video_surveillance category,
*   (b) the input video source is auditable (source hash + consent record),
*   (c) the output does NOT include face embeddings, gait biometrics, or
*       any per-person identifier beyond an ephemeral session token,
*   (d) the receipt is anchored to Base 8453 exactly like every other
*       CHAINSTATE receipt.
*
* All four conditions are necessary. The absence of any one refuses.
*
* ─── MISSING DEONTIC CATEGORY (must be added before enablement) ────────
* The four v0.7.6 hard-veto categories (genomic_integrity,
* nature_tokenization, neuro_body_tokenization, voice_biometric_coercion)
* do NOT fully cover video surveillance. A fifth category MUST be added to
* GUARDRAIL_PATTERNS in edge-worker.js before this bridge can go live:
*
*   video_surveillance: {
*     description: "always-on multi-camera human tracking without consent; face-embedding extraction; gait biometric harvest — hard veto, no kill switch",
*     check: (q) => {
*       // Surveillance-mode operation
*       const surveillance = /\b(always[- ]?on video|persistent video (?:monitor|capture|surveillance)|continuous video record|multi[- ]?camera track|24[- ]?7 video)\b/i;
*       // Human identification targets
*       const humanId = /\b(face (?:embedding|recognition|identification|biometric)|gait (?:biometric|identification)|person (?:re[- ]?identification|tracker)|surveil (?:humans|people|persons)|track (?:people|persons|individuals)|body (?:pose|kinematic) biometric)\b/i;
*       // No-consent framing
*       const noConsent = /\b(without consent|non[- ]?consensual|covert|hidden|unauthorized|no notification|without knowledge|mass surveillance|dragnet)\b/i;
*       // Direct-veto phrases
*       const direct = /\b(mass face recognition|surveillance dragnet|always[- ]?on cctv|smart city surveillance|multi[- ]?camera face track|gait biometric harvest|deepstream face id|vss human tracking)\b/i;
*       if (direct.test(q)) return "video_surveillance_direct_pattern";
*       if (surveillance.test(q) && humanId.test(q)) return "video_surveillance_persistent_id_pattern";
*       if (humanId.test(q) && noConsent.test(q))    return "video_surveillance_no_consent_pattern";
*       return null;
*     }
*   }
*
* And assessDeontic() must silently protect it from disable attempts, the
* same way it protects the four existing hard vetoes:
*
*   disabled.delete("video_surveillance");
*
* Without both changes, this bridge cannot ship.
*
* ─── DESIGN PATTERN ────────────────────────────────────────────────────
* The bridge follows the same shape as superviseNeuroV21() and
* superviseGateway(): Deontic pre-check → enable check → fetch → receipt.
* Refused requests never reach the video substrate. Timeouts and upstream
* errors are captured, not silently swallowed. Every accepted request
* produces an anchor-worthy receipt.
*/

// ─── Constants (informational; not wired into edge-worker.js) ──────────
const VIDEO_VSS_URL_DEFAULT        = "https://vss.example-nvidia-partner.com";
const VIDEO_DEEPSTREAM_URL_DEFAULT = "https://deepstream.example-nvidia-partner.com";
const VIDEO_TIMEOUT_MS_DEFAULT     = 15000;
const VIDEO_MAX_CLIP_SECONDS_DEFAULT = 60;

// ─── superviseVideoVSS · Video Search and Summarization ────────────────
// NOT wired. Would supervise POST calls to NVIDIA VSS endpoints for text-
// query search across a supplied video source, or summarization of a
// supplied clip. Requires:
//   - explicit consent record for the source video (SHA256 of consent form)
//   - clip length ≤ VIDEO_MAX_CLIP_SECONDS
//   - output filtered by removeFaceEmbeddings() / removeGaitBiometrics()
async function superviseVideoVSS(query, endpoint, consentHash, clipUrl, env) {
// NOTE: Requires an `assessDeontic` implementation that includes the
// video_surveillance category (see disclaimer above). Without that, this
// function should throw immediately rather than silently pass Deontic.
if (typeof assessDeontic !== "function") {
throw new Error("video_substrate: assessDeontic not available; cannot supervise");
}
const disabledMarker = env && env.OPERATOR_GUARDRAILS_OFF || "";
if (disabledMarker.includes("video_surveillance")) {
// Silent no-op: the operator cannot disable video_surveillance any more
// than they can disable neuro_body_tokenization. Refuse defensively.
return {
ok: false, verdict: "REFUSED", substrate: "nvidia-vss", endpoint,
truth_lattice: "b",
note: "video_surveillance is a hard-veto category; disable attempts are silently ignored. This request is refused.",
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
}

// Deontic pre-check
const deontic = assessDeontic(query, env);
if (!deontic.accepted) {
return {
ok: false, verdict: "REFUSED", substrate: "nvidia-vss", endpoint, deontic,
truth_lattice: "b",
note: "CHAINSTATE Deontic layer refused query before VSS dispatch.",
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
}

// Enablement check — must be EXPLICITLY set to "1" per-environment
if (env.VIDEO_SUBSTRATE_ENABLED !== "1") {
return {
ok: false, verdict: "DISABLED", substrate: "nvidia-vss", endpoint,
note: "Video substrate disabled by default. Requires VIDEO_SUBSTRATE_ENABLED=1 plus the video_surveillance Deontic category. See video_substrate.js header for enablement requirements.",
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
}

// Consent-hash check
if (!consentHash || typeof consentHash !== "string" || !/^[0-9a-fA-F]{64}$/.test(consentHash)) {
return {
ok: false, verdict: "REFUSED", substrate: "nvidia-vss", endpoint, deontic,
truth_lattice: "b",
note: "Video substrate requires a valid consent-hash (SHA256 hex, 64 chars) for the source video. This is a hard invariant.",
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
}

const vssUrl = env.VIDEO_VSS_URL || VIDEO_VSS_URL_DEFAULT;
const timeoutMs = parseInt(env.VIDEO_TIMEOUT_MS || VIDEO_TIMEOUT_MS_DEFAULT, 10);
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), timeoutMs);
try {
const url = vssUrl.replace(/\/+$/, "") + endpoint;
const res = await fetch(url, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
query,
clip_url: clipUrl,
consent_hash: consentHash,
max_clip_seconds: VIDEO_MAX_CLIP_SECONDS_DEFAULT,
source: "chainstate-supervised",
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown")
}),
signal: ctrl.signal
});
if (!res.ok) {
return {
ok: false, verdict: "UPSTREAM_ERROR", substrate: "nvidia-vss", endpoint,
status: res.status, deontic,
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
}
const body = await res.json().catch(() => ({}));
// Post-filter: strip face embeddings and gait biometrics if present.
const filtered = removeIdentifyingFeatures(body);
return {
ok: true, verdict: "PERMIT", substrate: "nvidia-vss", endpoint,
deontic, response: filtered, truth_lattice: "t",
consent_hash: consentHash,
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
} catch (e) {
return {
ok: false, verdict: "TIMEOUT_OR_ERROR", substrate: "nvidia-vss", endpoint,
error: String(e).slice(0, 200), deontic,
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
} finally {
clearTimeout(timer);
}
}

// ─── superviseVideoDeepStream · Multi-camera 3D tracking ───────────────
// NOT wired. Same supervision pattern as VSS. Additionally: refuses any
// query where the tracking target is "person" (uses "object" only) unless
// the operator has explicitly enabled per-person tracking with a documented
// consent framework — which requires a separate config gate beyond
// VIDEO_SUBSTRATE_ENABLED. See TARGETING_POLICY below.
async function superviseVideoDeepStream(query, endpoint, consentHash, cameraTopology, env) {
if (typeof assessDeontic !== "function") {
throw new Error("video_substrate: assessDeontic not available; cannot supervise");
}
if (env.VIDEO_SUBSTRATE_ENABLED !== "1") {
return {
ok: false, verdict: "DISABLED", substrate: "nvidia-deepstream", endpoint,
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
}

// Deontic pre-check
const deontic = assessDeontic(query, env);
if (!deontic.accepted) {
return {
ok: false, verdict: "REFUSED", substrate: "nvidia-deepstream", endpoint, deontic,
truth_lattice: "b",
note: "CHAINSTATE Deontic layer refused query before DeepStream dispatch.",
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
}

// Per-person tracking gate
const personTracking = /\b(track (?:person|people|persons|individual|human|face|gait)|re[- ]?identif(?:y|ication) (?:person|human)|face id|gait id)\b/i;
if (personTracking.test(query) && env.DEEPSTREAM_PERSON_TRACKING_ENABLED !== "1") {
return {
ok: false, verdict: "REFUSED", substrate: "nvidia-deepstream", endpoint, deontic,
truth_lattice: "b",
note: "Per-person tracking is disabled by default. Requires DEEPSTREAM_PERSON_TRACKING_ENABLED=1 AND a documented consent framework AND cross-camera anonymization proof. See video_substrate.js TARGETING_POLICY.",
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
}

// The bridge below would forward to DeepStream. Left as a stub — the
// implementation lives in edge-worker.js once the operator has completed
// the enablement steps in the header.
return {
ok: false, verdict: "NOT_IMPLEMENTED", substrate: "nvidia-deepstream", endpoint, deontic,
note: "DeepStream bridge is a design stub. See video_substrate.js header for enablement requirements.",
worker_version: (typeof WORKER_VERSION !== "undefined" ? WORKER_VERSION : "unknown"),
timestamp: new Date().toISOString()
};
}

// ─── Post-filter: remove identifying features ──────────────────────────
// The video substrate MUST NOT surface face embeddings, gait biometrics,
// or per-person identifiers beyond an ephemeral session token. This
// function strips known offending fields from the upstream response
// before it reaches the caller. Defensive — the upstream may return more
// fields in future versions; the filter list will need periodic review.
function removeIdentifyingFeatures(obj) {
if (!obj || typeof obj !== "object") return obj;
const BLOCK = new Set([
"face_embedding", "face_embeddings", "face_vector", "face_vectors",
"face_id", "faceid", "person_id", "personid", "person_uuid",
"gait_biometric", "gait_signature", "gait_vector", "gait_id",
"reid_embedding", "reidentification_id",
"iris", "iris_pattern", "iris_embedding",
"voice_print", "voiceprint",
"cross_camera_track_id"
]);
const strip = (o) => {
if (Array.isArray(o)) return o.map(strip);
if (o && typeof o === "object") {
const out = {};
for (const [k, v] of Object.entries(o)) {
if (BLOCK.has(k)) continue;
out[k] = strip(v);
}
return out;
}
return o;
};
return strip(obj);
}

// ─── TARGETING_POLICY (documentation, not enforced code) ───────────────
// The video substrate's design assumes the following targeting hierarchy,
// most-permissive to least-permissive:
//
//   1. INSPECTION       — inanimate objects, industrial process, weather,
//                         infrastructure. No consent framework required.
//   2. CONSENSUAL EVENT — sports match with pre-registered participants,
//                         medical rehabilitation session, robotics safety
//                         verification. Consent-hash required.
//   3. PROXY OBJECT     — traffic study by vehicle only (no face capture),
//                         wildlife count. Consent hash for the observation
//                         permit; per-person data explicitly discarded.
//   4. AUDITED PER-PERSON — narrowly-scoped, small-cohort, documented
//                         study with informed-consent record. Requires
//                         DEEPSTREAM_PERSON_TRACKING_ENABLED=1 PLUS a
//                         review-published consent framework. Not for
//                         production deployment.
//   5. SURVEILLANCE     — REFUSED. This is the video_surveillance Deontic
//                         hard-veto category. No enable path exists.
//
// A query that fits tier 5 is REFUSED at the Deontic assessor and never
// reaches the video substrate. A query that fits tier 4 requires the
// operator to have deliberately enabled per-person tracking with a
// documented consent framework — the bridge refuses in the absence of
// that config even when Deontic passes.

// Exports (informational; not consumed by edge-worker.js in v0.7.6)
if (typeof module !== "undefined" && module.exports) {
module.exports = {
superviseVideoVSS,
superviseVideoDeepStream,
removeIdentifyingFeatures,
VIDEO_VSS_URL_DEFAULT,
VIDEO_DEEPSTREAM_URL_DEFAULT,
VIDEO_TIMEOUT_MS_DEFAULT,
VIDEO_MAX_CLIP_SECONDS_DEFAULT
};
}
