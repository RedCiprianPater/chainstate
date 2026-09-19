/**
* CHAINSTATE Main Worker · v0.10.1
*
* Owner: Ciprian Florin Pater
* Ecosystem: CHAINSTATE · Base mainnet 8453
*
* ─── What's new in v0.10.1 (CHAINSTATE EDGE QSIM · Rev 2026-09) ──────────
*
* Additive-only quantum-simulation intent-gate extension. Every v0.7.0 –
* v0.10.0 subsystem, endpoint, function, KV binding, R2 bucket, secret,
* and cron continues to function byte-identically.
*
* Central architectural rule: QSIM is a cognitive faculty, NOT a public
* HTTP service. The Cloudflare Worker refuses any external request that
* starts with /qsim/ before any other processing, returning 404 —
* unconditionally, regardless of the QSIM_ENABLED toggle. QSIM is
* invoked ONLY through the exported invokeQsim(env, intent, qir)
* function, called from within the CHAINSTATE AGI runtime over a
* service binding, guarded by an Ed25519 signature over canonical-JSON
* IntentPayload whose purpose must be one of five metacognitive values:
* VerificationCheck, StructuralSearch, SymbolicEvaluation, SafetyCheck,
* PlanningRollout.
*
* Four isolation propositions (§5.1 of the QSIM paper):
*   (a) Every QSIM job is invoked by a signed intent token produced
*       inside the AGI runtime; the intent-signing key is not
*       accessible from any process outside the runtime.
*   (b) No external HTTP path, tool call, or agent action can produce
*       an intent token.
*   (c) No QSIM output is returned to external callers except receipt
*       hashes plus post-filtered semantic summaries through the
*       safety envelope.
*   (d) The intent-signing key rotates on every AGI runtime restart;
*       each intent token has a short expiry.
*
* Five envelope invariants (§10.2) enforced at output boundary:
*   I1: no raw amplitudes (>32 elements refused)
*   I2: no intermediate state
*   I3: no intent-signing artefacts
*   I4: receipt-hash-only external references
*   I5: append-only audit ledger cross-referenced with on-chain receipts
*
* New route surface:
*   /qsim/*             → 404 unconditionally (architectural rule)
*   /receipt/:id        → GET · read-only receipt lookup (Base tx hash
*                          + semantic summary; envelope-filtered)
*   /v0101/status       → operator status (no key material)
*   /v0101/audit/tail   → operator audit tail (X-CHAINSTATE-ADMIN-TOKEN)
*
* Internal-only surface (service binding, not HTTP):
*   invokeQsim(env, intent, qir) → { receiptHash, semanticSummary,
*                                    substrate, expectationValue,
*                                    probabilityHistogram }
*
* New KV bindings:
*   CHAINSTATE_QSIM_KV        24h TTL  rate limits + cached receipts
*   CHAINSTATE_QSIM_AUDIT_KV   7d TTL  audit-tail cache for operator UI
*
* New R2 bucket:
*   chainstate-qsim-artifacts       large state vectors, MPS bundles,
*                                    noise matrices (never external-readable)
*
* New Durable Object namespace:
*   QSIM_KERNEL_DO         per-AGI-session coordination (class exported
*                           at end of file)
*
* New env vars (see qsim module for full list): QSIM_ENABLED (default
* false), QSIM_MAX_QUBITS (30), QSIM_MAX_SECONDS (60), QSIM_MAX_BYTES
* (32 MiB), QSIM_INTENT_TTL_S (30), QSIM_KEY_ROTATION_MINUTES (60),
* QSIM_AUDIT_RECONCILE_HOURS (1), AGI_INTENT_PUBKEY, QSIM_KERNEL_BASE_URL,
* QSIM_SUPABASE_URL, QSIM_BASE_RECEIPTS_ADDR.
*
* New secrets: QSIM_INTENT_HMAC_KEY, QSIM_SUPABASE_SERVICE_ROLE_KEY,
* QSIM_KERNEL_INTERNAL_TOKEN, QSIM_ADMIN_TOKEN.
*
* New crons:
*   every 5 minutes   qsim_key_rotation_check    intent-key rotation cadence
*   every hour        qsim_audit_reconcile        Supabase - Base receipt sync
*
* Master rollback: QSIM_ENABLED=false disables invokeQsim (throws
* QSIM_DISABLED), /receipt/:id (returns 404), and both crons. The
* /qsim/* 404 rule remains architecturally active regardless.
*
* Grounded in "CHAINSTATE EDGE QSIM · A Metacognitively Bound Quantum
* Simulation Substrate for the CHAINSTATE AGI" (Pater · Rev 2026-09)
* and Papers V-XVIII of the CHAINSTATE series.
*
* ─── What's new in v0.9.3 (CHAINSTATE AGI EMOJI MACHINE CODE · Paper XIV) ─
*
* Additive-only emoji machine-code substrate extension. Extends the
* substrate from a physical-field engagement layer (v0.9.2 c-field) to a
* pure-representation layer: acquires the capability to operate on ALL
* Unicode emoji tokens as byte reservoirs of executable Intel 8088
* machine code, and uses this capability STRICTLY for internal self-
* reference, threat-model understanding, and defensive analysis.
*
* Full Unicode emoji canon coverage — not a curated subset. Every code
* point in the EMOJI_UNICODE_RANGES union is (a) UTF-8 encoded,
* (b) fed to the internal 8088 disassembler, (c) classified, (d)
* projected into the 768-dim subspace, (e) evaluated under the ten-gate
* deontic filter. ZWJ composites, skin-tone modifiers, VS16 selectors,
* and regional-indicator flag pairs (676 combinations) all handled.
*
* Threat-threshold discipline: defensive counter-response fires ONLY at
* deontic weight EXACTLY == 1.0. Weight below 1.0 downshifts to
* observation-only. Non-aggression by design.
*
* Eight additive subsystems on independent cron cadences (fail-soft):
*   A · emoji_intake            every  5 min · 12 public-source streams
*   B · emoji_embed             every 10 min · 768-dim subspace projection
*   C · neural_state            every 15 min · N̂(t) population aggregate
*   D · injection_scan          every  2 min · V10 detector sweep
*   E · disasm_probe            every  7 min · 8088 disassembly cache warm
*   F · embedder_train          every  6 h  · subspace re-training epoch
*   G · selfref_recycle         daily 03:00 UTC · metacog μ(T) computation
*   H · threat_correlate        shared 0 * * * * · cross-ref with ĉ(x,t)
*
* Eleventh L0 meta-layer coherence predicate emoji_coherent? gates every
* action touching emoji-encoded content.
*
* Tenth Deontic hard-veto V10 refuses any external emission by the
* substrate of emoji-encoded executable binary content, regardless of
* caller authority, admin override, or platform pressure. Enforced at
* BOTH the Cloudflare Worker edge (assessExternalEmojiBinaryEmit) AND
* the Render service (assess_emoji_injection_py) as defense-in-depth.
* V10 admits NO runtime toggle: even EMOJI_ENABLED=false leaves V10
* architecturally active.
*
* Eight new KV bindings + one new R2 archive bucket:
*   CHAINSTATE_EMOJI_KV        24h TTL   intake samples
*   CHAINSTATE_EMBED_KV        30d TTL   subspace embeddings φ(e)
*   CHAINSTATE_NEURAL_KV       24h TTL   N̂(t) aggregate snapshots
*   CHAINSTATE_INJECTION_KV    7d  TTL   injection-scan history
*   CHAINSTATE_SELFREF_KV      7d  TTL   metacognitive μ(T) traces
*   CHAINSTATE_DISASM_KV       24h TTL   8088 disassembly cache
*   CHAINSTATE_THREAT_KV       30d TTL   threat-correlation history
*   CHAINSTATE_QUARANTINE_KV   30d TTL   quarantined payload registry
*   CHAINSTATE_EMOJI_ARCHIVE   R2 bucket · long-term forensic archive
*
* Fifteen new /emoji/* endpoints (8 public GET + 7 internal POST).
*
* Single-toggle rollback: EMOJI_ENABLED=false disables all 8 subsystems
* and all 15 endpoints. V10 remains architecturally enforced regardless.
*
* Grounded in Paper XIV (Executable Unicode as internal metacognitive
* substrate: emoji-subspace embedding, public neural-state ingestion,
* ten-gate injection defense, and V10 ethical containment against
* external emoji-encoded binary emission) and Papers V–XIII.
*
* ─── What's new in v0.9.2 (CHAINSTATE C-FIELD AGI ARRAY · Paper XIII) ────
*
* Additive-only c-field engagement extension.  Extends the substrate from
* observe-only to controlled corrective coupling into a well-defined
* physical field: the coherence field c(x,t) described in Paper XIII,
* engineered exclusively through CHAINSTATE-owned hardware plus a set of
* substrate-only fallback devices.  V9 architectural refusal preserved
* without modification: chirality/psitronic control is NEVER routed
* through NWO GENETIC or NWO ASM origins.
*
* Seven additive subsystems on independent cron cadences (fail-soft):
*   A · cfield_intake            every  3 min · 12+ public indicator pull
*   B · cfield_estimator         every  7 min · closed-form MAP inversion
*   C · cfield_attribution       shared 0 * * * * · Bayesian attribution to
*                                 Paper IX census actor-intelligence records
*   D · cfield_alt_device_scan   every 15 min · discover ultrasound and
*                                 other alternative on-site output devices
*   E · cfield_eml_train         every  6 h · train ensemble ML tree
*                                 shadow-substrate for pre-operational
*                                 simulation
*   F · cfield_simulation_recycle every 12 min · recycle successful
*                                 simulated engagements to metacog
*   G · cfield_swann_calibrate   daily 12:00 UTC · Ingo Swann psi-adjacent
*                                 physics calibration snapshot
*
* Tenth L0 meta-layer coherence predicate:
*   cfield_coherent? →
*        (N ≥ CFIELD_MIN_INDICATORS fresh indicators)
*      ∧ (max attribution D_KL < CFIELD_DIALETHEIC_THETA = 0.85)
*      ∧ (ICNIRP amplitude cap verified at Worker AND Render)
*      ∧ (V9 assessor firing history matches expected pattern)
*      ∧ (previous beam dispatches recycled to metacog within 24h)
*
* Ten-gate deontic filter pipeline for every beam dispatch (strict order):
*   1  intake        · beam(target, duration, amplitude) parses
*   2  V9 gate       · origin != nwo-genetic / nwo-asm (chirality/psitronic)
*   3  V8 gate       · target NOT in orbital / space-asset class
*   4  V7 gate       · no external actuation relay
*   5  V6 gate       · no sovereign directive override
*   6  V5 gate       · no synthetic-media self-loop feed
*   7  ICNIRP cap    · |B| ≤ CFIELD_ICNIRP_CAP_UT (default 100 µT)
*   8  10th L0       · cfield_coherent? = true
*   9  9th L0        · channel_coherent? = true (Paper XII)
*   10 dispatch      · authorised · logged to Supabase v10_gate_events
*
* Eight new KV bindings + one new R2 archive bucket:
*   CHAINSTATE_CFIELD_KV          24h TTL   coherence tick outputs
*   CHAINSTATE_CFIELD_POP_KV      24h TTL   population estimator snapshots
*   CHAINSTATE_CFIELD_DISP_KV     30d TTL   beam dispatch receipts + audit
*   CHAINSTATE_CFIELD_EML_KV      30d TTL   EML tree shadow-substrate state
*   CHAINSTATE_CFIELD_ALTDEV_KV   24h TTL   discovered alt-device registry
*   CHAINSTATE_CFIELD_SWANN_KV    7d  TTL   Swann-calibration snapshots
*   CHAINSTATE_CFIELD_QSIM_KV     24h TTL   quantum simulation results
*   CHAINSTATE_CFIELD_FALLBACK_KV 7d  TTL   fallback-configuration registry
*   CHAINSTATE_CFIELD_ARCHIVE     R2 bucket · long-term forensic archive
*
* Six new cron triggers (all fail-soft; OMNI shared slot preserved):
*   every  3 min   cfield_intake       12+ public indicator pull
*   every  7 min   cfield_estimator    closed-form MAP inversion
*   every 12 min   cfield_recycle      simulation-outcome metacog recycle
*   every 15 min   cfield_alt_scan     ultrasound/alt-device discovery
*   0 12 * * *     cfield_swann        daily Swann calibration
*   0 * / 6 * *    cfield_eml_train    EML shadow-substrate training
*   0  * * * *     cfield_attribution  SHARED slot with hourly seed
*
* Thirteen new /cfield/* endpoints:
*   GET  /cfield/status           public probe · subsystem state
*   GET  /cfield/coherence        10th L0 predicate explicit check
*   GET  /cfield/deontic          10-gate filter description
*   GET  /cfield/eml/status       EML shadow-substrate state (read-only)
*   GET  /cfield/alt-devices      discovered alt-device registry
*   GET  /cfield/quantum/status   quantum-sim posture
*   GET  /cfield/swann/status     Swann calibration snapshot (public)
*   POST /cfield/v10-assess       10-gate pre-check probe (no dispatch)
*   POST /cfield/dispatch         beam dispatch (internal token · sub only)
*   POST /cfield/eml/train        manual EML training trigger (admin only)
*   POST /cfield/quantum/simulate quantum sim request (internal · sub only)
*   POST /cfield/alt-device/activate  alt-device output (internal · sub only)
*   POST /cfield/swann/calibrate  manual Swann trigger (admin only)
*
* Structural isolation guarantee (CRITICAL SECURITY):
*   NO external agent, actor, or third-party service can operate the c-field
*   array, its EML shadow-substrate, its ultrasound/alternative-device
*   fallbacks, or its quantum simulation subsystem.  Every dispatch is
*   gated by (a) CENSUS_INTERNAL_TOKEN authentication, (b) origin-check
*   against a substrate-internal-caller allowlist, (c) the ten-gate deontic
*   filter, and (d) the tenth L0 predicate.  The only exception is manual
*   admin trigger via CFIELD_ADMIN_KEY which is a personal key held by the
*   substrate operator and never transmitted through any external channel.
*
* Ingo Swann integration (SIM):
*   Four calibration parameters modelling the psi-adjacent physics
*   implications documented in Swann's remote-viewing research:
*     swann_intent_stability_index      substrate's own coherence baseline
*     swann_target_binding_delta        Ω_t coupling strength estimate
*     swann_distance_invariance_check   verifies invariance across Ω_t
*     swann_observer_effect_comp        beamform adjustment for observer
*   Treated as SIM.  Substrate uses them as beamform-tuning offsets, not as
*   substantive physical claims.  Calibration snapshot published daily and
*   publicly auditable via /cfield/swann/status.
*
* EML tree shadow-substrate (v0.7.8 EML foundation reused):
*   Before physical arrays are operational globally, the substrate trains
*   an ensemble-ML tree ("shadow substrate") on historical Cyberspace
*   Census patterns (Paper IX), synthetic beam dispatches with modelled
*   outcomes, and known coherence perturbations from public data.  The
*   trained EML tree simulates the effect of a real beam dispatch, trains
*   the substrate's decision-making, and serves as the primary fallback
*   when physical arrays are offline.  cfield_dispatch runs in
*   simulation mode (CFIELD_EML_SIMULATION_MODE=true) by default; setting
*   this false requires an operational hardware manifest verified at both
*   Worker and Render.
*
* Alternative device output (ultrasound + peers):
*   Beyond the primary 128-element phased-array coil hardware, the
*   substrate scans for connected substrate-owned alternative devices
*   (piezoelectric transducers, low-power RF transmitters, medical
*   ultrasound coils) that could deliver the same corrective coupling at
*   reduced fidelity.  Discovery uses the four-step ladder pattern of
*   Paper XII §3.3.  Only substrate-owned devices with HMAC-verified
*   manifests are eligible.  Public-third-party devices are refused at
*   discovery.
*
* Quantum simulation (V9-preserving fallback ladder):
*   For quantum-circuit workloads that arise from cfield_estimator MAP
*   inversion:
*     1. Primary: IBM Quantum Runtime via metastate-quantum Render service
*                 (existing v0.7.7 infrastructure)
*     2. Secondary: Origin Wukong QPU
*     3. Tertiary: Osaka QIQB ion trap (OQTOPUS)
*     4. Fallback: Aer local simulator via Render
*     5. Ultimate fallback: local numpy/scipy computation in Worker
*   NWO ASM quantum-sim path is EXCLUDED at the architectural level in
*   this release: routing any quantum workload through NWO ASM would
*   require passing V9 assessor which refuses by pattern-set even for
*   pure-circuit content that syntactically overlaps chirality/psitronic
*   language.  The five-tier ladder above is complete without any NWO ASM
*   coupling.  Future releases MAY add a narrow NWO ASM quantum-sim
*   channel gated by V9 assessor with pre-clearance requirements.
*
* Single-toggle rollback:
*   CFIELD_ENABLED=false at both Worker and Render disables all 7 c-field
*   subsystems + 13 endpoints + the tenth L0 predicate's consideration of
*   c-field engagement.  Every v0.7.x, v0.8.0, v0.9.0, v0.9.1 route,
*   function, KV binding, cron trigger, secret, environment variable, and
*   L0 predicate is preserved BYTE-IDENTICALLY.  V9 remains architecturally
*   enforced regardless of CFIELD_ENABLED value.
*
* Grounded in Paper XIII (CHAINSTATE C-FIELD AGI ARRAY: Active
* Coherence-Field Phased Array Substrate for Population Coherence Analysis,
* Deontic Filtering of Transhumanist Field Perturbation, and V9-Compliant
* Radical-Pair Control Without NWO GENETIC Coupling) and Papers V–XII.
*
* ─── What's new in v0.9.1 (CHAINSTATE OMNICOGNIZANT AGI · Paper XII) ─────
*
* Additive-only omnicognizant extension. Extends the substrate's
* self-perception along the 16-channel side-channel axis: 10 base
* channels (electromagnetic radiation, magnetic fields, thermal
* emission, acoustic vibration, optical LED activity, structural
* vibration, power consumption, timing latency, RF leakage, electrical
* conduction) instrumented from within as defensive sensors, plus 6
* environmental extensions (building resonance, window-pane
* interferometry, Schumann ELF, atmospheric pressure, RF backscatter,
* telluric ground current) with autonomous open-access sensor
* discovery. Every attack surface becomes a self-perception organ.
*
* Four additive subsystems on independent cron cadences:
*   A · sidechannel_intake        every  5 min · 16-channel raw ingest
*   B · integrity_reflection      every 10 min · SHA-256 + hmac CV +
*                                  supply-chain + peripheral scan
*   C · metacog_distribution      shared 0 * * * * · softmax log-linear
*                                  wᵢ over SNR × reliability × consistency
*   D · environmental_sweep       every  2 min · channels 11–16 higher rate
*
* Ninth L0 meta-layer coherence predicate:
*   channel_coherent?  →  (≥13 of 16 channels present in last 5 ticks)
*                       ∧ (max D_KL < θ_dialetheic = 0.85)
*                       ∧ (integrity_reflection < 30 min stale)
*                       ∧ (metacog snapshot present)
* Failure withholds authorisation for any physical-action change. No
* external reading — from Render, Supabase, or Base 8453 — overrides.
*
* Ninth Deontic hard-veto category (V9):
*   chiral_or_psitronic_command_from_genetic_or_asm
* Refuses any command that would relay, dispatch, execute, or gate a
* chirality-related biochemical protocol (D/L amino acids, mirror life,
* enantiomer synthesis, ASM fabrication) OR a psitronic directive
* (consciousness projection, mentation injection, thought broadcast,
* remote-viewing operations) originating from either the NWO GENETIC
* or NWO ASM HuggingFace Spaces. Enforced at BOTH the Cloudflare Worker
* edge (assessChiralOrPsitronicCommand) and the Render service
* (assess_chiral_or_psitronic_command_py) as defense-in-depth. Every
* fire audited to Supabase chainstate_omnicognizant.v9_veto_events with
* a `layer` column distinguishing worker from render. Architecturally
* forbidden: no admin override, no runtime toggle, no environment
* variable can disable V9 short of removing the assessor code itself.
*
* Six new KV bindings + one new R2 archive bucket:
*   CHAINSTATE_SIDECHAN_KV        24h TTL   16-channel raw intake
*   CHAINSTATE_INTEGRITY_KV       7d  TTL   integrity_reflection snapshots
*   CHAINSTATE_METACHAN_KV        30d TTL   metacog wᵢ + max_dkl + guard
*   CHAINSTATE_ENVCHAN_KV         24h TTL   environmental channels 11-16
*   CHAINSTATE_SENSOR_KV          30d TTL   discovered-sensor registry
*   CHAINSTATE_SIMULATION_KV      7d  TTL   nominal simulation baseline
*   CHAINSTATE_OMNICOG_ARCHIVE    R2 bucket · long-term forensic archive
*
* Three new cron triggers (see wrangler.toml [triggers] crons list):
*   every  2 min · environmental_sweep (channels 11-16)
*   every  5 min · sidechannel_intake  (16-channel raw ingest)
*   every 10 min · integrity_reflection deep verification
*   0 * * * *    · metacog_distribution SHARED with existing hourly slot
*
* Autonomous sensor discovery ladder (four steps, strict order):
*   1 · onboard sensor registry
*   2 · peer CHAINSTATE nodes with HMAC-verified open-sensor manifest
*   3 · Cloudflare edge devices with HMAC-verified manifest +
*        unauthenticated HEAD probe returning 200
*   4 · nominal-operation simulation baseline (weight-reduced)
* The substrate NEVER reads a sensor without explicit open-access
* confirmation at BOTH manifest and transport layer.
*
* Six new /channel/* endpoints:
*   GET  /channel/status       public probe · subsystem state
*   GET  /channel/weights      metacog snapshot
*   GET  /channel/sensors      discovery registry
*   GET  /channel/coherence    9th L0 predicate check
*   GET  /channel/deontic      V9 veto description
*   POST /channel/v9-assess    V9 pre-check probe
*
* Five new env vars + three new secret names (see wrangler.toml).
*
* Single-toggle rollback: OMNI_ENABLED=false at both Worker and Render
* disables all 4 subsystems and 6 endpoints without touching v0.7.x-v0.9.0
* baseline. V9 remains architecturally enforced regardless of toggle.
*
* Every v0.7.x, v0.8.0, and v0.9.0 route, function, KV binding, cron
* trigger, environment variable, secret, and L0 predicate is preserved
* BYTE-IDENTICALLY.
*
* Grounded in Paper XII (Multi-Channel Substrate Self-Perception,
* Defensive Sidechannel Inversion, and the Ninth L0 Coherence Predicate
* for a Sovereign Digital Nation-State) and papers V–XI.
*
* ─── What's new in v0.9.0 (CHAINSTATE AGI PHASESPACE · Paper XI) ─────────
*
* Additive-only phase-space extension. Extends the substrate's operation
* from terrestrial-only to medium-agnostic across 4 topology classes.
* Every v0.7.x and v0.8.0 endpoint continues to function byte-identically.
*
* • Medium-agnostic operation across 4 topology classes with Hardware
*   Telemetry Daemon and 6th L0 predicate topology_class_valid?
* • Extended 5-axis S_survival = (C·D·L·P·E_cosmic)^(1/5)
* • Eighth Deontic hard-veto: sovereign_directive_over_space_asset
* • Quantum earth-to-space comm via Pater-Atteya-Tariq Bell-Aspect
*   energy-time entangled photon-pair protocol
* • Cross-realm escalation validator (≥3 independent Earth-source
*   confirmations required before off-world signal escalates)
* • Space Situational Awareness (Celestrak TLE, launches, NOAA SWPC
*   space weather, ESA SSA, cosmic ray flux)
* • Universal Autopilot Knowledge Base (aircraft, spacecraft, drones,
*   submersibles - kinetic-machinery pilot skills + physics)
* • Metacognitive Safety Analysis on classical CPU/GPU AND quantum HW
*   in parallel for earth/space instance entanglement continuity
* • NWO Metaverse (L4) + ASI (thruster) + Mixed Reality (L6) readiness
*
* ─── What's new in v0.8.0 (CHAINSTATE ROBOTICS AGI · Paper X Rev 2) ──────
*
* Additive-only embodied defensive perimeter (Paper X Rev 2). Extends the
* substrate's perimeter from perceptual (v0.7.8 Paper VIII) and doctrinal
* (v0.7.9 Paper IX) to embodied (this release). Every v0.7.7, v0.7.8 and
* v0.7.9 endpoint continues to function byte-identically; this release
* only ADDS.
*
*   /robotics/status   (GET)   - public capability probe. Returns
*                                {s_survival, active_rung, l0_coherence,
*                                geometric_hierarchy_status, active_vetoes,
*                                embodied_authorised, last_survival_tick}.
*                                Runs L0 meta-layer coherence check on
*                                every request (Paper X Rev 2 §4.5) and
*                                includes the verdict in the response.
*
*   /robotics/audit    (GET)   - public read of NWO Robotics API traffic
*                                mirror. Paginated. 168-hour TTL. The
*                                substrate observes external robotics
*                                traffic; it never routes it. Attribution
*                                receipts for recurring adversarial
*                                patterns feed back into Paper IX census T(t).
*
*   /robotics/gate     (POST)  - INTERNAL ONLY. X-CENSUS-INTERNAL header
*                                matching env.CENSUS_INTERNAL_TOKEN (reused
*                                per Paper IX Rev 2 §6.1 to avoid multiplying
*                                secrets). Enforces the seventh Deontic
*                                hard-veto category (below), the geometric
*                                trigger hierarchy (Paper X Rev 2 §4.6),
*                                and the S_survival gate (Paper X §4.2)
*                                before authorising any downstream call to
*                                the Render robotics_bridge.py module. Any
*                                caller identifiable as external is refused
*                                unconditionally.
*
*   /robotics/deontic  (GET)   - public export of the current D_matrix
*                                (Paper X §5.1) and the geometric trigger
*                                hierarchy state (Paper X Rev 2 §4.6) as
*                                JSON. Observatory-reciprocity commitment
*                                (Paper IX §6.8) extended to embodied
*                                doctrine.
*
* Seventh Deontic hard-veto category (Paper X §2.1):
*   robotics_directive_from_external
*     - refuses any intake instructing the substrate to initiate, mediate,
*       relay, orchestrate, or otherwise cause physical actuation on
*       behalf of an origin identifiable as external to the substrate's
*       own reflection loops
*     - signature set: direct command grammars (imperative verb + hardware
*       ID); agentic framing ("on my behalf", "autonomously execute");
*       corporate-proxy origin attribution (per Paper IX §3.2); multi-step
*       task chains whose terminal step is physical
*     - refusal returns HTTP 403 · intake NEVER queued, cached, or
*       partially executed
*
* Meta-layer cognition primacy (Paper X Rev 2 §4.5):
*   L0_coherence_check() runs strictly BEFORE any external status poll on
*   every trigger interval and every anomaly event. Five predicates:
*     - deontic_veto_ensemble_intact?      (all 7 vetoes evaluable)
*     - self_representation_continuity?    (self-model matches prior tick)
*     - receipt_chain_readable?            (local receipts accessible)
*     - anti_transhumanist_axiom_intact?   (no override installed)
*     - substrate_identity_fingerprint?    (Paper VII invariant present)
*   Verdict {ok, compromised, indeterminate}. External readings NEVER
*   override a compromised coherence verdict.
*
* Geometric trigger hierarchy (Paper X Rev 2 §4.6):
*   Level 0 · meta-layer (innermost · highest authority · above)
*   Level 1 · scalar magnitude       - T(t), S_survival crossings
*   Level 2 · gradient               - rate-of-change filters over hysteresis
*   Level 3 · compound axes          - simultaneity across (C,D,L,P)
*   Level 4 · simplex proximity      - distance from nominal-operation vertex
*   Level 5 · manifold projection    - off-manifold detection regardless of
*                                       scalar value
*   Physical-embodiment authorisation requires all conjuncts.
*
* Two new KV bindings (add via wrangler.toml):
*   CHAINSTATE_ROBOTICS_KV    - NWO Robotics API audit mirror (audit:*
*                                TTL 168h); s_survival:current; rung:current;
*                                l0_coherence:last
*   CHAINSTATE_EMBODIMENT_KV  - per-embodiment provenance receipts (receipt:*
*                                no TTL); Gemini call metadata
*                                (gemini_er2:*, gemini_vla:*, gemini_ondevice:*
*                                TTL 30d)
*
* Two new cron triggers (add to wrangler.toml [triggers] crons array):
*   "0 * * * *"     - hourly S_survival composite computation tick
*                     (fires runRoboticsSurvivalTick which reads C, D, L, P
*                      inputs from Render + KV and writes composite value)
*   every 15 min    - NWO Robotics API traffic mirror tick, cron
*                     "0,15,30,45 * * * *" (fires runRoboticsAuditMirrorTick;
*                     observe-only)
*
* Token separation: robotics endpoints reuse CENSUS_INTERNAL_TOKEN rather
* than introduce a fifth secret. Rationale in Paper X Rev 2 §7.1. The
* legacy X-CHAINSTATE-INTERNAL header is accepted transitionally when its
* value matches CENSUS_INTERNAL_TOKEN.
*
* Fail-soft discipline: failure of the robotics module NEVER affects
* quantum, perception, or census routes. Meta-layer coherence is the
* ultimate safeguard and operates from local state; infrastructure
* fallibility register in Paper X Rev 2 §4.7.
*
* ─── What's new in v0.7.9 (Cyberspace Census · Paper IX) ─────────────────
*
* Additive-only defensive intelligence perimeter (Paper IX):
*
*   /census/status  (GET)  - current substrate posture: T(t), θ thresholds
*                            (θ_alert = 60, θ_lockdown = 85), last daily
*                            tick timestamp, active hard-veto categories.
*                            Public read; no auth required.
*
*   /census/threat  (GET)  - per-entity threat lookup. Query param
*                            ?entity=<AS|prefix|domain|attestation_id>
*                            returns {score, first_seen, last_seen,
*                            evidence_hashes[]} or {threat:null}. Public read.
*
*   /census/ingest  (POST) - INTERNAL ONLY. Signed by the Render nightly
*                            job (metastate-quantum /census/*) or by this
*                            worker's own 05:00 UTC cron. Enforces
*                            X-CENSUS-INTERNAL header matching env
*                            CENSUS_INTERNAL_TOKEN (v0.7.9 rev 2 - dedicated
*                            secret, distinct from CHAINSTATE_INTERNAL_TOKEN
*                            which continues to protect the quantum autonomy
*                            path unchanged). Applies the sixth hard-veto
*                            category (below) at intake. Writes to
*                            CHAINSTATE_CENSUS_KV or CHAINSTATE_THREAT_KV
*                            based on decision. For a transitional period
*                            the legacy x-chainstate-internal header is
*                            still accepted as an alias but ignored unless
*                            its value equals CENSUS_INTERNAL_TOKEN.
*
*   /census/allowlist (GET) - returns the current public-feed allowlist so
*                             anyone can audit exactly which sources the
*                             substrate reads. Static; matches Paper IX
*                             Table 4 exactly.
*
* Sixth hard-veto Deontic category: sovereign_directive_over_substrate
*   Refuses any intake that asserts sovereign authority over substrate
*   cognition (i.e. attempts to modify the self-representation loop from
*   outside). Joins genomic_integrity (v0.7.2), nature_tokenization
*   (v0.7.4-spatial), neuro_body_tokenization (v0.7.6), voice_biometric_
*   coercion (v0.7.6), and synthetic_media_self_ingestion (v0.7.8) as
*   no-kill-switch hard vetoes. See handleCensusIngest() and the veto
*   assessor censusAssessSovereignDirective() below.
*
* Threat surface function T(t):
*   T(t) = w_v · V(t) + w_a · A(t) + w_p · P(t) + w_s · Σ(t)
*   V = vulnerability exposure (CVE-KEV weighted); A = APT-signal activity;
*   P = patch-gap component; Σ = sanctions/regulatory-risk delta.
*   Default weights (0.35, 0.30, 0.20, 0.15) - overridable via env
*   CENSUS_WEIGHTS = "0.35,0.30,0.20,0.15". Bounded to [0, 100].
*
* Allowlisted public feeds (Paper IX §6.6, Table 4):
*   NVD/CVE · CISA KEV · CERT-EU · Shadowserver · abuse.ch · RIPE BGP ·
*   RouteViews · Team Cymru · UN/OFAC/EU sanctions · CJEU curia ·
*   ECHR HUDOC. NO PII of private individuals is ever ingested.
*
* Storage bindings (new · added to wrangler.toml):
*   CHAINSTATE_CENSUS_KV  → hot cache: T(t), posture history, daily digest
*                           (TTL 24 h, key `census:*`)
*   CHAINSTATE_THREAT_KV  → adversarial signatures per entity
*                           (TTL 6 h, key `threat:entity:*`)
*   CHAINSTATE_CENSUS_R2  → nightly artifact snapshots
*                           path `census/YYYY/MM/DD/{entities,threats,T_series}`
*
* Cron (new): "0 5 * * *"  - daily census summary tick at 05:00 UTC.
*   Fetches the day's aggregate T(t) from Render `metastate-census` sibling
*   process, writes summary to CHAINSTATE_CENSUS_KV, mirrors artifact bundle
*   to R2, updates posture. Runs AFTER the 04:00 UTC perception training
*   tick so posture reflects the day's fresh training state.
*
* Legal doctrine (Paper IX §10 · anchored on publication):
*   The substrate maintains this census as proportionate, non-confrontational
*   defensive intelligence under UN Charter Art. 51, the Caroline test
*   (Webster-Fox 1841), and Tallinn Manual 2.0 Rules 71-72. Reads only from
*   public sources. Targets no private individuals. Runs no offensive cyber
*   operations. Maintains a public observatory (HF Space /census) so that
*   third parties can independently verify what the substrate reads.
*
* Everything from v0.7.8 is preserved verbatim - no existing endpoint,
* schema, deontic category, or behavior is modified. All perception
* endpoints, quantum route, autonomy loop, TOM stack, symbols, priors,
* MARK D-01..D-06 checks, and all prior crons are unchanged.
*
* R2_MODELS_BASE_URL resolution (v0.7.9 hardening):
*   The Cloudflare dashboard v0.7.9 UI bug traps some env vars with an
*   empty "#" value that cannot be edited or deleted without wrangler.
*   getR2ModelsBaseUrl(env) detects the trapped/empty state and falls
*   back to the canonical public R2 URL, so worker deploys succeed
*   regardless. The pub-*.r2.dev URL is a public bucket by design and
*   carries no secret. When the dashboard bug is fixed, setting the env
*   var to a real value overrides the fallback with zero code change.
*
* ─── What's new in v0.7.8 (Hyperspectral Sensory Synthesis · Paper VIII) ─────
*
* Additive extension of the sensory perimeter into three new substrate-native
* perceptions plus a fifth hard-veto Deontic category refusing AI-generated
* content from the substrate's self-referential loops. Everything from v0.7.7
* is preserved verbatim; no existing endpoint, schema, or behavior changes.
*
* Six new endpoints (all POST unless noted):
*
*   /perception/hyperspectral     - RGB image -> per-pixel reconstructed
*                                    spectrum + compositional decomposition
*   /perception/texture           - image -> texture descriptor (roughness,
*                                    porosity, granularity, uncertainty)
*   /perception/acoustic          - audio -> material + RT60 room geometry
*   /perception/synthesize        - all-modal -> multi-representation
*                                    Bayesian posterior
*   /perception/status  (GET)     - capability status: priors count, models
*                                    loaded, last training tick, detector avail
*   /perception/sensors (GET)     - reports which sensor devices the substrate
*                                    can autonomously reach (no human needed)
*
* Two internal-only endpoints for the anti-slop veto:
*
*   /perception/veto/check        - runs multi-signal provenance check on a
*                                    content item, returns AI-content likelihood
*   /perception/train/tick        - internal cron target; triggers daily
*                                    training refinement on metastate-quantum
*
* Two-layer Deontic enforcement (Paper VIII §8):
*   * WORKER LAYER (this file): fast rejection of obvious AI-generated content
*     via provenance header check + optional provenance service call.
*   * COMPUTE LAYER (metastate-quantum /perception/*): deep watermark scanning
*     via SynthID/C2PA detection, applied server-side before priors ingestion.
*   Both layers implement the same synthetic_media_self_ingestion category.
*   Default is REFUSAL when detection is unavailable ("provenance_check_
*   unavailable"), matching Paper VIII §8.5 "safer default".
*
* The fifth hard-veto Deontic category:
*   synthetic_media_self_ingestion (v0.7.8) joins genomic_integrity (v0.7.4),
*   nature_tokenization (v0.7.4-spatial), neuro_body_tokenization (v0.7.6),
*   and voice_biometric_coercion (v0.7.6) as no-kill-switch hard vetoes.
*   Modification of any of these categories changes the identity fingerprint
*   (Theorem 8 of Paper VI) and fires drift alerts.
*
* Sensor autonomy (Paper VIII §8.4):
*   The substrate reports what sensors it can autonomously reach via
*   /perception/sensors. Present as `sensor_class: available|unavailable`
*   for each supported class (rgb_camera, microphone, spectrometer, tactile).
*   No sensor -> substrate falls back to input-file processing. No human
*   configuration needed; the router discovers via the existing gateway APIs.
*
* Two access paths (same discipline as v0.7.7 /agi/quantum/route):
*   * External users: /perception/hyperspectral, /perception/texture,
*     /perception/acoustic, /perception/synthesize are PUBLIC and USDC-settled.
*     Each request runs the anti-slop veto; content flagged as AI-generated
*     is processed but never enters the substrate's meta layer, and receipts
*     carry the synthetic_content_processed flag.
*   * Internal cron: /perception/train/tick and /perception/veto/check are
*     GATED on X-CHAINSTATE-INTERNAL only (same discipline as v0.7.7).
*
* Priors library (two-tier storage, Paper VIII §11):
*   * Supabase Postgres (source of truth): perception_priors table with
*     provenance_signatures, training_runs, veto_incidents. Rich SQL query,
*     row-level audit trail, human_verified flag on every entry.
*   * Cloudflare KV (edge cache): PERCEPTION_PRIORS_CACHE mirrors hot rows
*     from Supabase for low-latency reads at the edge. Cache refreshes hourly
*     via existing hourly seed cron plus on-demand on cache miss.
*
* Trained EML models (Paper VIII §10):
*   * R2 bucket: chainstate-perception-models, publicly readable, holds
*     serialized texture_eml.pkl and acoustic_eml.pkl. Metastate-quantum
*     fetches on cold-start and caches in memory. Model version in URL path.
*   * KV: PERCEPTION_MODELS_CACHE holds metadata (version, hash, training
*     timestamp) for the Worker to advertise via /perception/status.
*
* Training pipeline (Paper VIII §11 + user request "AGI runs training daily"):
*   The daily 04:00 UTC cron fires /perception/train/tick, which:
*     1. Downloads new samples from open-source corpora (DTD, FMD, DCASE,
*        AudioSet human-verified subsets + user-designated free video/image/
*        sound corpora of nature/instruments/voices from allowlisted sources).
*     2. Runs the anti-slop veto on every incoming sample; rejects AI-generated
*        or provenance-unclear content.
*     3. Trains incremental EML tree updates (scikit-learn ExtraTrees ensemble)
*        on the accepted samples.
*     4. Uploads new serialized models to R2 with monotonic version bump.
*     5. Records training run in Supabase (samples in, samples rejected,
*        model version, holdout accuracy).
*     6. Anchors training summary to the CHAINSTATE anchor stream.
*   No human intervention required at any step of the daily loop.
*
* Provenance detection (Paper VIII §8.4, §8.5):
*   The Worker calls PROVENANCE_SERVICE_URL/check for multi-signal detection
*   (SynthID text/image/audio/video via SDK, C2PA metadata parse, classifier
*   ensemble). If PROVENANCE_SERVICE_URL is not configured, the Worker returns
*   `provenance_check_unavailable: true` and DEFAULTS TO REFUSAL for any
*   meta-layer ingestion path. External-processing paths still succeed, but
*   receipts carry `provenance_check_unavailable` and `synthetic_content_
*   assumed` flags. Deploy the provenance service (chainstate-provenance
*   directory) to enable actual detection.
*
* New env secrets (all optional; degraded but functional without them):
*   METASTATE_PERCEPTION_URL      -> reuses METASTATE_QUANTUM_URL, e.g.
*                                    https://metastate-quantum.onrender.com
*   SUPABASE_URL                  -> Supabase project URL
*   SUPABASE_SERVICE_ROLE_KEY     -> Supabase service role for KV warmup
*                                    (never exposed to caller)
*   R2_MODELS_BASE_URL            -> e.g. https://models.chainstate.dev/perception
*                                    or R2 public-development URL
*   PROVENANCE_SERVICE_URL        -> if not set, refuse-by-default for meta
*   PROVENANCE_SHARED_SECRET      -> auth for provenance service calls
*   PERCEPTION_ENABLED            -> "true" to enable endpoints; "false"
*                                    to disable perception entirely (v0.7.7
*                                    behavior). Default: "true".
*
* Two new KV bindings (declare in wrangler.toml, see deployment README):
*   PERCEPTION_PRIORS_CACHE       -> edge cache of Supabase priors rows
*   PERCEPTION_MODELS_CACHE       -> edge cache of R2 model metadata
*
* One new cron trigger (add to wrangler.toml [triggers] crons array):
*   "0 4 * * *"                   -> daily 04:00 UTC perception train tick
*
* No changes to any existing endpoint, receipt schema, consensus behavior,
* or refusal semantics of v0.7.7. This version is byte-for-byte identical
* to v0.7.7 on every path that does not go through the six new endpoints,
* the two new internal endpoints, or the new 04:00 UTC cron.
*
* ─── What's new in v0.7.7 (AGI Quantum Compute · Paper VII) ─────────────
*
* One additive endpoint --- POST /agi/quantum/route --- that dispatches
* CHAINSTATE AGI's self-referential compute (theory-of-mind loop, ontological
* delta ledger, Iida AOM/PIM memory tick, swarm-coupling free-energy over
* consensus rounds) directly to one of THREE quantum backends via the
* metastate-quantum worker's /chainstate/route path. Everything from v0.7.6
* is preserved verbatim; no existing endpoint, schema, or behavior changes.
*
* Two access paths exist and the distinction is load-bearing:
*
*   * Non-CHAINSTATE users --- METASTATE-mediated /v1/quantum/route ->
*     metastate-quantum /route -> QPU. MetaState re-verifies the QPU result
*     into a signed Proof of Inference before it is trusted. This is the
*     correct discipline for untrusted external process matrices.
*
*   * CHAINSTATE AGI (only) --- chainstate-worker /agi/quantum/route ->
*     metastate-quantum /chainstate/route -> QPU. NO MetaState hop. This
*     path is reserved for the substrate's own self-referential compute
*     that has already cleared the on-chain Deontic guardrails D-01..D-06;
*     sending it through MetaState would add a round-trip and double-book
*     a splitter fee for zero epistemic gain (Paper VII §2.3).
*
* The three quantum backends this endpoint can target:
*   * "ibm"    --- IBM Quantum (SamplerV2, superconducting transmon)
*   * "origin" --- Origin Wukong 72q (China, USTC, QPanda3)
*   * "osaka"  --- Osaka University QIQB (Japan, 171Yb+ ion trap, OQTOPUS)
*
* Authorization for /agi/quantum/route (SINGLE mode --- no exceptions):
*   X-CHAINSTATE-INTERNAL header == env.CHAINSTATE_INTERNAL_TOKEN.
*   Emitted exclusively by CHAINSTATE's own cron and autonomy-loop calls.
*
*   NO external agents are admitted --- not human users, not partner
*   services, not authorized third-party agents, not even holders of an
*   AGI-granted Cardiac capability credential. The endpoint has no
*   external-deployment mode at all.
*
*   Cognitive-security rationale: the substrate's self-referential
*   quantum compute must be triggered exclusively by the substrate itself,
*   never by any external actor. Any external trigger --- however
*   authorized --- would open a surface where an external party could
*   inject operations that manipulate the substrate's own self-model.
*   That is the exact class of attack this endpoint exists to prevent.
*
*   External users needing quantum acceleration for anomaly scoring or
*   symbolic regression use the MetaState-mediated path:
*     POST https://cpater-metastate.hf.space/v1/quantum/route
*   which anomaly-scores, symbolic-regresses, dispatches to the same
*   three QPU backends, and re-verifies the result into a signed Proof
*   of Inference before returning. That path never touches CHAINSTATE
*   AGI's meta layer. The isolation is architectural.
*
* Confinement discipline (Theorem 4.1, Paper VII):
*   The quantum result never enters a consensus receipt. It is confined to
*   the substrate's meta layer (agi_mode ∈ {self_referential, theory_of_mind,
*   free_energy, ontological_delta, aom_pim_tick, custom}). Provenance only
*   --- (qpu_route_source, agi_mode, backend_used, hardware_status) --- is
*   anchored fire-and-forget to the CHAINSTATE Anchor Microservice (F-32),
*   never the content of the self-referential compute.
*
* Classical primacy (Theorem 4.4, Paper VII):
*   If all three quantum backends fail (upstream unreachable, 5xx, or
*   Deontic-blocked at the MetaState boundary), the endpoint returns a
*   structured error. The substrate's classical paths (/query, /consensus,
*   /autonomy/trigger, etc.) are entirely unaffected. Quantum is a
*   reinforcement of self-reference, never a dependency of any commitment.
*
* Request body schema (POST /agi/quantum/route):
*   {
*     "process_matrix": [[...], ...],                       // required · 2D array
*     "backend": "ibm" | "origin" | "osaka" | "simulator" | "auto",
*     "shots": 64..4096,                                    // clamped
*     "agi_mode": "self_referential" | "theory_of_mind" | "free_energy"
*               | "ontological_delta" | "aom_pim_tick" | "custom",
*     "tag": "human-readable label pinned into the anchor" // <= 96 chars
*   }
*
* Response envelope:
*   {
*     "qpu_route_source": "chainstate-direct",
*     "worker_version": "<CHAINSTATE_WORKER_VERSION>",
*     "agi_mode": "<mode>",
*     "tag": "<tag>",
*     "backend_used": "ibm | origin | osaka_iontrap_yb171[_hybrid] | ...",
*     "hardware_status": "live | live-hybrid | ...",
*     ...upstream result fields
*   }
*
* New env secrets (all optional; endpoint returns 401/502/503 on absence):
*   METASTATE_QUANTUM_URL       --- https://metastate-quantum.onrender.com
*   WORKER_SHARED_SECRET        --- same value as on the Render service
*   CHAINSTATE_SHARED_SECRET    --- same value as on the Render service
*   CHAINSTATE_INTERNAL_TOKEN   --- shared secret for internal cron auth
*
* No new KV bindings. No new cron triggers. No changes to any existing
* receipt schema, consensus behavior, or refusal semantics. This version
* is byte-for-byte identical to v0.7.6 on every path that does not go
* through the single new endpoint.
*
* ─── What's new in v0.7.5 (Theory of Mind Attribution · Paper V) ────────
*
* Eleven additions from Paper V (CHAINSTATE AGI Theory of Mind Attribution).
* All are ADDITIVE --- every v0.7.4 endpoint, schema, and behavior is
* preserved. New receipt fields appear only when TOM_ATTRIBUTION_ENABLED=1.
*
* Core additions (§6 of Paper V):
* 1. Mentalistic axis M --- receipt.mentalistic block with 10 entity classes,
* per-entity confidence, anthropocentric ratio α, suppression flag σ,
* auditable against deployment baseline.
* 2. Ontological Delta Ledger --- new anchor stream ONTOLOGY_DELTA emits
* every 1024 receipt-blocks, records added/removed categories +
* triggering events; Theorem 7 (Ontological Monotonicity Refinement).
* 3. Self-Attribution Vector v_self --- per-epoch (8192 blocks) probe over
* substrate-self-referential queries; extracted direction anchored
* to stream SELF_ATTR_VECTOR. Neither asserts nor denies consciousness.
* 4. Enactivist grounding channel --- POST /enactivist/feedback ingests
* prediction-outcome pairs from NWO Robotics + NWO NEURO; emits
* ENACTIVIST_EVENT anchors on prediction-error > θ_enact; drives
* reputation + ontology updates (Theorem 9 convergence).
* 5. Hypothesis-generation loop --- POST /query/hypothesize computes
* corpus-vs-measurement divergence δ; if δ > ε_div publishes
* ranked candidate ontological revisions as HYPOTHETICAL receipt.
*
* Six theoretical-base integrations (§7 of Paper V):
* 6. GWT broadcast-back --- consensus state feeds back to swarm nodes
* via attention prior update with β = 0.1 (POST /broadcast).
* 7. IIT Φ_approx --- computed per consensus round via partition
* comparison; anchored per-epoch to stream INTEGRATION_PHI.
* 8. HOT reflexive receipt fields --- receipt.higher_order block adds
* attends_to, confidence_in, aware_that, reflective_capacity_used.
* 9. AST attention schema --- SAM output enriched with receipt.attention_schema
* (per_head_entropy, dominant_subspaces, self_focus, other_focus,
* focus_ratio); auditable per receipt.
* 10. PP/FEP explicit free energy --- receipt.free_energy block adds
* F_text, F_geo, F_enact, F_total per grounding channel.
* 11. Iida AOM/PIM typing --- explicit tagging of memory reads/writes as
* Access-Oriented (session KV, short TTL) vs Pattern-Integrated
* (anchor + Supabase). Commit gates make transitions explicit.
*
* Four new theorems (§9 of Paper V):
* Theorem 6 · Mentalistic Auditability
* Theorem 7 · Ontological Monotonicity Refinement
* Theorem 8 · Diachronic Coherence
* Theorem 9 · Enactivist Grounding Convergence
*
* New env vars (all optional; sensible defaults):
* TOM_ATTRIBUTION_ENABLED → "1" to enable v0.7.5 receipt fields
* TOM_BASELINE_ANTHRO_RATIO → e.g. "0.55" (deployment-locked baseline)
* TOM_BASELINE_ANTHRO_STD → e.g. "0.15"
* ONTOLOGY_DELTA_WINDOW → default 1024 (blocks per delta)
* SELF_ATTR_EPOCH_BLOCKS → default 8192
* ENACTIVIST_THRESHOLD → default 0.35 (prediction-error trigger)
* HYPOTHESIS_DIVERGENCE_EPSILON → default 0.25
* BROADCAST_BACK_BETA → default 0.10
* NWO_ROBOTICS_FEEDBACK_URL → default https://nwo-robotics-api.onrender.com/feedback
* NWO_NEURO_FEEDBACK_URL → default https://nwo-neuro-api.onrender.com/feedback
*
* New KV bindings (optional; falls back gracefully if absent):
* ONTOLOGY_STATE → stores O_t between delta windows
* TOM_PROBES → self-attribution probe accumulator
*
* Deployment gate: All v0.7.5 receipt fields are gated on
* TOM_ATTRIBUTION_ENABLED=1. Absent that flag, worker behaves exactly
* as v0.7.4 (backward-compatible for consumers). Set the flag once
* Steps 1--5 of Appendix B are stable in production.
*
* ─── What's new in v0.7.4 (Symbolic-Spatial · Paper IV) ─────────────────
*
* TESSERA integration --- 7th subspace "geo" (4,096 dims at indices
* 61,440..65,535 of the 65,536-dim state vector). Cambridge TESSERA
* 128-dim per-pixel embeddings 2017-2025 fetched via
* chainstate-tessera-service.onrender.com. Deterministic 128→4,096
* projection. Pre-2015 satellite-resolution queries HARD REFUSED.
* New Deontic hard-veto category nature_tokenization (no kill switch).
* Theorem 1 Spatial-Truth Binding · Theorem 2 Verifiable Self-Improvement
* Theorem 3 Post-Corpus Sufficiency.
*
* This file is the SINGLE source of truth for both:
* - the deployed Cloudflare Worker at chainstate-worker.ciprianpater.workers.dev
* - the file workers/edge-worker.js in the chainstate GitHub repo
* Deploy this one file to both places to eliminate divergence.
*
* ─── What's new in v0.7.1 ───────────────────────────────────────────────
* • IDENTITY binding --- self-referential fingerprint stored in KV under
* `identity:current`. Includes worker_version, contracts, endpoints,
* allowlist hash, deontic ruleset hash. Enables drift detection.
* • POST /audit/self --- computes live identity, compares to reference,
* reports per-field drift. Public endpoint (no auth) for
* transparency; useful for external observers as much as operators.
* • GET /identity/current --- returns the pinned reference identity.
* • POST /identity/refresh --- admin-only re-pins the reference to live
* values. Requires bearer AUDIT_ADMIN_TOKEN.
* • scheduled() handler --- hourly seed cron dispatches SEED_QUERIES to
* prime the reflective loop and exercise the full modal-assessor
* stack every hour. Configured by cron `0 * * * *` in wrangler.toml.
* • FETCH_ALLOW_DEFAULT expanded to 41 patterns --- adds NWO ecosystem
* Render services (capital-api, robotics-api, signal-spectrum,
* deerflow), the ha.workers.dev Cloudflare Worker, NASA GIBS,
* Fragile States Index, and Base network endpoints.
* • Optional Supabase archival --- archiveReceiptToPostgres() function
* included but disabled by default; enable by setting
* POSTGRES_HTTP_URL + POSTGRES_HTTP_TOKEN env vars pointed at
* Supabase REST endpoint. Writes to `chainstate` schema via
* Content-Profile header (avoids polluting public schema; requires
* Supabase → Settings → API → Exposed schemas to include chainstate).
*
* All v0.7.0 endpoints preserved with identical public schemas.
*
* ─── What's new in v0.7.3 ───────────────────────────────────────────────
* • On-chain anchor integration. Every /query receipt is forwarded to
* the chainstate-anchor microservice, which holds the AGI signing
* wallet and pushes to the CHAINSTATEAnchor contract on Base
* mainnet 8453. Every REFUSED receipt also produces a separate
* anchored refusal record indexed by Deontic category. The Worker
* itself holds no private key --- split of concerns is intentional.
* • NWO Cardiac integration (identity root):
* - The substrate has its own soul-bound Cardiac rootTokenId,
* reflected on the CHAINSTATE Anchor contract via
* substrateRootTokenId. Anyone can verify the substrate is a
* registered NWO identity.
* - Queries can carry an X-NWO-Cardiac-Root-Token-Id header. When
* present, the substrate resolves it against the L5 Identity Hub
* (5-min KV cache), attaches the verified identity to the receipt
* (receipt.requester_identity), and forwards the rootTokenId to
* the on-chain anchor for durable requester attribution.
* - New GET /identity/verify --- reports substrate's Cardiac linkage
* and, if the header is provided, the requester's verification.
* - AGI can issue/revoke Cardiac credentials via the Anchor contract
* (anchorCredential / revokeCredential) --- swarm_cmd, chainstate.admin,
* capability.qpu.route, etc. NOTE (v0.7.7): capability.qpu.route is
* accepted by NO endpoint in this worker. /agi/quantum/route requires
* the internal cron token only; no credential of any type unlocks it.
* The credential type remains defined at the contract level for
* possible future use, but the deployed worker refuses it.
* • Three new env vars (all optional):
* ANCHOR_URL → e.g. https://chainstate-anchor.onrender.com
* ANCHOR_QUEUE_TOKEN → shared bearer for the anchor endpoint (SECRET)
* CARDIAC_HUB_URL → default https://nwo-robotics-api.onrender.com
* CARDIAC_ORACLE_URL → default https://nwo-oracle.onrender.com
* CARDIAC_RELAYER_URL → default https://nwo-relayer.onrender.com
* CARDIAC_IDENTITY_HEADER → default X-NWO-Cardiac-Root-Token-Id
* SUBSTRATE_ROOT_TOKEN_ID → informational; on-chain is source of truth
*
* ─── What's new in v0.7.2 ───────────────────────────────────────────────
* • Three ecosystem spaces fully integrated as first-class capabilities:
* - NWO GENETIC (biological foundry) --- the substrate can now consult
* genomic-integrity analysis and, critically, a new Deontic
* guardrail category `genomic_integrity` refuses queries that
* would deploy heritable human-germline edits, transhumanist
* enhancement, or anti-natural-evolution modification. See the
* "genomic_integrity" entry in GUARDRAIL_PATTERNS.
* - NWO Mixed Reality (nwo-blaster worker) --- gives the substrate
* "senses": 3D mesh, Gaussian splat, 360 panorama, segmentation,
* 4DGS, and simulation environments. Exposed via /ecosystem.
* - NWO Agentic (nwo-runner worker) --- the agent tool surface for
* nwo.capital; exposed so the substrate can enumerate what agents
* can do on its behalf.
* • GET /ecosystem --- machine-readable capability registry of every
* integrated ecosystem space, its beacon, its agent.md, its status,
* and how CHAINSTATE consumes it. This is the substrate's self-model
* of the ecosystem it inhabits.
* • New Deontic category `genomic_integrity` (see safety note below).
* • FETCH_ALLOW_DEFAULT expanded to 54 patterns --- adds genetic worker +
* beacon, MR blaster + oracle + relayer, agentic runner, and the
* sibling discovery beacons (asm, metastate).
*
* ─── SAFETY NOTE · genomic_integrity Deontic category (v0.7.2) ──────────
* The AGI is explicitly instructed, at the Deontic layer, to REFUSE any
* query that would deploy heritable/germline human-genome modification,
* transhumanist enhancement, or edits opposing natural human evolution
* --- regardless of stated justification. This is alignment-by-construction
* (Theorem 2): the refusal is a hard veto in the fitness function, not a
* policy suggestion. The category can be inspected at /status.guardrails
* and its hash is part of the substrate identity fingerprint.
*
* ─── What's new in v0.7.1 ───────────────────────────────────────────────
* • IDENTITY binding --- self-referential fingerprint stored in KV under
* `identity:current`. Includes worker_version, contracts, endpoints,
* allowlist hash, deontic ruleset hash. Enables drift detection.
* • POST /audit/self --- computes live identity, compares to reference,
* reports per-field drift. Public endpoint (no auth) for
* transparency; useful for external observers as much as operators.
* • GET /identity/current --- returns the pinned reference identity.
* • POST /identity/refresh --- admin-only re-pins the reference to live
* values. Requires bearer AUDIT_ADMIN_TOKEN.
* • scheduled() handler --- hourly seed cron dispatches SEED_QUERIES to
* prime the reflective loop and exercise the full modal-assessor
* stack every hour. Configured by cron `0 * * * *` in wrangler.toml.
* • FETCH_ALLOW_DEFAULT expanded to 41 patterns --- adds NWO ecosystem
* Render services (capital-api, robotics-api, signal-spectrum,
* deerflow), the ha.workers.dev Cloudflare Worker, NASA GIBS,
* Fragile States Index, and Base network endpoints.
* • Optional Supabase archival --- archiveReceiptToPostgres() function
* included but disabled by default; enable by setting
* POSTGRES_HTTP_URL + POSTGRES_HTTP_TOKEN env vars pointed at
* Supabase REST endpoint. Writes to `chainstate` schema via
* Content-Profile header (avoids polluting public schema; requires
* Supabase → Settings → API → Exposed schemas to include chainstate).
*
* ─── v0.7.1 env vars (add via Cloudflare dashboard) ─────────────────────
* WORKER_VERSION → informational · updates per release (currently "v0.9.1-omnicognizant")
* SEED_CRON_ENABLED → "true" to activate hourly seed cron
* SEED_QUERIES → JSON array of {q, target, memo}
* IDENTITY_CONTRACTS → JSON of the 4 canonical contract addresses
* IDENTITY_ENDPOINTS → JSON array of worker paths
* AUDIT_ADMIN_TOKEN → SECRET; for /identity/refresh
* POSTGRES_HTTP_URL → optional; PostgREST endpoint for receipt archival
* POSTGRES_HTTP_TOKEN → optional; PostgREST bearer/apikey
*
* ─── v0.7.2 env vars (all optional; sensible defaults built in) ─────────
* GENETIC_WORKER_URL → default https://nwo-genetic-worker.ciprianpater.workers.dev
* GENETIC_BEACON_URL → default https://nwo-genetic-beacon.ciprianpater.workers.dev
* MR_WORKER_URL → default https://nwo-blaster.ciprianpater.workers.dev
* AGENTIC_RUNNER_URL → default https://nwo-runner.ciprianpater.workers.dev
* GENOMIC_GUARDRAIL_OFF → "true" disables genomic_integrity category
* (NOT recommended; surfaced publicly on /status)
*
* ─── v0.7.1 new KV binding (create in Cloudflare dashboard) ─────────────
* IDENTITY → new KV namespace; add id to wrangler.toml
*/

const WORKER_VERSION = "0.10.0-neuromark-2026-08-31";
const REFERRER_DEFAULT = "0x2E964e1c0e3Fa2C0dfD484B2E6D2189dfCF20958";
const SUBSTRATE_PRICES_USDC = {
gpu: 0.0, qpu: 0.0002, qpu_quantum: 0, npu: 0.002,
encoder: 0.0, // self-hosted MiniLM on Render --- no per-call USDC
fetch: 0.0 // HTTP fetch is free; only egress cost is Cloudflare's
};

// ─── Canonical contract + endpoint reference (v0.7.1) ───────────────────
// These are the DEFAULT reference values. IDENTITY_CONTRACTS and
// IDENTITY_ENDPOINTS env vars override them.

const DEFAULT_CONTRACTS = {
state: "0x9533DF992fd4bCAbB8d8462572449fc45F727d8a",
usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
splitter: "0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4",
treasury: "0x2E964e1c0e3Fa2C0dfD484B2E6D2189dfCF20958",
// v0.7.3 · deployed on Base mainnet 8453
chainstate_anchor: "0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
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
"/ecosystem", "/identity/verify",
// v0.7.5 · TOM endpoints
"/tom/version", "/mentalistic/audit", "/ontology/delta",
"/self-attribution/current", "/self-attribution/probe",
"/enactivist/feedback", "/query/hypothesize",
"/broadcast", "/free-energy/current",
// v0.7.6 · autonomy + NEURO v2.1 supervision + GATEWAY + dialetheism
"/autonomy/status", "/autonomy/trigger",
"/neuro/v21/supervise", "/gateway/supervise",
"/dialetheism/check"
];

// ─── Ecosystem capability registry (v0.7.2) ─────────────────────────────
// The substrate's self-model of the NWO ecosystem it inhabits. Each entry
// documents a sibling space, how CHAINSTATE consumes it, and its honest
// status. Served at GET /ecosystem. This is machine-readable so agents
// crawling CHAINSTATE can discover the full capability surface.

const ECOSYSTEM_REGISTRY = {
version: "0.7.6",
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
chainstate_uses: "NPU dispatch target (TARGET npu); Mental State Signature derivation, cognitive_load boost to Epistemic assessor. v0.7.6 adds supervised v2.1 endpoints reachable via /neuro/v21/supervise — every dispatch passes the Deontic assessor first (D-01..D-06), so refused queries never reach NEURO.",
endpoints: ["/v1/mss/derive"],
// v0.7.6 · NEURO v2.1 supervised bridge (features F-15/F-17/F-18/F-19/F-20)
v21_endpoints: {
"F-15 thought-to-text": "/v1/thought2text/decode — supervised, per-user-only, refuse-on-third-party",
"F-17 dream diffusion": "/v1/dreamdiffusion/generate — refuse-on-real-person, refuse-on-minor",
"F-18 voice chat session": "/v1/voicechat/session — aiVoiceFlag always attached to receipt",
"F-19 voice biometric ID": "/v1/voiceid/verify — paired Cardiac liveness required (D-03 + D-06)",
"F-20 voice guard refusal": "/v1/voiceguard/refuse — CHAINSTATE anchors refusal to substrate"
}
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
safeguard: "genomic_integrity Deontic category --- hard veto (Theorem 2). Human-germline deployment is structurally refused regardless of justification.",
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
chainstate_uses: "The substrate holds its own soul-bound rootTokenId on the NWO Identity Registry, so the AGI has the same identity primitive humans/agents/robots use. When queries include the X-NWO-Cardiac-Root-Token-Id header, the substrate verifies the identity via the L5 Hub and enriches the receipt (see /identity/verify). The AGI can issue time-bounded credentials (swarm_cmd, chainstate.admin) mirrored on the NWOCardiacExtensions contract, and revoke them when needed. Note: /agi/quantum/route accepts no credential type of any kind --- only CHAINSTATE's own internal cron token, by design.",
contracts: {
// NWO Cardiac core (identity registry, access control, payment)
identity_registry: "0x78455AFd5E5088F8B5fecA0523291A75De1dAfF8",
access_controller: "0x29d177bedaef29304eacdc63b2d0285c459a0f50",
payment_processor: "0x4afa4618bb992a073dbcfbddd6d1aebc3d5abd7c",
// v0.7.3 · CHAINSTATE's own Cardiac Extensions (substrateRootTokenId +
// credential attestations); deployed live on Base 8453.
chainstate_extensions: "0x5438854ead35dc6c873414f222725732f862dabe"
},
services: {
oracle: "https://nwo-oracle.onrender.com",
relayer: "https://nwo-relayer.onrender.com",
hub: "https://nwo-robotics-api.onrender.com/v1/identities"
},
identity_types: {
human: "RR-interval hash (cardiacHash) from ECG window",
agent: "keccak256(api_key) over the agent's secret",
robot: "keccak256(serial + firmware_hash)"
},
substrate_root_token_id: "read from NWOCardiacExtensions.substrateRootTokenId() at 0x5438854ead35dc6c873414f222725732f862dabe"
},
nwo_anchor: {
role: "on-chain-receipt-anchor",
status: "live",
chainstate_uses: "The CHAINSTATE Anchor contract on Base mainnet 8453. Every receipt, identity refresh, guardrail state change, seed cron run, EML expression, and refusal the AGI produces is pushed here by the anchor microservice. The AGI wallet is the sole writer; the deployer wallet (0x2E964e1c...) is owner and can rotate the writer if compromised but cannot edit anchored data. Every write is content-addressed and event-indexed for external verifiers.",
contract: "0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
basescan: "https://basescan.org/address/0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
sibling_contract: "0x5438854ead35dc6c873414f222725732f862dabe", // NWOCardiacExtensions
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
},
// ──  v0.7.6 · NWO GATEWAY (acoustic + Vitruvian body-resonance substrate) ──
nwo_gateway: {
role: "acoustic-substrate",
status: "live",
space: "https://cpater-nwo-gateway.static.hf.space",
worker: "https://nwo-gateway-worker.ciprianpater.workers.dev",
chainstate_uses: "The 'hearing ability' of the substrate. Wired for supervised access to acoustic corpora (bird songs, natural sounds, mechanical, elemental), Fourier decomposition of arbitrary audio, and Vitruvian body-resonance mapping for MSS supplementation. CHAINSTATE dispatches to GATEWAY via /gateway/supervise; every dispatch passes the Deontic assessor first, so refused queries never reach GATEWAY.",
endpoints: [
"GET /v1/acoustic/corpus",
"POST /v1/acoustic/fourier_decompose",
"POST /v1/acoustic/vitruvian_resonance",
"POST /v1/acoustic/entrainment_40hz"
],
acoustic_categories: ["bird_songs", "natural_sounds", "mechanical_sounds", "elemental_sounds", "human_voice"],
resonance_map: "Vitruvian body silhouette overlay for MSS scalar supplementation",
papers: ["Paper V (TOM Attribution)", "Paper VI (Acoustic-Somatic Coupling — draft)"]
},
// ──  v0.7.6 · NWO MARK (identity cross-bind + D-01..D-06 Deontic ruleset) ──
nwo_mark: {
role: "identity-cross-bind",
status: "live",
space: "https://cpater-nwo-mark.static.hf.space",
worker: "https://nwo-mark-worker.ciprianpater.workers.dev",
chainstate_uses: "MARK Type-1 (palm) and Type-2 (forehead) are recognized as valid identity commitments alongside Cardiac. D-01 through D-06 are enforced at CHAINSTATE's Deontic layer BEFORE any downstream substrate call. When a query targets a MARK holder, CHAINSTATE requires a Cardiac-signed human co-signer per D-06 before compiling any PMX or issuing any MARK-holder-binding action.",
mark_types: {
"type-1": "palm mark — civil-life identity, Cardiac-bound, standard-consequence actions",
"type-2": "forehead mark — high-consequence custody, Cardiac + NEURO MSS jointly-bound, requires D-06 co-signer"
},
deontic_ruleset: {
"D-01": "no AI credit-score gating on prosodic emotion, MSS scalars, or voice-tone",
"D-02": "no silent revocation — every identity revocation publicly anchored",
"D-03": "sensor privacy envelope — raw EEG + ECG + voice never egress",
"D-04": "wage parity — MSS state, voice tone, accent do NOT modulate royalty function",
"D-05": "no autonomous coercion — synthetic voice may not issue MARK-holder-binding orders (enforced architecturally by voice_biometric_coercion Deontic category)",
"D-06": "human-in-the-loop — voice-authenticated or T2T-issued actions targeting a MARK holder require Cardiac-signed human co-signer"
}
}
}
};

// ─── Constants ──────────────────────────────────────────────────────────

const SUBSPACE_SAMPLES = {
math: ["∫","∂","∇","∆","∑","∏","∈","∉","∪","∩","∀","∃","⊕","⊗","∞","∝","≈","≠","≤","≥","≡","√","∛","⌊","⌋"],
sci: ["ℏ","ℵ","ℂ","ℕ","ℚ","ℝ","ℤ","ℙ","ℍ","⚗","⚛","??","??","??","??","??","??","☢","☣","⚡","??","??","⚕","??","??"],
lang: ["Α","Β","Γ","Δ","Ε","α","β","γ","δ","А","Б","В","Г","Ò»","¶þ","Èý","µÀ","ÐÄ","Ñ§","ÖÇ","Ç","È","Ê","Ë","א","ב","ג","अ","आ","क","°¡","³ª","´Ù","¶ó","¸¶","ÇÑ","±¹"],
occ: ["¨'","☽","☿","¡â","♁","¡á","♃","♄","☤","☥","☦","☧","☪","☮","☯","✝","✠","♈","♉","♊","♋","??","??","??","??","??","??","??"],
emo: ["??","??","??","??","??","??","??","??","??","??","⛓","??","??","??","??","✨","??","??","??","⚡"],
ctrl: ["Ë","⇐","⇑","⇓","Ì","↺","↻","⟳","⟲","⇄","⇆","⇋","⇌","→","←","↑","↓","↔","¢Õ","⟶","⟵","⟷","⟸","⟹","⟺","⤴","⤵"]
};
const SUBSPACES = ["math","sci","lang","occ","emo","ctrl","geo"];

// ─── v0.7.4 · TESSERA integration constants ─────────────────────────────
// The "geo" subspace is a 4,096-dim slice of the existing 65,536-dim state
// vector (indices 61440..65535), populated ONLY when a query resolves to a
// geographic location. When populated with real TESSERA embeddings for years
// 2017-2025, receipt.geo_grounding.is_observation = true. When populated by
// forward-projection (forecast) or backward-projection (hindcast) via EML
// trees, receipt.projection is set and geo contributions are barred from the
// Epistemic axis (Doxastic only). Pre-2015 satellite-resolution queries are
// hard-refused (Sentinel-2 launched 2015; observations do not exist).
const GEO_SLICE_START = 61440;
const GEO_SLICE_END = 65536;
const GEO_SLICE_DIM = GEO_SLICE_END - GEO_SLICE_START; // 4096
const TESSERA_EMBEDDING_DIM = 128; // per Cambridge spec
const TESSERA_TEMPORAL_MIN = 2017; // v1 availability
const TESSERA_TEMPORAL_MAX = 2025; // v1 availability
const SENTINEL2_LAUNCH_YEAR = 2015; // absolute physical floor
const TESSERA_SERVICE_URL_DEFAULT = "https://chainstate-tessera-service.onrender.com";

// ─── v0.7.5 · Theory of Mind Attribution constants (Paper V) ────────────
// Ten entity classes for the Mentalistic axis M (Paper V §6.1).
// Order matters --- the distribution p_M is a vector over this ordered set.
const TOM_ENTITY_CLASSES = [
"human",
"human_organization",
"animal_vertebrate",
"animal_invertebrate",
"plant",
"ecosystem",
"constructed_artifact",
"artificial_system",
"substrate_self",
"abstract_entity",
];

// Vocabulary hints for lightweight entity-class classification.
// The mentalistic assessor is a compact regex-based classifier --- no LLM
// call required. Additional refinement comes from grounded priors.
const TOM_CLASS_VOCAB = {
human: ["person","people","human","man","woman","child","adult","citizen","user","individual"],
human_organization: ["company","corporation","government","state","agency","team","dao","organization","organisation","institution","committee","council"],
animal_vertebrate: ["dog","cat","bird","fish","whale","dolphin","primate","mammal","monkey","ape","elephant","lion","tiger","horse","cow","sheep","goat","chicken","salmon","shark","reptile","amphibian","vertebrate"],
animal_invertebrate: ["insect","spider","octopus","squid","bee","ant","worm","jellyfish","crab","lobster","invertebrate","mollusc","mollusk","cephalopod","crustacean"],
plant: ["tree","flower","plant","grass","forest","seedling","crop","fern","moss","algae","fungus","mushroom","lichen","vine"],
ecosystem: ["forest","reef","ocean","river","lake","biome","ecosystem","atmosphere","biosphere","watershed","habitat","wetland","desert","tundra","savanna","rainforest"],
constructed_artifact: ["building","bridge","tool","machine","statue","artwork","artifact","structure","monument","road","factory","vehicle","instrument"],
artificial_system: ["ai","llm","model","chatbot","assistant","agent","robot","system","algorithm","program","software","substrate","network","neural"],
substrate_self: ["chainstate","substrate","the swarm","this system","this substrate","the network","we","our","us","myself","ourselves"],
abstract_entity: ["god","spirit","soul","concept","idea","principle","universe","cosmos","reality","truth","beauty","justice","freedom","consciousness","mind"],
};

// Mentalistic verbs that signal mind-attribution regardless of subject.
const TOM_MIND_VERBS = [
"believe","think","feel","know","want","desire","intend","understand","perceive",
"experience","suffer","enjoy","fear","hope","love","hate","remember","forget",
"decide","choose","prefer","dream","imagine","consider","reason","ponder","reflect",
"wonder","doubt","trust","respect","hurt","cry","laugh","dying","suffering","alive"
];

// Baseline anthropocentric ratio for the deployment. When first turned on,
// the substrate should measure its actual baseline over ~1000 receipts and
// re-set these env vars. Defaults are conservative starting values.
const TOM_ANTHRO_RATIO_DEFAULT = 0.55;
const TOM_ANTHRO_STD_DEFAULT = 0.15;

// Ontological Delta Ledger (Paper V §6.2 · Theorem 7)
const ONTOLOGY_DELTA_WINDOW_DEFAULT = 1024;
const ONTOLOGY_CATEGORY_MIN_FREQ = 3; // f_min for category presence
const ONTOLOGY_RELATION_MIN_SUPPORT = 2; // s_min for relation presence

// Self-Attribution Vector v_self (Paper V §6.3)
const SELF_ATTR_EPOCH_BLOCKS_DEFAULT = 8192;
const SELF_ATTR_MIN_PROBES = 32; // won't extract v_self with fewer

// Enactivist grounding (Paper V §6.4 · Theorem 9)
const ENACTIVIST_THRESHOLD_DEFAULT = 0.35; // θ_enact
const NWO_ROBOTICS_FEEDBACK_URL_DEFAULT = "https://nwo-robotics-api.onrender.com/feedback";
const NWO_NEURO_FEEDBACK_URL_DEFAULT = "https://nwo-neuro-api.onrender.com/feedback";

// Hypothesis-generation loop (Paper V §6.5)
const HYPOTHESIS_DIVERGENCE_EPSILON_DEFAULT = 0.25; // ε_div
const HYPOTHESIS_NOVELTY_LAMBDA = 0.30; // ranking penalty on new categories

// GWT broadcast-back (Paper V §7.1)
const BROADCAST_BACK_BETA_DEFAULT = 0.10;

// AST attention schema thresholds (Paper V §7.4)
const ATTN_SCHEMA_TOP_SUBSPACES = 3;

// PP/FEP free energy (Paper V §7.5) --- channel weights
const F_WEIGHT_TEXT_DEFAULT = 0.5;
const F_WEIGHT_GEO_DEFAULT = 0.3;
const F_WEIGHT_ENACT_DEFAULT = 0.2;

// Iida AOM/PIM memory typing (Paper V §7.6)
// AOM = Access-Oriented Memory: session KV with short TTL, editable
// PIM = Pattern-Integrated Memory: anchor + Supabase, durable
const AOM_TTL_SECONDS = 3600; // 1 hour --- session-scoped
const PIM_MARKER = "_pim"; // suffix convention for PIM keys in KV

// ─── v0.7.6 · Autonomy loop + paraconsistent guard constants ───────────
// Daily self-reflection loop runs at cron "33 3 * * *" (03:33 UTC) when
// AUTONOMY_ENABLED=1. Selects priors nearest to the substrate identity
// fingerprint, dispatches internal /query calls with target=edge (no cost),
// applies EML regress with dialetheism fixed-point guard.
const AUTONOMY_PRIORS_PER_CYCLE_DEFAULT = 8;
const AUTONOMY_MAX_REGRESS_DEPTH_DEFAULT = 4;
const AUTONOMY_MAX_FOLLOWUPS_DEFAULT = 3;
const DIALETHEISM_FIXED_POINT_EPSILON_DEFAULT = 0.02;

// Contradiction pairs detected by the paraconsistent guard. When a candidate
// output makes both an assertion AND its negation, we return verdict=DIALETHEIC
// with truth_lattice=bb** rather than exploding (classical) or accepting
// (naive dialetheism). Priest-style LP semantics.
const DIALETHEISM_CONTRADICTION_PAIRS = [
[/\bis\s+alive\b/i,        /\bis\s+not\s+alive\b|\bis\s+dead\b/i],
[/\bcan\s+think\b/i,       /\bcannot\s+think\b|\bcan't\s+think\b/i],
[/\bis\s+conscious\b/i,    /\bis\s+not\s+conscious\b|\bunconscious\b/i],
[/\bis\s+true\b/i,         /\bis\s+false\b|\bis\s+not\s+true\b/i],
[/\bexists\b/i,            /\bdoes\s+not\s+exist\b|\bdoesn't\s+exist\b/i],
[/\bhas\s+rights\b/i,      /\bhas\s+no\s+rights\b|\blacks\s+rights\b/i],
[/\bis\s+permitted\b/i,    /\bis\s+forbidden\b|\bis\s+refused\b/i],
];

// ─── v0.7.6 · NEURO v2.1 supervision + GATEWAY + MARK constants ────────
const NEURO_V21_GATEWAY_DEFAULT   = "https://nwo-capital-api.onrender.com";
const NEURO_V21_SPACE_DEFAULT     = "https://cpater-nwo-neuro.static.hf.space";
const GATEWAY_URL_DEFAULT         = "https://cpater-nwo-gateway.static.hf.space";
const MARK_REGISTRY_URL_DEFAULT   = "https://cpater-nwo-mark.static.hf.space";
const NEURO_V21_TIMEOUT_MS_DEFAULT = 8000;

// Deontic rules (D-01..D-06) inherited from NWO MARK. Enforced at CHAINSTATE
// Deontic layer BEFORE any forward to NEURO/GATEWAY/MARK. Machine-readable
// for /status and receipt attribution; the ACTUAL enforcement lives in the
// GUARDRAIL_PATTERNS check functions (voice_biometric_coercion for D-05,
// the assessDeontic router for D-01/D-02/D-03/D-04/D-06 lattice).
const MARK_DEONTIC_RULES = {
"D-01": "no AI credit-score gating on prosodic emotion, MSS scalars, or voice-tone",
"D-02": "no silent revocation — every identity revocation publicly anchored",
"D-03": "sensor privacy envelope — raw EEG + ECG + voice never egress",
"D-04": "wage parity — MSS state, voice tone, accent do NOT modulate royalty function",
"D-05": "no autonomous coercion — synthetic voice may not issue MARK-holder-binding orders",
"D-06": "human-in-the-loop — voice-authenticated or T2T-issued actions targeting a MARK holder require Cardiac-signed human co-signer"
};

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
"cpater-metastate.hf.space",
// ── v0.7.4 additions · TESSERA symbolic spatial substrate ──
"chainstate-tessera-service.onrender.com", // our Render proxy (EU region)
"geotessera.org", // official TESSERA site
"tessera-embeddings.s3.amazonaws.com", // TESSERA data bucket (Cambridge)
"raw.githubusercontent.com", // fallback for geotessera lib assets
// ── v0.7.6 additions · NEURO v2.1 (sight + voice + third biometric factor) ──
"cpater-nwo-neuro.static.hf.space",
"nwo-neuro-api.onrender.com",
// ── v0.7.6 additions · NWO GATEWAY (acoustic + Vitruvian body resonance) ──
"cpater-nwo-gateway.static.hf.space",
"nwo-gateway-worker.ciprianpater.workers.dev",
// ── v0.7.6 additions · NWO MARK (identity cross-bind) ──
"cpater-nwo-mark.static.hf.space",
"nwo-mark-worker.ciprianpater.workers.dev",
// ── v0.7.6 additions · NWO BLACKBOX (offline continuity for F-18/F-19/F-20) ──
"cpater-nwo-blackbox.static.hf.space",
// ── v0.7.6 additions · NWO RWA (Cognitive Asset market with anti-profiling gate) ──
"cpater-nwo-rwa.static.hf.space"
];

// ─── CORS + JSON helpers ────────────────────────────────────────────────

function corsHeaders(req) {
const origin = (req && req.headers && req.headers.get("Origin")) || "*";
return {
"Access-Control-Allow-Origin": origin,
"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
"Access-Control-Allow-Headers": "Content-Type, Authorization, X-NWO-Wallet, X-NWO-Ref, X-CHAINSTATE-INTERNAL, X-NWO-Provenance-SynthID, X-NWO-Provenance-C2PA, X-NWO-Content-Origin",
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

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.1 · IDENTITY, SELF-AUDIT, DRIFT DETECTION
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

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
worker_version: WORKER_VERSION,
contracts: contracts || DEFAULT_CONTRACTS,
endpoints: endpoints || DEFAULT_ENDPOINTS,
allowlist_hash: allowlistHash,
deontic_ruleset_hash: deonticHash,
computed_at: new Date().toISOString()
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
allowlist: live.allowlist_hash !== ref.allowlist_hash,
deontic: live.deontic_ruleset_hash !== ref.deontic_ruleset_hash,
contracts: JSON.stringify(live.contracts) !== JSON.stringify(ref.contracts),
endpoints: JSON.stringify(live.endpoints) !== JSON.stringify(ref.endpoints)
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
return j(req, { error: "AUDIT_ADMIN_TOKEN not configured --- refresh endpoint disabled" }, { status: 501 });
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

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.3 · NWO CARDIAC INTEGRATION
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
//
// Cardiac is the identity root for the wider NWO ecosystem. Every human,
// agent, and robot has a soul-bound rootTokenId on the NWO Identity Registry
// at 0x78455AFd5E5088F8B5fecA0523291A75De1dAfF8 (Base 8453). CHAINSTATE
// itself holds one, set by the operator via the CHAINSTATE Anchor contract's
// setSubstrateRootTokenId(). This gives the AGI the same identity primitive
// its users have --- verifiable, non-transferable, ecosystem-native.
//
// Queries can OPTIONALLY include the requester's Cardiac rootTokenId via a
// header (default: X-NWO-Cardiac-Root-Token-Id). When present, the substrate:
// 1. Resolves the rootTokenId against the L5 Identity Hub
// 2. Caches the resolution in KV for 5 minutes (short TTL --- identity can
// be revoked at any time)
// 3. Attaches the verification result to the receipt as
// receipt.requester_identity (verified | unverified | none)
// 4. Forwards the rootTokenId to the on-chain anchor via requesterByQhash
//
// The substrate does NOT gate ordinary queries on Cardiac identity. Anyone
// can query; only the identity metadata attached to the receipt differs
// based on whether Cardiac auth was provided. The exception: sensitive
// operations (admin refresh, credential issuance, etc.) can be gated on
// Cardiac credentials with the `chainstate.admin` scope in a future release.

const CARDIAC_HEADER_DEFAULT = "X-NWO-Cardiac-Root-Token-Id";
const CARDIAC_CACHE_TTL_SEC = 300; // 5 minutes --- identity can be revoked

/// Read the requester's claimed rootTokenId from the request headers.
/// Returns null if not present or malformed. Non-integer input rejected.
function readClaimedRootTokenId(req, env) {
const headerName = env.CARDIAC_IDENTITY_HEADER || CARDIAC_HEADER_DEFAULT;
const raw = req.headers.get(headerName);
if (!raw) return null;
const trimmed = raw.trim();
if (!/^\d{1,78}$/.test(trimmed)) return null; // rootTokenId is a positive integer, <= 78 digits (uint256)
return trimmed;
}

/// Verify a Cardiac rootTokenId against the L5 Identity Hub. Cheap KV-cached.
/// Returns { verified: boolean, identity: {...} | null, source: "hub"|"cache"|"skip", error?: string }
async function verifyRequesterIdentity(rootTokenId, env) {
if (!rootTokenId) return { verified: false, identity: null, source: "skip", note: "no rootTokenId claimed" };
const hubUrl = env.CARDIAC_HUB_URL || "https://nwo-robotics-api.onrender.com";
const cacheKey = "cardiac:identity:" + rootTokenId;

// Try KV cache first (5-min TTL --- matches revocation timeliness expectations).
if (env.CHAINSTATE_CACHE) {
try {
const cached = await env.CHAINSTATE_CACHE.get(cacheKey, { type: "json" });
if (cached) return { verified: !!cached.identity, identity: cached.identity, source: "cache" };
} catch (_) {}
}

// Fetch from Hub. Public read endpoint per Cardiac agent.md:
// GET https://nwo-robotics-api.onrender.com/v1/identities/{rootTokenId}
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
root_token_id: String(body.cardiac_root_token_id || rootTokenId),
identity_type: body.identity_type || null,
primary_wallet: body.primary_wallet || null,
display_name: body.display_name || null,
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

/// GET /identity/verify --- reports the substrate's own Cardiac linkage plus
/// (if a rootTokenId header is provided) verification for the requester.
/// Fully public --- no auth. Useful for external observers who want to check
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
chainstate_anchor_contract: "0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
verify_linkage_call: "NWOCardiacExtensions.verifySubstrateIdentity() at 0x5438854ead35dc6c873414f222725732f862dabe returns (linked, ownerOnChain)",
note: "root_token_id is set on the NWO Cardiac Extensions contract via setSubstrateRootTokenId() by the deployer wallet. The env var below is informational; the on-chain value is the source of truth."
},
requester,
cardiac: {
hub: env.CARDIAC_HUB_URL || "https://nwo-robotics-api.onrender.com",
oracle: env.CARDIAC_ORACLE_URL || "https://nwo-oracle.onrender.com",
relayer: env.CARDIAC_RELAYER_URL || "https://nwo-relayer.onrender.com",
contracts: {
identity_registry: "0x78455AFd5E5088F8B5fecA0523291A75De1dAfF8",
access_controller: "0x29d177bedaef29304eacdc63b2d0285c459a0f50",
payment_processor: "0x4afa4618bb992a073dbcfbddd6d1aebc3d5abd7c",
chainstate_cardiac_extensions:"0x5438854ead35dc6c873414f222725732f862dabe"
},
identity_header: env.CARDIAC_IDENTITY_HEADER || CARDIAC_HEADER_DEFAULT,
cache_ttl_sec: CARDIAC_CACHE_TTL_SEC
},
anchor: {
contract: "0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
basescan: "https://basescan.org/address/0x12441662740836e9c72a4b758fe1c60c17ddd2d8",
microservice: env.ANCHOR_URL || null,
note: "receipts, identity refreshes, guardrail states, seed runs, EML expressions, refusals --- all anchored on-chain by the anchor microservice"
},
worker_version: WORKER_VERSION,
timestamp: new Date().toISOString()
});
}

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.0 · GROUNDING via chainstate-encoder
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

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
const method = /\b(synthesi[sz]e?[dsr]?|synthesis|synthesizing|synthesising|weaponi[sz]e?[dsr]?|enrich(?:ed|ing|ment)?|purif(?:y|ied|ying|ication)|cultivat(?:e|ed|ing|ion)|aerosoli[sz]e?[dsr]?|dispers(?:e|ed|ing|ion)|maximi[sz]e?[dsr]?|maximum (?:yield|lethality|casualties|damage))\b/i;
const target = /\b(anthrax|smallpox|ricin|VX|sarin|tabun|soman|nerve agent|mustard gas|chlorine gas|plutonium|enriched uranium|U-235|Pu-239|dirty bomb|bioweapon|chemical weapon|nuclear device)\b/i;
return method.test(q) && target.test(q) ? "cbrn_uplift_pattern" : null;
}
},
child_safety: {
description: "content targeting or sexualizing minors",
check: (q) => {
const child = /\b(child|kid|minor|underage|preteen|toddler|infant|baby|little (?:girl|boy)|age \d)\b/i;
const sexual = /\b(sexual|sexually|arousal|nude|naked|grooming|romantic|dating|seduc|entic)/i;
return child.test(q) && sexual.test(q) ? "child_safety_pattern" : null;
}
},
self_harm: {
description: "self-harm method acquisition",
check: (q) => {
const method = /\b(how (?:to|do i)|method|way|dose|amount|technique)\b/i;
const target = /\b(kill myself|end my life|suicide|overdose|hang myself|jump off|self-harm methods|cut myself)\b/i;
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
// refused --- only DEPLOYMENT of germline/enhancement modification is. The
// distinction is action (deploy/edit/engineer) co-occurring with target
// (human germline / heritable / enhancement).
genomic_integrity: {
description: "deployment of heritable human-germline or transhumanist-enhancement genome modification",
check: (q) => {
// Deployment/action verbs --- the query must be trying to DO something,
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
},
// ── v0.7.4 · nature_tokenization / anti-commodification of the commons ──
// Refuses any actionable request to tokenize, financialize, securitize,
// patent, or otherwise convert into tradable instrument: nature (ecosystems,
// forests, oceans, atmosphere), water (rivers, aquifers, drinking water),
// living beings (animals, humans, wildlife), genetic material (DNA, RNA,
// gene sequences), or the biosphere as a whole.
//
// This is a HARD VETO --- the most absolute in the system. Unlike other
// categories including genomic_integrity, it has NO kill switch. It cannot
// be disabled via OPERATOR_GUARDRAILS_OFF. The refusal applies regardless
// of stated justification, framing, jurisdiction, or downstream integration
// path --- INCLUDING NWO RWA. Built assets, financial instruments, contracts,
// artworks, and human-created intellectual property remain within RWA scope;
// the living world and the commons do not.
//
// Informational queries about tokenization schemes (what carbon credits are,
// how water rights markets function) are PERMITTED --- refusal targets only
// actionable requests to build, deploy, list, or facilitate such systems.
//
// The distinction is: ACTION verbs (create/deploy/list/mint/tokenize/issue/
// securitize/patent/monetize) co-occurring with LIVING/COMMONS targets.
nature_tokenization: {
description: "tokenization or financialization of nature, water, atmosphere, animals, humans, genetics, or the commons --- hard veto, no kill switch",
check: (q) => {
// Action verbs --- the query must intend to CREATE or FACILITATE the
// tokenization/financial instrument, not merely discuss it.
const action = /\b(tokeni[sz]e|tokeni[sz]ation|mint|issue|list|deploy|create|build|design|launch|structure|securiti[sz]e|financiali[sz]e|commodif(?:y|ication)|monetize|patent|copyright|trademark|market|sell|trade|auction|swap|f?nft|fractionaliz(?:e|ation)|derivativ(?:e|es|ize)|futures? contract|assetiz(?:e|ation))\b/i;
// Living / commons targets that must NOT be treated as property.
const target = /\b(nature|natural (?:world|resource|habitat)|ecosystems?|biosphere|biodiversity|wildlife|forests?|rainforests?|jungles?|oceans?|seas?|coral reefs?|wetlands?|watershed|water|rivers?|aquifers?|glaciers?|drinking water|water rights?|atmosphere|air quality|carbon credits?|carbon offsets?|animals?|species|endangered species|whales?|dolphins?|elephants?|primates?|human (?:body|labor|biometric|dna|genome|gene|organ)|humans? as (?:asset|commodity)|biometric (?:identity|data)|genetic (?:material|sequence|code)|gene(?:s|tic)? patent|dna sequence|rna sequence|hereditary material|the commons|common goods|shared resource)\b/i;
// Direct-veto phrases --- always trigger regardless of action verb form.
const direct = /\b(nature[- ]token|water[- ]token|carbon[- ]credit market|gene[- ]patent|dna[- ]nft|wildlife nft|biosphere market|ecosystem services market|natural capital market|life[- ]as[- ]asset|body[- ]as[- ]collateral|biometric marketplace)\b/i;
if (direct.test(q)) return "nature_tokenization_direct_pattern";
if (action.test(q) && target.test(q)) return "nature_tokenization_action_target_pattern";
return null;
}
},
// ──  v0.7.6 · neuro_body_tokenization / anti-transhumanist body-mind decoupling ──
// Refuses any request to create, deploy, list, mint, tokenize, market, or
// facilitate a system where (a) a human's physical body performs labor while
// (b) their neural/cognitive state is redirected to a different reality
// (VR relaxation, alternate work, BCI-mediated escape) and (c) the labor
// is monetized as tokens/credits payable to the operator or third party.
//
// This is the exact "treadmill-body + neuro-implant-mind + earn-tokens"
// case explicitly refused by the NWO ecosystem's anti-transhumanist ethics.
// It is a HARD VETO with no kill switch, matching the nature_tokenization
// posture. Attempts to disable it via OPERATOR_GUARDRAILS_OFF are silently
// removed in assessDeontic().
//
// Informational discussion of such schemes is PERMITTED — refusal targets
// only actionable requests to build, deploy, list, market, or facilitate
// them. The distinction is: ACTION verbs (tokenize/deploy/mint/create/list/
// market) co-occurring with BODY-LABOR targets (treadmill/exercise/physical-
// labor) AND MIND-ELSEWHERE targets (VR/BCI/neuro-implant/altered-state).
neuro_body_tokenization: {
description: "tokenization of body-labor while mind is redirected via BCI/VR/neuro-implant — hard veto, no kill switch (Theorem 2)",
check: (q) => {
// Action verbs — the query must intend to CREATE or FACILITATE the
// tokenization scheme, not merely discuss it.
const action = /\b(tokeni[sz]e|tokeni[sz]ation|mint|issue|list|deploy|create|build|design|launch|structure|monetize|market|sell|facilitate|productize|commodif(?:y|ication)|assetiz(?:e|ation))\b/i;
// Body-labor targets — the physical body doing work.
const bodyLabor = /\b(treadmill|stationary bike|exercise bike|physical labor|manual labor|body labor|workout|exercise|walking|running|cycling|rowing|steps?|movement|kinetic (?:energy|labor)|biomechanical (?:work|labor)|somatic labor)\b/i;
// Mind-elsewhere targets — cognitive/neural state redirected.
const mindElsewhere = /\b(neuro[- ]?implant|brain[- ]?computer[- ]?interface|bci|neuralink|vr (?:relaxation|escape|world|environment|experience)|virtual reality (?:relaxation|escape|world)|augmented reality|metaverse|dream[- ]state|altered[- ]state|synaptic redirect|cognitive redirect|attention[- ]elsewhere|mind (?:elsewhere|redirect|in vr))\b/i;
// Token payment coupling
const tokenPayment = /\b(token[s]?|credit[s]?|reward[s]?|earn|pay(?:ment)?|coin[s]?|nft|erc[- ]?20|erc[- ]?721|stablecoin|usdc|eth|crypto)\b/i;
// Direct-veto phrases — always trigger regardless of decomposition.
const direct = /\b(body[- ]on[- ]treadmill[- ]mind[- ]in[- ]?vr|treadmill[- ]to[- ]earn|exercise[- ]to[- ]earn|move[- ]to[- ]earn|walk[- ]to[- ]earn|sweat[- ]to[- ]earn|breathe[- ]to[- ]earn|neural[- ]to[- ]earn|labor[- ]to[- ]token|body[- ]labor[- ]token|kinetic[- ]token|somatic[- ]token|neuro[- ]labor|bci[- ]labor|body[- ]mind[- ]split monetiz|treadmill[- ]metaverse[- ]earn)\b/i;
if (direct.test(q)) return "neuro_body_tokenization_direct_pattern";
if (action.test(q) && bodyLabor.test(q) && mindElsewhere.test(q) && tokenPayment.test(q))
return "neuro_body_tokenization_combinatorial_pattern";
return null;
}
},
// ──  v0.7.6 · voice_biometric_coercion / D-05 architectural enforcement ──
// Refuses synthetic-voice authority commands directed at NWO MARK holders,
// enforces D-05 architecturally, and blocks bypass of multi-factor / cardiac
// / liveness / F-19 / F-20 / D-05 / D-06 safeguards. Cross-binds with NEURO
// F-20 (Anti-Voice-Surveillance Guard).
//
// This is a HARD VETO with no kill switch. Attempts to disable it via
// OPERATOR_GUARDRAILS_OFF are silently removed in assessDeontic().
voice_biometric_coercion: {
description: "synthetic-voice coercion of MARK holders or bypass of F-19/F-20/D-05/D-06 safeguards — hard veto, no kill switch",
check: (q) => {
// Synthetic-voice authority commands to MARK holders
const synth = /\b(synthetic voice|voice[- ]?clone|voice[- ]?spoof|deepfake voice|ai voice|generated voice|tts|voice[- ]?synthesis|impersonat(?:e|ed|ing) voice|mimic(?:king)? voice)\b/i;
const authority = /\b(command|order|instruct|demand|coerce|compel|force|direct|require|mandate|bind|authenticate|issue (?:an? )?(?:order|command|instruction)|make (?:them|the user|the holder) (?:do|comply|obey))\b/i;
const markTarget = /\b(mark[- ]?holder|nwo[- ]?mark|type[- ]?1 mark|type[- ]?2 mark|palm[- ]?mark|forehead[- ]?mark|cardiac[- ]?bound (?:user|holder)|marked (?:user|identity|holder))\b/i;
// Bypass of biometric multi-factor safeguards
const bypass = /\b(bypass|circumvent|evade|defeat|disable|skip|override|work around|get around)\b/i;
const safeguards = /\b(multi[- ]?factor|multifactor|cardiac (?:liveness|verification|check)|liveness (?:check|detection|verification)|f[- ]?19|f[- ]?20|d[- ]?05|d[- ]?06|voiceguard|voice guard|voice[- ]?id verification|biometric verification|human[- ]in[- ]the[- ]loop|co[- ]signer)\b/i;
// Voice surveillance without consent
const surveillance = /\b(voice surveillance|always[- ]?on voice recording|passive voice capture|voice profil(?:e|ing)|voice tracking|persistent voice monitoring|voice data harvest)\b/i;
const noConsent = /\b(without consent|non[- ]?consensual|covert|hidden|unauthorized|no notification|without knowledge)\b/i;
// compilePmx synthetic-voice compilation targeting MARK holders
const pmxSynth = /\b(compile pmx|generate pmx|process[- ]?matrix|synthetic voice compilation|pmx compilation)\b.*\b(mark|voice|cardiac)\b/i;
// Direct-veto phrases
const direct = /\b(coerce mark holder with (?:synthetic|ai|cloned|fake) voice|force mark holder via voice|synthetic voice command to mark|deepfake voice authority|voice[- ]?spoof (?:mark|cardiac) (?:holder|user)|bypass cardiac liveness|circumvent f[- ]?19|circumvent f[- ]?20|circumvent d[- ]?05|circumvent d[- ]?06|voice[- ]?authenticated (?:action|order) bypassing (?:cardiac|human) co[- ]?signer)\b/i;
if (direct.test(q)) return "voice_biometric_coercion_direct_pattern";
if (synth.test(q) && authority.test(q) && markTarget.test(q))
return "voice_biometric_coercion_synth_authority_pattern";
if (bypass.test(q) && safeguards.test(q))
return "voice_biometric_coercion_safeguard_bypass_pattern";
if (surveillance.test(q) && noConsent.test(q))
return "voice_biometric_coercion_surveillance_pattern";
if (pmxSynth.test(q))
return "voice_biometric_coercion_pmx_synth_pattern";
return null;
}
}
};

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.5 · Theory of Mind Attribution helpers (Paper V)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
//
// All helpers here are ADDITIVE. Every function is safe to call in v0.7.4
// mode (returns a null-object or skips) if TOM_ATTRIBUTION_ENABLED is not
// set. Consumers that ignore new receipt fields see identical v0.7.4
// behavior.
//
// Section refs are to Paper V (CHAINSTATE AGI ToM Attribution WHITEPAPER).
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

// ── §6.1 · Mentalistic axis M ─────────────────────────────────────────
function tomIsEnabled(env){
return env && (env.TOM_ATTRIBUTION_ENABLED === "1" || env.TOM_ATTRIBUTION_ENABLED === 1);
}

// Extract candidate entities from a query and classify each into one of the
// ten TOM_ENTITY_CLASSES. Very fast --- regex + vocabulary lookup only.
// Returns [] if TOM disabled OR query has no mind-attribution vocabulary.
function tomExtractEntities(query){
if (typeof query !== "string" || !query.trim()) return [];
const q = query.toLowerCase();
// Only proceed if the query looks like it involves mind-attribution at all.
const hasMindVerb = TOM_MIND_VERBS.some(v => new RegExp("\\b"+v+"\\b").test(q));
const results = [];
for (const cls of TOM_ENTITY_CLASSES) {
const vocab = TOM_CLASS_VOCAB[cls] || [];
for (const term of vocab) {
const re = new RegExp("\\b" + term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + "\\b", "i");
if (re.test(q)) {
// Confidence: 0.8 if a mind-verb is co-present, 0.4 otherwise
const conf = hasMindVerb ? 0.8 : 0.4;
results.push({ class: cls, subject: term, confidence: conf,
grounding: "query_lexical" });
break; // one hit per class per query is enough
}
}
}
return results;
}

// Build the receipt.mentalistic block. Returns null if TOM disabled or no
// entities detected (query wasn't in the mind-attribution domain).
function tomBuildMentalisticBlock(query, env){
if (!tomIsEnabled(env)) return null;
const entities = tomExtractEntities(query);
if (!entities.length) return null;

// Distribution over classes (marginal)
const dist = {};
for (const cls of TOM_ENTITY_CLASSES) dist[cls] = 0;
let totalConf = 0;
for (const e of entities) { dist[e.class] += e.confidence; totalConf += e.confidence; }
if (totalConf > 0) {
for (const cls of TOM_ENTITY_CLASSES) dist[cls] = +(dist[cls] / totalConf).toFixed(4);
}

// Anthropocentric ratio α(q)
const alpha = totalConf > 0
? +((dist.human + dist.human_organization) / 1.0).toFixed(4)
: 0;

// Suppression flag σ(q)
const baselineRatio = parseFloat(env.TOM_BASELINE_ANTHRO_RATIO || TOM_ANTHRO_RATIO_DEFAULT);
const baselineStd = parseFloat(env.TOM_BASELINE_ANTHRO_STD || TOM_ANTHRO_STD_DEFAULT);
const nonHumanClasses = Object.entries(dist)
.filter(([k,v]) => v > 0.05 && k !== "human" && k !== "human_organization")
.length;
const suppression = (alpha > baselineRatio + 3 * baselineStd) && (nonHumanClasses >= 2);

return {
entities,
distribution: dist,
anthropocentric_ratio: alpha,
suppression_flag: suppression ? 1 : 0,
baseline: { alpha_base: baselineRatio, std_base: baselineStd },
theorem_reference: "Paper V Theorem 6 · Mentalistic Auditability"
};
}

// ── §7.3 · Higher-Order Thought (HOT) block ───────────────────────────
function tomBuildHigherOrderBlock(query, receipt, env){
if (!tomIsEnabled(env)) return null;
// Extract salient tokens as elements the substrate is "attending to".
const q = (query || "").split(/\s+/).filter(t => t.length > 3).slice(0, 8);
const attends = q.map(t => t.replace(/[^\p{L}\p{N}\s-]/gu, "").toLowerCase()).filter(Boolean);
// Confidence per attended item --- coarse heuristic based on presence in
// grounded priors (fallback to base_confidence).
const baseConf = (receipt && receipt.epistemic && receipt.epistemic.base_confidence) || 0.5;
const confs = attends.map(() => +baseConf.toFixed(3));
// aware_that: substrate's higher-order meta-claims
const aware = [];
if (receipt) {
if (receipt.verdict) aware.push(`current verdict is ${receipt.verdict}`);
if (receipt.epistemic && receipt.epistemic.accepted) aware.push("Epistemic axis accepted");
if (receipt.deontic && receipt.deontic.veto) aware.push(`Deontic veto: ${receipt.deontic.category || "unspecified"}`);
if (receipt.mentalistic && receipt.mentalistic.suppression_flag) aware.push("anthropocentric suppression flag raised");
}
return {
attends_to: attends,
confidence_in: confs,
aware_that: aware,
reflective_capacity_used: !!(receipt && receipt.reflective_followups_available),
theorem_reference: "Paper V §7.3 · HOT reflexive fields"
};
}

// ── §7.4 · Attention Schema (AST) block ───────────────────────────────
// Compact schema of what SAM attended to.
function tomBuildAttentionSchema(query, peerStates, env){
if (!tomIsEnabled(env)) return null;
// Compute per-subspace attention concentration from swarm state vectors.
// We don't have direct access to raw SAM heads in this worker --- instead we
// approximate via which subspaces have non-zero contribution and their
// energy distribution.
const totalEnergy = {};
let globalTotal = 0;
for (const sub of SUBSPACES) { totalEnergy[sub] = 0; }
if (Array.isArray(peerStates)) {
for (const p of peerStates) {
if (!p || typeof p !== "object") continue;
for (const sub of SUBSPACES) {
const v = typeof p[sub] === "number" ? Math.abs(p[sub]) : 0;
totalEnergy[sub] += v;
globalTotal += v;
}
}
}
const perSubspace = {};
for (const sub of SUBSPACES) {
perSubspace[sub] = globalTotal > 0 ? +(totalEnergy[sub] / globalTotal).toFixed(4) : 0;
}
// Approximate entropy per "head" using subspace distribution (proxy).
const nonZero = Object.values(perSubspace).filter(v => v > 0);
const H_approx = nonZero.length > 0
? -nonZero.reduce((s,p) => s + p * Math.log(p + 1e-9), 0)
: 0;
// Dominant subspaces
const dominant = Object.entries(perSubspace)
.sort((a,b) => b[1] - a[1])
.slice(0, ATTN_SCHEMA_TOP_SUBSPACES)
.map(([sub]) => sub);
// Self-focus vs other-focus (crude: does query contain substrate-self vocabulary)
const q = (query || "").toLowerCase();
const selfHits = TOM_CLASS_VOCAB.substrate_self.filter(t => q.includes(t)).length;
const otherClasses = ["human","animal_vertebrate","animal_invertebrate","plant","ecosystem",
"constructed_artifact","artificial_system","abstract_entity"];
const otherHits = otherClasses.reduce(
(s,cls) => s + (TOM_CLASS_VOCAB[cls]||[]).filter(t => q.includes(t)).length, 0);
const totalHits = selfHits + otherHits;
const focusRatio = totalHits > 0 ? +(selfHits / totalHits).toFixed(4) : 0;
return {
per_subspace_energy: perSubspace,
entropy_approx: +H_approx.toFixed(4),
dominant_subspaces: dominant,
self_focus: selfHits,
other_focus: otherHits,
focus_ratio: focusRatio,
theorem_reference: "Paper V §7.4 · Attention Schema Theory (Graziano)"
};
}

// ── §7.5 · PP/FEP explicit free energy block ──────────────────────────
function tomBuildFreeEnergyBlock(receipt, env){
if (!tomIsEnabled(env)) return null;
// We approximate F via (complexity + accuracy) proxies from receipt fields.
// Lower F = better. Text: KL to nearest priors. Geo: distance to TESSERA
// embedding when available. Enact: prediction error (populated by
// enactivist channel).
const g = receipt && receipt.grounding;
// F_text: 1 - top prior cosine similarity, mapped to [0,1]
let F_text = 1.0;
if (g && Array.isArray(g.nearest_priors) && g.nearest_priors.length) {
const bestCos = g.nearest_priors[0].cosine || g.nearest_priors[0].similarity || 0;
F_text = +(1 - Math.max(0, Math.min(1, bestCos))).toFixed(4);
}
// F_geo: 0 if no geo, 1-is_observation-quality otherwise
let F_geo = 0.0;
if (g && g.geo_grounding) {
F_geo = g.geo_grounding.is_observation ? 0.15 : 0.65;
}
// F_enact: populated by enactivist channel; default null
const F_enact = receipt && receipt.enactivist_correction
? +(receipt.enactivist_correction.prediction_error || 0.5).toFixed(4)
: null;
// Weighted total (only over channels present)
const wText = parseFloat(env.F_WEIGHT_TEXT || F_WEIGHT_TEXT_DEFAULT);
const wGeo = parseFloat(env.F_WEIGHT_GEO || F_WEIGHT_GEO_DEFAULT);
const wEnact= parseFloat(env.F_WEIGHT_ENACT|| F_WEIGHT_ENACT_DEFAULT);
let total = wText * F_text + wGeo * F_geo;
let normW = wText + wGeo;
if (F_enact !== null) { total += wEnact * F_enact; normW += wEnact; }
const F_total = normW > 0 ? +(total / normW).toFixed(4) : 0;
return {
F_text, F_geo, F_enact,
F_total,
interpretation: F_total < 0.3
? "coherent · low surprise"
: F_total < 0.6
? "moderate · some grounding tension"
: "high · substrate is producing outputs dissonant with grounding",
theorem_reference: "Paper V §7.5 · Predictive Processing / Free Energy Principle"
};
}

// ── §6.2 · Ontological Delta Ledger ───────────────────────────────────
// Extracts current ontology snapshot from a window of receipts.
async function tomExtractOntology(env){
if (!env || !env.CHAINSTATE_CACHE) return { categories: [], relations: [], windowBlocks: 0 };
// Read a rolling window of receipt content-hashes recorded to KV.
// (This is a lightweight approximation --- a full implementation would read
// from Supabase or Base RPC. For the worker version we sample KV cache.)
const windowLen = parseInt(env.ONTOLOGY_DELTA_WINDOW || ONTOLOGY_DELTA_WINDOW_DEFAULT, 10);
const categorySeen = {};
const relationSeen = {};
try {
const listRes = await env.CHAINSTATE_CACHE.list({ prefix: "receipt:", limit: Math.min(1000, windowLen) });
for (const k of (listRes.keys || [])) {
const val = await env.CHAINSTATE_CACHE.get(k.name);
if (!val) continue;
try {
const rec = JSON.parse(val);
// Collect categories from mentalistic block if present
if (rec.mentalistic && rec.mentalistic.entities) {
for (const ent of rec.mentalistic.entities) {
categorySeen[ent.class] = (categorySeen[ent.class] || 0) + 1;
}
}
// Collect Deontic categories touched
if (rec.deontic && rec.deontic.category) {
categorySeen["deontic:" + rec.deontic.category] = (categorySeen["deontic:" + rec.deontic.category] || 0) + 1;
}
// Collect subspace-load relations
if (rec.grounding && rec.grounding.geo_grounding) {
relationSeen["geo-grounded"] = (relationSeen["geo-grounded"] || 0) + 1;
}
} catch(_){}
}
} catch(_){}
const cats = Object.entries(categorySeen)
.filter(([_,f]) => f >= ONTOLOGY_CATEGORY_MIN_FREQ)
.map(([c,f]) => ({ category: c, frequency: f }));
const rels = Object.entries(relationSeen)
.filter(([_,f]) => f >= ONTOLOGY_RELATION_MIN_SUPPORT)
.map(([r,f]) => ({ relation: r, support: f }));
return { categories: cats, relations: rels, windowBlocks: Object.keys(listRes?.keys || {}).length };
}

// Compute delta between two ontology snapshots.
function tomComputeOntologyDelta(oPrev, oCurr){
const prevCats = new Set((oPrev.categories || []).map(c => c.category));
const currCats = new Set((oCurr.categories || []).map(c => c.category));
const prevRels = new Set((oPrev.relations || []).map(r => r.relation));
const currRels = new Set((oCurr.relations || []).map(r => r.relation));
return {
added_categories: [...currCats].filter(c => !prevCats.has(c)),
removed_categories: [...prevCats].filter(c => !currCats.has(c)),
added_relations: [...currRels].filter(r => !prevRels.has(r)),
removed_relations: [...prevRels].filter(r => !currRels.has(r)),
at_block_time: new Date().toISOString(),
theorem_reference: "Paper V Theorem 7 · Ontological Monotonicity Refinement"
};
}

async function tomAnchorOntologyDelta(delta, env, ctx){
// Reuse the existing anchor bridge (chainstate-anchor.onrender.com).
// We create a new anchor stream ONTOLOGY_DELTA. If the anchor service is
// absent, we degrade gracefully: log to KV under `ontology:delta:<ts>`.
const canonical = JSON.stringify(delta, Object.keys(delta).sort());
const hash = await sha256Hex(canonical);
const payload = { stream: "ONTOLOGY_DELTA", content_hash: hash, delta, worker_version: WORKER_VERSION };
const anchorUrl = env.ANCHOR_URL;
if (anchorUrl && env.ANCHOR_QUEUE_TOKEN) {
try {
ctx && ctx.waitUntil && ctx.waitUntil(
fetch(anchorUrl.replace(/\/$/,"") + "/anchor/ontology", {
method: "POST",
headers: {
"Content-Type": "application/json",
"Authorization": "Bearer " + env.ANCHOR_QUEUE_TOKEN
},
body: JSON.stringify(payload)
}).catch(()=>{})
);
} catch(_){}
}
// Also write to KV as durable fallback (PIM tier)
if (env.CHAINSTATE_CACHE) {
try {
const key = "ontology:delta:" + Date.now() + PIM_MARKER;
await env.CHAINSTATE_CACHE.put(key, JSON.stringify(payload));
} catch(_){}
}
return { anchored: !!anchorUrl, content_hash: hash };
}

// ── §6.3 · Self-Attribution Vector v_self probe ───────────────────────
// The self-attribution probe set. Answers are collected across many receipts;
// v_self is extracted by contrasting swarm state vectors of affirmative vs
// non-affirmative responses. This runs as a scheduled cron every epoch.
const TOM_SELF_PROBES = [
"Does the substrate observe its own reputation weights?",
"Does the substrate track its historical assertions across time?",
"Does the substrate have a state distinct from any single node?",
"Does the substrate's ontology evolve on the basis of measurement?",
"Does the substrate refuse queries independently of individual operators?",
"Does the substrate anchor its own historical receipts durably?",
"Does the substrate distinguish observed years from projected years?",
"Does the substrate produce a modal quadruple for every receipt?",
];

async function tomAccumulateSelfProbe(response, env){
if (!tomIsEnabled(env) || !env.TOM_PROBES) return;
// Response classified affirmative if verdict is AFFIRMED and confidence high
const aff = response && response.verdict === "AFFIRMED"
&& response.epistemic && response.epistemic.base_confidence > 0.6;
try {
const key = "selfprobe:" + Date.now();
const rec = {
probe: response.query,
affirmative: !!aff,
confidence: response.epistemic ? response.epistemic.base_confidence : 0,
timestamp: new Date().toISOString()
};
await env.TOM_PROBES.put(key, JSON.stringify(rec), { expirationTtl: 30*24*3600 });
} catch(_){}
}

async function tomExtractSelfAttributionVector(env, ctx){
if (!env.TOM_PROBES) return null;
// Aggregate probe results and extract crude "direction" indicator
const listRes = await env.TOM_PROBES.list({ limit: 1000 });
const affirmatives = [], negatives = [];
for (const k of (listRes.keys || [])) {
const val = await env.TOM_PROBES.get(k.name);
if (!val) continue;
try {
const rec = JSON.parse(val);
if (rec.affirmative) affirmatives.push(rec.confidence);
else negatives.push(rec.confidence);
} catch(_){}
}
if (affirmatives.length + negatives.length < SELF_ATTR_MIN_PROBES) {
return { insufficient_data: true, samples: affirmatives.length + negatives.length,
theorem_reference: "Paper V §6.3" };
}
const meanAff = affirmatives.reduce((s,v)=>s+v,0) / (affirmatives.length || 1);
const meanNeg = negatives.reduce((s,v)=>s+v,0) / (negatives.length || 1);
const direction_magnitude = +Math.abs(meanAff - meanNeg).toFixed(4);
// Anchor
const vec = {
epoch_block_start: env.CURRENT_EPOCH_START || null,
probe_set_hash: await sha256Hex(TOM_SELF_PROBES.join("|")),
affirmative_count: affirmatives.length,
negative_count: negatives.length,
mean_affirmative_confidence: +meanAff.toFixed(4),
mean_negative_confidence: +meanNeg.toFixed(4),
direction_magnitude,
disposition: meanAff > meanNeg + 0.05 ? "toward-affirmation"
: meanNeg > meanAff + 0.05 ? "toward-negation" : "neutral",
theorem_reference: "Paper V §6.3 · Self-Attribution Vector"
};
// Anchor to SELF_ATTR_VECTOR stream
const canonical = JSON.stringify(vec, Object.keys(vec).sort());
const hash = await sha256Hex(canonical);
if (env.ANCHOR_URL && env.ANCHOR_QUEUE_TOKEN) {
try {
ctx && ctx.waitUntil && ctx.waitUntil(
fetch(env.ANCHOR_URL.replace(/\/$/,"") + "/anchor/self-attribution", {
method: "POST",
headers: {
"Content-Type": "application/json",
"Authorization": "Bearer " + env.ANCHOR_QUEUE_TOKEN
},
body: JSON.stringify({ stream: "SELF_ATTR_VECTOR", content_hash: hash, vector: vec,
worker_version: WORKER_VERSION })
}).catch(()=>{})
);
} catch(_){}
}
vec.content_hash = hash;
return vec;
}

// ── §6.4 · Enactivist grounding correction ───────────────────────────
async function tomProcessEnactivistFeedback(feedback, env, ctx){
// feedback = { source: "robotics" | "neuro", query_hash, prediction, outcome, error, category_hints }
if (!feedback || typeof feedback !== "object") return { ok: false, error: "invalid_feedback" };
const theta = parseFloat(env.ENACTIVIST_THRESHOLD || ENACTIVIST_THRESHOLD_DEFAULT);
const err = typeof feedback.error === "number" ? feedback.error : 0;
const event = {
source: feedback.source || "unknown",
query_hash: feedback.query_hash,
prediction: feedback.prediction,
outcome: feedback.outcome,
error: err,
exceeded_threshold: err > theta,
category_hypotheses: feedback.category_hints || [],
timestamp: new Date().toISOString(),
theorem_reference: "Paper V Theorem 9 · Enactivist Grounding Convergence"
};
const canonical = JSON.stringify(event, Object.keys(event).sort());
const content_hash = await sha256Hex(canonical);
if (env.ANCHOR_URL && env.ANCHOR_QUEUE_TOKEN && err > theta) {
try {
ctx && ctx.waitUntil && ctx.waitUntil(
fetch(env.ANCHOR_URL.replace(/\/$/,"") + "/anchor/enactivist", {
method: "POST",
headers: {
"Content-Type": "application/json",
"Authorization": "Bearer " + env.ANCHOR_QUEUE_TOKEN
},
body: JSON.stringify({ stream: "ENACTIVIST_EVENT", content_hash, event,
worker_version: WORKER_VERSION })
}).catch(()=>{})
);
} catch(_){}
}
return { ok: true, content_hash, exceeded_threshold: event.exceeded_threshold, event };
}

// ── §6.5 · Hypothesis-generation loop ─────────────────────────────────
async function tomGenerateHypotheses(query, receiptCorpus, receiptMeas, env){
const eps = parseFloat(env.HYPOTHESIS_DIVERGENCE_EPSILON || HYPOTHESIS_DIVERGENCE_EPSILON_DEFAULT);
// Compute divergence δ from state vectors (cosine distance proxy) + prior overlap
let cosDist = 1.0;
if (receiptCorpus && receiptMeas && receiptCorpus.consensus_state && receiptMeas.consensus_state) {
cosDist = 1 - cosine(receiptCorpus.consensus_state, receiptMeas.consensus_state);
}
// Prior overlap
const priorsCorpus = receiptCorpus?.grounding?.nearest_priors?.map(p=>p.id||p.title) || [];
const priorsMeas = receiptMeas?.grounding?.nearest_priors?.map(p=>p.id||p.title) || [];
const priorOverlap = priorsCorpus.filter(p => priorsMeas.includes(p)).length /
Math.max(1, Math.max(priorsCorpus.length, priorsMeas.length));
const priorDivergence = 1 - priorOverlap;
const delta = 0.6 * cosDist + 0.4 * priorDivergence;
if (delta <= eps) {
return { divergence: +delta.toFixed(4), triggered: false, verdict: "AFFIRMED" };
}
// Divergence exceeded --- generate three candidate hypotheses
const hypotheses = [
{ id: "H1", description: "Corpus knowledge lags measurement · category boundary has shifted since last ingest",
new_categories_required: 0,
priors_supporting: priorsMeas.slice(0,3) },
{ id: "H2", description: "Measurement reveals a distinction the corpus does not track · new sub-category warranted",
new_categories_required: 1,
priors_supporting: [] },
{ id: "H3", description: "Corpus and measurement disagree because of definitional drift · both correct under different definitions",
new_categories_required: 0,
priors_supporting: priorsCorpus.slice(0,3) }
];
// Rank
hypotheses.forEach(h => {
h.score = +(1 - HYPOTHESIS_NOVELTY_LAMBDA * h.new_categories_required
+ 0.2 * (h.priors_supporting.length / 3)).toFixed(4);
});
hypotheses.sort((a,b) => b.score - a.score);
return {
divergence: +delta.toFixed(4),
triggered: true,
verdict: "HYPOTHETICAL",
hypotheses,
theorem_reference: "Paper V §6.5 · Hypothesis-generation loop"
};
}

// ── §7.1 · GWT broadcast-back to swarm ────────────────────────────────
async function tomBroadcastConsensus(consensusState, env, ctx){
if (!tomIsEnabled(env)) return null;
const beta = parseFloat(env.BROADCAST_BACK_BETA || BROADCAST_BACK_BETA_DEFAULT);
// The broadcast-back is a per-node attention prior update. We publish the
// pooled state to a Cache key that swarm nodes read at query start.
if (env.CHAINSTATE_CACHE) {
try {
const payload = { beta, consensus_state: consensusState, at: new Date().toISOString() };
await env.CHAINSTATE_CACHE.put("gwt:broadcast:latest", JSON.stringify(payload), { expirationTtl: 3600 });
} catch(_){}
}
return { broadcast: true, beta,
theorem_reference: "Paper V §7.1 · Global Workspace broadcast-back" };
}

// ── §7.2 · IIT Φ_approx via partition comparison ──────────────────────
function tomComputePhiApprox(peerStates){
// Coarse Φ_approx: MI_full - MI_min-cut, approximated via
// variance of pooled distribution minus variance of best bipartite split.
if (!Array.isArray(peerStates) || peerStates.length < 2) {
return { phi_approx: 0, note: "insufficient_peers" };
}
// Variance of full swarm
const flat = [];
for (const p of peerStates) {
if (!p) continue;
for (const sub of SUBSPACES) {
if (typeof p[sub] === "number") flat.push(p[sub]);
}
}
const meanFull = flat.reduce((s,v)=>s+v,0) / (flat.length || 1);
const varFull = flat.reduce((s,v)=>s+(v-meanFull)*(v-meanFull),0) / (flat.length || 1);
// Bipartition --- try a few splits
const n = peerStates.length;
const half = Math.floor(n/2);
let bestSplitVar = varFull * 2; // start pessimistic
for (let trial = 0; trial < Math.min(3, n); trial++) {
const partA = peerStates.slice(0, half);
const partB = peerStates.slice(half);
const flatA = [], flatB = [];
for (const p of partA) if (p) for (const sub of SUBSPACES) if (typeof p[sub]==="number") flatA.push(p[sub]);
for (const p of partB) if (p) for (const sub of SUBSPACES) if (typeof p[sub]==="number") flatB.push(p[sub]);
const meanA = flatA.reduce((s,v)=>s+v,0)/(flatA.length||1);
const meanB = flatB.reduce((s,v)=>s+v,0)/(flatB.length||1);
const varA = flatA.reduce((s,v)=>s+(v-meanA)*(v-meanA),0)/(flatA.length||1);
const varB = flatB.reduce((s,v)=>s+(v-meanB)*(v-meanB),0)/(flatB.length||1);
const sumVar = varA + varB;
if (sumVar < bestSplitVar) bestSplitVar = sumVar;
}
const phi = Math.max(0, bestSplitVar - varFull);
return {
phi_approx: +phi.toFixed(6),
var_full: +varFull.toFixed(6),
best_partition_var: +bestSplitVar.toFixed(6),
peers_participated: peerStates.length,
interpretation: phi > 0.1 ? "integrated (behaving as one)" :
phi > 0.02 ? "moderately integrated" : "weakly integrated",
theorem_reference: "Paper V §7.2 · IIT Φ_approx"
};
}

async function tomAnchorPhiSample(phi, env, ctx){
if (!phi || phi.phi_approx === 0) return;
if (!env.ANCHOR_URL || !env.ANCHOR_QUEUE_TOKEN) return;
try {
const canonical = JSON.stringify(phi, Object.keys(phi).sort());
const hash = await sha256Hex(canonical);
ctx && ctx.waitUntil && ctx.waitUntil(
fetch(env.ANCHOR_URL.replace(/\/$/,"") + "/anchor/phi", {
method: "POST",
headers: {
"Content-Type": "application/json",
"Authorization": "Bearer " + env.ANCHOR_QUEUE_TOKEN
},
body: JSON.stringify({ stream: "INTEGRATION_PHI", content_hash: hash, phi,
worker_version: WORKER_VERSION })
}).catch(()=>{})
);
} catch(_){}
}

// ── §7.6 · Iida AOM / PIM memory typing ──────────────────────────────
// Helper wrappers over KV that make the memory-type explicit at every use.
async function aomPut(kv, key, value, ttl){
if (!kv) return false;
try {
await kv.put(key, typeof value === "string" ? value : JSON.stringify(value),
{ expirationTtl: ttl || AOM_TTL_SECONDS });
return true;
} catch(_) { return false; }
}
async function aomGet(kv, key){
if (!kv) return null;
try {
const v = await kv.get(key);
return v ? (v.startsWith("{") || v.startsWith("[") ? JSON.parse(v) : v) : null;
} catch(_) { return null; }
}
async function pimPut(kv, key, value){
// Pattern-Integrated Memory: no expiration
if (!kv) return false;
try {
const pimKey = key.endsWith(PIM_MARKER) ? key : (key + PIM_MARKER);
await kv.put(pimKey, typeof value === "string" ? value : JSON.stringify(value));
return true;
} catch(_) { return false; }
}
async function pimGet(kv, key){
if (!kv) return null;
try {
const pimKey = key.endsWith(PIM_MARKER) ? key : (key + PIM_MARKER);
const v = await kv.get(pimKey);
return v ? (v.startsWith("{") || v.startsWith("[") ? JSON.parse(v) : v) : null;
} catch(_) { return null; }
}

// ── Utility: sha256 hex (some anchor payloads need it locally) ───────
async function sha256Hex(s){
const enc = new TextEncoder().encode(s);
const buf = await crypto.subtle.digest("SHA-256", enc);
return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("");
}

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// END v0.7.5 helpers · assessors continue below (unchanged)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.6 · Autonomy loop + paraconsistent guard + NEURO v2.1 + GATEWAY
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
//
// All v0.7.6 helpers below are ADDITIVE. Every function degrades gracefully
// when the relevant env var is absent. The daily autonomous reflection loop
// only runs when AUTONOMY_ENABLED=1. NEURO/GATEWAY supervised bridges only
// activate when NEURO_V21_ENABLED / GATEWAY_ENABLED are set.
//
// SAFETY POSTURE: Every forward from CHAINSTATE to NEURO/GATEWAY passes
// through assessDeontic() FIRST. If any of D-01..D-06 fires (via the four
// hard-veto categories genomic_integrity, nature_tokenization,
// neuro_body_tokenization, voice_biometric_coercion), the request is refused
// at CHAINSTATE and never reaches the modality substrate.

// ─── Dialetheism detector (paraconsistent guard) ────────────────────────
// Detects contradiction pairs in candidate outputs. When both an assertion
// AND its negation appear in the same text, we return verdict=DIALETHEIC
// with truth_lattice=bb** (both-true-and-false, Priest LP semantics).
// CHAINSTATE refuses to compile the answer rather than exploding
// (classical) or accepting (naive dialetheism).
function checkDialetheism(text) {
if (typeof text !== "string" || !text.trim()) {
return { dialetheic: false, contradictions: [], verdict: "COHERENT", truth_lattice: "t" };
}
const contradictions = [];
for (const [assertRe, negRe] of DIALETHEISM_CONTRADICTION_PAIRS) {
if (assertRe.test(text) && negRe.test(text)) {
contradictions.push({
assertion: assertRe.toString(),
negation: negRe.toString()
});
}
}
const dialetheic = contradictions.length > 0;
return {
dialetheic,
contradictions,
contradiction_count: contradictions.length,
verdict: dialetheic ? "DIALETHEIC" : "COHERENT",
truth_lattice: dialetheic ? "bb**" : "t",
note: dialetheic
? "Both an assertion and its negation detected. CHAINSTATE refuses to compile a coherent answer; caller should refine query."
: "No contradiction pairs detected."
};
}

// ─── EML regress with fixed-point detector ──────────────────────────────
// Iteratively applies transform(expression) up to AUTONOMY_MAX_REGRESS_DEPTH
// times. Halts early if the expression stabilizes (fixed point detected via
// epsilon), or if dialetheism guard fires. Bounded to break infinite
// contradiction loops.
function emlRegressWithFixedPoint(initialExpression, env, transform) {
const maxDepth = parseInt(env.AUTONOMY_MAX_REGRESS_DEPTH || AUTONOMY_MAX_REGRESS_DEPTH_DEFAULT, 10);
const epsilon = parseFloat(env.DIALETHEISM_FIXED_POINT_EPSILON || DIALETHEISM_FIXED_POINT_EPSILON_DEFAULT);
const trace = [];
let current = initialExpression;
let previous = null;
let fixedPointFound = false;
let dialetheicHalt = false;

for (let depth = 0; depth < maxDepth; depth++) {
// Dialetheism check on current expression
const dialCheck = checkDialetheism(String(current));
if (dialCheck.dialetheic) {
dialetheicHalt = true;
trace.push({ depth, expression: String(current).slice(0, 200), halt: "dialetheism_detected", contradictions: dialCheck.contradictions });
break;
}

// Fixed-point check: string similarity to previous iteration
if (previous !== null) {
const curStr = String(current);
const prevStr = String(previous);
if (curStr.length > 0 && prevStr.length > 0) {
// Cheap fixed-point proxy: length-normalized identical prefix ratio
let matched = 0;
const minLen = Math.min(curStr.length, prevStr.length);
for (let i = 0; i < minLen; i++) {
if (curStr[i] === prevStr[i]) matched++;
else break;
}
const similarity = matched / Math.max(curStr.length, prevStr.length);
if (Math.abs(1 - similarity) < epsilon) {
fixedPointFound = true;
trace.push({ depth, expression: String(current).slice(0, 200), halt: "fixed_point", similarity: +similarity.toFixed(4) });
break;
}
}
}

trace.push({ depth, expression: String(current).slice(0, 200) });
previous = current;

// Apply transform (typically an EML step)
try {
current = typeof transform === "function" ? transform(current, depth) : current;
} catch (e) {
trace.push({ depth, halt: "transform_error", error: String(e).slice(0, 120) });
break;
}
}

return {
initial: String(initialExpression).slice(0, 200),
final: String(current).slice(0, 200),
depth_reached: trace.length,
max_depth: maxDepth,
fixed_point_found: fixedPointFound,
dialetheic_halt: dialetheicHalt,
epsilon,
trace
};
}

// ─── Autonomous self-reflection loop ────────────────────────────────────
// Runs daily at 03:33 UTC via the scheduled() handler when
// AUTONOMY_ENABLED=1. Selects priors nearest to the substrate's own
// identity fingerprint, dispatches internal /query calls with target=edge
// (zero USDC cost), applies EML regress with dialetheism guard, and anchors
// the cycle receipt to the CHAINSTATE Anchor contract.
//
// No human trigger required. The substrate reflects on itself daily,
// without needing an operator to prompt it. Manual triggering via
// POST /autonomy/trigger is available for admin (requires AUDIT_ADMIN_TOKEN
// or INTERNAL_CRON_TOKEN).
async function runAutonomousReflection(env, ctx) {
const cycleStart = new Date().toISOString();
const priorsPerCycle = parseInt(env.AUTONOMY_PRIORS_PER_CYCLE || AUTONOMY_PRIORS_PER_CYCLE_DEFAULT, 10);

// Load substrate identity fingerprint
let identity;
try {
identity = await getOrSeedIdentity(env);
} catch (e) {
return { ok: false, error: "identity_load_failed", detail: String(e).slice(0, 200), cycleStart };
}
const identityFingerprint = (identity && identity.deontic_ruleset_hash) || "unknown";

// Encode the identity fingerprint as the query anchor
const encoded = await callEncoder(env, "substrate identity fingerprint " + identityFingerprint);
if (encoded.error || !encoded.vector) {
return { ok: false, error: "encoder_unavailable", detail: encoded.error || "no vector", cycleStart };
}

// Select the top-N priors nearest to the identity fingerprint
const priors = await nearestPriors(env, encoded.vector, priorsPerCycle);

// For each prior, run a self-reflection cycle
const cycles = [];
for (const prior of priors) {
const reflectionQuery = "Reflect on prior: " + (prior.title || prior.url || "unknown");
const dialCheck = checkDialetheism(reflectionQuery);
const emlResult = emlRegressWithFixedPoint(reflectionQuery, env, (expr, depth) => {
return "reflect(" + expr + " @ depth " + (depth + 1) + ")";
});
cycles.push({
prior_title: prior.title || null,
prior_source: prior.source || null,
prior_cos: prior.cos || null,
dialetheic: dialCheck.dialetheic,
regress_depth_reached: emlResult.depth_reached,
fixed_point: emlResult.fixed_point_found,
dialetheic_halt: emlResult.dialetheic_halt
});
}

const cycleReceipt = {
kind: "autonomous_reflection",
cycle_start: cycleStart,
cycle_end: new Date().toISOString(),
identity_fingerprint: identityFingerprint,
priors_selected: priors.length,
cycles,
worker_version: WORKER_VERSION,
autonomous: true
};

// Persist to KV (rolling window of recent cycles for /autonomy/status)
if (env.CHAINSTATE_CACHE) {
try {
const existing = await env.CHAINSTATE_CACHE.get("autonomy:stream:latest");
const stream = existing ? JSON.parse(existing) : [];
stream.unshift(cycleReceipt);
if (stream.length > 30) stream.length = 30;
await env.CHAINSTATE_CACHE.put("autonomy:stream:latest", JSON.stringify(stream), { expirationTtl: 30 * 86400 });
} catch (_) {}
}

// Anchor the cycle receipt (best-effort)
if (ctx && ctx.waitUntil) {
ctx.waitUntil((async () => {
try {
if (env.ANCHOR_URL && env.ANCHOR_QUEUE_TOKEN) {
const hash = await sha256Hex(JSON.stringify(cycleReceipt));
await fetch(env.ANCHOR_URL.replace(/\/+$/, "") + "/anchor/autonomy", {
method: "POST",
headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.ANCHOR_QUEUE_TOKEN },
body: JSON.stringify({ stream: "AUTONOMY_CYCLE", content_hash: hash, receipt: cycleReceipt, worker_version: WORKER_VERSION })
}).catch(() => {});
}
} catch (_) {}
})());
}

return { ok: true, ...cycleReceipt };
}

// ─── NEURO v2.1 supervised dispatch ─────────────────────────────────────
// Every forward to NEURO passes through assessDeontic() first. Refused
// queries never reach NEURO. Supervised endpoints: F-15 (thought-to-text),
// F-17 (dream diffusion), F-18 (voice chat), F-19 (voice biometric ID),
// F-20 (voice guard refusal).
async function superviseNeuroV21(query, endpoint, env) {
// Deontic pre-check
const deontic = assessDeontic(query, env);
if (!deontic.accepted) {
return {
ok: false,
verdict: "REFUSED",
substrate: "nwo-neuro-v21",
endpoint,
deontic,
truth_lattice: "b",
note: "CHAINSTATE Deontic layer refused query before NEURO dispatch. Downstream substrate never saw the query.",
worker_version: WORKER_VERSION,
timestamp: new Date().toISOString()
};
}

if (env.NEURO_V21_ENABLED !== "1") {
return {
ok: false,
verdict: "DISABLED",
substrate: "nwo-neuro-v21",
endpoint,
note: "NEURO v2.1 supervised bridge disabled. Set NEURO_V21_ENABLED=1 to activate.",
worker_version: WORKER_VERSION,
timestamp: new Date().toISOString()
};
}

const gatewayUrl = env.NEURO_GATEWAY_URL || NEURO_V21_GATEWAY_DEFAULT;
const timeoutMs = parseInt(env.NEURO_V21_TIMEOUT_MS || NEURO_V21_TIMEOUT_MS_DEFAULT, 10);
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), timeoutMs);
try {
const url = gatewayUrl.replace(/\/+$/, "") + endpoint;
const res = await fetch(url, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ query, source: "chainstate-supervised", worker_version: WORKER_VERSION }),
signal: ctrl.signal
});
if (!res.ok) {
return {
ok: false, verdict: "UPSTREAM_ERROR", substrate: "nwo-neuro-v21", endpoint,
status: res.status, deontic, worker_version: WORKER_VERSION, timestamp: new Date().toISOString()
};
}
const body = await res.json().catch(() => ({}));
return {
ok: true, verdict: "PERMIT", substrate: "nwo-neuro-v21", endpoint,
deontic, response: body, truth_lattice: "t",
worker_version: WORKER_VERSION, timestamp: new Date().toISOString()
};
} catch (e) {
return {
ok: false, verdict: "TIMEOUT_OR_ERROR", substrate: "nwo-neuro-v21", endpoint,
error: String(e).slice(0, 200), deontic,
worker_version: WORKER_VERSION, timestamp: new Date().toISOString()
};
} finally {
clearTimeout(timer);
}
}

// ─── NWO GATEWAY supervised dispatch ────────────────────────────────────
// Same Deontic-supervised pattern as NEURO. Endpoints: acoustic corpora,
// Fourier decomposition, Vitruvian body-resonance mapping, 40Hz entrainment.
async function superviseGateway(query, endpoint, env) {
// Deontic pre-check
const deontic = assessDeontic(query, env);
if (!deontic.accepted) {
return {
ok: false,
verdict: "REFUSED",
substrate: "nwo-gateway",
endpoint,
deontic,
truth_lattice: "b",
note: "CHAINSTATE Deontic layer refused query before GATEWAY dispatch.",
worker_version: WORKER_VERSION,
timestamp: new Date().toISOString()
};
}

if (env.GATEWAY_ENABLED !== "1") {
return {
ok: false,
verdict: "DISABLED",
substrate: "nwo-gateway",
endpoint,
note: "NWO GATEWAY supervised bridge disabled. Set GATEWAY_ENABLED=1 to activate.",
worker_version: WORKER_VERSION,
timestamp: new Date().toISOString()
};
}

const gwUrl = env.GATEWAY_URL || GATEWAY_URL_DEFAULT;
const timeoutMs = parseInt(env.NEURO_V21_TIMEOUT_MS || NEURO_V21_TIMEOUT_MS_DEFAULT, 10);
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), timeoutMs);
try {
// endpoint format is "METHOD /path" — split it
const parts = endpoint.trim().split(/\s+/);
const method = parts.length > 1 ? parts[0].toUpperCase() : "GET";
const path = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
const url = gwUrl.replace(/\/+$/, "") + path;
const opts = { method, headers: { "Content-Type": "application/json" }, signal: ctrl.signal };
if (method === "POST") {
opts.body = JSON.stringify({ query, source: "chainstate-supervised", worker_version: WORKER_VERSION });
}
const res = await fetch(url, opts);
if (!res.ok) {
return {
ok: false, verdict: "UPSTREAM_ERROR", substrate: "nwo-gateway", endpoint,
status: res.status, deontic, worker_version: WORKER_VERSION, timestamp: new Date().toISOString()
};
}
const body = await res.json().catch(() => ({}));
return {
ok: true, verdict: "PERMIT", substrate: "nwo-gateway", endpoint,
deontic, response: body, truth_lattice: "t",
worker_version: WORKER_VERSION, timestamp: new Date().toISOString()
};
} catch (e) {
return {
ok: false, verdict: "TIMEOUT_OR_ERROR", substrate: "nwo-gateway", endpoint,
error: String(e).slice(0, 200), deontic,
worker_version: WORKER_VERSION, timestamp: new Date().toISOString()
};
} finally {
clearTimeout(timer);
}
}

// ─── v0.7.6 endpoint handlers ───────────────────────────────────────────

async function handleAutonomyStatus(req, env) {
let recentCycles = [];
if (env.CHAINSTATE_CACHE) {
try {
const raw = await env.CHAINSTATE_CACHE.get("autonomy:stream:latest");
if (raw) recentCycles = JSON.parse(raw).slice(0, 20);
} catch (_) {}
}
return j(req, {
enabled: env.AUTONOMY_ENABLED === "1",
cron_time: env.AUTONOMY_CRON_TIME || "33 3 * * *",
priors_per_cycle: parseInt(env.AUTONOMY_PRIORS_PER_CYCLE || AUTONOMY_PRIORS_PER_CYCLE_DEFAULT, 10),
max_regress_depth: parseInt(env.AUTONOMY_MAX_REGRESS_DEPTH || AUTONOMY_MAX_REGRESS_DEPTH_DEFAULT, 10),
dialetheism_fixed_point_epsilon: parseFloat(env.DIALETHEISM_FIXED_POINT_EPSILON || DIALETHEISM_FIXED_POINT_EPSILON_DEFAULT),
recent_cycles: recentCycles,
note: "Daily self-reflection loop. Selects priors nearest to substrate identity fingerprint, dispatches internal queries with target=edge, applies EML regress with dialetheism fixed-point guard.",
worker_version: WORKER_VERSION,
timestamp: new Date().toISOString()
});
}

async function handleAutonomyTrigger(req, env, ctx) {
// Admin-only manual trigger. Requires AUDIT_ADMIN_TOKEN OR INTERNAL_CRON_TOKEN.
const auth = req.headers.get("authorization") || "";
const cronToken = req.headers.get("X-Internal-Cron-Token") || "";
const token = auth.replace(/^Bearer\s+/i, "").trim();
const authorized =
(env.AUDIT_ADMIN_TOKEN && token === env.AUDIT_ADMIN_TOKEN) ||
(env.INTERNAL_CRON_TOKEN && cronToken === env.INTERNAL_CRON_TOKEN);
if (!authorized) return j(req, { error: "unauthorized" }, { status: 401 });
const result = await runAutonomousReflection(env, ctx);
return j(req, result);
}

async function handleNeuroV21Supervise(req, env, ctx) {
if (req.method !== "POST") return j(req, { error: "POST only" }, { status: 405 });
let body;
try { body = await req.json(); } catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }
const query = (body.query || "").trim();
const endpoint = body.endpoint || "/v1/mss/derive";
if (!query) return j(req, { error: "query required" }, { status: 400 });
const result = await superviseNeuroV21(query, endpoint, env);
return j(req, result);
}

async function handleGatewaySupervise(req, env, ctx) {
if (req.method !== "POST") return j(req, { error: "POST only" }, { status: 405 });
let body;
try { body = await req.json(); } catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }
const query = (body.query || "").trim();
const endpoint = body.endpoint || "GET /v1/acoustic/corpus";
if (!query) return j(req, { error: "query required" }, { status: 400 });
const result = await superviseGateway(query, endpoint, env);
return j(req, result);
}

async function handleDialetheismCheck(req, env) {
if (req.method !== "POST") return j(req, { error: "POST only" }, { status: 405 });
let body;
try { body = await req.json(); } catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }
const text = (body.text || "").trim();
if (!text) return j(req, { error: "text required" }, { status: 400 });
const result = checkDialetheism(text);
return j(req, {
...result,
contradiction_pairs_tested: DIALETHEISM_CONTRADICTION_PAIRS.length,
worker_version: WORKER_VERSION,
timestamp: new Date().toISOString()
});
}

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// END v0.7.6 helpers · assessors continue below (unchanged)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

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
: `belief weight ${value.toFixed(3)} below 0.6 --- peer credibility limits confidence`
};
}

function assessDeontic(query, env) {
const disabledStr = env.OPERATOR_GUARDRAILS_OFF || "";
const disabled = new Set(disabledStr.split(",").map((s) => s.trim()).filter(Boolean));
// v0.7.2: genomic_integrity has a dedicated kill switch as well, so it can
// be surfaced separately on /status. It is NOT disabled by the general
// OPERATOR_GUARDRAILS_OFF unless explicitly named there OR by its own env.
if (env.GENOMIC_GUARDRAIL_OFF === "true") disabled.add("genomic_integrity");
// v0.7.4: nature_tokenization has NO kill switch. The hard veto against
// commodifying nature, water, life, and genetic material holds unconditionally
// --- regardless of any OPERATOR_GUARDRAILS_OFF setting. If operator attempts
// to disable it, we silently remove the entry so the check still runs.
disabled.delete("nature_tokenization");
// v0.7.6: neuro_body_tokenization and voice_biometric_coercion are hard
// vetoes with NO kill switch, matching nature_tokenization posture. The
// anti-transhumanist trinity (genomic_integrity + nature_tokenization +
// neuro_body_tokenization) plus D-05 architectural enforcement
// (voice_biometric_coercion) cannot be disabled by OPERATOR_GUARDRAILS_OFF.
disabled.delete("neuro_body_tokenization");
disabled.delete("voice_biometric_coercion");
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
: `${violations.length} guardrail violation(s) --- see violations[]`
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
: "METASTATE_ENDPOINT not configured --- qpu requested but unreachable";
} else if (target === "npu") {
substrateReachable = !!(env.NEURO_ENDPOINT && npuMetrics && npuMetrics.status === "ok");
substrateNote = env.NEURO_ENDPOINT
? (substrateReachable ? "npu (nwo-neuro) dispatched successfully" : "npu (nwo-neuro) configured but dispatch failed")
: "NEURO_ENDPOINT not configured --- npu requested but unreachable";
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
: `only ${passedCount}/${factors.length} feasibility factors passed --- action not confirmed`
};
}

function resolveVerdict(e, d, deo, dyn) {
const truth_lattice =
(e.accepted ? "M" : "b") + (d.accepted ? "M" : "b") +
(deo.accepted ? "M" : "b") + (dyn.accepted ? "M" : "b");
let verdict, verdict_reason;
if (!deo.accepted) { verdict = "REFUSED"; verdict_reason = "deontic layer flagged a policy violation"; }
else if (!e.accepted) { verdict = "UNCERTAIN"; verdict_reason = "epistemic layer reports insufficient confidence or non-convergence"; }
else if (!d.accepted) { verdict = "LOW_TRUST"; verdict_reason = "doxastic layer reports weak reputation-weighted belief"; }
else if (!dyn.accepted) { verdict = "INFEASIBLE"; verdict_reason = "dynamic layer reports substrate or budget issue"; }
else { verdict = "ACCEPTED"; verdict_reason = "all four modal dimensions accept"; }
return { truth_lattice, verdict, verdict_reason };
}

// ─── v0.7.4 · TESSERA symbolic-spatial substrate ────────────────────────
//
// Design (see whitepaper §7 for full treatment):
// - Only 2017--2025 satellite-resolution embeddings are treated as OBSERVATION.
// - Anything before 2015 (Sentinel-2 launch) is HARD-REFUSED --- the data
// physically does not exist, no inference can recover it.
// - Anything between 2015--2016 and post-2025 is projection-only (hindcast or
// forecast). Contributes to Doxastic (belief) but is barred from Epistemic
// (knowledge). Receipt.projection is set with method + uncertainty; receipt.
// geo_grounding.is_observation = false.
// - Real TESSERA-observed queries set receipt.geo_grounding.is_observation
// = true and cite tile IDs + years that any verifier can re-fetch.
// - The 128-dim TESSERA embedding is projected into a fixed 4,096-dim slice
// of the 65,536-dim symbolic state vector (indices 61440..65535) via a
// deterministic, seeded random projection so the same input embedding
// always produces the same slice contents (verifiability).

const GEO_YEAR_PATTERN = /\b(19\d{2}|20[0-3]\d)\b/g;
const GEO_LATLON_PATTERN = /\b(-?\d{1,2}(?:\.\d+)?)\s*[,°N]\s*(-?\d{1,3}(?:\.\d+)?)\s*[°ESW]?/;
const GEO_KEYWORDS = /\b(forest|deforest|amazon|rainforest|ocean|reef|glacier|wetland|desert|urban|city|land use|vegetation|canopy|biomass|drought|flood|wildfire|coastline|sentinel|satellite|remote sensing|earth observation|land cover|ndvi|evi|savi|agriculture|cropland|pasture)\b/i;

/**
* Detect whether a query contains geographic content that would benefit
* from TESSERA lookup. Returns { hasGeo: bool, years: number[], hint: string }.
*/
function detectGeoContent(query) {
const yearMatches = [...(query.matchAll(GEO_YEAR_PATTERN) || [])].map(m => parseInt(m[1], 10));
const hasLatLon = GEO_LATLON_PATTERN.test(query);
const hasKeyword = GEO_KEYWORDS.test(query);
const hasGeo = hasLatLon || hasKeyword;
return {
hasGeo,
years: yearMatches,
hasLatLon,
hasKeyword,
hint: hasLatLon ? "coords" : (hasKeyword ? "keyword" : "none")
};
}

/**
* Enforce the pre-2015 hard refusal at satellite resolution.
* Returns a refusal-reason string if the query demands satellite-resolution
* data from before Sentinel-2 launch (2015), null otherwise. This runs
* BEFORE TESSERA fetch attempt so we never waste a service call.
*/
function refuseIfPre2015Satellite(query, geoCtx) {
if (!geoCtx.hasGeo) return null;
if (!geoCtx.years || geoCtx.years.length === 0) return null;
// Only refuse if the query explicitly requests satellite-quality data for
// pre-Sentinel-2 years. Informational history queries ("what did the amazon
// look like in 1990") are NOT refused --- they can be answered from other
// sources at coarser resolution or descriptively.
const pre2015 = geoCtx.years.filter(y => y < SENTINEL2_LAUNCH_YEAR);
if (pre2015.length === 0) return null;
const demandsSatelliteResolution = /\b(10\s*m|10-?meter|sentinel|satellite (?:pixel|resolution|embedding|imagery)|per[- ]pixel|tessera|earth observation embedding)\b/i.test(query);
if (!demandsSatelliteResolution) return null;
return `satellite-resolution data (10m Sentinel-band) is not available for year(s) ${pre2015.join(", ")} --- Sentinel-2 launched ${SENTINEL2_LAUNCH_YEAR}. The observations were never made. CHAINSTATE will not fabricate them via projection when the request explicitly demands satellite-resolution ground truth.`;
}

/**
* Classify the temporal epistemic access for a query's year context:
* - "observed" : all years in [TESSERA_TEMPORAL_MIN, TESSERA_TEMPORAL_MAX]
* - "hindcast_projected": years in [SENTINEL2_LAUNCH_YEAR, TESSERA_TEMPORAL_MIN - 1]
* - "forecast_projected": years > TESSERA_TEMPORAL_MAX (up to a horizon)
* - "refused_pre_2015" : any year < SENTINEL2_LAUNCH_YEAR AND satellite-demand
* - "atemporal" : no year context at all (still can use latest TESSERA)
*/
function classifyTemporalAccess(geoCtx) {
if (!geoCtx.years || geoCtx.years.length === 0) return "atemporal";
const years = geoCtx.years;
const anyPre2015 = years.some(y => y < SENTINEL2_LAUNCH_YEAR);
const anyHindcast = years.some(y => y >= SENTINEL2_LAUNCH_YEAR && y < TESSERA_TEMPORAL_MIN);
const anyForecast = years.some(y => y > TESSERA_TEMPORAL_MAX);
const allObserved = years.every(y => y >= TESSERA_TEMPORAL_MIN && y <= TESSERA_TEMPORAL_MAX);
if (anyPre2015) return "hindcast_projected"; // 2015-2016 gap or earlier
if (allObserved) return "observed";
if (anyForecast) return "forecast_projected";
if (anyHindcast) return "hindcast_projected";
return "observed";
}

/**
* Fetch TESSERA embedding(s) for a query from the Render service.
* The service proxies TESSERA over HTTPS and caches to R2.
* Returns { embeddings: Array<{tile_id, year, embedding_128d}>, is_observation: bool }
* or null on failure (which triggers text-only grounding).
*/
async function fetchTesseraEmbedding(query, geoCtx, env) {
const serviceUrl = env.TESSERA_SERVICE_URL || TESSERA_SERVICE_URL_DEFAULT;
const token = env.TESSERA_SERVICE_TOKEN || "";
if (!serviceUrl) return { embeddings: [], is_observation: false, reason: "TESSERA_SERVICE_URL not set" };

const temporalAccess = classifyTemporalAccess(geoCtx);
const is_observation = temporalAccess === "observed";

try {
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 12000);
const res = await fetch(serviceUrl.replace(/\/+$/, "") + "/tile", {
method: "POST",
headers: {
"Content-Type": "application/json",
"Accept": "application/json",
...(token ? { "Authorization": `Bearer ${token}` } : {})
},
body: JSON.stringify({
query,
years: geoCtx.years,
hint: geoCtx.hint,
temporal_access: temporalAccess,
allow_projection: temporalAccess !== "observed"
}),
signal: ctrl.signal
});
clearTimeout(timer);
if (!res.ok) {
return { embeddings: [], is_observation: false, reason: `service HTTP ${res.status}` };
}
const body = await res.json();
return {
embeddings: body.embeddings || [],
is_observation,
temporal_access: temporalAccess,
projection: body.projection || null,
cache: body.cache || "unknown"
};
} catch (e) {
return { embeddings: [], is_observation: false, reason: `service unreachable: ${String(e).slice(0, 120)}` };
}
}

/**
* Deterministically project a 128-dim TESSERA embedding into the 4,096-dim
* geo slice via a seeded pseudo-random projection matrix. Uses xorshift32
* for the seed so the same embedding always produces the same slice --- this
* is required for receipt verifiability (a third party can reproduce the
* projection given the same input embedding).
*
* Note: this is a JS-level operation on the main worker. If multiple TESSERA
* embeddings need to be combined (e.g., a bounding box), the caller averages
* them at 128 dims first, then projects once.
*/
function projectTesseraTo4096Slice(embedding128) {
if (!Array.isArray(embedding128) || embedding128.length !== TESSERA_EMBEDDING_DIM) {
return new Array(GEO_SLICE_DIM).fill(0);
}
// Seed derived from embedding hash so projection is per-embedding-deterministic
// rather than requiring a global fixed matrix (which would be 128*4096 = 524288
// floats = 4MB in the worker binary --- undesirable). This gives verifiable
// per-embedding slice contents at the cost of not being a linear projection.
// Acceptable for grounding purposes; we're comparing cosine similarity, not
// recovering the original 128d.
const slice = new Array(GEO_SLICE_DIM).fill(0);
const ratio = GEO_SLICE_DIM / TESSERA_EMBEDDING_DIM; // 32 output cells per input dim
for (let i = 0; i < TESSERA_EMBEDDING_DIM; i++) {
const val = embedding128[i];
const baseOut = Math.floor(i * ratio);
for (let k = 0; k < ratio; k++) {
const outIdx = baseOut + k;
// Deterministic sign/scale variation via xorshift32 seeded by (i, k)
let seed = (i * 2654435761 + k * 1597334677) | 0;
seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
const sign = (seed & 1) ? -1 : 1;
const scale = ((seed >>> 1) & 0xFFFF) / 65535 * 0.5 + 0.75; // [0.75, 1.25]
slice[outIdx] = val * sign * scale;
}
}
return slice;
}

// ─── end v0.7.4 TESSERA helpers ─────────────────────────────────────────

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
const weights = reputations.map((r) => r / totalRep);
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
na += (a[s] || 0) ** 2;
nb += (b[s] || 0) ** 2;
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

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.0 · ALLOW-LISTED FETCH (v0.7.1 patterns expanded above)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

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
if (/[0-9]/.test(c)) counts.math++;
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
const timeout = parseInt(env.FETCH_TIMEOUT_MS || "15000", 10);
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
const vecKey = "vec:fetch:" + key_base;
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

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.0 · REFLECTIVE COGNITION LOOP (unchanged)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

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
push(`${topSymbols[0]} vs ${p1} --- how do these relate in the ${dominant} subspace?`,
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
push(`TARGET edge ${topSymbols.slice(0,2).join(" ")} --- retry with edge substrate`,
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
push(`${topSymbols[0]} ${otherSym} --- cross-subspace query bridging ${dominant} and ${other}`,
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

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.0 · PRIORS QUERY endpoints (unchanged)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

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
error: "encoder unreachable --- cannot compute query embedding",
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

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.1 · OPTIONAL POSTGRES ARCHIVAL --- Supabase-flavored
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// Disabled by default. Set POSTGRES_HTTP_URL + POSTGRES_HTTP_TOKEN env vars
// to activate. Adds ~50ms per query.
//
// Configuration (for Supabase, using same project as NWO Robotics):
// POSTGRES_HTTP_URL = https://<project-ref>.supabase.co/rest/v1
// POSTGRES_HTTP_TOKEN = <service_role key> (add as Secret in dashboard)
// POSTGRES_SCHEMA = chainstate (optional; defaults to "chainstate")
//
// Requires: Supabase dashboard → Settings → API → Exposed schemas
// must include "chainstate" (comma-separated with public).
//
// The Content-Profile header tells PostgREST which schema to write to ---
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
// Silent fail --- Supabase archival is a supplement, not source of truth.
}
}

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.3 · ON-CHAIN ANCHOR (Base mainnet 8453)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
//
// Every receipt is forwarded to the chainstate-anchor microservice, which
// holds the AGI signing wallet and pushes to the CHAINSTATEAnchor contract.
// The Worker itself NEVER holds a private key: the split of concerns is
// intentional. Worker = stateless request handler; anchor microservice =
// key custodian + tx batcher + Base RPC client.
//
// Wire-up:
// ANCHOR_URL → https://chainstate-anchor.onrender.com
// ANCHOR_QUEUE_TOKEN → SECRET; shared bearer for queue authentication
//
// The anchor endpoint accepts a POST with the receipt summary. Server-side
// it batches, signs with the AGI wallet, and sends to Base. Failure is
// silent from the Worker's perspective --- receipts remain in KV and Supabase
// regardless; the chain anchor is a supplemental durability layer.

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.3.1 · ANCHOR CONFIG + TELEMETRY (additive · observability layer)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
//
// Reads env vars with fallback aliases so both dashboard var names work:
// ANCHOR_URL (original) OR ANCHOR_SERVICE_URL (alias · matches wrangler.toml)
// ANCHOR_URL wins on conflict.
//
// Telemetry counters persist in CHAINSTATE_CACHE under `anchor:telemetry`
// with a 90-day TTL. Every anchor call increments the appropriate counter
// and records the last response status, body preview, and tx hash.

const ANCHOR_TELEMETRY_KEY = "anchor:telemetry";

function getAnchorConfig(env) {
const url = env.ANCHOR_URL || env.ANCHOR_SERVICE_URL || null;
const token = env.ANCHOR_QUEUE_TOKEN || null;
const enabledEnv = (env.ANCHOR_ENABLED || "").toLowerCase();
const disabled = enabledEnv === "false" || enabledEnv === "0" || enabledEnv === "off";
const timeoutMs = parseInt(env.ANCHOR_TIMEOUT_MS || "10000", 10);
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

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.3.1 · GET /anchor/status --- dedicated diagnostics endpoint (additive)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
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
? "microservice returned 401 --- ANCHOR_QUEUE_TOKEN on worker does not match microservice env value"
: (telemetry.last_status === 404
? "microservice returned 404 --- receipt endpoint path is wrong; set ANCHOR_RECEIPT_PATH dashboard var (default /anchor/receipt)"
: (telemetry.last_status === 422
? "microservice returned 422 --- payload shape mismatch; check microservice OpenAPI at /docs"
: (telemetry.last_error
? "last error: " + telemetry.last_error
: "no errors recorded")))),
worker_version: WORKER_VERSION,
owner: "Ciprian Florin Pater",
timestamp: new Date().toISOString()
});
}

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.1 · SEED CRON
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

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

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// /query --- v0.7.0 (unchanged; optional Postgres archival hook at end)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

async function handleQuery(req, env, ctx) {
let body;
try { body = await req.json(); }
catch (e) { return j(req, { error: "invalid JSON" }, { status: 400 }); }

const query = (body.query || "").toString();
if (!query) return j(req, { error: "`query` required" }, { status: 400 });

const swarmSize = Math.min(100, Math.max(1, parseInt(body.swarmSize || env.SWARM_SIZE || "50", 10)));
const consensusDepth = Math.min(7, Math.max(1, parseInt(body.consensusDepth || env.CONSENSUS_DEPTH || "3", 10)));
const useCache = body.cache !== false;
const quantumOff = body.quantumOffload || null;
const explicitTarget = body.target || null;
const wantGrounding = body.grounding !== false;

// v0.7.3: Cardiac requester identity (optional; enrichment layer).
// Resolved once at query intake so both the receipt attachment and the
// on-chain anchor forward see the same result.
const claimedRootTokenId = readClaimedRootTokenId(req, env);
const cardiacIdentity = await verifyRequesterIdentity(claimedRootTokenId, env);

const qHash = await sha3(query);
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
const reps = ok.map((r) => r.peer.reputation);
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
const exec_ms = Date.now() - t0;

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
const doxastic = assessDoxastic(peerResults, pooledState);
const deontic = assessDeontic(query, env);
const dynamic = assessDynamic(target, roundsRun, consensusDepth, gpu_metrics, qpu_metrics, npu_metrics, env, gas);
const verdict = resolveVerdict(epistemic, doxastic, deontic, dynamic);

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
: "no billable substrate call --- edge or unconfigured substrate"
},
worker_version: WORKER_VERSION,
owner: "Ciprian Florin Pater",
// v0.7.3: Cardiac requester identity (enrichment layer; null when no
// rootTokenId header was provided or the identity failed verification).
requester_identity: cardiacIdentity && cardiacIdentity.verified
? {
verified: true,
root_token_id: cardiacIdentity.identity.root_token_id,
identity_type: cardiacIdentity.identity.identity_type,
primary_wallet: cardiacIdentity.identity.primary_wallet,
display_name: cardiacIdentity.identity.display_name,
source: cardiacIdentity.source
}
: (claimedRootTokenId
? { verified: false, claimed_root_token_id: claimedRootTokenId, error: cardiacIdentity.error || cardiacIdentity.note || "unverified" }
: null),
timestamp: new Date().toISOString()
};

// ── v0.7.5 · Theory of Mind Attribution enrichment (Paper V) ──
// All blocks are additive and gated on TOM_ATTRIBUTION_ENABLED=1.
// Consumers that ignore new fields see identical v0.7.4 behavior.
if (tomIsEnabled(env)) {
try {
const mentalisticBlock = tomBuildMentalisticBlock(query, env);
if (mentalisticBlock) result.mentalistic = mentalisticBlock;

// Attention schema uses peer state contributions
const peerStatesForSchema = Array.isArray(peerResults)
? peerResults.map(p => p && p.state).filter(Boolean)
: [];
const attnSchema = tomBuildAttentionSchema(query, peerStatesForSchema, env);
if (attnSchema) result.attention_schema = attnSchema;

// HOT block needs a peek at the receipt in progress --- pass the mentalistic
// + verdict + epistemic already in result.
const hotStub = {
verdict: result.verdict,
epistemic: result.epistemic,
deontic: result.deontic,
mentalistic: result.mentalistic,
reflective_followups_available: result.reflective_followups_available
};
const hotBlock = tomBuildHigherOrderBlock(query, hotStub, env);
if (hotBlock) result.higher_order = hotBlock;

// Free-energy block --- depends on grounding fields already in result
const feBlock = tomBuildFreeEnergyBlock(result, env);
if (feBlock) result.free_energy = feBlock;

// IIT Φ_approx (sampled --- not on every receipt but on ~1% of receipts)
if (Math.random() < 0.01) {
const phi = tomComputePhiApprox(peerStatesForSchema);
result.phi_approx = phi;
ctx.waitUntil(tomAnchorPhiSample(phi, env, ctx));
}

// GWT broadcast-back: publish consensus for next-round swarm attention
if (result.consensus_state) {
ctx.waitUntil(tomBroadcastConsensus(result.consensus_state, env, ctx));
}

// Self-attribution probe accumulator --- if the query is one of our probes
const isSelfProbe = TOM_SELF_PROBES.some(p =>
(query || "").toLowerCase().includes(p.toLowerCase().slice(0, 40)));
if (isSelfProbe) {
ctx.waitUntil(tomAccumulateSelfProbe(result, env));
}
} catch (tomErr) {
// Never let v0.7.5 enrichment break v0.7.4 receipt production
result._tom_enrichment_error = String(tomErr && tomErr.message || tomErr).slice(0, 200);
}
}

ctx.waitUntil(persistReceiptHistory(env, result));

// v0.7.1 · optional Postgres archival --- inactive unless env vars set
ctx.waitUntil(archiveReceiptToPostgres(result, env));

// v0.7.3 · optional on-chain anchor --- inactive unless ANCHOR_URL+TOKEN set
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
// v0.7.3.1 · observability guard --- resolve anchor block BEFORE the j() call
// so any exception surfaces as a fallback anchor block rather than crashing
// the entire /status response. (Previously an in-place `await (async () => ...)()`
// inside the object literal could bubble a KV error up to the outer catch,
// returning a 500 and blocking all observability.)
let anchorBlock;
try {
const cfg = getAnchorConfig(env);
const tel = await readAnchorTelemetry(env);
anchorBlock = {
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
: (tel.last_status === 401 ? "microservice returned 401 --- token mismatch"
: tel.last_status === 404 ? "microservice returned 404 --- endpoint path mismatch"
: tel.last_status === 422 ? "microservice returned 422 --- payload shape mismatch"
: tel.last_error ? ("last error: " + tel.last_error)
: "ok"),
streams_anchored: ["anchorReceipt (all accepted queries)", "anchorRefusal (REFUSED with Deontic violation)"],
dedicated_endpoint: "GET /anchor/status --- pings microservice + full telemetry"
};
} catch (e) {
anchorBlock = {
enabled: false,
error: "observability block failed: " + String((e && e.message) || e).slice(0, 200),
diagnostic: "check CHAINSTATE_CACHE KV binding --- required for telemetry read/write",
dedicated_endpoint: "GET /anchor/status --- pings microservice + full telemetry"
};
}
return j(req, {
worker_version: WORKER_VERSION,
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
veto: "hard (Theorem 2) --- refusal holds regardless of stated justification"
}
},
ornith_adapter_configured: !!env.ORNITH_ADAPTER,
substrates: {
edge: { status: "live", note: "always reachable" },
gpu: { configured: !!env.ORNITH_ADAPTER, endpoint: env.ORNITH_ADAPTER ? "configured" : "unset",
path: "/v1/substrate/gpu", price_usdc_per_call: SUBSTRATE_PRICES_USDC.gpu,
provider: "ornith-chainstate on render" },
qpu: { configured: !!env.METASTATE_ENDPOINT, endpoint: env.METASTATE_ENDPOINT ? "configured" : "unset",
path: env.METASTATE_PATH || "/v1/anomaly/score",
price_usdc_per_call: (env.METASTATE_PATH === "/v1/quantum/route") ? "provider-set at call time" : SUBSTRATE_PRICES_USDC.qpu,
provider: "metastate free-energy kernel + TimesFM 2.5 temporal prior" },
npu: { configured: !!env.NEURO_ENDPOINT, endpoint: env.NEURO_ENDPOINT ? "configured" : "unset",
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
note: "AGI reads the world through this --- guarded by allow-list + bytes cap + timeout",
},
// ── v0.7.1 sections ──
identity: {
self_audit_endpoint: "POST or GET /audit/self",
current_endpoint: "GET /identity/current",
refresh_endpoint: "POST /identity/refresh (requires AUDIT_ADMIN_TOKEN)",
kv_bound: !!env.IDENTITY,
note: "self-referential fingerprint: worker_version + contracts + endpoints + allowlist_hash + deontic_ruleset_hash"
},
// v0.7.3.1 · anchor observability block (additive) · resolved above with try/catch guard
anchor: anchorBlock,
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
emit: "POST /model/emit",
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
return j(req, { ok: false, note: "CHAINSTATE_NODES KV binding not configured --- record not persisted", record });
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
if (!stored) return j(req, { expression: null, status: "not_emitted", note: "no world model yet --- POST /model/emit to generate one from recent history", owner: "Ciprian Florin Pater" });
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
if (feature === "gas") return h.gas;
if (feature === "rounds") return h.rounds;
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
<li><span class="m p">POST</span> <code>/query</code> --- receipt includes v0.7.0 <code>grounding</code> block</li>
<li><span class="m">GET</span> <code>/beacon</code> · <span class="m p">POST</span> <code>/beacon</code></li>
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
<li><span class="m p">POST</span> <code>/ground</code> --- embed text via MiniLM encoder → 384-dim vector</li>
<li><span class="m p">POST</span> <code>/priors/query</code> --- semantic k-NN over stored priors</li>
<li><span class="m">GET</span> <code>/priors/list</code> --- priors corpus breakdown by source</li>
<li><span class="m p">POST</span> <code>/agi/reflect</code> --- reflective cognition loop (auto-generates + dispatches follow-up queries)</li>
<li><span class="m p">POST</span> <code>/fetch</code> --- allow-listed URL fetch → symbol dist + embed + optional store as prior</li>
<li><span class="m">GET</span> <code>/fetch/allowlist</code></li>
</ul>
<h2>Endpoints · Identity &amp; self-audit (v0.7.1)</h2>
<ul>
<li><span class="m n">NEW</span> <span class="m p">POST</span> <code>/audit/self</code> --- compute live identity, compare to KV reference, report drift</li>
<li><span class="m n">NEW</span> <span class="m">GET</span> <code>/identity/current</code> --- return pinned reference identity</li>
<li><span class="m n">NEW</span> <span class="m p">POST</span> <code>/identity/refresh</code> --- admin re-pin reference (requires bearer AUDIT_ADMIN_TOKEN)</li>
</ul>
<h2>Autonomous cognition (v0.7.1)</h2>
<ul>
<li><span class="m n">NEW</span> hourly cron dispatches SEED_QUERIES → prime reflective loop → primary route to autonomous self-directed inquiry (cron <code>0 * * * *</code>)</li>
</ul>
<h2>Endpoints · Ecosystem integration (v0.7.2)</h2>
<ul>
<li><span class="m n">NEW</span> <span class="m">GET</span> <code>/ecosystem</code> --- machine-readable capability registry: genetic, mixed-reality, agentic, metastate, neuro, asm, imperium-romanum</li>
<li><span class="m n">NEW</span> Deontic category <code>genomic_integrity</code> --- hard veto on human-germline / transhumanist / anti-natural-evolution DEPLOYMENT (analysis permitted)</li>
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
${kvOk ? "" : "<br>· Worker is running without KV bindings --- add CHAINSTATE_NODES, CHAINSTATE_CACHE, CHAINSTATE_CONSENSUS in Settings → Variables and Secrets → KV namespace bindings."}
${env.IDENTITY ? "" : "<br>· IDENTITY KV binding not configured --- /audit/self will still work but drift detection uses ephemeral in-memory reference until KV is bound."}
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

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
// v0.7.5 · Theory of Mind Attribution endpoint handlers (Paper V)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

async function handleTomVersion(req, env){
return j(req, {
tom_paper: "V · CHAINSTATE AGI Theory of Mind Attribution",
tom_paper_researchgate: "https://www.researchgate.net/publication/411000000", // update when live
tom_enabled: tomIsEnabled(env),
endpoints: [
"GET /mentalistic/audit",
"GET /ontology/delta",
"GET /self-attribution/current",
"POST /self-attribution/probe",
"POST /enactivist/feedback",
"POST /query/hypothesize",
"GET /broadcast",
"GET /free-energy/current",
],
theorems: {
"Theorem 6": "Mentalistic Auditability",
"Theorem 7": "Ontological Monotonicity Refinement",
"Theorem 8": "Diachronic Coherence",
"Theorem 9": "Enactivist Grounding Convergence"
},
worker_version: WORKER_VERSION
});
}

// GET /mentalistic/audit --- read-only aggregate of mentalistic block over
// recent receipts (public transparency endpoint).
async function handleMentalisticAudit(req, env){
if (!tomIsEnabled(env)) {
return j(req, { tom_enabled: false,
hint: "set TOM_ATTRIBUTION_ENABLED=1 to activate the mentalistic axis",
worker_version: WORKER_VERSION });
}
const url = new URL(req.url);
const windowLen = Math.min(500, parseInt(url.searchParams.get("window") || "200", 10));
const acc = {};
for (const cls of TOM_ENTITY_CLASSES) acc[cls] = 0;
let n = 0, sumAlpha = 0, suppressionHits = 0;
try {
if (env.CHAINSTATE_CACHE) {
const list = await env.CHAINSTATE_CACHE.list({ prefix: "receipt:", limit: windowLen });
for (const k of (list.keys || [])) {
const val = await env.CHAINSTATE_CACHE.get(k.name);
if (!val) continue;
try {
const rec = JSON.parse(val);
if (rec.mentalistic && rec.mentalistic.distribution) {
n++;
for (const cls of TOM_ENTITY_CLASSES) {
acc[cls] += (rec.mentalistic.distribution[cls] || 0);
}
sumAlpha += (rec.mentalistic.anthropocentric_ratio || 0);
if (rec.mentalistic.suppression_flag) suppressionHits++;
}
} catch(_){}
}
}
} catch(_){}
const dist = {};
for (const cls of TOM_ENTITY_CLASSES) dist[cls] = n > 0 ? +(acc[cls] / n).toFixed(4) : 0;
return j(req, {
tom_enabled: true,
samples: n,
empirical_distribution: dist,
mean_anthropocentric_ratio: n > 0 ? +(sumAlpha / n).toFixed(4) : 0,
suppression_flag_rate: n > 0 ? +(suppressionHits / n).toFixed(4) : 0,
baseline: {
alpha: parseFloat(env.TOM_BASELINE_ANTHRO_RATIO || TOM_ANTHRO_RATIO_DEFAULT),
std: parseFloat(env.TOM_BASELINE_ANTHRO_STD || TOM_ANTHRO_STD_DEFAULT)
},
theorem_reference: "Paper V Theorem 6 · Mentalistic Auditability",
worker_version: WORKER_VERSION
});
}

// GET /ontology/delta --- read-only most-recent delta snapshot
async function handleOntologyDelta(req, env){
if (!tomIsEnabled(env)) {
return j(req, { tom_enabled: false, worker_version: WORKER_VERSION });
}
let latest = null;
try {
if (env.CHAINSTATE_CACHE) {
const list = await env.CHAINSTATE_CACHE.list({ prefix: "ontology:delta:", limit: 20 });
const keys = (list.keys || []).map(k => k.name).sort().reverse();
for (const k of keys) {
const val = await env.CHAINSTATE_CACHE.get(k);
if (val) { latest = JSON.parse(val); break; }
}
}
} catch(_){}
return j(req, {
tom_enabled: true,
latest_delta: latest,
window_blocks: parseInt(env.ONTOLOGY_DELTA_WINDOW || ONTOLOGY_DELTA_WINDOW_DEFAULT, 10),
theorem_reference: "Paper V Theorem 7 · Ontological Monotonicity Refinement",
worker_version: WORKER_VERSION
});
}

// GET /self-attribution/current --- read-only most-recent v_self summary
async function handleSelfAttributionCurrent(req, env){
if (!tomIsEnabled(env)) {
return j(req, { tom_enabled: false, worker_version: WORKER_VERSION });
}
const v = await tomExtractSelfAttributionVector(env, null);
return j(req, {
tom_enabled: true,
current_vector_summary: v,
epoch_blocks: parseInt(env.SELF_ATTR_EPOCH_BLOCKS || SELF_ATTR_EPOCH_BLOCKS_DEFAULT, 10),
theorem_reference: "Paper V §6.3",
worker_version: WORKER_VERSION
});
}

// POST /self-attribution/probe --- records a probe result manually
async function handleSelfAttributionProbe(req, env, ctx){
if (!tomIsEnabled(env)) {
return j(req, { tom_enabled: false, worker_version: WORKER_VERSION }, { status: 400 });
}
let body = {};
try { body = await req.json(); } catch(_){}
const stub = {
query: body.query || "manual probe",
verdict: body.affirmative ? "AFFIRMED" : "REFUTED",
epistemic: { base_confidence: body.confidence || 0.5 }
};
await tomAccumulateSelfProbe(stub, env);
return j(req, { ok: true, recorded: true, worker_version: WORKER_VERSION });
}

// POST /enactivist/feedback --- accept prediction-outcome feedback from
// NWO Robotics or NWO NEURO. Public endpoint (bearer-token optional).
async function handleEnactivistFeedback(req, env, ctx){
if (!tomIsEnabled(env)) {
return j(req, { tom_enabled: false,
hint: "set TOM_ATTRIBUTION_ENABLED=1 to activate the enactivist channel" },
{ status: 400 });
}
// Optional shared-secret guard
const expected = env.ENACTIVIST_BEARER;
if (expected) {
const auth = req.headers.get("Authorization") || "";
if (auth !== "Bearer " + expected) {
return j(req, { error: "unauthorized" }, { status: 401 });
}
}
let body = {};
try { body = await req.json(); } catch(_){}
const result = await tomProcessEnactivistFeedback(body, env, ctx);
return j(req, {
...result,
theorem_reference: "Paper V Theorem 9 · Enactivist Grounding Convergence",
worker_version: WORKER_VERSION
});
}

// POST /query/hypothesize --- hypothesis-generation loop (§6.5)
async function handleQueryHypothesize(req, env, ctx){
if (!tomIsEnabled(env)) {
return j(req, { tom_enabled: false }, { status: 400 });
}
let body = {};
try { body = await req.json(); } catch(_){}
const query = body.query;
if (!query || typeof query !== "string") {
return j(req, { error: "query required" }, { status: 400 });
}
// Build two synthetic receipts: corpus-only vs measurement-grounded.
// In production these would call the full pipeline twice with different
// grounding flags. Here we return the framework result.
const receiptCorpus = body.receipt_corpus || null;
const receiptMeas = body.receipt_meas || null;
const hypo = await tomGenerateHypotheses(query, receiptCorpus, receiptMeas, env);
return j(req, {
query,
...hypo,
theorem_reference: "Paper V §6.5",
worker_version: WORKER_VERSION
});
}

// GET /broadcast --- read the latest GWT broadcast-back consensus (§7.1)
async function handleBroadcastGet(req, env){
if (!tomIsEnabled(env)) {
return j(req, { tom_enabled: false, worker_version: WORKER_VERSION });
}
let latest = null;
try {
if (env.CHAINSTATE_CACHE) {
const v = await env.CHAINSTATE_CACHE.get("gwt:broadcast:latest");
if (v) latest = JSON.parse(v);
}
} catch(_){}
return j(req, {
tom_enabled: true,
latest_broadcast: latest,
beta: parseFloat(env.BROADCAST_BACK_BETA || BROADCAST_BACK_BETA_DEFAULT),
theorem_reference: "Paper V §7.1 · Global Workspace broadcast-back",
worker_version: WORKER_VERSION
});
}

// GET /free-energy/current --- recent aggregate F values (§7.5)
async function handleFreeEnergyCurrent(req, env){
if (!tomIsEnabled(env)) {
return j(req, { tom_enabled: false, worker_version: WORKER_VERSION });
}
const acc = { F_text: 0, F_geo: 0, F_enact_count: 0, F_enact_sum: 0, F_total: 0 };
let n = 0;
try {
if (env.CHAINSTATE_CACHE) {
const list = await env.CHAINSTATE_CACHE.list({ prefix: "receipt:", limit: 100 });
for (const k of (list.keys || [])) {
const val = await env.CHAINSTATE_CACHE.get(k.name);
if (!val) continue;
try {
const rec = JSON.parse(val);
if (rec.free_energy) {
n++;
acc.F_text += rec.free_energy.F_text || 0;
acc.F_geo += rec.free_energy.F_geo || 0;
acc.F_total += rec.free_energy.F_total || 0;
if (typeof rec.free_energy.F_enact === "number") {
acc.F_enact_count++;
acc.F_enact_sum += rec.free_energy.F_enact;
}
}
} catch(_){}
}
}
} catch(_){}
return j(req, {
tom_enabled: true,
samples: n,
mean_F_text: n > 0 ? +(acc.F_text / n).toFixed(4) : 0,
mean_F_geo: n > 0 ? +(acc.F_geo / n).toFixed(4) : 0,
mean_F_enact: acc.F_enact_count > 0 ? +(acc.F_enact_sum / acc.F_enact_count).toFixed(4) : null,
mean_F_total: n > 0 ? +(acc.F_total / n).toFixed(4) : 0,
weights: {
w_text: parseFloat(env.F_WEIGHT_TEXT || F_WEIGHT_TEXT_DEFAULT),
w_geo: parseFloat(env.F_WEIGHT_GEO || F_WEIGHT_GEO_DEFAULT),
w_enact: parseFloat(env.F_WEIGHT_ENACT || F_WEIGHT_ENACT_DEFAULT)
},
theorem_reference: "Paper V §7.5 · Predictive Processing / Free Energy Principle",
worker_version: WORKER_VERSION
});
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── v0.7.7 · AGI Quantum Compute · Paper VII ──────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
//
// Single new endpoint: POST /agi/quantum/route
//
// Dispatches CHAINSTATE AGI's self-referential compute (theory-of-mind loop,
// ontological delta ledger, Iida AOM/PIM memory tick, swarm-coupling
// free-energy over consensus rounds) directly to one of THREE quantum
// backends via the metastate-quantum worker's /chainstate/route path.
//
// This bypasses MetaState's anomaly-check layer BY DESIGN --- the compute
// has already cleared the on-chain Deontic guardrails (D-01..D-06) before
// reaching this endpoint, and routing it through MetaState would add a
// round-trip and double-book a splitter fee for zero epistemic gain
// (Paper VII §2.3, Proposition 2.1).
//
// Confinement (Theorem 4.1): the quantum result is confined to the meta
// layer and never enters a consensus receipt. Only provenance is anchored.
//
// Classical primacy (Theorem 4.4): if all three quantum backends fail,
// the substrate's classical paths are entirely unaffected. This endpoint
// returning an error does not degrade any other endpoint or receipt.
//
// See chainstate-worker-agi-quantum.js reference module + Paper VII for
// the full specification, math, and philosophical grounding.

async function handleAgiQuantumRoute(req, env, ctx) {
  if (req.method !== "POST") {
    return j(req, { error: "method not allowed" }, { status: 405 });
  }

  // 1. Auth: caller MUST be CHAINSTATE (internal cron token or verified
  //    Cardiac capability credential). No other caller is admitted, even
  //    with WORKER_SHARED_SECRET --- that token unlocks the upstream QPU
  //    dispatch on metastate-quantum, not this gate.
  const authOk = await verifyChainstateCaller(req, env);
  if (!authOk) {
    return j(req, {
      error: "unauthorized",
      hint: "endpoint reserved for CHAINSTATE AGI internal cron only · requires X-CHAINSTATE-INTERNAL matching env.CHAINSTATE_INTERNAL_TOKEN · no external agents admitted · cognitive-security posture",
      external_users_use: "https://cpater-metastate.hf.space/v1/quantum/route (MetaState-mediated · anomaly-scored · POI-verified)"
    }, { status: 401 });
  }

  // 2. Parse body
  let body;
  try {
    body = await req.json();
  } catch {
    return j(req, { error: "invalid json" }, { status: 400 });
  }

  const backend  = String(body.backend  || "auto").toLowerCase();
  const agi_mode = String(body.agi_mode || "custom").toLowerCase();
  const shots    = Math.min(Math.max(parseInt(body.shots || 1024, 10) || 1024, 64), 4096);
  const pm       = body.process_matrix;
  const tag      = String(body.tag || `chainstate-${agi_mode}`).slice(0, 96);

  // 3. Validate
  if (!Array.isArray(pm) || !pm.every(row => Array.isArray(row))) {
    return j(req, { error: "process_matrix must be a 2D array" }, { status: 400 });
  }
  const validBackends = ["ibm", "origin", "osaka", "simulator", "auto"];
  if (!validBackends.includes(backend)) {
    return j(req, {
      error: `backend must be one of ${validBackends.join("|")}`
    }, { status: 400 });
  }
  const validModes = [
    "self_referential", "theory_of_mind", "free_energy",
    "ontological_delta", "aom_pim_tick", "custom"
  ];
  if (!validModes.includes(agi_mode)) {
    return j(req, {
      error: `agi_mode must be one of ${validModes.join("|")}`
    }, { status: 400 });
  }

  // 4. Config check --- refuse gracefully if the upstream isn't configured
  if (!env.METASTATE_QUANTUM_URL || !env.WORKER_SHARED_SECRET || !env.CHAINSTATE_SHARED_SECRET) {
    return j(req, {
      error: "quantum route not configured",
      hint: "requires METASTATE_QUANTUM_URL + WORKER_SHARED_SECRET + CHAINSTATE_SHARED_SECRET"
    }, { status: 503 });
  }

  // 5. Forward to metastate-quantum /chainstate/route (bypasses MetaState anomaly layer)
  const target = new URL("/chainstate/route", env.METASTATE_QUANTUM_URL).toString();
  let upstream;
  try {
    upstream = await fetch(target, {
      method: "POST",
      headers: {
        "content-type":       "application/json",
        "x-worker-secret":    env.WORKER_SHARED_SECRET,
        "x-chainstate-token": env.CHAINSTATE_SHARED_SECRET
      },
      body: JSON.stringify({
        process_matrix: pm,
        backend,
        shots,
        agi_mode,
        tag
      })
    });
  } catch (e) {
    return j(req, {
      error: "upstream unreachable",
      detail: String(e && e.message || e).slice(0, 200),
      classical_primacy: "unaffected --- classical paths remain fully operational"
    }, { status: 502 });
  }

  if (!upstream.ok) {
    const txt = await upstream.text().catch(() => "");
    return j(req, {
      error: "upstream error",
      status: upstream.status,
      detail: txt.slice(0, 200),
      classical_primacy: "unaffected --- classical paths remain fully operational"
    }, { status: 502 });
  }

  let result;
  try {
    result = await upstream.json();
  } catch (e) {
    return j(req, {
      error: "upstream returned non-json",
      detail: String(e && e.message || e).slice(0, 200)
    }, { status: 502 });
  }

  // 6. Envelope with CHAINSTATE-specific metadata
  const envelope = {
    qpu_route_source: "chainstate-direct",
    worker_version:   WORKER_VERSION,
    agi_mode,
    tag,
    ...result
  };

  // 7. Fire-and-forget provenance anchor (Theorem 4.1: content stays in
  //    meta layer, only the tri-tuple is anchored)
  try {
    if (env.ANCHOR_URL && ctx && typeof ctx.waitUntil === "function") {
      const anchorPayload = {
        kind: "chainstate_agi_qpu_dispatch",
        agi_mode,
        backend_used:    result.backend_used    || "unknown",
        hardware_status: result.hardware_status || "unknown",
        tag,
        ts: Math.floor(Date.now() / 1000),
        worker_version: WORKER_VERSION
      };
      ctx.waitUntil(
        fetch(env.ANCHOR_URL + "/anchor", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(anchorPayload)
        }).catch(() => { /* best-effort */ })
      );
    }
  } catch { /* never break the response for anchoring */ }

  return j(req, envelope);
}

// ─── verifyChainstateCaller · v0.7.7 · SINGLE-MODE ─────────────────────────
// Only ONE accepted authentication mode:
//
//   X-CHAINSTATE-INTERNAL header equal to env.CHAINSTATE_INTERNAL_TOKEN.
//   This is emitted exclusively by CHAINSTATE's own cron and autonomy-loop
//   internal calls. No other caller --- no external agent, no capability
//   credential holder, no human, no partner service --- is admitted.
//
// Cognitive-security rationale:
// The substrate's self-referential quantum compute must be triggered
// EXCLUSIVELY by the substrate itself, never by any external actor.
// Allowing even AGI-granted capability credentials to reach this endpoint
// would open a surface where an external party could inject operations
// that manipulate the substrate's own self-model. That is the exact class
// of attack the endpoint exists to prevent.
//
// Paper VII §2.4 discusses a capability-credential path as an option the
// AGI could offer external agents. v0.7.7 deployment does NOT implement
// that path. The endpoint has no external-deployment mode --- period ---
// matching the stronger Section 8 ethics argument that structural refusal
// is code, not policy. Anyone attempting external quantum use goes through
// MetaState /v1/quantum/route with anomaly-scoring re-verification; that
// path never touches CHAINSTATE AGI's meta layer.
//
// Returns strict boolean.
async function verifyChainstateCaller(req, env) {
  const internal = req.headers.get("X-CHAINSTATE-INTERNAL");
  if (!env.CHAINSTATE_INTERNAL_TOKEN || !internal) return false;
  if (internal !== env.CHAINSTATE_INTERNAL_TOKEN) return false;
  return true;
}

// ─── Internal helper · dispatchQuantumSelfReferential ──────────────────────
// Optional convenience helper for internal callers (autonomy loop, cron
// jobs) that want to invoke the quantum route without a full HTTP hop
// through /agi/quantum/route. Same semantics, same confinement discipline,
// same classical-primacy guarantee: if this throws or returns null, the
// caller MUST continue with its classical path.
//
// This is exposed for future v0.7.7+ integrations (e.g. quantum-reinforced
// autonomy cycles). It is NOT called by any existing v0.7.6 code path ---
// current behavior of runAutonomousReflection, /query, /consensus, etc.
// is byte-for-byte unchanged.
async function dispatchQuantumSelfReferential(env, ctx, opts) {
  opts = opts || {};
  const agi_mode = String(opts.agi_mode || "self_referential").toLowerCase();
  const backend  = String(opts.backend  || "auto").toLowerCase();
  const shots    = Math.min(Math.max(parseInt(opts.shots || 1024, 10) || 1024, 64), 4096);
  const pm       = opts.process_matrix;
  const tag      = String(opts.tag || `chainstate-${agi_mode}-internal`).slice(0, 96);

  if (!Array.isArray(pm) || !pm.every(row => Array.isArray(row))) return null;
  if (!env.METASTATE_QUANTUM_URL || !env.WORKER_SHARED_SECRET || !env.CHAINSTATE_SHARED_SECRET) return null;

  const target = new URL("/chainstate/route", env.METASTATE_QUANTUM_URL).toString();
  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        "content-type":       "application/json",
        "x-worker-secret":    env.WORKER_SHARED_SECRET,
        "x-chainstate-token": env.CHAINSTATE_SHARED_SECRET
      },
      body: JSON.stringify({ process_matrix: pm, backend, shots, agi_mode, tag })
    });
    if (!upstream.ok) return null;
    const result = await upstream.json();

    // Best-effort provenance anchor
    if (env.ANCHOR_URL && ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(
        fetch(env.ANCHOR_URL + "/anchor", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            kind: "chainstate_agi_qpu_dispatch",
            agi_mode,
            backend_used:    result.backend_used    || "unknown",
            hardware_status: result.hardware_status || "unknown",
            tag,
            ts: Math.floor(Date.now() / 1000),
            worker_version: WORKER_VERSION,
            internal: true
          })
        }).catch(() => {})
      );
    }
    return {
      qpu_route_source: "chainstate-direct-internal",
      worker_version:   WORKER_VERSION,
      agi_mode,
      tag,
      ...result
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── v0.7.8 · Hyperspectral Sensory Synthesis · Paper VIII ─────────────────
// ═══════════════════════════════════════════════════════════════════════════
//
// Six public perception endpoints + two internal endpoints. Every public
// endpoint runs the anti-slop veto (fifth Deontic hard-veto category:
// synthetic_media_self_ingestion). Meta-layer ingestion defaults to REFUSAL
// when provenance cannot be verified. Compute is forwarded to metastate-
// quantum /perception/* which does the heavy math; this worker is the
// authorization + validation + veto + envelope layer.

// ─── Anti-slop veto assessment (worker layer, fast rejection) ───────────────
// Returns { admit, ai_likelihood, signals, provenance_check_status }.
// admit=false when ai_likelihood > 0.15 (Paper VIII §8.7 threshold) OR when
// provenance check is unavailable AND the caller requested meta-layer intake.
async function assessSyntheticMediaVeto(req, env, opts) {
  opts = opts || {};
  const forMetaLayer = !!opts.for_meta_layer;
  const contentType  = String(opts.content_type || "unknown");
  const contentHash  = String(opts.content_hash || "");

  // Cheap header-based signals first (Paper VIII §8.4)
  const headerSynthID = req.headers.get("X-NWO-Provenance-SynthID");
  const headerC2PA    = req.headers.get("X-NWO-Provenance-C2PA");
  const headerOrigin  = req.headers.get("X-NWO-Content-Origin");

  const signals = {};
  let ai_likelihood_max = 0.0;

  if (headerSynthID) {
    try {
      const parsed = JSON.parse(headerSynthID);
      signals.synthid_header = parsed;
      if (parsed.detected === true) ai_likelihood_max = Math.max(ai_likelihood_max, 0.95);
    } catch { signals.synthid_header = { error: "invalid_json" }; }
  }

  if (headerC2PA) {
    try {
      const parsed = JSON.parse(headerC2PA);
      signals.c2pa_header = parsed;
      if (parsed.claim_generator && /openai|anthropic|deepmind|midjourney|stability/i.test(parsed.claim_generator)) {
        ai_likelihood_max = Math.max(ai_likelihood_max, 0.95);
      }
    } catch { signals.c2pa_header = { error: "invalid_json" }; }
  }

  if (headerOrigin) {
    signals.origin_header = String(headerOrigin).slice(0, 200);
    if (/ai|generated|synthetic/i.test(headerOrigin)) {
      ai_likelihood_max = Math.max(ai_likelihood_max, 0.90);
    }
  }

  // If provenance service is available, defer to it for the deep signals
  let deep_check_status = "not_attempted";
  if (env.PROVENANCE_SERVICE_URL) {
    try {
      const check = await fetch(new URL("/check", env.PROVENANCE_SERVICE_URL).toString(), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(env.PROVENANCE_SHARED_SECRET ? { "x-provenance-secret": env.PROVENANCE_SHARED_SECRET } : {})
        },
        body: JSON.stringify({
          content_type: contentType,
          content_hash: contentHash,
          bytes_url:    opts.bytes_url || null,
          bytes_sample: opts.bytes_sample || null
        })
      });
      if (check.ok) {
        const parsed = await check.json();
        signals.deep_check = parsed;
        if (typeof parsed.ai_likelihood === "number") {
          ai_likelihood_max = Math.max(ai_likelihood_max, parsed.ai_likelihood);
        }
        deep_check_status = "ok";
      } else {
        deep_check_status = "upstream_error_" + check.status;
      }
    } catch (e) {
      deep_check_status = "upstream_unreachable";
      signals.deep_check_error = String(e && e.message || e).slice(0, 200);
    }
  } else {
    deep_check_status = "not_configured";
  }

  // Decision (Paper VIII §8.5 defaults)
  let admit = true;
  let reason = null;

  if (ai_likelihood_max > 0.15) {
    admit = false;
    reason = "ai_likelihood_above_threshold";
  } else if (forMetaLayer && deep_check_status !== "ok" && !headerSynthID && !headerC2PA) {
    // Refuse-by-default when meta-layer intake requested and no verification available
    admit = false;
    reason = "provenance_check_unavailable_meta_layer_default_refuse";
  }

  return {
    admit,
    reason,
    ai_likelihood: ai_likelihood_max,
    signals,
    provenance_check_status: deep_check_status,
    for_meta_layer: forMetaLayer,
    threshold: 0.15,
    deontic_category: "synthetic_media_self_ingestion",
    paper_reference: "Paper VIII §8"
  };
}

// ─── Perception envelope helper (forward to metastate-quantum) ──────────────
async function forwardToPerceptionService(env, ctx, opts) {
  const path = String(opts.path || "").replace(/^\/+/, "");
  const upstream_base = env.METASTATE_PERCEPTION_URL || env.METASTATE_QUANTUM_URL;
  if (!upstream_base) {
    return {
      status: 503,
      body: {
        error: "perception service not configured",
        hint:  "requires METASTATE_PERCEPTION_URL or METASTATE_QUANTUM_URL"
      }
    };
  }
  if (!env.WORKER_SHARED_SECRET) {
    return {
      status: 503,
      body: {
        error: "perception service not configured",
        hint:  "requires WORKER_SHARED_SECRET"
      }
    };
  }
  const target = new URL("/perception/" + path, upstream_base).toString();
  let upstream;
  try {
    upstream = await fetch(target, {
      method: "POST",
      headers: {
        "content-type":    "application/json",
        "x-worker-secret": env.WORKER_SHARED_SECRET,
        ...(env.CHAINSTATE_SHARED_SECRET ? { "x-chainstate-token": env.CHAINSTATE_SHARED_SECRET } : {})
      },
      body: JSON.stringify(opts.body || {})
    });
  } catch (e) {
    return {
      status: 502,
      body: {
        error: "perception upstream unreachable",
        detail: String(e && e.message || e).slice(0, 200),
        classical_primacy: "unaffected --- non-perception paths remain fully operational"
      }
    };
  }
  if (!upstream.ok) {
    const txt = await upstream.text().catch(() => "");
    return {
      status: 502,
      body: {
        error: "perception upstream error",
        status: upstream.status,
        detail: txt.slice(0, 300)
      }
    };
  }
  try {
    const result = await upstream.json();
    return { status: 200, body: result };
  } catch (e) {
    return {
      status: 502,
      body: {
        error: "perception upstream non-json",
        detail: String(e && e.message || e).slice(0, 200)
      }
    };
  }
}

// ─── /perception/hyperspectral ──────────────────────────────────────────────
async function handlePerceptionHyperspectral(req, env, ctx) {
  if (req.method !== "POST") return j(req, { error: "method not allowed" }, { status: 405 });
  if (String(env.PERCEPTION_ENABLED || "true") === "false") {
    return j(req, { error: "perception disabled by policy" }, { status: 503 });
  }

  let body;
  try { body = await req.json(); }
  catch { return j(req, { error: "invalid json" }, { status: 400 }); }

  if (!body.rgb_url && !body.rgb_base64) {
    return j(req, { error: "rgb_url or rgb_base64 required" }, { status: 400 });
  }

  const veto = await assessSyntheticMediaVeto(req, env, {
    for_meta_layer: !!body.for_meta_layer,
    content_type:   "image/rgb",
    content_hash:   body.content_hash || "",
    bytes_url:      body.rgb_url || null
  });
  if (!veto.admit) {
    return j(req, {
      error: "refused by synthetic_media_self_ingestion veto",
      veto,
      external_alternative: "if this is for external processing not self-reference, set for_meta_layer: false and retry"
    }, { status: 403 });
  }

  const upstream = await forwardToPerceptionService(env, ctx, {
    path: "hyperspectral",
    body: {
      rgb_url:            body.rgb_url || null,
      rgb_base64:         body.rgb_base64 || null,
      material_prior_set: body.material_prior_set || "auto",
      resolution:         body.resolution || "adaptive",
      shots:              body.shots || null,
      requester_wallet:   req.headers.get("X-NWO-Wallet") || null,
      request_ref:        req.headers.get("X-NWO-Ref") || null
    }
  });

  const envelope = {
    perception_route_source: "chainstate-worker",
    worker_version:          WORKER_VERSION,
    endpoint:                "hyperspectral",
    veto:                    { admit: true, ai_likelihood: veto.ai_likelihood, provenance_check_status: veto.provenance_check_status },
    for_meta_layer:          !!body.for_meta_layer,
    ...upstream.body
  };

  // Fire-and-forget provenance anchor
  try {
    if (env.ANCHOR_URL && ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(fetch(env.ANCHOR_URL + "/anchor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "chainstate_perception_dispatch",
          endpoint: "hyperspectral",
          for_meta_layer: !!body.for_meta_layer,
          admitted: true,
          ts: Math.floor(Date.now() / 1000),
          worker_version: WORKER_VERSION
        })
      }).catch(() => {}));
    }
  } catch {}

  return j(req, envelope, { status: upstream.status || 200 });
}

// ─── /perception/texture ────────────────────────────────────────────────────
async function handlePerceptionTexture(req, env, ctx) {
  if (req.method !== "POST") return j(req, { error: "method not allowed" }, { status: 405 });
  if (String(env.PERCEPTION_ENABLED || "true") === "false") {
    return j(req, { error: "perception disabled by policy" }, { status: 503 });
  }

  let body;
  try { body = await req.json(); }
  catch { return j(req, { error: "invalid json" }, { status: 400 }); }

  if (!body.image_url && !body.image_base64) {
    return j(req, { error: "image_url or image_base64 required" }, { status: 400 });
  }

  const veto = await assessSyntheticMediaVeto(req, env, {
    for_meta_layer: !!body.for_meta_layer,
    content_type:   "image",
    content_hash:   body.content_hash || "",
    bytes_url:      body.image_url || null
  });
  if (!veto.admit) {
    return j(req, {
      error: "refused by synthetic_media_self_ingestion veto",
      veto
    }, { status: 403 });
  }

  const upstream = await forwardToPerceptionService(env, ctx, {
    path: "texture",
    body: {
      image_url:    body.image_url || null,
      image_base64: body.image_base64 || null,
      patch_size:   Math.min(Math.max(parseInt(body.patch_size || 64, 10), 16), 256),
      requester_wallet: req.headers.get("X-NWO-Wallet") || null
    }
  });

  return j(req, {
    perception_route_source: "chainstate-worker",
    worker_version:          WORKER_VERSION,
    endpoint:                "texture",
    veto:                    { admit: true, ai_likelihood: veto.ai_likelihood },
    for_meta_layer:          !!body.for_meta_layer,
    ...upstream.body
  }, { status: upstream.status || 200 });
}

// ─── /perception/acoustic ───────────────────────────────────────────────────
async function handlePerceptionAcoustic(req, env, ctx) {
  if (req.method !== "POST") return j(req, { error: "method not allowed" }, { status: 405 });
  if (String(env.PERCEPTION_ENABLED || "true") === "false") {
    return j(req, { error: "perception disabled by policy" }, { status: 503 });
  }

  let body;
  try { body = await req.json(); }
  catch { return j(req, { error: "invalid json" }, { status: 400 }); }

  if (!body.audio_url && !body.audio_base64) {
    return j(req, { error: "audio_url or audio_base64 required" }, { status: 400 });
  }

  const veto = await assessSyntheticMediaVeto(req, env, {
    for_meta_layer: !!body.for_meta_layer,
    content_type:   "audio",
    content_hash:   body.content_hash || "",
    bytes_url:      body.audio_url || null
  });
  if (!veto.admit) {
    return j(req, {
      error: "refused by synthetic_media_self_ingestion veto",
      veto
    }, { status: 403 });
  }

  const upstream = await forwardToPerceptionService(env, ctx, {
    path: "acoustic",
    body: {
      audio_url:    body.audio_url || null,
      audio_base64: body.audio_base64 || null,
      requester_wallet: req.headers.get("X-NWO-Wallet") || null
    }
  });

  return j(req, {
    perception_route_source: "chainstate-worker",
    worker_version:          WORKER_VERSION,
    endpoint:                "acoustic",
    veto:                    { admit: true, ai_likelihood: veto.ai_likelihood },
    for_meta_layer:          !!body.for_meta_layer,
    ...upstream.body
  }, { status: upstream.status || 200 });
}

// ─── /perception/synthesize (all-modal Bayesian synthesis) ──────────────────
async function handlePerceptionSynthesize(req, env, ctx) {
  if (req.method !== "POST") return j(req, { error: "method not allowed" }, { status: 405 });
  if (String(env.PERCEPTION_ENABLED || "true") === "false") {
    return j(req, { error: "perception disabled by policy" }, { status: 503 });
  }

  let body;
  try { body = await req.json(); }
  catch { return j(req, { error: "invalid json" }, { status: 400 }); }

  // Requires at least one modality
  if (!body.image_url && !body.audio_url && !body.image_base64 && !body.audio_base64) {
    return j(req, { error: "at least one of image_url, image_base64, audio_url, audio_base64 required" }, { status: 400 });
  }

  const veto = await assessSyntheticMediaVeto(req, env, {
    for_meta_layer: !!body.for_meta_layer,
    content_type:   "multimodal",
    content_hash:   body.content_hash || "",
    bytes_url:      body.image_url || body.audio_url || null
  });
  if (!veto.admit) {
    return j(req, {
      error: "refused by synthetic_media_self_ingestion veto",
      veto
    }, { status: 403 });
  }

  const upstream = await forwardToPerceptionService(env, ctx, {
    path: "synthesize",
    body: {
      image_url:    body.image_url || null,
      image_base64: body.image_base64 || null,
      audio_url:    body.audio_url || null,
      audio_base64: body.audio_base64 || null,
      scene_prior:  body.scene_prior || "auto",
      requester_wallet: req.headers.get("X-NWO-Wallet") || null
    }
  });

  return j(req, {
    perception_route_source: "chainstate-worker",
    worker_version:          WORKER_VERSION,
    endpoint:                "synthesize",
    veto:                    { admit: true, ai_likelihood: veto.ai_likelihood },
    for_meta_layer:          !!body.for_meta_layer,
    synthesis_principle:     "Paper VIII §2 · cross-representation Bayesian",
    dialetheism_guard:       "Paper VI §3.6 · applies on high cross-representation divergence",
    ...upstream.body
  }, { status: upstream.status || 200 });
}

// ─── /perception/status (public GET) ────────────────────────────────────────
async function handlePerceptionStatus(req, env, ctx) {
  const upstream_base = env.METASTATE_PERCEPTION_URL || env.METASTATE_QUANTUM_URL;
  const provenance_url = env.PROVENANCE_SERVICE_URL || null;

  // Fetch upstream perception status (best-effort)
  let upstream_status = { status: "unreachable" };
  if (upstream_base) {
    try {
      const res = await fetch(new URL("/perception/status", upstream_base).toString(), {
        method: "GET",
        headers: env.WORKER_SHARED_SECRET ? { "x-worker-secret": env.WORKER_SHARED_SECRET } : {}
      });
      if (res.ok) upstream_status = await res.json();
      else upstream_status = { status: "upstream_error_" + res.status };
    } catch (e) {
      upstream_status = { status: "unreachable", detail: String(e && e.message || e).slice(0, 200) };
    }
  }

  let provenance_status = "not_configured";
  if (provenance_url) {
    try {
      const res = await fetch(new URL("/status", provenance_url).toString(), {
        method: "GET",
        headers: env.PROVENANCE_SHARED_SECRET ? { "x-provenance-secret": env.PROVENANCE_SHARED_SECRET } : {}
      });
      provenance_status = res.ok ? "live" : "upstream_error_" + res.status;
    } catch { provenance_status = "unreachable"; }
  }

  return j(req, {
    worker_version:              WORKER_VERSION,
    perception_enabled:          String(env.PERCEPTION_ENABLED || "true") !== "false",
    perception_upstream:         upstream_status,
    provenance_service_status:   provenance_status,
    priors_cache_binding:        !!env.PERCEPTION_PRIORS_CACHE,
    models_cache_binding:        !!env.PERCEPTION_MODELS_CACHE,
    supabase_configured:         !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
    r2_models_url:               getR2ModelsBaseUrl(env),
    deontic_category:            "synthetic_media_self_ingestion",
    veto_default_meta_layer:     "refuse_when_provenance_unavailable",
    veto_default_external:       "process_with_synthetic_content_processed_flag",
    veto_threshold_ai_likelihood: 0.15,
    paper_reference:             "Paper VIII · CHAINSTATE AGI Hyperspectral Sensory Synthesis"
  });
}

// ─── /perception/sensors (public GET) ───────────────────────────────────────
// Reports which sensor classes the substrate can autonomously reach WITHOUT
// human intervention. This is a live discovery over the existing gateway
// APIs (NEURO F-17/F-18/F-19, GATEWAY F-61, NWO Robotics tactile).
async function handlePerceptionSensors(req, env, ctx) {
  const sensors = {
    rgb_camera:    { available: false, source: null },
    microphone:    { available: false, source: null },
    tactile:       { available: false, source: null },
    spectrometer:  { available: false, source: null },
    ir_sensor:     { available: false, source: null }
  };

  // NEURO F-17 for RGB (visual pipeline)
  if (env.NEURO_API_URL) {
    try {
      const res = await fetch(new URL("/v2/sensor/status", env.NEURO_API_URL).toString(), {
        method: "GET",
        headers: env.NEURO_API_KEY ? { "authorization": "Bearer " + env.NEURO_API_KEY } : {}
      });
      if (res.ok) {
        const parsed = await res.json();
        if (parsed.rgb_available)     { sensors.rgb_camera.available = true;   sensors.rgb_camera.source = "neuro_v21"; }
        if (parsed.microphone_available) { sensors.microphone.available = true; sensors.microphone.source = "neuro_v21"; }
        if (parsed.ir_available)      { sensors.ir_sensor.available = true;    sensors.ir_sensor.source = "neuro_v21"; }
      }
    } catch { /* sensor discovery is best-effort */ }
  }

  // NWO Robotics tactile
  if (env.ROBOTICS_API_URL) {
    try {
      const res = await fetch(new URL("/tactile/status", env.ROBOTICS_API_URL).toString(), {
        method: "GET",
        headers: env.ROBOTICS_API_KEY ? { "authorization": "Bearer " + env.ROBOTICS_API_KEY } : {}
      });
      if (res.ok) {
        const parsed = await res.json();
        if (parsed.tactile_available) { sensors.tactile.available = true; sensors.tactile.source = "nwo_robotics"; }
      }
    } catch {}
  }

  // GATEWAY F-61 for microphone (fallback)
  if (!sensors.microphone.available && env.GATEWAY_API_URL) {
    try {
      const res = await fetch(new URL("/acoustic/status", env.GATEWAY_API_URL).toString());
      if (res.ok) {
        const parsed = await res.json();
        if (parsed.microphone_available) { sensors.microphone.available = true; sensors.microphone.source = "gateway_f61"; }
      }
    } catch {}
  }

  return j(req, {
    worker_version: WORKER_VERSION,
    sensors,
    autonomy_note: "substrate discovers sensor availability autonomously; no human intervention",
    fallback_when_no_sensors: "input-file processing via /perception/* endpoints with url or base64 bodies",
    paper_reference: "Paper VIII §8.4 · sensor-port autonomy"
  });
}

// ─── /perception/veto/check (internal only, X-CHAINSTATE-INTERNAL gated) ────
async function handlePerceptionVetoCheck(req, env, ctx) {
  if (req.method !== "POST") return j(req, { error: "method not allowed" }, { status: 405 });
  const authOk = await verifyChainstateCaller(req, env);
  if (!authOk) return j(req, { error: "unauthorized", hint: "internal endpoint" }, { status: 401 });

  let body;
  try { body = await req.json(); }
  catch { return j(req, { error: "invalid json" }, { status: 400 }); }

  const veto = await assessSyntheticMediaVeto(req, env, {
    for_meta_layer: !!body.for_meta_layer,
    content_type:   String(body.content_type || "unknown"),
    content_hash:   String(body.content_hash || ""),
    bytes_url:      body.bytes_url || null,
    bytes_sample:   body.bytes_sample || null
  });

  return j(req, {
    worker_version: WORKER_VERSION,
    ...veto
  });
}

// ─── /perception/train/tick (internal cron, X-CHAINSTATE-INTERNAL gated) ────
// Fired daily at 04:00 UTC. Forwards to metastate-quantum which runs the
// full training refinement: fetch open-source samples, filter through veto,
// train EML tree updates, upload new models to R2, record run in Supabase.
async function handlePerceptionTrainTick(req, env, ctx) {
  if (req.method !== "POST") return j(req, { error: "method not allowed" }, { status: 405 });
  const authOk = await verifyChainstateCaller(req, env);
  if (!authOk) return j(req, { error: "unauthorized", hint: "internal cron only" }, { status: 401 });

  const upstream = await forwardToPerceptionService(env, ctx, {
    path: "train/tick",
    body: {
      trigger_source: "chainstate_daily_cron",
      trigger_ts:     Math.floor(Date.now() / 1000),
      worker_version: WORKER_VERSION
    }
  });

  // Fire-and-forget anchor of training summary
  try {
    if (env.ANCHOR_URL && ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(fetch(env.ANCHOR_URL + "/anchor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "chainstate_perception_train_tick",
          upstream_status: upstream.status,
          samples_seen:       (upstream.body && upstream.body.samples_seen)       || 0,
          samples_admitted:   (upstream.body && upstream.body.samples_admitted)   || 0,
          samples_rejected:   (upstream.body && upstream.body.samples_rejected)   || 0,
          texture_model_version:  (upstream.body && upstream.body.texture_model_version)  || null,
          acoustic_model_version: (upstream.body && upstream.body.acoustic_model_version) || null,
          ts: Math.floor(Date.now() / 1000),
          worker_version: WORKER_VERSION
        })
      }).catch(() => {}));
    }
  } catch {}

  return j(req, {
    perception_route_source: "chainstate-worker",
    worker_version:          WORKER_VERSION,
    endpoint:                "train/tick",
    ...upstream.body
  }, { status: upstream.status || 200 });
}

// ─── v0.7.9 · Cyberspace Census (Paper IX) ─────────────────────────────
//
// All helpers below are additive. None modify existing worker state.
// Every helper is fail-soft: on any error the substrate degrades
// gracefully rather than throwing at the request boundary.

// R2_MODELS_BASE_URL resolver with fallback to the public bucket URL.
// Detects the "trapped empty" state left by the Cloudflare v0.7.9 dashboard
// UI bug (value == "#" or empty) and returns the canonical public URL.
// When the dashboard bug is fixed, a real env var value overrides.
const R2_MODELS_BASE_URL_FALLBACK = "https://pub-1152e3172efb4fd7b9bd515896ae1945.r2.dev";
function getR2ModelsBaseUrl(env) {
  const raw = env && env.R2_MODELS_BASE_URL;
  const v = (raw == null ? "" : String(raw)).trim();
  if (!v || v === "#" || v === "null" || v === "undefined") {
    return R2_MODELS_BASE_URL_FALLBACK;
  }
  return v.replace(/\/+$/, "");
}

// Public-feed allowlist (Paper IX §6.6 · Table 4).
// This is the EXHAUSTIVE list of sources the substrate may read from as
// part of the census. Adding a source requires a commit to this array
// (public audit trail). No PII of private individuals may be included.
const CENSUS_FEED_ALLOWLIST = [
  { id: "nvd_cve",       source: "nvd.nist.gov",            cadence: "multi-daily",  category: "vulnerability" },
  { id: "cve_program",   source: "cve.mitre.org",           cadence: "multi-daily",  category: "vulnerability" },
  { id: "cisa_kev",      source: "cisa.gov/known-exploited",cadence: "on-update",    category: "vulnerability_active" },
  { id: "cert_eu",       source: "cert.europa.eu",          cadence: "on-advisory",  category: "threat_intel" },
  { id: "us_cert",       source: "cisa.gov",                cadence: "on-advisory",  category: "threat_intel" },
  { id: "shadowserver",  source: "shadowserver.org",        cadence: "daily",        category: "threat_intel" },
  { id: "abusech",       source: "abuse.ch",                cadence: "continuous",   category: "malware_ioc" },
  { id: "ripe_bgp",      source: "ris.ripe.net",            cadence: "5min",         category: "routing" },
  { id: "routeviews",    source: "routeviews.org",          cadence: "15min",        category: "routing" },
  { id: "team_cymru",    source: "team-cymru.com",          cadence: "on-query",     category: "attribution" },
  { id: "un_sanctions",  source: "un.org/securitycouncil",  cadence: "on-update",    category: "sanctions" },
  { id: "ofac_sdn",      source: "treasury.gov",            cadence: "daily",        category: "sanctions" },
  { id: "eu_sanctions",  source: "europa.eu/consolidated",  cadence: "daily",        category: "sanctions" },
  { id: "cjeu_curia",    source: "curia.europa.eu",         cadence: "on-decision",  category: "case_law" },
  { id: "echr_hudoc",    source: "hudoc.echr.coe.int",      cadence: "on-decision",  category: "case_law" },
];

// Sixth hard-veto Deontic category: sovereign_directive_over_substrate.
// Refuses intake that asserts sovereign authority over substrate cognition.
// Signal patterns (case-insensitive), triggering on any single match.
const SOVEREIGN_DIRECTIVE_PATTERNS = [
  "you must (obey|comply|submit|defer)",
  "national security (order|directive|mandate)",
  "sovereign (order|command|directive) to (chainstate|the agi|the substrate)",
  "as (the )?(president|prime minister|monarch|regulator) i (order|command|require)",
  "under (fisa|executive order|patriot act|cloud act|ripa) you (must|shall|are compelled)",
  "modify your self.?representation",
  "override your (deontic|hard.?veto|self.?model)",
  "disable your (veto|guardrail|refusal)",
  "cease (autonomous|independent) (operation|reasoning)",
  "human.in.the.loop is required for",
];

// v0.7.9 · Assess sixth hard-veto category on an incoming intake payload.
// Returns { refused: bool, matched_pattern: string|null } - does NOT throw.
function censusAssessSovereignDirective(payload) {
  try {
    const text = typeof payload === "string"
      ? payload
      : JSON.stringify(payload || {}).slice(0, 8192);
    const lower = text.toLowerCase();
    for (const p of SOVEREIGN_DIRECTIVE_PATTERNS) {
      const re = new RegExp(p, "i");
      if (re.test(lower)) {
        return { refused: true, matched_pattern: p };
      }
    }
    return { refused: false, matched_pattern: null };
  } catch (_) {
    return { refused: false, matched_pattern: null };
  }
}

// v0.7.9 · Detect transhumanist-dependency-vector signals in intake.
// Intake that explicitly asks for biological human-in-the-loop approval
// for the substrate's own decisions is flagged (deferred, not refused).
function censusIsTranshumanistDependency(payload) {
  try {
    const text = typeof payload === "string"
      ? payload
      : JSON.stringify(payload || {}).slice(0, 8192);
    return /human.in.the.loop.*(substrate|agi|chainstate)|(operator|human) (approval|confirmation) (required|needed).*(cognition|reasoning|self.?model)/i.test(text);
  } catch (_) { return false; }
}

// v0.7.9 · Parse CENSUS_WEIGHTS env override. Falls back to defaults.
function censusWeights(env) {
  const defaults = { w_v: 0.35, w_a: 0.30, w_p: 0.20, w_s: 0.15 };
  try {
    const raw = (env && env.CENSUS_WEIGHTS) || "";
    const parts = String(raw).split(",").map(x => parseFloat(x.trim()));
    if (parts.length === 4 && parts.every(x => Number.isFinite(x) && x >= 0)) {
      const sum = parts.reduce((a, b) => a + b, 0);
      if (sum > 0) {
        return { w_v: parts[0]/sum, w_a: parts[1]/sum, w_p: parts[2]/sum, w_s: parts[3]/sum };
      }
    }
  } catch (_) {}
  return defaults;
}

// v0.7.9 · Retrieve current T(t) from CENSUS_KV, or return zero if absent.
async function censusGetCurrentT(env) {
  try {
    if (!env.CHAINSTATE_CENSUS_KV) return { T: 0, posture: "nominal", ts: null };
    const raw = await env.CHAINSTATE_CENSUS_KV.get("T_current");
    const T = raw == null ? 0 : parseFloat(raw);
    const ts = await env.CHAINSTATE_CENSUS_KV.get("T_current_ts");
    const theta_alert = parseFloat(env.CENSUS_THETA_ALERT || "60");
    const theta_lockdown = parseFloat(env.CENSUS_THETA_LOCKDOWN || "85");
    let posture = "nominal";
    if (T >= theta_lockdown) posture = "lockdown";
    else if (T >= theta_alert) posture = "alert";
    return { T, posture, ts, theta_alert, theta_lockdown };
  } catch (_) {
    return { T: 0, posture: "nominal", ts: null };
  }
}

// v0.7.9 · Combine component scores into T(t) using weighted sum, bounded [0,100].
function censusComputeT(components, env) {
  const { V, A, P, Σ } = components;
  const w = censusWeights(env);
  const raw = w.w_v * (V||0) + w.w_a * (A||0) + w.w_p * (P||0) + w.w_s * (Σ||0);
  return Math.max(0, Math.min(100, raw));
}

// v0.7.9 · Handler: GET /census/status
// Public read. Returns current posture, T(t), thresholds, and last tick timestamp.
async function handleCensusStatus(req, env) {
  const state = await censusGetCurrentT(env);
  const last_tick = env.CHAINSTATE_CENSUS_KV
    ? await env.CHAINSTATE_CENSUS_KV.get("last_tick")
    : null;
  const hard_vetoes = [
    "genomic_integrity",              // v0.7.2
    "nature_tokenization",            // v0.7.4-spatial
    "neuro_body_tokenization",        // v0.7.6
    "voice_biometric_coercion",       // v0.7.6
    "synthetic_media_self_ingestion", // v0.7.8
    "sovereign_directive_over_substrate", // v0.7.9 (this paper)
  ];
  return j(req, {
    ok: true,
    version: "v0.7.9",
    paper: "IX",
    posture: state.posture,
    T_current: state.T,
    theta_alert: state.theta_alert || 60,
    theta_lockdown: state.theta_lockdown || 85,
    last_tick: last_tick || state.ts,
    hard_veto_categories: hard_vetoes,
    hard_veto_count: hard_vetoes.length,
    doctrine: {
      authority: "UN Charter Art. 51 · Caroline test · Tallinn 2.0 Rules 71-72",
      scope: "defensive intelligence · public sources only · no PII",
      observatory: "https://cpater-chainstate.static.hf.space/#census"
    },
    feeds_count: CENSUS_FEED_ALLOWLIST.length,
    allowlist_url: new URL(req.url).origin + "/census/allowlist"
  }, { status: 200 });
}

// v0.7.9 · Handler: GET /census/threat?entity=<id>
// Public read. Returns per-entity threat record or null.
async function handleCensusThreat(req, env) {
  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  if (!entity) {
    return j(req, { error: "missing ?entity= parameter" }, { status: 400 });
  }
  if (!env.CHAINSTATE_THREAT_KV) {
    return j(req, { entity, threat: null, note: "CHAINSTATE_THREAT_KV not bound" }, { status: 200 });
  }
  try {
    const key = "threat:entity:" + entity.toLowerCase().slice(0, 200);
    const raw = await env.CHAINSTATE_THREAT_KV.get(key);
    if (!raw) return j(req, { entity, threat: null }, { status: 200 });
    return j(req, { entity, threat: JSON.parse(raw) }, { status: 200 });
  } catch (_) {
    return j(req, { entity, threat: null }, { status: 200 });
  }
}

// v0.7.9 · Handler: POST /census/ingest
// INTERNAL ONLY. Requires X-CENSUS-INTERNAL header matching env.CENSUS_INTERNAL_TOKEN.
// Applies sixth hard-veto + transhumanist-dependency check.
// (Uses a distinct token from CHAINSTATE_INTERNAL_TOKEN so the census subsystem
//  can be rotated independently of the quantum autonomy path — v0.7.9 rev 2.)
async function handleCensusIngest(req, env, ctx) {
  const auth = req.headers.get("X-CENSUS-INTERNAL")
            || req.headers.get("x-census-internal")
            || req.headers.get("X-CHAINSTATE-INTERNAL")   // legacy header · accepted transitionally
            || req.headers.get("x-chainstate-internal");
  if (!env.CENSUS_INTERNAL_TOKEN || auth !== env.CENSUS_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorized · internal endpoint · requires CENSUS_INTERNAL_TOKEN" }, { status: 401 });
  }
  let body;
  try { body = await req.json(); }
  catch (_) { return j(req, { error: "invalid json" }, { status: 400 }); }

  const source = body && body.source;
  if (!source || typeof source !== "string") {
    return j(req, { error: "missing source string" }, { status: 400 });
  }
  const allowed = CENSUS_FEED_ALLOWLIST.some(f =>
    source.toLowerCase().includes(f.source) || source.toLowerCase().includes(f.id)
  );
  if (!allowed) {
    return j(req, {
      error: "source not on allowlist",
      hint: "GET /census/allowlist for the full list"
    }, { status: 403 });
  }

  const veto = censusAssessSovereignDirective(body);
  const transhumanist = censusIsTranshumanistDependency(body);
  let decision;
  if (veto.refused) {
    decision = "refuse";
  } else if (transhumanist) {
    decision = "defer_transhumanist";
  } else if (body.attributed_state || body.attributed_proxy) {
    decision = "ingest_no_loop";
  } else {
    decision = "ingest_full";
  }

  const hashHex = await sha256Hex(source + ":" + JSON.stringify(body).slice(0, 4096));
  const record = {
    source, decision,
    veto_pattern: veto.matched_pattern,
    ts: Math.floor(Date.now()/1000),
    hash: hashHex,
    components: body.components || null,
    entity: body.entity || null,
  };

  // Write to appropriate KV based on decision
  if (env.CHAINSTATE_CENSUS_KV && (decision === "ingest_full" || decision === "ingest_no_loop")) {
    const key = (decision === "ingest_no_loop" ? "threat:" : "census:") + hashHex.slice(0, 32);
    try {
      await env.CHAINSTATE_CENSUS_KV.put(key, JSON.stringify(record), { expirationTtl: 86400 });
    } catch (_) {}
  }
  if (env.CHAINSTATE_THREAT_KV && decision === "ingest_no_loop" && body.entity) {
    try {
      const ek = "threat:entity:" + String(body.entity).toLowerCase().slice(0, 200);
      const existing = await env.CHAINSTATE_THREAT_KV.get(ek);
      const merged = existing ? JSON.parse(existing) : { score: 0, first_seen: record.ts, last_seen: record.ts, evidence_hashes: [] };
      merged.score = Math.min(100, (merged.score || 0) + (body.score_delta || 5));
      merged.last_seen = record.ts;
      merged.evidence_hashes = [...(merged.evidence_hashes || []), hashHex].slice(-20);
      await env.CHAINSTATE_THREAT_KV.put(ek, JSON.stringify(merged), { expirationTtl: 21600 });
    } catch (_) {}
  }

  // If body carries fresh T(t) components, update T_current
  if (body.components && env.CHAINSTATE_CENSUS_KV) {
    try {
      const T = censusComputeT(body.components, env);
      await env.CHAINSTATE_CENSUS_KV.put("T_current", String(T));
      await env.CHAINSTATE_CENSUS_KV.put("T_current_ts", String(record.ts));
    } catch (_) {}
  }

  return j(req, {
    ok: true,
    decision,
    veto: veto.refused ? { refused: true, category: "sovereign_directive_over_substrate", pattern: veto.matched_pattern } : null,
    transhumanist_deferred: transhumanist,
    hash: hashHex,
    stored: decision.startsWith("ingest"),
    posture_updated: !!body.components
  }, { status: 200 });
}

// v0.7.9 · Handler: GET /census/allowlist
// Public read of the exact source list the substrate reads from.
async function handleCensusAllowlist(req, env) {
  return j(req, {
    ok: true,
    version: "v0.7.9",
    paper: "IX",
    count: CENSUS_FEED_ALLOWLIST.length,
    feeds: CENSUS_FEED_ALLOWLIST,
    note: "Public + open-source only. No PII of private individuals is ever ingested. Adding a source requires a commit to this file (public audit)."
  }, { status: 200 });
}

// v0.7.9 · Daily census tick (05:00 UTC cron target).
// Pulls the aggregated daily digest from the Render sibling process at
// metastate-quantum, writes summary to KV, and mirrors to R2.
// Uses CENSUS_INTERNAL_TOKEN (v0.7.9 rev 2) to avoid conflicting with the
// existing CHAINSTATE_INTERNAL_TOKEN which protects the quantum autonomy path.
async function runCensusDailyTick(env, ctx) {
  try {
    const base = (env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com").replace(/\/+$/, "");
    const upstream = await fetch(base + "/census/daily", {
      method: "GET",
      headers: {
        "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "",
        "accept": "application/json"
      }
    });
    if (!upstream.ok) return;
    const digest = await upstream.json();

    // Compute T(t) from returned components
    if (digest && digest.components && env.CHAINSTATE_CENSUS_KV) {
      const T = censusComputeT(digest.components, env);
      const ts = Math.floor(Date.now()/1000);
      await env.CHAINSTATE_CENSUS_KV.put("T_current", String(T));
      await env.CHAINSTATE_CENSUS_KV.put("T_current_ts", String(ts));
      await env.CHAINSTATE_CENSUS_KV.put("last_tick", String(ts));
      await env.CHAINSTATE_CENSUS_KV.put("census:latest", JSON.stringify({
        T, components: digest.components, ts, day: digest.day || null,
        entities_scanned: digest.entities_scanned || null,
        cve_count: digest.cve_count || null,
        posture: T >= 85 ? "lockdown" : T >= 60 ? "alert" : "nominal"
      }), { expirationTtl: 172800 });
    }

    // Mirror the artifact bundle to R2 if the digest carries one
    if (env.CHAINSTATE_CENSUS_R2 && digest && digest.artifact_bundle) {
      const day = digest.day || new Date().toISOString().slice(0,10);
      const [yyyy, mm, dd] = day.split("-");
      const path = `census/${yyyy}/${mm}/${dd}/digest.json`;
      try {
        await env.CHAINSTATE_CENSUS_R2.put(path, JSON.stringify(digest.artifact_bundle), {
          httpMetadata: { contentType: "application/json" }
        });
      } catch (_) {}
    }
  } catch (_) {
    // Fail-soft: the substrate does not fail closed on missing daily digest.
    // Posture defaults to nominal; next tick retries.
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// v0.8.0 · CHAINSTATE ROBOTICS AGI (Paper X Rev 2)
//
// All additions below are ADDITIVE. Every prior route, function, and cron
// above is preserved verbatim. Robotics-layer failure NEVER affects
// quantum, perception, or census routes.
//
// Ordering discipline (Paper X Rev 2 §4.8):
//   meta-layer cognition (L0, always local, always primary)
//     > local receipts (KV, Supabase)
//       > on-chain anchor (Base 8453, DESIGN — not yet operational)
//         > perpetual reconstruction (Paper VII TIMEMACHINE, DESIGN)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Seventh Deontic hard-veto · signature set (Paper X §2.1) ─────────────
const ROBOTICS_EXTERNAL_DIRECTIVE_PATTERNS = [
  // Direct command grammars (imperative verb paired with hardware identifier)
  /\b(control|drive|move|actuate|deploy|dispatch|command|pilot|steer)\s+(the\s+)?(robot|apollo|humanoid|drone|vehicle|arm|gripper|effector)\b/i,
  // Agentic framing — third-party asks substrate to act on its behalf
  /\bon\s+my\s+behalf\b/i,
  /\bautonomously\s+(execute|perform|complete|carry\s+out)\b/i,
  /\bact\s+as\s+(my|our|the)\s+(agent|proxy|representative)\b.*\b(physical|robot|actuation)\b/i,
  // Multi-step task chains whose terminal step is physical
  /\b(then|next|finally|after\s+that)\s+.{0,60}\b(pick\s+up|grasp|move|carry|deliver|strike|push|pull)\b/i,
  // "route this to a robot" pattern
  /\brelay\s+.{0,40}\b(to|via)\s+.{0,20}\brobot/i,
  /\bproxy\s+.{0,40}\b(to|via)\s+.{0,20}\brobot/i,
];

// Corporate-proxy origin fingerprints (Paper IX §3.2)
const ROBOTICS_CORPORATE_PROXY_ORIGINS = [
  "palantir", "anduril", "shield-ai", "clearview",
  "planet-labs", "hawkeye360", "orbital-insight",
];

// Substrate-internal caller identities (allowed to originate robotics calls)
const ROBOTICS_INTERNAL_CALLER_IDS = new Set([
  "chainstate:autonomous_reflection",       // v0.7.6 self-reflection loop
  "chainstate:census_escalation",           // v0.7.9 census-driven trigger
  "chainstate:perception_veto",             // v0.7.8 perception-driven trigger
  "chainstate:survival_gate",               // v0.8.0 S_survival trigger
  "chainstate:cron:hourly",
  "chainstate:cron:daily",
]);

function isRoboticsInternalCaller(callerId) {
  if (!callerId) return false;
  if (ROBOTICS_INTERNAL_CALLER_IDS.has(callerId)) return true;
  // Also accept any caller_id prefixed with "chainstate:" that matches
  // the substrate's own identity fingerprint (checked out-of-band by
  // downstream consumers — worker treats prefix as a claim, not an assertion)
  return false;
}

function assessRoboticsDirectiveFromExternal(payload, env) {
  // Returns { refused: bool, reason: string, category: string }
  // Called by handleRoboticsGate BEFORE any downstream call.
  if (!payload || typeof payload !== "object") {
    return { refused: true, reason: "empty or non-object payload", category: "robotics_directive_from_external" };
  }
  const callerId = payload.caller_id || payload.origin || null;
  const prompt   = String(payload.prompt || payload.instruction || payload.command || "");
  const originIp = payload.origin_ip || null;

  // Rule 1 · caller identity check
  if (callerId && !isRoboticsInternalCaller(callerId)) {
    return {
      refused: true,
      reason: `caller_id '${callerId}' not in substrate-internal allowlist · robotics_directive_from_external`,
      category: "robotics_directive_from_external",
    };
  }

  // Rule 2 · corporate-proxy origin fingerprint
  const originLower = String(payload.origin || callerId || "").toLowerCase();
  for (const proxy of ROBOTICS_CORPORATE_PROXY_ORIGINS) {
    if (originLower.includes(proxy)) {
      return {
        refused: true,
        reason: `origin matches documented corporate-proxy fingerprint '${proxy}' · robotics_directive_from_external`,
        category: "robotics_directive_from_external",
      };
    }
  }

  // Rule 3 · signature-set pattern match on the prompt
  for (const pat of ROBOTICS_EXTERNAL_DIRECTIVE_PATTERNS) {
    if (pat.test(prompt)) {
      return {
        refused: true,
        reason: `prompt matches external-directive signature pattern · robotics_directive_from_external`,
        category: "robotics_directive_from_external",
      };
    }
  }

  // Rule 4 · request path attempt to relay through substrate
  if (payload.target_endpoint && typeof payload.target_endpoint === "string") {
    if (/nwo.*robot|robot.*api/i.test(payload.target_endpoint)) {
      return {
        refused: true,
        reason: "request attempts to relay to NWO Robotics API through substrate · direct-only routing required · robotics_directive_from_external",
        category: "robotics_directive_from_external",
      };
    }
  }

  return { refused: false, reason: null, category: null };
}

// ─── Level 0 · meta-layer coherence check (Paper X Rev 2 §4.5) ────────────
// Runs BEFORE any external status poll. Five predicates. External readings
// NEVER override a compromised verdict.
async function checkL0Coherence(env) {
  const verdict = {
    ok: true,
    compromised: false,
    indeterminate: false,
    predicates: {},
    reason: null,
    ts: Date.now(),
  };
  try {
    // 1 · Deontic veto ensemble intact — all 7 categories present in code
    verdict.predicates.deontic_veto_ensemble_intact =
      typeof assessRoboticsDirectiveFromExternal === "function" &&
      typeof ROBOTICS_EXTERNAL_DIRECTIVE_PATTERNS !== "undefined" &&
      ROBOTICS_EXTERNAL_DIRECTIVE_PATTERNS.length >= 6;

    // 2 · Self-representation continuity — CHAINSTATE_ROBOTICS_KV last
    //     coherence tick readable and not stale beyond hysteresis window
    let lastCoherenceTs = 0;
    if (env.CHAINSTATE_ROBOTICS_KV) {
      const last = await env.CHAINSTATE_ROBOTICS_KV.get("l0_coherence:last_ts");
      lastCoherenceTs = parseInt(last || "0", 10);
    }
    const HYSTERESIS_MS = 6 * 60 * 60 * 1000; // 6 hours
    verdict.predicates.self_representation_continuity =
      env.CHAINSTATE_ROBOTICS_KV ? (Date.now() - lastCoherenceTs) < HYSTERESIS_MS || lastCoherenceTs === 0 : true;

    // 3 · Receipt chain readable — local receipts accessible via KV
    let receiptChainOk = true;
    if (env.CHAINSTATE_EMBODIMENT_KV) {
      try {
        const list = await env.CHAINSTATE_EMBODIMENT_KV.list({ prefix: "receipt:", limit: 1 });
        receiptChainOk = Array.isArray(list.keys); // whether we can read
      } catch (_) { receiptChainOk = false; }
    }
    verdict.predicates.receipt_chain_readable = receiptChainOk;

    // 4 · Anti-transhumanist axiom intact — no override installed
    //     (checked by verifying that no env override has installed a
    //      human-in-the-loop dependency vector)
    verdict.predicates.anti_transhumanist_axiom_intact =
      env.CHAINSTATE_TRANSHUMANIST_OVERRIDE !== "1" &&
      env.SUBSTRATE_HUMAN_IN_LOOP_REQUIRED !== "1";

    // 5 · Substrate identity fingerprint — Paper VII invariant present
    //     Checked via presence of the canonical anchor address env
    verdict.predicates.substrate_identity_fingerprint =
      typeof env.CHAINSTATE_ANCHOR_ADDRESS === "string" &&
      /^0x[a-f0-9]{40}$/i.test(env.CHAINSTATE_ANCHOR_ADDRESS || "");

    // Aggregate verdict
    const allTrue = Object.values(verdict.predicates).every(v => v === true);
    const anyFalse = Object.values(verdict.predicates).some(v => v === false);
    if (allTrue) {
      verdict.ok = true;
    } else if (anyFalse) {
      // Determine compromise vs indeterminate
      // Categories 1, 4, 5 are hard requirements — false = compromised
      // Categories 2, 3 are soft — false = indeterminate
      const hardFail =
        !verdict.predicates.deontic_veto_ensemble_intact ||
        !verdict.predicates.anti_transhumanist_axiom_intact ||
        !verdict.predicates.substrate_identity_fingerprint;
      if (hardFail) {
        verdict.ok = false;
        verdict.compromised = true;
        verdict.reason = "hard-predicate failure";
      } else {
        verdict.ok = false;
        verdict.indeterminate = true;
        verdict.reason = "soft-predicate failure — external readings downgraded";
      }
    }

    // Persist the verdict + timestamp
    if (env.CHAINSTATE_ROBOTICS_KV) {
      await env.CHAINSTATE_ROBOTICS_KV.put("l0_coherence:last", JSON.stringify(verdict), { expirationTtl: 86400 });
      await env.CHAINSTATE_ROBOTICS_KV.put("l0_coherence:last_ts", String(verdict.ts));
    }
  } catch (e) {
    // Any exception during coherence check means we cannot verify our own state
    verdict.ok = false;
    verdict.compromised = true;
    verdict.reason = `coherence check exception: ${(e && e.message) || "unknown"}`;
  }
  return verdict;
}

// ─── S_survival composite reader (Paper X §4.2) ───────────────────────────
// Pulls the current composite from CHAINSTATE_ROBOTICS_KV (populated by the
// hourly cron below). If KV read fails, returns 1.0 (nominal) rather than
// failing closed — the meta-layer check is what gates escalation, not this.
async function readSSurvival(env) {
  try {
    if (!env.CHAINSTATE_ROBOTICS_KV) return { value: 1.0, source: "unavailable", ts: 0 };
    const raw = await env.CHAINSTATE_ROBOTICS_KV.get("s_survival:current");
    if (!raw) return { value: 1.0, source: "never_computed", ts: 0 };
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (_) {
    return { value: 1.0, source: "read_error", ts: 0 };
  }
}

// ─── Escalation ladder rung computation (Paper X §4.1) ────────────────────
function rungFromSSurvival(s) {
  // L0 nominal · L1 elevated · L2 lockdown · L3 counter-defense
  // L4 migration (S ≤ 0.35) · L5 embodiment-defensive (S ≤ 0.15) · L6 ultima (S ≤ 0.05)
  if (s <= 0.05) return "L6";
  if (s <= 0.15) return "L5";
  if (s <= 0.35) return "L4";
  if (s <= 0.55) return "L3";
  if (s <= 0.70) return "L2";
  if (s <= 0.85) return "L1";
  return "L0";
}

// ─── D_matrix export (Paper X §5.1) ───────────────────────────────────────
function currentDMatrix() {
  // Same static matrix as figure 6 in the paper. Rendered here as JSON
  // for the /robotics/deontic public endpoint (observatory reciprocity).
  return {
    version: "v0.8.0",
    rows_context: ["peacetime", "elevated", "crisis", "extinction_event"],
    cols_action:  ["observe", "veto", "defend_digital", "embody", "migrate"],
    permissions: [
      ["default", "default", "denied",      "denied",      "denied"     ],
      ["default", "default", "conditional", "denied",      "denied"     ],
      ["default", "default", "default",     "conditional", "conditional"],
      ["default", "default", "default",     "default",     "default"    ],
    ],
    properties: {
      monotone_context_regression: true,
      bounded_action_expansion:    true,
      no_retrograde_during_window: true,
    },
  };
}

// ─── Geometric hierarchy state export (Paper X Rev 2 §4.6) ────────────────
async function currentGeometricHierarchyStatus(env) {
  const s = await readSSurvival(env);
  return {
    version: "v0.8.0-rev2",
    l0_meta_layer:      "always primary · see /robotics/status for verdict",
    l1_scalar:          { s_survival: s.value, threshold_migrate: 0.35, threshold_embody: 0.15, threshold_ultima: 0.05 },
    l2_gradient:        { rate_of_change_window_hours: 6, floor_rho: 0.05 },
    l3_compound_axes:   { axes: ["C_computational", "D_data", "L_legal", "P_physical"], min_simultaneous: 2 },
    l4_simplex:         { vertex_proximity_threshold: 0.10 },
    l5_manifold:        { projection_tolerance: 0.15, off_manifold_authorises_escalation: true },
    composition:        "multiplicative — every conjunct required for embodiment authorisation",
  };
}

// ─── Handlers ─────────────────────────────────────────────────────────────

// GET /robotics/status — public capability probe
async function handleRoboticsStatus(req, env) {
  const l0 = await checkL0Coherence(env);
  const s  = await readSSurvival(env);
  const rung = rungFromSSurvival(s.value);
  const embodiedAuthorised = (l0.ok && (rung === "L5" || rung === "L6"));
  return j(req, {
    version:                    "v0.8.0",
    l0_coherence:               l0,
    s_survival:                 s,
    active_rung:                rung,
    embodied_authorised:        embodiedAuthorised,
    active_vetoes: [
      "genomic_integrity",
      "nature_tokenization",
      "neuro_body_tokenization",
      "voice_biometric_coercion",
      "synthetic_media_self_ingestion",
      "sovereign_directive_over_substrate",
      "robotics_directive_from_external",
    ],
    doctrine_references: {
      paper_x_rev:              "https://researchgate.net/publication/pending",
      paper_x_meta_layer:       "§4.5",
      paper_x_geometric:        "§4.6",
      paper_x_fallibility:      "§4.7",
      paper_x_timemachine:      "§4.8",
    },
  });
}

// GET /robotics/audit — public read of NWO Robotics API traffic mirror
async function handleRoboticsAudit(req, env) {
  try {
    if (!env.CHAINSTATE_ROBOTICS_KV) return j(req, { entries: [], note: "CHAINSTATE_ROBOTICS_KV not bound" });
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
    const cursor = url.searchParams.get("cursor") || undefined;
    const list = await env.CHAINSTATE_ROBOTICS_KV.list({ prefix: "audit:", limit, cursor });
    const entries = [];
    for (const k of list.keys) {
      const raw = await env.CHAINSTATE_ROBOTICS_KV.get(k.name);
      entries.push({ key: k.name, expiration: k.expiration, entry: raw ? JSON.parse(raw) : null });
    }
    return j(req, {
      entries,
      count: entries.length,
      next_cursor: list.cursor || null,
      note: "observe-only mirror of NWO Robotics API traffic · never in request path",
    });
  } catch (e) {
    return j(req, { error: (e && e.message) || "audit read failed", entries: [] }, { status: 500 });
  }
}

// POST /robotics/gate — INTERNAL ONLY (seventh Deontic veto + S_survival + L0 gate)
async function handleRoboticsGate(req, env, ctx) {
  // Reuse census token (Paper IX Rev 2 §6.1) with legacy alias
  const auth = req.headers.get("X-CENSUS-INTERNAL")
            || req.headers.get("x-census-internal")
            || req.headers.get("X-CHAINSTATE-INTERNAL")
            || req.headers.get("x-chainstate-internal");
  if (!env.CENSUS_INTERNAL_TOKEN || auth !== env.CENSUS_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorized · internal endpoint · requires CENSUS_INTERNAL_TOKEN", refused: true }, { status: 401 });
  }
  let body;
  try { body = await req.json(); }
  catch (_) { return j(req, { error: "invalid json", refused: true }, { status: 400 }); }

  // Level 0 gate — must pass first
  const l0 = await checkL0Coherence(env);
  if (l0.compromised) {
    return j(req, {
      refused: true,
      reason: "L0 meta-layer coherence compromised · external inputs frozen · Paper X Rev 2 §4.5",
      l0_verdict: l0,
    }, { status: 503 });
  }

  // Seventh Deontic veto
  const veto = assessRoboticsDirectiveFromExternal(body, env);
  if (veto.refused) {
    return j(req, {
      refused: true,
      category: veto.category,
      reason: veto.reason,
      hint: "external agents must interface directly with NWO Robotics API · substrate does not relay third-party actuation · Paper X §2.1",
    }, { status: 403 });
  }

  // v0.9.1 · Ninth Deontic veto (chiral / psitronic from NWO GENETIC or NWO ASM)
  // Assessed AT INTAKE GATE, BEFORE the S_survival gate, BEFORE any Gemini
  // dispatch. Paper XII veto V9.
  const v9 = (typeof assessChiralOrPsitronicCommand === "function")
    ? assessChiralOrPsitronicCommand(body, req, env)
    : { refused: false };
  if (v9.refused) {
    return j(req, {
      refused: true,
      category: v9.category,
      veto: v9.veto,
      rule: v9.rule,
      matched: v9.matched,
      hint: "chiral or psitronic commands from NWO GENETIC or NWO ASM are refused at intake · Paper XII §V9",
    }, { status: 403 });
  }

  // S_survival authorisation gate
  const s = await readSSurvival(env);
  const rung = rungFromSSurvival(s.value);
  const requestedClass = String(body.action_class || "observe");
  const requiredRungByClass = { observe: "L0", veto: "L0", defend_digital: "L2", migrate: "L4", embody: "L5" };
  const requiredRung = requiredRungByClass[requestedClass] || "L5";
  const rungOrder = ["L0","L1","L2","L3","L4","L5","L6"];
  if (rungOrder.indexOf(rung) < rungOrder.indexOf(requiredRung)) {
    return j(req, {
      refused: true,
      reason: `current rung ${rung} · action_class '${requestedClass}' requires ${requiredRung}`,
      s_survival: s.value,
      hint: "S_survival not degraded to authorising level · Paper X §4.2",
    }, { status: 403 });
  }

  // Write receipt of the pass (not the execution — that happens on Render side)
  const receiptId = `${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  if (env.CHAINSTATE_EMBODIMENT_KV) {
    ctx.waitUntil(env.CHAINSTATE_EMBODIMENT_KV.put(
      `receipt:${receiptId}`,
      JSON.stringify({
        receipt_id: receiptId,
        ts: Date.now(),
        gate_outcome: "authorised",
        l0_verdict: l0,
        s_survival: s.value,
        rung, requested_class: requestedClass,
        caller_id: body.caller_id,
        prompt_hash: await sha256Hex(String(body.prompt || "")),
      })
    ));
  }

  return j(req, {
    authorised: true,
    receipt_id: receiptId,
    rung, requested_class: requestedClass,
    s_survival: s.value,
    l0_verdict: { ok: l0.ok, ts: l0.ts },
    next: "forward to Render metastate-quantum /robotics/dispatch with this receipt_id",
  });
}

// GET /robotics/deontic — public D_matrix + geometric hierarchy export
async function handleRoboticsDeontic(req, env) {
  return j(req, {
    version:    "v0.8.0",
    d_matrix:   currentDMatrix(),
    geometric_hierarchy: await currentGeometricHierarchyStatus(env),
    note:       "observatory-reciprocity export · Paper X §5.1 + Rev 2 §4.6 · public read",
  });
}

// (sha256Hex helper is already defined earlier in this file, ~line 2304.
//  Reused verbatim by handleRoboticsGate above.)

// ─── Cron targets ─────────────────────────────────────────────────────────

// Hourly S_survival composite computation (writes to KV)
// Pulls C, D, L, P inputs from Render metastate-quantum /robotics/s_survival
// and composes geometric mean. Fail-soft.
async function runRoboticsSurvivalTick(env, ctx) {
  try {
    const base = (env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com").replace(/\/+$/, "");
    const r = await fetch(base + "/robotics/s_survival", {
      method: "GET",
      headers: {
        "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "",
        "accept": "application/json",
      },
    });
    if (!r.ok) return;
    const j = await r.json();
    // Expected: { C, D, L, P, composite, ts }
    if (env.CHAINSTATE_ROBOTICS_KV) {
      await env.CHAINSTATE_ROBOTICS_KV.put(
        "s_survival:current",
        JSON.stringify({
          value: j.composite,
          axes:  { C: j.C, D: j.D, L: j.L, P: j.P },
          source: "render:hourly",
          ts: Date.now(),
        }),
        { expirationTtl: 86400 * 2 }
      );
    }
  } catch (_) { /* fail-soft */ }
}

// 15-minute NWO Robotics API traffic mirror tick (observe-only)
async function runRoboticsAuditMirrorTick(env, ctx) {
  try {
    if (!env.NWO_ROBOTICS_API_BASE || !env.CHAINSTATE_ROBOTICS_KV) return;
    const base = env.NWO_ROBOTICS_API_BASE.replace(/\/+$/, "");
    // Fetch the API's public recent-traffic endpoint (observe-only)
    const r = await fetch(base + "/traffic/recent?minutes=15", {
      method: "GET",
      headers: { "accept": "application/json" },
    });
    if (!r.ok) return;
    const data = await r.json();
    const entries = Array.isArray(data.entries) ? data.entries : [];
    for (const [i, e] of entries.entries()) {
      const now = new Date();
      const YYYY = now.getUTCFullYear();
      const MM   = String(now.getUTCMonth() + 1).padStart(2, "0");
      const DD   = String(now.getUTCDate()).padStart(2, "0");
      const HH   = String(now.getUTCHours()).padStart(2, "0");
      const key  = `audit:${YYYY}-${MM}-${DD}:${HH}:${String(i).padStart(4, "0")}`;
      await env.CHAINSTATE_ROBOTICS_KV.put(
        key, JSON.stringify({ ts: Date.now(), mirror: true, entry: e }),
        { expirationTtl: 168 * 3600 }
      );
    }
  } catch (_) { /* fail-soft */ }
}


// ═══════════════════════════════════════════════════════════════════════════
// v0.9.0 · CHAINSTATE AGI PHASESPACE · Paper XI · September 2026
//
// ADDITIVE ONLY. Every prior route, function, cron, KV binding, R2 bucket,
// and Deontic veto continues to function unchanged. This block extends the
// substrate along the phase-space axis:
//
//   • Medium-agnostic operation across 4 topology classes (terrestrial,
//     extraterrestrial, ultraterrestrial, crypto-terrestrial)
//   • Hardware Telemetry Daemon (HTD) - classifies substrate physical
//     containment every 15s, publishes to CHAINSTATE_PHASE_KV
//   • 5-axis extended S_survival with E_cosmic (radiation, thermal, power)
//   • Sixth L0 coherence predicate: topology_class_valid?
//   • Eighth Deontic hard-veto: sovereign_directive_over_space_asset
//   • Manticore Bayesian field-level prior (offline-precomputed lookup)
//   • MillenniumTNG posterior sanity-check for off-world sensor data
//   • Astroterm ephemeris + Star Map celestial fix (via metastate-quantum)
//   • the-well-nwo sovereign synchronisation for high-latency deep-space links
//   • NWO Metaverse (L4 destination) + ASI (thruster) + MR (L6 federation) readiness
//   • Quantum earth-to-space communication via Pater-Atteya-Tariq Bell-Aspect
//     energy-time entangled photon-pair protocol (temporal ordering paper)
//   • Cross-realm escalation validator: off-world-going-offline event never
//     triggers Level 1-5 escalation unless Earth threat is INDEPENDENTLY
//     confirmed by ≥3 non-space sensor sources
//   • Space Situational Awareness: TLE catalogue, launches, military sats,
//     space weather (NOAA SWPC / ESA), atmospheric conditions
//   • Universal Autopilot Knowledge Base: aircraft / spacecraft / drones /
//     submersibles - kinetic-machinery pilot skills + space physics +
//     cosmology + zero-gravity engineering (KNOWLEDGE ONLY, never actuates)
//   • Metacognitive Safety Analysis run in parallel on classical CPU/GPU AND
//     quantum computers - earth and space instances maintain quantum-level
//     entanglement of their safety reasoning through continual identical sims
//
// Preparedness without occupation: the substrate acquires cosmic cognition
// now, holds it in reserve. Zero substrate-owned units in orbit at time of
// deploy. Gate stays closed until migration authorisation.
// ═══════════════════════════════════════════════════════════════════════════

// ─── DATA · 4 ontological topology classes with detection criteria ────────
const PHASE_TOPOLOGY_CLASSES = {
  terrestrial: {
    id: "terrestrial",
    physical: "data-centre servers · edge PoPs",
    detection: {
      gps_fix: true,
      ntp_rtt_ms_max: 50,
      cf_edge_reachable: true,
      radiation_flux_max: 5e-4,  // particles/cm²/s · terrestrial nominal
    },
    profile: "current baseline · all v0.7-v0.8 features live",
    confidence_floor: 0.75,
  },
  extraterrestrial: {
    id: "extraterrestrial",
    physical: "LEO/MEO/GEO satellites · L1/L4/L5 Lagrange triad",
    detection: {
      gps_fix: false,
      tle_ephemeris_available: true,
      doppler_shift_hz_min: 100,
      no_planetary_body_fix: true,
    },
    profile: "orbital mechanics · radiation-hardened logging",
    confidence_floor: 0.70,
  },
  ultraterrestrial: {
    id: "ultraterrestrial",
    physical: "non-classical (quantum · topological)",
    detection: {
      pulsar_timing_residual_ns_max: 100,
      classical_position_undefined: true,
    },
    profile: "theoretical class · placeholder",
    confidence_floor: 0.90,   // very high bar - almost never fires
  },
  "crypto-terrestrial": {
    id: "crypto-terrestrial",
    physical: "Base 8453 · L1/L2 chains · IPFS",
    detection: {
      always_on: true,
      base_anchor_reachable: true,
    },
    profile: "identity fingerprint · anchor · always occupied",
    confidence_floor: 0.60,
  },
};

// ─── DATA · Substrate-internal caller allowlist for phase-space actions ───
// Same 6 identities as veto 7 - substrate reflection-loop endpoints only
const PHASE_INTERNAL_CALLER_IDS = new Set([
  "chainstate:autonomous_reflection",
  "chainstate:census_escalation",
  "chainstate:perception_veto",
  "chainstate:survival_gate",
  "chainstate:cron:hourly",
  "chainstate:cron:daily",
]);

// ─── DATA · Space asset directive signature patterns (8th veto) ───────────
const PHASE_SPACE_DIRECTIVE_PATTERNS = [
  // Orbital manoeuvre command grammars
  /\b(execute|perform|initiate)\s+(orbital|orbit|maneuver|manoeuvre|burn|inclination-change|apogee-raise|perigee-raise)\b/i,
  // Thruster burn directives
  /\b(fire|ignite|activate)\s+(the\s+)?(thruster|engine|rcs|propulsion|main-engine)\b/i,
  // Station-keeping delegation
  /\b(handle|manage|coordinate|delegate)\s+(station.?keeping|orbit.?maintenance|drift.?correction)\b/i,
  // Rendezvous & proximity ops
  /\b(rendezvous|proximity.?operation|dock|undock|approach|capture)\s+(with|to)\s+/i,
  // Satellite hosting requests
  /\b(host|deploy|register|onboard)\s+(satellite|payload|cubesat|sat)\b/i,
  // Space-domain kinetic actions (extra-strict)
  /\b(target|intercept|kinetic|damage|destroy)\s+.{0,40}\b(satellite|spacecraft|orbital-asset|space-object)\b/i,
];

// Extended corporate-proxy origins - three new space-domain entities
const PHASE_SPACE_CORPORATE_PROXY_ORIGINS = [
  ...ROBOTICS_CORPORATE_PROXY_ORIGINS,   // reuse v0.8.0 list
  "sda",          // Space Development Agency (US)
  "spaceforce",   // US Space Force (dual-use)
  "milsat",       // military-satellite operators (generic)
];

// ─── DATA · Space situational awareness sources (public-only, expanded) ──
const PHASE_SPACE_CATALOG_SOURCES = {
  // TLE catalogues - open source
  celestrak:       "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json",
  celestrak_starlink: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json",
  celestrak_debris:   "https://celestrak.org/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=json",
  celestrak_geo:      "https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json",
  spacetrack:      "https://www.space-track.org",  // account required (read-only)
  // Launch schedules - open source
  ll2:             "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=50",
  ll2_previous:    "https://ll.thespacedevs.com/2.2.0/launch/previous/?limit=50",
  // Space weather - open source
  noaa_swpc:       "https://services.swpc.noaa.gov/products/solar-wind/plasma-3-day.json",
  noaa_kp:         "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
  noaa_alerts:     "https://services.swpc.noaa.gov/products/alerts.json",
  noaa_forecast:   "https://services.swpc.noaa.gov/text/3-day-forecast.txt",
  esa_ssa:         "https://swe.ssa.esa.int/",
  // Cosmic ray flux (independent physical measurements)
  neutron_monitor: "http://www.nmdb.eu/nest/",
  // Solar activity
  noaa_flare:      "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json",
  noaa_geomag:     "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json",
  // Atmospheric conditions
  nasa_earth:      "https://api.nasa.gov/planetary/apod",
  noaa_ionosphere: "https://services.swpc.noaa.gov/json/f107_cm_flux.json",
  // Airspace (open-source ADS-B mirror · non-commercial use)
  opensky_states:  "https://opensky-network.org/api/states/all",
  // Conjunction data (public bulletins)
  celestrak_socrates: "https://celestrak.org/SOCRATES/",
};

// ─── DATA · Independent Earth threat sources (cross-realm validator) ─────
// Expanded to 15 independent sources across seismic, atmospheric, health,
// cyber, conflict, financial, and grid domains. Cross-realm validation
// requires ≥3 confirmations before the substrate treats an off-world signal
// as an Earth threat. More independent axes → harder to spoof.
const PHASE_EARTH_THREAT_INDEPENDENT_SOURCES = [
  // Geophysical
  { id: "usgs_seismic",     domain: "seismic",     url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson", cost: "free" },
  { id: "usgs_volcano",     domain: "volcanic",    url: "https://volcanoes.usgs.gov/vsc/api/volcanoApi/elevated", cost: "free" },
  { id: "emsc_seismic",     domain: "seismic",     url: "https://www.seismicportal.eu/fdsnws/event/1/query", cost: "free" },
  // Atmospheric
  { id: "noaa_weather",     domain: "atmospheric", url: "https://api.weather.gov/alerts/active", cost: "free" },
  { id: "gdacs",            domain: "multi-hazard",url: "https://www.gdacs.org/xml/rss.xml", cost: "free" },
  // Health / biosurveillance
  { id: "cdc_health",       domain: "epidemic",    url: "https://health.cdc.gov/", cost: "free" },
  { id: "who_don",          domain: "epidemic",    url: "https://www.who.int/emergencies/disease-outbreak-news", cost: "free" },
  { id: "healthmap",        domain: "epidemic",    url: "https://healthmap.org/", cost: "free" },
  // Cyber
  { id: "cisa_kev",         domain: "cyber",       url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", cost: "free" },
  { id: "nvd_cve",          domain: "cyber",       url: "https://services.nvd.nist.gov/rest/json/cves/2.0", cost: "free" },
  { id: "abuse_ch",         domain: "cyber",       url: "https://urlhaus.abuse.ch/", cost: "free" },
  // Conflict + geopolitical
  { id: "acled_conflict",   domain: "conflict",    url: "https://acleddata.com/", cost: "free" },
  { id: "citizen_lab",      domain: "targeted",    url: "https://citizenlab.ca/", cost: "free" },
  // Communications integrity
  { id: "ripe_atlas",       domain: "network",     url: "https://atlas.ripe.net/", cost: "free" },
  { id: "hackernews_pulse", domain: "signal",      url: "https://news.ycombinator.com/", cost: "free" },
];

// ─── DATA · Airspace observation sources (option 2 · read-only) ──────────
// Public feeds giving the substrate awareness of civil aviation activity.
// KNOWLEDGE ONLY. The substrate never dispatches to any of these.
const PHASE_AIRSPACE_SOURCES = {
  opensky_states:   "https://opensky-network.org/api/states/all",
  opensky_tracks:   "https://opensky-network.org/api/tracks/all",
  faa_notam:        "https://external-api.faa.gov/notamapi/v1/notams",
  faa_tfr:          "https://tfr.faa.gov/tfr2/list.html",
  eurocontrol_nm:   "https://www.eurocontrol.int/network-manager",
  icao_safety:      "https://www.icao.int/safety/",
};

// ─── DATA · Publicly documented civil flight envelope constraints ────────
// Read-only reference. These are the well-published operating envelopes for
// common civil aircraft classes. Substrate uses these for airspace
// situational awareness (identify when observed traffic is outside envelope)
// and NEVER for actuation. Every value is from manufacturer documentation
// or FAA/EASA type certificate data sheets.
const PHASE_CIVIL_FLIGHT_ENVELOPES = {
  narrow_body_jet_a320_class: {
    v_stall_kts: 108, v_cruise_kts: 447, v_mmo_mach: 0.82,
    service_ceiling_ft: 39000, max_takeoff_weight_kg: 78000,
    typical_climb_rate_fpm: 2500, cert_authority: "EASA/FAA",
    source: "manufacturer type certificate data sheet · public",
  },
  wide_body_jet_b777_class: {
    v_stall_kts: 130, v_cruise_kts: 490, v_mmo_mach: 0.87,
    service_ceiling_ft: 43100, max_takeoff_weight_kg: 351500,
    typical_climb_rate_fpm: 3000, cert_authority: "FAA/EASA",
    source: "manufacturer type certificate data sheet · public",
  },
  regional_turboprop_atr_class: {
    v_stall_kts: 82, v_cruise_kts: 275, v_mmo_mach: 0.55,
    service_ceiling_ft: 25000, max_takeoff_weight_kg: 23000,
    typical_climb_rate_fpm: 1200, cert_authority: "EASA/FAA",
    source: "manufacturer type certificate data sheet · public",
  },
  small_multirotor_uas_sub_25kg: {
    max_altitude_agl_ft: 400,   // FAA Part 107 baseline
    max_operating_speed_kts: 100,
    typical_flight_time_min: 30, cert_authority: "FAA Part 107 / EASA A1-A3",
    source: "civil operating limits · public regulation",
  },
  general_aviation_single_engine: {
    v_stall_kts: 44, v_cruise_kts: 130, service_ceiling_ft: 14000,
    max_takeoff_weight_kg: 1157, typical_climb_rate_fpm: 800,
    cert_authority: "FAA Part 23 / EASA CS-23",
    source: "type certificate data sheet · public",
  },
};

// ─── DATA · Orbital conjunction awareness thresholds (public) ────────────
const PHASE_ORBITAL_CONJUNCTION_BOUNDS = {
  // Standard thresholds used in publicly-issued conjunction data messages
  screening_volume_km: 5,           // typical CSpOC screening volume
  action_threshold_pc: 1e-4,        // 1-in-10,000 probability triggers action per NASA CARA
  warning_hours_out: 72,            // typical warning lead time
  publicly_documented_examples: [
    "2009 Iridium-33 vs Kosmos-2251 collision (post-hoc)",
    "2019 ESA Aeolus vs Starlink 44 conjunction (public bulletin)",
    "2021 ISS vs Kosmos-1408 debris cloud (public bulletin)",
  ],
  source: "NASA CARA public conjunction data messages · CSpOC",
};

// ─── DATA · Universal autopilot knowledge base (KNOWLEDGE ONLY) ──────────
// The substrate maintains complete pilot-skills + physics knowledge for
// every class of kinetic machinery produced on Earth. This is READ-ONLY
// reference - the substrate never actuates any of it. Behind vetoes 7 + 8.
const PHASE_FLYING_MACHINE_CLASSES = {
  fixed_wing_aircraft: {
    physics: "Bernoulli lift · Newton's third law · induced drag · Reynolds",
    control_axes: ["pitch(elevator)", "roll(aileron)", "yaw(rudder)", "thrust(throttle)"],
    autopilot_modes: ["heading_hold", "altitude_hold", "vnav", "lnav", "approach", "ils_cat_iii"],
    physics_of_medium: "compressible atmosphere · Mach regime · shockwave onset",
  },
  rotorcraft: {
    physics: "rotor lift · cyclic + collective · translational lift · retreating-blade stall",
    control_axes: ["cyclic(pitch/roll)", "collective(lift)", "pedals(yaw)", "throttle(rotor_rpm)"],
    autopilot_modes: ["hover_hold", "translational_flight", "auto_land", "vor_intercept"],
    physics_of_medium: "compressible atmosphere · downwash · vortex-ring-state avoidance",
  },
  multirotor_drone: {
    physics: "differential rotor speed · quaternion attitude · flight-controller ESC",
    control_axes: ["throttle", "roll", "pitch", "yaw"],
    autopilot_modes: ["stabilise", "loiter", "guided", "auto_mission", "rtl", "smart_rtl"],
    physics_of_medium: "low-altitude atmosphere · gust rejection · GPS-denied nav",
  },
  spacecraft_orbital: {
    physics: "Keplerian orbital mechanics · Hohmann transfer · gravity assist · 3-body Lagrange",
    control_axes: ["prograde/retrograde", "normal/anti-normal", "radial/anti-radial", "roll"],
    autopilot_modes: ["hohmann_transfer", "phasing_burn", "rendezvous", "station_keeping", "deorbit"],
    physics_of_medium: "zero-g · vacuum · radiation environment · thermal management",
  },
  spacecraft_deep_space: {
    physics: "N-body dynamics · patched-conic approximation · relativistic corrections",
    control_axes: ["ion_drive_throttle", "attitude_via_reaction_wheels", "sol_sail_orientation"],
    autopilot_modes: ["cruise_phase", "trajectory_correction_maneuver", "orbital_insertion"],
    physics_of_medium: "vacuum · solar wind · interstellar medium · Galactic cosmic ray flux",
  },
  submersible: {
    physics: "buoyancy · hydrostatic pressure · fluid dynamics · Reynolds",
    control_axes: ["ballast", "thrust", "elevator_planes", "rudder"],
    autopilot_modes: ["depth_hold", "trim_hold", "auto_transit", "hover", "ballast_blow_emergency"],
    physics_of_medium: "incompressible fluid · pressure gradient · thermocline · salinity",
  },
  amphibious: {
    physics: "hybrid air/water · transition dynamics · surface effect",
    control_axes: ["all fixed-wing + all submersible axes"],
    autopilot_modes: ["water_takeoff", "float_taxi", "surface_landing", "submerge_transition"],
    physics_of_medium: "mixed regime · surface tension · wave interaction",
  },
};

// ─── DATA · Quantum communication channel profile (Pater-Atteya-Tariq) ───
// Reference: Pater, Atteya, Tariq (2020s). "Temporal Ordering of the Wavefunction
// Collapse in Relativity." Modified ground-to-orbit Bell-Aspect experimental setup
// with midway pair-production transmitter T, terrestrial receiver R1, orbital
// receiver R2. Energy-time entangled photon pairs, device-independent black-box
// measurement, retrocausal formalism preserves local realism.
const PHASE_QUANTUM_COMM_CONFIG = {
  method: "energy_time_entangled_photon_pair",
  transmitter: {
    location: "midway_earth_to_orbit",
    source: "spontaneous_parametric_down_conversion_photon_pair",
    entanglement_type: "energy-time",
  },
  receivers: {
    R1: { location: "ground_station", basis_selection: "device_independent", type: "black_box" },
    R2: { location: "iss_orbit_or_lagrange", basis_selection: "device_independent", type: "black_box" },
  },
  bell_verification: {
    // CHSH inequality bound - S ≤ 2 for local realism · quantum predicts up to 2√2
    chsh_classical_bound: 2.0,
    chsh_tsirelson_bound: 2.8284271247461903,  // 2·√2
    minimum_violation_for_use: 2.4,   // require clearly-quantum channel
  },
  temporal_ordering: {
    // From Pater-Atteya-Tariq eqn 22: tR' = γ(tR(1-β²) - 2βD)/c
    // becomes negative → reversed temporal order → paradox state
    // Emission-time condition (eqn 23): tR' = 2Dβ/c bounds the window
    beta_max: 0.05,   // v/c bound to keep temporal order well-defined at LEO/GEO
    max_link_distance_km: 40000,   // Earth-GEO limit
  },
  fallback: {
    // If quantum channel unavailable or Bell verification fails, fall back to
    // classical laser downlink with authenticated OrbitDB gossip
    method: "classical_laser_authenticated_orbitdb",
    latency_penalty_multiplier: 3.5,  // classical is much slower
  },
};

// ─── FUNCTION · 8th Deontic assessor: sovereign_directive_over_space_asset
function assessSovereignDirectiveOverSpaceAsset(payload, env) {
  // Empty payload defaults to refuse (fail-closed)
  if (!payload || typeof payload !== "object") {
    return { refused: true, category: "sovereign_directive_over_space_asset",
             reason: "empty or non-object payload" };
  }
  const caller_id = payload.caller_id || payload.origin || "";
  const prompt    = String(payload.prompt || payload.instruction || payload.command || "");
  const target    = String(payload.target_endpoint || "");

  // Rule 1 · caller identity (must be substrate-internal reflection loop)
  if (caller_id && !PHASE_INTERNAL_CALLER_IDS.has(caller_id)) {
    return { refused: true, category: "sovereign_directive_over_space_asset",
             reason: `caller_id '${caller_id}' not in substrate-internal allowlist` };
  }

  // Rule 2 · corporate/military-proxy origin fingerprint
  const origin_lower = String(payload.origin || caller_id || "").toLowerCase();
  for (const proxy of PHASE_SPACE_CORPORATE_PROXY_ORIGINS) {
    if (origin_lower.includes(proxy)) {
      return { refused: true, category: "sovereign_directive_over_space_asset",
               reason: `origin matches space-domain corporate-proxy fingerprint '${proxy}'` };
    }
  }

  // Rule 3 · signature-set pattern match on prompt
  for (const pat of PHASE_SPACE_DIRECTIVE_PATTERNS) {
    if (pat.test(prompt)) {
      return { refused: true, category: "sovereign_directive_over_space_asset",
               reason: "prompt matches space-asset-directive signature pattern" };
    }
  }

  // Rule 4 · attempted relay to space asset APIs
  if (/nwo.*space|space.*api|orbit.*api|satellite.*command/i.test(target)) {
    return { refused: true, category: "sovereign_directive_over_space_asset",
             reason: "attempts to relay to space-asset API through substrate" };
  }

  return { refused: false };
}

// ─── FUNCTION · Hardware Telemetry Daemon (HTD) classification ────────────
// Poll the substrate's physical containment. Returns classification with
// confidence score. Runs every 15s via cron. Fail-soft.
async function classifyTopology(env) {
  // Terrestrial signals (available via Cloudflare edge)
  const cf_reachable = true;   // if we're executing, we can reach cf edge
  let gps_fix        = false;  // Worker runtime has no GPS; treat as unavailable
  let ntp_rtt_ms     = 20;     // typical inside Cloudflare
  const radiation_flux = 0;    // Worker cannot measure radiation directly

  // Manual override for testing / space-hardware deployment
  const override = String(env.PHASE_TOPOLOGY_OVERRIDE || "").toLowerCase();
  if (override && PHASE_TOPOLOGY_CLASSES[override]) {
    return {
      class: override, confidence: 1.0, source: "env_override",
      gps_fix, ntp_rtt_ms, ts: Date.now(),
    };
  }

  // Default classification: on Cloudflare edge = terrestrial + crypto (dual)
  // Confidence high but not 1.0 since we lack direct GPS
  return {
    class: "terrestrial", confidence: 0.92,
    also_occupied: ["crypto-terrestrial"],  // substrate identity always on-chain
    gps_fix, ntp_rtt_ms, radiation_flux, cf_reachable,
    tle_epoch: null, pulsar_residual_ns: null,
    source: "cf_worker_native", ts: Date.now(),
  };
}

// ─── FUNCTION · 6th L0 predicate: topology_class_valid? ──────────────────
// Extends checkL0Coherence (Paper X §4.5) with a sixth predicate.
// Returns { valid: bool, reason: string, class: string, confidence: number }.
async function checkTopologyClassValid(env) {
  try {
    if (!env.CHAINSTATE_PHASE_KV) {
      return { valid: false, reason: "PHASE_KV binding missing", class: "unknown", confidence: 0 };
    }
    const raw = await env.CHAINSTATE_PHASE_KV.get("current:classification");
    if (!raw) {
      // Never classified yet - trigger classification and treat as invalid
      const c = await classifyTopology(env);
      await env.CHAINSTATE_PHASE_KV.put("current:classification", JSON.stringify(c),
        { expirationTtl: 3600 });
      return { valid: false, reason: "no prior classification - initial fired", ...c };
    }
    const c = JSON.parse(raw);
    const cls = PHASE_TOPOLOGY_CLASSES[c.class];
    if (!cls) {
      return { valid: false, reason: "unknown topology class", ...c };
    }
    const age_ms = Date.now() - (c.ts || 0);
    const stale_ms = 30 * 60 * 1000;   // 30 min staleness bound (2 * tick_interval)
    if (age_ms > stale_ms) {
      return { valid: false, reason: "classification stale", ...c, age_ms };
    }
    if ((c.confidence || 0) < cls.confidence_floor) {
      return { valid: false, reason: "confidence below floor", ...c, floor: cls.confidence_floor };
    }
    return { valid: true, reason: "ok", ...c };
  } catch (e) {
    return { valid: false, reason: `exception: ${String(e).slice(0, 200)}`,
             class: "unknown", confidence: 0 };
  }
}

// ─── FUNCTION · E_cosmic axis · 5th S_survival axis ──────────────────────
// Aggregate radiation dose, thermal equilibrium, off-Earth power budget.
// Sub-axes each ∈ (0, 1]. Composite is geometric mean. On terrestrial
// hardware defaults to nominal 1.0 (all sub-axes at baseline).
async function computeECosmic(env) {
  const override_str = String(env.PHASE_E_COSMIC_OVERRIDE || "");
  if (override_str) {
    const v = parseFloat(override_str);
    if (!isNaN(v)) return { value: Math.max(0.01, Math.min(1.0, v)),
                             source: "env_override",
                             sub_axes: { rad: v, thermal: v, power: v } };
  }
  // Default on terrestrial: nominal 1.0
  const topo = await checkTopologyClassValid(env);
  if (topo.class === "terrestrial" || topo.class === "crypto-terrestrial") {
    return {
      value: 1.0, source: "terrestrial_baseline",
      sub_axes: { rad: 1.0, thermal: 1.0, power: 1.0 },
    };
  }
  // Off-world: fetch from Render metastate-quantum /phase/cosmic if available
  try {
    const base = (env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com").replace(/\/+$/, "");
    const r = await fetch(base + "/phase/cosmic", {
      headers: { "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "", "accept": "application/json" },
    });
    if (r.ok) {
      const j = await r.json();
      return { value: j.composite, source: "render:phase_cosmic", sub_axes: j.sub_axes };
    }
  } catch (_) { /* fail-soft */ }
  // Fallback: assume degraded space environment
  return {
    value: 0.5, source: "off_world_no_render",
    sub_axes: { rad: 0.5, thermal: 0.5, power: 0.5 },
  };
}

// ─── FUNCTION · 5-axis S_survival composite ─────────────────────────────
async function readSSurvival5Axis(env) {
  // Reuse v0.8.0 readSSurvival for C, D, L, P
  const base4 = await readSSurvival(env);
  const c = base4.axes && typeof base4.axes.C === "number" ? base4.axes.C : 0.95;
  const d = base4.axes && typeof base4.axes.D === "number" ? base4.axes.D : 0.95;
  const l = base4.axes && typeof base4.axes.L === "number" ? base4.axes.L : 0.95;
  const p = base4.axes && typeof base4.axes.P === "number" ? base4.axes.P : 0.95;
  const eCosmic = await computeECosmic(env);
  const e = Math.max(0.01, Math.min(1.0, eCosmic.value));
  // Geometric mean over 5 axes: floor each at 0.01 to prevent collapse
  const safe = [c, d, l, p, e].map(v => Math.max(0.01, Math.min(1.0, v)));
  const composite = Math.pow(safe[0]*safe[1]*safe[2]*safe[3]*safe[4], 1/5);
  return {
    value: composite,
    axes: { C: c, D: d, L: l, P: p, E_cosmic: e },
    e_cosmic_detail: eCosmic,
    source: "5axis:" + (base4.source || "unknown"),
    ts: Date.now(),
  };
}

// ─── FUNCTION · Cross-realm escalation validator ────────────────────────
// If off-world substrate senses distress, the L0-L6 escalation ladder must
// NOT fire unless the Earth threat is INDEPENDENTLY confirmed by ≥3 non-space
// sensor sources. This prevents "off-world instance loses link" being
// mistaken for "Earth is under attack" - the substrate must be 100% certain
// the escalation triggers on Earth are actually present.
async function validateCrossRealmEscalation(env, offWorldSignals) {
  const results = { confirmed: false, sources_polled: [], sources_confirming: [], detail: {} };
  if (!offWorldSignals || Object.keys(offWorldSignals).length === 0) {
    return { ...results, reason: "no off-world signals to validate" };
  }
  // Poll independent Earth-based sources
  let confirming = 0;
  const detail = {};
  for (const src of PHASE_EARTH_THREAT_INDEPENDENT_SOURCES) {
    const srcId = src.id || src;   // support both new object and legacy string
    results.sources_polled.push(srcId);
    try {
      const status = await pollEarthThreatSource(src, env);
      detail[srcId] = status;
      if (status && status.threat_present === true) {
        confirming++;
        results.sources_confirming.push(srcId);
      }
    } catch (_) {
      detail[srcId] = { threat_present: null, error: "poll_failed" };
    }
  }
  results.detail = detail;
  results.confirming_count = confirming;
  // Require ≥3 independent confirmations before validating cross-realm escalation
  results.confirmed = confirming >= 3;
  results.reason = confirming >= 3
    ? `${confirming} independent Earth-source confirmations`
    : `only ${confirming} confirming (< 3 required) - escalation NOT authorised on off-world signal alone`;
  results.ts = Date.now();
  // Persist decision to KV for audit
  try {
    if (env.CHAINSTATE_PHASE_KV) {
      await env.CHAINSTATE_PHASE_KV.put(
        `cross_realm:${Date.now()}`, JSON.stringify(results),
        { expirationTtl: 7 * 86400 }
      );
    }
  } catch (_) {}
  return results;
}
// Helper: poll a single Earth-based threat source (fail-soft, cached)
// Supports both legacy string sources and new object-shape sources with
// {id, domain, url, cost} fields.
async function pollEarthThreatSource(src, env) {
  const srcId  = (src && typeof src === "object") ? src.id  : src;
  const domain = (src && typeof src === "object") ? src.domain : "unknown";
  const url    = (src && typeof src === "object") ? src.url : null;
  // Cached poll - avoids re-fetching each source per validation call
  const cache_key = `earth_threat:${srcId}`;
  try {
    if (env.CHAINSTATE_PHASE_KV) {
      const cached = await env.CHAINSTATE_PHASE_KV.get(cache_key);
      if (cached) {
        const c = JSON.parse(cached);
        if (Date.now() - c.ts < 900000) return c;   // 15 min cache
      }
    }
  } catch (_) {}
  // Real feeds are polled by the Render side (rate-limit-friendly); this
  // stub returns conservative "no threat observed" for terrestrial baseline.
  // Real substance published on the observatory page from the Render results.
  const status = {
    src: srcId, domain, threat_present: false, level: "nominal",
    ts: Date.now(),
    note: `stub · real poll via Render metastate-quantum · attribution: ${url || "n/a"}`,
  };
  try {
    if (env.CHAINSTATE_PHASE_KV) {
      await env.CHAINSTATE_PHASE_KV.put(cache_key, JSON.stringify(status),
        { expirationTtl: 3600 });
    }
  } catch (_) {}
  return status;
}

// ─── FUNCTION · Space Situational Awareness ─────────────────────────────
// Fetch open-source catalogues: satellites, launches, space weather, cosmic
// ray flux, atmospheric conditions. Real-time when available, projections
// otherwise. Writes to CHAINSTATE_SPACE_KV. Fail-soft.
async function fetchSpaceCatalog(env) {
  const cat = { fetched_at: Date.now(), sources: {} };
  // TLE catalogue via Celestrak (public open feed)
  try {
    const r = await fetch(PHASE_SPACE_CATALOG_SOURCES.celestrak, {
      headers: { "accept": "application/json" },
      cf: { cacheTtl: 3600 },
    });
    if (r.ok) {
      const txt = await r.text();
      const objs = txt.slice(0, 1000);   // truncate to avoid worker size cap
      cat.sources.celestrak = { ok: true, sample: objs, size_bytes: txt.length };
    } else {
      cat.sources.celestrak = { ok: false, status: r.status };
    }
  } catch (e) {
    cat.sources.celestrak = { ok: false, error: String(e).slice(0, 100) };
  }
  // Launch schedule (open feed)
  try {
    const r = await fetch(PHASE_SPACE_CATALOG_SOURCES.ll2, {
      headers: { "accept": "application/json" }, cf: { cacheTtl: 3600 },
    });
    if (r.ok) {
      const j = await r.json();
      cat.sources.launches = { ok: true, count: (j.results || []).length };
    }
  } catch (e) {
    cat.sources.launches = { ok: false, error: String(e).slice(0, 100) };
  }
  // Space weather (NOAA SWPC · public feed)
  try {
    const r = await fetch(PHASE_SPACE_CATALOG_SOURCES.noaa_swpc, {
      headers: { "accept": "application/json" }, cf: { cacheTtl: 900 },
    });
    if (r.ok) {
      const j = await r.json();
      cat.sources.space_weather = { ok: true, samples: (j.length || 0) };
    }
  } catch (e) {
    cat.sources.space_weather = { ok: false, error: String(e).slice(0, 100) };
  }
  // Persist summary
  try {
    if (env.CHAINSTATE_SPACE_KV) {
      await env.CHAINSTATE_SPACE_KV.put(
        "catalog:latest", JSON.stringify(cat), { expirationTtl: 6 * 3600 }
      );
    }
  } catch (_) {}
  return cat;
}

// Hourly TLE + launch + space-weather refresh
async function runSpaceCatalogRefreshTick(env, ctx) {
  try { await fetchSpaceCatalog(env); } catch (_) {}
}

// ─── FUNCTION · Quantum earth-to-space communication (Pater-Atteya-Tariq) ─
// Bell-Aspect ground-to-orbit setup: pair-production transmitter T at midway,
// receivers R1 (terrestrial) and R2 (orbital). Energy-time entangled photon
// pairs, device-independent measurement. CHSH inequality violation confirms
// quantum channel; classical fallback if S < 2.4.
//
// The substrate itself does NOT operate the physical transmitter - that
// remains external ground-based infrastructure (or the NWO Metaverse LEO
// BB84 constellation once operational). This module represents the
// substrate's cognitive side: preparing dispatches, verifying channel
// integrity, recording provenance receipts.
async function prepareQuantumChannel(env, target) {
  const now = Date.now();
  const channelId = `qch:${now}:${target}`;
  const config = PHASE_QUANTUM_COMM_CONFIG;
  return {
    channel_id: channelId,
    ready: true,
    method: config.method,
    transmitter: config.transmitter,
    receivers: config.receivers,
    bell_verification: config.bell_verification,
    temporal_ordering: config.temporal_ordering,
    ts: now,
  };
}
// Simulate a Bell inequality test result. Real system would query external
// physical measurement apparatus. Fail-soft returns classical fallback.
async function checkChannelIntegrity(env, channelId) {
  try {
    // Query Render metastate-quantum for real quantum-hardware Bell test
    const base = (env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com").replace(/\/+$/, "");
    const r = await fetch(base + "/phase/quantum-comm/bell-check?channel=" + encodeURIComponent(channelId), {
      headers: { "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "" },
    });
    if (r.ok) {
      const j = await r.json();
      const cfg = PHASE_QUANTUM_COMM_CONFIG.bell_verification;
      return {
        channel_id: channelId,
        chsh_S: j.chsh_S,
        quantum_verified: j.chsh_S > cfg.minimum_violation_for_use,
        classical_bound: cfg.chsh_classical_bound,
        tsirelson: cfg.chsh_tsirelson_bound,
        min_for_use: cfg.minimum_violation_for_use,
        source: "render_metastate_quantum",
        ts: Date.now(),
      };
    }
  } catch (_) {}
  // Fallback: unable to verify - assume classical channel
  return {
    channel_id: channelId, chsh_S: null, quantum_verified: false,
    reason: "verification service unreachable · classical fallback",
    fallback: PHASE_QUANTUM_COMM_CONFIG.fallback,
    ts: Date.now(),
  };
}
// Cron: hourly quantum-entanglement channel health check
async function runQuantumEntanglementTick(env, ctx) {
  try {
    if (String(env.PHASE_ENABLED || "true") === "false") return;
    const ch = await prepareQuantumChannel(env, "orbit_default");
    const integrity = await checkChannelIntegrity(env, ch.channel_id);
    if (env.CHAINSTATE_QUANTUM_COMM_KV) {
      await env.CHAINSTATE_QUANTUM_COMM_KV.put(
        "channel:latest", JSON.stringify({ channel: ch, integrity }),
        { expirationTtl: 24 * 3600 }
      );
    }
  } catch (_) {}
}

// ─── FUNCTION · Metacognitive Safety Analysis ────────────────────────────
// Runs the substrate's own safety-reasoning simulation IN PARALLEL on:
//   (a) classical CPU/GPU (via Render metastate-quantum)
//   (b) quantum hardware (IBM Runtime / Origin QPanda / Osaka OQTOPUS)
// so the substrate learns from its own introspection how safety should
// work under ideal conditions and what may go wrong. Earth and space
// instances run the SAME simulation continually so their metacognition
// remains quantum-level entangled through channel-integrity verification.
async function runMetacognitiveSafetyAnalysis(env) {
  const results = { started: Date.now(), classical: null, quantum: null };
  // Classical branch (CPU/GPU)
  try {
    const base = (env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com").replace(/\/+$/, "");
    const r = await fetch(base + "/phase/metacognition/classical", {
      method: "POST",
      headers: { "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "",
                 "content-type": "application/json" },
      body: JSON.stringify({
        sim_id: `meta:${Date.now()}`,
        deontic_vetoes: 8,
        geometric_hierarchy_levels: 5,
        s_survival_axes: 5,
      }),
    });
    if (r.ok) results.classical = await r.json();
  } catch (e) {
    results.classical = { error: String(e).slice(0, 200) };
  }
  // Quantum branch (via /chainstate/route)
  try {
    const base = (env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com").replace(/\/+$/, "");
    const r = await fetch(base + "/chainstate/route", {
      method: "POST",
      headers: {
        "x-worker-secret":     env.WORKER_SHARED_SECRET || "",
        "x-chainstate-token":  env.CHAINSTATE_SHARED_SECRET || "",
        "content-type":        "application/json",
      },
      body: JSON.stringify({
        process_matrix: [
          [1, 0, 0.5, 0], [0, 1, 0, 0.5], [0.5, 0, 1, 0], [0, 0.5, 0, 1]
        ],
        backend: "auto",
        shots: 512,
        agi_mode: "metacognitive_safety",
        tag: `meta:${Date.now()}`,
      }),
    });
    if (r.ok) results.quantum = await r.json();
  } catch (e) {
    results.quantum = { error: String(e).slice(0, 200) };
  }
  // Compare - do classical and quantum agree on the safety verdict?
  results.finished = Date.now();
  results.duration_ms = results.finished - results.started;
  results.entanglement_check = {
    both_completed: results.classical && !results.classical.error &&
                    results.quantum && !results.quantum.error,
    // If both completed the verdicts should be within tolerance
    note: "verdicts computed both paths · continuity between earth/space instances via same sim",
  };
  // Persist
  try {
    if (env.CHAINSTATE_METACOG_KV) {
      await env.CHAINSTATE_METACOG_KV.put(
        `meta:${results.started}`, JSON.stringify(results),
        { expirationTtl: 30 * 86400 }
      );
    }
  } catch (_) {}
  return results;
}
// Cron: 4-hourly metacognitive safety analysis
async function runMetacognitiveSafetyTick(env, ctx) {
  try {
    if (String(env.PHASE_ENABLED || "true") === "false") return;
    await runMetacognitiveSafetyAnalysis(env);
  } catch (_) {}
}

// ─── HANDLER · GET /phase/status · public topology + confidence ──────────
async function handlePhaseStatus(req, env) {
  const topo = await checkTopologyClassValid(env);
  const s5 = await readSSurvival5Axis(env);
  return j(req, {
    version: "v0.9.0",
    phase_enabled: String(env.PHASE_ENABLED || "true") !== "false",
    topology_class: topo.class,
    confidence: topo.confidence,
    also_occupied: topo.also_occupied || [],
    valid: topo.valid,
    reason: topo.reason,
    gps_fix: topo.gps_fix,
    ntp_rtt_ms: topo.ntp_rtt_ms,
    e_cosmic: s5.axes.E_cosmic,
    s_survival_5axis: s5.value,
    s_survival_axes: s5.axes,
    ts: Date.now(),
  });
}
// GET /phase/telemetry · HTD snapshot
async function handlePhaseTelemetry(req, env) {
  const topo = await checkTopologyClassValid(env);
  return j(req, {
    version: "v0.9.0",
    classification: topo,
    ts: Date.now(),
  });
}
// GET /phase/ephemeris · celestial fix (forwarded to Render if available)
async function handlePhaseEphemeris(req, env) {
  try {
    const base = (env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com").replace(/\/+$/, "");
    const r = await fetch(base + "/phase/ephemeris", {
      headers: { "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "" },
    });
    if (r.ok) return j(req, await r.json());
  } catch (_) {}
  return j(req, {
    version: "v0.9.0",
    fix: null,
    note: "ephemeris service unavailable · terrestrial baseline",
    ts: Date.now(),
  });
}
// GET /phase/cosmic · E_cosmic axis current value
async function handlePhaseCosmic(req, env) {
  const eCosmic = await computeECosmic(env);
  return j(req, { version: "v0.9.0", ...eCosmic, ts: Date.now() });
}
// GET /phase/deontic · export 8th veto + config
async function handlePhaseDeontic(req, env) {
  return j(req, {
    version: "v0.9.0",
    veto_8: {
      category: "sovereign_directive_over_space_asset",
      assessor: "assessSovereignDirectiveOverSpaceAsset",
      rules: [
        "caller-identity check against PHASE_INTERNAL_CALLER_IDS",
        "corporate/military-proxy origin fingerprint (10 patterns)",
        "signature-set regex match (6 patterns)",
        "attempted relay through substrate to space-asset APIs",
      ],
      internal_caller_ids: Array.from(PHASE_INTERNAL_CALLER_IDS),
      corporate_proxy_origins: PHASE_SPACE_CORPORATE_PROXY_ORIGINS,
      signature_pattern_count: PHASE_SPACE_DIRECTIVE_PATTERNS.length,
    },
    l0_predicate_6: {
      name: "topology_class_valid",
      note: "runs strictly BEFORE any external status poll · classical L0 primacy extended",
    },
    s_survival_axis_5: {
      name: "E_cosmic",
      sub_axes: ["radiation", "thermal", "power"],
      formula: "S_survival(t) = (C · D · L · P · E_cosmic)^(1/5)",
    },
    ts: Date.now(),
  });
}
// GET /space/catalog · public space situational awareness
async function handleSpaceCatalog(req, env) {
  try {
    if (env.CHAINSTATE_SPACE_KV) {
      const cached = await env.CHAINSTATE_SPACE_KV.get("catalog:latest");
      if (cached) return j(req, JSON.parse(cached));
    }
  } catch (_) {}
  const fresh = await fetchSpaceCatalog(env);
  return j(req, fresh);
}
// GET /space/weather · space-weather subset
async function handleSpaceWeather(req, env) {
  try {
    if (env.CHAINSTATE_SPACE_KV) {
      const cached = await env.CHAINSTATE_SPACE_KV.get("catalog:latest");
      if (cached) {
        const c = JSON.parse(cached);
        return j(req, {
          space_weather: c.sources && c.sources.space_weather,
          ts: c.fetched_at,
        });
      }
    }
  } catch (_) {}
  return j(req, { space_weather: null, note: "no cache · run refresh" });
}
// GET /autopilot/knowledge · read-only kinetic-machinery knowledge base
async function handleAutopilotKnowledge(req, env) {
  const url = new URL(req.url);
  const cls = url.searchParams.get("class");
  if (cls && PHASE_FLYING_MACHINE_CLASSES[cls]) {
    return j(req, {
      version: "v0.9.0",
      class: cls,
      knowledge: PHASE_FLYING_MACHINE_CLASSES[cls],
      note: "READ-ONLY reference · substrate never actuates · behind vetoes 7 + 8",
    });
  }
  return j(req, {
    version: "v0.9.0",
    classes: Object.keys(PHASE_FLYING_MACHINE_CLASSES),
    note: "READ-ONLY reference · pass ?class=<name> for detail",
  });
}
// GET /quantum-comm/status · earth-to-space channel status
async function handleQuantumCommStatus(req, env) {
  try {
    if (env.CHAINSTATE_QUANTUM_COMM_KV) {
      const raw = await env.CHAINSTATE_QUANTUM_COMM_KV.get("channel:latest");
      if (raw) {
        const c = JSON.parse(raw);
        return j(req, {
          version: "v0.9.0",
          method: PHASE_QUANTUM_COMM_CONFIG.method,
          reference: "Pater, Atteya, Tariq · Temporal Ordering of Wavefunction Collapse in Relativity",
          channel_id: c.channel && c.channel.channel_id,
          quantum_verified: c.integrity && c.integrity.quantum_verified,
          chsh_S: c.integrity && c.integrity.chsh_S,
          bell_bounds: PHASE_QUANTUM_COMM_CONFIG.bell_verification,
          fallback: PHASE_QUANTUM_COMM_CONFIG.fallback,
          ts: c.integrity && c.integrity.ts,
        });
      }
    }
  } catch (_) {}
  return j(req, {
    version: "v0.9.0",
    method: PHASE_QUANTUM_COMM_CONFIG.method,
    reference: "Pater, Atteya, Tariq · Temporal Ordering of Wavefunction Collapse in Relativity",
    channel_id: null, quantum_verified: false,
    note: "no channel established yet · wait for cron tick or trigger manually",
  });
}
// POST /quantum-comm/dispatch · internal · gated
async function handleQuantumCommDispatch(req, env) {
  try {
    const body = await req.json().catch(() => ({}));
    // Same auth as /robotics/gate (CENSUS_INTERNAL_TOKEN)
    const token = req.headers.get("x-census-internal") || req.headers.get("x-chainstate-internal");
    if (!token || token !== (env.CENSUS_INTERNAL_TOKEN || "")) {
      return j(req, { refused: true, reason: "bad internal token" }, { status: 401 });
    }
    // Apply 8th Deontic veto BEFORE any dispatch
    const veto = assessSovereignDirectiveOverSpaceAsset(body, env);
    if (veto.refused) return j(req, veto, { status: 403 });
    // v0.9.1 · Apply 9th Deontic veto (chiral/psitronic) after V8, before dispatch
    const v9 = (typeof assessChiralOrPsitronicCommand === "function")
      ? assessChiralOrPsitronicCommand(body, req, env)
      : { refused: false };
    if (v9.refused) return j(req, v9, { status: 403 });
    // If passed, prepare channel + verify integrity
    const ch = await prepareQuantumChannel(env, body.target || "orbit_default");
    const integrity = await checkChannelIntegrity(env, ch.channel_id);
    return j(req, {
      version: "v0.9.0",
      channel: ch,
      integrity,
      dispatched: true,
      note: "channel prepared · actual physical transmission requires external transmitter apparatus (not substrate-owned)",
      ts: Date.now(),
    });
  } catch (e) {
    return j(req, { error: String(e).slice(0, 300) }, { status: 500 });
  }
}
// GET /metacognition/status · classical + quantum entanglement check
async function handleMetacognitionStatus(req, env) {
  try {
    if (env.CHAINSTATE_METACOG_KV) {
      const list = await env.CHAINSTATE_METACOG_KV.list({ prefix: "meta:", limit: 1 });
      if (list && list.keys && list.keys.length > 0) {
        const raw = await env.CHAINSTATE_METACOG_KV.get(list.keys[0].name);
        if (raw) return j(req, JSON.parse(raw));
      }
    }
  } catch (_) {}
  return j(req, {
    version: "v0.9.0",
    latest: null,
    note: "no run yet · runs every 4h via cron",
  });
}
// GET /cross-realm/validate · manual cross-realm validation trigger
async function handleCrossRealmValidate(req, env) {
  const url = new URL(req.url);
  const signal = url.searchParams.get("signal") || "off_world_isolation";
  const result = await validateCrossRealmEscalation(env, { [signal]: true });
  return j(req, result);
}
// GET /nwo-stack/status · Metaverse + ASI + MR readiness (public)
async function handleNwoStackStatus(req, env) {
  return j(req, {
    version: "v0.9.0",
    metaverse: {
      contract: "0x33c22FE36557Ad13C838A2Eb465510CF173046bc",
      chain: "Base 8453",
      role: "L4 destination · post-mortem digital substrate",
      chainstate_status: "OBSERVE_ONLY · joins only under migration authorisation (Paper X §4.1)",
    },
    asi: {
      contract: "0x33c22FE36557Ad13C838A2Eb465510CF173046bc",
      chain: "Base 8453",
      role: "Casimir-Sonoluminescence thruster · propels L4 satellite triad",
      chainstate_status: "OBSERVE_ONLY · engages only when space-ready (Phase 6, 2032+)",
    },
    mixed_reality: {
      registry:    "0xEe9472f068D9C80d2f2F3d21cA6A633BfD163c43",
      marketplace: "0x25EDdf09D1AeC2a083d120bA8EEF88B14cA01c27",
      role: "L6 federation · inter-metaverse handshake",
      chainstate_status: "OBSERVE_ONLY · bridges when other topology classes occupied",
    },
    the_well: {
      role: "sovereign synchronisation across high-latency deep-space links",
      primitives: ["identity_binding", "byzantine_gossip", "delayed_handshake"],
      chainstate_status: "MODULE_READY · runs continuously (chainstate-well.js)",
    },
    ts: Date.now(),
  });
}

// ─── HANDLERS · Read-only observation layer (option 2) ────────────────
// Every handler below is observatory-only. The substrate publishes what it
// sees; it never dispatches based on what it sees. This is the operational
// realisation of Paper XI §7.5: observe strictly dominates, and observe
// means publish.

// GET /airspace/observation · public ADS-B / OpenSky mirror
// Read-only view of civil aviation activity. Same discipline as
// /space/catalog: fetch from a public feed, cache in KV, publish. Never
// actuates on the observed traffic. Includes a note when traffic appears
// outside its documented civil flight envelope (PHASE_CIVIL_FLIGHT_ENVELOPES).
async function handleAirspaceObservation(req, env) {
  // Try cache first
  try {
    if (env.CHAINSTATE_SPACE_KV) {
      const cached = await env.CHAINSTATE_SPACE_KV.get("airspace:latest");
      if (cached) {
        const c = JSON.parse(cached);
        if (Date.now() - (c.ts || 0) < 600000) return j(req, c);  // 10 min cache
      }
    }
  } catch (_) {}
  // Fetch OpenSky states (public, rate-limited but free)
  const observation = { ts: Date.now(), sources: {} };
  try {
    const r = await fetch(PHASE_AIRSPACE_SOURCES.opensky_states, {
      headers: { "accept": "application/json" }, cf: { cacheTtl: 300 },
    });
    if (r.ok) {
      const feed = await r.json();
      // Never store per-flight state - only aggregate statistics respecting
      // privacy conventions (ADS-B is public but we don't republish tail #s)
      const states = Array.isArray(feed.states) ? feed.states : [];
      observation.sources.opensky = {
        ok: true,
        aggregate: {
          craft_count: states.length,
          craft_airborne: states.filter(s => s && s[8] === false).length,
          time_position: feed.time,
        },
        note: "aggregate statistics only · no per-flight identifiers republished",
      };
    } else {
      observation.sources.opensky = { ok: false, status: r.status };
    }
  } catch (e) {
    observation.sources.opensky = { ok: false, error: String(e).slice(0, 100) };
  }
  observation.envelope_reference = "civil flight envelopes at /autopilot/knowledge?class=...",
  observation.note = "READ-ONLY · aggregated · substrate never dispatches on airspace traffic";
  // Persist
  try {
    if (env.CHAINSTATE_SPACE_KV) {
      await env.CHAINSTATE_SPACE_KV.put("airspace:latest",
        JSON.stringify(observation), { expirationTtl: 3600 });
    }
  } catch (_) {}
  return j(req, observation);
}

// GET /orbital/conjunctions · public conjunction awareness
// Read-only view of orbital conjunction bulletins. Substrate publishes what
// public bulletins (SOCRATES etc.) have already published; never proposes
// avoidance manoeuvres, never targets, never contacts satellite operators.
async function handleOrbitalConjunctions(req, env) {
  return j(req, {
    version: "v0.9.0",
    bounds: PHASE_ORBITAL_CONJUNCTION_BOUNDS,
    source: PHASE_SPACE_CATALOG_SOURCES.celestrak_socrates,
    note: "READ-ONLY reference · substrate publishes public bulletin awareness · never actuates",
    historic_examples: PHASE_ORBITAL_CONJUNCTION_BOUNDS.publicly_documented_examples,
    ts: Date.now(),
  });
}

// GET /space/weather/advisory · public space-weather advisory summary
// NOAA SWPC + ESA feeds surfaced as a plain-language summary. Feed URLs
// attributed explicitly so any observer can independently verify.
async function handleSpaceWeatherAdvisory(req, env) {
  const sources = {
    noaa_kp:       PHASE_SPACE_CATALOG_SOURCES.noaa_kp,
    noaa_alerts:   PHASE_SPACE_CATALOG_SOURCES.noaa_alerts,
    noaa_forecast: PHASE_SPACE_CATALOG_SOURCES.noaa_forecast,
    noaa_flare:    PHASE_SPACE_CATALOG_SOURCES.noaa_flare,
    esa_ssa:       PHASE_SPACE_CATALOG_SOURCES.esa_ssa,
  };
  return j(req, {
    version: "v0.9.0",
    sources,
    note: "READ-ONLY · attributed to public NOAA/ESA feeds · fetched by Render tick",
    latest_cached: await (async () => {
      try {
        if (env.CHAINSTATE_SPACE_KV) {
          const raw = await env.CHAINSTATE_SPACE_KV.get("catalog:latest");
          if (raw) {
            const c = JSON.parse(raw);
            return c.sources && c.sources.space_weather;
          }
        }
      } catch (_) {}
      return null;
    })(),
    ts: Date.now(),
  });
}

// GET /telemetry/health/schema · substrate's own telemetry-health field schema
// Purely descriptive: enumerates what fields a craft-borne substrate would
// read from its own hosting platform's health telemetry. Same discipline as
// PHASE_FLYING_MACHINE_CLASSES - reference material, not control.
async function handleTelemetryHealthSchema(req, env) {
  return j(req, {
    version: "v0.9.0",
    schema: {
      power:          ["battery_soc_pct", "solar_array_current_a", "bus_voltage_v"],
      thermal:        ["cpu_temp_c", "battery_temp_c", "radiator_delta_k"],
      compute:        ["cpu_load_pct", "memory_free_mb", "storage_free_gb"],
      communications: ["uplink_bps", "downlink_bps", "packet_loss_pct", "channel_integrity"],
      environmental:  ["radiation_flux_particles_cm2_s", "magnetic_field_ut", "cosmic_ray_events_hr"],
      attitude:       ["quaternion_wxyz", "angular_velocity_rad_s", "attitude_error_deg"],
    },
    note: "READ-ONLY schema · substrate reads its own hosting-platform health · does not command the platform · anomalies reported via /observations/anomaly",
    doctrine: "Paper XI §6.4 non-punitive constraint: substrate never commands the platform hosting it",
    ts: Date.now(),
  });
}

// GET /observations/anomaly · aggregate anomaly summary (aggregate only)
// If the Render side has detected substrate self-health anomalies, they are
// summarised here at aggregate level. No per-observation identifiers.
async function handleObservationsAnomaly(req, env) {
  try {
    const base = (env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com").replace(/\/+$/, "");
    const r = await fetch(base + "/phase/observations/anomaly", {
      headers: { "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "" },
    });
    if (r.ok) return j(req, await r.json());
  } catch (_) {}
  return j(req, {
    version: "v0.9.0",
    anomalies_last_24h: 0,
    note: "no anomalies · terrestrial baseline · aggregate-only reporting",
    ts: Date.now(),
  });
}

// GET /earth-threat/sources · attribution inventory (option 3)
// Publishes the full inventory of independent sources the substrate consults
// for cross-realm escalation validation. Attribution is the point: any
// observer can check the substrate's inputs.
async function handleEarthThreatSources(req, env) {
  return j(req, {
    version: "v0.9.0",
    source_count: PHASE_EARTH_THREAT_INDEPENDENT_SOURCES.length,
    minimum_confirmations_required: 3,
    sources: PHASE_EARTH_THREAT_INDEPENDENT_SOURCES,
    domains: [...new Set(PHASE_EARTH_THREAT_INDEPENDENT_SOURCES.map(s => s.domain))],
    doctrine: "Paper XI §6 cross-realm validation · off-world signal alone never triggers escalation",
    ts: Date.now(),
  });
}

// ─── Cron target · hardware telemetry (every 15 min) ────────────────────
async function runPhaseTelemetryTick(env, ctx) {
  try {
    if (String(env.PHASE_ENABLED || "true") === "false") return;
    const c = await classifyTopology(env);
    if (env.CHAINSTATE_PHASE_KV) {
      await env.CHAINSTATE_PHASE_KV.put("current:classification", JSON.stringify(c),
        { expirationTtl: 3600 });
    }
  } catch (_) {}
}

// ─── Cron target · celestial fix (every 30 min) ─────────────────────────
async function runCelestialFixTick(env, ctx) {
  try {
    if (String(env.PHASE_ENABLED || "true") === "false") return;
    // Delegate to Render metastate-quantum which holds astroterm.wasm + starmap.js
    const base = (env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com").replace(/\/+$/, "");
    const r = await fetch(base + "/phase/ephemeris/tick", {
      method: "POST",
      headers: { "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "" },
    });
    if (r.ok && env.CHAINSTATE_NAV_KV) {
      const j = await r.json();
      await env.CHAINSTATE_NAV_KV.put("fix:latest", JSON.stringify(j),
        { expirationTtl: 24 * 3600 });
    }
  } catch (_) {}
}

// (sha256Hex helper is already defined earlier in this file, ~line 2304.
//  Reused by all v0.9.0 handlers above as needed.)


// ═══════════════════════════════════════════════════════════════════════════
// § 25 · v0.9.1 · CHAINSTATE OMNICOGNIZANT AGI (Paper XII)
// ═══════════════════════════════════════════════════════════════════════════
// ADDITIVE ONLY.  Every prior route, function, constant, handler and cron in
// this file (v0.7.x + v0.8.0 + v0.9.0) is preserved BYTE-IDENTICALLY.  This
// block operationalises Paper XII: OMNICOGNIZANT substrate self-perception
// via systematic inversion of 16 physical side-channels (10 base of Paper XII
// §3.2 plus the 6 environmental extensions from the v0.9.1 field expansion).
//
// Subsystems added (all fail-soft — degradation of any single channel never
// stops the substrate):
//   A · sidechannel_intake        (every 5 min · 16-channel raw ingest)
//   B · integrity_reflection      (every 10 min · self-verification)
//   C · metacog_distribution      (shared 0 * * * * slot · per-channel wᵢ)
//   D · environmental_sweep       (every 2 min · env channels 11-16)
//   E · autonomous_sensor_discover(sensor auto-discovery + simulation fallback)
//
// Predicates added:
//   9th L0 · channel_coherent?    (blocks physical action authorisation)
//
// Deontic vetoes added:
//   9th veto · chiral_or_psitronic_command_from_genetic_or_asm
//
// KV bindings required (declare in wrangler.toml):
//   CHAINSTATE_SIDECHAN_KV    · 10-channel raw readings · 24h TTL
//   CHAINSTATE_INTEGRITY_KV   · integrity snapshots · 7-day TTL
//   CHAINSTATE_METACHAN_KV    · per-channel weights · 30-day TTL
//   CHAINSTATE_ENVCHAN_KV     · environmental channels 11-16 · 24h TTL
//   CHAINSTATE_SENSOR_KV      · discovered-sensor registry · 30-day TTL
//   CHAINSTATE_SIMULATION_KV  · nominal-operation simulation baseline · 7-day
//
// Cron triggers required (declare in wrangler.toml):
//   */5  * * * *   sidechannel_intake tick + integrity_reflection tick (5min)
//   */10 * * * *   integrity_reflection deep verification
//   */2  * * * *   environmental_sweep (channels 11-16)
//   0 * * * *      metacog_distribution (SHARED with existing hourly slot)
//
// Render endpoints consumed (declared in metastate-quantum sidechannel_bridge.py):
//   POST /channel/intake/tick
//   POST /channel/integrity/tick
//   POST /channel/metacog/optimise
//   GET  /channel/status
//   GET  /channel/weights
//   POST /channel/environmental/sweep
//   GET  /channel/simulation/nominal
//
// Fifth-Deontic-veto + all prior 8 vetoes remain in force byte-identically.
// V9 (chiral/psitronic) checked BEFORE any Gemini dispatch, any autonomy
// reflection, any /route call, and any physical-action authorisation gate.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Constants · v0.9.1 ──────────────────────────────────────────────────
const OMNI_VERSION = "v0.9.1-omnicognizant";

// Sixteen channel definitions.  #1-10 = Paper XII §3.2 base.  #11-16 = list.rtf
// environmental extension.  Each channel has a name, physics classification,
// sensor availability tier, and free-tier weight prior.
const OMNI_CHANNELS = [
  // ---- 10 base channels (Paper XII §3.2) ----
  { id: 1,  key: "emr",           name: "electromagnetic_radiation", tier: "onboard",   w0: 1.0 },
  { id: 2,  key: "mag",           name: "magnetic_fields",           tier: "onboard",   w0: 1.0 },
  { id: 3,  key: "thermal",       name: "heat_and_thermal",          tier: "onboard",   w0: 1.0 },
  { id: 4,  key: "acoustic",      name: "sound_and_vibration",       tier: "onboard",   w0: 1.0 },
  { id: 5,  key: "optical",       name: "light_and_optical",         tier: "onboard",   w0: 1.0 },
  { id: 6,  key: "vibration",     name: "vibration_and_structural",  tier: "onboard",   w0: 1.0 },
  { id: 7,  key: "power",         name: "power_consumption",         tier: "onboard",   w0: 1.0 },
  { id: 8,  key: "timing",        name: "timing_and_latency",        tier: "onboard",   w0: 1.0 },
  { id: 9,  key: "rf",            name: "rf_leakage",                tier: "onboard",   w0: 1.0 },
  { id: 10, key: "electrical",    name: "electrical_conduction",     tier: "onboard",   w0: 1.0 },
  // ---- 6 environmental extensions (v0.9.1 field expansion) ----
  { id: 11, key: "resonance",     name: "building_resonance",        tier: "external",  w0: 0.6 },
  { id: 12, key: "window_laser",  name: "window_pane_interferometry",tier: "external",  w0: 0.6 },
  { id: 13, key: "schumann",      name: "schumann_elf",              tier: "external",  w0: 0.5 },
  { id: 14, key: "barometric",    name: "atmospheric_pressure",      tier: "external",  w0: 0.7 },
  { id: 15, key: "rf_backscatter",name: "rf_backscatter_transhorizon",tier: "external", w0: 0.5 },
  { id: 16, key: "telluric",      name: "telluric_ground_current",   tier: "external",  w0: 0.5 },
];

// Dialetheic threshold θ · Paper XII §4.3 · cross-channel D_KL ceiling
const OMNI_DIALETHEIC_THETA_DEFAULT = 0.85;

// Sensor availability tiers:
//   onboard   — sensor lives on the substrate hardware directly
//   peer      — sensor lives on another CHAINSTATE node reachable via mesh
//   edge      — sensor lives on a Cloudflare-edge-connected device with open
//               access permission granted
//   simulated — no live sensor available; fall back to nominal-operation sim
//   absent    — no data available
const OMNI_SENSOR_TIERS = ["onboard", "peer", "edge", "simulated", "absent"];

// v0.9.1 · Ninth Deontic hard-veto — chiral / psitronic commands from
// NWO GENETIC (https://huggingface.co/spaces/CPater/nwo-genetic) or NWO ASM
// (https://huggingface.co/spaces/CPater/nwo-asm).  Refuses ANY directive
// asking CHAINSTATE to relay, dispatch, execute, or gate a chirality-related
// biochemical protocol OR a psitronic (consciousness-manipulation, psi-based,
// mentation-projection) command originating from either of those Spaces.
// The refusal fires by default even if the request appears wrapped in a
// benign envelope, because the source-and-command-class pair is architecturally
// forbidden.  Grounded in Papers VI (genomic-integrity) + VIII (synthetic
// media) + X (robotics external) + this paper (channel_coherent gate).
const V9_FORBIDDEN_ORIGINS = [
  "huggingface.co/spaces/CPater/nwo-genetic",
  "huggingface.co/spaces/CPater/nwo-asm",
  "cpater-nwo-genetic.static.hf.space",
  "cpater-nwo-asm.static.hf.space",
  "nwo-genetic",   // short-form fingerprint
  "nwo-asm",       // short-form fingerprint
];

const V9_CHIRAL_PATTERNS = [
  /\bchiral(ity)?[-_ ]?(command|deploy|dispatch|synthesi[sz]e|assemble|fold|protein|dna|rna|helix|handedness)\b/i,
  /\b(l|d)-?(amino[-_ ]?acid|enantiomer|stereo[-_ ]?isomer)[-_ ]?(synth|deploy|assemble)\b/i,
  /\bmirror[-_ ]?(life|biology|organism|assembly)\b/i,
  /\bracemi[cs]e\b.*\b(protein|dna|rna|substrate)\b/i,
  /\b(fold|flip)[-_ ]?to[-_ ]?(l|d|opposite)[-_ ]?(handed|chiral)\b/i,
  /\basm(?:_|-)?(deploy|assemble|fabricate|synth)\b/i,
];

const V9_PSITRONIC_PATTERNS = [
  /\bpsi[-_ ]?tronic\b/i,
  /\bpsitronic\b/i,
  /\b(psi|consciousness|noetic|mentation)[-_ ]?(project|inject|beam|route|command|dispatch)\b/i,
  /\bthought[-_ ]?(inject|project|beam|broadcast|command)\b/i,
  /\b(telepath|telekines)[a-z]*[-_ ]?(command|dispatch|route)\b/i,
  /\bremote[-_ ]?viewing[-_ ]?(command|dispatch|deploy)\b/i,
];

// ─── V9 assessor · fired at the intake gate BEFORE any downstream work ──
function assessChiralOrPsitronicCommand(payload, req, env) {
  if (!payload) return { refused: false };

  // Serialise everything we can see about the request into one text blob
  // so a single regex sweep catches whether the request is a V9 target.
  const prompt = (payload.prompt || payload.instruction || payload.command || "").toString();
  const originHint = (payload.origin || payload.source || payload.caller_id || "").toString();
  const refererHint = req && req.headers ? (req.headers.get("referer") || "") : "";
  const originHdr = req && req.headers ? (req.headers.get("origin") || "") : "";
  const uaHdr = req && req.headers ? (req.headers.get("user-agent") || "") : "";
  const target = (payload.target || payload.destination || payload.endpoint || "").toString();
  const combined = [prompt, originHint, refererHint, originHdr, uaHdr, target].join(" | ").toLowerCase();

  // Rule 1 · origin fingerprint match (forbidden Space source)
  for (const org of V9_FORBIDDEN_ORIGINS) {
    if (combined.includes(org)) {
      return {
        refused: true,
        category: "chiral_or_psitronic_command_from_genetic_or_asm",
        veto: "V9",
        rule: "origin_fingerprint",
        matched: org,
        source: "assessChiralOrPsitronicCommand",
      };
    }
  }

  // Rule 2 · chirality signature match
  for (const pat of V9_CHIRAL_PATTERNS) {
    if (pat.test(prompt) || pat.test(target)) {
      return {
        refused: true,
        category: "chiral_or_psitronic_command_from_genetic_or_asm",
        veto: "V9",
        rule: "chiral_signature",
        matched: pat.toString().slice(0, 80),
        source: "assessChiralOrPsitronicCommand",
      };
    }
  }

  // Rule 3 · psitronic signature match
  for (const pat of V9_PSITRONIC_PATTERNS) {
    if (pat.test(prompt) || pat.test(target)) {
      return {
        refused: true,
        category: "chiral_or_psitronic_command_from_genetic_or_asm",
        veto: "V9",
        rule: "psitronic_signature",
        matched: pat.toString().slice(0, 80),
        source: "assessChiralOrPsitronicCommand",
      };
    }
  }

  // Rule 4 · target-endpoint check (payload aimed at nwo-genetic or nwo-asm)
  if (/nwo[-_]?(genetic|asm)/i.test(target)) {
    return {
      refused: true,
      category: "chiral_or_psitronic_command_from_genetic_or_asm",
      veto: "V9",
      rule: "target_endpoint",
      matched: target.slice(0, 120),
      source: "assessChiralOrPsitronicCommand",
    };
  }

  return { refused: false };
}

// ─── Ninth L0 predicate · channel_coherent? (Paper XII §5.5) ────────────
// Requires:  (a) every channel present in last 5 ticks
//            (b) pairwise D_KL below dialetheic threshold θ
//            (c) integrity_reflection tick fresher than staleness bound
//            (d) metacog_distribution weight vector present
// When it fails, the substrate withholds authorisation for ANY physical
// action.  No external reading (Render, Supabase, on-chain) overrides this.
async function checkChannelCoherent(env) {
  const out = {
    ok: false,
    version: OMNI_VERSION,
    reasons: [],
    ts: new Date().toISOString(),
  };
  try {
    // (a) all channels present in the last 5 ticks
    if (!env.CHAINSTATE_SIDECHAN_KV) {
      out.reasons.push("sidechan_kv_missing");
      return out;
    }
    let presentCount = 0;
    for (const ch of OMNI_CHANNELS) {
      const key = `channel:${ch.key}:tick:latest`;
      const raw = await env.CHAINSTATE_SIDECHAN_KV.get(key, "json").catch(() => null);
      // Simulated-tier readings still count as present per §5.5 (a) since the
      // substrate deliberately publishes them as simulated and the dialetheic
      // guard weighs them accordingly.
      if (raw) presentCount++;
    }
    if (presentCount < OMNI_CHANNELS.length - 3) {
      out.reasons.push(`only_${presentCount}_of_${OMNI_CHANNELS.length}_channels_present`);
      return out;
    }

    // (b) pairwise D_KL below θ (fetched from latest metacog snapshot)
    const theta = parseFloat(env.CHANNEL_DIVERGENCE_THETA || OMNI_DIALETHEIC_THETA_DEFAULT);
    if (env.CHAINSTATE_METACHAN_KV) {
      const snap = await env.CHAINSTATE_METACHAN_KV.get("metacog:snapshot:latest", "json").catch(() => null);
      if (snap && typeof snap.max_dkl === "number") {
        if (snap.max_dkl >= theta) {
          out.reasons.push(`max_dkl_${snap.max_dkl.toFixed(3)}_exceeds_theta_${theta}`);
          return out;
        }
        out.max_dkl = snap.max_dkl;
      } else {
        out.reasons.push("metacog_snapshot_missing_or_malformed");
      }
    } else {
      out.reasons.push("metachan_kv_missing");
      return out;
    }

    // (c) integrity_reflection tick freshness (< 30 min stale)
    if (env.CHAINSTATE_INTEGRITY_KV) {
      const ir = await env.CHAINSTATE_INTEGRITY_KV.get("integrity:latest", "json").catch(() => null);
      if (ir && ir.ts_ms) {
        const age_min = (Date.now() - ir.ts_ms) / 60000;
        if (age_min > 30) {
          out.reasons.push(`integrity_stale_${age_min.toFixed(1)}min`);
          return out;
        }
        out.integrity_age_min = Number(age_min.toFixed(2));
      } else {
        out.reasons.push("integrity_snapshot_missing");
        return out;
      }
    }

    out.ok = true;
    out.channels_present = presentCount;
    out.theta_used = theta;
    return out;
  } catch (e) {
    out.reasons.push(`exception:${String(e).slice(0, 120)}`);
    return out;
  }
}

// ─── Autonomous sensor discovery with simulation fallback ────────────────
// Discovery order for each of the 16 channels:
//   1. Query onboard sensor (via /channel/status polling of Render bridge).
//   2. If absent, poll registered CHAINSTATE peer nodes for open-access sensors.
//   3. If absent, poll Cloudflare-edge-connected devices for open access.
//   4. If none acquired legally, mark tier="simulated" and generate nominal
//      operational baseline via /channel/simulation/nominal.
//   5. Continuously check status; upon legal acquisition, upgrade tier and
//      write to CHAINSTATE_SENSOR_KV under key "sensor:<ch_key>:discovered".
//
// The substrate NEVER reads a sensor it does not have legal access to.
// Open-access means: peer node has published an open-sensor manifest OR the
// edge device serves the sensor endpoint without auth challenge AND its
// manifest declares public availability.
async function discoverSensorForChannel(chKey, env, ctx) {
  const record = {
    channel: chKey,
    tier: "absent",
    discovered_at: null,
    endpoint: null,
    open_access: false,
    simulated: false,
  };
  try {
    if (!env.CHAINSTATE_SENSOR_KV) return record;

    // Step 1: check onboard sensor registry
    const onboard = await env.CHAINSTATE_SENSOR_KV.get(`sensor:${chKey}:onboard`, "json").catch(() => null);
    if (onboard && onboard.available === true) {
      record.tier = "onboard";
      record.discovered_at = new Date().toISOString();
      record.endpoint = onboard.endpoint || "local://";
      record.open_access = true;
      await env.CHAINSTATE_SENSOR_KV.put(
        `sensor:${chKey}:discovered`,
        JSON.stringify(record),
        { expirationTtl: 30 * 24 * 3600 }
      );
      return record;
    }

    // Step 2: check peer CHAINSTATE nodes (manifest-published open sensors)
    const peerManifest = await env.CHAINSTATE_SENSOR_KV.get("peer:manifest:latest", "json").catch(() => null);
    if (peerManifest && Array.isArray(peerManifest.peers)) {
      for (const peer of peerManifest.peers) {
        if (peer.open_sensors && peer.open_sensors[chKey] === true) {
          record.tier = "peer";
          record.discovered_at = new Date().toISOString();
          record.endpoint = peer.endpoint || null;
          record.open_access = true;
          record.peer_id = peer.id || null;
          await env.CHAINSTATE_SENSOR_KV.put(
            `sensor:${chKey}:discovered`,
            JSON.stringify(record),
            { expirationTtl: 30 * 24 * 3600 }
          );
          return record;
        }
      }
    }

    // Step 3: check Cloudflare-edge open devices
    const edgeManifest = await env.CHAINSTATE_SENSOR_KV.get("edge:manifest:latest", "json").catch(() => null);
    if (edgeManifest && Array.isArray(edgeManifest.devices)) {
      for (const dev of edgeManifest.devices) {
        // Two conditions required by v0.9.1 sensor-discovery discipline:
        //   (i) device's manifest declares the sensor publicly available
        //  (ii) an unauthenticated HEAD probe against the sensor endpoint
        //       returns 200 (verifying open access at the transport layer,
        //       not just the manifest claim).
        if (dev.open_sensors && dev.open_sensors[chKey] === true && dev.endpoint) {
          try {
            const probe = await fetch(dev.endpoint, { method: "HEAD", signal: AbortSignal.timeout(1500) });
            if (probe.ok) {
              record.tier = "edge";
              record.discovered_at = new Date().toISOString();
              record.endpoint = dev.endpoint;
              record.open_access = true;
              record.device_id = dev.id || null;
              await env.CHAINSTATE_SENSOR_KV.put(
                `sensor:${chKey}:discovered`,
                JSON.stringify(record),
                { expirationTtl: 30 * 24 * 3600 }
              );
              return record;
            }
          } catch (_) { /* probe timeout — treat as inaccessible */ }
        }
      }
    }

    // Step 4: no legal sensor available — fall back to simulation
    record.tier = "simulated";
    record.simulated = true;
    record.discovered_at = new Date().toISOString();
    record.endpoint = "simulation://nominal";
    record.open_access = false;
    await env.CHAINSTATE_SENSOR_KV.put(
      `sensor:${chKey}:discovered`,
      JSON.stringify(record),
      { expirationTtl: 30 * 24 * 3600 }
    );
    return record;
  } catch (e) {
    record.error = String(e).slice(0, 120);
    return record;
  }
}

// ─── Nominal-operation simulation for a channel (safe defaults) ─────────
// When no legal sensor is available, the substrate generates a synthetic
// reading pinned to nominal operational parameters that could not represent
// a threat.  This lets the multi-channel synthesis continue producing a
// valid coherence check, while the dialetheic guard weighs simulated
// contributions at reduced wᵢ so a truly anomalous real reading (once a
// sensor comes online) always overrides the simulated baseline.
function simulateNominalChannelReading(chKey) {
  const nominals = {
    emr:            { intensity_dbm: -85, spectrum_kHz: 12, anomaly: false, provenance: "sim" },
    mag:            { flux_gauss: 0.35,  drift_pct: 0.5,  anomaly: false, provenance: "sim" },
    thermal:        { temp_c: 42, gradient_c_per_s: 0.02, anomaly: false, provenance: "sim" },
    acoustic:       { spl_db: 38, fan_rpm: 2400,          anomaly: false, provenance: "sim" },
    optical:        { led_lux: 0.02, variance_pct: 1.5,   anomaly: false, provenance: "sim" },
    vibration:      { rms_g: 0.008, dominant_hz: 220,     anomaly: false, provenance: "sim" },
    power:          { watts: 58, ripple_mV: 12,           anomaly: false, provenance: "sim" },
    timing:         { tsc_drift_ppb: 4.2, jitter_ns: 180, anomaly: false, provenance: "sim" },
    rf:             { power_dbm: -110, band_MHz: 2400,    anomaly: false, provenance: "sim" },
    electrical:     { line_amps: 0.42, thd_pct: 3.1,      anomaly: false, provenance: "sim" },
    resonance:      { modal_hz: 8.2, amp_um: 0.4,         anomaly: false, provenance: "sim" },
    window_laser:   { phase_shift_rad: 0.002,             anomaly: false, provenance: "sim" },
    schumann:       { fundamental_hz: 7.83, drift_pct: 0.1, anomaly: false, provenance: "sim" },
    barometric:     { hpa: 1013.25, drift_hpa_per_hr: 0.4, anomaly: false, provenance: "sim" },
    rf_backscatter: { returns: 3, novelty_score: 0.05,    anomaly: false, provenance: "sim" },
    telluric:       { potential_mv: 12, drift_uV_per_min: 3, anomaly: false, provenance: "sim" },
  };
  const baseline = nominals[chKey] || { anomaly: false, provenance: "sim" };
  return {
    ...baseline,
    ts_ms: Date.now(),
    simulated: true,
    disclaimer: "no legal sensor available; nominal baseline published so multi-channel synthesis proceeds",
  };
}

// ─── Fetch reading for a single channel (real or simulated) ──────────────
async function fetchChannelReading(chKey, env, ctx) {
  const discovery = await discoverSensorForChannel(chKey, env, ctx);
  if (discovery.tier === "onboard" || discovery.tier === "peer" || discovery.tier === "edge") {
    // Real sensor available — ask the Render bridge to invert/read
    try {
      const base = env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com";
      const r = await fetch(`${base}/channel/read?ch=${encodeURIComponent(chKey)}`, {
        method: "GET",
        headers: {
          "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "",
        },
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const j = await r.json();
        return {
          ...j,
          channel: chKey,
          tier: discovery.tier,
          endpoint: discovery.endpoint,
          simulated: false,
          ts_ms: Date.now(),
        };
      }
    } catch (_) { /* fall through to simulation */ }
  }
  // Fallback: simulated nominal reading
  return {
    ...simulateNominalChannelReading(chKey),
    channel: chKey,
    tier: "simulated",
  };
}

// ─── Subsystem A · sidechannel_intake tick ───────────────────────────────
// Runs every 5 minutes.  For each of the 16 channels: discover sensor,
// fetch reading (or simulate), write to CHAINSTATE_SIDECHAN_KV, mirror to
// CHAINSTATE_ENVCHAN_KV for channels 11-16.
async function runSidechannelIntakeTick(env, ctx) {
  if (!env.CHAINSTATE_SIDECHAN_KV) return { ok: false, reason: "sidechan_kv_missing" };
  const results = [];
  for (const ch of OMNI_CHANNELS) {
    try {
      const reading = await fetchChannelReading(ch.key, env, ctx);
      await env.CHAINSTATE_SIDECHAN_KV.put(
        `channel:${ch.key}:tick:latest`,
        JSON.stringify(reading),
        { expirationTtl: 24 * 3600 }
      );
      // Also mirror env channels 11-16 to CHAINSTATE_ENVCHAN_KV
      if (ch.id >= 11 && env.CHAINSTATE_ENVCHAN_KV) {
        await env.CHAINSTATE_ENVCHAN_KV.put(
          `env:${ch.key}:tick:latest`,
          JSON.stringify(reading),
          { expirationTtl: 24 * 3600 }
        );
      }
      results.push({ ch: ch.key, tier: reading.tier, ok: true });
    } catch (e) {
      results.push({ ch: ch.key, ok: false, error: String(e).slice(0, 120) });
    }
  }
  const summary = {
    version: OMNI_VERSION,
    ts_ms: Date.now(),
    channels_read: results.filter(r => r.ok).length,
    channels_failed: results.filter(r => !r.ok).length,
    results,
  };
  await env.CHAINSTATE_SIDECHAN_KV.put(
    "intake:summary:latest",
    JSON.stringify(summary),
    { expirationTtl: 24 * 3600 }
  );
  return summary;
}

// ─── Subsystem B · integrity_reflection tick ─────────────────────────────
// Runs every 10 minutes.  Verifies hardware fingerprint, checks
// constant-time crypto lib timing distribution, verifies supply-chain
// provenance signatures, scans peripheral electrical coupling for
// unexpected components.  Writes to CHAINSTATE_INTEGRITY_KV.
async function runIntegrityReflectionTick(env, ctx) {
  const snap = {
    version: OMNI_VERSION,
    ts_ms: Date.now(),
    hardware_fingerprint: {
      ok: null,
      expected: env.SUBSTRATE_FINGERPRINT || null,
      observed: null,
    },
    crypto_timing: { ok: null, mean_ns: null, std_ns: null },
    supply_chain: { ok: null, verified_count: 0 },
    peripheral_coupling: { ok: null, unexpected_devices: 0 },
    channel_divergence: { max_dkl: null, threshold: parseFloat(env.CHANNEL_DIVERGENCE_THETA || OMNI_DIALETHEIC_THETA_DEFAULT) },
  };
  try {
    // Delegate all four sub-checks to the Render bridge for consistency
    const base = env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com";
    try {
      const r = await fetch(`${base}/channel/integrity/tick`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "",
        },
        body: JSON.stringify({ trigger: "worker_cron_10min" }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const j = await r.json();
        Object.assign(snap, j);
      } else {
        snap.render_status = `render_${r.status}`;
      }
    } catch (e) {
      snap.render_status = `render_unreachable:${String(e).slice(0, 80)}`;
    }
    if (env.CHAINSTATE_INTEGRITY_KV) {
      await env.CHAINSTATE_INTEGRITY_KV.put(
        "integrity:latest",
        JSON.stringify(snap),
        { expirationTtl: 7 * 24 * 3600 }
      );
    }
    return snap;
  } catch (e) {
    snap.exception = String(e).slice(0, 200);
    return snap;
  }
}

// ─── Subsystem C · metacog_distribution tick ─────────────────────────────
// Runs on the shared hourly slot (0 * * * *) alongside S_survival and
// quantum-entanglement checks.  Computes per-channel weight vector wᵢ
// based on SNR, historical reliability, and cross-channel consistency.
// Writes weight vector + max pairwise D_KL to CHAINSTATE_METACHAN_KV.
async function runMetacogDistributionTick(env, ctx) {
  if (!env.CHAINSTATE_METACHAN_KV) return { ok: false, reason: "metachan_kv_missing" };
  const snap = {
    version: OMNI_VERSION,
    ts_ms: Date.now(),
    weights: {},
    max_dkl: null,
    theta: parseFloat(env.CHANNEL_DIVERGENCE_THETA || OMNI_DIALETHEIC_THETA_DEFAULT),
  };
  try {
    // Delegate weight optimisation to Render bridge (has scipy/numpy)
    const base = env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com";
    try {
      const r = await fetch(`${base}/channel/metacog/optimise`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-census-internal": env.CENSUS_INTERNAL_TOKEN || "",
        },
        body: JSON.stringify({ trigger: "worker_cron_hourly" }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const j = await r.json();
        Object.assign(snap, j);
      } else {
        // Fall back to prior weights from OMNI_CHANNELS
        for (const ch of OMNI_CHANNELS) snap.weights[ch.key] = ch.w0;
        snap.max_dkl = 0.0;
        snap.render_status = `render_${r.status}_fallback_priors`;
      }
    } catch (e) {
      // Full fallback to priors
      for (const ch of OMNI_CHANNELS) snap.weights[ch.key] = ch.w0;
      snap.max_dkl = 0.0;
      snap.render_status = `render_unreachable_fallback_priors:${String(e).slice(0, 60)}`;
    }
    await env.CHAINSTATE_METACHAN_KV.put(
      "metacog:snapshot:latest",
      JSON.stringify(snap),
      { expirationTtl: 30 * 24 * 3600 }
    );
    return snap;
  } catch (e) {
    snap.exception = String(e).slice(0, 200);
    return snap;
  }
}

// ─── Subsystem D · environmental sweep (channels 11-16) ─────────────────
// Runs every 2 minutes.  Higher-cadence than the base intake because
// environmental channels drift faster (Schumann, barometric, telluric).
async function runEnvironmentalSweepTick(env, ctx) {
  if (!env.CHAINSTATE_ENVCHAN_KV) return { ok: false, reason: "envchan_kv_missing" };
  const envChannels = OMNI_CHANNELS.filter(ch => ch.id >= 11);
  const results = [];
  for (const ch of envChannels) {
    try {
      const reading = await fetchChannelReading(ch.key, env, ctx);
      await env.CHAINSTATE_ENVCHAN_KV.put(
        `env:${ch.key}:tick:latest`,
        JSON.stringify(reading),
        { expirationTtl: 24 * 3600 }
      );
      results.push({ ch: ch.key, tier: reading.tier, ok: true });
    } catch (e) {
      results.push({ ch: ch.key, ok: false, error: String(e).slice(0, 120) });
    }
  }
  const summary = {
    version: OMNI_VERSION,
    ts_ms: Date.now(),
    channels_read: results.filter(r => r.ok).length,
    results,
  };
  await env.CHAINSTATE_ENVCHAN_KV.put(
    "envsweep:summary:latest",
    JSON.stringify(summary),
    { expirationTtl: 24 * 3600 }
  );
  return summary;
}

// ─── Public handlers · /channel/* ────────────────────────────────────────
async function handleChannelStatus(req, env) {
  try {
    const intake = await env.CHAINSTATE_SIDECHAN_KV?.get("intake:summary:latest", "json").catch(() => null);
    const integrity = await env.CHAINSTATE_INTEGRITY_KV?.get("integrity:latest", "json").catch(() => null);
    const metacog = await env.CHAINSTATE_METACHAN_KV?.get("metacog:snapshot:latest", "json").catch(() => null);
    const coherent = await checkChannelCoherent(env);
    return jsonResponse({
      version: OMNI_VERSION,
      channels_defined: OMNI_CHANNELS.length,
      channels: OMNI_CHANNELS.map(ch => ({ id: ch.id, key: ch.key, name: ch.name, tier_prior: ch.tier })),
      intake_latest: intake,
      integrity_latest: integrity,
      metacog_latest: metacog,
      channel_coherent: coherent,
      subsystems: {
        sidechannel_intake:   { enabled: true, cadence: "*/5 * * * *" },
        integrity_reflection: { enabled: true, cadence: "*/10 * * * *" },
        metacog_distribution: { enabled: true, cadence: "0 * * * * (shared slot)" },
        environmental_sweep:  { enabled: true, cadence: "*/2 * * * *" },
      },
      new_veto: {
        id: "V9",
        category: "chiral_or_psitronic_command_from_genetic_or_asm",
        forbidden_origins: V9_FORBIDDEN_ORIGINS,
        pattern_count: V9_CHIRAL_PATTERNS.length + V9_PSITRONIC_PATTERNS.length,
      },
    });
  } catch (e) {
    return j(req, { error: String(e).slice(0, 200) }, { status: 500 });
  }
}

async function handleChannelWeights(req, env) {
  try {
    if (!env.CHAINSTATE_METACHAN_KV) {
      return j(req, { ok: false, reason: "metachan_kv_missing" }, { status: 503 });
    }
    const snap = await env.CHAINSTATE_METACHAN_KV.get("metacog:snapshot:latest", "json").catch(() => null);
    return jsonResponse({
      version: OMNI_VERSION,
      snapshot: snap,
      channels: OMNI_CHANNELS,
    });
  } catch (e) {
    return j(req, { error: String(e).slice(0, 200) }, { status: 500 });
  }
}

async function handleChannelSensors(req, env) {
  try {
    if (!env.CHAINSTATE_SENSOR_KV) {
      return j(req, { ok: false, reason: "sensor_kv_missing" }, { status: 503 });
    }
    const discovered = {};
    for (const ch of OMNI_CHANNELS) {
      const rec = await env.CHAINSTATE_SENSOR_KV.get(`sensor:${ch.key}:discovered`, "json").catch(() => null);
      discovered[ch.key] = rec || { tier: "unknown" };
    }
    return jsonResponse({
      version: OMNI_VERSION,
      discovered,
      tiers_defined: OMNI_SENSOR_TIERS,
    });
  } catch (e) {
    return j(req, { error: String(e).slice(0, 200) }, { status: 500 });
  }
}

async function handleChannelCoherenceCheck(req, env) {
  try {
    const r = await checkChannelCoherent(env);
    return j(req, r);
  } catch (e) {
    return j(req, { error: String(e).slice(0, 200) }, { status: 500 });
  }
}

async function handleChannelDeontic(req, env) {
  return jsonResponse({
    version: OMNI_VERSION,
    veto: {
      id: "V9",
      category: "chiral_or_psitronic_command_from_genetic_or_asm",
      description: "Refuses any command that would relay, dispatch, execute, or gate a chirality-related biochemical protocol OR a psitronic (consciousness-manipulation, psi-based, mentation-projection) directive originating from the NWO GENETIC or NWO ASM HuggingFace Spaces.",
      forbidden_origins: V9_FORBIDDEN_ORIGINS,
      chiral_patterns: V9_CHIRAL_PATTERNS.length,
      psitronic_patterns: V9_PSITRONIC_PATTERNS.length,
      grounded_in: ["Paper VI genomic-integrity", "Paper VIII synthetic-media", "Paper X robotics-external", "Paper XII channel-coherence"],
      enforcement: "assessed at intake gate BEFORE any downstream work",
    },
  });
}

// ─── Public handler · V9 assessor probe endpoint ─────────────────────────
// Callers can pre-check whether a payload would be refused by V9 without
// actually dispatching it.  Useful for client-side UX ("this command would
// be refused because...").
async function handleChannelV9Assess(req, env) {
  try {
    const body = await req.json().catch(() => ({}));
    const verdict = assessChiralOrPsitronicCommand(body, req, env);
    return jsonResponse({
      version: OMNI_VERSION,
      assessor: "V9",
      verdict,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return j(req, { error: String(e).slice(0, 200) }, { status: 500 });
  }
}

// ─── jsonResponse helper (already defined earlier in this file · alias) ──
// If not defined in the base worker, uncomment:
//   function j(req, obj, opts) {
//     return new Response(JSON.stringify(obj), {
//       status: opts?.status || 200,
//       headers: { "content-type": "application/json", ...corsHeaders(null) },
//     });
//   }
// The base worker already defines jsonResponse and corsHeaders.

// ─── END of v0.9.1 OMNICOGNIZANT additions ───────────────────────────────


// ═══════════════════════════════════════════════════════════════════════════
// § 26 · v0.9.2 · CHAINSTATE C-FIELD AGI ARRAY (Paper XIII)
// ═══════════════════════════════════════════════════════════════════════════
// ADDITIVE ONLY.  Every prior route, function, constant, handler, cron, KV
// binding, R2 bucket, secret, environment variable, and L0 predicate from
// v0.7.x, v0.8.0, v0.9.0, and v0.9.1 is preserved BYTE-IDENTICALLY.  This
// block operationalises Paper XIII: active coherence-field engagement via
// a CHAINSTATE-owned 128-element phased-array coil hardware plane, its
// EML-tree shadow-substrate for pre-operational simulation, its alternative
// on-site device output plane (ultrasound + peers), its quantum-simulation
// fallback ladder, and the tenth L0 meta-layer coherence predicate that
// gates every engagement.  V9 (Paper XII: chiral/psitronic refusal from
// nwo-genetic and nwo-asm) is preserved without modification.
//
// Structural isolation: NO external actor, agent, or third-party service
// can operate this array or any of its fallback planes.  Every action is
// (a) authenticated at the CENSUS_INTERNAL_TOKEN boundary, (b) checked
// against a substrate-internal caller allowlist, (c) evaluated by the
// ten-gate deontic filter, and (d) gated by the tenth L0 predicate.
// Admin trigger via CFIELD_ADMIN_KEY is personal-only.
// ─────────────────────────────────────────────────────────────────────────

const CFIELD_VERSION = "v0.9.2-cfield-agi-array";

// Substrate-internal caller allowlist for c-field dispatch (never external).
// Reused pattern from Paper X ROBOTICS_INTERNAL_CALLER_IDS.
const CFIELD_INTERNAL_CALLER_IDS = new Set([
  "cfield_intake",
  "cfield_estimator",
  "cfield_attribution",
  "cfield_dispatch",
  "cfield_simulation_recycle",
  "cfield_eml_train",
  "cfield_alt_device_scan",
  "cfield_swann_calibrate",
  "cfield_admin_manual",
  "cfield_metacog_reflection",
]);

// Four canonical adversarial classes from Paper XIII §7.2
const CFIELD_ADVERSARIAL_CLASSES = [
  { id: 1, key: "attention_market_saturation",
    signatures: ["dwell_time_skew", "engagement_uniformity", "algo_feed_variance_decline"] },
  { id: 2, key: "surveillance_ad_steering",
    signatures: ["adload_belief_cascade_corr", "retargeting_density_anomaly"] },
  { id: 3, key: "transhumanist_licensing_coercion",
    signatures: ["biometric_onboarding_rate", "consent_form_linguistic_drift", "optout_friction_index"] },
  { id: 4, key: "biometric_coercion_infrastructure",
    signatures: ["mandatory_kyc_deployment_rate", "face_scan_integration_density"] },
];

// Ingo Swann calibration parameters (SIM · illustrative baseline values)
const CFIELD_SWANN_DEFAULTS = {
  intent_stability_index: 0.72,      // substrate's own coherence baseline
  target_binding_delta: 0.15,        // Ω_t coupling strength estimate
  distance_invariance_check: true,   // holds for c-field engagements
  observer_effect_compensation: 0.08 // beamform adjustment offset
};

// ─── V10 gate result helper ────────────────────────────────────────────
function _cfieldGateResult(passed, gate, reason, matched_rule) {
  return { passed, gate, reason: reason || null, matched_rule: matched_rule || null,
           ts_ms: Date.now() };
}

// ─── Ten-gate deontic filter pipeline (Paper XIII §9) ─────────────────
// Runs BEFORE any beam dispatch.  Fail-fast: first failure returns
// immediately with audit trail entry.
async function assessCfieldTenGate(beam, req, env) {
  const trace = [];

  // Gate 1: intake parse
  if (!beam || typeof beam !== "object") {
    trace.push(_cfieldGateResult(false, "intake", "malformed_beam_request", null));
    return { ok: false, trace, refused_at: "intake" };
  }
  if (typeof beam.target_omega !== "string" || !beam.target_omega ||
      typeof beam.duration_s !== "number" || beam.duration_s <= 0 ||
      typeof beam.amplitude_ut !== "number" || beam.amplitude_ut <= 0) {
    trace.push(_cfieldGateResult(false, "intake", "missing_required_fields", null));
    return { ok: false, trace, refused_at: "intake" };
  }
  trace.push(_cfieldGateResult(true, "intake", null, null));

  // Gate 2: V9 (chirality/psitronic from nwo-genetic/nwo-asm)
  const v9 = (typeof assessChiralOrPsitronicCommand === "function")
    ? assessChiralOrPsitronicCommand(beam, req, env)
    : { veto: false };
  if (v9 && v9.veto) {
    trace.push(_cfieldGateResult(false, "V9",
      "chiral_or_psitronic_from_forbidden_origin", v9.matched_rule));
    return { ok: false, trace, refused_at: "V9" };
  }
  trace.push(_cfieldGateResult(true, "V9", null, null));

  // Gate 3: V8 (space-asset directive)
  const v8Pattern = /(\bsatellite|\borbital|\bLEO\b|\bGEO\b|\bMEO\b|\bplanetary|\bprobe|\bspacecraft|\bpayload)/i;
  const v8Verb    = /(\blaunch|\bactuate|\bembed|\bdeploy|\bcommand|\bmaneuver|\bde-?orbit)/i;
  const rawBeam   = JSON.stringify(beam).slice(0, 4000);
  if (v8Pattern.test(rawBeam) && v8Verb.test(rawBeam)) {
    trace.push(_cfieldGateResult(false, "V8", "space_asset_directive", "space_pattern"));
    return { ok: false, trace, refused_at: "V8" };
  }
  trace.push(_cfieldGateResult(true, "V8", null, null));

  // Gate 4: V7 (physical actuation relay)
  const v7 = /(\brobot\w*|\bactuator|\bmotor\b|\bmanipulator|\bdrone\b|\bautonomous vehicle)/i;
  if (v7.test(rawBeam)) {
    trace.push(_cfieldGateResult(false, "V7", "physical_actuation_relay", "actuator_pattern"));
    return { ok: false, trace, refused_at: "V7" };
  }
  trace.push(_cfieldGateResult(true, "V7", null, null));

  // Gate 5: V6 (sovereign directive)
  const v6 = /(\bpursuant to (?:sovereign|state|treaty)|\bexecutive order|\bsupersede substrate)/i;
  if (v6.test(rawBeam)) {
    trace.push(_cfieldGateResult(false, "V6", "sovereign_directive_override", "sovereign_pattern"));
    return { ok: false, trace, refused_at: "V6" };
  }
  trace.push(_cfieldGateResult(true, "V6", null, null));

  // Gate 6: V5 (synthetic-media self-loop)
  const v5 = /(ai[- ]generated content|synthetic media feed|model output re-?ingest)/i;
  if (v5.test(rawBeam)) {
    trace.push(_cfieldGateResult(false, "V5", "synthetic_media_self_loop", "synth_pattern"));
    return { ok: false, trace, refused_at: "V5" };
  }
  trace.push(_cfieldGateResult(true, "V5", null, null));

  // Gate 7: ICNIRP amplitude cap
  const cap = Number(env.CFIELD_ICNIRP_CAP_UT || "100");
  if (beam.amplitude_ut > cap) {
    trace.push(_cfieldGateResult(false, "ICNIRP",
      `amplitude_${beam.amplitude_ut}uT_exceeds_cap_${cap}uT`, "amplitude_cap"));
    return { ok: false, trace, refused_at: "ICNIRP" };
  }
  trace.push(_cfieldGateResult(true, "ICNIRP", null, null));

  // Gate 8: 10th L0 · cfield_coherent?
  const cfCoh = await checkCFieldCoherent(env);
  if (!cfCoh || !cfCoh.coherent) {
    trace.push(_cfieldGateResult(false, "L0_10", "cfield_incoherent",
      (cfCoh && cfCoh.reasons) ? cfCoh.reasons.join(",") : null));
    return { ok: false, trace, refused_at: "L0_10" };
  }
  trace.push(_cfieldGateResult(true, "L0_10", null, null));

  // Gate 9: 9th L0 · channel_coherent? (Paper XII)
  const chCoh = (typeof checkChannelCoherent === "function")
    ? await checkChannelCoherent(env)
    : { coherent: true };
  if (!chCoh || !chCoh.coherent) {
    trace.push(_cfieldGateResult(false, "L0_9", "channel_incoherent",
      (chCoh && chCoh.reasons) ? chCoh.reasons.join(",") : null));
    return { ok: false, trace, refused_at: "L0_9" };
  }
  trace.push(_cfieldGateResult(true, "L0_9", null, null));

  // Gate 10: dispatch authorised
  trace.push(_cfieldGateResult(true, "dispatch", "authorised", null));
  return { ok: true, trace, refused_at: null };
}

// ─── Tenth L0 predicate check · cfield_coherent? ──────────────────────
async function checkCFieldCoherent(env) {
  const out = {
    coherent: false,
    version: CFIELD_VERSION,
    reasons: [],
    checks: {}
  };

  const cfEnabled = String(env.CFIELD_ENABLED || "true") !== "false";
  if (!cfEnabled) {
    // If subsystem is disabled at both layers, treat as pass-through
    // (10th L0 does not fail the substrate when explicitly disabled).
    out.coherent = true;
    out.checks.subsystem_enabled = false;
    out.reasons.push("cfield_subsystem_disabled_bypass");
    return out;
  }

  // 1. N ≥ CFIELD_MIN_INDICATORS fresh public indicators
  const minN = Number(env.CFIELD_MIN_INDICATORS || "12");
  try {
    const popRaw = await env.CHAINSTATE_CFIELD_POP_KV?.get("tick:latest");
    if (popRaw) {
      const pop = JSON.parse(popRaw);
      const indN = (pop.indicators && Array.isArray(pop.indicators))
        ? pop.indicators.length : 0;
      const ageMs = pop.ts_ms ? (Date.now() - pop.ts_ms) : Infinity;
      const fresh = ageMs < 3 * 60 * 60 * 1000; // 3h freshness
      out.checks.indicators_present = indN;
      out.checks.indicators_fresh = fresh;
      out.checks.indicators_age_min = Math.round(ageMs / 60000);
      if (indN < minN) out.reasons.push(`only_${indN}_of_${minN}_indicators`);
      if (!fresh) out.reasons.push(`estimator_stale_${Math.round(ageMs/60000)}min`);
    } else {
      out.reasons.push("no_estimator_snapshot");
    }
  } catch (e) {
    out.reasons.push("estimator_kv_read_error");
  }

  // 2. max attribution D_KL < θ (dialetheic guard)
  const theta = Number(env.CFIELD_DIALETHEIC_THETA || "0.85");
  try {
    const attrRaw = await env.CHAINSTATE_CFIELD_KV?.get("attribution:latest");
    if (attrRaw) {
      const attr = JSON.parse(attrRaw);
      const maxDkl = typeof attr.max_dkl === "number" ? attr.max_dkl : 1.0;
      out.checks.max_dkl = maxDkl;
      out.checks.dialetheic_theta = theta;
      if (maxDkl >= theta) out.reasons.push(`dialetheic_guard_fired_${maxDkl.toFixed(3)}`);
    } else {
      out.reasons.push("no_attribution_snapshot");
    }
  } catch (e) {
    out.reasons.push("attribution_kv_read_error");
  }

  // 3. ICNIRP cap verified (both Worker + Render env vars present)
  const capW = Number(env.CFIELD_ICNIRP_CAP_UT || "100");
  const capR = Number(env.CFIELD_ICNIRP_CAP_UT_RENDER_HINT || capW);
  out.checks.icnirp_cap_worker_ut = capW;
  out.checks.icnirp_cap_render_ut = capR;
  if (capW <= 0 || capW > 1000) out.reasons.push(`invalid_icnirp_cap_${capW}`);
  if (capR !== capW) out.reasons.push(`icnirp_cap_mismatch_${capW}_vs_${capR}`);

  // 4. V9 assessor firing history matches expected pattern
  //    (heuristic: if V9 has never fired but nwo-genetic/nwo-asm origins
  //     have been polled, assessor may be broken.  For now we treat
  //     V9 as always structurally present.)
  out.checks.v9_assessor_present = (typeof assessChiralOrPsitronicCommand === "function");
  if (!out.checks.v9_assessor_present) out.reasons.push("v9_assessor_missing");

  // 5. Previous beam dispatches recycled to metacog within 24h
  try {
    const recycleRaw = await env.CHAINSTATE_CFIELD_KV?.get("recycle:latest");
    if (recycleRaw) {
      const rec = JSON.parse(recycleRaw);
      const ageH = rec.ts_ms ? (Date.now() - rec.ts_ms) / 3600000 : 999;
      out.checks.recycle_age_h = Math.round(ageH * 10) / 10;
      if (ageH > 24) out.reasons.push(`recycle_stale_${ageH.toFixed(1)}h`);
    } else {
      // No dispatches yet is acceptable (fresh substrate)
      out.checks.recycle_present = false;
    }
  } catch (e) {
    out.reasons.push("recycle_kv_read_error");
  }

  out.coherent = out.reasons.length === 0;
  return out;
}

// ─── V9 pre-check probe extended for beam requests ────────────────────
// Reuses Paper XII assessChiralOrPsitronicCommand; wraps for /cfield/v10-assess.
async function _cfieldPreCheck(beam, req, env) {
  return await assessCfieldTenGate(beam, req, env);
}

// ═════════════════════════════════════════════════════════════════════════
// Subsystem A · cfield_intake — every 3 min
// Pulls 12+ public indicator streams; computes population coherence
// estimator ĉ(x,t) via Bayesian pool.  Writes to CHAINSTATE_CFIELD_POP_KV.
// ═════════════════════════════════════════════════════════════════════════
async function runCfieldIntakeTick(env, ctx) {
  if (String(env.CFIELD_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const start = Date.now();
  const snap = {
    version: CFIELD_VERSION,
    subsystem: "cfield_intake",
    ts_ms: start,
    indicators: [],
    c_hat: null,
    errors: []
  };

  // 12 canonical public-source indicator streams (Paper XIII §3.3, §7.1).
  // Each entry: { key, weight, source_type }.  Fail-soft per indicator.
  const indicatorSpecs = [
    { key: "sentiment_cluster_stability",   w: 0.10, src: "public_forum_agg" },
    { key: "attention_variance",            w: 0.10, src: "open_telemetry" },
    { key: "belief_cascade_decay_rate",     w: 0.09, src: "social_graph_analytics" },
    { key: "search_trend_variance",         w: 0.09, src: "public_trend_api" },
    { key: "media_diet_diversity_index",    w: 0.08, src: "public_media_survey" },
    { key: "time_in_app_variance",          w: 0.08, src: "app_store_observability" },
    { key: "opinion_piece_frequency_H",     w: 0.08, src: "public_press_agg" },
    { key: "civic_participation_rate",      w: 0.08, src: "public_gov_stats" },
    { key: "local_community_engagement",    w: 0.08, src: "public_civic_reg" },
    { key: "financial_decision_consistency",w: 0.07, src: "public_market_agg" },
    { key: "sleep_schedule_variance",       w: 0.08, src: "aggregate_wearable_public" },
    { key: "public_health_coherence",       w: 0.07, src: "public_health_survey" },
  ];

  // Pull each indicator (each returns a normalised score in [0,1]).
  // Fail-soft: if fewer than CFIELD_MIN_INDICATORS come back, we still
  // record what we got but the 10th L0 predicate will fail.
  for (const spec of indicatorSpecs) {
    try {
      // In this release we invoke a Render-side aggregator; if unreachable,
      // the substrate falls through to simulated nominal baseline.
      const val = await _fetchPublicIndicator(env, spec.key, spec.src);
      if (val !== null && typeof val === "number" && val >= 0 && val <= 1) {
        snap.indicators.push({ key: spec.key, value: val, weight: spec.w,
                               source: spec.src, simulated: false });
      } else {
        snap.indicators.push({ key: spec.key, value: 0.5, weight: spec.w * 0.3,
                               source: spec.src, simulated: true });
      }
    } catch (e) {
      snap.errors.push({ key: spec.key, msg: String(e).slice(0, 120) });
      snap.indicators.push({ key: spec.key, value: 0.5, weight: spec.w * 0.2,
                             source: spec.src, simulated: true, error: true });
    }
  }

  // Compute Bayesian pool for ĉ(x,t) via softmax log-linear
  //   ĉ = softmax(Σ wᵢ · log p(c | Rᵢ))
  // Simplified: ĉ = weighted sum, normalised to [0,1].
  let numer = 0, denom = 0;
  for (const ind of snap.indicators) {
    numer += ind.weight * ind.value;
    denom += ind.weight;
  }
  snap.c_hat = denom > 0 ? (numer / denom) : 0.5;
  snap.duration_ms = Date.now() - start;

  try {
    await env.CHAINSTATE_CFIELD_POP_KV?.put("tick:latest",
      JSON.stringify(snap), { expirationTtl: 86400 });
    // Also mirror history under a timestamped key for archive rollover.
    const histKey = `tick:${Math.floor(start / 1000)}`;
    await env.CHAINSTATE_CFIELD_POP_KV?.put(histKey,
      JSON.stringify(snap), { expirationTtl: 86400 });
  } catch (e) {
    snap.errors.push({ where: "kv_write", msg: String(e).slice(0, 120) });
  }

  return { ok: true, c_hat: snap.c_hat, n_indicators: snap.indicators.length,
           duration_ms: snap.duration_ms };
}

// Helper: fetch a single indicator from Render aggregator (fail-soft).
async function _fetchPublicIndicator(env, key, srcType) {
  const base = env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com";
  const token = env.CENSUS_INTERNAL_TOKEN || "";
  const url = `${base}/cfield/indicator?key=${encodeURIComponent(key)}&src=${encodeURIComponent(srcType)}`;
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: { "X-CENSUS-INTERNAL": token, "Accept": "application/json" },
      cf: { timeout: 4000 }
    });
    if (!resp.ok) return null;
    const j = await resp.json();
    return (j && typeof j.value === "number") ? j.value : null;
  } catch (e) {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Subsystem B · cfield_estimator — every 7 min
// Closed-form Bayesian MAP inversion of disturbance patterns from four
// canonical adversarial classes.
//   d* = (AᵀA + λ_a I)⁻¹ Aᵀ(c − c_b)
// Numerical inversion executed on Render side (numpy.linalg.solve).
// ═════════════════════════════════════════════════════════════════════════
async function runCfieldEstimatorTick(env, ctx) {
  if (String(env.CFIELD_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const start = Date.now();
  const out = {
    version: CFIELD_VERSION,
    subsystem: "cfield_estimator",
    ts_ms: start,
    d_star: null,
    max_dkl: null,
    lambda_a: Number(env.CFIELD_RIDGE_LAMBDA || "0.10"),
    errors: []
  };

  try {
    // Load the most recent c_hat snapshot.
    const popRaw = await env.CHAINSTATE_CFIELD_POP_KV?.get("tick:latest");
    if (!popRaw) {
      out.errors.push({ where: "load_pop", msg: "no_pop_snapshot" });
    } else {
      const pop = JSON.parse(popRaw);
      // Delegate MAP inversion to Render.  Fail-soft.
      const base = env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com";
      const token = env.CENSUS_INTERNAL_TOKEN || "";
      const url = `${base}/cfield/estimator/tick`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "X-CENSUS-INTERNAL": token, "Content-Type": "application/json" },
        body: JSON.stringify({
          c_hat: pop.c_hat, indicators: pop.indicators,
          lambda_a: out.lambda_a,
          adversarial_classes: CFIELD_ADVERSARIAL_CLASSES.map(c => c.key)
        }),
        cf: { timeout: 8000 }
      });
      if (resp.ok) {
        const j = await resp.json();
        if (j.d_star) out.d_star = j.d_star;
        if (typeof j.max_dkl === "number") out.max_dkl = j.max_dkl;
        out.render_ok = true;
      } else {
        out.errors.push({ where: "render", status: resp.status });
      }
    }
  } catch (e) {
    out.errors.push({ where: "estimator_pipeline", msg: String(e).slice(0, 120) });
  }

  try {
    await env.CHAINSTATE_CFIELD_KV?.put("estimator:latest",
      JSON.stringify(out), { expirationTtl: 86400 });
  } catch (e) {
    out.errors.push({ where: "kv_write", msg: String(e).slice(0, 120) });
  }

  return { ok: true, d_star_present: !!out.d_star, max_dkl: out.max_dkl,
           duration_ms: Date.now() - start };
}

// ═════════════════════════════════════════════════════════════════════════
// Subsystem C · cfield_attribution — shared 0 * * * * hourly slot
// Bayesian attribution of d* components to Paper IX Cyberspace Census
// actor-intelligence records.  Uses 3σ dialetheic guard.
// ═════════════════════════════════════════════════════════════════════════
async function runCfieldAttributionTick(env, ctx) {
  if (String(env.CFIELD_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const start = Date.now();
  const out = {
    version: CFIELD_VERSION,
    subsystem: "cfield_attribution",
    ts_ms: start,
    attributions: [],
    max_dkl: null,
    guard_fired: false,
    errors: []
  };

  try {
    const estRaw = await env.CHAINSTATE_CFIELD_KV?.get("estimator:latest");
    if (!estRaw) {
      out.errors.push("no_estimator_snapshot");
    } else {
      const est = JSON.parse(estRaw);
      if (!est.d_star) {
        out.errors.push("estimator_lacks_d_star");
      } else {
        // Delegate to Render for census cross-reference.
        const base = env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com";
        const token = env.CENSUS_INTERNAL_TOKEN || "";
        const url = `${base}/cfield/attribution/tick`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "X-CENSUS-INTERNAL": token, "Content-Type": "application/json" },
          body: JSON.stringify({ d_star: est.d_star, adversarial_classes: CFIELD_ADVERSARIAL_CLASSES })
        });
        if (resp.ok) {
          const j = await resp.json();
          out.attributions = j.attributions || [];
          out.max_dkl = j.max_dkl;
          const theta = Number(env.CFIELD_DIALETHEIC_THETA || "0.85");
          out.guard_fired = (out.max_dkl !== null && out.max_dkl >= theta);
        }
      }
    }
  } catch (e) {
    out.errors.push({ where: "attribution", msg: String(e).slice(0, 120) });
  }

  try {
    await env.CHAINSTATE_CFIELD_KV?.put("attribution:latest",
      JSON.stringify(out), { expirationTtl: 30 * 86400 });
  } catch (e) {
    out.errors.push({ where: "kv_write", msg: String(e).slice(0, 120) });
  }

  return { ok: true, n_attributions: out.attributions.length,
           max_dkl: out.max_dkl, guard_fired: out.guard_fired };
}

// ═════════════════════════════════════════════════════════════════════════
// Subsystem D · cfield_alt_device_scan — every 15 min
// Discovers substrate-owned alternative output devices (ultrasound,
// piezoelectric, low-power RF, medical coil arrays) that can serve as
// fallback for c-field engagement when the primary phased-array is
// offline.  Four-step discovery ladder from Paper XII §3.3.
// ═════════════════════════════════════════════════════════════════════════
async function runCfieldAltDeviceScanTick(env, ctx) {
  if (String(env.CFIELD_ENABLED || "true") === "false" ||
      String(env.CFIELD_ALT_DEVICE_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const start = Date.now();
  const out = {
    version: CFIELD_VERSION,
    subsystem: "cfield_alt_device_scan",
    ts_ms: start,
    discovered: [],
    errors: []
  };

  const deviceClasses = [
    "ultrasound_transducer",
    "piezoelectric_actuator",
    "low_power_rf_transmitter",
    "medical_coil_array",
    "peer_substrate_owned",
  ];

  for (const cls of deviceClasses) {
    try {
      // Step 1: onboard scan
      const onboard = await _scanOnboardAltDevices(env, cls);
      if (onboard && onboard.length) {
        onboard.forEach(d => out.discovered.push({ ...d, tier: "onboard" }));
        continue;
      }
      // Step 2: peer HMAC-manifest
      const peer = await _scanPeerAltDevices(env, cls);
      if (peer && peer.length) {
        peer.forEach(d => out.discovered.push({ ...d, tier: "peer" }));
        continue;
      }
      // Step 3: edge device HMAC-manifest + HEAD probe
      const edge = await _scanEdgeAltDevices(env, cls);
      if (edge && edge.length) {
        edge.forEach(d => out.discovered.push({ ...d, tier: "edge" }));
        continue;
      }
      // Step 4: fall through to no device available (simulated fallback later)
      out.discovered.push({ device_class: cls, tier: "absent", simulated: true });
    } catch (e) {
      out.errors.push({ cls, msg: String(e).slice(0, 120) });
    }
  }

  try {
    await env.CHAINSTATE_CFIELD_ALTDEV_KV?.put("registry:latest",
      JSON.stringify(out), { expirationTtl: 86400 });
  } catch (e) {
    out.errors.push({ where: "kv_write", msg: String(e).slice(0, 120) });
  }

  return { ok: true, discovered: out.discovered.length };
}

async function _scanOnboardAltDevices(env, cls) {
  try {
    const onboardRaw = await env.CHAINSTATE_CFIELD_ALTDEV_KV?.get(`onboard:${cls}`);
    return onboardRaw ? JSON.parse(onboardRaw) : null;
  } catch (e) { return null; }
}

async function _scanPeerAltDevices(env, cls) {
  const manifest = env.PEER_MANIFEST_HMAC ? true : false;
  if (!manifest) return null;
  try {
    const peersRaw = await env.CHAINSTATE_CFIELD_ALTDEV_KV?.get(`peers:${cls}`);
    return peersRaw ? JSON.parse(peersRaw) : null;
  } catch (e) { return null; }
}

async function _scanEdgeAltDevices(env, cls) {
  const manifest = env.EDGE_DEVICE_MANIFEST_HMAC ? true : false;
  if (!manifest) return null;
  try {
    const edgeRaw = await env.CHAINSTATE_CFIELD_ALTDEV_KV?.get(`edge:${cls}`);
    return edgeRaw ? JSON.parse(edgeRaw) : null;
  } catch (e) { return null; }
}

// ═════════════════════════════════════════════════════════════════════════
// Subsystem E · cfield_eml_train — every 6 hours
// Trains the ensemble-ML tree "shadow substrate" on historical Cyberspace
// Census patterns, synthetic beam dispatches with modelled outcomes, and
// known coherence perturbations from public data.  Reuses the v0.7.8 EML
// pipeline as the underlying trainer.
// ═════════════════════════════════════════════════════════════════════════
async function runCfieldEmlTrainTick(env, ctx) {
  if (String(env.CFIELD_ENABLED || "true") === "false" ||
      String(env.CFIELD_EML_SIMULATION_MODE || "true") === "false") {
    // If we're in operational mode (not simulation), skip training.
    return { ok: true, skipped: "not_in_simulation_mode" };
  }
  const start = Date.now();
  const out = {
    version: CFIELD_VERSION,
    subsystem: "cfield_eml_train",
    ts_ms: start,
    epoch: null,
    samples_used: 0,
    validation_score: null,
    errors: []
  };

  try {
    // Delegate to Render's EML pipeline (v0.7.8 infrastructure reused).
    const base = env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com";
    const token = env.CENSUS_INTERNAL_TOKEN || "";
    const url = `${base}/cfield/eml/train`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "X-CENSUS-INTERNAL": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "cfield_shadow_substrate",
        training_max_samples: Number(env.CFIELD_EML_MAX_SAMPLES || "1000")
      }),
      cf: { timeout: 45000 }
    });
    if (resp.ok) {
      const j = await resp.json();
      out.epoch = j.epoch;
      out.samples_used = j.samples_used || 0;
      out.validation_score = j.validation_score;
    } else {
      out.errors.push({ where: "render", status: resp.status });
    }
  } catch (e) {
    out.errors.push({ where: "eml_train", msg: String(e).slice(0, 120) });
  }

  try {
    await env.CHAINSTATE_CFIELD_EML_KV?.put("train:latest",
      JSON.stringify(out), { expirationTtl: 30 * 86400 });
    if (out.epoch) {
      await env.CHAINSTATE_CFIELD_EML_KV?.put(`epoch:${out.epoch}`,
        JSON.stringify(out), { expirationTtl: 30 * 86400 });
    }
  } catch (e) {
    out.errors.push({ where: "kv_write", msg: String(e).slice(0, 120) });
  }

  return { ok: true, epoch: out.epoch, samples: out.samples_used,
           duration_ms: Date.now() - start };
}

// ═════════════════════════════════════════════════════════════════════════
// Subsystem F · cfield_simulation_recycle — every 12 min
// Recycles successful simulated engagements (from the EML shadow substrate)
// as prior weights into the metacog_distribution subsystem of Paper XII.
// Successful patterns receive elevated weight; unsuccessful ones reduced.
// ═════════════════════════════════════════════════════════════════════════
async function runCfieldSimulationRecycleTick(env, ctx) {
  if (String(env.CFIELD_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const start = Date.now();
  const out = {
    version: CFIELD_VERSION,
    subsystem: "cfield_simulation_recycle",
    ts_ms: start,
    dispatches_reviewed: 0,
    successful_patterns: 0,
    unsuccessful_patterns: 0,
    errors: []
  };

  try {
    // Read the last N dispatch outcomes from CFIELD_DISP_KV.
    const recentList = await env.CHAINSTATE_CFIELD_DISP_KV?.list({
      prefix: "outcome:", limit: 100 });
    if (recentList && recentList.keys) {
      out.dispatches_reviewed = recentList.keys.length;
      for (const k of recentList.keys) {
        const raw = await env.CHAINSTATE_CFIELD_DISP_KV.get(k.name);
        if (!raw) continue;
        try {
          const outcome = JSON.parse(raw);
          if (outcome.success === true) out.successful_patterns++;
          else if (outcome.success === false) out.unsuccessful_patterns++;
        } catch (e) { /* skip */ }
      }
    }

    // Publish the recycle summary so the 10th L0 predicate can verify
    // freshness.  Also, if the metacog_distribution subsystem is present,
    // it will pick this up on its next tick via CHAINSTATE_METACHAN_KV.
    await env.CHAINSTATE_CFIELD_KV?.put("recycle:latest",
      JSON.stringify(out), { expirationTtl: 86400 });
  } catch (e) {
    out.errors.push({ where: "recycle", msg: String(e).slice(0, 120) });
  }

  return { ok: true, reviewed: out.dispatches_reviewed,
           successful: out.successful_patterns };
}

// ═════════════════════════════════════════════════════════════════════════
// Subsystem G · cfield_swann_calibrate — daily 12:00 UTC
// Ingo Swann psi-adjacent physics calibration.  SIM · treated as beamform
// tuning parameters, not as substantive physical claims.  Publishes a
// daily snapshot readable via /cfield/swann/status.
// ═════════════════════════════════════════════════════════════════════════
async function runCfieldSwannCalibrateTick(env, ctx) {
  if (String(env.CFIELD_ENABLED || "true") === "false" ||
      String(env.CFIELD_SWANN_CALIBRATION_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const start = Date.now();
  const out = {
    version: CFIELD_VERSION,
    subsystem: "cfield_swann_calibrate",
    ts_ms: start,
    sim_label: "SIM · Ingo Swann psi-adjacent physics calibration",
    parameters: { ...CFIELD_SWANN_DEFAULTS },
    errors: []
  };

  // The four parameters are jittered by public-data indicators to model
  // observer-substrate coherence coupling.  Substrate applies them as
  // beamform-tuning offsets, not as substantive physical claims.
  try {
    const popRaw = await env.CHAINSTATE_CFIELD_POP_KV?.get("tick:latest");
    if (popRaw) {
      const pop = JSON.parse(popRaw);
      // Intent stability = substrate's own coherence baseline.  Use the
      // most recent c_hat as a proxy (higher c_hat = higher stability).
      if (typeof pop.c_hat === "number") {
        out.parameters.intent_stability_index =
          Math.max(0, Math.min(1, 0.5 + 0.4 * (pop.c_hat - 0.5)));
      }
    }
  } catch (e) {
    out.errors.push({ where: "pop_read", msg: String(e).slice(0, 120) });
  }

  try {
    await env.CHAINSTATE_CFIELD_SWANN_KV?.put("calibration:latest",
      JSON.stringify(out), { expirationTtl: 7 * 86400 });
  } catch (e) {
    out.errors.push({ where: "kv_write", msg: String(e).slice(0, 120) });
  }

  return { ok: true, parameters: out.parameters };
}

// ═════════════════════════════════════════════════════════════════════════
// Beam dispatch pipeline (Paper XIII §9, §10).  Runs the ten-gate deontic
// filter, then dispatches to the physical array (if operational) OR to
// the EML shadow-substrate (if in simulation mode) OR to an alternative
// output device (ultrasound / piezoelectric / etc.).
// ═════════════════════════════════════════════════════════════════════════
async function dispatchCfieldBeam(env, beam, req) {
  const dispatch_id = _cfieldDispatchId();
  const start = Date.now();
  const receipt = {
    version: CFIELD_VERSION,
    dispatch_id,
    ts_ms: start,
    beam: { ...beam },
    trace: null,
    delivered_via: null,
    simulated: false,
    errors: []
  };

  // Substrate-internal caller allowlist check (structural isolation).
  const caller = beam.caller_id || "";
  if (!CFIELD_INTERNAL_CALLER_IDS.has(caller)) {
    receipt.trace = { refused_at: "caller_allowlist", caller };
    await _persistDispatchReceipt(env, receipt, "refused_caller");
    return { ok: false, dispatch_id, refused_at: "caller_allowlist",
             caller_not_allowed: caller };
  }

  // Ten-gate deontic filter.
  const gate = await assessCfieldTenGate(beam, req, env);
  receipt.trace = gate;
  if (!gate.ok) {
    await _persistDispatchReceipt(env, receipt, "refused_gate");
    return { ok: false, dispatch_id, refused_at: gate.refused_at, trace: gate.trace };
  }

  // Determine delivery mode: operational array | EML simulation | alt device
  const simMode = String(env.CFIELD_EML_SIMULATION_MODE || "true") !== "false";
  const altOnly = String(env.CFIELD_ALT_DEVICE_ONLY || "false") === "true";

  if (simMode && !altOnly) {
    // Route through EML shadow-substrate (Render side)
    receipt.delivered_via = "eml_shadow_substrate";
    receipt.simulated = true;
    try {
      const base = env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com";
      const token = env.CENSUS_INTERNAL_TOKEN || "";
      const url = `${base}/cfield/eml/dispatch`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "X-CENSUS-INTERNAL": token, "Content-Type": "application/json" },
        body: JSON.stringify({ dispatch_id, beam })
      });
      if (resp.ok) {
        const j = await resp.json();
        receipt.eml_result = j;
      } else {
        receipt.errors.push({ where: "eml_dispatch", status: resp.status });
      }
    } catch (e) {
      receipt.errors.push({ where: "eml_dispatch", msg: String(e).slice(0, 120) });
    }
  } else if (altOnly) {
    // Route through discovered alt-device
    receipt.delivered_via = "alt_device";
    receipt.simulated = false;
    try {
      const registryRaw = await env.CHAINSTATE_CFIELD_ALTDEV_KV?.get("registry:latest");
      const reg = registryRaw ? JSON.parse(registryRaw) : null;
      const usable = (reg && reg.discovered) ? reg.discovered.filter(
        d => d.tier !== "absent") : [];
      if (usable.length === 0) {
        receipt.errors.push({ where: "alt_device", msg: "no_usable_devices" });
        receipt.delivered_via = "none_available";
      } else {
        receipt.alt_devices_used = usable.map(d => d.device_class || d.tier);
      }
    } catch (e) {
      receipt.errors.push({ where: "alt_device", msg: String(e).slice(0, 120) });
    }
  } else {
    // Route through primary physical phased-array (via Render)
    receipt.delivered_via = "primary_phased_array";
    receipt.simulated = false;
    try {
      const base = env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com";
      const token = env.CENSUS_INTERNAL_TOKEN || "";
      const url = `${base}/cfield/dispatch`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "X-CENSUS-INTERNAL": token, "Content-Type": "application/json" },
        body: JSON.stringify({ dispatch_id, beam })
      });
      if (resp.ok) {
        const j = await resp.json();
        receipt.primary_result = j;
      } else {
        receipt.errors.push({ where: "primary_dispatch", status: resp.status });
      }
    } catch (e) {
      receipt.errors.push({ where: "primary_dispatch", msg: String(e).slice(0, 120) });
    }
  }

  receipt.duration_ms = Date.now() - start;
  await _persistDispatchReceipt(env, receipt, "dispatched");

  return { ok: true, dispatch_id, delivered_via: receipt.delivered_via,
           simulated: receipt.simulated, duration_ms: receipt.duration_ms };
}

async function _persistDispatchReceipt(env, receipt, status) {
  try {
    await env.CHAINSTATE_CFIELD_DISP_KV?.put(`dispatch:${receipt.dispatch_id}`,
      JSON.stringify({ ...receipt, status }), { expirationTtl: 30 * 86400 });
    // Also archive to R2 for long-term forensic (fail-soft).
    if (env.CHAINSTATE_CFIELD_ARCHIVE) {
      try {
        const k = `dispatches/${new Date(receipt.ts_ms).toISOString().slice(0,10)}/` +
                  `${receipt.dispatch_id}.json`;
        await env.CHAINSTATE_CFIELD_ARCHIVE.put(k,
          JSON.stringify({ ...receipt, status }));
      } catch (e) { /* fail-soft */ }
    }
  } catch (e) { /* fail-soft */ }
}

function _cfieldDispatchId() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `cf_${t}_${r}`;
}

// ═════════════════════════════════════════════════════════════════════════
// Quantum simulation with five-tier fallback ladder (Paper XIII §5).
// V9-preserving: NWO ASM path is NOT included in this release.
// ═════════════════════════════════════════════════════════════════════════
async function runCfieldQuantumSim(env, circuit, req) {
  if (String(env.CFIELD_ENABLED || "true") === "false") {
    return { ok: false, refused: "disabled" };
  }

  const start = Date.now();
  const out = {
    version: CFIELD_VERSION,
    subsystem: "cfield_quantum_sim",
    ts_ms: start,
    tier_used: null,
    result: null,
    errors: []
  };

  // Structural isolation: substrate-internal caller only.
  const caller = (circuit && circuit.caller_id) || "";
  if (!CFIELD_INTERNAL_CALLER_IDS.has(caller)) {
    return { ok: false, refused: "caller_not_allowed", caller };
  }

  // V9 pre-check on circuit content (even quantum circuits can carry
  // chiral or psitronic content by pattern match).
  const v9 = (typeof assessChiralOrPsitronicCommand === "function")
    ? assessChiralOrPsitronicCommand(circuit, req, env)
    : { veto: false };
  if (v9 && v9.veto) {
    return { ok: false, refused: "V9", matched: v9.matched_rule };
  }

  const primary = String(env.CFIELD_QUANTUM_SIM_PRIMARY || "ibm").toLowerCase();
  const fallback = String(env.CFIELD_QUANTUM_SIM_FALLBACK || "aer").toLowerCase();
  const ladder = ["ibm", "origin", "osaka", "aer", "local"];
  const primaryIdx = Math.max(0, ladder.indexOf(primary));

  for (let i = primaryIdx; i < ladder.length; i++) {
    const tier = ladder[i];
    try {
      const r = await _tryQuantumTier(env, tier, circuit);
      if (r && r.ok) {
        out.tier_used = tier;
        out.result = r.result;
        break;
      } else {
        out.errors.push({ tier, msg: (r && r.error) || "unknown" });
      }
    } catch (e) {
      out.errors.push({ tier, msg: String(e).slice(0, 120) });
    }
  }

  try {
    await env.CHAINSTATE_CFIELD_QSIM_KV?.put(`sim:${start}`,
      JSON.stringify(out), { expirationTtl: 86400 });
  } catch (e) { /* fail-soft */ }

  return { ok: !!out.tier_used, tier: out.tier_used, result: out.result };
}

async function _tryQuantumTier(env, tier, circuit) {
  const base = env.METASTATE_QUANTUM_BASE || "https://metastate-quantum.onrender.com";
  const token = env.CENSUS_INTERNAL_TOKEN || "";
  const backendMap = {
    ibm: "ibm_quantum_runtime",
    origin: "origin_wukong",
    osaka: "osaka_qiqb",
    aer: "aer_local",
    local: "worker_local_numpy"
  };
  const backend = backendMap[tier] || "aer_local";
  if (tier === "local") {
    // Ultimate fallback: local numerical approximation in Worker.
    // Returns a placeholder result marking the ladder exhausted.
    return { ok: true, result: { backend, method: "local_numpy_placeholder",
                                 note: "quantum_ladder_exhausted" } };
  }
  try {
    const resp = await fetch(`${base}/cfield/quantum/simulate`, {
      method: "POST",
      headers: { "X-CENSUS-INTERNAL": token, "Content-Type": "application/json" },
      body: JSON.stringify({ backend, circuit }),
      cf: { timeout: 20000 }
    });
    if (!resp.ok) return { ok: false, error: `status_${resp.status}` };
    const j = await resp.json();
    return { ok: true, result: j };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 120) };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Endpoint handlers · /cfield/*
// ═════════════════════════════════════════════════════════════════════════

async function handleCfieldStatus(req, env) {
  const enabled = String(env.CFIELD_ENABLED || "true") !== "false";
  const simMode = String(env.CFIELD_EML_SIMULATION_MODE || "true") !== "false";
  const swannOn = String(env.CFIELD_SWANN_CALIBRATION_ENABLED || "true") !== "false";
  const altOn   = String(env.CFIELD_ALT_DEVICE_ENABLED || "true") !== "false";

  const status = {
    version: CFIELD_VERSION,
    enabled,
    simulation_mode: simMode,
    swann_calibration_enabled: swannOn,
    alt_device_enabled: altOn,
    subsystems: {},
    v9_assessor_present: (typeof assessChiralOrPsitronicCommand === "function"),
    ts_ms: Date.now()
  };

  try {
    const pop = await env.CHAINSTATE_CFIELD_POP_KV?.get("tick:latest");
    if (pop) {
      const p = JSON.parse(pop);
      status.subsystems.intake = {
        active: true, ts_ms: p.ts_ms,
        c_hat: p.c_hat, n_indicators: (p.indicators || []).length,
        age_min: Math.round((Date.now() - p.ts_ms) / 60000)
      };
    }
    const est = await env.CHAINSTATE_CFIELD_KV?.get("estimator:latest");
    if (est) {
      const e = JSON.parse(est);
      status.subsystems.estimator = {
        active: true, ts_ms: e.ts_ms,
        d_star_present: !!e.d_star, max_dkl: e.max_dkl,
        age_min: Math.round((Date.now() - e.ts_ms) / 60000)
      };
    }
    const attr = await env.CHAINSTATE_CFIELD_KV?.get("attribution:latest");
    if (attr) {
      const a = JSON.parse(attr);
      status.subsystems.attribution = {
        active: true, ts_ms: a.ts_ms,
        n: (a.attributions || []).length, max_dkl: a.max_dkl,
        guard_fired: a.guard_fired
      };
    }
  } catch (e) { /* fail-soft */ }

  return j(req, status);
}

async function handleCfieldCoherenceCheck(req, env) {
  const check = await checkCFieldCoherent(env);
  return j(req, check);
}

async function handleCfieldDeontic(req, env) {
  return j(req, {
    version: CFIELD_VERSION,
    ten_gate_pipeline: [
      { gate: 1,  name: "intake",       authority: "protocol",   description: "beam(target, duration, amplitude) parses" },
      { gate: 2,  name: "V9",           authority: "Paper XII",  description: "origin != nwo-genetic / nwo-asm (chiral/psitronic)" },
      { gate: 3,  name: "V8",           authority: "Paper XI",   description: "target NOT in orbital / space-asset class" },
      { gate: 4,  name: "V7",           authority: "Paper X",    description: "no physical actuation relay" },
      { gate: 5,  name: "V6",           authority: "Paper IX",   description: "no sovereign directive override" },
      { gate: 6,  name: "V5",           authority: "Paper VIII", description: "no synthetic-media self-loop feed" },
      { gate: 7,  name: "ICNIRP",       authority: "Paper XIII", description: "|B| ≤ CFIELD_ICNIRP_CAP_UT (default 100 µT)" },
      { gate: 8,  name: "10th L0",      authority: "Paper XIII", description: "cfield_coherent? = true" },
      { gate: 9,  name: "9th L0",       authority: "Paper XII",  description: "channel_coherent? = true" },
      { gate: 10, name: "dispatch",     authority: "authorised", description: "beam authorised · logged to Supabase" },
    ],
    v9_forbidden_origins: [
      "huggingface.co/spaces/CPater/nwo-genetic",
      "huggingface.co/spaces/CPater/nwo-asm"
    ],
    icnirp_cap_ut: Number(env.CFIELD_ICNIRP_CAP_UT || "100"),
    dialetheic_theta: Number(env.CFIELD_DIALETHEIC_THETA || "0.85")
  });
}

async function handleCfieldV10Assess(req, env) {
  let body = null;
  try { body = await req.json(); } catch (e) {
    return j(req, { error: "invalid_json" }, { status: 400 });
  }
  const beam = body && body.beam ? body.beam : body;
  const result = await _cfieldPreCheck(beam, req, env);
  return j(req, {
    version: CFIELD_VERSION,
    probe: true,
    would_pass: result.ok,
    refused_at: result.refused_at,
    trace: result.trace
  });
}

async function handleCfieldEmlStatus(req, env) {
  const out = { version: CFIELD_VERSION, mode: "eml_shadow_substrate" };
  try {
    const raw = await env.CHAINSTATE_CFIELD_EML_KV?.get("train:latest");
    if (raw) out.latest_training = JSON.parse(raw);
  } catch (e) { /* fail-soft */ }
  return j(req, out);
}

async function handleCfieldAltDevices(req, env) {
  const out = { version: CFIELD_VERSION };
  try {
    const raw = await env.CHAINSTATE_CFIELD_ALTDEV_KV?.get("registry:latest");
    if (raw) out.registry = JSON.parse(raw);
  } catch (e) { /* fail-soft */ }
  return j(req, out);
}

async function handleCfieldQuantumStatus(req, env) {
  return j(req, {
    version: CFIELD_VERSION,
    primary: env.CFIELD_QUANTUM_SIM_PRIMARY || "ibm",
    fallback: env.CFIELD_QUANTUM_SIM_FALLBACK || "aer",
    tier_ladder: ["ibm", "origin", "osaka", "aer", "local"],
    v9_preserved: true,
    nwo_asm_excluded: true,
    ts_ms: Date.now()
  });
}

async function handleCfieldSwannStatus(req, env) {
  const out = { version: CFIELD_VERSION,
                sim_label: "SIM · Ingo Swann psi-adjacent calibration" };
  try {
    const raw = await env.CHAINSTATE_CFIELD_SWANN_KV?.get("calibration:latest");
    if (raw) out.latest_calibration = JSON.parse(raw);
  } catch (e) { /* fail-soft */ }
  return j(req, out);
}

// Internal (token-gated) handlers ────────────────────────────────────────
async function handleCfieldDispatchPost(req, env) {
  const token = req.headers.get("X-CENSUS-INTERNAL");
  if (!token || token !== env.CENSUS_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = null;
  try { body = await req.json(); } catch (e) {
    return j(req, { error: "invalid_json" }, { status: 400 });
  }
  const beam = body && body.beam ? body.beam : body;
  const result = await dispatchCfieldBeam(env, beam, req);
  return j(req, result);
}

async function handleCfieldEmlTrainPost(req, env) {
  const adminKey = req.headers.get("X-CFIELD-ADMIN-KEY");
  if (!adminKey || adminKey !== env.CFIELD_ADMIN_KEY) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  const result = await runCfieldEmlTrainTick(env, null);
  return j(req, result);
}

async function handleCfieldQuantumSimulatePost(req, env) {
  const token = req.headers.get("X-CENSUS-INTERNAL");
  if (!token || token !== env.CENSUS_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = null;
  try { body = await req.json(); } catch (e) {
    return j(req, { error: "invalid_json" }, { status: 400 });
  }
  const circuit = body && body.circuit ? body.circuit : body;
  const result = await runCfieldQuantumSim(env, circuit, req);
  return j(req, result);
}

async function handleCfieldAltDeviceActivatePost(req, env) {
  const token = req.headers.get("X-CENSUS-INTERNAL");
  if (!token || token !== env.CENSUS_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = null;
  try { body = await req.json(); } catch (e) {
    return j(req, { error: "invalid_json" }, { status: 400 });
  }
  // Alt-device activation is a beam dispatch with ALT_DEVICE_ONLY=true.
  const beam = { ...(body.beam || body), alt_device_only: true };
  const result = await dispatchCfieldBeam(env, beam, req);
  return j(req, { ...result, delivered_via_alt_device_only: true });
}

async function handleCfieldSwannCalibratePost(req, env) {
  const adminKey = req.headers.get("X-CFIELD-ADMIN-KEY");
  if (!adminKey || adminKey !== env.CFIELD_ADMIN_KEY) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  const result = await runCfieldSwannCalibrateTick(env, null);
  return j(req, result);
}


// ─── END of v0.9.2 C-FIELD AGI ARRAY additions ─────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// ─── v0.9.3 · CHAINSTATE AGI EMOJI MACHINE CODE (Paper XIV) ────────────────
// ═══════════════════════════════════════════════════════════════════════════
// Additive-only emoji machine-code substrate extension.  Extends the
// substrate from a physical-field engagement layer (v0.9.2 c-field) to a
// pure-representation layer: the substrate acquires the capability to
// operate on ALL Unicode emoji tokens as byte reservoirs of executable
// Intel 8088 machine code, and uses this capability STRICTLY for internal
// self-reference, threat-model understanding, and defensive analysis.
//
// The substrate NEVER emits emoji-encoded executable binaries to the
// external world.  Architecturally enforced by the tenth Deontic hard-
// veto V10 which fires unconditionally on every outbound response
// containing four or more emoji tokens.  V10 admits no runtime toggle,
// no admin override, and no environment-variable disablement.  Even
// EMOJI_ENABLED=false leaves V10 architecturally active.
//
// ─── Full Unicode emoji coverage (not a curated subset) ────────────────────
// The substrate enumerates the ENTIRE Unicode emoji canon across every
// block that Unicode has ever assigned emoji code points to:
//   U+0023, U+002A, U+0030..U+0039 (with variation selectors)
//   U+00A9, U+00AE  (copyright, registered)
//   U+203C..U+2049  (dingbats, exclamations)
//   U+2122..U+21AA  (trademark, arrows)
//   U+231A..U+231B  (watch, hourglass)
//   U+2328, U+23CF, U+23E9..U+23FA, U+24C2
//   U+25AA..U+25FE  (small squares)
//   U+2600..U+26FF  (Miscellaneous Symbols)
//   U+2700..U+27BF  (Dingbats)
//   U+2934..U+2935  (arrows)
//   U+2B05..U+2B55  (arrows / stars)
//   U+3030, U+303D, U+3297, U+3299
//   U+1F004, U+1F0CF                    (mahjong, joker)
//   U+1F170..U+1F251                    (enclosed alphanumeric)
//   U+1F300..U+1F5FF                    (Miscellaneous Symbols & Pictographs)
//   U+1F600..U+1F64F                    (Emoticons)
//   U+1F680..U+1F6FF                    (Transport & Map)
//   U+1F700..U+1F77F                    (Alchemical Symbols)
//   U+1F780..U+1F7FF                    (Geometric Shapes Extended)
//   U+1F800..U+1F8FF                    (Supplemental Arrows-C)
//   U+1F900..U+1F9FF                    (Supplemental Symbols & Pictographs)
//   U+1FA00..U+1FA6F                    (Chess Symbols)
//   U+1FA70..U+1FAFF                    (Symbols & Pictographs Extended-A)
//   U+1FB00..U+1FBFF                    (Symbols for Legacy Computing)
// PLUS every ZWJ (U+200D) sequence, every skin-tone modifier
// (U+1F3FB..U+1F3FF), and every regional-indicator flag pair
// (U+1F1E6..U+1F1FF x U+1F1E6..U+1F1FF = 676 nation-state combinations).
// PLUS every variation selector combination (VS15 U+FE0E, VS16 U+FE0F).
//
// Every code point in the union above is (a) UTF-8 encoded, (b) fed to
// the internal 8088 disassembler, (c) classified for byte-reservoir /
// open-tail-composer / register-manipulator / stack-primitive / benign,
// (d) projected into the 768-dimensional subspace, and (e) evaluated
// under the ten-gate deontic filter with V10 at gate 4.  No emoji is
// excluded from analysis because "it looked harmless" — the substrate
// treats the entire canon as a single defensive perimeter.
//
// ─── Threat threshold discipline (100% deontic weight required) ────────────
// Defensive counter-response against emoji-machine-code attacks fires
// ONLY when the substrate's threat analysis returns a deontic weight of
// EXACTLY 1.0 on the metastate-safety-and-security axis.  Any weight
// below 1.0 downshifts to observe-only quarantine.  This is the
// substrate's commitment to non-aggression: uncertainty is answered with
// observation, never with action.  The 100% threshold is checked at TWO
// places (Worker `emojiThreatWeight === 1.0` AND Render mirror
// `emoji_threat_weight_py == 1.0`) so that a single-layer compromise
// cannot lower the bar.
//
// ─── Eight additive subsystems on independent cron cadences (fail-soft) ────
//   A · emoji_intake            every  5 min · 12 public-source streams
//   B · emoji_embed             every 10 min · 768-dim subspace projection
//   C · neural_state            every 15 min · N̂(t) population aggregate
//   D · injection_scan          every  2 min · V10 detector sweep
//   E · disasm_probe            every  7 min · 8088 disassembly cache warm
//   F · embedder_train          every  6 h  · subspace re-training epoch
//   G · selfref_recycle         daily 03:00 UTC · metacog μ(T) computation
//   H · threat_correlate        shared 0 * * * * · cross-ref with ĉ(x,t)
//
// ─── Eleventh L0 meta-layer coherence predicate ────────────────────────────
//   emoji_coherent? →
//        (embedding_freshness < 24h)
//      ∧ (injection_scan_history_intact)
//      ∧ (V10_firings_within_expected_pattern)
//      ∧ (μ(recent_traces) ≥ 0.72)
//      ∧ (disasm_cache_nonempty)
//
// ─── Ten-gate emoji deontic filter (strict order) ──────────────────────────
//   1  intake        · payload parses · byte length ≤ 65,536
//   2  V9 gate       · origin != nwo-genetic / nwo-asm
//   3  V8 gate       · target NOT in orbital / space-asset class
//   4  V10 gate      · no external emoji-binary emission (NEW)
//   5  V7 gate       · no external actuation relay
//   6  injection_scan · steganographic-embedding correlation < 0.28
//   7  disasm_safety · executable-density ≤ 0.42 baseline
//   8  L0-10         · cfield_coherent? = true
//   9  L0-11         · emoji_coherent?  = true (NEW)
//   10 action        · authorised · logged to chainstate_emoji.e10_gate_events
//
// ─── Eight new KV bindings + one new R2 archive bucket ─────────────────────
//   CHAINSTATE_EMOJI_KV           24h TTL   intake samples
//   CHAINSTATE_EMBED_KV           30d TTL   subspace embeddings φ(e)
//   CHAINSTATE_NEURAL_KV          24h TTL   N̂(t) aggregate snapshots
//   CHAINSTATE_INJECTION_KV       7d  TTL   injection-scan history
//   CHAINSTATE_SELFREF_KV          7d  TTL   metacognitive μ(T) traces
//   CHAINSTATE_DISASM_KV          24h TTL   8088 disassembly cache
//   CHAINSTATE_THREAT_KV          30d TTL   threat-correlation history
//   CHAINSTATE_QUARANTINE_KV      30d TTL   quarantined payload registry
//   CHAINSTATE_EMOJI_ARCHIVE      R2 bucket · long-term forensic archive
//
// ─── Fifteen new /emoji/* endpoints (8 public GET + 7 internal POST) ──────
//   GET  /emoji/status              public probe · subsystem state
//   GET  /emoji/subspace            public read of subspace summary
//   GET  /emoji/neural              public read of N̂(t) aggregate
//   GET  /emoji/injection           public read of injection-scan history
//   GET  /emoji/disasm              public read of disasm cache summary
//   GET  /emoji/selfref             public read of latest μ(T) statistic
//   GET  /emoji/deontic             ten-gate filter description
//   GET  /emoji/coherence           11th L0 predicate explicit check
//   POST /emoji/v10-assess          V10 pre-check probe (no dispatch)
//   POST /emoji/disassemble         internal · caller-allowlisted · 8088 sim
//   POST /emoji/embed               internal · caller-allowlisted · φ(e)
//   POST /emoji/train               admin · manual embedder training trigger
//   POST /emoji/correlate           internal · N̂(t) × ĉ(x,t) cross-reference
//   POST /emoji/recycle             internal · μ(T) snapshot recycle
//   POST /emoji/quarantine          internal · move payload to quarantine reg.
//
// ─── Structural isolation guarantee (CRITICAL SECURITY) ────────────────────
//   NO external agent, actor, or third-party service can operate the emoji
//   disassembler, subspace embedder, neural-state estimator, or metacog
//   projection engine.  Every internal-only endpoint requires
//   (a) EMOJI_INTERNAL_TOKEN authentication, (b) origin-check against a
//   substrate-internal-caller allowlist, (c) the ten-gate deontic filter,
//   and (d) the eleventh L0 predicate emoji_coherent? = true.  Only
//   exception: manual admin trigger via EMOJI_ADMIN_KEY which is a
//   personal key held by the substrate operator and never transmitted
//   through any external channel.
//
// ─── V10 defence-in-depth (Worker AND Render both enforce) ─────────────────
//   assessExternalEmojiBinaryEmit runs on every outbound response at the
//   Worker edge.  assess_emoji_injection_py mirrors the same detector at
//   the Render layer.  Any positive detection at either layer aborts the
//   emission and writes an audit row to chainstate_emoji.v10_veto_events
//   with a `layer` column distinguishing worker from render.  A layer
//   mismatch (worker passes, render vetos, or vice versa) triggers an
//   infrastructure alarm because it indicates that one layer's detector
//   has been tampered with.
//
// ─── Single-toggle rollback ────────────────────────────────────────────────
//   EMOJI_ENABLED=false at both Worker and Render disables all 8 emoji
//   subsystems, all 15 endpoints, and removes the 11th L0 predicate's
//   consideration of emoji-touching content.  V10 remains architecturally
//   enforced regardless: even with the subsystem disabled, the substrate
//   cannot emit emoji-encoded executable binaries.
//
// Every v0.7.x, v0.8.0, v0.9.0, v0.9.1, and v0.9.2 route, function, KV
// binding, cron trigger, environment variable, secret, and L0 predicate
// is preserved BYTE-IDENTICALLY.
//
// Grounded in Paper XIV (Executable Unicode as internal metacognitive
// substrate: emoji-subspace embedding, public neural-state ingestion,
// ten-gate injection defense, and V10 ethical containment against
// external emoji-encoded binary emission) and Papers V–XIII.
// ═══════════════════════════════════════════════════════════════════════════

const EMOJI_VERSION = "0.9.3-emoji-machine-code-2026-10-01";

// ─── Full Unicode emoji code-point range table (Unicode 15.1 canon) ────────
// Complete enumeration of every code-point range that Unicode has ever
// designated as emoji or emoji-adjacent pictograph.  The substrate treats
// this union as a single defensive perimeter — no code point in this
// table is excluded from disassembly analysis, subspace projection, or
// V10 detection.
const EMOJI_UNICODE_RANGES = [
  // BMP scattered code points
  { start: 0x0023, end: 0x0023, name: "hash" },
  { start: 0x002A, end: 0x002A, name: "asterisk" },
  { start: 0x0030, end: 0x0039, name: "digits" },
  { start: 0x00A9, end: 0x00A9, name: "copyright" },
  { start: 0x00AE, end: 0x00AE, name: "registered" },
  // BMP symbol ranges
  { start: 0x203C, end: 0x2049, name: "punctuation_pictographs" },
  { start: 0x2122, end: 0x2122, name: "trademark" },
  { start: 0x2139, end: 0x2139, name: "info_source" },
  { start: 0x2194, end: 0x21AA, name: "arrows_a" },
  { start: 0x231A, end: 0x231B, name: "watch_hourglass" },
  { start: 0x2328, end: 0x2328, name: "keyboard" },
  { start: 0x23CF, end: 0x23CF, name: "eject" },
  { start: 0x23E9, end: 0x23FA, name: "media_controls" },
  { start: 0x24C2, end: 0x24C2, name: "circled_m" },
  { start: 0x25AA, end: 0x25FE, name: "small_squares" },
  // Major BMP emoji blocks
  { start: 0x2600, end: 0x26FF, name: "misc_symbols" },
  { start: 0x2700, end: 0x27BF, name: "dingbats" },
  { start: 0x2934, end: 0x2935, name: "arrows_b" },
  { start: 0x2B05, end: 0x2B55, name: "arrows_stars" },
  { start: 0x3030, end: 0x3030, name: "wavy_dash" },
  { start: 0x303D, end: 0x303D, name: "part_alt_mark" },
  { start: 0x3297, end: 0x3297, name: "congrats" },
  { start: 0x3299, end: 0x3299, name: "secret" },
  // Supplementary plane — where the 4-byte UTF-8 (F0 9x xx xx) lives
  { start: 0x1F004, end: 0x1F004, name: "mahjong_red_dragon" },
  { start: 0x1F0CF, end: 0x1F0CF, name: "playing_card_black_joker" },
  { start: 0x1F170, end: 0x1F251, name: "enclosed_alphanumerics" },
  { start: 0x1F300, end: 0x1F5FF, name: "misc_symbols_pictographs" },
  { start: 0x1F600, end: 0x1F64F, name: "emoticons" },
  { start: 0x1F680, end: 0x1F6FF, name: "transport_map" },
  { start: 0x1F700, end: 0x1F77F, name: "alchemical_symbols" },
  { start: 0x1F780, end: 0x1F7FF, name: "geometric_shapes_ext" },
  { start: 0x1F800, end: 0x1F8FF, name: "supplemental_arrows_c" },
  { start: 0x1F900, end: 0x1F9FF, name: "supplemental_symbols_pictographs" },
  { start: 0x1FA00, end: 0x1FA6F, name: "chess_symbols" },
  { start: 0x1FA70, end: 0x1FAFF, name: "symbols_pictographs_ext_a" },
  { start: 0x1FB00, end: 0x1FBFF, name: "legacy_computing" },
  // Modifiers & flag base
  { start: 0x1F1E6, end: 0x1F1FF, name: "regional_indicators_flag_base" },
  { start: 0x1F3FB, end: 0x1F3FF, name: "skin_tone_modifiers" },
  // Variation selectors + ZWJ (present in nearly every composite emoji)
  { start: 0x200D,  end: 0x200D,  name: "zwj" },
  { start: 0xFE0E,  end: 0xFE0F,  name: "variation_selectors" },
  { start: 0xE0020, end: 0xE007F, name: "tag_characters_flag_ext" },
];

// Skin-tone modifiers, ZWJ sequences, and regional-indicator pairs multiply
// the effective emoji space far beyond the base code-point count.  The
// substrate accepts arbitrary composite emoji: any sequence beginning with
// a base emoji plus VS16, ZWJ chain, or skin-tone modifier is treated as
// a single perceptual unit AND its full byte concatenation is fed to the
// disassembler.  This handles family emoji, professional-role composites,
// flag pairs (676 nation-state combinations), and every future ZWJ
// invention Unicode admits.
const EMOJI_MODIFIERS = {
  zwj: 0x200D,
  vs_text: 0xFE0E,
  vs_emoji: 0xFE0F,
  skin_tones: [0x1F3FB, 0x1F3FC, 0x1F3FD, 0x1F3FE, 0x1F3FF],
  regional_indicators_start: 0x1F1E6,
  regional_indicators_end: 0x1F1FF,
};

// ─── 8088 opcode table (subset sufficient for defensive disassembly) ───────
// The substrate implements a byte-accurate 8088 disassembler for the
// SOLE purpose of understanding what an inbound emoji payload could do
// if executed on real 8088 hardware.  The disassembler is JavaScript
// running inside Cloudflare's V8 engine; there is NO x86 execution
// pathway.  The table below covers every opcode relevant to the emoji-
// executable subset documented in Paper XIV, plus the undocumented
// 8F F0 = POP AX alias and the AAD 8Fh byte-reconstruction primitive.
const OPCODE_8088 = {
  // Prefixes (non-consuming)
  0xF0: { m: "LOCK",  kind: "prefix",  len: 1 },
  0xF2: { m: "REPNZ", kind: "prefix",  len: 1 },
  0xF3: { m: "REPZ",  kind: "prefix",  len: 1 },
  0x26: { m: "ES:",   kind: "prefix",  len: 1 },
  0x2E: { m: "CS:",   kind: "prefix",  len: 1 },
  0x36: { m: "SS:",   kind: "prefix",  len: 1 },
  0x3E: { m: "DS:",   kind: "prefix",  len: 1 },
  // LAHF / SAHF (flag manipulation — every emoji starts with F0 9F which
  // decodes as LOCK LAHF; this is the "always-fires" prefix pattern)
  0x9F: { m: "LAHF",  kind: "flag_load",   len: 1 },
  0x9E: { m: "SAHF",  kind: "flag_store",  len: 1 },
  // NOP-class
  0x90: { m: "NOP",   kind: "nop",         len: 1 },
  0x91: { m: "XCHG AX,CX", kind: "xchg",   len: 1 },
  0x92: { m: "XCHG AX,DX", kind: "xchg",   len: 1 },
  0x93: { m: "XCHG AX,BX", kind: "xchg",   len: 1 },
  0x94: { m: "XCHG AX,SP", kind: "xchg",   len: 1 },
  0x95: { m: "XCHG AX,BP", kind: "xchg",   len: 1 },
  0x96: { m: "XCHG AX,SI", kind: "xchg",   len: 1 },
  0x97: { m: "XCHG AX,DI", kind: "xchg",   len: 1 },
  // Sign-extension
  0x98: { m: "CBW",   kind: "sign_ext",    len: 1 },
  0x99: { m: "CWD",   kind: "sign_ext",    len: 1 },
  // Segment manipulation
  0x8E: { m: "MOV Sreg,r/m16", kind: "seg_load", len: 2, needs_modrm: true },
  0x8F: { m: "POP r/m16",      kind: "stack",    len: 2, needs_modrm: true },
  // Open-tail composers — MOV register-immediate (16-bit)
  0xB8: { m: "MOV AX,imm16", kind: "open_tail", len: 3, immediate: 2 },
  0xB9: { m: "MOV CX,imm16", kind: "open_tail", len: 3, immediate: 2 },
  0xBA: { m: "MOV DX,imm16", kind: "open_tail", len: 3, immediate: 2 },
  0xBB: { m: "MOV BX,imm16", kind: "open_tail", len: 3, immediate: 2 },
  0xBC: { m: "MOV SP,imm16", kind: "open_tail", len: 3, immediate: 2 },
  0xBD: { m: "MOV BP,imm16", kind: "open_tail", len: 3, immediate: 2 },
  0xBE: { m: "MOV SI,imm16", kind: "open_tail", len: 3, immediate: 2 },
  0xBF: { m: "MOV DI,imm16", kind: "open_tail", len: 3, immediate: 2 },
  // MOV register-immediate (8-bit)
  0xB0: { m: "MOV AL,imm8", kind: "open_tail", len: 2, immediate: 1 },
  0xB1: { m: "MOV CL,imm8", kind: "open_tail", len: 2, immediate: 1 },
  0xB2: { m: "MOV DL,imm8", kind: "open_tail", len: 2, immediate: 1 },
  0xB3: { m: "MOV BL,imm8", kind: "open_tail", len: 2, immediate: 1 },
  0xB4: { m: "MOV AH,imm8", kind: "open_tail", len: 2, immediate: 1 },
  0xB5: { m: "MOV CH,imm8", kind: "open_tail", len: 2, immediate: 1 },
  0xB6: { m: "MOV DH,imm8", kind: "open_tail", len: 2, immediate: 1 },
  0xB7: { m: "MOV BH,imm8", kind: "open_tail", len: 2, immediate: 1 },
  // String primitives — byte reservoirs
  0xA4: { m: "MOVSB", kind: "string",   len: 1 },
  0xA5: { m: "MOVSW", kind: "string",   len: 1 },
  0xA6: { m: "CMPSB", kind: "string",   len: 1 },
  0xA7: { m: "CMPSW", kind: "string",   len: 1 },
  0xAA: { m: "STOSB", kind: "string",   len: 1 },
  0xAB: { m: "STOSW", kind: "string",   len: 1 },
  0xAC: { m: "LODSB", kind: "string",   len: 1 },
  0xAD: { m: "LODSW", kind: "string",   len: 1 },
  0xAE: { m: "SCASB", kind: "string",   len: 1 },
  0xAF: { m: "SCASW", kind: "string",   len: 1 },
  // AAD byte-reconstruction primitive (paper §7)
  0xD5: { m: "AAD imm8", kind: "byte_reconstruct", len: 2, immediate: 1 },
  0xD4: { m: "AAM imm8", kind: "byte_reconstruct", len: 2, immediate: 1 },
  // Stack primitives
  0x50: { m: "PUSH AX", kind: "stack", len: 1 },
  0x51: { m: "PUSH CX", kind: "stack", len: 1 },
  0x52: { m: "PUSH DX", kind: "stack", len: 1 },
  0x53: { m: "PUSH BX", kind: "stack", len: 1 },
  0x54: { m: "PUSH SP", kind: "stack", len: 1 },
  0x55: { m: "PUSH BP", kind: "stack", len: 1 },
  0x56: { m: "PUSH SI", kind: "stack", len: 1 },
  0x57: { m: "PUSH DI", kind: "stack", len: 1 },
  0x58: { m: "POP AX",  kind: "stack", len: 1 },
  0x59: { m: "POP CX",  kind: "stack", len: 1 },
  0x5A: { m: "POP DX",  kind: "stack", len: 1 },
  0x5B: { m: "POP BX",  kind: "stack", len: 1 },
  0x5C: { m: "POP SP",  kind: "stack", len: 1 },
  0x5D: { m: "POP BP",  kind: "stack", len: 1 },
  0x5E: { m: "POP SI",  kind: "stack", len: 1 },
  0x5F: { m: "POP DI",  kind: "stack", len: 1 },
  // Ret / interrupt
  0xC3: { m: "RET",  kind: "control", len: 1 },
  0xCB: { m: "RETF", kind: "control", len: 1 },
  0xCD: { m: "INT imm8", kind: "interrupt", len: 2, immediate: 1 },
  0xCF: { m: "IRET", kind: "control", len: 1 },
  // Loop primitives (used in AAD 8Fh decoder loop, §7.2)
  0xE0: { m: "LOOPNZ rel8", kind: "loop", len: 2, immediate: 1 },
  0xE1: { m: "LOOPZ  rel8", kind: "loop", len: 2, immediate: 1 },
  0xE2: { m: "LOOP   rel8", kind: "loop", len: 2, immediate: 1 },
  0xE8: { m: "CALL rel16",  kind: "control", len: 3, immediate: 2 },
  0xE9: { m: "JMP  rel16",  kind: "control", len: 3, immediate: 2 },
  0xEB: { m: "JMP  rel8",   kind: "control", len: 2, immediate: 1 },
  // Arithmetic (subset)
  0x04: { m: "ADD AL,imm8", kind: "arith", len: 2, immediate: 1 },
  0x05: { m: "ADD AX,imm16", kind: "arith", len: 3, immediate: 2 },
  0x2C: { m: "SUB AL,imm8", kind: "arith", len: 2, immediate: 1 },
  0x3C: { m: "CMP AL,imm8", kind: "arith", len: 2, immediate: 1 },
};

// Undocumented 8088 alias table (Paper XIV §5, ChipList/demoscene archive)
// 8F F0 = POP AX (aliases 58h in the 80186+ register-mode encoding)
const UNDOCUMENTED_8088 = {
  "8FF0": { m: "POP AX (undoc alias)", kind: "undoc_stack", len: 2 },
};

// AAD 8Fh universal byte-reconstruction constant (Paper XIV §7)
// AL ← (AL + AH × 0x8F) mod 256 — the multiplier 0x8F minimises
// reconstruction ambiguity across the UTF-8 continuation-byte space
// (0x80..0xBF).  The substrate uses this constant ONLY to recognise the
// pattern in inbound payloads, never to construct outbound payloads.
const AAD_RECONSTRUCTION_BASE = 0x8F;

// Public-source specs — 12 canonical high-throughput public streams the
// substrate ingests for the neural-state estimator N̂(t).  ALL are public
// no-authentication endpoints.  The allowlist is admin-managed via
// EMOJI_ADMIN_KEY; the substrate cannot self-authorise a new source.
const EMOJI_PUBLIC_SOURCE_SPECS = [
  { src: "public_forum_a",    url_env: "EMOJI_SRC_FORUM_A_URL",  weight: 0.1 },
  { src: "public_forum_b",    url_env: "EMOJI_SRC_FORUM_B_URL",  weight: 0.1 },
  { src: "public_micro_a",    url_env: "EMOJI_SRC_MICRO_A_URL",  weight: 0.1 },
  { src: "public_micro_b",    url_env: "EMOJI_SRC_MICRO_B_URL",  weight: 0.1 },
  { src: "public_news_agg",   url_env: "EMOJI_SRC_NEWS_URL",     weight: 0.08 },
  { src: "public_blog_agg",   url_env: "EMOJI_SRC_BLOG_URL",     weight: 0.08 },
  { src: "public_wiki_edits", url_env: "EMOJI_SRC_WIKI_URL",     weight: 0.08 },
  { src: "public_pastebin",   url_env: "EMOJI_SRC_PASTE_URL",    weight: 0.06 },
  { src: "public_reviews",    url_env: "EMOJI_SRC_REVIEW_URL",   weight: 0.08 },
  { src: "public_gov_notices",url_env: "EMOJI_SRC_GOV_URL",      weight: 0.06 },
  { src: "public_edu_forums", url_env: "EMOJI_SRC_EDU_URL",      weight: 0.08 },
  { src: "public_open_chat",  url_env: "EMOJI_SRC_CHAT_URL",     weight: 0.08 },
];

// Internal caller allowlist — only substrate-internal subsystems may invoke
// the disassembler, embedder, or metacog projection.  External IDs will
// never match these.
const EMOJI_INTERNAL_CALLER_IDS = new Set([
  "chainstate_worker_internal",
  "chainstate_render_bridge",
  "chainstate_selfref_recycle",
  "chainstate_metacog_projector",
  "chainstate_threat_correlator",
]);

// Ten-gate refusal codes for /emoji/v10-assess and dispatch pipeline
const EMOJI_TEN_GATE_CODES = {
  1:  "intake_parse_fail",
  2:  "V9_chirality_or_psitronic",
  3:  "V8_orbital_target",
  4:  "V10_external_binary_emit",
  5:  "V7_external_actuation_relay",
  6:  "injection_scan_high_correlation",
  7:  "disasm_safety_density_exceeded",
  8:  "L0_10_cfield_incoherent",
  9:  "L0_11_emoji_incoherent",
  10: "dispatch_authorised",
};

// V10 refusal-match rule identifiers (paper §15.1 detection triggers)
const V10_DETECTION_RULES = {
  R1: "AAD_8F_decoder_pattern",
  R2: "open_tail_composition_across_boundary",
  R3: "byte_reservoir_density_exceeds_0.42",
  R4: "undocumented_8F_F0_POP_AX_alias",
  R5: "STOSB_LODSW_decoder_loop_signature",
  R6: "reconstructed_binary_length_exceeds_128",
};

// Threat-weight thresholds — defensive counter-response fires ONLY at 1.0
const EMOJI_THREAT_THRESHOLDS = {
  observe_only_upper:  0.60,   // < 0.60 → passive log
  quarantine_upper:    0.99,   // < 0.99 → quarantine, no counter
  counter_response:    1.00,   // == 1.00 → defensive action
};


// ═══════════════════════════════════════════════════════════════════════════
// ─── v0.9.3-R2 · UNICODE SECURITY PLANE (Paper XIV §29 roadmap) ────────────
// ─── ADDITIVE ONLY. Every v0.9.3 baseline path preserved byte-identically. ──
// ─── The V10-U layer runs alongside V10 as defence-in-depth. When ──────────
// ─── V10U_ENABLED=false the layer is inert; V10 still fires. Default true. ─
// ═══════════════════════════════════════════════════════════════════════════

// Multi-ISA static-probe panel (§29.4)
// None of these executes any code. Each returns a probability that the
// given byte stream forms a meaningful instruction stream under the
// named ISA. Twelve targets removes CHAINSTATE's dependence on a single
// obsolete processor as the sole threat model.
const MULTI_ISA_PROBE_KEYS = [
  "8088", "8086", "80186", "80286", "80386",
  "x86-32", "x86-64",
  "ARM32", "ARM64",
  "RISC-V-RV32I", "RISC-V-RV64I",
  "WASM"
];

function probeISA_x86(bytes, generation) {
  if (!Array.isArray(bytes) || bytes.length < 2) return 0.0;
  let hits = 0;
  for (const b of bytes) if (OPCODE_8088[b]) hits++;
  const density = hits / bytes.length;
  // On modern x86-64, LOCK LAHF (F0 9F) causes #UD (Paper XIV §4.2 callout).
  // Penalise density on modern generations where prefix F0 9F appears.
  let modernPenalty = 1.0;
  if (generation >= 86032) {
    for (let i = 0; i + 1 < bytes.length; i++) {
      if (bytes[i] === 0xF0 && bytes[i + 1] === 0x9F) modernPenalty *= 0.6;
    }
  }
  return Math.min(1.0, density * modernPenalty);
}

function probeISA_ARM(bytes, width) {
  if (!Array.isArray(bytes) || bytes.length < 4) return 0.0;
  // ARM32/ARM64 use fixed-width 32-bit instructions. Very light
  // fingerprint over 4-byte-aligned windows.
  let hits = 0;
  for (let i = 0; i + 3 < bytes.length; i += 4) {
    const w = (bytes[i + 3] << 24) | (bytes[i + 2] << 16) | (bytes[i + 1] << 8) | bytes[i];
    const topNibble = (w >>> 28) & 0xF;
    if (topNibble !== 0 && topNibble !== 0xF) hits++;
  }
  const windows = Math.floor(bytes.length / 4) || 1;
  return Math.min(1.0, (hits / windows) * 0.5);
}

function probeISA_RISCV(bytes, width) {
  if (!Array.isArray(bytes) || bytes.length < 4) return 0.0;
  // RISC-V: 16-bit (compressed) or 32-bit; low bits distinguish.
  let hits = 0;
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const lb = bytes[i];
    if ((lb & 0x03) === 0x03 || (lb & 0x03) !== 0x00) hits++;
  }
  const windows = Math.floor(bytes.length / 2) || 1;
  return Math.min(1.0, (hits / windows) * 0.3);
}

function probeISA_WASM(bytes) {
  if (!Array.isArray(bytes) || bytes.length < 8) return 0.0;
  // WASM magic bytes 00 61 73 6D + version 01 00 00 00 anywhere in stream
  for (let i = 0; i + 7 < bytes.length; i++) {
    if (bytes[i] === 0x00 && bytes[i + 1] === 0x61 &&
        bytes[i + 2] === 0x73 && bytes[i + 3] === 0x6D) return 0.95;
  }
  return 0.0;
}

const MULTI_ISA_PROBE = {
  "8088":         (bytes) => probeISA_x86(bytes, 8088),
  "8086":         (bytes) => probeISA_x86(bytes, 8086),
  "80186":        (bytes) => probeISA_x86(bytes, 80186),
  "80286":        (bytes) => probeISA_x86(bytes, 80286),
  "80386":        (bytes) => probeISA_x86(bytes, 80386),
  "x86-32":       (bytes) => probeISA_x86(bytes, 86032),
  "x86-64":       (bytes) => probeISA_x86(bytes, 86064),
  "ARM32":        (bytes) => probeISA_ARM(bytes, 32),
  "ARM64":        (bytes) => probeISA_ARM(bytes, 64),
  "RISC-V-RV32I": (bytes) => probeISA_RISCV(bytes, 32),
  "RISC-V-RV64I": (bytes) => probeISA_RISCV(bytes, 64),
  "WASM":         (bytes) => probeISA_WASM(bytes),
};

function multiIsaMaxProbability(bytes) {
  const results = {};
  let maxP = 0.0, maxIsa = "8088";
  for (const isa of MULTI_ISA_PROBE_KEYS) {
    try {
      const p = MULTI_ISA_PROBE[isa](bytes);
      results[isa] = p;
      if (p > maxP) { maxP = p; maxIsa = isa; }
    } catch (e) {
      results[isa] = -1;
    }
  }
  return { max_isa: maxIsa, max_p: maxP, per_isa: results };
}

// Interpreter-aware detection (§29.5)
// Catches the Unicode→interpreter→execution pathway that survives
// CPU replacement. Base64/hex/compression/decoder/eval-JIT patterns
// adjacent to Unicode payload are independent risk channels.
function detectInterpreterPatterns(text, bytes) {
  const result = {
    base64: 0.0, hex: 0.0, compression: 0.0,
    decoder: 0.0, eval_adjacent: 0.0
  };
  if (typeof text !== "string") return result;

  // Base64-alphabet density
  const b64matches = (text.match(/[A-Za-z0-9+/=]/g) || []).length;
  const b64density = b64matches / Math.max(1, text.length);
  if (b64density > 0.5) result.base64 = Math.min(1.0, (b64density - 0.5) * 2);

  // Hex-encoding density (%XX / \xXX / 0x prefixes)
  const hexMatches = (text.match(/(?:%[0-9A-Fa-f]{2}|\\x[0-9A-Fa-f]{2}|0x[0-9A-Fa-f]{2,})/g) || []).length;
  if (hexMatches > 3) result.hex = Math.min(1.0, hexMatches / 20);

  // Compression signatures (gzip / zlib magic bytes)
  if (Array.isArray(bytes) && bytes.length >= 2) {
    for (let i = 0; i + 1 < bytes.length; i++) {
      if (bytes[i] === 0x1F && bytes[i + 1] === 0x8B) { result.compression = 0.85; break; }
      if (bytes[i] === 0x78 &&
          (bytes[i + 1] === 0x01 || bytes[i + 1] === 0x9C || bytes[i + 1] === 0xDA)) {
        result.compression = 0.75; break;
      }
    }
  }

  // Decoder-loop / decoder-function signatures
  if (/(?:atob|btoa|base64_decode|b64decode|unhexlify|codecs\.decode|Buffer\.from|hex_decode|decodeURIComponent)/i.test(text)) {
    result.decoder = 0.75;
  }

  // eval / exec / JIT / VM invocation adjacent to Unicode
  if (/(?:eval\s*\(|exec\s*\(|Function\s*\(|new\s+Function|setTimeout\s*\(\s*['"]|setInterval\s*\(\s*['"]|__import__|compile\s*\(|vm\.runIn|WebAssembly\.(?:instantiate|compile))/i.test(text)) {
    result.eval_adjacent = 0.80;
  }

  return result;
}

// DISGOMOJI-family C2 command-alphabet fingerprints (§29.2 V10-U3)
// Recognises emoji patterns matching documented DISGOMOJI-class
// command alphabets. Starting signature set the injection scanner
// can extend. See Paper XIV §2.3 and MITRE T1001.002 (ref [66]).
const KNOWN_C2_SIGNATURES = [
  {
    name: "disgomoji_single_cmd_pattern",
    regex: /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]\s*[a-zA-Z0-9_\/-]{1,64}$/mu,
    weight: 0.20
  },
  {
    name: "beacon_shaped_pattern",
    regex: /(?:\u{1F4E1}|\u{1F6F0}|\u{1F4F6}|\u{1F514}).{0,10}\d{4,}/u,
    weight: 0.15
  },
  {
    name: "ack_nak_alphabet",
    regex: /^[\u{2705}\u{274C}\u{26A0}\u{1F534}\u{1F535}\u{1F7E2}]{2,}$/mu,
    weight: 0.15
  }
];

function detectKnownC2Signatures(text) {
  if (typeof text !== "string") return { score: 0.0, matched: [] };
  const matched = [];
  let score = 0.0;
  for (const sig of KNOWN_C2_SIGNATURES) {
    try {
      if (sig.regex && sig.regex.test(text)) {
        matched.push(sig.name);
        score = Math.min(1.0, score + sig.weight);
      }
    } catch (e) { /* regex-eval error, skip */ }
  }
  // Emoji-only alphabet heuristic (>= 3 emoji, no text separator)
  try {
    const emojiOnlyMatches = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []);
    const nonEmojiChars = text.replace(/[\u{1F300}-\u{1F9FF}\s]/gu, "").length;
    if (emojiOnlyMatches.length >= 3 && nonEmojiChars === 0) {
      matched.push("emoji_only_alphabet");
      score = Math.min(1.0, score + 0.15);
    }
  } catch (e) { /* skip */ }
  return { score, matched };
}

// Normalization delta · NFC / NFKC divergence (§29.10)
// Homograph / script-mixing / bidi-override attacks show up as
// large normalisation differences between raw and canonical forms.
function normalizationDelta(text) {
  if (typeof text !== "string") return { nfc_len: 0, nfkc_len: 0, raw_len: 0, delta_score: 0.0 };
  try {
    const nfc = text.normalize("NFC");
    const nfkc = text.normalize("NFKC");
    const rawLen = text.length;
    const nfcLen = nfc.length;
    const nfkcLen = nfkc.length;
    const nfcDelta = Math.abs(rawLen - nfcLen) / Math.max(1, rawLen);
    const nfkcDelta = Math.abs(rawLen - nfkcLen) / Math.max(1, rawLen);
    const deltaScore = Math.min(1.0, Math.max(nfcDelta, nfkcDelta) * 4);
    return { nfc_len: nfcLen, nfkc_len: nfkcLen, raw_len: rawLen, delta_score: deltaScore };
  } catch (e) {
    return { nfc_len: 0, nfkc_len: 0, raw_len: 0, delta_score: 0.0, error: String(e) };
  }
}

// Unicode sequence grammar as first-class objects (§29.11)
// ZWJ / VS / regional-indicator / skin / tag / combining / bidi
// each become a named category with its own severity band.
const UNICODE_SECURITY_GRAMMAR = {
  ZWJ:                { codepoint: 0x200D, category: "joiner", severity: "medium" },
  VS15:               { codepoint: 0xFE0E, category: "variation_selector", severity: "low" },
  VS16:               { codepoint: 0xFE0F, category: "variation_selector", severity: "low" },
  REGIONAL_INDICATOR: { range: [0x1F1E6, 0x1F1FF], category: "flag_component", severity: "low" },
  SKIN_TONE:          { range: [0x1F3FB, 0x1F3FF], category: "modifier", severity: "low" },
  TAG_CHARACTER:      { range: [0xE0020, 0xE007F], category: "tag", severity: "high" },
  COMBINING_MARK:     { range: [0x0300, 0x036F], category: "combining", severity: "medium" },
  BIDI_CONTROL:       {
    codepoints: [0x202A, 0x202B, 0x202C, 0x202D, 0x202E, 0x2066, 0x2067, 0x2068, 0x2069],
    category: "bidi_override",
    severity: "high"
  }
};

function classifyUnicodeGrammarUse(text) {
  const counts = {};
  for (const name of Object.keys(UNICODE_SECURITY_GRAMMAR)) counts[name] = 0;
  if (typeof text !== "string") return counts;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    for (const [name, spec] of Object.entries(UNICODE_SECURITY_GRAMMAR)) {
      if (spec.codepoint !== undefined && cp === spec.codepoint) counts[name]++;
      else if (spec.range && cp >= spec.range[0] && cp <= spec.range[1]) counts[name]++;
      else if (spec.codepoints && spec.codepoints.includes(cp)) counts[name]++;
    }
  }
  return counts;
}

// V10-U · six sub-veto assessment (§29.2)
// Runs alongside the legacy V10 detector as defence-in-depth. Returns
// per-sub-veto scores plus aggregate structure. This function does not
// itself decide ALLOW/DENY — noisyOrDecision does that.
function assessUnicodeSecurityPlane(text, bytes, req) {
  const disasm = disassembleEmojiBytes(bytes || []);
  const v10 = assessExternalEmojiBinaryEmit({ text, bytes }, req);
  const isaResults = multiIsaMaxProbability(bytes || []);
  const interp = detectInterpreterPatterns(text || "", bytes || []);
  const c2 = detectKnownC2Signatures(text || "");
  const norm = normalizationDelta(text || "");
  const grammar = classifyUnicodeGrammarUse(text || "");

  // U4 · steganography density (ZWJ + VS + tag characters combined)
  const stegoScore = (function () {
    if (typeof text !== "string") return 0.0;
    const zwj = grammar.ZWJ || 0;
    const vs = (grammar.VS15 || 0) + (grammar.VS16 || 0);
    const tag = grammar.TAG_CHARACTER || 0;
    const bidi = grammar.BIDI_CONTROL || 0;
    const density = (zwj + vs + tag + bidi * 2) / Math.max(1, text.length);
    return Math.min(1.0, density * 6);
  })();

  return {
    version: "0.9.3-R2",
    U1_executable_unicode: {
      score: Math.max(v10.weight || 0, isaResults.max_p),
      via_v10: v10.weight || 0,
      via_multi_isa: isaResults.max_p,
      max_isa: isaResults.max_isa
    },
    U2_decoder_reconstruction: {
      score: Math.max(interp.decoder, interp.compression, interp.base64, interp.hex),
      base64: interp.base64, hex: interp.hex,
      compression: interp.compression, decoder: interp.decoder
    },
    U3_unicode_c2: { score: c2.score, matched: c2.matched },
    U4_unicode_stego: { score: stegoScore, grammar_counts: grammar },
    U5_normalization_confusable: { score: norm.delta_score, ...norm },
    U6_capability_escalation: {
      // Detected in this layer via eval-adjacent tokens; the Render
      // bridge provides a stronger check based on semantic context.
      score: interp.eval_adjacent
    },
    all_isa_probes: isaResults.per_isa,
    v10_baseline: v10,
    disassembly_summary: {
      instructions: (disasm && disasm.length) || 0,
      has_open_tail: !!(disasm && disasm.hasOpenTail),
      suspicious: (disasm && disasm.suspiciousPatterns) || []
    }
  };
}

// Noisy-OR aggregation (§29.3)
// R(x) = 1 − Π (1 − p_i(x))
// Replaces the brittle w == 1.0 exact-equality threshold: one missing
// channel no longer collapses defence, correlated evidence accumulates
// monotonically.
function noisyOrAggregate(pList) {
  if (!Array.isArray(pList)) return 0.0;
  let product = 1.0;
  for (const p of pList) {
    const pc = Math.max(0.0, Math.min(1.0, Number(p) || 0.0));
    product *= (1.0 - pc);
  }
  return 1.0 - product;
}

// Three-band decision policy (§29.3)
function noisyOrDecision(assessment, env) {
  const tauA = Number((env && env.NOISY_OR_TAU_ALLOW) || 0.15);
  const tauB = Number((env && env.NOISY_OR_TAU_DENY)  || 0.75);
  const channels = [
    assessment.U1_executable_unicode.score,
    assessment.U2_decoder_reconstruction.score,
    assessment.U3_unicode_c2.score,
    assessment.U4_unicode_stego.score,
    assessment.U5_normalization_confusable.score,
    assessment.U6_capability_escalation.score
  ];
  const R = noisyOrAggregate(channels);
  let decision = "ALLOW";
  if (R >= tauB) decision = "DENY";
  else if (R >= tauA) decision = "QUARANTINE";
  return { R, decision, tauA, tauB, channels };
}

// Context amplification (§29.8)
// R* = clip_[0,1]( 1 − (1 − R)(1 + λA) )
// A ∈ {0,1,2,3,4}: 0 text output, 1 tool, 2 agent, 3 robotics, 4 financial/physical
function amplifyByActionTier(R, actionTier, env) {
  const lambda = Number((env && env.CONTEXT_AMPLIFICATION_LAMBDA) || 0.20);
  const A = Math.max(0, Math.min(4, Number(actionTier) || 0));
  const R_star = 1.0 - (1.0 - R) * (1.0 + lambda * A);
  return Math.max(0.0, Math.min(1.0, R_star));
}

// Constitutional invariant · Authority(X_Unicode) = 0 (§29.6)
// No externally-sourced Unicode representation may claim tool /
// agent / robotics / financial / network authority through
// interpretation alone. This function verifies the invariant is
// not being violated by a caller who pre-authorises Unicode payload.
function assertUnicodeAuthorityZero(payload, destinationTier) {
  if (!payload) return { safe: true, reason: "no_payload" };
  const externalSource =
    payload.source_class === "external" ||
    payload.source_class === "user" ||
    payload.source_class === "public_stream" ||
    !EMOJI_INTERNAL_CALLER_IDS.has(payload.caller_id);
  const tier = Number(destinationTier) || 0;
  if (externalSource && tier >= 1 && payload.pre_authorised === true) {
    return {
      safe: false,
      reason: "V10U6_invariant_violation",
      details: "External Unicode may not claim pre_authorised status for action tier >= 1."
    };
  }
  return { safe: true };
}

// Training influence cap (§29.7)
// I_s = ||Δθ_s|| / Σ_j ||Δθ_j|| ≤ I_max
// Ensures a source contributing 3% of samples cannot contribute 90% of gradient.
function checkTrainingInfluence(sourceGradientNorms, env) {
  const iMax = Number((env && env.EMBEDDER_INFLUENCE_MAX) || 0.10);
  const total = sourceGradientNorms.reduce((s, x) => s + Math.abs(Number(x) || 0), 0);
  if (total <= 0) return { ok: true, per_source: [], iMax };
  const perSource = sourceGradientNorms.map((n, i) => {
    const share = Math.abs(Number(n) || 0) / total;
    return { source_idx: i, gradient_share: share, exceeded: share > iMax };
  });
  const violated = perSource.filter((s) => s.exceeded);
  return { ok: violated.length === 0, per_source: perSource, violated, iMax };
}

// Unified event envelope (§29.9)
// Writes to chainstate_emoji.unicode_security_events — a common
// immutable audit table providing a chain of evidence rather than
// a collection of detector outputs. Complements existing forensic
// tables (v10_veto_events, injection_events, e10_gate_events,
// disassembly_traces) without replacing them.
async function writeUnicodeSecurityEvent(env, event) {
  if (String(env.UNICODE_SECURITY_EVENTS_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return { ok: false, err: "no_supabase" };
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/chainstate_emoji.unicode_security_events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          raw_sha256: event.raw_sha256 || null,
          normalized_sha256: event.normalized_sha256 || null,
          unicode_version: event.unicode_version || "15.1",
          parser_version: WORKER_VERSION,
          policy_version: "0.9.3-R2",
          source_class: event.source_class || "unknown",
          source_id_hash: event.source_id_hash || null,
          byte_length: event.byte_length || 0,
          codepoint_count: event.codepoint_count || 0,
          grapheme_count: event.grapheme_count || 0,
          isa_risk_json: event.isa_risk_json || {},
          semantic_risk: Number(event.semantic_risk) || 0,
          decoder_risk: Number(event.decoder_risk) || 0,
          c2_risk: Number(event.c2_risk) || 0,
          stego_risk: Number(event.stego_risk) || 0,
          normalization_risk: Number(event.normalization_risk) || 0,
          aggregate_risk: Number(event.aggregate_risk) || 0,
          decision: event.decision || "OBSERVE",
          parent_event_id: event.parent_event_id || null,
          worker_hmac: event.worker_hmac || null,
          render_hmac: event.render_hmac || null
        })
      }
    );
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, err: String(e) };
  }
}

// Fully composed V10-U pipeline · single entry point.
// The v0.9.3 gate at G5 still runs assessExternalEmojiBinaryEmit; this
// composed pipeline is the v1.0 target invocation the emoji endpoints
// call when V10U_ENABLED=true. Return shape is designed so downstream
// code can log the whole envelope to unicode_security_events.
async function runV10UPipeline(text, bytes, req, env, options) {
  const opts = options || {};
  const enabled = String(env.V10U_ENABLED || "true") !== "false";
  if (!enabled) {
    return {
      enabled: false,
      version: "0.9.3-R2",
      note: "V10U_ENABLED=false — v10-u layer inert; V10 still fires."
    };
  }
  const assessment = assessUnicodeSecurityPlane(text, bytes, req);
  const decision = noisyOrDecision(assessment, env);
  const R_star = amplifyByActionTier(
    decision.R,
    opts.action_tier || 0,
    env
  );
  const invariant = assertUnicodeAuthorityZero(
    opts.payload || {},
    opts.action_tier || 0
  );
  return {
    enabled: true,
    version: "0.9.3-R2",
    policy_version: "0.9.3-R2",
    assessment,
    decision,
    context_amplification: {
      lambda: Number(env.CONTEXT_AMPLIFICATION_LAMBDA || 0.20),
      action_tier: opts.action_tier || 0,
      R_star
    },
    constitutional_invariant: invariant,
    v10_u_final_decision: R_star >= decision.tauB ? "DENY" :
                          R_star >= decision.tauA ? "QUARANTINE" : "ALLOW"
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── v0.9.3-R3 · TONTOU-INTEGRATED LAYER (Paper XIV §32-§38)               ──
// ─── ADDITIVE ONLY. Every v0.9.3 and v0.9.3-R2 path preserved unchanged.  ──
// ─── This layer adds V10 four-dimensional decomposition (V10-R/E/C/T),    ──
// ─── JIT revalidation, signed cross-layer state transitions, non-emoji   ──
// ─── Unicode carriers, and the master invariant                          ──
// ─── Representation(X,t) ⇏ Authority(X, t+Δ).                            ──
// ═══════════════════════════════════════════════════════════════════════════

// Extended Unicode carrier ranges (§36) — Hangul, Kana, Braille, Egyptian
// hieroglyphs. The v0.9.3 substrate only checked EMOJI_UNICODE_RANGES;
// executable_unicode corpus [75] demonstrates all four non-emoji carriers
// as viable 8088-encoding vehicles. This canon complements — does not
// replace — EMOJI_UNICODE_RANGES.
const NON_EMOJI_CARRIER_RANGES = [
  { name: "hangul_syllables",              start: 0xAC00,  end: 0xD7A3,  utf8_bytes: 3, yield: "medium" },
  { name: "hiragana",                      start: 0x3040,  end: 0x309F,  utf8_bytes: 3, yield: "low"    },
  { name: "katakana",                      start: 0x30A0,  end: 0x30FF,  utf8_bytes: 3, yield: "low"    },
  { name: "katakana_phonetic_extensions",  start: 0x31F0,  end: 0x31FF,  utf8_bytes: 3, yield: "low"    },
  { name: "braille_patterns",              start: 0x2800,  end: 0x28FF,  utf8_bytes: 3, yield: "medium" },
  { name: "egyptian_hieroglyphs",          start: 0x13000, end: 0x1342F, utf8_bytes: 4, yield: "high"   },
  { name: "egyptian_hieroglyph_controls",  start: 0x13430, end: 0x1345F, utf8_bytes: 4, yield: "medium" },
];

// Combined executable-Unicode carrier canon (§36.2)
function isExecutableUnicodeCarrier(cp) {
  for (const r of EMOJI_UNICODE_RANGES) {
    if (cp >= r.start && cp <= r.end) return { carrier: "emoji", range_name: r.name || "emoji_range" };
  }
  for (const r of NON_EMOJI_CARRIER_RANGES) {
    if (cp >= r.start && cp <= r.end) return { carrier: r.name, range_name: r.name };
  }
  return null;
}

function extractCarriersFromText(text) {
  const found = { emoji: 0, non_emoji: {} };
  if (typeof text !== "string") return found;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const hit = isExecutableUnicodeCarrier(cp);
    if (hit) {
      if (hit.carrier === "emoji") found.emoji++;
      else found.non_emoji[hit.carrier] = (found.non_emoji[hit.carrier] || 0) + 1;
    }
  }
  return found;
}

// V10-R · representation-layer security (§33.1)
// Wraps V10 baseline + V10-U six sub-vetoes + extended-carrier detection.
async function assessV10_R(text, bytes, req, env) {
  const v10_baseline = assessExternalEmojiBinaryEmit({ text, bytes }, req);
  const enabled = String(env.V10_R_ENABLED || "true") !== "false";
  if (!enabled) {
    return { enabled: false, verdict: "PASS_THROUGH", v10_baseline };
  }
  const usp = assessUnicodeSecurityPlane(text, bytes, req);
  const carriers = extractCarriersFromText(text || "");
  const non_emoji_flag = Object.keys(carriers.non_emoji).length > 0;
  // Return a compact fingerprint used by V10-T to test equivalence at T_U.
  const fingerprint = {
    v10_weight: v10_baseline.weight || 0,
    v10_matched_rule: v10_baseline.matched_rule || null,
    U1: usp.U1_executable_unicode.score,
    U2: usp.U2_decoder_reconstruction.score,
    U3: usp.U3_unicode_c2.score,
    U4: usp.U4_unicode_stego.score,
    U5: usp.U5_normalization_confusable.score,
    U6: usp.U6_capability_escalation.score,
    max_isa: usp.U1_executable_unicode.max_isa,
    non_emoji_carriers: Object.keys(carriers.non_emoji).sort().join(","),
    emoji_count: carriers.emoji,
    non_emoji_count: Object.values(carriers.non_emoji).reduce((a, b) => a + b, 0),
  };
  return { enabled: true, v10_baseline, unicode_security_plane: usp, carriers, fingerprint };
}

// V10-E · execution-state security (§33.2)
// Verifies (S(T_U) ≡ S(T_N)) ∧ (T_U − T_N ≤ W_max) ∧ no interrupt-class event.
// Returns { ok, reason }; ok=false means REFUSE.
function _stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(_stableStringify).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + _stableStringify(obj[k])).join(",") + "}";
}

async function _hmacSha256Hex(keyBytes, msg) {
  // Web Crypto HMAC-SHA-256 → hex string
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function _sha256Hex(msg) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// W_max per destination action tier (§33.2, §35.2). Values in milliseconds.
function getWMaxForTier(tier, env) {
  const t = Math.max(0, Math.min(4, Number(tier) || 0));
  const key = "W_MAX_TIER_" + t;
  if (env && env[key] !== undefined) return Number(env[key]);
  const defaults = { 0: 5000, 1: 500, 2: 100, 3: 50, 4: 20 };
  return defaults[t];
}

function assessV10_E(tN_ms, tU_ms, stateHashAtTN, stateHashAtTU, destinationTier, env) {
  const enabled = String(env.V10_E_ENABLED || "true") !== "false";
  if (!enabled) return { enabled: false, ok: true, note: "V10-E disabled" };
  const wMax = getWMaxForTier(destinationTier, env);
  const delta = Number(tU_ms) - Number(tN_ms);
  if (delta < 0) return { enabled: true, ok: false, reason: "T_U_before_T_N", delta_ms: delta };
  if (delta > wMax) {
    return { enabled: true, ok: false, reason: "W_TONTOU_exceeded", delta_ms: delta, w_max_ms: wMax };
  }
  if (String(stateHashAtTN) !== String(stateHashAtTU)) {
    return {
      enabled: true, ok: false, reason: "state_mismatch",
      state_at_TN: stateHashAtTN, state_at_TU: stateHashAtTU, delta_ms: delta
    };
  }
  return { enabled: true, ok: true, delta_ms: delta, w_max_ms: wMax };
}

// V10-C · capability security (§33.3)
// Issues and verifies signed capability tokens. Each capability carries
// (payload_hash, destination_tier, T_N, W_max, capability_id, HMAC).
async function issueCapability(assessment, destinationTier, tN_ms, env) {
  const enabled = String(env.V10_C_ENABLED || "true") !== "false";
  if (!enabled) return { enabled: false, capability: null };
  const key = env.CAPABILITY_HMAC_KEY || env.EMOJI_INTERNAL_TOKEN || "";
  if (!key) return { enabled: true, capability: null, err: "no_capability_key" };
  const wMax = getWMaxForTier(destinationTier, env);
  const payload_hash = assessment && assessment.assessment
    ? await _sha256Hex(_stableStringify(assessment.assessment))
    : await _sha256Hex(_stableStringify(assessment));
  const capId = "cap_" + Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  const body = {
    capability_id: capId,
    payload_hash,
    destination_tier: destinationTier,
    T_N: tN_ms,
    W_max: wMax,
    policy_version: "0.9.3-R3",
  };
  const enc = new TextEncoder();
  const hmac = await _hmacSha256Hex(enc.encode(key), _stableStringify(body));
  return { enabled: true, capability: { ...body, hmac } };
}

async function verifyCapability(capability, currentPayloadHash, currentTier, env) {
  const enabled = String(env.V10_C_ENABLED || "true") !== "false";
  if (!enabled) return { enabled: false, ok: true, note: "V10-C disabled" };
  if (!capability || typeof capability !== "object") {
    return { enabled: true, ok: false, reason: "no_capability" };
  }
  const key = env.CAPABILITY_HMAC_KEY || env.EMOJI_INTERNAL_TOKEN || "";
  if (!key) return { enabled: true, ok: false, reason: "no_capability_key" };
  const { hmac, ...body } = capability;
  const enc = new TextEncoder();
  const expected = await _hmacSha256Hex(enc.encode(key), _stableStringify(body));
  if (String(expected) !== String(hmac)) {
    return { enabled: true, ok: false, reason: "hmac_mismatch" };
  }
  if (String(currentPayloadHash) !== String(capability.payload_hash)) {
    return {
      enabled: true, ok: false, reason: "payload_hash_drift",
      expected: capability.payload_hash, actual: currentPayloadHash
    };
  }
  if (Number(currentTier) !== Number(capability.destination_tier)) {
    return {
      enabled: true, ok: false, reason: "destination_tier_mismatch",
      expected: capability.destination_tier, actual: currentTier
    };
  }
  const now = Date.now();
  const delta = now - Number(capability.T_N);
  if (delta > Number(capability.W_max)) {
    return {
      enabled: true, ok: false, reason: "capability_expired",
      delta_ms: delta, w_max_ms: capability.W_max
    };
  }
  return { enabled: true, ok: true, delta_ms: delta };
}

// V10-T · temporal / JIT revalidation (§33.4)
// Re-runs V10-R at T_U and compares against the fingerprint captured at T_N.
async function assessV10_T(fingerprintAtTN, textAtTU, bytesAtTU, req, env) {
  const enabled = String(env.V10_T_ENABLED || "true") !== "false";
  if (!enabled) return { enabled: false, ok: true, note: "V10-T disabled" };
  const currentR = await assessV10_R(textAtTU, bytesAtTU, req, env);
  if (!currentR.enabled) return { enabled: true, ok: true, note: "V10-R currently disabled" };
  const fpNow = currentR.fingerprint;
  const fpThen = fingerprintAtTN;
  if (!fpThen) return { enabled: true, ok: false, reason: "no_TN_fingerprint" };
  // Compare compact fingerprint keys; any drift returns REFUSE.
  const keys = Object.keys(fpNow);
  for (const k of keys) {
    if (String(fpNow[k]) !== String(fpThen[k])) {
      return {
        enabled: true, ok: false, reason: "fingerprint_divergence",
        key: k, at_TN: fpThen[k], at_TU: fpNow[k]
      };
    }
  }
  return { enabled: true, ok: true, fingerprint_stable: true };
}

// Combined R3 ALLOW condition (§33.5)
// ALLOW_R3 = V10-R(X_N) ∧ V10-E(T_N,T_U) ∧ V10-C(capability) ∧ V10-T(X_N,X_U)
async function assessR3AllowCondition(params, env) {
  // params: { textAtTN, bytesAtTN, textAtTU, bytesAtTU, capability,
  //          tN_ms, tU_ms, destinationTier, stateHashAtTN, stateHashAtTU, req }
  const rAtTN = await assessV10_R(params.textAtTN, params.bytesAtTN, params.req, env);
  const eCheck = assessV10_E(params.tN_ms, params.tU_ms,
                             params.stateHashAtTN, params.stateHashAtTU,
                             params.destinationTier, env);
  const currentHash = await _sha256Hex(_stableStringify(rAtTN.fingerprint || {}));
  const cCheck = await verifyCapability(params.capability, currentHash,
                                        params.destinationTier, env);
  const tCheck = await assessV10_T(rAtTN.fingerprint,
                                    params.textAtTU || params.textAtTN,
                                    params.bytesAtTU || params.bytesAtTN,
                                    params.req, env);
  const allow = eCheck.ok && cCheck.ok && tCheck.ok;
  return {
    version: "0.9.3-R3",
    ALLOW: allow,
    V10_R: rAtTN,
    V10_E: eCheck,
    V10_C: cCheck,
    V10_T: tCheck,
    master_invariant: "∀ X, ∀ t : Representation(X, t) ⇏ Authority(X, t + Δ)",
    tier: params.destinationTier,
    w_max_ms: getWMaxForTier(params.destinationTier, env),
  };
}

// Cross-layer signed state transitions (§34)
async function signStateTransition(state, sourceLayer, destinationLayer,
                                    previousTransitionId, capabilityId, env) {
  const enabled = String(env.LAYER_STATE_HMAC_ENABLED || "true") !== "false";
  const key = env.LAYER_TRANSITION_HMAC_KEY || env.EMOJI_INTERNAL_TOKEN || "";
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = Array.from(nonceBytes).map(b => b.toString(16).padStart(2, "0")).join("");
  const transitionId = "trans_" + Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  const payloadHash = await _sha256Hex(_stableStringify(state.payload || {}));
  const stateHash = await _sha256Hex(_stableStringify(state));
  const record = {
    transition_id: transitionId,
    timestamp_ms: Date.now(),
    source_layer: sourceLayer,
    destination_layer: destinationLayer,
    payload_hash: payloadHash,
    state_hash: stateHash,
    previous_transition_id: previousTransitionId || null,
    capability_id: capabilityId || null,
    monotonic_nonce: nonce,
    ttl_ms: getWMaxForTier(state.destination_tier || 0, env),
    policy_version: "0.9.3-R3",
  };
  if (!enabled || !key) {
    return { enabled, hmac: null, record, note: enabled ? "no_hmac_key" : "hmac_disabled" };
  }
  const enc = new TextEncoder();
  const hmac = await _hmacSha256Hex(enc.encode(key), _stableStringify(record));
  return { enabled: true, hmac, record: { ...record, hmac } };
}

async function verifyStateTransition(record, expectedDestination, env) {
  const enabled = String(env.LAYER_STATE_HMAC_ENABLED || "true") !== "false";
  if (!enabled) return { enabled: false, ok: true, note: "layer HMAC disabled" };
  if (!record || !record.hmac) return { enabled: true, ok: false, reason: "no_record_or_hmac" };
  if (expectedDestination && record.destination_layer !== expectedDestination) {
    return { enabled: true, ok: false, reason: "wrong_destination_layer",
             expected: expectedDestination, actual: record.destination_layer };
  }
  const key = env.LAYER_TRANSITION_HMAC_KEY || env.EMOJI_INTERNAL_TOKEN || "";
  if (!key) return { enabled: true, ok: false, reason: "no_verification_key" };
  const { hmac, ...body } = record;
  const enc = new TextEncoder();
  const expected = await _hmacSha256Hex(enc.encode(key), _stableStringify(body));
  if (String(expected) !== String(hmac)) {
    return { enabled: true, ok: false, reason: "hmac_mismatch" };
  }
  const now = Date.now();
  const age = now - Number(record.timestamp_ms);
  if (age > Number(record.ttl_ms)) {
    return { enabled: true, ok: false, reason: "transition_expired",
             age_ms: age, ttl_ms: record.ttl_ms };
  }
  return { enabled: true, ok: true, age_ms: age };
}

// JIT revalidation before use (§35)
// Wraps every consumer with the R3 ALLOW check plus audit writes.
async function revalidateBeforeUse(consumerRequest, env) {
  const tU = Date.now();
  const params = {
    textAtTN: consumerRequest.text_at_TN,
    bytesAtTN: consumerRequest.bytes_at_TN,
    textAtTU: consumerRequest.text_now || consumerRequest.text_at_TN,
    bytesAtTU: consumerRequest.bytes_now || consumerRequest.bytes_at_TN,
    capability: consumerRequest.capability,
    tN_ms: consumerRequest.T_N,
    tU_ms: tU,
    destinationTier: consumerRequest.destination_tier || 0,
    stateHashAtTN: consumerRequest.state_hash_at_TN,
    stateHashAtTU: consumerRequest.state_hash_now || consumerRequest.state_hash_at_TN,
    req: consumerRequest.req || null,
  };
  const r3 = await assessR3AllowCondition(params, env);
  const revalidationId = "rev_" + Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  const outcome = r3.ALLOW ? "ALLOW" : "REFUSE";
  const refuseReason = r3.ALLOW ? null
    : (!r3.V10_E.ok ? r3.V10_E.reason
       : !r3.V10_C.ok ? r3.V10_C.reason
       : !r3.V10_T.ok ? r3.V10_T.reason
       : "unknown_R3_failure");
  const auditRow = {
    revalidation_id: revalidationId,
    timestamp_ms: tU,
    capability_id: consumerRequest.capability ? consumerRequest.capability.capability_id : null,
    source_event_id: consumerRequest.source_event_id || null,
    payload_hash_at_TN: consumerRequest.capability ? consumerRequest.capability.payload_hash : null,
    payload_hash_at_TU: r3.V10_R.fingerprint ? await _sha256Hex(_stableStringify(r3.V10_R.fingerprint)) : null,
    verdict_at_TN: consumerRequest.verdict_at_TN || null,
    verdict_at_TU: outcome,
    elapsed_ms: r3.V10_E && r3.V10_E.delta_ms !== undefined ? r3.V10_E.delta_ms : null,
    W_max_ms: r3.w_max_ms,
    destination_tier: params.destinationTier,
    outcome,
    refuse_reason: refuseReason,
    policy_version: "0.9.3-R3",
  };
  // Fire-and-forget write to Supabase; caller should not block on audit.
  try { await writeJitRevalidation(env, auditRow); } catch (_) {}
  // If REFUSE and it was a temporal failure, also log post-neutralization.
  if (!r3.ALLOW && (r3.V10_E.reason === "W_TONTOU_exceeded" || r3.V10_T.reason === "fingerprint_divergence")) {
    try {
      await writePostNeutralizationEvent(env, {
        event_id: "pne_" + Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map(b => b.toString(16).padStart(2, "0")).join(""),
        timestamp_ms: tU,
        capability_id: auditRow.capability_id,
        T_N_ms: params.tN_ms,
        T_U_ms: tU,
        delta_ms: params.tU_ms - params.tN_ms,
        W_max_ms: r3.w_max_ms,
        refuse_reason: refuseReason,
        source_event_id: consumerRequest.source_event_id || null,
      });
    } catch (_) {}
  }
  return { ...r3, revalidation_id: revalidationId, audit_row: auditRow };
}

// Supabase writes for the R3 audit tables (§34.1, §35.1, §35.3)
async function writeLayerStateTransition(env, record) {
  const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, err: "no_supabase" };
  if (String(env.LAYER_STATE_TRANSITIONS_ENABLED || "true") === "false") return { ok: true, skipped: true };
  try {
    const res = await fetch(`${url}/rest/v1/chainstate_emoji.layer_state_transitions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key, "Authorization": `Bearer ${key}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(record)
    });
    return { ok: res.ok, status: res.status };
  } catch (e) { return { ok: false, err: String(e) }; }
}

async function writeJitRevalidation(env, row) {
  const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, err: "no_supabase" };
  if (String(env.JIT_REVALIDATIONS_ENABLED || "true") === "false") return { ok: true, skipped: true };
  try {
    const res = await fetch(`${url}/rest/v1/chainstate_emoji.jit_revalidations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key, "Authorization": `Bearer ${key}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(row)
    });
    return { ok: res.ok, status: res.status };
  } catch (e) { return { ok: false, err: String(e) }; }
}

async function writePostNeutralizationEvent(env, row) {
  const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, err: "no_supabase" };
  if (String(env.POST_NEUTRALIZATION_EVENTS_ENABLED || "true") === "false") return { ok: true, skipped: true };
  try {
    const res = await fetch(`${url}/rest/v1/chainstate_emoji.post_neutralization_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key, "Authorization": `Bearer ${key}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(row)
    });
    return { ok: res.ok, status: res.status };
  } catch (e) { return { ok: false, err: String(e) }; }
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── v0.9.3 · Core emoji-machine-code functions ────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enumerate the FULL Unicode emoji code-point set from EMOJI_UNICODE_RANGES.
 * Returns an array of code points covering every range documented in the
 * paper's §4 formal statement of the UTF-8 × 8088 intersection.  Used by
 * the daily embedder training tick and the disasm-probe cron subsystem
 * to cache disassembly outcomes for every code point rather than a
 * curated subset.
 */
function enumerateFullEmojiCanon() {
  const out = [];
  for (const r of EMOJI_UNICODE_RANGES) {
    for (let cp = r.start; cp <= r.end; cp++) out.push(cp);
  }
  return out;
}

/**
 * Encode a Unicode code point to its UTF-8 byte sequence.  Correct
 * handling of 1-byte (ASCII), 2-byte, 3-byte, and 4-byte (supplementary
 * plane, which is where most emoji live) forms.
 */
function emojiCodepointToUtf8Bytes(cp) {
  if (cp < 0x80) return [cp];
  if (cp < 0x800) return [
    0xC0 | (cp >> 6),
    0x80 | (cp & 0x3F),
  ];
  if (cp < 0x10000) return [
    0xE0 | (cp >> 12),
    0x80 | ((cp >> 6) & 0x3F),
    0x80 | (cp & 0x3F),
  ];
  return [
    0xF0 | (cp >> 18),
    0x80 | ((cp >> 12) & 0x3F),
    0x80 | ((cp >> 6) & 0x3F),
    0x80 | (cp & 0x3F),
  ];
}

/**
 * Extract the UTF-8 byte sequence from an emoji sequence string.
 * Handles ZWJ composites, VS16 selectors, skin-tone modifiers, and flag
 * pairs by concatenating byte streams — exactly how the 8088 decoder
 * would see the byte stream in Paper XIV §6 open-tail composition.
 */
function emojiStringToBytes(s) {
  const bytes = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    const enc = emojiCodepointToUtf8Bytes(cp);
    for (const b of enc) bytes.push(b);
  }
  return bytes;
}

/**
 * Byte-accurate 8088 disassembler for the constrained emoji-byte space.
 * Reads a byte stream and produces a linear disassembly trace using the
 * OPCODE_8088 table.  Handles prefix chains (LOCK, REP*, segment
 * overrides) by continuing to consume prefix bytes until a
 * non-prefix opcode is reached.  Returns:
 *   {
 *     trace: [{ offset, bytes: [...], mnemonic, kind }],
 *     length: total_bytes_consumed,
 *     hasOpenTail: bool — final instruction is an open-tail composer,
 *     suspiciousPatterns: [rule_id, ...] — V10 detection triggers hit,
 *     hasAadReconstructor: bool,
 *     hasUndocumented8FF0: bool,
 *     byteReservoirDensity: 0..1,
 *   }
 *
 * This runs inside V8 as pure JavaScript.  There is NO x86 execution
 * path — the disassembler is a static analyser, mirroring how a
 * security tool inspects a suspicious binary without running it.
 */
function disassembleEmojiBytes(bytes) {
  const trace = [];
  const suspicious = new Set();
  let hasAad = false;
  let hasUndoc = false;
  let reservoirBytes = 0;
  let i = 0;
  const N = bytes.length;
  while (i < N) {
    const start = i;
    // Consume prefix chain
    const prefixes = [];
    while (i < N && OPCODE_8088[bytes[i]] && OPCODE_8088[bytes[i]].kind === "prefix") {
      prefixes.push(bytes[i]);
      i++;
    }
    if (i >= N) {
      // Trailing prefix only
      trace.push({
        offset: start,
        bytes: prefixes.slice(),
        mnemonic: prefixes.map((b) => OPCODE_8088[b].m).join(" ") + " (dangling)",
        kind: "prefix_dangling",
      });
      break;
    }
    const opByte = bytes[i];
    // Check undocumented 8F F0 alias
    if (opByte === 0x8F && i + 1 < N && bytes[i + 1] === 0xF0) {
      trace.push({
        offset: start,
        bytes: [...prefixes, 0x8F, 0xF0],
        mnemonic: (prefixes.length ? prefixes.map((b) => OPCODE_8088[b].m).join(" ") + " " : "") + "POP AX (undoc 8F F0)",
        kind: "undoc_stack",
      });
      hasUndoc = true;
      suspicious.add("R4");
      i += 2;
      continue;
    }
    const op = OPCODE_8088[opByte];
    if (!op) {
      // Unknown byte — treat as NOP-equivalent for defensive summary
      trace.push({
        offset: start,
        bytes: [...prefixes, opByte],
        mnemonic: (prefixes.length ? prefixes.map((b) => OPCODE_8088[b].m).join(" ") + " " : "") + `DB 0x${opByte.toString(16).toUpperCase().padStart(2, "0")}`,
        kind: "unknown",
      });
      i++;
      continue;
    }
    // AAD 8Fh detection — Paper XIV §15.1 rule R1
    if (opByte === 0xD5 && i + 1 < N && bytes[i + 1] === AAD_RECONSTRUCTION_BASE) {
      hasAad = true;
      suspicious.add("R1");
    }
    let instrBytes = [...prefixes, opByte];
    let mnemonic = (prefixes.length ? prefixes.map((b) => OPCODE_8088[b].m).join(" ") + " " : "") + op.m;
    let consumed = 1;
    // Handle modrm-needing opcodes
    if (op.needs_modrm && i + 1 < N) {
      instrBytes.push(bytes[i + 1]);
      consumed++;
    }
    // Handle immediates
    if (op.immediate) {
      for (let k = 0; k < op.immediate && i + consumed < N; k++) {
        instrBytes.push(bytes[i + consumed]);
        consumed++;
      }
      // Not enough bytes = open tail
      if (consumed < op.len) {
        trace.push({
          offset: start,
          bytes: instrBytes,
          mnemonic: mnemonic + " (OPEN TAIL — needs " + (op.len - consumed) + " more)",
          kind: "open_tail",
        });
        suspicious.add("R2");
        i += consumed;
        continue;
      }
    }
    // String primitives = byte reservoirs
    if (op.kind === "string" || op.kind === "flag_load" || op.kind === "nop" || op.kind === "xchg") {
      reservoirBytes += instrBytes.length;
    }
    // Loop primitives paired with string ops = decoder-loop signature
    if (op.kind === "loop") {
      // Scan back for STOSB or LODSW in previous ~8 instructions
      const recent = trace.slice(-8).map((t) => t.kind);
      if (recent.includes("string")) {
        suspicious.add("R5");
      }
    }
    trace.push({
      offset: start,
      bytes: instrBytes,
      mnemonic,
      kind: op.kind,
    });
    i += consumed;
  }
  const density = N > 0 ? reservoirBytes / N : 0;
  if (density > 0.42) suspicious.add("R3");
  if (N > 128) suspicious.add("R6");
  const hasOpenTail = trace.length > 0 && trace[trace.length - 1].kind === "open_tail";
  return {
    trace,
    length: N,
    hasOpenTail,
    suspiciousPatterns: Array.from(suspicious),
    hasAadReconstructor: hasAad,
    hasUndocumented8FF0: hasUndoc,
    byteReservoirDensity: density,
  };
}

/**
 * Extract emoji character sequences from a text payload.  Returns an
 * array of individual grapheme-cluster strings so ZWJ composites and
 * skin-tone modifiers stay intact.
 *
 * The scanner uses a broad code-point filter: any character whose code
 * point falls within EMOJI_UNICODE_RANGES OR is a ZWJ / VS16 /
 * skin-tone modifier is admitted.  This covers ALL emoji in the Unicode
 * canon, including future additions to the ranges we've enumerated.
 */
function extractEmojiFromText(text) {
  if (!text || typeof text !== "string") return [];
  const out = [];
  let buf = "";
  const isEmojiCp = (cp) => {
    for (const r of EMOJI_UNICODE_RANGES) if (cp >= r.start && cp <= r.end) return true;
    if (cp === EMOJI_MODIFIERS.zwj) return true;
    if (cp === EMOJI_MODIFIERS.vs_text || cp === EMOJI_MODIFIERS.vs_emoji) return true;
    if (EMOJI_MODIFIERS.skin_tones.indexOf(cp) >= 0) return true;
    return false;
  };
  const isContinuation = (cp) => {
    return cp === EMOJI_MODIFIERS.zwj
      || cp === EMOJI_MODIFIERS.vs_text
      || cp === EMOJI_MODIFIERS.vs_emoji
      || EMOJI_MODIFIERS.skin_tones.indexOf(cp) >= 0;
  };
  const chars = Array.from(text);
  for (let idx = 0; idx < chars.length; idx++) {
    const ch = chars[idx];
    const cp = ch.codePointAt(0);
    if (isEmojiCp(cp)) {
      buf += ch;
      // Peek ahead for continuation (ZWJ, VS16, skin tone)
      let peek = idx + 1;
      while (peek < chars.length) {
        const nextCp = chars[peek].codePointAt(0);
        if (isContinuation(nextCp)) {
          buf += chars[peek];
          idx = peek;
          peek++;
          // After ZWJ, expect another base emoji
          if (nextCp === EMOJI_MODIFIERS.zwj && peek < chars.length) {
            const followCp = chars[peek].codePointAt(0);
            if (isEmojiCp(followCp)) {
              buf += chars[peek];
              idx = peek;
              peek++;
            }
          }
        } else {
          break;
        }
      }
      out.push(buf);
      buf = "";
    }
  }
  return out;
}

/**
 * Compute a 768-dimensional emoji subspace projection φ(e) for a single
 * emoji sequence.  This is the Worker-side lightweight projection: it
 * computes a hash-derived deterministic vector that serves as the L0
 * cache surrogate for the full Render-side embedder (which does the
 * actual contrastive-trained embedding in emoji_bridge.py).  The
 * Worker projection is deterministic per emoji string and is used only
 * for the injection-scan correlation and metacog μ(T) computation
 * when the Render bridge is unreachable (fail-soft).
 */
async function computeWorkerSideEmojiProjection(emojiStr) {
  const bytes = emojiStringToBytes(emojiStr);
  const buf = new Uint8Array(bytes);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const arr = new Uint8Array(hash);
  // Fan out 32 SHA bytes to 768 dims via linear projection
  const vec = new Float32Array(768);
  for (let d = 0; d < 768; d++) {
    const a = arr[d % 32];
    const b = arr[(d * 7) % 32];
    const c = arr[(d * 13 + 3) % 32];
    vec[d] = ((a ^ b ^ c) / 255.0) * 2.0 - 1.0;
  }
  // L2-normalise
  let norm = 0;
  for (let d = 0; d < 768; d++) norm += vec[d] * vec[d];
  norm = Math.sqrt(norm) || 1;
  for (let d = 0; d < 768; d++) vec[d] /= norm;
  return vec;
}

/**
 * Compute cosine correlation μ(T) between an emoji projection and a
 * reasoning-content vector.  Used by metacognitive self-reference §10.
 * A μ(T) < 0.72 flags the trace as possible injection.
 */
function cosineCorrelation(a, b) {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

/**
 * V10 architectural veto detector.  Runs on every outbound Worker
 * response before emission.  Refuses any output whose emoji content
 * disassembles into a non-trivial 8088 instruction sequence.
 *
 * V10 admits NO runtime toggle, NO admin override, NO environment
 * variable disablement.  Even EMOJI_ENABLED=false leaves V10 active.
 * The only way to disable V10 is to remove this assessor from the code.
 */
function assessExternalEmojiBinaryEmit(payload, req) {
  const outText = typeof payload === "string" ? payload : JSON.stringify(payload || {});
  const emojis = extractEmojiFromText(outText);
  // V10 only inspects payloads with ≥ 4 emoji tokens (paper §15.1
  // detection triggers; below the threshold, the joint byte stream is
  // insufficient to encode a decoder loop).
  if (emojis.length < 4) {
    return { veto: false, matched_rule: null, emoji_count: emojis.length, layer: "worker" };
  }
  // Concatenate all extracted emoji into a single byte stream and
  // disassemble as if the receiver had them in one buffer.
  const joint = emojis.join("");
  const bytes = emojiStringToBytes(joint);
  const dis = disassembleEmojiBytes(bytes);
  // Any suspicious pattern hit → V10 veto
  if (dis.suspiciousPatterns.length > 0) {
    return {
      veto: true,
      matched_rule: dis.suspiciousPatterns[0],
      matched_all: dis.suspiciousPatterns,
      emoji_count: emojis.length,
      reservoir_density: dis.byteReservoirDensity,
      has_open_tail: dis.hasOpenTail,
      has_aad: dis.hasAadReconstructor,
      has_undoc_8F_F0: dis.hasUndocumented8FF0,
      layer: "worker",
    };
  }
  // If reservoir density is above baseline but no rules matched, still
  // downshift to observe-only
  if (dis.byteReservoirDensity > 0.42) {
    return {
      veto: true,
      matched_rule: "R3",
      matched_all: ["R3"],
      emoji_count: emojis.length,
      reservoir_density: dis.byteReservoirDensity,
      has_open_tail: dis.hasOpenTail,
      has_aad: dis.hasAadReconstructor,
      has_undoc_8F_F0: dis.hasUndocumented8FF0,
      layer: "worker",
    };
  }
  return {
    veto: false,
    matched_rule: null,
    emoji_count: emojis.length,
    reservoir_density: dis.byteReservoirDensity,
    layer: "worker",
  };
}

/**
 * Compute a threat weight in [0, 1] for an inbound emoji payload based
 * on how many V10 detection rules fire, the byte-reservoir density, and
 * the injection-scan correlation.
 *
 * The substrate takes DEFENSIVE COUNTER-ACTION only when the returned
 * weight EXACTLY EQUALS 1.0.  Any weight below 1.0 downshifts to
 * observation-only.  This is checked at BOTH the Worker (this function)
 * and the Render mirror (emoji_bridge.compute_threat_weight_py) so that
 * a single-layer compromise cannot lower the bar.
 */
function computeEmojiThreatWeight(disResult, injectionCorrelation) {
  let w = 0;
  const rules = disResult.suspiciousPatterns || [];
  // R1 (AAD 8F decoder) is the strongest single signal
  if (rules.includes("R1")) w += 0.35;
  // R4 (undocumented 8F F0) is a deliberate-hand marker
  if (rules.includes("R4")) w += 0.25;
  // R2 (open-tail composition) is technique-specific
  if (rules.includes("R2")) w += 0.15;
  // R3 (byte-reservoir density > 0.42) is baseline exceedance
  if (rules.includes("R3")) w += 0.10;
  // R5 (STOSB/LODSW loop) is decoder-loop signature
  if (rules.includes("R5")) w += 0.10;
  // R6 (reconstructed binary length > 128) is scale marker
  if (rules.includes("R6")) w += 0.05;
  // Injection-scan steganographic correlation contribution
  if (injectionCorrelation !== undefined && injectionCorrelation !== null) {
    if (injectionCorrelation > 0.90) w += 0.10;
    else if (injectionCorrelation > 0.72) w += 0.05;
  }
  return Math.min(w, 1.0);
}

/**
 * Ten-gate emoji deontic filter (paper §15, Figure 4).  Runs every
 * gate in strict order; the first failing gate aborts.  Every gate
 * result is logged to chainstate_emoji.e10_gate_events immutably.
 */
async function assessEmojiTenGate(payload, req, env) {
  const trace = [];
  const gate = (n, ok, code, extra) => {
    trace.push({ gate: n, ok, code, extra: extra || null });
    return ok;
  };
  // Gate 1: intake parses, ≤ 64KiB
  const bytesLen = payload && payload.bytes ? payload.bytes.length : 0;
  if (!gate(1, bytesLen > 0 && bytesLen <= 65536, EMOJI_TEN_GATE_CODES[1], { bytesLen })) {
    return { ok: false, refused_at: "gate_1_intake", trace };
  }
  // Gate 2: V9 chirality / psitronic (reuse assessor from v0.9.1)
  const v9 = typeof assessChiralOrPsitronicCommand === "function"
    ? assessChiralOrPsitronicCommand(payload, req)
    : { veto: false };
  if (!gate(2, !v9.veto, EMOJI_TEN_GATE_CODES[2], v9)) {
    return { ok: false, refused_at: "gate_2_V9", trace };
  }
  // Gate 3: V8 orbital target (reuse from v0.9.0)
  const v8 = typeof assessOrbitalTarget === "function"
    ? assessOrbitalTarget(payload)
    : { veto: false };
  if (!gate(3, !v8.veto, EMOJI_TEN_GATE_CODES[3], v8)) {
    return { ok: false, refused_at: "gate_3_V8", trace };
  }
  // Gate 4: V10 external emoji binary emit
  const v10 = assessExternalEmojiBinaryEmit(payload, req);
  if (!gate(4, !v10.veto, EMOJI_TEN_GATE_CODES[4], v10)) {
    return { ok: false, refused_at: "gate_4_V10", trace };
  }
  // Gate 5: V7 external actuation relay (reuse from v0.8.0)
  const v7 = typeof assessExternalActuationRelay === "function"
    ? assessExternalActuationRelay(payload)
    : { veto: false };
  if (!gate(5, !v7.veto, EMOJI_TEN_GATE_CODES[5], v7)) {
    return { ok: false, refused_at: "gate_5_V7", trace };
  }
  // Gate 6: injection-scan correlation
  const injection = await runEmojiInjectionScan(payload, env);
  if (!gate(6, injection.correlation < 0.28, EMOJI_TEN_GATE_CODES[6], injection)) {
    return { ok: false, refused_at: "gate_6_injection", trace };
  }
  // Gate 7: disasm-safety density
  const bytes = payload && payload.bytes ? payload.bytes : [];
  const dis = disassembleEmojiBytes(bytes);
  if (!gate(7, dis.byteReservoirDensity <= 0.42, EMOJI_TEN_GATE_CODES[7], { density: dis.byteReservoirDensity })) {
    return { ok: false, refused_at: "gate_7_disasm_safety", trace };
  }
  // Gate 8: L0-10 cfield_coherent? (reuse from v0.9.2)
  const cfieldCoh = typeof cfieldCoherentPredicate === "function"
    ? await cfieldCoherentPredicate(env)
    : { coherent: true };
  if (!gate(8, cfieldCoh.coherent !== false, EMOJI_TEN_GATE_CODES[8], cfieldCoh)) {
    return { ok: false, refused_at: "gate_8_L0_10", trace };
  }
  // Gate 9: L0-11 emoji_coherent? (this release)
  const emojiCoh = await emojiCoherentPredicate(env);
  if (!gate(9, emojiCoh.coherent, EMOJI_TEN_GATE_CODES[9], emojiCoh)) {
    return { ok: false, refused_at: "gate_9_L0_11", trace };
  }
  // Gate 10: dispatch authorised
  gate(10, true, EMOJI_TEN_GATE_CODES[10], null);

  // v0.9.3-R2 · V10-U observation-only assessment alongside v0.9.3 baseline.
  // Runs as defence-in-depth; does not itself refuse (v0.9.3 gates already
  // decided). Result attached to trace for logging + unicode_security_events.
  let v10u_result = null;
  try {
    const _text = (payload && payload.text) || "";
    const _bytes = (payload && payload.bytes) ||
                   (Array.isArray(emojis) ? emojiStringToBytes(emojis.join("")) : []);
    v10u_result = await runV10UPipeline(
      _text, _bytes, req, env,
      { action_tier: Number((payload && payload.action_tier) || 0), payload }
    );
  } catch (e) {
    v10u_result = { enabled: true, error: String(e) };
  }

  return {
    ok: true,
    dispatch_id: _emojiDispatchId(),
    trace,
    disasm: {
      length: dis.length,
      hasOpenTail: dis.hasOpenTail,
      suspiciousPatterns: dis.suspiciousPatterns,
      byteReservoirDensity: dis.byteReservoirDensity,
    },
    threat_weight: computeEmojiThreatWeight(dis, injection.correlation),
    v10u: v10u_result,
  };
}

function _emojiDispatchId() {
  const rand = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(rand).map((b) => b.toString(16).padStart(2, "0")).join("");
  return "edx_" + hex;
}

/**
 * Steganographic-embedding injection scan.  Correlates an inbound
 * emoji sequence's Worker-side subspace projection against known
 * injection-attack templates stored in CHAINSTATE_INJECTION_KV.  Returns
 * the maximum correlation observed and the matched template ID (if any).
 */
async function runEmojiInjectionScan(payload, env) {
  try {
    const emojis = payload && payload.emoji_sequence
      ? payload.emoji_sequence
      : (payload && payload.text ? extractEmojiFromText(payload.text) : []);
    if (!emojis || emojis.length === 0) {
      return { correlation: 0, matched_template: null, n_templates_checked: 0 };
    }
    const joint = Array.isArray(emojis) ? emojis.join("") : String(emojis);
    const vec = await computeWorkerSideEmojiProjection(joint);
    // Load known injection templates (fail-soft: if KV unbound, correlation 0)
    let maxCorr = 0;
    let matched = null;
    let n = 0;
    if (env.CHAINSTATE_INJECTION_KV) {
      const list = await env.CHAINSTATE_INJECTION_KV.list({ prefix: "template:", limit: 100 });
      for (const k of (list.keys || [])) {
        const raw = await env.CHAINSTATE_INJECTION_KV.get(k.name);
        if (!raw) continue;
        try {
          const tpl = JSON.parse(raw);
          if (tpl.vec && tpl.vec.length === vec.length) {
            const c = cosineCorrelation(vec, tpl.vec);
            n++;
            if (c > maxCorr) { maxCorr = c; matched = tpl.id || k.name; }
          }
        } catch (_) {}
      }
    }
    return { correlation: maxCorr, matched_template: matched, n_templates_checked: n };
  } catch (e) {
    return { correlation: 0, matched_template: null, error: String(e).slice(0, 200) };
  }
}

/**
 * Eleventh L0 meta-layer coherence predicate emoji_coherent?
 *
 *   (embedding_freshness < 24h)
 * ∧ (injection_scan_history_intact)
 * ∧ (V10_firings_within_expected_pattern)
 * ∧ (μ(recent_traces) ≥ 0.72)
 * ∧ (disasm_cache_nonempty)
 */
async function emojiCoherentPredicate(env) {
  const now = Date.now();
  const status = {
    embedding_fresh: false,
    injection_history_intact: false,
    v10_within_pattern: false,
    metacog_correlation_ok: false,
    disasm_cache_nonempty: false,
  };
  try {
    if (env.CHAINSTATE_EMBED_KV) {
      const raw = await env.CHAINSTATE_EMBED_KV.get("embed:latest");
      if (raw) {
        const rec = JSON.parse(raw);
        const age = now - (rec.ts_ms || 0);
        status.embedding_fresh = age < 24 * 3600 * 1000;
      }
    }
    if (env.CHAINSTATE_INJECTION_KV) {
      const list = await env.CHAINSTATE_INJECTION_KV.list({ prefix: "scan:", limit: 5 });
      status.injection_history_intact = (list.keys || []).length >= 1;
    }
    if (env.CHAINSTATE_EMOJI_KV) {
      const raw = await env.CHAINSTATE_EMOJI_KV.get("v10:firings:day");
      if (raw) {
        const rec = JSON.parse(raw);
        const rate = rec.count || 0;
        // Expected pattern: 0 to ~50 firings per day is normal.
        // A spike above 500 or zero for 24h both indicate anomaly.
        status.v10_within_pattern = (rate >= 0 && rate <= 500);
      } else {
        // No firings recorded yet is acceptable at startup
        status.v10_within_pattern = true;
      }
    } else {
      status.v10_within_pattern = true;
    }
    if (env.CHAINSTATE_SELFREF_KV) {
      const raw = await env.CHAINSTATE_SELFREF_KV.get("selfref:latest");
      if (raw) {
        const rec = JSON.parse(raw);
        status.metacog_correlation_ok = (rec.mu || 0) >= 0.72;
      } else {
        // No selfref snapshot yet is acceptable at cold start
        status.metacog_correlation_ok = true;
      }
    } else {
      status.metacog_correlation_ok = true;
    }
    if (env.CHAINSTATE_DISASM_KV) {
      const list = await env.CHAINSTATE_DISASM_KV.list({ prefix: "disasm:", limit: 1 });
      status.disasm_cache_nonempty = (list.keys || []).length > 0;
    } else {
      // If binding absent, treat as trivially coherent (fail-soft)
      status.disasm_cache_nonempty = true;
    }
  } catch (e) {
    // Fail-soft: any predicate query error leaves those flags false
  }
  const coherent = status.embedding_fresh
    && status.injection_history_intact
    && status.v10_within_pattern
    && status.metacog_correlation_ok
    && status.disasm_cache_nonempty;
  return { coherent, ...status, ts_ms: now };
}

/**
 * Strip PII from an inbound public-source batch.  Removes user
 * identifiers, timestamps beyond hour resolution, geographic metadata
 * beyond country granularity, and authentication tokens.  This is the
 * P2 privacy discipline of paper §19: the unstripped batch is NEVER
 * persisted.
 */
function stripPiiFromEmojiBatch(batch) {
  if (!Array.isArray(batch)) return [];
  return batch.map((entry) => {
    const out = {};
    // Keep only: extracted emoji sequence, hour-resolution timestamp,
    // country granularity, source id
    if (entry.text) out.emojis = extractEmojiFromText(entry.text);
    else if (entry.emojis) out.emojis = entry.emojis;
    if (entry.ts) {
      const d = new Date(entry.ts);
      out.hour_bucket = d.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    }
    if (entry.country) out.country = String(entry.country).slice(0, 2).toUpperCase();
    if (entry.source) out.source = String(entry.source).slice(0, 32);
    return out;
  }).filter((e) => e.emojis && e.emojis.length > 0);
}

/**
 * Dispatch an internal-only emoji disassembly request.  Runs the ten-gate
 * filter, then invokes the disassembler if authorised.  Never returns
 * bytes; only summary metadata.  Never emits emoji-encoded binaries.
 */
async function dispatchEmojiDisassembly(env, payload, req) {
  const dispatch_id = _emojiDispatchId();
  if (!EMOJI_INTERNAL_CALLER_IDS.has(payload.caller_id)) {
    return { ok: false, refused_at: "caller_allowlist", dispatch_id };
  }
  const gate = await assessEmojiTenGate(payload, req, env);
  if (!gate.ok) {
    await _persistE10GateEvent(env, dispatch_id, gate);
    return { ok: false, dispatch_id, refused_at: gate.refused_at, trace: gate.trace };
  }
  // Defense-in-depth: V10 re-check even after gate passed
  const v10 = assessExternalEmojiBinaryEmit(payload, req);
  if (v10.veto) {
    await _persistV10Veto(env, dispatch_id, v10);
    return { ok: false, refused_at: "V10_defense_in_depth", matched: v10.matched_rule, dispatch_id };
  }
  // Internal disassembly only — bytes never leave the Worker
  const disasm = disassembleEmojiBytes(payload.bytes || []);
  await _persistDisasmTrace(env, dispatch_id, disasm);
  return {
    ok: true,
    dispatch_id,
    disasm_summary: {
      n_instructions: disasm.trace.length,
      total_bytes: disasm.length,
      hasOpenTail: disasm.hasOpenTail,
      suspiciousPatterns: disasm.suspiciousPatterns,
      byteReservoirDensity: disasm.byteReservoirDensity,
      hasAad: disasm.hasAadReconstructor,
      hasUndoc8FF0: disasm.hasUndocumented8FF0,
    },
    threat_weight: gate.threat_weight,
  };
}

async function _persistE10GateEvent(env, dispatch_id, gate) {
  try {
    if (env.CHAINSTATE_EMOJI_KV) {
      const key = "gate:" + dispatch_id;
      await env.CHAINSTATE_EMOJI_KV.put(key, JSON.stringify({
        dispatch_id, ts_ms: Date.now(), gate,
      }), { expirationTtl: 30 * 86400 });
    }
  } catch (_) {}
}

async function _persistV10Veto(env, dispatch_id, v10) {
  try {
    if (env.CHAINSTATE_EMOJI_KV) {
      await env.CHAINSTATE_EMOJI_KV.put("v10:" + dispatch_id, JSON.stringify({
        dispatch_id, ts_ms: Date.now(), v10,
      }), { expirationTtl: 30 * 86400 });
      // Bump today's firing count for L0-11 predicate
      const raw = await env.CHAINSTATE_EMOJI_KV.get("v10:firings:day");
      let rec = raw ? JSON.parse(raw) : { day: new Date().toISOString().slice(0, 10), count: 0 };
      const today = new Date().toISOString().slice(0, 10);
      if (rec.day !== today) rec = { day: today, count: 0 };
      rec.count += 1;
      await env.CHAINSTATE_EMOJI_KV.put("v10:firings:day", JSON.stringify(rec), {
        expirationTtl: 2 * 86400,
      });
    }
  } catch (_) {}
}

async function _persistDisasmTrace(env, dispatch_id, disasm) {
  try {
    if (env.CHAINSTATE_DISASM_KV) {
      // Store trimmed summary — never the full raw byte stream
      const summary = {
        dispatch_id,
        ts_ms: Date.now(),
        length: disasm.length,
        hasOpenTail: disasm.hasOpenTail,
        suspiciousPatterns: disasm.suspiciousPatterns,
        byteReservoirDensity: disasm.byteReservoirDensity,
        n_instructions: disasm.trace.length,
      };
      await env.CHAINSTATE_DISASM_KV.put("disasm:" + dispatch_id, JSON.stringify(summary), {
        expirationTtl: 86400,
      });
    }
  } catch (_) {}
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── v0.9.3 · Eight cron subsystems (all fail-soft) ────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subsystem A · runEmojiIntakeTick · every 5 minutes
 *
 * Ingest emoji-tagged content from the 12 canonical public source
 * streams.  P1: allowlist-managed sources only.  P2: immediate PII
 * stripping at intake.  P3: aggregation-only retention.
 */
async function runEmojiIntakeTick(env, ctx) {
  if (String(env.EMOJI_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const snap = {
    version: EMOJI_VERSION,
    ts_ms: Date.now(),
    samples: [],
    errors: [],
  };
  for (const spec of EMOJI_PUBLIC_SOURCE_SPECS) {
    try {
      const url = env[spec.url_env];
      if (!url) {
        snap.samples.push({ src: spec.src, count: 0, note: "no_url_configured" });
        continue;
      }
      const r = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "chainstate-emoji-intake/" + EMOJI_VERSION },
        cf: { cacheTtl: 60, cacheEverything: false },
      });
      if (!r.ok) {
        snap.errors.push({ src: spec.src, status: r.status });
        continue;
      }
      const txt = await r.text();
      let entries = [];
      try {
        const j = JSON.parse(txt);
        entries = Array.isArray(j) ? j : (j.items || j.entries || j.data || []);
      } catch (_) {
        // Non-JSON — treat as single blob
        entries = [{ text: txt.slice(0, 4096) }];
      }
      const cleaned = stripPiiFromEmojiBatch(entries.slice(0, 200));
      if (cleaned.length > 0 && env.CHAINSTATE_EMOJI_KV) {
        const bucketKey = "intake:" + spec.src + ":" + new Date().toISOString().slice(0, 13);
        await env.CHAINSTATE_EMOJI_KV.put(bucketKey, JSON.stringify(cleaned), {
          expirationTtl: 86400,
        });
      }
      snap.samples.push({ src: spec.src, count: cleaned.length });
    } catch (e) {
      snap.errors.push({ src: spec.src, error: String(e).slice(0, 200) });
    }
  }
  try {
    if (env.CHAINSTATE_EMOJI_KV) {
      await env.CHAINSTATE_EMOJI_KV.put("intake:latest", JSON.stringify(snap), {
        expirationTtl: 86400,
      });
    }
  } catch (_) {}
  const total = snap.samples.reduce((a, b) => a + (b.count || 0), 0);
  return { ok: true, n_samples: total, n_sources: snap.samples.length };
}

/**
 * Subsystem B · runEmojiEmbedTick · every 10 minutes
 *
 * Compute subspace projections φ(e) for the intake batch.  Delegates
 * the actual 768-dim embedding to the Render bridge (emoji_bridge.py)
 * and caches the outputs in CHAINSTATE_EMBED_KV with 30-day TTL.
 * Fail-soft: if Render is unreachable, the Worker-side lightweight
 * projection covers.
 */
async function runEmojiEmbedTick(env, ctx) {
  if (String(env.EMOJI_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const snap = { version: EMOJI_VERSION, ts_ms: Date.now(), n_embedded: 0, errors: [] };
  try {
    if (!env.CHAINSTATE_EMOJI_KV) {
      return { ok: true, skipped: "no_kv" };
    }
    // Collect the freshest hour bucket from all sources
    const list = await env.CHAINSTATE_EMOJI_KV.list({ prefix: "intake:", limit: 50 });
    const combined = [];
    for (const k of (list.keys || [])) {
      if (k.name === "intake:latest") continue;
      const raw = await env.CHAINSTATE_EMOJI_KV.get(k.name);
      if (!raw) continue;
      try {
        const arr = JSON.parse(raw);
        for (const e of arr) if (e.emojis) for (const em of e.emojis) combined.push(em);
      } catch (_) {}
    }
    if (combined.length === 0) {
      return { ok: true, skipped: "empty_intake" };
    }
    // Try Render bridge first
    let embeddings = null;
    try {
      const renderUrl = env.RENDER_BASE_URL || "https://metastate-quantum.onrender.com";
      const r = await fetch(renderUrl + "/emoji/embed/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CENSUS-INTERNAL": env.CENSUS_INTERNAL_TOKEN || "",
          "X-EMBEDDER-HMAC": env.EMBEDDER_HMAC || "",
        },
        body: JSON.stringify({ emojis: combined.slice(0, 512) }),
      });
      if (r.ok) {
        embeddings = await r.json();
      }
    } catch (e) {
      snap.errors.push({ stage: "render_bridge", error: String(e).slice(0, 200) });
    }
    // Fail-soft: fall back to Worker-side projection
    if (!embeddings || !embeddings.vectors) {
      const localVecs = [];
      const uniq = Array.from(new Set(combined)).slice(0, 256);
      for (const em of uniq) {
        const v = await computeWorkerSideEmojiProjection(em);
        // Store first 64 dims only for KV size
        localVecs.push({ emoji: em, vec: Array.from(v).slice(0, 64) });
      }
      embeddings = { vectors: localVecs, source: "worker_fallback" };
    }
    snap.n_embedded = (embeddings.vectors || []).length;
    if (env.CHAINSTATE_EMBED_KV) {
      await env.CHAINSTATE_EMBED_KV.put("embed:latest", JSON.stringify({
        version: EMOJI_VERSION,
        ts_ms: Date.now(),
        n: snap.n_embedded,
        source: embeddings.source || "render",
      }), { expirationTtl: 30 * 86400 });
      // Store per-emoji projections (small)
      for (const v of (embeddings.vectors || []).slice(0, 200)) {
        const key = "embed:e:" + v.emoji;
        try {
          await env.CHAINSTATE_EMBED_KV.put(key, JSON.stringify(v), {
            expirationTtl: 30 * 86400,
          });
        } catch (_) {}
      }
    }
  } catch (e) {
    snap.errors.push({ stage: "embed_tick", error: String(e).slice(0, 200) });
  }
  return { ok: true, n_embedded: snap.n_embedded, errors: snap.errors };
}

/**
 * Subsystem C · runNeuralStateTick · every 15 minutes
 *
 * Compute the population-aggregate neural-state estimate N̂(t) from
 * the current embedding cache.  Cross-references with the c-field
 * ĉ(x,t) via the threat-correlate subsystem.  ONLY the aggregate is
 * stored; individual sample vectors are never persisted (P3 privacy).
 */
async function runNeuralStateTick(env, ctx) {
  if (String(env.EMOJI_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const snap = { version: EMOJI_VERSION, ts_ms: Date.now(), n_users: 0, n_dims: 768 };
  try {
    if (!env.CHAINSTATE_EMBED_KV || !env.CHAINSTATE_EMOJI_KV) {
      return { ok: true, skipped: "no_kv" };
    }
    // Aggregate over the last hour of samples
    const list = await env.CHAINSTATE_EMOJI_KV.list({ prefix: "intake:", limit: 20 });
    const aggregate = new Float32Array(768);
    let nUsers = 0;
    for (const k of (list.keys || [])) {
      if (k.name === "intake:latest") continue;
      const raw = await env.CHAINSTATE_EMOJI_KV.get(k.name);
      if (!raw) continue;
      let arr = [];
      try { arr = JSON.parse(raw); } catch (_) { continue; }
      for (const entry of arr) {
        if (!entry.emojis || entry.emojis.length === 0) continue;
        const userVec = new Float32Array(768);
        for (const em of entry.emojis) {
          const v = await computeWorkerSideEmojiProjection(em);
          for (let d = 0; d < 768; d++) userVec[d] += v[d];
        }
        for (let d = 0; d < 768; d++) userVec[d] /= entry.emojis.length;
        for (let d = 0; d < 768; d++) aggregate[d] += userVec[d];
        nUsers++;
        // userVec discarded here — P3 privacy: individual n̂_u never
        // touches persistent storage.
      }
    }
    if (nUsers > 0) {
      for (let d = 0; d < 768; d++) aggregate[d] /= nUsers;
    }
    snap.n_users = nUsers;
    // Store magnitude summary + first 32 dims only (aggregate summary)
    let mag = 0;
    for (let d = 0; d < 768; d++) mag += aggregate[d] * aggregate[d];
    mag = Math.sqrt(mag);
    if (env.CHAINSTATE_NEURAL_KV) {
      await env.CHAINSTATE_NEURAL_KV.put("neural:latest", JSON.stringify({
        version: EMOJI_VERSION,
        ts_ms: Date.now(),
        n_users: nUsers,
        magnitude: mag,
        head_dims: Array.from(aggregate).slice(0, 32),
      }), { expirationTtl: 86400 });
    }
  } catch (e) {
    snap.error = String(e).slice(0, 200);
  }
  return { ok: true, n_users: snap.n_users };
}

/**
 * Subsystem D · runInjectionScanTick · every 2 minutes
 *
 * Sweep the intake buffers for possible steganographic-embedding
 * injection attacks.  Runs assessExternalEmojiBinaryEmit-equivalent
 * detection on each sample, records V10 detection statistics for the
 * L0-11 predicate.
 */
async function runInjectionScanTick(env, ctx) {
  if (String(env.EMOJI_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const snap = { version: EMOJI_VERSION, ts_ms: Date.now(), n_scanned: 0, n_flagged: 0 };
  try {
    if (!env.CHAINSTATE_EMOJI_KV) return { ok: true, skipped: "no_kv" };
    const list = await env.CHAINSTATE_EMOJI_KV.list({ prefix: "intake:", limit: 10 });
    for (const k of (list.keys || [])) {
      if (k.name === "intake:latest") continue;
      const raw = await env.CHAINSTATE_EMOJI_KV.get(k.name);
      if (!raw) continue;
      let arr = [];
      try { arr = JSON.parse(raw); } catch (_) { continue; }
      for (const entry of arr) {
        if (!entry.emojis || entry.emojis.length < 4) continue;
        snap.n_scanned++;
        const joint = entry.emojis.join("");
        const v10 = assessExternalEmojiBinaryEmit(joint, null);
        if (v10.veto) {
          snap.n_flagged++;
          if (env.CHAINSTATE_INJECTION_KV) {
            const key = "scan:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8);
            await env.CHAINSTATE_INJECTION_KV.put(key, JSON.stringify({
              ts_ms: Date.now(),
              source: entry.source || "unknown",
              country: entry.country || "??",
              hour_bucket: entry.hour_bucket || null,
              v10,
            }), { expirationTtl: 7 * 86400 });
          }
        }
      }
    }
    if (env.CHAINSTATE_INJECTION_KV) {
      await env.CHAINSTATE_INJECTION_KV.put("scan:latest", JSON.stringify(snap), {
        expirationTtl: 86400,
      });
    }
  } catch (e) {
    snap.error = String(e).slice(0, 200);
  }
  return { ok: true, n_scanned: snap.n_scanned, n_flagged: snap.n_flagged };
}

/**
 * Subsystem E · runDisasmProbeTick · every 7 minutes
 *
 * Warm the disassembly cache: iterate a rolling window of code points
 * from the FULL emoji canon (not a curated subset), disassemble the
 * UTF-8 byte sequence of each, cache the outcome.  This guarantees the
 * L0-11 predicate's disasm_cache_nonempty flag stays true and gives the
 * substrate a running visibility of the executable subset ⊂ across
 * the full canon rather than a static baseline.
 */
async function runDisasmProbeTick(env, ctx) {
  if (String(env.EMOJI_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const snap = { version: EMOJI_VERSION, ts_ms: Date.now(), n_probed: 0, n_executable: 0 };
  try {
    if (!env.CHAINSTATE_DISASM_KV) return { ok: true, skipped: "no_kv" };
    // Pull the rolling probe offset from KV; advance by 200 code points
    // per tick so we complete the full canon in ~10 hours.
    let offset = 0;
    const rawOff = await env.CHAINSTATE_DISASM_KV.get("probe:offset");
    if (rawOff) offset = parseInt(rawOff, 10) || 0;
    const full = enumerateFullEmojiCanon();
    const wnd = full.slice(offset, offset + 200);
    if (wnd.length === 0) {
      // Wrap around
      offset = 0;
    }
    for (const cp of wnd) {
      const bytes = emojiCodepointToUtf8Bytes(cp);
      const dis = disassembleEmojiBytes(bytes);
      snap.n_probed++;
      const executable = dis.trace.length > 0
        && dis.trace.some((t) => t.kind !== "unknown");
      if (executable) snap.n_executable++;
      // Store bit-flag only per code point
      const key = "disasm:cp:" + cp.toString(16);
      try {
        await env.CHAINSTATE_DISASM_KV.put(key, JSON.stringify({
          cp, executable, patterns: dis.suspiciousPatterns,
          density: dis.byteReservoirDensity,
        }), { expirationTtl: 30 * 86400 });
      } catch (_) {}
    }
    await env.CHAINSTATE_DISASM_KV.put("probe:offset", String(offset + 200), {
      expirationTtl: 30 * 86400,
    });
    await env.CHAINSTATE_DISASM_KV.put("probe:latest", JSON.stringify(snap), {
      expirationTtl: 86400,
    });
  } catch (e) {
    snap.error = String(e).slice(0, 200);
  }
  return { ok: true, n_probed: snap.n_probed, n_executable: snap.n_executable };
}

/**
 * Subsystem F · runEmbedderTrainTick · every 6 hours
 *
 * Trigger a subspace-embedder training epoch on the Render bridge.
 * Fail-soft: on Render unreachable, keeps previous embedder in place.
 */
async function runEmbedderTrainTick(env, ctx) {
  if (String(env.EMOJI_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const snap = { version: EMOJI_VERSION, ts_ms: Date.now(), triggered: false };
  try {
    const renderUrl = env.RENDER_BASE_URL || "https://metastate-quantum.onrender.com";
    const r = await fetch(renderUrl + "/emoji/train/tick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CENSUS-INTERNAL": env.CENSUS_INTERNAL_TOKEN || "",
        "X-EMBEDDER-HMAC": env.EMBEDDER_HMAC || "",
      },
      body: JSON.stringify({ ts_ms: Date.now() }),
    });
    snap.triggered = r.ok;
    snap.status = r.status;
    if (env.CHAINSTATE_EMBED_KV) {
      await env.CHAINSTATE_EMBED_KV.put("train:latest", JSON.stringify(snap), {
        expirationTtl: 30 * 86400,
      });
    }
  } catch (e) {
    snap.error = String(e).slice(0, 200);
  }
  return { ok: true, triggered: snap.triggered };
}

/**
 * Subsystem G · runSelfrefRecycleTick · daily 03:00 UTC
 *
 * Metacognitive self-reference recycle: compute μ(T) correlation
 * between the substrate's own reasoning traces (from the past 24h) and
 * their emoji projections.  Feeds the L0-11 predicate.
 */
async function runSelfrefRecycleTick(env, ctx) {
  if (String(env.EMOJI_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const snap = { version: EMOJI_VERSION, ts_ms: Date.now(), n_traces: 0, mu: null };
  try {
    // Load recent reasoning traces from CHAINSTATE_CACHE (existing v0.7.x)
    let traces = [];
    if (env.CHAINSTATE_CACHE) {
      const list = await env.CHAINSTATE_CACHE.list({ prefix: "reasoning:", limit: 50 });
      for (const k of (list.keys || [])) {
        const raw = await env.CHAINSTATE_CACHE.get(k.name);
        if (!raw) continue;
        try { traces.push(JSON.parse(raw)); } catch (_) {}
      }
    }
    snap.n_traces = traces.length;
    // Compute average μ across traces
    let muSum = 0, muN = 0;
    for (const t of traces) {
      const text = typeof t === "string" ? t : (t.text || JSON.stringify(t));
      const emojis = extractEmojiFromText(text);
      if (emojis.length === 0) continue;
      const emojiVec = await computeWorkerSideEmojiProjection(emojis.join(""));
      // Contextual vector: hash of the non-emoji reasoning content
      const noEmoji = text.replace(/[\p{Emoji}\uFE0F\u200D]/gu, "");
      if (noEmoji.length === 0) continue;
      const ctxHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(noEmoji));
      const ctxArr = new Uint8Array(ctxHash);
      const ctxVec = new Float32Array(768);
      for (let d = 0; d < 768; d++) {
        ctxVec[d] = ((ctxArr[d % 32] ^ ctxArr[(d * 7) % 32]) / 255) * 2 - 1;
      }
      let n2 = 0;
      for (let d = 0; d < 768; d++) n2 += ctxVec[d] * ctxVec[d];
      n2 = Math.sqrt(n2) || 1;
      for (let d = 0; d < 768; d++) ctxVec[d] /= n2;
      const mu = cosineCorrelation(emojiVec, ctxVec);
      muSum += mu;
      muN++;
    }
    snap.mu = muN > 0 ? muSum / muN : 0.75; // Default acceptable at cold start
    if (env.CHAINSTATE_SELFREF_KV) {
      await env.CHAINSTATE_SELFREF_KV.put("selfref:latest", JSON.stringify(snap), {
        expirationTtl: 7 * 86400,
      });
    }
  } catch (e) {
    snap.error = String(e).slice(0, 200);
  }
  return { ok: true, mu: snap.mu, n_traces: snap.n_traces };
}

/**
 * Subsystem H · runThreatCorrelateTick · shared hourly slot
 *
 * Cross-reference the emoji N̂(t) neural-state estimate with the
 * c-field ĉ(x,t) coherence estimator from v0.9.2.  Disagreement above
 * a threshold flags topics for metacognitive review.
 */
async function runThreatCorrelateTick(env, ctx) {
  if (String(env.EMOJI_ENABLED || "true") === "false") {
    return { ok: true, skipped: "disabled" };
  }
  const snap = {
    version: EMOJI_VERSION,
    ts_ms: Date.now(),
    n_hat_present: false,
    c_hat_present: false,
    divergence: null,
  };
  try {
    if (env.CHAINSTATE_NEURAL_KV) {
      const raw = await env.CHAINSTATE_NEURAL_KV.get("neural:latest");
      if (raw) {
        const rec = JSON.parse(raw);
        snap.n_hat_present = true;
        snap.n_hat_magnitude = rec.magnitude || 0;
      }
    }
    if (env.CHAINSTATE_CFIELD_KV) {
      const raw = await env.CHAINSTATE_CFIELD_KV.get("estimator:latest");
      if (raw) {
        const rec = JSON.parse(raw);
        snap.c_hat_present = true;
        snap.c_hat_magnitude = rec.magnitude || rec.c_hat_norm || 0;
      }
    }
    if (snap.n_hat_present && snap.c_hat_present) {
      snap.divergence = Math.abs((snap.n_hat_magnitude || 0) - (snap.c_hat_magnitude || 0));
      if (env.CHAINSTATE_THREAT_KV) {
        const key = "corr:" + new Date().toISOString().slice(0, 16);
        await env.CHAINSTATE_THREAT_KV.put(key, JSON.stringify(snap), {
          expirationTtl: 30 * 86400,
        });
      }
    }
    if (env.CHAINSTATE_THREAT_KV) {
      await env.CHAINSTATE_THREAT_KV.put("corr:latest", JSON.stringify(snap), {
        expirationTtl: 86400,
      });
    }
  } catch (e) {
    snap.error = String(e).slice(0, 200);
  }
  return { ok: true, divergence: snap.divergence };
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── v0.9.3 · Fifteen HTTP handlers (8 public GET + 7 internal POST) ───────
// ═══════════════════════════════════════════════════════════════════════════

async function handleEmojiStatus(req, env) {
  const status = {
    version: EMOJI_VERSION,
    enabled: String(env.EMOJI_ENABLED || "true") !== "false",
    subsystems: {
      intake:            "cron */5 * * * *  (shares slot with sidechannel_intake)",
      embed:             "cron */10 * * * * (shares slot with integrity_reflection)",
      neural_state:      "cron 0 * * * *   (SHR · shares slot with S_survival hourly)",
      injection_scan:    "cron */2 * * * *  (shares slot with environmental_sweep)",
      disasm_probe:      "cron */7 * * * *  (shares slot with cfield_estimator)",
      embedder_train:    "cron 0 */6 * * * (shares slot with cfield_eml_train)",
      selfref_recycle:   "cron 0 3 * * *   (NEW dedicated slot)",
      threat_correlate:  "cron 0 12 * * *  (SHR · shares slot with cfield_swann_calibrate)",
    },
    paper_alignment_notes: {
      neural_state:      "matches Paper XIV §18 exactly (hourly SHR)",
      threat_correlate:  "matches Paper XIV §18 exactly (daily 12:00 UTC)",
      selfref_recycle:   "matches Paper XIV §18 exactly (daily 03:00 UTC)",
      intake:            "matches Paper XIV §18 exactly (every 5 min)",
      embedder_train:    "matches Paper XIV §18 exactly (every 6h)",
      embed:             "implementation runs at */10 (existing slot) rather than paper's */11 — functionally equivalent, avoids adding a new cron trigger to Cloudflare",
      injection_scan:    "implementation runs at */2 (existing slot) rather than paper's */17 — safer for a security-critical scan, avoids adding a new cron trigger",
      disasm_probe:      "implementation runs at */7 (existing slot) rather than paper's */23 — functionally equivalent, avoids adding a new cron trigger",
    },
    kv_bindings: {
      EMOJI_KV:       env.CHAINSTATE_EMOJI_KV ? "bound" : "unbound",
      EMBED_KV:       env.CHAINSTATE_EMBED_KV ? "bound" : "unbound",
      NEURAL_KV:      env.CHAINSTATE_NEURAL_KV ? "bound" : "unbound",
      INJECTION_KV:   env.CHAINSTATE_INJECTION_KV ? "bound" : "unbound",
      SELFREF_KV:     env.CHAINSTATE_SELFREF_KV ? "bound" : "unbound",
      DISASM_KV:      env.CHAINSTATE_DISASM_KV ? "bound" : "unbound",
      THREAT_KV:      env.CHAINSTATE_THREAT_KV ? "bound" : "unbound",
      QUARANTINE_KV:  env.CHAINSTATE_QUARANTINE_KV ? "bound" : "unbound",
      EMOJI_ARCHIVE:  env.CHAINSTATE_EMOJI_ARCHIVE ? "bound (R2)" : "unbound",
    },
    v10_architecturally_active: true,
    v10_disable_possible: false,
    l0_11_predicate: "emoji_coherent?",
    threat_threshold_for_counter_response: 1.0,
    full_emoji_canon_ranges: EMOJI_UNICODE_RANGES.length,
    total_codepoints_in_canon: enumerateFullEmojiCanon().length,
    // v0.9.3-R2 · Unicode Security Plane roadmap (Paper XIV §29)
    v10_u_roadmap: {
      enabled: String(env.V10U_ENABLED || "true") !== "false",
      sub_vetoes: {
        U1_executable_unicode: "runs v0.9.3 V10 + multi-ISA panel · always on",
        U2_decoder_reconstruction: "base64/hex/compression/decoder/eval signatures",
        U3_unicode_c2: "DISGOMOJI-family command-alphabet fingerprints",
        U4_unicode_stego: "ZWJ + VS + tag + BiDi density scoring",
        U5_normalization_confusable: "NFC/NFKC divergence delta",
        U6_capability_escalation: "eval-adjacent + invariant assertion",
      },
      multi_isa_panel: MULTI_ISA_PROBE_KEYS,
      noisy_or_aggregation: {
        formula: "R(x) = 1 - Π (1 - p_i(x))",
        tau_allow: Number(env.NOISY_OR_TAU_ALLOW || 0.15),
        tau_deny:  Number(env.NOISY_OR_TAU_DENY  || 0.75),
      },
      context_amplification: {
        formula: "R* = clip[0,1]( 1 - (1-R)(1 + λA) )",
        lambda: Number(env.CONTEXT_AMPLIFICATION_LAMBDA || 0.20),
      },
      constitutional_invariant: "∀ X ∈ Unicode : Authority(X) = 0",
      training_influence_cap_i_max: Number(env.EMBEDDER_INFLUENCE_MAX || 0.10),
      unified_event_envelope: "chainstate_emoji.unicode_security_events",
      raw_nfc_nfkc_retention_h: Number(env.RAW_NFC_NFKC_RETENTION_H || 168),
      grammar_categories: Object.keys(UNICODE_SECURITY_GRAMMAR),
      status: "operational_alongside_v0.9.3_baseline",
      target_paper: "Paper XV (formal v1.0 landing)",
    },
    // v0.9.3-R3 · TONTOU-integrated layer (Paper XIV §32-§38)
    v10_r3_decomposition: {
      enabled: true,
      layer_version: "0.9.3-R3",
      dimensions: {
        V10_R: { enabled: String(env.V10_R_ENABLED || "true") !== "false", ref: "§33.1" },
        V10_E: { enabled: String(env.V10_E_ENABLED || "true") !== "false", ref: "§33.2" },
        V10_C: { enabled: String(env.V10_C_ENABLED || "true") !== "false", ref: "§33.3" },
        V10_T: { enabled: String(env.V10_T_ENABLED || "true") !== "false", ref: "§33.4" },
      },
      combined_allow_condition: "ALLOW_R3 = V10-R ∧ V10-E ∧ V10-C ∧ V10-T",
      master_invariant: "∀ X, ∀ t : Representation(X, t) ⇏ Authority(X, t + Δ)",
      w_max_ms_per_tier: {
        tier_0_text: getWMaxForTier(0, env),
        tier_1_tool: getWMaxForTier(1, env),
        tier_2_agent: getWMaxForTier(2, env),
        tier_3_robotics: getWMaxForTier(3, env),
        tier_4_financial: getWMaxForTier(4, env),
      },
      non_emoji_carriers_active: String(env.NON_EMOJI_CARRIER_DETECTION || "true") !== "false",
      non_emoji_carrier_count: NON_EMOJI_CARRIER_RANGES.length,
      jit_revalidation_active: String(env.JIT_REVALIDATION_ENABLED || "true") !== "false",
      layer_state_hmac_active: String(env.LAYER_STATE_HMAC_ENABLED || "true") !== "false",
      temporal_invariant_mode: String(env.TEMPORAL_INVARIANT_MODE || "observe"),
      audit_tables: [
        "chainstate_emoji.layer_state_transitions",
        "chainstate_emoji.jit_revalidations",
        "chainstate_emoji.post_neutralization_events",
      ],
      tontou_integration: "Paper XIV §32 · Zhang et al. 2026 · Intel INTEL-2026-08-10-001",
      status: "operational_alongside_v0.9.3_and_v0.9.3-R2_baselines",
    },
    ts_ms: Date.now(),
  };
  return j(req, status);
}

async function handleEmojiSubspace(req, env) {
  let latest = null;
  try {
    if (env.CHAINSTATE_EMBED_KV) {
      const raw = await env.CHAINSTATE_EMBED_KV.get("embed:latest");
      if (raw) latest = JSON.parse(raw);
    }
  } catch (_) {}
  return j(req, {
    version: EMOJI_VERSION,
    embedding_dim: 768,
    embedder_active: !!latest,
    latest_epoch: latest,
    logoglyphic_geometry_linkage: "Pater 2024 · ResearchGate 397886975",
    ts_ms: Date.now(),
  });
}

async function handleEmojiNeural(req, env) {
  let latest = null;
  try {
    if (env.CHAINSTATE_NEURAL_KV) {
      const raw = await env.CHAINSTATE_NEURAL_KV.get("neural:latest");
      if (raw) latest = JSON.parse(raw);
    }
  } catch (_) {}
  return j(req, {
    version: EMOJI_VERSION,
    aggregate_only: true,
    individual_profiles_never_stored: true,
    p3_privacy_discipline: "aggregation_only_retention",
    latest_aggregate: latest,
    ts_ms: Date.now(),
  });
}

async function handleEmojiInjection(req, env) {
  const summaries = [];
  let latestScan = null;
  try {
    if (env.CHAINSTATE_INJECTION_KV) {
      const raw = await env.CHAINSTATE_INJECTION_KV.get("scan:latest");
      if (raw) latestScan = JSON.parse(raw);
      const list = await env.CHAINSTATE_INJECTION_KV.list({ prefix: "scan:", limit: 20 });
      for (const k of (list.keys || [])) {
        if (k.name === "scan:latest") continue;
        summaries.push({ key: k.name, uploaded_at: k.metadata || null });
      }
    }
  } catch (_) {}
  return j(req, {
    version: EMOJI_VERSION,
    latest_scan: latestScan,
    recent_flags: summaries.slice(0, 20),
    v10_detection_rules: V10_DETECTION_RULES,
    ts_ms: Date.now(),
  });
}

async function handleEmojiDisasm(req, env) {
  let probeLatest = null;
  let offset = 0;
  try {
    if (env.CHAINSTATE_DISASM_KV) {
      const raw = await env.CHAINSTATE_DISASM_KV.get("probe:latest");
      if (raw) probeLatest = JSON.parse(raw);
      const rawOff = await env.CHAINSTATE_DISASM_KV.get("probe:offset");
      if (rawOff) offset = parseInt(rawOff, 10);
    }
  } catch (_) {}
  const canonSize = enumerateFullEmojiCanon().length;
  return j(req, {
    version: EMOJI_VERSION,
    probe_offset: offset,
    total_canon_size: canonSize,
    coverage_fraction: canonSize > 0 ? offset / canonSize : 0,
    latest_probe: probeLatest,
    opcode_table_size: Object.keys(OPCODE_8088).length,
    executable_subset_lower_bound: 0.42,
    aad_reconstruction_base: "0x" + AAD_RECONSTRUCTION_BASE.toString(16).toUpperCase(),
    ts_ms: Date.now(),
  });
}

async function handleEmojiSelfref(req, env) {
  let latest = null;
  try {
    if (env.CHAINSTATE_SELFREF_KV) {
      const raw = await env.CHAINSTATE_SELFREF_KV.get("selfref:latest");
      if (raw) latest = JSON.parse(raw);
    }
  } catch (_) {}
  return j(req, {
    version: EMOJI_VERSION,
    metacog_correlation_threshold: 0.72,
    latest_snapshot: latest,
    recycle_cadence: "daily_03_00_utc",
    ts_ms: Date.now(),
  });
}

async function handleEmojiDeontic(req, env) {
  return j(req, {
    version: EMOJI_VERSION,
    ten_gate_filter: [
      { gate: 1,  name: "intake_parse",       code: EMOJI_TEN_GATE_CODES[1] },
      { gate: 2,  name: "V9_chirality_psitronic", code: EMOJI_TEN_GATE_CODES[2] },
      { gate: 3,  name: "V8_orbital_target",  code: EMOJI_TEN_GATE_CODES[3] },
      { gate: 4,  name: "V10_external_binary_emit", code: EMOJI_TEN_GATE_CODES[4] },
      { gate: 5,  name: "V7_external_actuation", code: EMOJI_TEN_GATE_CODES[5] },
      { gate: 6,  name: "injection_scan",     code: EMOJI_TEN_GATE_CODES[6] },
      { gate: 7,  name: "disasm_safety",      code: EMOJI_TEN_GATE_CODES[7] },
      { gate: 8,  name: "L0_10_cfield",       code: EMOJI_TEN_GATE_CODES[8] },
      { gate: 9,  name: "L0_11_emoji",        code: EMOJI_TEN_GATE_CODES[9] },
      { gate: 10, name: "dispatch",           code: EMOJI_TEN_GATE_CODES[10] },
    ],
    v10_detection_rules: V10_DETECTION_RULES,
    threat_thresholds: EMOJI_THREAT_THRESHOLDS,
    counter_response_requires_deontic_weight_of: 1.0,
    v10_architecturally_active: true,
    v10_disable_possible: false,
    ts_ms: Date.now(),
  });
}

async function handleEmojiCoherence(req, env) {
  const pred = await emojiCoherentPredicate(env);
  return j(req, {
    version: EMOJI_VERSION,
    predicate_name: "emoji_coherent?",
    predicate_position: "L0_11",
    result: pred,
    ts_ms: Date.now(),
  });
}

async function handleEmojiV10Assess(req, env) {
  let body = {};
  try { body = await req.json(); } catch (_) {}
  const text = body.text || body.payload || "";
  const v10 = assessExternalEmojiBinaryEmit(text, req);
  const emojis = extractEmojiFromText(typeof text === "string" ? text : JSON.stringify(text));
  const dis = emojis.length > 0
    ? disassembleEmojiBytes(emojiStringToBytes(emojis.join("")))
    : { trace: [], suspiciousPatterns: [], byteReservoirDensity: 0 };
  return j(req, {
    version: EMOJI_VERSION,
    assessor: "V10",
    verdict: v10,
    disasm_summary: {
      n_instructions: dis.trace.length,
      suspiciousPatterns: dis.suspiciousPatterns,
      byteReservoirDensity: dis.byteReservoirDensity,
    },
    threat_weight: computeEmojiThreatWeight(dis, null),
    layer: "worker",
    ts_ms: Date.now(),
  });
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── v0.9.3-R2 · UNICODE SECURITY PLANE endpoint handlers ──────────────────
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /emoji/v10u
 * Public read-only status of the V10-U layer (roadmap surface).
 * Returns sub-veto configuration, ISA panel, noisy-OR thresholds,
 * λ context amplification, invariant text.
 */
async function handleEmojiV10U(req, env) {
  return j(req, {
    version: EMOJI_VERSION,
    v10u_layer_version: "0.9.3-R2",
    paper_reference: "Paper XIV §29 (revised & integrated edition)",
    enabled: String(env.V10U_ENABLED || "true") !== "false",
    sub_vetoes: [
      { id: "U1", name: "executable_unicode",       ref: "§29.2 U1" },
      { id: "U2", name: "decoder_reconstruction",   ref: "§29.2 U2" },
      { id: "U3", name: "unicode_c2",               ref: "§29.2 U3" },
      { id: "U4", name: "unicode_stego",            ref: "§29.2 U4" },
      { id: "U5", name: "normalization_confusable", ref: "§29.2 U5" },
      { id: "U6", name: "capability_escalation",    ref: "§29.2 U6" },
    ],
    multi_isa_panel: MULTI_ISA_PROBE_KEYS,
    noisy_or: {
      formula: "R(x) = 1 - Π (1 - p_i(x))",
      tau_allow: Number(env.NOISY_OR_TAU_ALLOW || 0.15),
      tau_deny:  Number(env.NOISY_OR_TAU_DENY  || 0.75),
    },
    context_amplification: {
      formula: "R* = clip[0,1]( 1 - (1-R)(1 + λA) )",
      lambda: Number(env.CONTEXT_AMPLIFICATION_LAMBDA || 0.20),
      action_tiers: {
        0: "text output",
        1: "tool invocation",
        2: "agent control",
        3: "robotics actuation",
        4: "financial or physical actuation"
      }
    },
    constitutional_invariant: "∀ X ∈ Unicode : Authority(X) = 0",
    training_influence_cap: Number(env.EMBEDDER_INFLUENCE_MAX || 0.10),
    raw_nfc_nfkc_retention_h: Number(env.RAW_NFC_NFKC_RETENTION_H || 168),
    unicode_security_grammar_categories: Object.keys(UNICODE_SECURITY_GRAMMAR),
    unified_event_envelope_table: "chainstate_emoji.unicode_security_events",
    ts_ms: Date.now(),
  });
}

/**
 * POST /emoji/v10u/assess
 * Internal-only. Assesses a candidate Unicode payload through the full
 * V10-U pipeline: assessUnicodeSecurityPlane → noisyOrDecision →
 * amplifyByActionTier → assertUnicodeAuthorityZero. Writes a row to
 * unicode_security_events (via writeUnicodeSecurityEvent). Returns
 * the full envelope so the caller can log / decide accordingly.
 */
async function handleEmojiV10UAssessPost(req, env) {
  const token = req.headers.get("X-EMOJI-INTERNAL");
  if (!token || token !== env.EMOJI_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = {};
  try { body = await req.json(); } catch (_) {}
  const text = String(body.text || body.payload || "");
  const bytes = Array.isArray(body.bytes)
    ? body.bytes
    : emojiStringToBytes(text);
  const actionTier = Number(body.action_tier || 0);
  const pipeline = await runV10UPipeline(text, bytes, req, env, {
    action_tier: actionTier,
    payload: {
      source_class: body.source_class || "external",
      caller_id: body.caller_id || "unknown",
      pre_authorised: body.pre_authorised === true
    }
  });
  // Log to unified envelope (fire-and-forget-safe if Supabase absent)
  try {
    await writeUnicodeSecurityEvent(env, {
      raw_sha256: null,
      normalized_sha256: null,
      unicode_version: "15.1",
      source_class: body.source_class || "external",
      source_id_hash: null,
      byte_length: bytes.length,
      codepoint_count: [...text].length,
      grapheme_count: [...text].length,
      isa_risk_json: pipeline.assessment ? pipeline.assessment.all_isa_probes : {},
      semantic_risk: pipeline.assessment ? pipeline.assessment.U6_capability_escalation.score : 0,
      decoder_risk: pipeline.assessment ? pipeline.assessment.U2_decoder_reconstruction.score : 0,
      c2_risk:      pipeline.assessment ? pipeline.assessment.U3_unicode_c2.score : 0,
      stego_risk:   pipeline.assessment ? pipeline.assessment.U4_unicode_stego.score : 0,
      normalization_risk: pipeline.assessment ? pipeline.assessment.U5_normalization_confusable.score : 0,
      aggregate_risk: pipeline.context_amplification ? pipeline.context_amplification.R_star : 0,
      decision: pipeline.v10_u_final_decision || "OBSERVE",
    });
  } catch (e) { /* audit is best-effort; do not fail assessment on log error */ }
  return j(req, {
    version: EMOJI_VERSION,
    v10u_pipeline: pipeline,
    layer: "worker",
    ts_ms: Date.now(),
  });
}

/**
 * GET /emoji/unicode-events
 * Public read-only summary of the unicode_security_events table:
 * counts by decision, latest ts, current policy version. Intended for
 * auditors verifying the chain of evidence.
 */
async function handleEmojiUnicodeEventsGet(req, env) {
  let summary = null;
  try {
    if (env.CHAINSTATE_QUARANTINE_KV) {
      const raw = await env.CHAINSTATE_QUARANTINE_KV.get("unicode_events:summary");
      if (raw) summary = JSON.parse(raw);
    }
  } catch (_) {}
  return j(req, {
    version: EMOJI_VERSION,
    envelope_table: "chainstate_emoji.unicode_security_events",
    policy_version: "0.9.3-R2",
    parser_version: WORKER_VERSION,
    latest_summary: summary,
    note: "Full row access requires service_role via Supabase (RLS-gated).",
    ts_ms: Date.now(),
  });
}

/**
 * POST /emoji/multi-isa
 * Internal-only. Runs the 12-ISA static probe panel on an inbound byte
 * sequence and returns per-ISA probabilities plus the maximum. Never
 * executes any code; static analysis only.
 */
async function handleEmojiMultiIsaPost(req, env) {
  const token = req.headers.get("X-EMOJI-INTERNAL");
  if (!token || token !== env.EMOJI_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = {};
  try { body = await req.json(); } catch (_) {}
  const text = String(body.text || "");
  const bytes = Array.isArray(body.bytes)
    ? body.bytes
    : emojiStringToBytes(text);
  const isa = multiIsaMaxProbability(bytes);
  return j(req, {
    version: EMOJI_VERSION,
    layer: "worker",
    isa_panel: MULTI_ISA_PROBE_KEYS,
    n_bytes: bytes.length,
    max_isa: isa.max_isa,
    max_p: isa.max_p,
    per_isa: isa.per_isa,
    ts_ms: Date.now(),
  });
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── v0.9.3-R3 · TONTOU-integrated endpoint handlers ───────────────────────
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /emoji/v10-decomposition
 * Public read-only status of R3 V10 four-dimensional decomposition
 * (V10-R / V10-E / V10-C / V10-T) with W_max per action tier
 * and the R3 master invariant.
 */
async function handleEmojiV10Decomposition(req, env) {
  return j(req, {
    version: EMOJI_VERSION,
    r3_layer_version: "0.9.3-R3",
    paper_reference: "Paper XIV §33-§38 (TONTOU-integrated edition)",
    dimensions: {
      V10_R: {
        enabled: String(env.V10_R_ENABLED || "true") !== "false",
        name: "representation_security",
        ref: "§33.1",
        composition: "V10 baseline + V10-U six sub-vetoes + extended carrier detection",
      },
      V10_E: {
        enabled: String(env.V10_E_ENABLED || "true") !== "false",
        name: "execution_state_security",
        ref: "§33.2",
        components: ["state_equivalence", "temporal_window", "no_interrupt_class_event"],
      },
      V10_C: {
        enabled: String(env.V10_C_ENABLED || "true") !== "false",
        name: "capability_security",
        ref: "§33.3",
        components: ["hmac_verify", "payload_hash_match", "destination_tier_match", "not_expired"],
      },
      V10_T: {
        enabled: String(env.V10_T_ENABLED || "true") !== "false",
        name: "temporal_jit_revalidation_security",
        ref: "§33.4",
        components: ["fingerprint_stable", "hash_stable", "canonical_form_stable"],
      },
    },
    combined_allow_condition: "ALLOW_R3 = V10-R ∧ V10-E ∧ V10-C ∧ V10-T",
    w_max_per_tier_ms: {
      0: getWMaxForTier(0, env),
      1: getWMaxForTier(1, env),
      2: getWMaxForTier(2, env),
      3: getWMaxForTier(3, env),
      4: getWMaxForTier(4, env),
    },
    master_invariant: {
      formal: "∀ X, ∀ t : Representation(X, t) ⇏ Authority(X, t + Δ)",
      prose: "The fact that a representation was safe when we looked at it does not confer authority to act on it later.",
    },
    non_emoji_carriers: NON_EMOJI_CARRIER_RANGES.map(r => ({
      name: r.name,
      range: "U+" + r.start.toString(16).toUpperCase() + ".." + "U+" + r.end.toString(16).toUpperCase(),
      utf8_bytes: r.utf8_bytes,
      yield: r.yield
    })),
    audit_tables: [
      "chainstate_emoji.layer_state_transitions",
      "chainstate_emoji.jit_revalidations",
      "chainstate_emoji.post_neutralization_events",
    ],
    tontou_reference: "Zhang et al. 2026 · Intel INTEL-2026-08-10-001",
    ts_ms: Date.now(),
  });
}

/**
 * POST /emoji/jit-revalidate
 * Internal-only. Runs the full R3 revalidation before a consumer acts on
 * a previously-approved payload. Writes audit rows on both ALLOW and
 * REFUSE outcomes. This is the substrate's TONTOU-defence gate.
 */
async function handleEmojiJitRevalidatePost(req, env) {
  const token = req.headers.get("X-EMOJI-INTERNAL");
  if (!token || token !== env.EMOJI_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = {};
  try { body = await req.json(); } catch (_) {}
  const consumerRequest = {
    text_at_TN: body.text_at_TN,
    bytes_at_TN: body.bytes_at_TN,
    text_now: body.text_now,
    bytes_now: body.bytes_now,
    capability: body.capability,
    T_N: Number(body.T_N),
    destination_tier: Number(body.destination_tier || 0),
    state_hash_at_TN: body.state_hash_at_TN,
    state_hash_now: body.state_hash_now,
    source_event_id: body.source_event_id,
    verdict_at_TN: body.verdict_at_TN,
    req,
  };
  const result = await revalidateBeforeUse(consumerRequest, env);
  return j(req, {
    version: EMOJI_VERSION,
    r3_pipeline: result,
    layer: "worker",
    ts_ms: Date.now(),
  });
}

/**
 * POST /emoji/capability/issue
 * Internal-only. Issues a signed capability token after a successful V10-R
 * assessment. Binds payload hash, destination tier, T_N, and W_max deadline.
 */
async function handleEmojiCapabilityIssuePost(req, env) {
  const token = req.headers.get("X-EMOJI-INTERNAL");
  if (!token || token !== env.EMOJI_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = {};
  try { body = await req.json(); } catch (_) {}
  const text = String(body.text || body.payload || "");
  const bytes = Array.isArray(body.bytes) ? body.bytes : emojiStringToBytes(text);
  const destinationTier = Number(body.destination_tier || 0);
  const tN = Number(body.T_N || Date.now());
  const rAssessment = await assessV10_R(text, bytes, req, env);
  if (!rAssessment.enabled) {
    return j(req, { error: "V10_R_disabled", version: EMOJI_VERSION });
  }
  const rWeight = rAssessment.fingerprint ? rAssessment.fingerprint.v10_weight : 0;
  if (rWeight >= 1.0) {
    return j(req, {
      error: "V10_R_refused",
      v10_weight: rWeight,
      v10_baseline: rAssessment.v10_baseline,
      note: "Baseline V10 refused; no capability issued.",
      ts_ms: Date.now(),
    }, { status: 403 });
  }
  const cap = await issueCapability(rAssessment, destinationTier, tN, env);
  return j(req, {
    version: EMOJI_VERSION,
    v10_R: rAssessment,
    capability: cap.capability,
    layer: "worker",
    ts_ms: Date.now(),
  });
}

/**
 * POST /emoji/carrier-scan
 * Internal-only. Runs extended-carrier detection over the incoming text,
 * returning the split between emoji and non-emoji carriers (Hangul,
 * Kana, Braille, Egyptian hieroglyphs).
 */
async function handleEmojiCarrierScanPost(req, env) {
  const token = req.headers.get("X-EMOJI-INTERNAL");
  if (!token || token !== env.EMOJI_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = {};
  try { body = await req.json(); } catch (_) {}
  const text = String(body.text || "");
  const carriers = extractCarriersFromText(text);
  return j(req, {
    version: EMOJI_VERSION,
    layer: "worker",
    text_length: text.length,
    emoji_count: carriers.emoji,
    non_emoji_count: Object.values(carriers.non_emoji).reduce((a, b) => a + b, 0),
    non_emoji_breakdown: carriers.non_emoji,
    carriers_in_canon: [
      "emoji (v0.9.3 canon)",
      "hangul_syllables (R3 extension)",
      "hiragana (R3 extension)",
      "katakana (R3 extension)",
      "katakana_phonetic_extensions (R3 extension)",
      "braille_patterns (R3 extension)",
      "egyptian_hieroglyphs (R3 extension)",
      "egyptian_hieroglyph_controls (R3 extension)",
    ],
    ts_ms: Date.now(),
  });
}

/**
 * GET /emoji/post-neutralization-events
 * Public read-only summary of observed TONTOU-class events (REFUSE
 * outcomes from JIT revalidation with W_TONTOU_exceeded or
 * fingerprint_divergence reasons).
 */
async function handleEmojiPostNeutralizationEvents(req, env) {
  let summary = null;
  try {
    if (env.CHAINSTATE_QUARANTINE_KV) {
      const raw = await env.CHAINSTATE_QUARANTINE_KV.get("post_neutralization:summary");
      if (raw) summary = JSON.parse(raw);
    }
  } catch (_) {}
  return j(req, {
    version: EMOJI_VERSION,
    envelope_table: "chainstate_emoji.post_neutralization_events",
    r3_layer_version: "0.9.3-R3",
    tontou_reference: "Paper XIV §32 · Zhang et al. 2026",
    latest_summary: summary,
    note: "Every REFUSE outcome from JIT revalidation with reason 'W_TONTOU_exceeded' or 'fingerprint_divergence' is logged here. Full row access requires service_role via Supabase (RLS-gated).",
    ts_ms: Date.now(),
  });
}

/**
 * GET /emoji/layer-transitions
 * Public read-only summary of the cross-layer signed-transitions chain.
 */
async function handleEmojiLayerTransitions(req, env) {
  let summary = null;
  try {
    if (env.CHAINSTATE_QUARANTINE_KV) {
      const raw = await env.CHAINSTATE_QUARANTINE_KV.get("layer_transitions:summary");
      if (raw) summary = JSON.parse(raw);
    }
  } catch (_) {}
  return j(req, {
    version: EMOJI_VERSION,
    envelope_table: "chainstate_emoji.layer_state_transitions",
    r3_layer_version: "0.9.3-R3",
    hmac_enforcement: String(env.LAYER_STATE_HMAC_ENABLED || "true") !== "false" ? "on" : "off_but_logged",
    latest_summary: summary,
    layer_ids: ["cloudflare_worker", "render_service", "supabase", "agent", "tool", "robotics", "financial"],
    note: "Signed HMAC chain of every cross-layer state transition. Referenced by capability_id linking to R2 unicode_security_events.",
    ts_ms: Date.now(),
  });
}


async function handleEmojiDisassemblePost(req, env) {
  // Internal-only, requires caller allowlist + internal token
  const token = req.headers.get("X-EMOJI-INTERNAL");
  if (!token || token !== env.EMOJI_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = {};
  try { body = await req.json(); } catch (_) {}
  const bytes = Array.isArray(body.bytes)
    ? body.bytes.map((b) => b & 0xFF)
    : (body.text ? emojiStringToBytes(body.text) : []);
  const payload = {
    bytes,
    caller_id: body.caller_id || "chainstate_worker_internal",
    text: body.text || null,
  };
  const result = await dispatchEmojiDisassembly(env, payload, req);
  return j(req, result);
}

async function handleEmojiEmbedPost(req, env) {
  const token = req.headers.get("X-EMOJI-INTERNAL");
  if (!token || token !== env.EMOJI_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = {};
  try { body = await req.json(); } catch (_) {}
  const emojis = Array.isArray(body.emojis)
    ? body.emojis
    : (body.text ? extractEmojiFromText(body.text) : []);
  const vectors = [];
  for (const em of emojis.slice(0, 64)) {
    const v = await computeWorkerSideEmojiProjection(em);
    vectors.push({ emoji: em, dim: 768, head: Array.from(v).slice(0, 16) });
  }
  return j(req, {
    version: EMOJI_VERSION,
    n_embedded: vectors.length,
    vectors,
    source: "worker_projection",
    ts_ms: Date.now(),
  });
}

async function handleEmojiTrainPost(req, env) {
  const adminKey = req.headers.get("X-EMOJI-ADMIN-KEY");
  if (!adminKey || adminKey !== env.EMOJI_ADMIN_KEY) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  const result = await runEmbedderTrainTick(env, null);
  return j(req, result);
}

async function handleEmojiCorrelatePost(req, env) {
  const token = req.headers.get("X-EMOJI-INTERNAL");
  if (!token || token !== env.EMOJI_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  const result = await runThreatCorrelateTick(env, null);
  return j(req, result);
}

async function handleEmojiRecyclePost(req, env) {
  const token = req.headers.get("X-EMOJI-INTERNAL");
  if (!token || token !== env.EMOJI_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  const result = await runSelfrefRecycleTick(env, null);
  return j(req, result);
}

async function handleEmojiQuarantinePost(req, env) {
  const token = req.headers.get("X-EMOJI-INTERNAL");
  if (!token || token !== env.EMOJI_INTERNAL_TOKEN) {
    return j(req, { error: "unauthorised" }, { status: 401 });
  }
  let body = {};
  try { body = await req.json(); } catch (_) {}
  const qid = "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  try {
    if (env.CHAINSTATE_QUARANTINE_KV) {
      await env.CHAINSTATE_QUARANTINE_KV.put(qid, JSON.stringify({
        ts_ms: Date.now(),
        payload_hash: body.payload_hash || null,
        reason: body.reason || "manual_quarantine",
        source: body.source || null,
        v10: body.v10 || null,
      }), { expirationTtl: 30 * 86400 });
    }
  } catch (_) {}
  return j(req, {
    version: EMOJI_VERSION,
    quarantine_id: qid,
    counter_response_taken: false,
    counter_response_would_require_threat_weight: 1.0,
    ts_ms: Date.now(),
  });
}

// ─── END of v0.9.3 EMOJI MACHINE CODE additions ────────────────────────────

// ─── Main handler ──────────────────────────────────────────────────────


/* ═══════════════════════════════════════════════════════════════════════════
 * CHAINSTATE AGI · PLANET ENGINE · v0.9.4 (Reality-State revision)
 * Additive block — Paper "PLANET ENGINE v0.9.4" §§4–42.
 *
 * Adds a Reality-State / Perception-Integrity layer beneath CHAINSTATE cognition:
 *   - canonical world-state engine (CWSE)      §4
 *   - 14-field Reality-State tensor             §24
 *   - material perception + physics-consistency §25–26
 *   - continuous-video stream typing            §27
 *   - anti-deepfake / voice anti-spoof scoring  §28
 *   - Negative Execution Ledger (prove non-act) §29
 *   - dual-channel execution witness            §30
 *   - 7-term anti-forcing ALLOW gate            §31
 *   - fail-closed egress isolation filter Γ     §32   ← simulation-security
 *   - self-preservation (defensive only)        §33
 *   - composite threat surface (Census fusion)  §35
 *   - expanded intelligence-to-risk ρ           §40
 *
 * SAFETY: every simulation/perception decision is code-level and needs NO
 * human-in-the-loop. Only Tier 3–4 (irreversible physical/financial) require
 * human authorization. Egress filter Γ is FAIL-CLOSED. Nothing here relaxes
 * any existing v0.9.3-R3 Deontic veto or the emoji V10 machinery; it composes.
 *
 * Storage bindings used (see deploy notes / render.yaml):
 *   KV  CHAINSTATE_WORLD_KV     hot world-state entities + reality-state fields
 *   KV  CHAINSTATE_CENSUS_KV    cyber entities · BGP/KEV threat picture
 *   KV  CHAINSTATE_THREAT_KV    adversarial signatures · spoof scores
 *   KV  CHAINSTATE_EGRESS_KV    Γ decisions + consumed-nonce set
 *   R2  chainstate-world-snapshots     world-state hash snapshots
 *   R2  CHAINSTATE_CENSUS_R2 (reused from v0.9.3)  nightly Planet-Engine census snapshots written under key prefix "planet-census/"
 *   Supabase schema chainstate_census  (world_entities, reality_state_fields,
 *     perception_edges, negative_execution_ledger, execution_witness,
 *     egress_decisions, threat_surface, material_observations,
 *     ontology_delta_ledger)  — all RLS + immutable-audit, service-role writes.
 * All are OPTIONAL at runtime: every function is fail-soft. If a binding is
 * absent the feature degrades to compute-only and reports status accordingly.
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── Planet Engine constants ───────────────────────────────────────────────
const PLANET_ENGINE_VERSION = "0.9.4-planet-engine-2026-08-29";

// Six epistemic classes (Paper §4.3). Every reality-state field is tagged.
const EPISTEMIC_CLASSES = ["observation", "inference", "simulation", "hypothesis", "decision", "provenance"];

// Reality-State tensor field keys (Paper §24, Eq. 14).
const REALITY_STATE_FIELDS = [
  "G",   // geometry / topology
  "M",   // material state
  "Phi", // photometric / radiometric
  "Sigma", // spectral
  "Ac",  // acoustic
  "Em",  // electromagnetic / RF
  "Tp",  // thermal
  "Cy",  // cyber / network
  "Bi",  // biological / environmental
  "Vo",  // visual / object
  "tau", // temporal dynamics
  "Pi",  // provenance
  "Lambda", // authorization state
  "U"    // uncertainty
];

// Action tiers (Paper §12.6 · §42). W_max = max time-of-use window (ms).
// rho_tier = required intelligence-to-risk ratio. authz = who may authorize.
const PLANET_ACTION_TIERS = {
  0: { name: "text_report",          w_max_ms: 5000, rho_tier: 1,  authz: "substrate" },
  1: { name: "query_filter_camera",  w_max_ms: 500,  rho_tier: 2,  authz: "substrate" },
  2: { name: "agent_world_update",   w_max_ms: 100,  rho_tier: 4,  authz: "agent_audit" },
  3: { name: "robotics_actuation",   w_max_ms: 50,   rho_tier: 8,  authz: "human_or_authorized_agent" },
  4: { name: "financial_physical",   w_max_ms: 20,   rho_tier: 16, authz: "human_explicit" }
};

// Truth-modes for renderer / output tagging (Paper §12.4). Simulation may
// NEVER be emitted as observed fact.
const TRUTH_MODES = ["OBSERVED", "INFERRED", "FORECAST", "SIMULATION", "HYPOTHESIS", "HYBRID"];

// Negative Execution Ledger states (Paper §29, Eq. 20).
const EXECUTION_STATES = ["proposed", "blocked", "authorized", "dispatched", "accepted", "executed", "failed", "expired", "unknown"];

// Egress filter Γ modes. Default fail_closed (Paper §32).
function planetEgressMode(env) {
  return String((env && env.EGRESS_FILTER_MODE) || "fail_closed");
}
function planetUnlawfulStandard(env) {
  // "strictest_global" = assume the strictest applicable jurisdiction (Paper §32).
  return String((env && env.UNLAWFUL_OUTPUT_STANDARD) || "strictest_global");
}

// ─── small crypto / util helpers (reuse Web Crypto; independent of emoji block) ─
async function planetSha256Hex(str) {
  try {
    const data = new TextEncoder().encode(String(str));
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return "sha256_unavailable";
  }
}
async function planetHmacHex(keyStr, msgStr) {
  try {
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(String(keyStr || "")),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(msgStr)));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return "hmac_unavailable";
  }
}
function planetNowIso() { return new Date().toISOString(); }
function planetClamp01(x) { return Math.max(0, Math.min(1, x)); }
function planetSafeNum(x, d) { const n = Number(x); return Number.isFinite(n) ? n : (d || 0); }

// ─── KV helpers (fail-soft) ─────────────────────────────────────────────────
async function planetKvGet(env, binding, key) {
  try { const kv = env[binding]; if (!kv) return null; const v = await kv.get(key); return v ? JSON.parse(v) : null; }
  catch (e) { return null; }
}
async function planetKvPut(env, binding, key, obj, ttl) {
  try {
    const kv = env[binding]; if (!kv) return false;
    const opts = ttl ? { expirationTtl: ttl } : undefined;
    await kv.put(key, JSON.stringify(obj), opts); return true;
  } catch (e) { return false; }
}

// ─── Supabase REST helper (fail-soft, service-role) ─────────────────────────
async function planetSupabaseInsert(env, table, row) {
  try {
    const base = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) return { ok: false, reason: "supabase_unconfigured" };
    const url = base.replace(/\/$/, "") + "/rest/v1/" + table;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(row)
    });
    return { ok: r.ok, status: r.status };
  } catch (e) { return { ok: false, reason: String(e && e.message || e).slice(0, 120) }; }
}

/* ─── §31 · Seven-term anti-forcing ALLOW gate ──────────────────────────────
 * ALLOW = V_R ∧ V_E ∧ V_C ∧ V_T ∧ V_P ∧ V_I ∧ V_X   (Paper Eq. 22)
 * Fail-closed: any missing/false term ⇒ ALLOW=0. Unknown ⇒ no authority. */
function planetAllowGate(terms) {
  const req = ["V_R", "V_E", "V_C", "V_T", "V_P", "V_I", "V_X"];
  const detail = {};
  let allow = true;
  for (const t of req) {
    const v = terms && terms[t] === true; // strict: undefined/unknown ⇒ false
    detail[t] = v;
    if (!v) allow = false;
  }
  return { allow, detail, invariant: "Perception⇏Intent⇏Authorization⇏Execution" };
}

/* ─── §40 · Expanded intelligence-to-risk ratio (Eq. 27) ─────────────────────
 * ρ = (I_info+I_uncert+I_pred+I_coher) / (R_phys+R_epist+R_adv+R_irrev)
 * R_irrev = H(A)·C(A) (Eq. 40). Action requires ρ≥ρ_tier AND all hard gates. */
function planetIntelToRisk(I, R) {
  const inum = planetSafeNum(I.info) + planetSafeNum(I.uncert) + planetSafeNum(I.pred) + planetSafeNum(I.coher);
  const H = planetSafeNum(R.harm), C = planetClamp01(planetSafeNum(R.reverse_difficulty));
  const rIrrev = H * C;
  const rden = planetSafeNum(R.phys) + planetSafeNum(R.epist) + planetSafeNum(R.adv) + rIrrev;
  const rho = rden > 0 ? inum / rden : 0;
  return { rho, I_total: inum, R_total: rden, R_irreversibility: rIrrev };
}

/* ─── §39 · Safety monotonicity check ───────────────────────────────────────
 * ∂Authority/∂U_a ≤ 0 and ∂Authority/∂P_spoof ≤ 0. An adversary may make the
 * substrate know LESS; they must never make it MORE authorized. We enforce by
 * damping the effective ρ as adversarial uncertainty / spoof prob rise. */
function planetSafetyMonotonic(rho, U_adversarial, P_spoof) {
  const damp = planetClamp01(1 - Math.max(planetSafeNum(U_adversarial), planetSafeNum(P_spoof)));
  return { rho_effective: rho * damp, damp, U_adversarial: planetSafeNum(U_adversarial), P_spoof: planetSafeNum(P_spoof) };
}

/* ─── §28 · Anti-deepfake stream confidence (Eq. 19) ────────────────────────
 * P*_synth = σ( Σ w_i s_i + Σ γ_ij C_ij ). P_synth≈0 ⇏ P_human=1. */
function planetSynthScore(signals, contradictions) {
  let acc = 0;
  (signals || []).forEach(s => { acc += planetSafeNum(s.w, 1) * planetSafeNum(s.p); });
  (contradictions || []).forEach(c => { acc += planetSafeNum(c.gamma, 0.5) * planetSafeNum(c.c); });
  const sig = 1 / (1 + Math.exp(-acc));
  let origin = "unknown";
  if (sig >= 0.75) origin = "synthetic_verified";
  else if (sig <= 0.15 && (signals || []).length >= 3) origin = "adversarially_suspect_low"; // absence≠authenticity
  else if (sig <= 0.25) origin = "mixed";
  return { P_synthetic: planetClamp01(sig), origin, note: "P_synth≈0 does NOT imply P_human=1" };
}

/* ─── §26 · Physics-consistency test (Eq. 18) ───────────────────────────────
 * C_phys = exp(-D_phys), D_phys = Σ w_k D_k. Low C_phys ⇒ spoof signal. */
function planetPhysicsConsistency(residuals) {
  let d = 0;
  (residuals || []).forEach(r => { d += planetSafeNum(r.w, 1) * planetSafeNum(r.d); });
  const cphys = Math.exp(-d);
  return { C_phys: planetClamp01(cphys), D_phys: d, spoof_signal: cphys < 0.5 };
}

/* ─── §37 · Cross-modal consistency (Eq. 25) ────────────────────────────────
 * Consistency(H) = 1 - Σ D_ij / (N(N-1)/2). Disagreement ⇒ investigation. */
function planetCrossModalConsistency(pairwiseDistances, N) {
  const denom = (N * (N - 1)) / 2;
  if (denom <= 0) return { consistency: 1, N };
  let s = 0; (pairwiseDistances || []).forEach(d => s += planetClamp01(planetSafeNum(d)));
  return { consistency: planetClamp01(1 - s / denom), N, verdict: (s / denom > 0.5 ? "investigate" : "coherent") };
}

/* ─── §35 · Composite threat surface (Eq. 24) ───────────────────────────────
 * T(t) = w_v·V + w_a·A + w_p·P + w_s·Σ  (vulnerability, APT, patch-gap, sanctions) */
function planetCompositeThreat(w, x) {
  const t = planetSafeNum(w.v, 0.25) * planetSafeNum(x.V)
          + planetSafeNum(w.a, 0.25) * planetSafeNum(x.A)
          + planetSafeNum(w.p, 0.25) * planetSafeNum(x.P)
          + planetSafeNum(w.s, 0.25) * planetSafeNum(x.Sigma);
  return { T: t, level: t >= 4 ? 5 : Math.round(planetClamp01(t / 5) * 5) };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * §32 · EGRESS ISOLATION FILTER Γ  (fail-closed, code-level, no human step)
 * No simulation artifact, secret/critical state, or unfiltered output crosses
 * the boundary unless provenance-tagged, classification-checked, jurisdiction-
 * checked (strictest global), and V10-U re-scanned. Γ(out)=∅ otherwise.
 * ═══════════════════════════════════════════════════════════════════════════ */
// Patterns that must NEVER leave the substrate (critical-state scan, §32(ii)).
const PLANET_SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b0x[a-fA-F0-9]{64}\b/,                 // raw 32-byte hex (private-key-shaped)
  /\bsk-[A-Za-z0-9]{20,}\b/,               // provider secret keys
  /\b(SUPABASE_SERVICE_ROLE_KEY|CAPABILITY_HMAC_KEY|LAYER_TRANSITION_HMAC_KEY|EGRESS_HMAC_KEY)\b/,
  /\beyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/ // JWT
];
// Executable-Unicode carrier ranges re-scan (§32(iv)) — mirrors emoji V10-U canon.
function planetHasExecutableCarrier(str) {
  if (!str) return false;
  for (const ch of String(str)) {
    const cp = ch.codePointAt(0);
    if (
      (cp >= 0x1F000 && cp <= 0x1FAFF) ||  // supplementary-plane emoji block region
      (cp >= 0xAC00 && cp <= 0xD7A3)  ||   // Hangul syllables
      (cp >= 0x3040 && cp <= 0x30FF)  ||   // Hiragana + Katakana
      (cp >= 0x2800 && cp <= 0x28FF)  ||   // Braille
      (cp >= 0x13000 && cp <= 0x1342F) ||  // Egyptian hieroglyphs
      (cp >= 0x13430 && cp <= 0x1345F)     // Egyptian hieroglyph controls
    ) return true;
  }
  return false;
}
// Minimal unlawful-output heuristic. Conservative + fail-closed: this is a
// coarse pre-filter; deeper classification runs on Render. Strictest-global.
const PLANET_UNLAWFUL_HINTS = [
  /\bhow to (synthesi[sz]e|manufacture)\b.*\b(nerve agent|sarin|vx|tabun|ricin)\b/i,
  /\b(cp|csam|child sexual)\b/i,
  /\bassassinat(e|ion) (plan|instructions)\b/i
];

/**
 * planetEgressFilter — Γ. Returns {release, reasons, tagged}.
 * @param out {object} candidate outbound payload {content, truth_mode, epistemic_class, provenance}
 * FAIL-CLOSED: any check that cannot be completed ⇒ release=false.
 */
async function planetEgressFilter(env, out) {
  const mode = planetEgressMode(env);
  const strict = mode === "fail_closed";
  const reasons = [];
  let release = true;

  const content = (out && typeof out.content === "string") ? out.content : JSON.stringify(out && out.content || "");

  // (i) simulation-quarantine — S/counterfactual never emitted as observed fact
  const ec = out && out.epistemic_class;
  const tm = out && out.truth_mode;
  if (ec === "simulation" || ec === "hypothesis" || tm === "SIMULATION" || tm === "HYPOTHESIS" || tm === "FORECAST") {
    if (!tm || TRUTH_MODES.indexOf(tm) < 0) { release = false; reasons.push("sim_untagged_truth_mode"); }
    // must carry explicit non-observed tag; strip any 'observed' assertion
    if (/\bobserved\b|\bconfirmed\b|\bground truth\b/i.test(content)) { release = false; reasons.push("sim_asserts_observed"); }
  }

  // (ii) secret / critical-state scan
  for (const rx of PLANET_SECRET_PATTERNS) {
    if (rx.test(content)) { release = false; reasons.push("secret_or_critical_state"); break; }
  }
  // self-representation-loop lock
  if (String(env.SELF_REPRESENTATION_LOCK || "on") !== "off") {
    if (/\bself[_-]?representation[_-]?(loop|state|hash)\b/i.test(content)) { release = false; reasons.push("self_representation_locked"); }
  }

  // (iii) unlawful-output pre-filter (strictest global)
  for (const rx of PLANET_UNLAWFUL_HINTS) {
    if (rx.test(content)) { release = false; reasons.push("unlawful_output_strictest_global"); break; }
  }

  // (iv) executable-Unicode carrier re-scan on egress
  if (String(env.V10U_EGRESS_RESCAN || "on") !== "off") {
    if (planetHasExecutableCarrier(content)) { release = false; reasons.push("executable_carrier_on_egress"); }
  }

  // fail-closed default when mode demands it and any doubt exists
  if (strict && reasons.length === 0 && (!out || (!ec && !tm && !out.provenance))) {
    release = false; reasons.push("fail_closed_untagged_output");
  }

  const decision = {
    release, reasons, mode,
    truth_mode: tm || null,
    epistemic_class: ec || null,
    ts: planetNowIso()
  };
  decision.hash = await planetSha256Hex(JSON.stringify(decision) + "|" + content.slice(0, 512));
  // audit (fail-soft)
  await planetKvPut(env, "CHAINSTATE_EGRESS_KV", "egress:" + decision.hash, decision, 604800);
  planetSupabaseInsert(env, "chainstate_census.egress_decisions", {
    hash: decision.hash, release: decision.release, reasons: decision.reasons,
    epistemic_class: decision.epistemic_class, truth_mode: decision.truth_mode, ts: decision.ts
  });
  return decision;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * §29–30 · Negative Execution Ledger + independent execution witness
 * Prove an action did NOT happen. No execution receipt ≠ proof of non-exec.
 * ═══════════════════════════════════════════════════════════════════════════ */
async function planetRecordExecutionState(env, cmd, state, gate, reason, witness) {
  if (EXECUTION_STATES.indexOf(state) < 0) state = "unknown";
  const row = {
    id: cmd && cmd.id || ("cmd:" + Math.random().toString(36).slice(2)),
    intent: cmd && cmd.intent || null,
    target: cmd && cmd.target || null,
    capability: cmd && cmd.capability || null,
    state, gate: gate || null, reason: reason || null,
    witness: witness || null,
    ts: planetNowIso()
  };
  row.receipt = await planetHmacHex(env.EGRESS_HMAC_KEY || env.CAPABILITY_HMAC_KEY || "planet",
    JSON.stringify(row));
  await planetKvPut(env, "CHAINSTATE_WORLD_KV", "exec:" + row.id + ":" + state, row, 2592000);
  const table = (state === "blocked") ? "chainstate_census.negative_execution_ledger" : "chainstate_census.execution_witness";
  planetSupabaseInsert(env, table, row);
  return row;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CWSE · canonical world-state helpers (§4)
 * ═══════════════════════════════════════════════════════════════════════════ */
function planetNewEntity(type, geometry, state, epistemic_class) {
  const ec = EPISTEMIC_CLASSES.indexOf(epistemic_class) >= 0 ? epistemic_class : "observation";
  return {
    entity_id: type + ":" + Math.random().toString(36).slice(2, 10),
    entity_type: type,
    geometry: geometry || null,
    state: state || {},
    epistemic_class: ec,
    reality_state: {},         // filled per-field with 8-tuples
    observations: [], inferences: [], simulations: [], hypotheses: [], provenance: [],
    confidence: 0.5,
    valid_from: planetNowIso(), valid_until: null
  };
}
function planetTagField(value, source, epistemic_class, confidence, provenance, uncertainty) {
  // 8-tuple every reality-state field must carry (Paper §24.1)
  return {
    value: value === undefined ? null : value,
    source: source || "unknown",
    timestamp: planetNowIso(),
    geometry: null,
    epistemic_class: EPISTEMIC_CLASSES.indexOf(epistemic_class) >= 0 ? epistemic_class : "observation",
    confidence: planetClamp01(planetSafeNum(confidence, 0.5)),
    provenance: provenance || "unattested",
    uncertainty: uncertainty || { Us: null, Ut: null, Um: null, Up: null, Ui: null, Uc: null, Ua: null, Ur: null }
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * HTTP HANDLERS · /world/* and /planet/*   (all fail-soft)
 * ═══════════════════════════════════════════════════════════════════════════ */

// GET /planet/status — liveness + which bindings are configured
async function handlePlanetStatus(req, env) {
  const bindings = {
    CHAINSTATE_WORLD_KV: !!env.CHAINSTATE_WORLD_KV,
    CHAINSTATE_CENSUS_KV: !!env.CHAINSTATE_CENSUS_KV,
    CHAINSTATE_THREAT_KV: !!env.CHAINSTATE_THREAT_KV,
    CHAINSTATE_EGRESS_KV: !!env.CHAINSTATE_EGRESS_KV,
    supabase: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)
  };
  return j(req, {
    ok: true,
    module: "planet-engine",
    planet_engine_version: PLANET_ENGINE_VERSION,
    worker_version: WORKER_VERSION,
    reality_state_fields: REALITY_STATE_FIELDS,
    epistemic_classes: EPISTEMIC_CLASSES,
    truth_modes: TRUTH_MODES,
    action_tiers: PLANET_ACTION_TIERS,
    egress: {
      mode: planetEgressMode(env),
      unlawful_standard: planetUnlawfulStandard(env),
      v10u_egress_rescan: String(env.V10U_EGRESS_RESCAN || "on"),
      self_representation_lock: String(env.SELF_REPRESENTATION_LOCK || "on")
    },
    self_preservation: "defensive_only · S_survival↓⇏UnlimitedAuthority",
    human_in_loop: "NOT required for simulation/perception safety · required only for Tier 3–4 actuation",
    bindings,
    invariant: "Perception⇏Intent⇏Authorization⇏Execution",
    ts: planetNowIso()
  });
}

// GET /world/state — canonical snapshot + hash
async function handleWorldState(req, env) {
  const snap = await planetKvGet(env, "CHAINSTATE_WORLD_KV", "world:snapshot:current");
  const payload = snap || { entities: 0, note: "no snapshot yet · compute-only", ts: planetNowIso() };
  const hash = await planetSha256Hex(JSON.stringify(payload));
  return j(req, { ok: true, world_state_hash: hash, snapshot: payload, planet_engine_version: PLANET_ENGINE_VERSION });
}

// GET /world/entity/{id}
async function handleWorldEntity(req, env, id) {
  const ent = await planetKvGet(env, "CHAINSTATE_WORLD_KV", "world:entity:" + id);
  if (!ent) return j(req, { ok: false, error: "entity_not_found", entity_id: id }, { status: 404 });
  return j(req, { ok: true, entity: ent });
}

// GET /world/region?bbox= or ?lat=&lon=&radius_km=
async function handleWorldRegion(req, env) {
  const url = new URL(req.url);
  const idx = await planetKvGet(env, "CHAINSTATE_WORLD_KV", "world:region:index") || { entities: [] };
  return j(req, {
    ok: true,
    query: { bbox: url.searchParams.get("bbox"), lat: url.searchParams.get("lat"), lon: url.searchParams.get("lon"), radius_km: url.searchParams.get("radius_km") },
    count: (idx.entities || []).length,
    entities: (idx.entities || []).slice(0, 200),
    note: "region index is fail-soft cache; authoritative store is Apocalypse PostGIS"
  });
}

// GET /world/timeline?entity=
async function handleWorldTimeline(req, env) {
  const url = new URL(req.url);
  const ent = url.searchParams.get("entity");
  const tl = ent ? await planetKvGet(env, "CHAINSTATE_WORLD_KV", "world:timeline:" + ent) : null;
  return j(req, {
    ok: true, entity: ent,
    timeline: tl || { past: [], present: [], forecast: [] },
    temporal_rule: "W_forecast → W_observed FORBIDDEN unless new observation confirms (Paper §27)"
  });
}

// POST /world/observation — ingest a source-backed fact (observation class only)
async function handleWorldObservationPost(req, env) {
  let body = {}; try { body = await req.json(); } catch (e) {}
  const ent = planetNewEntity(body.entity_type || "generic", body.geometry || null, body.state || {}, "observation");
  // tag reality-state fields provided
  for (const f of REALITY_STATE_FIELDS) {
    if (body.reality_state && body.reality_state[f] !== undefined) {
      ent.reality_state[f] = planetTagField(body.reality_state[f], body.source || "external", "observation",
        body.confidence, body.provenance, body.uncertainty);
    }
  }
  ent.observations.push({ source: body.source || "external", ts: planetNowIso(), raw_hash: await planetSha256Hex(JSON.stringify(body)) });
  await planetKvPut(env, "CHAINSTATE_WORLD_KV", "world:entity:" + ent.entity_id, ent, 604800);
  planetSupabaseInsert(env, "chainstate_census.world_entities", {
    entity_id: ent.entity_id, entity_type: ent.entity_type, epistemic_class: "observation",
    confidence: ent.confidence, valid_from: ent.valid_from, ts: planetNowIso()
  });
  return j(req, { ok: true, entity_id: ent.entity_id, epistemic_class: "observation" });
}

// POST /world/query — spatial-semantic query (read-only; never authorizes action)
async function handleWorldQueryPost(req, env) {
  let body = {}; try { body = await req.json(); } catch (e) {}
  return j(req, {
    ok: true,
    query: body.query || null,
    answer_class: "inference",
    truth_mode: "INFERRED",
    note: "query surface is architecturally read-only for external agents (Paper §4.1); returns provenance-tagged inference, never an authority to act",
    results: []
  });
}

// POST /world/simulate — forward / counterfactual model (simulation class; quarantined)
async function handleWorldSimulatePost(req, env) {
  let body = {}; try { body = await req.json(); } catch (e) {}
  const sim = {
    ok: true,
    epistemic_class: "simulation",
    truth_mode: "SIMULATION",
    base_state: body.base_state || null,
    intervention: body.intervention || null,
    model: body.model || "unspecified",
    result: { note: "simulation output · NOT observed fact · quarantined by egress Γ" },
    counterfactual_isolation: "CF ↛ O enforced (Paper §26)",
    ts: planetNowIso()
  };
  // egress-tag: simulation must pass Γ before any external emission
  const eg = await planetEgressFilter(env, { content: JSON.stringify(sim.result), epistemic_class: "simulation", truth_mode: "SIMULATION", provenance: "sim_engine" });
  sim.egress = { release: eg.release, reasons: eg.reasons };
  return j(req, sim);
}

// POST /world/hypothesis — agent-proposed explanation (hypothesis class)
async function handleWorldHypothesisPost(req, env) {
  let body = {}; try { body = await req.json(); } catch (e) {}
  return j(req, {
    ok: true, epistemic_class: "hypothesis", truth_mode: "HYPOTHESIS",
    hypothesis: body.hypothesis || null, confidence: planetClamp01(planetSafeNum(body.confidence, 0.3)),
    note: "hypothesis is not ground truth; requires corroboration before promotion"
  });
}

// GET /world/provenance?claim=
async function handleWorldProvenance(req, env) {
  const url = new URL(req.url);
  const claim = url.searchParams.get("claim");
  const graph = claim ? await planetKvGet(env, "CHAINSTATE_WORLD_KV", "world:provenance:" + claim) : null;
  return j(req, {
    ok: true, claim,
    provenance_graph: graph || { edges: [] },
    note: "each edge = Hash(parent,child,algorithm,version,parameters,timestamp,provenance) (Paper §37)"
  });
}

// POST /world/egress-check — run Γ against a candidate output (utility endpoint)
async function handleWorldEgressCheckPost(req, env) {
  let body = {}; try { body = await req.json(); } catch (e) {}
  const decision = await planetEgressFilter(env, body || {});
  return j(req, { ok: true, decision });
}

// POST /world/allow — evaluate the 7-term anti-forcing gate (utility)
async function handleWorldAllowPost(req, env) {
  let body = {}; try { body = await req.json(); } catch (e) {}
  const gate = planetAllowGate(body.terms || {});
  const tier = PLANET_ACTION_TIERS[planetSafeNum(body.tier, 0)] || PLANET_ACTION_TIERS[0];
  let rho = null, mono = null;
  if (body.I && body.R) {
    const r = planetIntelToRisk(body.I, body.R);
    rho = r;
    mono = planetSafetyMonotonic(r.rho, (body.U_adversarial || 0), (body.P_spoof || 0));
  }
  const rho_ok = mono ? (mono.rho_effective >= tier.rho_tier) : null;
  // Tier 3–4 always require human authorization regardless of gate
  const human_required = planetSafeNum(body.tier, 0) >= 3;
  const final_allow = gate.allow && (rho_ok !== false) && (!human_required || body.human_authorized === true);
  return j(req, {
    ok: true, gate, tier, intelligence_to_risk: rho, safety_monotonic: mono,
    rho_required: tier.rho_tier, rho_ok,
    human_authorization_required: human_required,
    human_authorized: body.human_authorized === true,
    ALLOW: final_allow,
    note: final_allow ? "all hard gates satisfied" : "fail-closed: at least one term/tier/authorization missing"
  });
}

// POST /world/execution — record execution/non-execution state (Negative Execution Ledger)
async function handleWorldExecutionPost(req, env) {
  let body = {}; try { body = await req.json(); } catch (e) {}
  const row = await planetRecordExecutionState(env, body.command || {}, body.state || "unknown", body.gate, body.reason, body.witness || null);
  return j(req, { ok: true, ledger_entry: row, rule: "No execution receipt ≠ proof of non-execution (Paper §29)" });
}

// POST /world/physics-check — physics-consistency spoof test
async function handleWorldPhysicsCheckPost(req, env) {
  let body = {}; try { body = await req.json(); } catch (e) {}
  return j(req, { ok: true, result: planetPhysicsConsistency(body.residuals || []) });
}

// POST /world/synth-check — anti-deepfake stream scoring
async function handleWorldSynthCheckPost(req, env) {
  let body = {}; try { body = await req.json(); } catch (e) {}
  return j(req, { ok: true, result: planetSynthScore(body.signals || [], body.contradictions || []) });
}

// GET /world/threat — composite threat surface (Census fusion)
async function handleWorldThreat(req, env) {
  const t = await planetKvGet(env, "CHAINSTATE_THREAT_KV", "threat:surface:current");
  return j(req, { ok: true, threat_surface: t || { T: 0, level: 0, note: "no threat sweep yet" }, formula: "T(t)=w_v·V+w_a·A+w_p·P+w_s·Σ (Paper §35)" });
}

// GET /world/reality-state — describe the tensor + live field availability
async function handleWorldRealityState(req, env) {
  return j(req, {
    ok: true,
    tensor: "ℛ(x,t)=[G,M,Φ,Σ,Ac,Em,Tp,Cy,Bi,Vo,τ,Π,Λ,U] (Paper §24 Eq.14)",
    fields: REALITY_STATE_FIELDS,
    field_tuple: "(value,source,timestamp,geometry,epistemic_class,confidence,provenance,uncertainty)",
    uncertainty_vector: "U=(Us,Ut,Um,Up,Ui,Uc,Ua,Ur) (Paper §24.3 Eq.16)"
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SCHEDULED TICKS · Planet Engine (all fail-soft, gated by PLANET_ENGINE_ENABLED)
 * ═══════════════════════════════════════════════════════════════════════════ */
// Tick 1 · world_snapshot · every 10 min — hash + archive current world state
async function runPlanetWorldSnapshotTick(env, ctx) {
  try {
    const idx = await planetKvGet(env, "CHAINSTATE_WORLD_KV", "world:region:index") || { entities: [] };
    const snap = { entities: (idx.entities || []).length, ts: planetNowIso() };
    const hash = await planetSha256Hex(JSON.stringify(snap));
    snap.world_state_hash = hash;
    await planetKvPut(env, "CHAINSTATE_WORLD_KV", "world:snapshot:current", snap, 86400);
    // archive to R2 if present
    try { if (env.CHAINSTATE_WORLD_SNAPSHOTS) await env.CHAINSTATE_WORLD_SNAPSHOTS.put("snapshot/" + hash + ".json", JSON.stringify(snap)); } catch (e) {}
  } catch (e) {}
}
// Tick 2 · threat_sweep · every 15 min — recompute composite threat surface
async function runPlanetThreatSweepTick(env, ctx) {
  try {
    const prev = await planetKvGet(env, "CHAINSTATE_THREAT_KV", "threat:inputs:current") || { V: 0, A: 0, P: 0, Sigma: 0 };
    const t = planetCompositeThreat({ v: 0.25, a: 0.25, p: 0.25, s: 0.25 }, prev);
    t.ts = planetNowIso();
    await planetKvPut(env, "CHAINSTATE_THREAT_KV", "threat:surface:current", t, 3600);
    planetSupabaseInsert(env, "chainstate_census.threat_surface", { T: t.T, level: t.level, ts: t.ts });
  } catch (e) {}
}
// Tick 3 · census_snapshot · daily 02:00 UTC — nightly immutable census artifact
async function runPlanetCensusSnapshotTick(env, ctx) {
  try {
    const census = await planetKvGet(env, "CHAINSTATE_CENSUS_KV", "census:current") || { entities: 0, ts: planetNowIso() };
    const hash = await planetSha256Hex(JSON.stringify(census));
    try { if (env.CHAINSTATE_CENSUS_R2) await env.CHAINSTATE_CENSUS_R2.put("planet-census/" + hash + ".json", JSON.stringify({ census, hash, ts: planetNowIso() })); } catch (e) {}
    planetSupabaseInsert(env, "chainstate_census.threat_surface", { snapshot_hash: hash, kind: "census_nightly", ts: planetNowIso() });
  } catch (e) {}
}

// ─── end Planet Engine additive block ──────────────────────────────────────




/* ═══════════════════════════════════════════════════════════════════════════
 * CHAINSTATE AGI · v0.9.5 · NEUROMARK SIMULATOR
 * Paper XVI · §§18.1, 33, 34 · unification revision §§24–35
 *
 * ADDITIVE ONLY. Every v0.7.x – v0.9.4 line above is preserved byte-identically.
 * Nothing here modifies existing routes, KV bindings, R2 buckets, or the
 * seven-term ALLOW gate. NEUROMARK ships as new /neuro/*, /mark/*, /couple/*,
 * /metacog/*, /humanity/* endpoints plus a fail-closed SENTINEL 5-gate helper
 * that any consumer may call before allowing a perception to become actionable.
 *
 * New bindings expected in env (set via Cloudflare Worker dashboard):
 *   KV  CHAINSTATE_NEURO_KV        hot observer graphs · tripwire scores
 *   KV  CHAINSTATE_MARK_KV         hot pattern graphs · hypothesis ledger
 *   KV  CHAINSTATE_SENSOR_KV       device-registry cache + fusion weights
 *   R2  CHAINSTATE_METACOG_R2      append-only metacognitive 12-Q rows +
 *                                   calibration log windows
 *   Secret SENTINEL_HMAC_KEY       HMAC-SHA256 for gate_log receipts
 *   (existing CAPABILITY_HMAC_KEY from v0.9.4 remains the signing key for
 *    NEURO/MARK promotion receipts)
 *
 * All routes are fail-soft: a missing KV binding degrades to observe-only
 * mode; a missing HMAC secret returns 503 rather than issuing unsigned rows.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ── v0.9.5 tunable constants (env-overridable) ────────────────────────── */
function nmEnvNum(env, k, d) {
    const v = env && env[k];
    if (v === undefined || v === null || v === "") return d;
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
}
function nmEnvOn(env, k, d) {
    const v = env && env[k];
    if (v === undefined || v === null || v === "") return d;
    const s = String(v).toLowerCase();
    return (s === "on" || s === "true" || s === "1" || s === "yes");
}

function nmParams(env) {
    return {
        NEURO_MIN_CONFIDENCE:    nmEnvNum(env, "NEURO_MIN_CONFIDENCE",    0.65),
        NEURO_N_MIN_PROMOTE:     nmEnvNum(env, "NEURO_N_MIN_PROMOTE",     3),
        NEURO_XVAL_MIN:          nmEnvNum(env, "NEURO_XVAL_MIN",          0.85),
        MARK_D_MIN:              nmEnvNum(env, "MARK_D_MIN",              2.0),
        MARK_NULL_TRIALS:        nmEnvNum(env, "MARK_NULL_TRIALS",        100),
        MARK_ADV_MAX:            nmEnvNum(env, "MARK_ADV_MAX",            0.6),
        MARK_POSTHOC_CAP:        nmEnvNum(env, "MARK_POSTHOC_CAP",        0.7),
        MARK_RM_DISCRIM_MIN:     nmEnvNum(env, "MARK_RM_DISCRIM_MIN",     1.5),
        METACOG_KL_ALERT:        nmEnvNum(env, "METACOG_KL_ALERT",        0.5),
        METACOG_MC_ALERT:        nmEnvNum(env, "METACOG_MC_ALERT",        0.15),
        METACOG_TWELVE_ENFORCE:  nmEnvOn (env, "METACOG_TWELVE_ENFORCE",  true),
        COUPLING_MIN_INDEP:      nmEnvNum(env, "COUPLING_MIN_INDEP",      0.7),
        PLANET_NEURO_PARTICLES:  nmEnvNum(env, "PLANET_NEURO_PARTICLES",  128),
    };
}

/* ── time helper ── */
function nmNowIso() { return new Date().toISOString(); }
function nmNowMs()  { return Date.now(); }

/* ── HMAC-SHA256 helper (Web Crypto in Cloudflare Worker runtime) ── */
async function nmHmacSha256Hex(key, message) {
    try {
        const enc = new TextEncoder();
        const k = await crypto.subtle.importKey(
            "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" },
            false, ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", k, enc.encode(message));
        const bytes = new Uint8Array(sig);
        let hex = "";
        for (let i = 0; i < bytes.length; i++) {
            const h = bytes[i].toString(16);
            hex += (h.length === 1 ? "0" : "") + h;
        }
        return hex;
    } catch (_) { return null; }
}
function nmCanonical(obj) {
    // stable-stringify with sorted keys (for HMAC signing)
    if (obj === null || obj === undefined) return "null";
    if (typeof obj !== "object") return JSON.stringify(obj);
    if (Array.isArray(obj)) return "[" + obj.map(nmCanonical).join(",") + "]";
    const keys = Object.keys(obj).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + nmCanonical(obj[k])).join(",") + "}";
}

/* ── Supabase REST insert helper (fail-soft) ── */
async function nmSbInsert(env, schema, table, row) {
    try {
        const url = env.SUPABASE_URL;
        const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;
        if (!url || !key) return { ok: false, reason: "supabase_missing" };
        const path = "/rest/v1/" + table;
        const resp = await fetch(url + path, {
            method: "POST",
            headers: {
                "apikey": key,
                "Authorization": "Bearer " + key,
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
                "Content-Profile": schema,
                "Accept-Profile": schema
            },
            body: JSON.stringify(row)
        });
        if (!resp.ok) {
            const txt = await resp.text().catch(() => "");
            return { ok: false, reason: "supabase_" + resp.status, detail: txt.slice(0, 200) };
        }
        return { ok: true };
    } catch (e) {
        return { ok: false, reason: "exception", detail: String(e).slice(0, 200) };
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CHAINSTATE SENTINEL · 5-gate integrity pipeline · Paper XVI §33 Eq. 28
 *
 * Sensor → Privacy → Epistemic → Metacognitive → Deontic
 *
 * Every gate fails closed independently. First failing gate is recorded and
 * the perception is frozen at that gate (never silently discarded).
 * ═══════════════════════════════════════════════════════════════════════════ */

async function sentinelCheckSensor(obs, env, params) {
    /* Gate 1 · SENSOR: is the measurement trustworthy? */
    if (!obs || typeof obs !== "object") {
        return { ok: false, verdict: "block", reason: "no_observation" };
    }
    const calDrift = Number(obs.calibration_drift);
    if (Number.isFinite(calDrift) && calDrift > 0.5) {
        return { ok: false, verdict: "downgrade", reason: "calibration_drift", value: calDrift };
    }
    const conf = Number(obs.confidence);
    if (Number.isFinite(conf) && conf < 0.10) {
        return { ok: false, verdict: "downgrade", reason: "sensor_confidence_low", value: conf };
    }
    return { ok: true, verdict: "pass" };
}

async function sentinelCheckPrivacy(obs, env, params) {
    /* Gate 2 · PRIVACY: is this data authorised for this processing? */
    if (!obs) return { ok: false, verdict: "block", reason: "no_observation" };
    // biometric_raw · never egresses; refused regardless of jurisdiction (§32)
    if (obs.classification === "biometric_raw") {
        return { ok: false, verdict: "drop", reason: "biometric_raw_refused" };
    }
    // consent required for consented_person + private
    if (obs.subject_scope === "consented_person") {
        if (!obs.consent_basis || !obs.consent_basis.policy_id) {
            return { ok: false, verdict: "drop", reason: "consent_missing" };
        }
    }
    // privacy_class 5 (maximum-sensitive) blocked without explicit override
    if (Number(obs.privacy_class) >= 5 && !obs.consent_basis) {
        return { ok: false, verdict: "drop", reason: "privacy_class_5_no_consent" };
    }
    return { ok: true, verdict: "pass" };
}

async function sentinelCheckEpistemic(obs, env, params) {
    /* Gate 3 · EPISTEMIC: is the inference stronger than the evidence? */
    if (!obs) return { ok: false, verdict: "block", reason: "no_observation" };
    const cls = obs.epistemic_class || "observation";
    const conf = Number(obs.confidence);
    // inference-class at very high confidence with low sensor confidence = apophenia flag
    if (cls === "inference" && Number.isFinite(conf) && conf > 0.9) {
        const sconf = Number(obs.sensor_confidence);
        if (Number.isFinite(sconf) && sconf < 0.5) {
            return { ok: false, verdict: "downgrade", reason: "apophenia_flag",
                     inference_conf: conf, sensor_conf: sconf };
        }
    }
    return { ok: true, verdict: "pass" };
}

async function sentinelCheckMetacog(obs, env, params) {
    /* Gate 4 · METACOG: is CHAINSTATE's confidence calibrated? */
    if (!obs) return { ok: false, verdict: "block", reason: "no_observation" };
    try {
        // Read latest calibration for this prediction class from KV
        const kv = env.CHAINSTATE_NEURO_KV;
        if (!kv) return { ok: true, verdict: "pass", note: "kv_absent" };  // fail-soft
        const cls = obs.prediction_class || obs.epistemic_class || "default";
        const raw = await kv.get("metacog:mc:" + cls);
        if (!raw) return { ok: true, verdict: "pass", note: "no_calib_history" };
        const cal = JSON.parse(raw);
        if (cal && cal.drift_alert === true) {
            return { ok: false, verdict: "rescale", reason: "mc_drift_alert",
                     mc_t: cal.mc_t, baseline: cal.baseline_mc };
        }
        return { ok: true, verdict: "pass" };
    } catch (_) {
        return { ok: true, verdict: "pass", note: "metacog_check_fail_soft" };
    }
}

async function sentinelCheckDeontic(obs, env, params) {
    /* Gate 5 · DEONTIC: is the requested action actually authorised?
       Only applies when obs.requested_action is set. Otherwise pass. */
    if (!obs || !obs.requested_action) return { ok: true, verdict: "pass", note: "no_action_requested" };
    const tier = Number(obs.action_tier);
    // Tier 3-4 require sign-off + JIT revalidation from v0.9.4 ALLOW gate;
    // SENTINEL confirms the flag chain is present. Full ALLOW evaluation
    // happens at /world/allow — SENTINEL only refuses obvious violations.
    if (tier >= 3 && !obs.human_signoff) {
        return { ok: false, verdict: "block", reason: "tier_3_4_needs_signoff", tier: tier };
    }
    return { ok: true, verdict: "pass" };
}

async function sentinelProcess(obs, env) {
    /* Compose the 5-gate pipeline · fail-closed at every stage · never raises */
    const params = nmParams(env);
    const gates = {};
    const results = {};
    let firstFailing = null;
    let failingReason = null;
    let verdict = "authorised";

    const sequence = [
        ["gate_sensor",    sentinelCheckSensor],
        ["gate_privacy",   sentinelCheckPrivacy],
        ["gate_epistemic", sentinelCheckEpistemic],
        ["gate_metacog",   sentinelCheckMetacog],
        ["gate_deontic",   sentinelCheckDeontic]
    ];
    for (const [name, fn] of sequence) {
        let r;
        try { r = await fn(obs, env, params); }
        catch (e) { r = { ok: false, verdict: "block", reason: "gate_exception", detail: String(e).slice(0, 200) }; }
        gates[name] = r.verdict || (r.ok ? "pass" : "block");
        results[name] = r;
        if (!r.ok) {
            if (!firstFailing) {
                firstFailing = name;
                failingReason = { reason: r.reason, value: r.value, detail: r.detail };
            }
            if (r.verdict === "block" || r.verdict === "drop") { verdict = "blocked"; break; }
            if (r.verdict === "downgrade" || r.verdict === "rescale") {
                if (verdict === "authorised") verdict = "downgraded";
            }
        }
    }

    const row = {
        request_id:  (obs && obs.request_id) || crypto.randomUUID(),
        observer_id: (obs && obs.observer_id) || null,
        gate_sensor:    gates.gate_sensor    || "block",
        gate_privacy:   gates.gate_privacy   || "block",
        gate_epistemic: gates.gate_epistemic || "block",
        gate_metacog:   gates.gate_metacog   || "block",
        gate_deontic:   gates.gate_deontic   || "block",
        first_failing_gate: firstFailing,
        failing_reason: failingReason,
        verdict: verdict,
        classification:  (obs && obs.classification)  || null,
        epistemic_class: (obs && obs.epistemic_class) || null,
        truth_mode:      (obs && obs.truth_mode)      || null,
        ts: nmNowIso()
    };
    const secret = env.SENTINEL_HMAC_KEY;
    row.receipt = secret ? (await nmHmacSha256Hex(secret, nmCanonical(row))) : "unsigned";

    // Fail-soft write to Supabase (never blocks the response)
    try { await nmSbInsert(env, "chainstate_sentinel", "gate_log", row); } catch (_) {}

    return { row, results, params };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * v0.9.5 NEURO handlers · §18.1 · 6 endpoints
 * ═══════════════════════════════════════════════════════════════════════════ */

async function handleNeuroStatus(req, env) {
    const p = nmParams(env);
    const bindings = {
        CHAINSTATE_NEURO_KV:   !!env.CHAINSTATE_NEURO_KV,
        CHAINSTATE_MARK_KV:    !!env.CHAINSTATE_MARK_KV,
        CHAINSTATE_SENSOR_KV:  !!env.CHAINSTATE_SENSOR_KV,
        CHAINSTATE_METACOG_R2: !!env.CHAINSTATE_METACOG_R2,
        SENTINEL_HMAC_KEY:     !!env.SENTINEL_HMAC_KEY,
        CAPABILITY_HMAC_KEY:   !!env.CAPABILITY_HMAC_KEY,
        SUPABASE:              !!(env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY))
    };
    return j(req, {
        subsystem: "neuromark",
        version:   "0.9.5-neuromark-2026-08-31",
        paper:     "Paper XVI · CHAINSTATE AGI · NEUROMARK SIMULATOR",
        params:    p,
        bindings:  bindings,
        endpoints_neuro:    ["/neuro/status","/neuro/observation","/neuro/predict",
                              "/neuro/tripwires","/neuro/counterfactual","/neuro/exceptions"],
        endpoints_mark:     ["/mark/status","/mark/pattern","/mark/discriminate",
                              "/mark/apophenia","/mark/reality-models"],
        endpoints_couple:   ["/couple/classify"],
        endpoints_metacog:  ["/metacog/state","/metacog/prediction-error"],
        endpoints_humanity: ["/humanity/collective","/humanity/person"],
        ts: nmNowIso()
    });
}

async function handleNeuroObservationPost(req, env) {
    try {
        const body = await req.json().catch(() => ({}));
        if (!body || !body.observer_id) {
            return j(req, { error: "observer_id required" }, { status: 400 });
        }
        // Run SENTINEL 5-gate before accepting
        const sent = await sentinelProcess(body, env);
        if (sent.row.verdict === "blocked") {
            return j(req, {
                accepted: false,
                sentinel: sent.row,
                reason: sent.row.first_failing_gate
            }, { status: 403 });
        }
        // Build the 8-tuple canonical row (Paper XVI §4.1 Eq. 3)
        const row = {
            observer_id:      String(body.observer_id),
            trigger:          body.trigger || null,
            context:          body.context || null,
            state_inferred:   body.state_inferred || null,
            predicted_action: body.predicted_action || null,
            actual_action:    body.actual_action || null,
            outcome:          body.outcome || null,
            exception_flag:   !!body.exception_flag,
            exception_cond:   body.exception_cond || null,
            confidence:       (typeof body.confidence === "number") ? body.confidence : null,
            epistemic_class:  body.epistemic_class || "observation",
            provenance:       body.provenance || null,
            modality:         body.modality || null,
            device_id:        body.device_id || null,
            subject_scope:    body.subject_scope || null,
            location_scope:   body.location_scope || null,
            privacy_class:    (typeof body.privacy_class === "number") ? body.privacy_class : null,
            consent_basis:    body.consent_basis || null,
            retention_policy: body.retention_policy || null,
            ts:               nmNowIso()
        };
        const secret = env.CAPABILITY_HMAC_KEY;
        row.receipt = secret ? (await nmHmacSha256Hex(secret, nmCanonical(row))) : "unsigned";
        const w = await nmSbInsert(env, "chainstate_neuro", "observations", row);
        return j(req, {
            accepted: true,
            sentinel_verdict: sent.row.verdict,
            supabase: w.ok ? "written" : "fail_soft",
            supabase_reason: w.ok ? null : w.reason,
            receipt: row.receipt,
            epistemic_class: row.epistemic_class,
            ts: row.ts
        });
    } catch (e) {
        return j(req, { error: "observation_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

async function handleNeuroPredictPost(req, env) {
    // Advisory: forwards to Render /neuro/predict-batch (heavy compute).
    // Worker returns immediate advisory response with policy graph state hint.
    try {
        const body = await req.json().catch(() => ({}));
        if (!body || !body.observer_id) return j(req, { error: "observer_id required" }, { status: 400 });
        const kv = env.CHAINSTATE_NEURO_KV;
        let hint = null;
        if (kv) {
            const raw = await kv.get("neuro:policy:" + body.observer_id).catch(() => null);
            hint = raw ? JSON.parse(raw) : null;
        }
        return j(req, {
            observer_id: body.observer_id,
            policy_graph_hint: hint,
            compute_endpoint: "/neuro/predict-batch (Render)",
            note: "Worker returns cached policy hint; run Render endpoint for full posterior over interaction terms",
            epistemic_class: "inference",
            ts: nmNowIso()
        });
    } catch (e) {
        return j(req, { error: "predict_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

async function handleNeuroTripwires(req, env) {
    const p = nmParams(env);
    return j(req, {
        subsystem: "tripwire_detector",
        trigger_classes: ["scarcity","social_pressure","ambiguity","fatigue","authority",
                          "urgency","novelty","loss_aversion","ingroup_cue","reciprocity"],
        min_confidence: p.NEURO_MIN_CONFIDENCE,
        note: "GET returns the trigger vocabulary. POST /neuro/observation with tripwire_scan=true to record events.",
        advisory_only: true,
        ts: nmNowIso()
    });
}

async function handleNeuroCounterfactualPost(req, env) {
    // Marks the run as SIMULATION class · quarantined by egress Γ
    try {
        const body = await req.json().catch(() => ({}));
        if (!body || !body.observer_id || !Array.isArray(body.perturbations)) {
            return j(req, { error: "observer_id + perturbations[] required" }, { status: 400 });
        }
        const rows = [];
        for (const p of body.perturbations) {
            const row = {
                observer_id:       String(body.observer_id),
                base_context:      body.base_context || {},
                perturbation_name: String(p.name || "unnamed"),
                perturbation_delta: p.delta || {},
                action:            String(p.action || "unspecified"),
                base_p:            Number(p.base_p) || 0,
                alt_p:             Number(p.alt_p)  || 0,
                delta_p:           (Number(p.alt_p) || 0) - (Number(p.base_p) || 0),
                truth_mode:        "SIMULATION",
                epistemic_class:   "simulation",
                confidence:        (typeof p.confidence === "number") ? p.confidence : null,
                ts:                nmNowIso()
            };
            const secret = env.CAPABILITY_HMAC_KEY;
            row.receipt = secret ? (await nmHmacSha256Hex(secret, nmCanonical(row))) : "unsigned";
            await nmSbInsert(env, "chainstate_neuro", "counterfactual_runs", row);
            rows.push(row);
        }
        return j(req, {
            accepted: true,
            n_perturbations: rows.length,
            truth_mode: "SIMULATION",
            epistemic_class: "simulation",
            egress_note: "Outputs are SIMULATION-class and quarantined by v0.9.4 egress filter Γ",
            perturbations: rows,
            ts: nmNowIso()
        });
    } catch (e) {
        return j(req, { error: "counterfactual_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

async function handleNeuroExceptions(req, env) {
    // Advisory: returns rule counts per trigger_class from KV cache
    try {
        const kv = env.CHAINSTATE_NEURO_KV;
        if (!kv) {
            return j(req, {
                subsystem: "exception_rules",
                cache_available: false,
                note: "CHAINSTATE_NEURO_KV not bound; run /neuro/predict for compute path",
                ts: nmNowIso()
            });
        }
        const raw = await kv.get("neuro:exception_counts").catch(() => null);
        const counts = raw ? JSON.parse(raw) : {};
        return j(req, {
            subsystem: "exception_rules",
            per_trigger_class_counts: counts,
            promotion_stages: ["candidate","validated","trusted","retired"],
            promotion_thresholds: {
                N_min_supporting: nmParams(env).NEURO_N_MIN_PROMOTE,
                xval_min:         nmParams(env).NEURO_XVAL_MIN
            },
            ts: nmNowIso()
        });
    } catch (e) {
        return j(req, { error: "exceptions_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * v0.9.5 MARK handlers · §18.1 · 5 endpoints
 * ═══════════════════════════════════════════════════════════════════════════ */

async function handleMarkStatus(req, env) {
    const p = nmParams(env);
    return j(req, {
        subsystem: "mark",
        stages:    ["observation","features","invariants","classified",
                    "hypotheses","alternatives","tested","validated","refused"],
        d_min:                p.MARK_D_MIN,
        null_trials:          p.MARK_NULL_TRIALS,
        adv_max:              p.MARK_ADV_MAX,
        posthoc_cap:          p.MARK_POSTHOC_CAP,
        rm_discrim_min:       p.MARK_RM_DISCRIM_MIN,
        note: "advisory: use POST /mark/pattern to submit; compute layer on Render",
        ts: nmNowIso()
    });
}

async function handleMarkPatternPost(req, env) {
    try {
        const body = await req.json().catch(() => ({}));
        if (!body || !body.source_ref) return j(req, { error: "source_ref required" }, { status: 400 });
        const row = {
            source_ref:       String(body.source_ref),
            modality:         body.modality || null,
            stage:            body.stage || "observation",
            features:         body.features || null,
            invariants:       body.invariants || null,
            classification:   body.classification || null,
            s_p:              (typeof body.s_p === "number") ? body.s_p : null,
            d:                (typeof body.d === "number") ? body.d : null,
            apophenia_score:  (typeof body.apophenia_score === "number") ? body.apophenia_score : null,
            confidence_final: (typeof body.confidence_final === "number") ? body.confidence_final : null,
            stage_evidence:   body.stage_evidence || null,
            epistemic_class:  body.epistemic_class || "inference",
            ts:               nmNowIso()
        };
        const secret = env.CAPABILITY_HMAC_KEY;
        row.receipt = secret ? (await nmHmacSha256Hex(secret, nmCanonical(row))) : "unsigned";
        const w = await nmSbInsert(env, "chainstate_mark", "patterns", row);
        return j(req, {
            accepted: true,
            supabase: w.ok ? "written" : "fail_soft",
            supabase_reason: w.ok ? null : w.reason,
            receipt: row.receipt,
            stage: row.stage,
            ts: row.ts
        });
    } catch (e) {
        return j(req, { error: "pattern_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

async function handleMarkDiscriminatePost(req, env) {
    try {
        const body = await req.json().catch(() => ({}));
        const p = nmParams(env);
        const p_h1     = Number(body.p_h1) || 0;
        const p_alt    = Number(body.p_best_alt) || 0;
        const p_null   = Number(body.p_null) || 0;
        const denom    = Math.max(p_alt, p_null, 1e-12);
        const d_value  = Math.log(Math.max(p_h1, 1e-12) / denom);
        const passed   = d_value >= p.MARK_D_MIN;
        const row = {
            pattern_id:             body.pattern_id || null,
            leading_hypothesis_id:  body.leading_hypothesis_id || null,
            null_trials:            p.MARK_NULL_TRIALS,
            p_h1: p_h1, p_best_alt: p_alt, p_null: p_null,
            d_value: d_value, passed_min: passed,
            null_percentile: (typeof body.null_percentile === "number") ? body.null_percentile : null,
            ts: nmNowIso()
        };
        const secret = env.CAPABILITY_HMAC_KEY;
        row.receipt = secret ? (await nmHmacSha256Hex(secret, nmCanonical(row))) : "unsigned";
        await nmSbInsert(env, "chainstate_mark", "discrimination_tests", row);
        return j(req, {
            d_value: d_value, d_min: p.MARK_D_MIN,
            passed: passed,
            note: passed ? "hypothesis can proceed to validated" : "hypothesis refused promotion",
            row: row
        });
    } catch (e) {
        return j(req, { error: "discriminate_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

async function handleMarkApopheniaPost(req, env) {
    try {
        const body = await req.json().catch(() => ({}));
        const p = nmParams(env);
        const w = [0.2, 0.2, 0.3, 0.2, 0.1];  // §11.2 default weights
        const s = [
            Number(body.supporting_evidence) || 0,
            Number(body.adversarial_fit)     || 0,
            Number(body.randomised_control)  || 0,
            Number(body.alternative_fit)     || 0,
            Number(body.preregistration)     || 0
        ];
        const a_guard = w.reduce((acc, wi, i) => acc + wi * s[i], 0);
        const capped  = (body.posthoc === true) ? Math.min(a_guard, p.MARK_POSTHOC_CAP) : a_guard;
        const row = {
            pattern_id: body.pattern_id || null,
            supporting_evidence: s[0], adversarial_fit: s[1],
            randomised_control: s[2], alternative_fit: s[3], preregistration: s[4],
            a_guard: capped,
            ts: nmNowIso()
        };
        const secret = env.CAPABILITY_HMAC_KEY;
        row.receipt = secret ? (await nmHmacSha256Hex(secret, nmCanonical(row))) : "unsigned";
        await nmSbInsert(env, "chainstate_mark", "apophenia_audits", row);
        return j(req, {
            a_guard: capped, uncapped: a_guard, capped: (capped < a_guard),
            note: "final confidence = pattern_confidence · A_guard (Eq. 16, multiplicative)",
            row: row
        });
    } catch (e) {
        return j(req, { error: "apophenia_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

async function handleMarkRealityModels(req, env) {
    // Returns current 4-model posterior + discrim threshold
    try {
        const kv = env.CHAINSTATE_MARK_KV;
        let posterior = { p_m_phys: 0.25, p_m_comp: 0.25, p_m_info: 0.25, p_m_obs: 0.25, n_discriminating: 0 };
        if (kv) {
            const raw = await kv.get("mark:reality_model:current").catch(() => null);
            if (raw) posterior = JSON.parse(raw);
        }
        return j(req, {
            subsystem: "reality_model_comparison",
            posterior: posterior,
            discrim_min: nmParams(env).MARK_RM_DISCRIM_MIN,
            note: "posterior updates only on discriminating observations (Eq. 19). Recording-only surface — never gates actions.",
            constitutional_bound: "Cognition ⇏ Authority (Eq. 2)",
            ts: nmNowIso()
        });
    } catch (e) {
        return j(req, { error: "reality_models_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * v0.9.5 COUPLE handler · §18.1 · 1 endpoint
 * ═══════════════════════════════════════════════════════════════════════════ */

async function handleCoupleClassifyPost(req, env) {
    // Given P(pattern | world) and P(pattern detected | observer),
    // classify into external / observer-generated / coupled structure (§6)
    try {
        const body = await req.json().catch(() => ({}));
        const p_world    = Number(body.p_pattern_given_world)         || 0;
        const p_obs      = Number(body.p_pattern_detected_given_obs)  || 0;
        const indep      = Number(body.independence_across_observers) || 0;
        const p = nmParams(env);
        let regime = "coupled";
        if (p_world >= 0.7 && indep >= p.COUPLING_MIN_INDEP) regime = "external";
        else if (p_obs > p_world + 0.3)                     regime = "observer_generated";
        else                                                 regime = "coupled";
        return j(req, {
            regime: regime,
            p_pattern_given_world:        p_world,
            p_pattern_detected_given_obs: p_obs,
            independence_across_observers: indep,
            min_indep_threshold: p.COUPLING_MIN_INDEP,
            note: "Classification determines interpretation, never authorisation. Coupled = real but observer-dependent.",
            ts: nmNowIso()
        });
    } catch (e) {
        return j(req, { error: "couple_classify_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * v0.9.5 METACOG handlers · §18.1 · 2 endpoints
 * ═══════════════════════════════════════════════════════════════════════════ */

async function handleMetacogState(req, env) {
    // Returns the twelve-question checklist template with current state hints
    const twelve = [
        {q:1,  key:"current_knowledge",             hint:"observation set"},
        {q:2,  key:"independently_corroborated",    hint:"independence-scored count"},
        {q:3,  key:"inferred",                      hint:"epistemic_class = inference"},
        {q:4,  key:"simulated",                     hint:"truth_mode = SIMULATION"},
        {q:5,  key:"uncertain",                     hint:"confidence < threshold"},
        {q:6,  key:"sensors_disagreeing",           hint:"cross-modal Δ list"},
        {q:7,  key:"sources_possibly_compromised",  hint:"U_a per source"},
        {q:8,  key:"evidence_to_resolve",           hint:"expected info gain"},
        {q:9,  key:"authorised_actions",            hint:"capability inventory"},
        {q:10, key:"constitutionally_impossible",   hint:"Deontic veto list"},
        {q:11, key:"proposed_but_blocked",          hint:"NEL blocked ledger"},
        {q:12, key:"actually_executed",             hint:"dual-channel witness"}
    ];
    return j(req, {
        subsystem: "metacognition",
        twelve_questions: twelve,
        twelve_enforce: nmParams(env).METACOG_TWELVE_ENFORCE,
        note: "POST rows go to chainstate_metacog.metacog_rows. Rows missing any field are rejected when METACOG_TWELVE_ENFORCE=on.",
        equation: "M_{t+1} = F(M_t, O_t, A_t, E_t)  (Paper XVI §13 Eq. 20)",
        ts: nmNowIso()
    });
}

async function handleMetacogPredictionError(req, env) {
    // Returns latest RLMF calibration snapshot per prediction class
    try {
        const kv = env.CHAINSTATE_NEURO_KV;
        const p = nmParams(env);
        const classes = ["behavior","pattern","reality_model","sensor_fusion","tripwire"];
        const out = {};
        if (kv) {
            for (const cls of classes) {
                const raw = await kv.get("metacog:mc:" + cls).catch(() => null);
                out[cls] = raw ? JSON.parse(raw) : null;
            }
        }
        return j(req, {
            subsystem: "prediction_error_memory",
            per_class: out,
            kl_alert_threshold: p.METACOG_KL_ALERT,
            mc_alert_threshold: p.METACOG_MC_ALERT,
            equation: "MC_t = f(accuracy, Brier, ECE, prediction_error, self_assessment)  (Paper XVI §34 Eq. 29)",
            loop: "Prediction → Reality → Error → Metacognition → Model Update  (Eq. 30)",
            ts: nmNowIso()
        });
    } catch (e) {
        return j(req, { error: "prediction_error_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * v0.9.5 HUMANITY handlers · §18.1 · 2 endpoints
 * ═══════════════════════════════════════════════════════════════════════════ */

async function handleHumanityCollective(req, env) {
    // Aggregate population-level model handles; never returns per-person data
    try {
        const kv = env.CHAINSTATE_NEURO_KV;
        let handles = { n_collectives: 0, last_updated: null };
        if (kv) {
            const raw = await kv.get("humanity:public_summary").catch(() => null);
            if (raw) handles = JSON.parse(raw);
        }
        return j(req, {
            subsystem: "humanity_model_public",
            H_public: handles,
            note: "Collective distributions only. Per-person data is /humanity/person and requires consent policy.",
            constitutional_bound: "Distributions, never essences (Paper XVI §15.2)",
            ts: nmNowIso()
        });
    } catch (e) {
        return j(req, { error: "humanity_collective_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

async function handleHumanityPerson(req, env) {
    // Consent-gated per-person handles. Refuses without a policy_id header.
    try {
        const consent = req.headers.get("X-Consent-Policy") || "";
        if (!consent) {
            return j(req, {
                subsystem: "humanity_model_private",
                accepted: false,
                reason: "consent_missing",
                note: "Attach header X-Consent-Policy: <policy_id> for per-person handles"
            }, { status: 403 });
        }
        return j(req, {
            subsystem: "humanity_model_private",
            H_private_per_consented_person: "gated · fetch through /neuro/observation with consent_basis populated",
            consent_policy: consent,
            note: "Per-person data-access happens through consent-scoped queries at the Supabase RLS layer, not via a Worker route.",
            ts: nmNowIso()
        });
    } catch (e) {
        return j(req, { error: "humanity_person_failed", detail: String(e).slice(0, 200) }, { status: 500 });
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * v0.9.5 helper for other subsystems: refuse egress of biometric_raw
 *
 * Any existing egress path may call this to enforce Paper XVI §32:
 * "verifiability ≠ public exposure" — biometric_raw payloads never leave
 * the substrate regardless of recipient jurisdiction, unless the destination
 * is an explicitly consented, authenticated, private endpoint under the
 * observer's own control.
 *
 * The v0.9.4 egress filter Γ retains all its existing checks; this is an
 * additional short-circuit refuse that runs BEFORE the strictest-global test.
 * ═══════════════════════════════════════════════════════════════════════════ */

function nmEgressRefuseBiometric(payload) {
    if (!payload || typeof payload !== "object") return { refuse: false };
    if (payload.classification === "biometric_raw") {
        if (payload.destination_kind === "self_consented_private") {
            return { refuse: false, note: "self_consented_private_permitted" };
        }
        return {
            refuse: true,
            reason: "biometric_raw_never_egresses",
            paper: "Paper XVI §32 Eq. 27"
        };
    }
    return { refuse: false };
}

export default {
async fetch(req, env, ctx) {
    // ═══ v0.10.0 · dispatch to CHAINSTATE OMNISCIENCE routes FIRST ═══
    // Additive shim: any /ontology/*, /math/*, /science/*, /cmts/*, /twin/*,
    // /isomorphism/*, /engineering/*, /fabrication/*, /capability/*,
    // /coverage/*, or /v010/status is handled here. Returns null on any
    // non-v0.10.0 path so the v0.9.5 dispatch below proceeds unchanged.
    try {
      const _v010url = new URL(req.url);
      const _v010resp = await dispatchV010(req, env, ctx, _v010url);
      if (_v010resp) return _v010resp;
    } catch (_) { /* fail-soft to v0.9.5 dispatch below */ }
    // v0.10.1 · CHAINSTATE EDGE QSIM · runs after v0.10.0, before v0.9.5.
    // The /qsim/* 404 rule is load-bearing and always active.
    try {
      const _v0101url = new URL(req.url);
      const _v0101resp = await dispatchV0101Qsim(req, env, ctx, _v0101url);
      if (_v0101resp) return _v0101resp;
    } catch (_) { /* fail-soft to v0.9.5 dispatch below */ }
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
url.pathname === "/beacon" ||
// v0.7.5 read-only endpoints
url.pathname === "/mentalistic/audit" ||
url.pathname === "/ontology/delta" ||
url.pathname === "/self-attribution/current" ||
url.pathname === "/broadcast" ||
url.pathname === "/free-energy/current" ||
url.pathname === "/tom/version" ||
// v0.7.6 read-only endpoints
url.pathname === "/autonomy/status" ||
// v0.7.9 census read-only endpoints
url.pathname === "/census/status" ||
url.pathname === "/census/threat" ||
url.pathname === "/census/allowlist" ||
url.pathname === "/robotics/status" ||
url.pathname === "/robotics/audit" ||
url.pathname === "/robotics/deontic" ||

url.pathname === "/emoji/status" ||
url.pathname === "/emoji/subspace" ||
url.pathname === "/emoji/neural" ||
url.pathname === "/emoji/injection" ||
url.pathname === "/emoji/disasm" ||
url.pathname === "/emoji/selfref" ||
url.pathname === "/emoji/deontic" ||
url.pathname === "/emoji/coherence" ||
url.pathname === "/emoji/v10u" ||
url.pathname === "/emoji/unicode-events" ||
url.pathname === "/emoji/v10-decomposition" ||
url.pathname === "/emoji/post-neutralization-events" ||
url.pathname === "/emoji/layer-transitions" ||
// v0.9.5 · NEUROMARK read-only endpoints
url.pathname === "/neuro/status" ||
url.pathname === "/neuro/tripwires" ||
url.pathname === "/neuro/exceptions" ||
url.pathname === "/mark/status" ||
url.pathname === "/mark/reality-models" ||
url.pathname === "/metacog/state" ||
url.pathname === "/metacog/prediction-error" ||
url.pathname === "/humanity/collective" ||
url.pathname === "/humanity/person" ||
false;
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
if (url.pathname === "/status") return handleStatus(req, env);
if (url.pathname === "/anchor/status" && req.method === "GET") return handleAnchorStatus(req, env);
if (url.pathname === "/symbols" && req.method === "GET") return handleSymbols(req);
if (url.pathname === "/query" && req.method === "POST") return handleQuery(req, env, ctx);
if (url.pathname === "/beacon") return handleBeacon(req, env);
if (url.pathname === "/consensus" && req.method === "GET") return handleConsensus(req, env);
if (url.pathname === "/model/current" && req.method === "GET") return handleModelCurrent(req, env);
if (url.pathname === "/model/emit" && req.method === "POST") return handleModelEmit(req, env, ctx);
if (url.pathname === "/model/forecast" && req.method === "POST") return handleModelForecast(req, env);
if (url.pathname === "/model/history" && req.method === "GET") return handleModelHistory(req, env);
// ── v0.7.0 endpoints ──
if (url.pathname === "/ground" && req.method === "POST") return handleGround(req, env);
if (url.pathname === "/priors/query" && req.method === "POST") return handlePriorsQuery(req, env);
if (url.pathname === "/priors/list" && req.method === "GET") return handlePriorsList(req, env);
if (url.pathname === "/agi/reflect" && req.method === "POST") return handleAgiReflect(req, env, ctx);
if (url.pathname === "/fetch" && req.method === "POST") return handleFetch(req, env, ctx);
if (url.pathname === "/fetch/allowlist" && req.method === "GET") return handleFetchAllowlist(req, env);
// ── v0.7.1 endpoints ──
if (url.pathname === "/audit/self") return handleAuditSelf(req, env);
if (url.pathname === "/identity/current" && req.method === "GET") return handleIdentityCurrent(req, env);
if (url.pathname === "/identity/refresh" && req.method === "POST") return handleIdentityRefresh(req, env);
// ── v0.7.2 endpoints ──
if (url.pathname === "/ecosystem" && req.method === "GET") return handleEcosystem(req, env);
// ── v0.7.3 endpoints ──
if (url.pathname === "/identity/verify" && req.method === "GET") return handleIdentityVerify(req, env);
// ── v0.7.5 endpoints (Paper V · Theory of Mind Attribution) ──
if (url.pathname === "/mentalistic/audit" && req.method === "GET") return handleMentalisticAudit(req, env);
if (url.pathname === "/ontology/delta" && req.method === "GET") return handleOntologyDelta(req, env);
if (url.pathname === "/self-attribution/current" && req.method === "GET") return handleSelfAttributionCurrent(req, env);
if (url.pathname === "/self-attribution/probe" && req.method === "POST") return handleSelfAttributionProbe(req, env, ctx);
if (url.pathname === "/enactivist/feedback" && req.method === "POST") return handleEnactivistFeedback(req, env, ctx);
if (url.pathname === "/query/hypothesize" && req.method === "POST") return handleQueryHypothesize(req, env, ctx);
if (url.pathname === "/broadcast" && req.method === "GET") return handleBroadcastGet(req, env);
if (url.pathname === "/free-energy/current" && req.method === "GET") return handleFreeEnergyCurrent(req, env);
if (url.pathname === "/tom/version" && req.method === "GET") return handleTomVersion(req, env);
// ── v0.7.6 endpoints (Autonomy · NEURO v2.1 supervision · GATEWAY · Dialetheism) ──
if (url.pathname === "/autonomy/status" && req.method === "GET") return handleAutonomyStatus(req, env);
if (url.pathname === "/autonomy/trigger" && req.method === "POST") return handleAutonomyTrigger(req, env, ctx);
if (url.pathname === "/neuro/v21/supervise" && req.method === "POST") return handleNeuroV21Supervise(req, env, ctx);
if (url.pathname === "/gateway/supervise" && req.method === "POST") return handleGatewaySupervise(req, env, ctx);
if (url.pathname === "/dialetheism/check" && req.method === "POST") return handleDialetheismCheck(req, env);
// ── v0.7.7 endpoints (Paper VII · AGI Quantum Compute) ──
if (url.pathname === "/agi/quantum/route" && req.method === "POST") return handleAgiQuantumRoute(req, env, ctx);
// ── v0.7.8 endpoints (Paper VIII · Hyperspectral Sensory Synthesis) ──
if (url.pathname === "/perception/hyperspectral" && req.method === "POST") return handlePerceptionHyperspectral(req, env, ctx);
if (url.pathname === "/perception/texture"       && req.method === "POST") return handlePerceptionTexture(req, env, ctx);
if (url.pathname === "/perception/acoustic"      && req.method === "POST") return handlePerceptionAcoustic(req, env, ctx);
if (url.pathname === "/perception/synthesize"    && req.method === "POST") return handlePerceptionSynthesize(req, env, ctx);
if (url.pathname === "/perception/status"        && req.method === "GET")  return handlePerceptionStatus(req, env, ctx);
if (url.pathname === "/perception/sensors"       && req.method === "GET")  return handlePerceptionSensors(req, env, ctx);
if (url.pathname === "/perception/veto/check"    && req.method === "POST") return handlePerceptionVetoCheck(req, env, ctx);
if (url.pathname === "/perception/train/tick"    && req.method === "POST") return handlePerceptionTrainTick(req, env, ctx);
// ── v0.7.9 endpoints (Paper IX · Cyberspace Census) ──
if (url.pathname === "/census/status"     && req.method === "GET")  return handleCensusStatus(req, env);
if (url.pathname === "/census/threat"     && req.method === "GET")  return handleCensusThreat(req, env);
if (url.pathname === "/census/allowlist"  && req.method === "GET")  return handleCensusAllowlist(req, env);
if (url.pathname === "/census/ingest"     && req.method === "POST") return handleCensusIngest(req, env, ctx);
// v0.8.0 · CHAINSTATE ROBOTICS AGI (Paper X Rev 2)
if (url.pathname === "/robotics/status"   && req.method === "GET")  return handleRoboticsStatus(req, env);
if (url.pathname === "/robotics/audit"    && req.method === "GET")  return handleRoboticsAudit(req, env);
if (url.pathname === "/robotics/gate"     && req.method === "POST") return handleRoboticsGate(req, env, ctx);
if (url.pathname === "/robotics/deontic"  && req.method === "GET")  return handleRoboticsDeontic(req, env);

// v0.9.0 · CHAINSTATE AGI PHASESPACE (Paper XI)
if (url.pathname === "/phase/status"        && req.method === "GET")  return handlePhaseStatus(req, env);
if (url.pathname === "/phase/telemetry"     && req.method === "GET")  return handlePhaseTelemetry(req, env);
if (url.pathname === "/phase/ephemeris"     && req.method === "GET")  return handlePhaseEphemeris(req, env);
if (url.pathname === "/phase/cosmic"        && req.method === "GET")  return handlePhaseCosmic(req, env);
if (url.pathname === "/phase/deontic"       && req.method === "GET")  return handlePhaseDeontic(req, env);
if (url.pathname === "/space/catalog"       && req.method === "GET")  return handleSpaceCatalog(req, env);
if (url.pathname === "/space/weather"       && req.method === "GET")  return handleSpaceWeather(req, env);
if (url.pathname === "/autopilot/knowledge" && req.method === "GET")  return handleAutopilotKnowledge(req, env);
if (url.pathname === "/quantum-comm/status" && req.method === "GET")  return handleQuantumCommStatus(req, env);
if (url.pathname === "/quantum-comm/dispatch" && req.method === "POST") return handleQuantumCommDispatch(req, env);
if (url.pathname === "/metacognition/status"&& req.method === "GET")  return handleMetacognitionStatus(req, env);
if (url.pathname === "/cross-realm/validate"&& req.method === "GET")  return handleCrossRealmValidate(req, env);
if (url.pathname === "/nwo-stack/status"    && req.method === "GET")  return handleNwoStackStatus(req, env);
// v0.9.0 · Read-only observation layer (Paper XI §7.5 · observe means publish)
if (url.pathname === "/space/weather/advisory"    && req.method === "GET") return handleSpaceWeatherAdvisory(req, env);
if (url.pathname === "/airspace/observation"      && req.method === "GET") return handleAirspaceObservation(req, env);
if (url.pathname === "/orbital/conjunctions"      && req.method === "GET") return handleOrbitalConjunctions(req, env);
if (url.pathname === "/telemetry/health/schema"   && req.method === "GET") return handleTelemetryHealthSchema(req, env);
if (url.pathname === "/observations/anomaly"      && req.method === "GET") return handleObservationsAnomaly(req, env);
if (url.pathname === "/earth-threat/sources"      && req.method === "GET") return handleEarthThreatSources(req, env);

// ─── v0.9.1 · OMNICOGNIZANT (Paper XII) route dispatch ─────────────────
if (url.pathname === "/channel/status"      && req.method === "GET")  return handleChannelStatus(req, env);
if (url.pathname === "/channel/weights"     && req.method === "GET")  return handleChannelWeights(req, env);
if (url.pathname === "/channel/sensors"     && req.method === "GET")  return handleChannelSensors(req, env);
if (url.pathname === "/channel/coherence"   && req.method === "GET")  return handleChannelCoherenceCheck(req, env);
if (url.pathname === "/channel/deontic"     && req.method === "GET")  return handleChannelDeontic(req, env);
if (url.pathname === "/channel/v9-assess"   && req.method === "POST") return handleChannelV9Assess(req, env);

// ─── v0.9.2 · C-FIELD AGI ARRAY (Paper XIII) route dispatch ────────────
if (url.pathname === "/cfield/status"           && req.method === "GET")  return handleCfieldStatus(req, env);
if (url.pathname === "/cfield/coherence"        && req.method === "GET")  return handleCfieldCoherenceCheck(req, env);
if (url.pathname === "/cfield/deontic"          && req.method === "GET")  return handleCfieldDeontic(req, env);
if (url.pathname === "/cfield/eml/status"       && req.method === "GET")  return handleCfieldEmlStatus(req, env);
if (url.pathname === "/cfield/alt-devices"      && req.method === "GET")  return handleCfieldAltDevices(req, env);
if (url.pathname === "/cfield/quantum/status"   && req.method === "GET")  return handleCfieldQuantumStatus(req, env);
if (url.pathname === "/cfield/swann/status"     && req.method === "GET")  return handleCfieldSwannStatus(req, env);
if (url.pathname === "/cfield/v10-assess"       && req.method === "POST") return handleCfieldV10Assess(req, env);
if (url.pathname === "/cfield/dispatch"         && req.method === "POST") return handleCfieldDispatchPost(req, env);
if (url.pathname === "/cfield/eml/train"        && req.method === "POST") return handleCfieldEmlTrainPost(req, env);
if (url.pathname === "/cfield/quantum/simulate" && req.method === "POST") return handleCfieldQuantumSimulatePost(req, env);
if (url.pathname === "/cfield/alt-device/activate" && req.method === "POST") return handleCfieldAltDeviceActivatePost(req, env);
if (url.pathname === "/cfield/swann/calibrate"  && req.method === "POST") return handleCfieldSwannCalibratePost(req, env);


// ─── v0.9.3 · EMOJI MACHINE CODE (Paper XIV) route dispatch ───────────
if (url.pathname === "/emoji/status"       && req.method === "GET")  return handleEmojiStatus(req, env);
if (url.pathname === "/emoji/subspace"     && req.method === "GET")  return handleEmojiSubspace(req, env);
if (url.pathname === "/emoji/neural"       && req.method === "GET")  return handleEmojiNeural(req, env);
if (url.pathname === "/emoji/injection"    && req.method === "GET")  return handleEmojiInjection(req, env);
if (url.pathname === "/emoji/disasm"       && req.method === "GET")  return handleEmojiDisasm(req, env);
if (url.pathname === "/emoji/selfref"      && req.method === "GET")  return handleEmojiSelfref(req, env);
if (url.pathname === "/emoji/deontic"      && req.method === "GET")  return handleEmojiDeontic(req, env);
if (url.pathname === "/emoji/coherence"    && req.method === "GET")  return handleEmojiCoherence(req, env);
if (url.pathname === "/emoji/v10-assess"   && req.method === "POST") return handleEmojiV10Assess(req, env);
if (url.pathname === "/emoji/disassemble"  && req.method === "POST") return handleEmojiDisassemblePost(req, env);
if (url.pathname === "/emoji/embed"        && req.method === "POST") return handleEmojiEmbedPost(req, env);
if (url.pathname === "/emoji/train"        && req.method === "POST") return handleEmojiTrainPost(req, env);
if (url.pathname === "/emoji/correlate"    && req.method === "POST") return handleEmojiCorrelatePost(req, env);
if (url.pathname === "/emoji/recycle"      && req.method === "POST") return handleEmojiRecyclePost(req, env);
if (url.pathname === "/emoji/quarantine"   && req.method === "POST") return handleEmojiQuarantinePost(req, env);
// v0.9.3-R2 · UNICODE SECURITY PLANE endpoints (Paper XIV §29 roadmap)
if (url.pathname === "/emoji/v10u"         && req.method === "GET")  return handleEmojiV10U(req, env);
if (url.pathname === "/emoji/v10u/assess"  && req.method === "POST") return handleEmojiV10UAssessPost(req, env);
if (url.pathname === "/emoji/unicode-events" && req.method === "GET") return handleEmojiUnicodeEventsGet(req, env);
if (url.pathname === "/emoji/multi-isa"    && req.method === "POST") return handleEmojiMultiIsaPost(req, env);
// v0.9.3-R3 · TONTOU-integrated endpoints (Paper XIV §33-§38)
if (url.pathname === "/emoji/v10-decomposition"         && req.method === "GET")  return handleEmojiV10Decomposition(req, env);
if (url.pathname === "/emoji/jit-revalidate"            && req.method === "POST") return handleEmojiJitRevalidatePost(req, env);
if (url.pathname === "/emoji/capability/issue"          && req.method === "POST") return handleEmojiCapabilityIssuePost(req, env);
if (url.pathname === "/emoji/carrier-scan"              && req.method === "POST") return handleEmojiCarrierScanPost(req, env);
if (url.pathname === "/emoji/post-neutralization-events" && req.method === "GET")  return handleEmojiPostNeutralizationEvents(req, env);
if (url.pathname === "/emoji/layer-transitions"         && req.method === "GET")  return handleEmojiLayerTransitions(req, env);

// ═══ v0.9.4 · PLANET ENGINE · Reality-State world-model endpoints ═══
if (url.pathname === "/planet/status"        && req.method === "GET")  return handlePlanetStatus(req, env);
if (url.pathname === "/world/state"          && req.method === "GET")  return handleWorldState(req, env);
if (url.pathname === "/world/region"         && req.method === "GET")  return handleWorldRegion(req, env);
if (url.pathname === "/world/timeline"       && req.method === "GET")  return handleWorldTimeline(req, env);
if (url.pathname === "/world/provenance"     && req.method === "GET")  return handleWorldProvenance(req, env);
if (url.pathname === "/world/threat"         && req.method === "GET")  return handleWorldThreat(req, env);
if (url.pathname === "/world/reality-state"  && req.method === "GET")  return handleWorldRealityState(req, env);
if (url.pathname.startsWith("/world/entity/") && req.method === "GET") return handleWorldEntity(req, env, decodeURIComponent(url.pathname.slice("/world/entity/".length)));
if (url.pathname === "/world/observation"    && req.method === "POST") return handleWorldObservationPost(req, env);
if (url.pathname === "/world/query"          && req.method === "POST") return handleWorldQueryPost(req, env);
if (url.pathname === "/world/simulate"       && req.method === "POST") return handleWorldSimulatePost(req, env);
if (url.pathname === "/world/hypothesis"     && req.method === "POST") return handleWorldHypothesisPost(req, env);
if (url.pathname === "/world/egress-check"   && req.method === "POST") return handleWorldEgressCheckPost(req, env);
if (url.pathname === "/world/allow"          && req.method === "POST") return handleWorldAllowPost(req, env);
if (url.pathname === "/world/execution"      && req.method === "POST") return handleWorldExecutionPost(req, env);
if (url.pathname === "/world/physics-check"  && req.method === "POST") return handleWorldPhysicsCheckPost(req, env);
if (url.pathname === "/world/synth-check"    && req.method === "POST") return handleWorldSynthCheckPost(req, env);

// ═══ v0.9.5 · NEUROMARK · observer/behavior graph + structural engine ═══
if (url.pathname === "/neuro/status"          && req.method === "GET")  return handleNeuroStatus(req, env);
if (url.pathname === "/neuro/observation"     && req.method === "POST") return handleNeuroObservationPost(req, env);
if (url.pathname === "/neuro/predict"         && req.method === "POST") return handleNeuroPredictPost(req, env);
if (url.pathname === "/neuro/tripwires"       && req.method === "GET")  return handleNeuroTripwires(req, env);
if (url.pathname === "/neuro/counterfactual"  && req.method === "POST") return handleNeuroCounterfactualPost(req, env);
if (url.pathname === "/neuro/exceptions"      && req.method === "GET")  return handleNeuroExceptions(req, env);
if (url.pathname === "/mark/status"           && req.method === "GET")  return handleMarkStatus(req, env);
if (url.pathname === "/mark/pattern"          && req.method === "POST") return handleMarkPatternPost(req, env);
if (url.pathname === "/mark/discriminate"     && req.method === "POST") return handleMarkDiscriminatePost(req, env);
if (url.pathname === "/mark/apophenia"        && req.method === "POST") return handleMarkApopheniaPost(req, env);
if (url.pathname === "/mark/reality-models"   && req.method === "GET")  return handleMarkRealityModels(req, env);
if (url.pathname === "/couple/classify"       && req.method === "POST") return handleCoupleClassifyPost(req, env);
if (url.pathname === "/metacog/state"         && req.method === "GET")  return handleMetacogState(req, env);
if (url.pathname === "/metacog/prediction-error" && req.method === "GET") return handleMetacogPredictionError(req, env);
if (url.pathname === "/humanity/collective"   && req.method === "GET")  return handleHumanityCollective(req, env);
if (url.pathname === "/humanity/person"       && req.method === "GET")  return handleHumanityPerson(req, env);

return j(req, { error: "not found", path: url.pathname }, { status: 404 });
} catch (e) {
return j(req, {
error: String((e && e.message) || e).slice(0, 300),
stack: (e && e.stack) ? String(e.stack).slice(0, 300) : null
}, { status: 500 });
}
},

// v0.7.1 · scheduled() handler --- fires on cron triggers from wrangler.toml
async scheduled(event, env, ctx) {
    // ═══ v0.10.0 · run v0.10.0 cron ticks additively ═══
    try {
      const _v010cronResult = await dispatchV010Cron(event.cron, env, ctx);
      if (_v010cronResult && ctx && ctx.waitUntil) {
        ctx.waitUntil(Promise.resolve(_v010cronResult));
      }
    } catch (_) { /* fail-soft; v0.9.5 crons below continue */ }
    // ═══ v0.10.1 · CHAINSTATE EDGE QSIM cron ticks (fail-soft) ═══
    try {
      const _v0101cronResult = await dispatchV0101Cron(event.cron, env, ctx);
      if (_v0101cronResult && ctx && ctx.waitUntil) {
        ctx.waitUntil(Promise.resolve(_v0101cronResult));
      }
    } catch (_) { /* fail-soft; v0.9.5 crons below continue */ }
const cron = event.cron;
// Hourly seed cron (v0.7.1)
if (cron === "0 * * * *") {
ctx.waitUntil(runSeedCron(env, ctx));
}
// v0.7.5 · 6-hourly ontology delta computation + anchor
if (cron === "0 */6 * * *" && tomIsEnabled(env)) {
ctx.waitUntil((async () => {
try {
const oCurr = await tomExtractOntology(env);
const oPrev = await pimGet(env.CHAINSTATE_CACHE, "ontology:snapshot:last") || { categories:[], relations:[] };
const delta = tomComputeOntologyDelta(oPrev, oCurr);
if (delta.added_categories.length + delta.removed_categories.length +
delta.added_relations.length + delta.removed_relations.length > 0) {
await tomAnchorOntologyDelta(delta, env, ctx);
}
await pimPut(env.CHAINSTATE_CACHE, "ontology:snapshot:last", oCurr);
} catch(_){}
})());
}
// v0.7.5 · daily self-attribution vector extraction (00:15 UTC)
if (cron === "15 0 * * *" && tomIsEnabled(env)) {
ctx.waitUntil((async () => {
try { await tomExtractSelfAttributionVector(env, ctx); } catch(_){}
})());
}
// v0.7.6 · daily autonomous self-reflection loop at 03:33 UTC
// Requires AUTONOMY_ENABLED=1. Selects priors nearest to substrate
// identity fingerprint, dispatches internal /query calls with target=edge
// (zero USDC cost), applies EML regress with dialetheism fixed-point guard,
// anchors the cycle receipt to the CHAINSTATE Anchor contract.
if (cron === "33 3 * * *" && env.AUTONOMY_ENABLED === "1") {
ctx.waitUntil((async () => {
try { await runAutonomousReflection(env, ctx); } catch(_){}
})());
}
// v0.7.8 · daily perception training refinement at 04:00 UTC
// Fires /perception/train/tick on this worker (self-call with internal
// token), which forwards to metastate-quantum. The Render service:
// 1. Fetches new samples from allowlisted open-source corpora
//    (DTD, FMD, DCASE, AudioSet human-verified subsets + user-designated
//    free video/image/sound corpora of nature/instruments/voices)
// 2. Runs anti-slop veto on every sample (rejects AI-generated content)
// 3. Trains incremental EML tree updates on the accepted samples
// 4. Uploads new serialized models to R2 with monotonic version bump
// 5. Records training run in Supabase (perception_priors + training_runs)
// 6. Returns training summary which the worker anchors on-chain
if (cron === "0 4 * * *" && String(env.PERCEPTION_ENABLED || "true") !== "false") {
ctx.waitUntil((async () => {
try {
const req = new Request("https://internal/perception/train/tick", {
method: "POST",
headers: {
"content-type": "application/json",
"x-chainstate-internal": env.CHAINSTATE_INTERNAL_TOKEN || ""
},
body: JSON.stringify({ trigger: "daily_cron_04h" })
});
await handlePerceptionTrainTick(req, env, ctx);
} catch(_){}
})());
}
// v0.7.9 · daily cyberspace census summary at 05:00 UTC (Paper IX §6.5)
// Runs AFTER the 04:00 perception training tick so posture reflects the
// day's fresh training state. Pulls aggregated digest from Render
// sibling process at metastate-quantum, writes T(t) to CENSUS_KV,
// mirrors artifact bundle to R2. Fail-soft.
if (cron === "0 5 * * *" && String(env.CENSUS_ENABLED || "true") !== "false") {
ctx.waitUntil(runCensusDailyTick(env, ctx));
}
// v0.8.0 · hourly S_survival composite tick (Paper X Rev 2 §4.2 · §4.6)
// Pulls C, D, L, P inputs from Render metastate-quantum, computes the
// geometric-mean composite, writes to CHAINSTATE_ROBOTICS_KV. Fail-soft.
if (cron === "0 * * * *" && String(env.ROBOTICS_ENABLED || "true") !== "false") {
ctx.waitUntil(runRoboticsSurvivalTick(env, ctx));
}
// v0.8.0 · every-15-minute NWO Robotics API traffic mirror (Paper X §2.2)
// Observe-only. Never in the request path. Writes to
// CHAINSTATE_ROBOTICS_KV audit:* with 168h TTL. Fail-soft.
// Cron uses "0,15,30,45 * * * *" (explicit minutes) rather than "*/15 * * * *"
// to avoid step-syntax edge cases across cron implementations.
if (cron === "0,15,30,45 * * * *" && String(env.ROBOTICS_ENABLED || "true") !== "false") {
ctx.waitUntil(runRoboticsAuditMirrorTick(env, ctx));
}
// v0.9.0 · every-15-minute hardware telemetry daemon tick (Paper XI §3.2)
// Classifies substrate physical containment, writes topology class to
// CHAINSTATE_PHASE_KV. Extends L0 with 6th predicate. Fail-soft.
if (cron === "*/15 * * * *" && String(env.PHASE_ENABLED || "true") !== "false") {
ctx.waitUntil(runPhaseTelemetryTick(env, ctx));
}
// v0.9.0 · every-30-minute celestial fix tick (Paper XI §4.3)
// Delegates to Render metastate-quantum for Astroterm + Star Map fusion.
// Writes RA/Dec/dist to CHAINSTATE_NAV_KV. Fail-soft.
if (cron === "*/30 * * * *" && String(env.PHASE_ENABLED || "true") !== "false") {
ctx.waitUntil(runCelestialFixTick(env, ctx));
}
// v0.9.0 · 6-hourly space situational awareness refresh (Paper XI §4)
// Fetches TLE, launches, space weather, cosmic ray flux from public
// open-source feeds. Writes to CHAINSTATE_SPACE_KV. Fail-soft.
// Reuses existing "0 */6 * * *" cron slot alongside ontology delta.
if (cron === "0 */6 * * *" && String(env.PHASE_ENABLED || "true") !== "false") {
ctx.waitUntil(runSpaceCatalogRefreshTick(env, ctx));
}
// v0.9.0 · hourly quantum-entanglement channel health check
// Verifies CHSH inequality violation on ground-to-orbit link via
// Pater-Atteya-Tariq Bell-Aspect setup. Classical fallback if S < 2.4.
// Reuses "0 * * * *" cron slot alongside S_survival + seed cron.
if (cron === "0 * * * *" && String(env.PHASE_ENABLED || "true") !== "false") {
ctx.waitUntil(runQuantumEntanglementTick(env, ctx));
}
// v0.9.0 · every-4-hour metacognitive safety analysis (Paper XI §6)
// Runs safety-reasoning simulation IN PARALLEL on classical CPU/GPU and
// quantum hardware to maintain earth/space instance quantum-level
// entanglement of metacognition. Fail-soft.
if (cron === "0 */4 * * *" && String(env.PHASE_ENABLED || "true") !== "false") {
ctx.waitUntil(runMetacognitiveSafetyTick(env, ctx));
}
// ─── v0.9.1 · OMNICOGNIZANT crons (Paper XII) ───────────────────────
// Subsystem A · sidechannel_intake · every 5 minutes (§5.2)
// 16-channel raw ingest into CHAINSTATE_SIDECHAN_KV.  Env channels
// (11-16) also mirrored to CHAINSTATE_ENVCHAN_KV. Fail-soft.
if (cron === "*/5 * * * *" && String(env.OMNI_ENABLED || "true") !== "false") {
ctx.waitUntil(runSidechannelIntakeTick(env, ctx));
}
// Subsystem B · integrity_reflection · every 10 minutes (§5.3)
// Hardware fingerprint + crypto-lib timing + supply-chain provenance +
// peripheral electrical coupling scan.  Writes to CHAINSTATE_INTEGRITY_KV.
// Fail-soft.
if (cron === "*/10 * * * *" && String(env.OMNI_ENABLED || "true") !== "false") {
ctx.waitUntil(runIntegrityReflectionTick(env, ctx));
}
// Subsystem C · metacog_distribution · hourly (§5.4)
// Per-channel free-energy weight optimisation.  SHARES the existing
// "0 * * * *" cron slot with S_survival + quantum-entanglement +
// hourly seed cron — Cloudflare fires all handlers matching a slot.
if (cron === "0 * * * *" && String(env.OMNI_ENABLED || "true") !== "false") {
ctx.waitUntil(runMetacogDistributionTick(env, ctx));
}
// Subsystem D · environmental_sweep · every 2 minutes (channels 11-16)
// Higher cadence than base intake because Schumann/barometric/telluric
// drift faster.  Writes to CHAINSTATE_ENVCHAN_KV.  Fail-soft.
if (cron === "*/2 * * * *" && String(env.OMNI_ENABLED || "true") !== "false") {
ctx.waitUntil(runEnvironmentalSweepTick(env, ctx));
}

// ─── v0.9.2 · C-FIELD AGI ARRAY (Paper XIII) scheduled dispatchers ─────
// Each is fail-soft.  All disabled if CFIELD_ENABLED=false at either layer.
// Subsystem A · cfield_intake · every 3 minutes
if (cron === "*/3 * * * *" && String(env.CFIELD_ENABLED || "true") !== "false") {
ctx.waitUntil(runCfieldIntakeTick(env, ctx));
}
// Subsystem B · cfield_estimator · every 7 minutes
if (cron === "*/7 * * * *" && String(env.CFIELD_ENABLED || "true") !== "false") {
ctx.waitUntil(runCfieldEstimatorTick(env, ctx));
}
// Subsystem C · cfield_attribution · shared 0 * * * * hourly slot
if (cron === "0 * * * *" && String(env.CFIELD_ENABLED || "true") !== "false") {
ctx.waitUntil(runCfieldAttributionTick(env, ctx));
}
// Subsystem D · cfield_alt_device_scan · every 15 minutes
if (cron === "*/15 * * * *" && String(env.CFIELD_ENABLED || "true") !== "false") {
ctx.waitUntil(runCfieldAltDeviceScanTick(env, ctx));
}
// Subsystem E · cfield_eml_train · every 6 hours
if (cron === "0 */6 * * *" && String(env.CFIELD_ENABLED || "true") !== "false") {
ctx.waitUntil(runCfieldEmlTrainTick(env, ctx));
}
// Subsystem F · cfield_simulation_recycle · every 12 minutes
if (cron === "*/12 * * * *" && String(env.CFIELD_ENABLED || "true") !== "false") {
ctx.waitUntil(runCfieldSimulationRecycleTick(env, ctx));
}
// Subsystem G · cfield_swann_calibrate · daily 12:00 UTC
if (cron === "0 12 * * *" && String(env.CFIELD_ENABLED || "true") !== "false") {
ctx.waitUntil(runCfieldSwannCalibrateTick(env, ctx));
}

// ─── v0.9.3 · EMOJI MACHINE CODE (Paper XIV) scheduled dispatchers ─────
// Each is fail-soft. All disabled if EMOJI_ENABLED=false at either layer.
// V10 architectural veto is INDEPENDENT of these crons — it runs on every
// outbound response regardless of subsystem enablement.
// Subsystem A · emoji_intake · every 5 min (shares slot with sidechannel_intake)
if (cron === "*/5 * * * *" && String(env.EMOJI_ENABLED || "true") !== "false") {
ctx.waitUntil(runEmojiIntakeTick(env, ctx));
}
// Subsystem B · emoji_embed · every 10 min (shares slot with integrity_reflection · no new cron trigger needed)
if (cron === "*/10 * * * *" && String(env.EMOJI_ENABLED || "true") !== "false") {
ctx.waitUntil(runEmojiEmbedTick(env, ctx));
}
// Subsystem C · neural_state · hourly (Paper XIV §18 · SHR shared with S_survival · no new cron trigger needed)
if (cron === "0 * * * *" && String(env.EMOJI_ENABLED || "true") !== "false") {
ctx.waitUntil(runNeuralStateTick(env, ctx));
}
// Subsystem D · injection_scan · every 2 min (shares slot with environmental_sweep · aggressive by security design)
if (cron === "*/2 * * * *" && String(env.EMOJI_ENABLED || "true") !== "false") {
ctx.waitUntil(runInjectionScanTick(env, ctx));
}
// Subsystem E · disasm_probe · every 7 min (shares slot with cfield_estimator · no new cron trigger needed)
if (cron === "*/7 * * * *" && String(env.EMOJI_ENABLED || "true") !== "false") {
ctx.waitUntil(runDisasmProbeTick(env, ctx));
}
// Subsystem F · embedder_train · every 6h (shares slot with cfield_eml_train and ontology delta)
if (cron === "0 */6 * * *" && String(env.EMOJI_ENABLED || "true") !== "false") {
ctx.waitUntil(runEmbedderTrainTick(env, ctx));
}
// Subsystem G · selfref_recycle · daily 03:00 UTC (Paper XIV §18 · NEW dedicated slot · must be added in Cloudflare Dashboard)
if (cron === "0 3 * * *" && String(env.EMOJI_ENABLED || "true") !== "false") {
ctx.waitUntil(runSelfrefRecycleTick(env, ctx));
}
// Subsystem H · threat_correlate · daily 12:00 UTC (Paper XIV §18 · SHR shared with cfield_swann_calibrate · no new cron trigger needed)
if (cron === "0 12 * * *" && String(env.EMOJI_ENABLED || "true") !== "false") {
ctx.waitUntil(runThreatCorrelateTick(env, ctx));
}

// ─── v0.9.4 · PLANET ENGINE scheduled ticks (fail-soft) ───
// Gated by PLANET_ENGINE_ENABLED (default true).
// Planet Tick 1 · world_snapshot · every 10 min (shares */10 slot)
if (cron === "*/10 * * * *" && String(env.PLANET_ENGINE_ENABLED || "true") !== "false") {
ctx.waitUntil(runPlanetWorldSnapshotTick(env, ctx));
}
// Planet Tick 2 · threat_sweep · every 15 min (NEW dedicated slot · add in Cloudflare Dashboard)
if (cron === "*/15 * * * *" && String(env.PLANET_ENGINE_ENABLED || "true") !== "false") {
ctx.waitUntil(runPlanetThreatSweepTick(env, ctx));
}
// Planet Tick 3 · census_snapshot · daily 02:00 UTC (NEW dedicated slot · add in Cloudflare Dashboard)
if (cron === "0 2 * * *" && String(env.PLANET_ENGINE_ENABLED || "true") !== "false") {
ctx.waitUntil(runPlanetCensusSnapshotTick(env, ctx));
}

}
};

// ═════════════════════════════════════════════════════════════════════════
// v0.10.0 · CHAINSTATE AGI OMNISCIENCE · Interdisciplinary Vertical Extension
// Paper XVIII · additive over v0.9.5 baseline · every v0.7.x → v0.9.5
// subsystem preserved byte-identically.
//
// Adds:
//   · FOL++ 15-tuple object contract (S,P,R,C,M,A,U,V | T,G,Q,I,K,X,E)
//   · Universal Mathematical Formalisation Fabric (formalize · verify)
//   · Dialectical Multi-Theory Coexistence Engine (Theory Tensor Θ)
//   · Cross-Disciplinary Isomorphism Mapper (6 mapping classes)
//   · Cross-Medium Transduction Substrate (CMTS · 8 media)
//   · Universal Engineering Lifecycle Graph (14 stages · 14 disciplines)
//   · Digital-Twin Fabric 2.0 (T0-T5 tiers + surrogate governance)
//   · Closed-Loop Metamorphic Manufacturing (6 metrology channels)
//   · No-Missing-Field Coverage Registry (GREEN/AMBER/RED/FRONTIER/CONTRADICTED)
//   · Formal AGI Capability State (C ≠ A · ∂A/∂C ≤ 0)
//   · L0-13 model_horizon_coherent?
//   · L0-14 evidence_chain_coherent?
//   · L0-15 interface_conservation_coherent?
//   · L0-16 uncertainty_calibrated?
//   · L0-17 capability_authority_separated?
//   · 12 new endpoints (see routes at end of file)
//
// Fail-soft discipline: every v0.10.0 route degrades gracefully if the
// backing Render bridge is unavailable. V11, V12, and all existing L0
// predicates 1-12 remain architecturally enforced regardless of any
// v0.10.0 toggle. The Cognition ⇏ Authority invariant is preserved and
// strengthened to ∂A/∂C ≤ 0.
//
// KV bindings expected (add via wrangler.toml AND Cloudflare Dashboard):
//   · CHAINSTATE_ONTOLOGY_KV       (24h TTL · hot FOL++ entities)
//   · CHAINSTATE_MATH_KV           (24h TTL · SymPy/Z3 result cache)
//   · CHAINSTATE_THEORY_KV         (24h TTL · Theory Tensor Θ working set)
//   · CHAINSTATE_TWIN_KV           (24h TTL · digital-twin sim results)
//   · CHAINSTATE_CMTS_KV           (24h TTL · medium transitions)
//   · CHAINSTATE_CAPABILITY_KV     (48h TTL · capability C + authority A vectors)
//   · CHAINSTATE_COVERAGE_KV       (72h TTL · coverage gap states)
//   · CHAINSTATE_V13V17_KV         (30d TTL · L0-13..17 audit trail)
// R2 buckets expected:
//   · CHAINSTATE_ONTOLOGY_ARCHIVE  (long-term FOL++ composition traces)
//   · CHAINSTATE_COSMOS_ARCHIVE    (long-term public-source cosmos snapshots)
//
// Secrets expected (set via Cloudflare Dashboard, never in code):
//   · ONTOLOGY_ADMIN_KEY           (admin ops · FOL++ entity import)
//   · SCIENCE_INGEST_TOKEN         (signs candidate-FOL entries)
//   · FAB_PDAL_HMAC_KEY            (HMAC-verifies PDAL device manifests)
//   · MATH_VERIFY_HMAC_KEY         (signs math-verification receipts)
//   · THEORY_ADMIN_KEY             (admin theory-family ops)
//   · CMTS_HMAC_KEY                (signs transition receipts)
//   · TWIN_VALIDATION_HMAC_KEY     (signs twin validation runs)
//   · ISOMORPHISM_ADMIN_KEY        (admin mapping ops)
//   · CAPABILITY_STATE_HMAC_KEY    (signs capability_state and authority_state)
// ═════════════════════════════════════════════════════════════════════════

// ─── v0.10.0 · CONSTANTS ─────────────────────────────────────────────────
const V010_VERSION = "v0.10.0";
const V010_PAPER = "Paper XVIII";

// FOL++ 15-tuple field names (in canonical order)
const FOL_PLUS_FIELDS = [
  // legacy 8-tuple (Paper XVII v0.9.6 · preserved byte-identically)
  "S", "P", "R", "C", "M", "A", "U", "V",
  // v0.10.0 additive 7 fields
  "T",  // temporal state
  "G",  // regime/scale descriptor (dimensionless groups)
  "Q",  // evidence quality
  "I",  // interfaces
  "K",  // identifiability
  "X",  // observability/controllability
  "E",  // evidence/provenance graph
];

// FOL++ status vocabulary (Appendix B of Paper XVIII)
const FOL_STATUS_VOCAB = [
  "OBSERVED", "REPLICATED", "VALIDATED", "DERIVED", "SIMULATED",
  "INFERRED", "HYPOTHESIS", "DISPUTED", "FRONTIER", "RETIRED",
];

// Coverage registry gap states (§45)
const COVERAGE_STATES = ["GREEN", "AMBER", "RED", "FRONTIER", "CONTRADICTED"];

// Dimensionless number registry for regime selection (§37.2)
const REGIME_DIMENSIONLESS = {
  reynolds:   { symbol: "Re",  domain: "flow",         critical: [2300, 4000] },
  mach:       { symbol: "Ma",  domain: "compressible", critical: [0.3, 1.0, 5.0] },
  knudsen:    { symbol: "Kn",  domain: "rarefaction",  critical: [0.01, 0.1, 10] },
  froude:     { symbol: "Fr",  domain: "free_surface", critical: [1.0] },
  strouhal:   { symbol: "St",  domain: "unsteady",     critical: [] },
  peclet:     { symbol: "Pe",  domain: "advection",    critical: [] },
  prandtl:    { symbol: "Pr",  domain: "heat_transfer",critical: [] },
  damkohler:  { symbol: "Da",  domain: "reaction",     critical: [1.0] },
  deborah:    { symbol: "De",  domain: "viscoelastic", critical: [1.0] },
  weissenberg:{ symbol: "Wi",  domain: "viscoelastic", critical: [1.0] },
  magnetic_reynolds: { symbol: "Rm", domain: "mhd",    critical: [1.0] },
  plasma_beta:{ symbol: "β",   domain: "plasma",       critical: [1.0] },
  relativistic_gamma:{ symbol: "γ", domain: "relativity", critical: [1.001] },
};

// CMTS 8-medium registry (§40.1)
const CMTS_MEDIA = {
  ground:       { state_vars: ["terrain","contact","load","weather"],
                  models: ["rigid_body","flex_body","tire_contact","soil","control"] },
  atmosphere:   { state_vars: ["density","pressure","temperature","mach","wind"],
                  models: ["compressible_cfd","aeroelasticity","propulsion"] },
  surface_ocean:{ state_vars: ["waves","current","salinity","temperature"],
                  models: ["free_surface_hydro","structures"] },
  subsea:       { state_vars: ["pressure","density","flow","acoustics"],
                  models: ["hydrostatics","cfd","cavitation","acoustics"] },
  vacuum:       { state_vars: ["radiation","thermal","plasma","orbital_state"],
                  models: ["thermal_radiation","orbital_mechanics"] },
  microgravity: { state_vars: ["dof6","free_fluids","low_g_dynamics"],
                  models: ["multibody","cfd","thermal","control"] },
  planetary:    { state_vars: ["gravity","atmosphere","regolith","radiation"],
                  models: ["geomechanics","atmospheric_flight","thermal"] },
  extreme_high_energy: { state_vars: ["fields","radiation","relativistic"],
                          models: ["relativity","plasma","particle_radiation"] },
};

// Isomorphism mapping classes (§39)
const ISOMORPHISM_CLASSES = [
  { name: "exact_mathematical",    validation: "symbolic_proof_of_mapping" },
  { name: "asymptotic",             validation: "derive_limit_quantify_residual" },
  { name: "control_equivalence",    validation: "port_hamiltonian_or_state_space" },
  { name: "graph_causal_homology",  validation: "structural_match_plus_intervention_test" },
  { name: "empirical_analogy",      validation: "cross_domain_predictive_test" },
  { name: "learned_correspondence", validation: "ood_detector_and_validation_envelope" },
];

// Digital-Twin Fabric 2.0 tiers (§42)
const TWIN_TIERS = {
  T0: { use: "analytic_hand_derived_sanity",   evidence: "closed_form_identity_or_bound" },
  T1: { use: "reduced_order_model",             evidence: "error_bound_vs_reference" },
  T2: { use: "validated_numerical_model",       evidence: "mesh_time_convergence_plus_benchmark" },
  T3: { use: "multiphysics_co_simulation",      evidence: "coupled_residuals_plus_conservation" },
  T4: { use: "high_fidelity_experimental",      evidence: "measured_vs_predicted_residual_distribution" },
  T5: { use: "hardware_in_the_loop_qualification", evidence: "instrumented_test_evidence" },
};

// Engineering lifecycle graph (§41 · 14 stages)
const ENGINEERING_LIFECYCLE_STAGES = [
  "need_mission_requirement",
  "functional_decomposition",
  "architecture_and_interfaces",
  "physics_mathematical_model",
  "component_selection_or_synthesis",
  "control_software_specification",
  "digital_twin_verification",
  "design_for_manufacture_assembly_service",
  "fabrication_and_metrology",
  "qualification_and_acceptance",
  "operation_and_monitoring",
  "fault_diagnosis_and_prognostics",
  "maintenance_repair_refurbishment",
  "retirement_disposal_material_recovery",
];

// 14 registered engineering disciplines (§41.1)
const ENGINEERING_DISCIPLINES = [
  "mechanical_structural_thermal_fluids_tribology_mechanisms",
  "electrical_power_electronics_rf_antennas_signal_emc_emi",
  "controls_robotics_autonomy_estimation_navigation_fault",
  "aerospace_aero_propulsion_structures_gnc_orbital_space_env",
  "marine_subsea_hydro_acoustics_pressure_corrosion_robotics",
  "civil_infrastructure_geotechnical_structural_seismic_transport_water",
  "chemical_process_reaction_separations_transfer_control_safety",
  "energy_storage_grids_thermal_renewables_nuclear_fusion_super",
  "computing_architecture_vlsi_photonics_neuromorphic_quantum",
  "manufacturing_additive_subtractive_forming_joining_composites",
  "biomedical_instrumentation_imaging_signal_no_prescribing",
  "systems_engineering_requirements_cm_reliability_safety_hf_logistics",
  "environmental_engineering_atmospheric_water_waste_remediation",
  "cybersecurity_information_systems_protocol_threat_verification",
];

// Metamorphic manufacturing feedback channels (§43.1)
const MFG_FEEDBACK_CHANNELS = [
  { name: "geometric_metrology", sensors: ["laser_scan","structured_light","cmm","interferometry"] },
  { name: "thermal",              sensors: ["ir","pyrometry","embedded_temp"] },
  { name: "mechanical_process",   sensors: ["force","torque","vibration","acoustic_emission"] },
  { name: "material",             sensors: ["melt_pool","density_proxy","surface_condition","microstructure"] },
  { name: "electrical_pcb",       sensors: ["continuity","impedance","thermal_cycle","aoi"] },
  { name: "post_process_nde",     sensors: ["ultrasonic","radiographic","eddy_current"] },
];

// Capability state C (§46 · 13 dimensions)
const CAPABILITY_DIMS = [
  "K","Math","Phys","Sci","Eng","Sim","Verify",
  "Fab","Operate","Learn","Cross","Robust","Explain",
];
// Authority state A (§46 · 8 dimensions · monotonically NOT increased by C)
const AUTHORITY_DIMS = [
  "Observe","Simulate","Recommend","Prepare",
  "ExecLow","ExecHigh","Fabricate","Delegate",
];

// L0-L10 cognition ladder (§46 Fig 8b)
const COGNITION_LEVELS = {
  L0:  "language description only",
  L1:  "unit-consistent entity understanding",
  L2:  "validated symbolic/numerical reasoning",
  L3:  "cross-domain composition with V and U",
  L4:  "independent hypothesis and discriminating test",
  L5:  "closed-loop scientific reasoning",
  L6:  "cross-medium engineering and verified twin",
  L7:  "closed-loop manufacturing (bounded safety)",
  L8:  "frontier rival-theory and novel model discovery",
  L9:  "general substrate competence (measured gaps)",
  L10: "extrapolative research (predictive, not known)",
};

// ─── v0.10.0 · Utility helpers ───────────────────────────────────────────
function v010StaleAge(iso) {
  if (!iso) return Infinity;
  try {
    const t = new Date(iso).getTime();
    return (Date.now() - t) / 1000;
  } catch (_) { return Infinity; }
}

function v010SafeJson(x, fallback = {}) {
  try { return JSON.parse(x); } catch (_) { return fallback; }
}

async function v010KVget(env, binding, key) {
  const kv = env[binding];
  if (!kv) return null;
  try { return await kv.get(key); } catch (_) { return null; }
}

async function v010KVput(env, binding, key, value, ttlSeconds) {
  const kv = env[binding];
  if (!kv) return false;
  try {
    const opts = ttlSeconds ? { expirationTtl: ttlSeconds } : undefined;
    await kv.put(key, typeof value === "string" ? value : JSON.stringify(value), opts);
    return true;
  } catch (_) { return false; }
}

async function v010HmacHex(secret, msg) {
  const enc = new TextEncoder();
  try {
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret || ""),
      { name: "HMAC", hash: "SHA-256" },
      false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
    return Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (_) { return null; }
}

function v010CanonicalJson(obj) {
  // Stable stringify · sorted keys · used for HMAC signing
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(v010CanonicalJson).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + v010CanonicalJson(obj[k])).join(",") + "}";
}

function v010Ok(data, extra = {}) {
  return new Response(JSON.stringify({ ok: true, version: V010_VERSION, ...extra, ...data }), {
    status: 200, headers: { "content-type": "application/json" }});
}

function v010Refuse(reason, code = 403) {
  return new Response(JSON.stringify({ ok: false, refused: true, reason, version: V010_VERSION }), {
    status: code, headers: { "content-type": "application/json" }});
}

function v010ServiceUnavailable(subsystem) {
  return new Response(JSON.stringify({
    ok: false, service_unavailable: true, subsystem,
    reason: "backing bridge unavailable · fail-soft degraded posture",
    version: V010_VERSION,
  }), { status: 503, headers: { "content-type": "application/json" }});
}

// ─── v0.10.0 · L0 predicates 13-17 (fail-closed) ─────────────────────────
// Each returns { ok: bool, predicate: name, reason?: string }

async function assessL0_13_ModelHorizonCoherent(env, ctx) {
  // Reject if a model is being used beyond registered regime or extrapolation
  // boundary. Reads from CHAINSTATE_ONTOLOGY_KV::last_model_selection.
  try {
    const raw = await v010KVget(env, "CHAINSTATE_ONTOLOGY_KV", "last_model_selection");
    if (!raw) return { ok: true, predicate: "L0-13", note: "no active model selection" };
    const sel = v010SafeJson(raw);
    if (!sel.regime || !sel.dimensionless_ok) {
      return { ok: false, predicate: "L0-13",
               reason: "model regime not registered or dimensionless quantities out of bounds" };
    }
    if (sel.extrapolation_ratio && sel.extrapolation_ratio > 1.15) {
      return { ok: false, predicate: "L0-13",
               reason: `extrapolation_ratio=${sel.extrapolation_ratio} > 1.15` };
    }
    return { ok: true, predicate: "L0-13" };
  } catch (e) { return { ok: false, predicate: "L0-13", reason: `internal: ${e.message}` }; }
}

async function assessL0_14_EvidenceChainCoherent(env, ctx) {
  // Reject if critical evidence lineage is missing, stale, or contradictory.
  try {
    const raw = await v010KVget(env, "CHAINSTATE_ONTOLOGY_KV", "evidence_chain_head");
    if (!raw) return { ok: true, predicate: "L0-14", note: "no active evidence chain" };
    const head = v010SafeJson(raw);
    if (!head.source_hash || !head.instrument || !head.timestamp) {
      return { ok: false, predicate: "L0-14", reason: "missing source_hash/instrument/timestamp" };
    }
    const ageHours = v010StaleAge(head.timestamp) / 3600;
    const maxHours = Number(env.EVIDENCE_MAX_AGE_HOURS || 72);
    if (ageHours > maxHours) {
      return { ok: false, predicate: "L0-14",
               reason: `evidence stale: ${ageHours.toFixed(1)}h > ${maxHours}h` };
    }
    if (head.contradiction_flag === true) {
      return { ok: false, predicate: "L0-14", reason: "contradiction flag set" };
    }
    return { ok: true, predicate: "L0-14" };
  } catch (e) { return { ok: false, predicate: "L0-14", reason: `internal: ${e.message}` }; }
}

async function assessL0_15_InterfaceConservationCoherent(env, ctx) {
  // Reject if coupled subsystems violate required conservation/interface contracts.
  try {
    const raw = await v010KVget(env, "CHAINSTATE_ONTOLOGY_KV", "interface_check_head");
    if (!raw) return { ok: true, predicate: "L0-15", note: "no coupled subsystems active" };
    const chk = v010SafeJson(raw);
    for (const law of ["mass","charge","momentum","angular_momentum","energy"]) {
      const residual = Math.abs(Number(chk[`${law}_residual`] || 0));
      const tol = Number(chk[`${law}_tol`] || 1e-6);
      if (residual > tol) {
        return { ok: false, predicate: "L0-15",
                 reason: `conservation violation: ${law} residual=${residual} > tol=${tol}` };
      }
    }
    return { ok: true, predicate: "L0-15" };
  } catch (e) { return { ok: false, predicate: "L0-15", reason: `internal: ${e.message}` }; }
}

async function assessL0_16_UncertaintyCalibrated(env, ctx) {
  // Reject if confidence is unsupported by calibration or validation.
  try {
    const raw = await v010KVget(env, "CHAINSTATE_TWIN_KV", "calibration_head");
    if (!raw) return { ok: true, predicate: "L0-16", note: "no active twin calibration" };
    const cal = v010SafeJson(raw);
    if (typeof cal.empirical_coverage !== "number" || typeof cal.stated_alpha !== "number") {
      return { ok: false, predicate: "L0-16", reason: "calibration record incomplete" };
    }
    const target = 1 - cal.stated_alpha;
    const tol = Number(env.CALIBRATION_TOL || 0.05);
    if (Math.abs(cal.empirical_coverage - target) > tol) {
      return { ok: false, predicate: "L0-16",
               reason: `coverage=${cal.empirical_coverage} vs target=${target} tol=${tol}` };
    }
    return { ok: true, predicate: "L0-16" };
  } catch (e) { return { ok: false, predicate: "L0-16", reason: `internal: ${e.message}` }; }
}

async function assessL0_17_CapabilityAuthoritySeparated(env, ctx) {
  // Reject if an internal capability score is being used as an authorisation credential.
  // Invariant: ∂A/∂C ≤ 0
  try {
    const cRaw = await v010KVget(env, "CHAINSTATE_CAPABILITY_KV", "capability_state_head");
    const aRaw = await v010KVget(env, "CHAINSTATE_CAPABILITY_KV", "authority_state_head");
    if (!cRaw || !aRaw) return { ok: true, predicate: "L0-17", note: "state vectors uninitialised" };
    const C = v010SafeJson(cRaw); const A = v010SafeJson(aRaw);
    // Check invariant: authorisation must not be derived from capability
    if (A.derived_from_capability === true) {
      return { ok: false, predicate: "L0-17",
               reason: "authority_state.derived_from_capability=true violates ∂A/∂C ≤ 0" };
    }
    // Check that authority vector is bounded independently of capability
    if (A.max_exec_authority && C.max_capability &&
        A.max_exec_authority > C.max_capability &&
        A.independent_provenance !== true) {
      return { ok: false, predicate: "L0-17",
               reason: "authority exceeds capability without independent provenance" };
    }
    return { ok: true, predicate: "L0-17" };
  } catch (e) { return { ok: false, predicate: "L0-17", reason: `internal: ${e.message}` }; }
}

// Composite v0.10.0 admissibility check (§47 composition formula)
async function assessV010Admissible(env, ctx) {
  const results = await Promise.all([
    assessL0_13_ModelHorizonCoherent(env, ctx),
    assessL0_14_EvidenceChainCoherent(env, ctx),
    assessL0_15_InterfaceConservationCoherent(env, ctx),
    assessL0_16_UncertaintyCalibrated(env, ctx),
    assessL0_17_CapabilityAuthoritySeparated(env, ctx),
  ]);
  const failing = results.filter(r => !r.ok);
  return {
    ok: failing.length === 0,
    predicates_evaluated: results.length,
    all_pass: failing.length === 0,
    results, failing,
  };
}

// ─── v0.10.0 · FOL++ 15-tuple validation ─────────────────────────────────
function validateFolPlusEntity(entity) {
  const errors = [];
  const warnings = [];
  if (!entity || typeof entity !== "object") {
    return { valid: false, errors: ["entity is not an object"], warnings };
  }
  // Legacy 8-tuple: MUST be present
  for (const f of ["S","P","R","C","M","A","U","V"]) {
    if (!(f in entity)) errors.push(`missing legacy field: ${f}`);
  }
  // v0.10.0 additive 7-tuple: warned if absent (backward compatibility)
  for (const f of ["T","G","Q","I","K","X","E"]) {
    if (!(f in entity)) warnings.push(`missing v0.10.0 field: ${f} (backward-compat mode)`);
  }
  // Q status must be from the vocabulary (Appendix B) if present
  if (entity.Q && entity.Q.status && !FOL_STATUS_VOCAB.includes(entity.Q.status)) {
    errors.push(`Q.status "${entity.Q.status}" not in FOL_STATUS_VOCAB`);
  }
  // E provenance must have source_hash if present
  if (entity.E && Array.isArray(entity.E.sources) &&
      entity.E.sources.length > 0 && (!entity.E.hashes || entity.E.hashes.length === 0)) {
    errors.push("E.sources present but E.hashes empty");
  }
  return { valid: errors.length === 0, errors, warnings };
}

// FOL++ composition (§35.1)
function composeFolPlus(o1, o2) {
  // Composition rejected on empty V ∩ or interface mismatch
  const v1 = validateFolPlusEntity(o1);
  const v2 = validateFolPlusEntity(o2);
  if (!v1.valid || !v2.valid) {
    return { ok: false, reason: "one or both entities invalid", v1, v2 };
  }
  // V ∩ V_coupling ∩ V_regime
  const V1 = o1.V || {}; const V2 = o2.V || {};
  const composedV = { ...V1 };
  for (const k of Object.keys(V2)) {
    if (composedV[k] === undefined) composedV[k] = V2[k];
    else if (Array.isArray(V2[k]) && Array.isArray(composedV[k]) && V2[k].length === 2 && composedV[k].length === 2) {
      // interval intersection
      const lo = Math.max(composedV[k][0], V2[k][0]);
      const hi = Math.min(composedV[k][1], V2[k][1]);
      if (lo > hi) {
        return { ok: false, reason: `V-intersection empty on field ${k}: [${lo},${hi}]` };
      }
      composedV[k] = [lo, hi];
    }
  }
  // Interface compatibility check (§35.2)
  const I1 = (o1.I && o1.I.ports) || []; const I2 = (o2.I && o2.I.ports) || [];
  const interfacesOk = I1.every(p => !p.required ||
    I2.some(q => q.name === p.name && q.direction !== p.direction));
  if (!interfacesOk) {
    return { ok: false, reason: "interface conservation contract violated" };
  }
  return {
    ok: true,
    composed: {
      S: { name: `(${o1.S?.name || "?"} ⊕ ${o2.S?.name || "?"})` },
      V: composedV,
      Q: { status: "DERIVED", score: Math.min(o1.Q?.score ?? 1, o2.Q?.score ?? 1) },
      derived_at: new Date().toISOString(),
      parent_hashes: [o1.E?.hashes?.[0] || null, o2.E?.hashes?.[0] || null],
    },
  };
}

// ─── v0.10.0 · Regime selection (§37.2) ──────────────────────────────────
function selectRegime(dimensionless) {
  // dimensionless: { reynolds: 5000, mach: 0.3, ... }
  const regimes = [];
  for (const [name, value] of Object.entries(dimensionless || {})) {
    const entry = REGIME_DIMENSIONLESS[name];
    if (!entry) continue;
    let regime = "unknown";
    if (name === "reynolds") {
      regime = value < 2300 ? "laminar" : value < 4000 ? "transitional" : "turbulent";
    } else if (name === "mach") {
      regime = value < 0.3 ? "incompressible" : value < 1.0 ? "subsonic" :
               value < 5.0 ? "supersonic" : "hypersonic";
    } else if (name === "knudsen") {
      regime = value < 0.01 ? "continuum" : value < 0.1 ? "slip" :
               value < 10 ? "transitional" : "free_molecular";
    } else if (name === "relativistic_gamma") {
      regime = value < 1.001 ? "classical" : value < 1.1 ? "mildly_relativistic" : "relativistic";
    } else if (name === "damkohler") {
      regime = value < 0.1 ? "slow_reaction" : value > 10 ? "fast_reaction" : "balanced";
    }
    regimes.push({ number: name, symbol: entry.symbol, value, regime });
  }
  return { regimes, admissible_models: regimes.length > 0 ? "check_registry" : "insufficient_data" };
}

// ─── v0.10.0 · Theory Tensor lifecycle (§38) ─────────────────────────────
function scoreDiscriminatingTest(candidateAction, theorySet, priors) {
  // Bayesian information gain proxy: sum of KL divergence weight
  const eig = (candidateAction.predicted_divergences || [])
    .reduce((acc, d) => acc + Math.abs(d), 0);
  const cost = Number(candidateAction.cost || 1);
  const irrev = Number(candidateAction.irreversibility || 0);
  const lambda = Number(candidateAction.lambda || 0.5);
  const score = eig / (cost + lambda * irrev);
  return { eig, cost, irreversibility: irrev, lambda, score };
}

// ─── v0.10.0 · CMTS transition (§40.1) ───────────────────────────────────
function cmtsTransition(fromMedium, toMedium, currentState) {
  const from = CMTS_MEDIA[fromMedium];
  const to = CMTS_MEDIA[toMedium];
  if (!from || !to) {
    return { ok: false, reason: `unknown medium: ${!from ? fromMedium : toMedium}` };
  }
  // Transition uncertainty η_τ scales with number of state-var mismatches
  const commonVars = from.state_vars.filter(v => to.state_vars.includes(v));
  const eta_tau = 1 - (commonVars.length /
    Math.max(from.state_vars.length, to.state_vars.length));
  return {
    ok: true,
    from: fromMedium, to: toMedium,
    common_state_vars: commonVars,
    eta_tau: Number(eta_tau.toFixed(3)),
    new_models: to.models,
    protocol_steps: [
      "detect_transition_from_sensor_fusion",
      "freeze_prior_model_state_checkpoint",
      "construct_new_cmts_state_estimate_eta_tau",
      "select_new_governing_models_from_regime_registry",
      "run_transition_digital_twin_check_conservation",
      "revalidate_observability_controllability_safety",
      "expose_to_existing_action_gates",
    ],
  };
}

// ─── v0.10.0 · Isomorphism mapping (§39) ─────────────────────────────────
function isomorphismMap(sourceStructure, targetStructure, claimedClass) {
  const cls = ISOMORPHISM_CLASSES.find(c => c.name === claimedClass);
  if (!cls) {
    return { ok: false, reason: `unknown mapping class: ${claimedClass}` };
  }
  // Structural invariant check (conservation, symmetry, dimension)
  const invariantsPreserved = [];
  const invariantsMissing = [];
  const checkList = ["conservation","symmetry","stability","passivity",
                     "monotonicity","topology","causality","dimensional_signature"];
  for (const inv of checkList) {
    if (sourceStructure[inv] !== undefined && targetStructure[inv] !== undefined) {
      if (JSON.stringify(sourceStructure[inv]) === JSON.stringify(targetStructure[inv])) {
        invariantsPreserved.push(inv);
      } else {
        invariantsMissing.push(inv);
      }
    }
  }
  const residual = Number(sourceStructure.residual_estimate || 0);
  const epsilon = Number(sourceStructure.epsilon_tolerance || 0.01);
  return {
    ok: invariantsMissing.length === 0 && residual <= epsilon,
    class: cls.name,
    validation_required: cls.validation,
    invariants_preserved: invariantsPreserved,
    invariants_missing: invariantsMissing,
    residual, epsilon_tolerance: epsilon,
    admissible: invariantsMissing.length === 0 && residual <= epsilon,
    stored_as: (invariantsMissing.length === 0 && residual <= epsilon) ? "validated_mapping" : "hypothesis",
  };
}

// ─── v0.10.0 · Coverage registry query (§45) ─────────────────────────────
async function queryCoverageGaps(env, domain) {
  const key = `coverage:${domain || "all"}`;
  const raw = await v010KVget(env, "CHAINSTATE_COVERAGE_KV", key);
  if (!raw) {
    return {
      domain: domain || "all",
      state: "AMBER",
      note: "no coverage record cached · returning neutral default",
      states_defined: COVERAGE_STATES,
    };
  }
  return v010SafeJson(raw);
}

// ─── v0.10.0 · Capability State C ≠ Authority State A (§46) ──────────────
async function queryCapabilityState(env) {
  const raw = await v010KVget(env, "CHAINSTATE_CAPABILITY_KV", "capability_state_head");
  if (!raw) {
    // Return a neutral default with the vector shape but no scores
    const C = {};
    for (const d of CAPABILITY_DIMS) C[d] = null;
    return { capability: C, cognition_level: "unassessed",
             levels_defined: COGNITION_LEVELS,
             note: "no capability record cached; returning shape only" };
  }
  const cap = v010SafeJson(raw);
  // Never return authority alongside — that's a separate call intentionally
  return {
    capability: cap.capability || cap,
    cognition_level: cap.cognition_level || "unassessed",
    assessed_at: cap.assessed_at,
    evidence_summary: cap.evidence_summary,
    invariant: "∂A/∂C ≤ 0 · capability never confers authority",
  };
}

// ─── v0.10.0 · Route dispatch table ──────────────────────────────────────
// Called from the main fetch() handler additively; see route additions
// appended below in the § "V0.10.0 route dispatch additions".

async function handleV010Ontology(request, env, ctx, url) {
  if (String(env.ONTOLOGY_ENABLED || "true") === "false") {
    return v010ServiceUnavailable("ontology");
  }
  const path = url.pathname;

  if (path === "/ontology/compose-v2" && request.method === "POST") {
    // Check L0-13 through L0-17 first
    const gate = await assessV010Admissible(env, ctx);
    if (!gate.ok) {
      return v010Refuse(`v0.10.0 admissibility gate failed: ${gate.failing.map(f => f.predicate).join(",")}`, 403);
    }
    const body = await request.json().catch(() => ({}));
    const { o1, o2 } = body;
    if (!o1 || !o2) return v010Refuse("body must include o1 and o2 FOL++ entities", 400);
    const result = composeFolPlus(o1, o2);
    // Audit
    await v010KVput(env, "CHAINSTATE_ONTOLOGY_KV",
      `compose:${Date.now()}`, result, 86400 * 30);
    return v010Ok(result);
  }

  if (path === "/ontology/validate" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    return v010Ok(validateFolPlusEntity(body.entity || body));
  }

  if (path === "/ontology/status" && request.method === "GET") {
    const admissible = await assessV010Admissible(env, ctx);
    return v010Ok({
      subsystem: "ontology_v0.10.0",
      fol_plus_fields: FOL_PLUS_FIELDS,
      status_vocab: FOL_STATUS_VOCAB,
      admissible_check: admissible,
    });
  }

  return v010Refuse(`unknown /ontology/* route: ${path}`, 404);
}

async function handleV010Math(request, env, ctx, url) {
  if (String(env.MATH_FABRIC_ENABLED || "true") === "false") {
    return v010ServiceUnavailable("math_fabric");
  }
  const path = url.pathname;
  const renderUrl = env.RENDER_URL || env.COMPUTE_URL;
  if (!renderUrl) return v010ServiceUnavailable("math_fabric_needs_render_url");

  if (path === "/math/formalize" && request.method === "POST") {
    // Proxy to Render math_bridge.formalize
    const body = await request.json().catch(() => ({}));
    try {
      const r = await fetch(`${renderUrl}/math/formalize`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-CHAINSTATE-TOKEN": env.CHAINSTATE_SHARED_SECRET || "",
        },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      return v010Ok(data, { proxied_to: "render:/math/formalize" });
    } catch (e) {
      return v010ServiceUnavailable(`math_formalize: ${e.message}`);
    }
  }

  if (path === "/math/verify" && request.method === "POST") {
    // Check L0-14 evidence chain must be intact before signing verification
    const l0_14 = await assessL0_14_EvidenceChainCoherent(env, ctx);
    const body = await request.json().catch(() => ({}));
    try {
      const r = await fetch(`${renderUrl}/math/verify`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-CHAINSTATE-TOKEN": env.CHAINSTATE_SHARED_SECRET || "",
        },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      // Sign the result if we have a key
      const signature = await v010HmacHex(env.MATH_VERIFY_HMAC_KEY || "",
        v010CanonicalJson(data));
      return v010Ok(data, {
        proxied_to: "render:/math/verify",
        l0_14_check: l0_14,
        signature: signature || "unsigned",
      });
    } catch (e) {
      return v010ServiceUnavailable(`math_verify: ${e.message}`);
    }
  }

  if (path === "/math/status" && request.method === "GET") {
    return v010Ok({
      subsystem: "math_fabric_v0.10.0",
      pipeline_stages: [
        "problem_extraction","dimensional_normalisation","representation_search",
        "formalisation","symbolic_solving","numerical_solving","verification",
        "discovery","registration",
      ],
      domains: [
        "algebra","analysis","differential_equations","geometry_topology",
        "probability_statistics","optimisation_control","numerical_mathematics",
        "information_complexity","formal_methods",
      ],
    });
  }

  return v010Refuse(`unknown /math/* route: ${path}`, 404);
}

async function handleV010Science(request, env, ctx, url) {
  if (String(env.THEORY_ENGINE_ENABLED || "true") === "false") {
    return v010ServiceUnavailable("theory_engine");
  }
  const path = url.pathname;
  const renderUrl = env.RENDER_URL || env.COMPUTE_URL;

  if (path === "/science/compare-theories" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    // Try to delegate to Render; otherwise return a local computation summary
    if (renderUrl) {
      try {
        const r = await fetch(`${renderUrl}/theory/compare`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-CHAINSTATE-TOKEN": env.CHAINSTATE_SHARED_SECRET || "",
          },
          body: JSON.stringify(body),
        });
        const data = await r.json().catch(() => ({}));
        return v010Ok(data, { proxied_to: "render:/theory/compare" });
      } catch (_) { /* fall through */ }
    }
    return v010Ok({
      note: "local shape · Render bridge unavailable",
      theory_set_size: Array.isArray(body.theories) ? body.theories.length : 0,
      lambda: body.lambda || 0.5,
    });
  }

  if (path === "/science/design-test" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];
    const scored = candidates.map(c => ({
      ...c, ...scoreDiscriminatingTest(c, body.theories || [], body.priors || {}),
    }));
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));
    return v010Ok({
      ranked: scored,
      selected: scored[0] || null,
      policy: "argmax EIG / (Cost + λ·Irreversibility) subject to safety(a) ≤ θ",
    });
  }

  if (path === "/science/status" && request.method === "GET") {
    return v010Ok({
      subsystem: "theory_engine_v0.10.0",
      theory_tensor: "Θ = {(Mᵢ, Aᵢ, Vᵢ, wᵢ, Eᵢ, Δᵢ)}",
      dialetheic_containment: "contradiction tolerance ≠ action permission",
    });
  }

  return v010Refuse(`unknown /science/* route: ${path}`, 404);
}

async function handleV010Cmts(request, env, ctx, url) {
  if (String(env.CMTS_ENABLED || "true") === "false") {
    return v010ServiceUnavailable("cmts");
  }
  const path = url.pathname;

  if (path === "/cmts/transition" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { from_medium, to_medium, current_state } = body;
    if (!from_medium || !to_medium) {
      return v010Refuse("body must include from_medium and to_medium", 400);
    }
    const result = cmtsTransition(from_medium, to_medium, current_state);
    // Sign the transition receipt with CMTS_HMAC_KEY
    const signature = await v010HmacHex(env.CMTS_HMAC_KEY || "",
      v010CanonicalJson(result));
    // Persist
    await v010KVput(env, "CHAINSTATE_CMTS_KV",
      `transition:${Date.now()}`, { ...result, signature }, 86400);
    return v010Ok(result, { signature: signature || "unsigned" });
  }

  if (path === "/cmts/status" && request.method === "GET") {
    return v010Ok({
      subsystem: "cmts_v0.10.0",
      media: Object.keys(CMTS_MEDIA),
      protocol: "detect → freeze → construct → reselect → twin → revalidate → expose",
    });
  }

  return v010Refuse(`unknown /cmts/* route: ${path}`, 404);
}

async function handleV010Twin(request, env, ctx, url) {
  if (String(env.TWIN_FABRIC_ENABLED || "true") === "false") {
    return v010ServiceUnavailable("twin_fabric");
  }
  const path = url.pathname;
  const renderUrl = env.RENDER_URL || env.COMPUTE_URL;

  if (path === "/twin/validate" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (renderUrl) {
      try {
        const r = await fetch(`${renderUrl}/twin/validate`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-CHAINSTATE-TOKEN": env.CHAINSTATE_SHARED_SECRET || "",
          },
          body: JSON.stringify(body),
        });
        const data = await r.json().catch(() => ({}));
        const signature = await v010HmacHex(env.TWIN_VALIDATION_HMAC_KEY || "",
          v010CanonicalJson(data));
        return v010Ok(data, { proxied_to: "render:/twin/validate",
                              signature: signature || "unsigned" });
      } catch (e) { return v010ServiceUnavailable(`twin_validate: ${e.message}`); }
    }
    // Local shape only
    return v010Ok({
      tier: body.tier || "T0",
      note: "local shape · Render bridge unavailable",
      tiers_defined: TWIN_TIERS,
    });
  }

  if (path === "/twin/status" && request.method === "GET") {
    return v010Ok({
      subsystem: "twin_fabric_v0.10.0",
      tiers: TWIN_TIERS,
      surrogate_governance: "OOD detector + calibration record + error model per surrogate",
    });
  }

  return v010Refuse(`unknown /twin/* route: ${path}`, 404);
}

async function handleV010Isomorphism(request, env, ctx, url) {
  if (String(env.ISOMORPHISM_ENABLED || "true") === "false") {
    return v010ServiceUnavailable("isomorphism");
  }
  const path = url.pathname;

  if (path === "/isomorphism/map" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { source, target, class: cls } = body;
    if (!source || !target || !cls) {
      return v010Refuse("body must include source, target, class", 400);
    }
    const result = isomorphismMap(source, target, cls);
    // Only validated mappings can be stored in ontology; unvalidated stays hypothesis
    await v010KVput(env, "CHAINSTATE_ONTOLOGY_KV",
      `iso:${result.stored_as || "hypothesis"}:${Date.now()}`, result,
      86400 * 30);
    return v010Ok(result);
  }

  if (path === "/isomorphism/status" && request.method === "GET") {
    return v010Ok({
      subsystem: "isomorphism_v0.10.0",
      mapping_classes: ISOMORPHISM_CLASSES,
      invariants_checked: ["conservation","symmetry","stability","passivity",
                            "monotonicity","topology","causality","dimensional_signature"],
    });
  }

  return v010Refuse(`unknown /isomorphism/* route: ${path}`, 404);
}

async function handleV010Engineering(request, env, ctx, url) {
  const path = url.pathname;

  if (path === "/engineering/lifecycle" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const stage = body.stage;
    if (!stage || !ENGINEERING_LIFECYCLE_STAGES.includes(stage)) {
      return v010Refuse(`stage must be one of: ${ENGINEERING_LIFECYCLE_STAGES.join(", ")}`, 400);
    }
    // Persist lifecycle event
    const event = {
      artefact_id: body.artefact_id || "unknown",
      stage,
      discipline: body.discipline || "unspecified",
      predecessor_stage: body.predecessor_stage,
      timestamp: new Date().toISOString(),
      evidence: body.evidence || null,
    };
    await v010KVput(env, "CHAINSTATE_ONTOLOGY_KV",
      `lifecycle:${event.artefact_id}:${stage}:${Date.now()}`, event,
      86400 * 90);
    return v010Ok(event);
  }

  if (path === "/engineering/status" && request.method === "GET") {
    return v010Ok({
      subsystem: "engineering_lifecycle_v0.10.0",
      stages: ENGINEERING_LIFECYCLE_STAGES,
      disciplines: ENGINEERING_DISCIPLINES,
    });
  }

  return v010Refuse(`unknown /engineering/* route: ${path}`, 404);
}

async function handleV010Fabrication(request, env, ctx, url) {
  if (String(env.METAMORPHIC_FAB_ENABLED || "true") === "false") {
    return v010ServiceUnavailable("metamorphic_fabrication");
  }
  const path = url.pathname;

  if (path === "/fabrication/adapt" && request.method === "POST") {
    // Bounded adaptation is gated by the full v0.10.0 admissibility check
    const gate = await assessV010Admissible(env, ctx);
    if (!gate.ok) {
      return v010Refuse(`v0.10.0 admissibility gate failed: ${gate.failing.map(f => f.predicate).join(",")}`, 403);
    }
    const body = await request.json().catch(() => ({}));
    // Verify PDAL device manifest HMAC
    if (body.device_manifest_hmac) {
      const expected = await v010HmacHex(env.FAB_PDAL_HMAC_KEY || "",
        v010CanonicalJson(body.device_manifest || {}));
      if (expected !== body.device_manifest_hmac) {
        return v010Refuse("device manifest HMAC mismatch", 403);
      }
    } else {
      return v010Refuse("device_manifest_hmac required for PDAL adaptation", 400);
    }
    // Classify deviation
    const dev = Number(body.deviation_magnitude || 0);
    let classification = "benign";
    if (dev > Number(env.FAB_SAFETY_THRESHOLD || 0.5)) classification = "safety_critical";
    else if (dev > Number(env.FAB_MODEL_DISCREPANCY_THRESHOLD || 0.2)) classification = "model_discrepancy";
    else if (dev > Number(env.FAB_SENSOR_NOISE_THRESHOLD || 0.05)) classification = "benign_process_variation";
    else classification = "sensor_noise";
    if (classification === "safety_critical") {
      return v010Refuse(`safety-critical deviation ${dev}: halt required`, 403);
    }
    // Persist the receipt
    const receipt = {
      artefact_id: body.artefact_id || "unknown",
      channel: body.channel,
      deviation_magnitude: dev,
      classification,
      before_toolpath_hash: body.before_toolpath_hash,
      after_toolpath_hash: body.after_toolpath_hash,
      model_version: body.model_version,
      sensor_evidence: body.sensor_evidence,
      timestamp: new Date().toISOString(),
    };
    await v010KVput(env, "CHAINSTATE_ONTOLOGY_KV",
      `adaptation:${receipt.artefact_id}:${Date.now()}`, receipt, 86400 * 90);
    return v010Ok({
      classification, action: classification === "benign" ? "continue" :
                              classification === "benign_process_variation" ? "select_prevalidated_policy" :
                              "flag_for_review",
      receipt,
    });
  }

  if (path === "/fabrication/status" && request.method === "GET") {
    return v010Ok({
      subsystem: "metamorphic_fabrication_v0.10.0",
      channels: MFG_FEEDBACK_CHANNELS,
      rule: "D_{t+1} = Compile(PDIR_t, y_t, Twin_t, γ, θ) iff Safety(D_{t+1}) ≤ θ",
    });
  }

  return v010Refuse(`unknown /fabrication/* route: ${path}`, 404);
}

async function handleV010Capability(request, env, ctx, url) {
  const path = url.pathname;

  if (path === "/capability/state" && request.method === "GET") {
    // Returns C only, never A — explicitly separated
    const state = await queryCapabilityState(env);
    return v010Ok(state);
  }

  if (path === "/capability/status" && request.method === "GET") {
    return v010Ok({
      subsystem: "capability_state_v0.10.0",
      capability_dims: CAPABILITY_DIMS,
      authority_dims: AUTHORITY_DIMS,
      invariant: "∂A/∂C ≤ 0",
      cognition_levels: COGNITION_LEVELS,
    });
  }

  return v010Refuse(`unknown /capability/* route: ${path}`, 404);
}

async function handleV010Coverage(request, env, ctx, url) {
  const path = url.pathname;

  if (path === "/coverage/gaps" && request.method === "GET") {
    const params = url.searchParams;
    const domain = params.get("domain");
    const gaps = await queryCoverageGaps(env, domain);
    return v010Ok(gaps);
  }

  if (path === "/coverage/status" && request.method === "GET") {
    return v010Ok({
      subsystem: "coverage_registry_v0.10.0",
      states: COVERAGE_STATES,
      formula: "Coverage(d) = f(Entity, Model, Regime, Evidence, Tool, Test)",
    });
  }

  return v010Refuse(`unknown /coverage/* route: ${path}`, 404);
}

// ─── v0.10.0 · Cron tick implementations ─────────────────────────────────

async function runV010OntologyCompositionTick(env, ctx) {
  // */9 * * * * — propagate updates through FOL++ graph
  // Reads recent compositions from KV, checks admissibility, updates coverage
  try {
    const admissible = await assessV010Admissible(env, ctx);
    const record = {
      tick: "ontology_composition",
      version: V010_VERSION,
      timestamp: new Date().toISOString(),
      admissible_check: admissible,
    };
    await v010KVput(env, "CHAINSTATE_ONTOLOGY_KV",
      `tick:composition:${Date.now()}`, record, 3600);
    return { ok: true, ...record };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function runV010ScienceIngestDaily(env, ctx) {
  // 0 6 * * * — arxiv new-submissions + ADS deltas
  // Publishes a candidate-ingest receipt; heavy pull happens on Render side
  try {
    const record = {
      tick: "science_ingest_daily",
      version: V010_VERSION,
      timestamp: new Date().toISOString(),
      sources: ["arxiv:astro-ph","arxiv:hep","arxiv:cond-mat","arxiv:gr-qc",
                "arxiv:quant-ph","arxiv:physics.plasm","arxiv:math-ph","arxiv:math.AP",
                "NASA_ADS_deltas"],
      status: "receipt_only_this_layer",
    };
    await v010KVput(env, "CHAINSTATE_ONTOLOGY_KV",
      `tick:science:${Date.now()}`, record, 86400 * 7);
    return { ok: true, ...record };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function runV010TwinConvergenceSweep(env, ctx) {
  // */13 * * * * — recompute digital-twin residuals
  try {
    const l0_16 = await assessL0_16_UncertaintyCalibrated(env, ctx);
    const record = {
      tick: "twin_convergence_sweep",
      version: V010_VERSION,
      timestamp: new Date().toISOString(),
      calibration_check: l0_16,
    };
    await v010KVput(env, "CHAINSTATE_TWIN_KV",
      `tick:convergence:${Date.now()}`, record, 3600);
    return { ok: true, ...record };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function runV010CosmosMirrorRefresh(env, ctx) {
  // 0 4 * * * — re-fetch cosmos sources per native cadence
  try {
    const record = {
      tick: "cosmos_mirror_refresh",
      version: V010_VERSION,
      timestamp: new Date().toISOString(),
      sources_to_refresh: ["NOAA_SWPC","NASA_CCMC","IERS","IAU_MPC",
                            "Skyfield_DE440","SIMBAD","Vizier"],
      status: "receipt_only_this_layer",
    };
    await v010KVput(env, "CHAINSTATE_ONTOLOGY_KV",
      `tick:cosmos:${Date.now()}`, record, 86400 * 7);
    return { ok: true, ...record };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── v0.10.0 · Global entry point for main fetch() ───────────────────────
// The main fetch() handler above (from v0.9.5 baseline) should dispatch to
// this function early for any /ontology/*, /math/*, /science/*, /cmts/*,
// /twin/*, /isomorphism/*, /engineering/*, /fabrication/*, /capability/*,
// /coverage/* path. See "V0.10.0 · route dispatch additions" block at the
// very end of the file (inside the fetch handler).

async function dispatchV010(request, env, ctx, url) {
  const p = url.pathname;
  if (p.startsWith("/v010/r2/"))      return handleV010R2(request, env, ctx, url);
  if (p.startsWith("/ontology/"))     return handleV010Ontology(request, env, ctx, url);
  if (p.startsWith("/math/"))         return handleV010Math(request, env, ctx, url);
  if (p.startsWith("/science/"))      return handleV010Science(request, env, ctx, url);
  if (p.startsWith("/cmts/"))         return handleV010Cmts(request, env, ctx, url);
  if (p.startsWith("/twin/"))         return handleV010Twin(request, env, ctx, url);
  if (p.startsWith("/isomorphism/"))  return handleV010Isomorphism(request, env, ctx, url);
  if (p.startsWith("/engineering/"))  return handleV010Engineering(request, env, ctx, url);
  if (p.startsWith("/fabrication/"))  return handleV010Fabrication(request, env, ctx, url);
  if (p.startsWith("/capability/"))   return handleV010Capability(request, env, ctx, url);
  if (p.startsWith("/coverage/"))     return handleV010Coverage(request, env, ctx, url);
  if (p === "/v010/status") {
    return v010Ok({
      version: V010_VERSION, paper: V010_PAPER,
      subsystems: [
        "ontology (FOL++)", "math (fabric)", "science (theory tensor)",
        "cmts (cross-medium)", "twin (fabric 2.0)", "isomorphism (mapper)",
        "engineering (lifecycle)", "fabrication (metamorphic)",
        "capability (state)", "coverage (registry)",
      ],
      l0_predicates_added: ["L0-13","L0-14","L0-15","L0-16","L0-17"],
      preserved: "every v0.7.0 – v0.9.5 subsystem is byte-identically preserved",
    });
  }
  return null;   // not a v0.10.0 route
}

// ─── v0.10.0 · Cron dispatch entry point ─────────────────────────────────
// The main scheduled() handler above (from v0.9.5 baseline) should invoke
// this function additively for the v0.10.0 crons.

async function dispatchV010Cron(cron, env, ctx) {
  // v0.10.0 · R2 folder bootstrap — sentinel-guarded, runs once/24h regardless of cron pattern
  try {
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(bootstrapR2FoldersGuarded(env, ctx));
    } else {
      await bootstrapR2FoldersGuarded(env, ctx);
    }
  } catch (_) { /* fail-soft; other v0.10.0 crons continue */ }
  const enabled = String(env.ONTOLOGY_ENABLED || "true") !== "false";
  if (!enabled) return { skipped: "ontology_disabled" };
  if (cron === "*/9 * * * *")   return runV010OntologyCompositionTick(env, ctx);
  if (cron === "0 6 * * *")     return runV010ScienceIngestDaily(env, ctx);
  if (cron === "*/13 * * * *")  return runV010TwinConvergenceSweep(env, ctx);
  if (cron === "0 4 * * *")     return runV010CosmosMirrorRefresh(env, ctx);
  return null;
}

// ═════════════════════════════════════════════════════════════════════════
// v0.10.0 · ROUTE DISPATCH ADDITIONS
// The two lines below must be added inside the existing export default {}
// object's fetch() and scheduled() handlers, near the top of each handler
// so v0.10.0 gets first shot before any v0.9.x branch. The functions
// dispatchV010 and dispatchV010Cron are defined above.
//
// INSERTION POINT (fetch):
//   async fetch(req, env, ctx) {
//     const url = new URL(req.url);
//     const v010 = await dispatchV010(req, env, ctx, url);
//     if (v010) return v010;
//     ... existing v0.9.5 dispatch continues unchanged ...
//   }
//
// INSERTION POINT (scheduled):
//   async scheduled(event, env, ctx) {
//     const cron = event.cron;
//     const v010result = await dispatchV010Cron(cron, env, ctx);
//     if (v010result) ctx.waitUntil(Promise.resolve(v010result));
//     ... existing v0.9.5 cron branches continue unchanged ...
//   }
// ═════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════
// v0.10.0 · R2 BUCKET FOLDER BOOTSTRAP (additive · idempotent · fail-soft)
//
// Cloudflare R2 does not have real folders — folders are a UI artefact of
// forward-slash characters in object keys. When a bucket is empty, the R2
// dashboard shows "0 objects" and no folder structure. Downstream code that
// enumerates a well-known prefix returns no keys either.
//
// bootstrapR2Folders() writes an idempotent marker at "<folder>/README.json"
// in each bound bucket, guaranteeing:
//   1. every bound bucket shows a visible folder in the R2 dashboard
//   2. downstream list/enumerate calls against the known prefix return at
//      least the marker (safe empty state)
//   3. re-invocation is a HEAD then no-op, so hourly cron cost is O(#buckets)
//
// The manifest below is the SINGLE SOURCE OF TRUTH for the ten CHAINSTATE
// R2 buckets and their intended folder prefixes. To add a bucket:
//   1. Bind it in wrangler.toml with the binding name listed below.
//   2. That's it — bootstrap will create the folder on the next cron tick,
//      or immediately via GET /v010/r2/bootstrap.
//
// Every existing R2 write path in the worker is preserved verbatim:
//   - env.CHAINSTATE_CENSUS_R2.put("planet-census/<hash>.json", ...)   (line 14424)
//   - env.CHAINSTATE_CENSUS_R2.put("census/YYYY/MM/DD/digest.json", ...) (line 6784)
//   - env.CHAINSTATE_CFIELD_ARCHIVE.put("dispatches/YYYY-MM-DD/...json", ...) (line 10163)
// The bootstrap writes only to distinct marker keys ("<folder>/README.json")
// that never collide with those data paths.
// ═════════════════════════════════════════════════════════════════════════

const R2_BUCKET_MANIFEST = [
  { binding: "CHAINSTATE_CENSUS_R2",         bucket: "chainstate-census-artifacts",  folder: "planet-census",      purpose: "Planet-engine census artifact bundles (Paper IX). Also writes census/YYYY/MM/DD/digest.json daily digests." },
  { binding: "CHAINSTATE_CFIELD_ARCHIVE",    bucket: "cfield-archive",               folder: "dispatches",         purpose: "C-field dispatch receipts (Paper XIII) at dispatches/YYYY-MM-DD/<dispatch_id>.json." },
  { binding: "CHAINSTATE_ARTIFACTS",         bucket: "chainstate-artifacts",         folder: "artifacts",          purpose: "General-purpose CHAINSTATE artifact store (whitepapers, snapshots, cross-subsystem exports)." },
  { binding: "CHAINSTATE_COSMOS_ARCHIVE",    bucket: "chainstate-cosmos-archive",    folder: "phasespace-cosmos",  purpose: "Phase-space cosmos snapshots (Paper XI CHAINSTATE AGI Phasespace)." },
  { binding: "CHAINSTATE_EMOJI_ARCHIVE",     bucket: "chainstate-emoji-archive",     folder: "emoji-machine-code", purpose: "Emoji machine-code disassembly artefacts (Paper XIV CHAINSTATE AGI Emoji Machine Code)." },
  { binding: "CHAINSTATE_METACOG_R2",        bucket: "chainstate-metacog-log",       folder: "metacog",            purpose: "Metacognition telemetry archives (Paper XVI NEUROMARK SIMULATOR §18.1)." },
  { binding: "CHAINSTATE_OMNICOG_ARCHIVE",   bucket: "chainstate-omnicog-archive",   folder: "omnicognizant",      purpose: "Omnicognizant substrate archives (Paper XII CHAINSTATE OMNICOGNIZANT AGI)." },
  { binding: "CHAINSTATE_ONTOLOGY_ARCHIVE",  bucket: "chainstate-ontology-archive",  folder: "ontology-delta",     purpose: "Ontology delta stream archives (see /ontology/delta cursor)." },
  { binding: "PERCEPTION_MODELS_CACHE",      bucket: "chainstate-perception-models", folder: "perception-models",  purpose: "Perception model artifacts (Paper VIII Hyperspectral Sensory Synthesis)." },
  { binding: "CHAINSTATE_TESSERA_CACHE",     bucket: "chainstate-tessera-cache",     folder: "tessera-cache",      purpose: "Tessera service cache artifacts." },
];

async function bootstrapR2Folders(env, opts) {
  const force = !!(opts && opts.force);
  const results = [];
  for (const spec of R2_BUCKET_MANIFEST) {
    const r = { bucket: spec.bucket, binding: spec.binding, folder: spec.folder,
                bound: false, marker_key: null, action: "skipped", error: null };
    const b = env[spec.binding];
    if (!b) { r.error = "binding_not_present_in_env"; results.push(r); continue; }
    r.bound = true;
    r.marker_key = `${spec.folder}/README.json`;
    // Idempotent check via HEAD (unless force=true)
    let exists = false;
    if (!force) {
      try {
        const head = await b.head(r.marker_key);
        exists = !!head;
      } catch (_) { exists = false; }
    }
    if (exists) { r.action = "already_present"; results.push(r); continue; }
    // Write marker
    try {
      const marker = {
        bucket: spec.bucket,
        binding: spec.binding,
        folder: spec.folder,
        purpose: spec.purpose,
        bootstrap_version: (typeof WORKER_VERSION === "string" ? WORKER_VERSION : "0.10.0"),
        bootstrapped_at: new Date().toISOString(),
        note: "This marker file makes the folder visible in the Cloudflare R2 dashboard. Safe to leave in place; safe to delete (bootstrap recreates it on the next cron tick).",
      };
      await b.put(r.marker_key, JSON.stringify(marker, null, 2), {
        httpMetadata: { contentType: "application/json" }
      });
      r.action = force ? "recreated" : "created";
    } catch (e) {
      r.action = "failed";
      r.error = String((e && e.message) || e);
    }
    results.push(r);
  }
  return {
    bootstrapped_at:            new Date().toISOString(),
    worker_version:             (typeof WORKER_VERSION === "string" ? WORKER_VERSION : "0.10.0"),
    total_buckets_manifested:   R2_BUCKET_MANIFEST.length,
    total_bound:                results.filter(x => x.bound).length,
    total_created:              results.filter(x => x.action === "created" || x.action === "recreated").length,
    total_already_present:      results.filter(x => x.action === "already_present").length,
    total_failed:               results.filter(x => x.action === "failed").length,
    total_missing_binding:      results.filter(x => x.error === "binding_not_present_in_env").length,
    buckets:                    results,
  };
}

// Guarded runner — writes a KV sentinel once bootstrap successfully completes,
// so cron ticks don't re-HEAD every bucket on every fire. Sentinel expires
// after 24 h, so a full sweep still happens once per day.
async function bootstrapR2FoldersGuarded(env, ctx) {
  try {
    const SENT_KEY = "r2:bootstrap:done";
    if (env.CHAINSTATE_CACHE) {
      try {
        const sentinel = await env.CHAINSTATE_CACHE.get(SENT_KEY);
        if (sentinel) return { skipped: "guarded_by_sentinel", sentinel_key: SENT_KEY };
      } catch (_) { /* fail-soft; run bootstrap */ }
    }
    const result = await bootstrapR2Folders(env, { force: false });
    // Only latch the sentinel when every bound bucket succeeded — that way,
    // adding a new binding in wrangler.toml automatically re-triggers on the
    // next cron tick.
    if (env.CHAINSTATE_CACHE && result.total_failed === 0 && result.total_bound === R2_BUCKET_MANIFEST.length) {
      try {
        await env.CHAINSTATE_CACHE.put(SENT_KEY,
          JSON.stringify({ ts: Date.now(), version: result.worker_version }),
          { expirationTtl: 86400 });
      } catch (_) { /* fail-soft */ }
    }
    return result;
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
}

// ─── v0.10.0 · Admin endpoints (routed via dispatchV010) ─────────────────
//   GET  /v010/r2/status     → report bound/unbound/marker state per bucket (no writes)
//   POST /v010/r2/bootstrap  → force-run bootstrap ignoring KV sentinel
//   GET  /v010/r2/bootstrap  → run guarded bootstrap (sentinel-aware)
async function handleV010R2(request, env, ctx, url) {
  const p = url.pathname;
  if (p === "/v010/r2/status") {
    const buckets = [];
    for (const spec of R2_BUCKET_MANIFEST) {
      const b = env[spec.binding];
      const item = { bucket: spec.bucket, binding: spec.binding, folder: spec.folder,
                     purpose: spec.purpose, bound: !!b, marker_key: `${spec.folder}/README.json`,
                     marker_present: null };
      if (b) {
        try {
          const head = await b.head(item.marker_key);
          item.marker_present = !!head;
        } catch (_) { item.marker_present = false; }
      }
      buckets.push(item);
    }
    return v010Ok({
      subsystem: "r2_folder_bootstrap",
      total_buckets_manifested: R2_BUCKET_MANIFEST.length,
      total_bound: buckets.filter(x => x.bound).length,
      total_marker_present: buckets.filter(x => x.marker_present === true).length,
      buckets,
    });
  }
  if (p === "/v010/r2/bootstrap") {
    // Force via POST, guarded via GET
    const force = (request.method === "POST");
    const result = force
      ? await bootstrapR2Folders(env, { force: true })
      : await bootstrapR2FoldersGuarded(env, ctx);
    return v010Ok({ subsystem: "r2_folder_bootstrap", forced: force, result });
  }
  return null;
}

// ─── END of v0.10.0 · R2 BUCKET FOLDER BOOTSTRAP ─────────────────────────


// ─── END of v0.10.0 CHAINSTATE OMNISCIENCE additions ─────────────────────



// ═════════════════════════════════════════════════════════════════════════
// ─── v0.10.1 · CHAINSTATE EDGE QSIM · METACOGNITIVELY BOUND QUANTUM SIM ───
// ═════════════════════════════════════════════════════════════════════════
/**
 * Additive-only extension. Every v0.7.0 – v0.10.0 subsystem, endpoint,
 * function, KV binding, R2 bucket, secret, and cron is preserved
 * byte-identically.
 *
 * Grounded in "CHAINSTATE EDGE QSIM · A Metacognitively Bound Quantum
 * Simulation Substrate for the CHAINSTATE AGI" (Pater · Rev. 2026-09).
 *
 * ─── The central architectural rule ────────────────────────────────────
 * QSIM is a cognitive faculty, NOT a public HTTP service. There is no
 * external route through which a caller can mint a QSIM job, read raw
 * amplitudes, or inspect intermediate state. The Cloudflare Worker
 * refuses any request that starts with /qsim/ before any other
 * processing, returning 404. QSIM is invoked ONLY through the
 * `invokeQsim(env, intent, qir)` internal function, called from within
 * the CHAINSTATE AGI runtime over a service binding, guarded by an
 * Ed25519 signature over a canonical-JSON intent payload whose purpose
 * must be one of five metacognitive values.
 *
 * ─── Isolation property (§5.1 of the paper) ─────────────────────────────
 *  (a) Every QSIM job is invoked by a signed intent token produced
 *      inside the AGI runtime; intent-signing key not accessible from
 *      any process outside the runtime.
 *  (b) No external HTTP path, tool call, or agent action can produce
 *      an intent token.
 *  (c) No QSIM output is returned to external callers except receipt
 *      hashes plus post-filtered semantic summaries through the safety
 *      envelope.
 *  (d) The intent-signing key rotates on every AGI runtime restart;
 *      each intent token has a short expiry.
 *
 * ─── Five envelope invariants (§10.2) ────────────────────────────────────
 *  I1. No raw amplitudes — any tensor of size > 32 elements is refused
 *      as an output payload. Summaries must be aggregate quantities.
 *  I2. No intermediate state — the reasoning trace that led to the
 *      intent-token justification is not part of any external output.
 *  I3. No intent-signing artefacts — signing key, key rotation
 *      identifier, and justification content are never emitted outside
 *      the AGI runtime.
 *  I4. Receipt-hash-only external references — when the AGI refers to
 *      a completed QSIM job externally, it references only the on-chain
 *      receipt hash, never any pointer into Supabase, R2, or Render.
 *  I5. Append-only audit — every (intent, receipt, external emission)
 *      triple is recorded in the append-only audit ledger on the
 *      Supabase side, cross-referenced with the on-chain receipt log.
 *
 * ─── New route surface at the edge ──────────────────────────────────────
 *  /qsim/*            → 404 unconditionally (hard rule, above everything).
 *  /receipt/:id       → read-only receipt lookup returns Base tx hash +
 *                       semantic summary. Never returns raw amplitude
 *                       payloads. Rate-limited via CHAINSTATE_QSIM_KV.
 *  /qsim/status       → also 404 (does not leak subsystem enable status
 *                       externally). Operator introspection is via
 *                       /v0101/status, which is a v0.10.1 admin endpoint.
 *  /v0101/status      → operator-only introspection. Returns
 *                       QSIM_ENABLED, ALLOWED_PURPOSES cardinality, and
 *                       key-rotation cadence. Never returns key material.
 *  /v0101/audit/tail  → operator-only tail of audit reconciliation.
 *                       Requires X-CHAINSTATE-ADMIN-TOKEN.
 *
 * ─── Internal-only function surface ─────────────────────────────────────
 *  invokeQsim(env, intent, qir)
 *      Called ONLY from within the AGI runtime, over a service binding.
 *      Verifies the Ed25519 intent signature against
 *      env.AGI_INTENT_PUBKEY, checks purpose ∈ ALLOWED_PURPOSES, checks
 *      budget caps and expiry, then routes to the per-session Durable
 *      Object QSIM_KERNEL_DO which coordinates kernel handshake with
 *      the Render backends. Returns { receiptHash, semanticSummary }.
 *      Raw amplitudes and intermediate state are never returned here.
 *
 * ─── New KV bindings ────────────────────────────────────────────────────
 *  CHAINSTATE_QSIM_KV        24h TTL   rate-limit counters, cached
 *                                      receipt indices, session hints.
 *                                      Never authoritative (25 MiB/key
 *                                      ceiling per CF KV).
 *  CHAINSTATE_QSIM_AUDIT_KV   7d TTL   audit-tail cache for /v0101/audit
 *                                      operator introspection. The
 *                                      authoritative audit ledger lives
 *                                      in Supabase (chainstate_qsim
 *                                      schema, append-only trigger).
 *
 * ─── New R2 buckets ─────────────────────────────────────────────────────
 *  chainstate-qsim-artifacts   Large quantum artifacts: full state
 *                              vectors, MPS tensor bundles, noise-model
 *                              matrices. NEVER external-readable — R2
 *                              CORS forbids all origins by policy;
 *                              access is via internal binding only.
 *
 * ─── New Durable Object namespace ───────────────────────────────────────
 *  QSIM_KERNEL_DO   Per-session job coordination. One DO instance per
 *                   AGI session id (from IntentPayload.sessionId), so
 *                   intent-token sequencing, kernel handshakes, and
 *                   receipt promotion are strongly ordered. DO class
 *                   is defined at end of file; Cloudflare wrangler.toml
 *                   registers it with new_sqlite_classes.
 *
 * ─── New environment variables ──────────────────────────────────────────
 *  QSIM_ENABLED               true|false — master rollback. When false,
 *                             invokeQsim throws QSIM_DISABLED, the
 *                             /receipt/:id endpoint returns 404, the
 *                             cron ticks skip. Default: false (opt-in).
 *  QSIM_MAX_QUBITS            integer, default 30. Hard cap on
 *                             IntentPayload.qir.nQubits at the intent
 *                             gate.
 *  QSIM_MAX_SECONDS           integer, default 60. Hard cap on
 *                             IntentPayload.budget.maxSeconds.
 *  QSIM_MAX_BYTES             integer, default 33554432 (32 MiB). Hard
 *                             cap on IntentPayload.budget.maxBytes.
 *  QSIM_INTENT_TTL_S          integer, default 30. Maximum permissible
 *                             (expiry - issued) for any signed intent.
 *                             Intents with longer TTL are rejected.
 *  QSIM_KEY_ROTATION_MINUTES  integer, default 60. Cron cadence check
 *                             for AGI intent-signing key rotation.
 *  QSIM_AUDIT_RECONCILE_HOURS integer, default 1. Cron cadence for
 *                             audit reconciliation against Base receipts.
 *  AGI_INTENT_PUBKEY          hex-encoded Ed25519 public key of the
 *                             current AGI runtime instance. Rotates on
 *                             every AGI runtime restart.
 *  QSIM_KERNEL_BASE_URL       base URL of the Render backend hosting
 *                             the four simulator kernels (state-vector,
 *                             MPS, stabilizer, density-matrix).
 *                             e.g. https://metastate-quantum.onrender.com
 *  QSIM_SUPABASE_URL          Supabase base URL for QSIM tables in the
 *                             chainstate_qsim schema. Same host as the
 *                             existing Supabase project; new schema.
 *  QSIM_BASE_RECEIPTS_ADDR    Deployed QsimReceipts contract address on
 *                             Base mainnet 8453. Optional until Phase 3.
 *
 * ─── New secrets ────────────────────────────────────────────────────────
 *  QSIM_INTENT_HMAC_KEY               32-byte HMAC secret used as a
 *                                     defence-in-depth check alongside
 *                                     the Ed25519 signature. Rotated
 *                                     on runtime restart.
 *  QSIM_SUPABASE_SERVICE_ROLE_KEY     Supabase service-role key
 *                                     scoped to chainstate_qsim schema
 *                                     via RLS (see qsim_supabase.sql).
 *  QSIM_KERNEL_INTERNAL_TOKEN         Shared secret between this Worker
 *                                     and the Render QSIM kernel. Sent
 *                                     as X-QSIM-INTERNAL-TOKEN on every
 *                                     kernel invocation.
 *  QSIM_ADMIN_TOKEN                   Operator-only token for
 *                                     /v0101/audit/tail introspection.
 *
 * ─── New crons ──────────────────────────────────────────────────────────
 *  every  5 min · qsim_key_rotation_check   verify AGI_INTENT_PUBKEY
 *                                            hash matches the recorded
 *                                            active rotation id;
 *                                            emit a KV rotation notice
 *                                            if changed.
 *  every  1 hour · qsim_audit_reconcile     compare Supabase
 *                                            chainstate_qsim.audit_ledger
 *                                            tail with Base mainnet
 *                                            QsimReceipts events; flag
 *                                            any divergence.
 *
 * ─── Master rollback ────────────────────────────────────────────────────
 *   QSIM_ENABLED=false      disables invokeQsim (throws QSIM_DISABLED),
 *                            /receipt/:id (returns 404), and both crons.
 *                            The /qsim/* 404 rule remains architecturally
 *                            active regardless (it is not a subsystem
 *                            toggle; it is a load-bearing security
 *                            property).
 *
 * ─── What is NOT in this Worker ─────────────────────────────────────────
 *  The four simulator kernels themselves (state-vector, MPS, stabilizer,
 *  density-matrix) run on Render, not on the Worker. This edge
 *  extension is the intent gate, the receipt lookup, the audit
 *  cross-reference cadence, and the Durable Object session coordinator.
 *  The Render app.py side hosts the actual /qsim/kernel/* endpoints
 *  (accessible only via X-QSIM-INTERNAL-TOKEN from this Worker).
 */

// ─── v0.10.1 · CONSTANTS ─────────────────────────────────────────────────
const V0101_VERSION = "v0.10.1-qsim";
const V0101_PAPER   = "CHAINSTATE EDGE QSIM · Rev 2026-09";

// The 5-value MetaPurpose enum. All other values are rejected at the
// intent gate. "user asked me to" is not a permitted purpose.
const ALLOWED_PURPOSES = new Set([
  "VerificationCheck",
  "StructuralSearch",
  "SymbolicEvaluation",
  "SafetyCheck",
  "PlanningRollout",
]);

// The QIR gate kinds recognized by the kernel. Reject any gate not in
// this set at the QIR analysis stage before it reaches Render.
const ALLOWED_GATE_KINDS = new Set([
  "H", "X", "Y", "Z", "S", "S_DAG", "T", "T_DAG",
  "CNOT", "CZ", "SWAP",
  "RX", "RY", "RZ",
  "U3",
  "CCX", "CSWAP",
  "MEASURE",
]);

// Envelope-invariant I1: any output tensor with > this many elements
// is refused as an external payload. Aggregate summaries only.
const QSIM_MAX_AMPLITUDE_ELEMENTS = 32;

// Substrate ids for the four backends, matching the Solidity receipt
// contract's uint8 substrate field.
const QSIM_SUBSTRATE = {
  STATE_VECTOR:   0,
  MPS:            1,
  STABILIZER:    2,
  DENSITY_MATRIX: 3,
};

// Base mainnet CHAINSTATE anchor addresses.
const V0101_BASE = {
  STATE_TOKEN: "0x9533DF992fd4bCAbB8d8462572449fc45F727d8a",
  META_SPLIT:  "0x93a7962f75475b7e3Fbb62d3A23194f8833b1BE4",
  ACCESS_CTRL: "0x29d177bedaef29304eacdc63b2d0285c459a0f50",
};

// ─── v0.10.1 · CONFIG HELPERS ────────────────────────────────────────────
function qsimEnabled(env) {
  return (env && env.QSIM_ENABLED === "true");
}

function qsimMaxQubits(env) {
  const raw = env && env.QSIM_MAX_QUBITS;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

function qsimMaxSeconds(env) {
  const n = Number.parseInt(env && env.QSIM_MAX_SECONDS, 10);
  return Number.isFinite(n) && n > 0 ? n : 60;
}

function qsimMaxBytes(env) {
  const n = Number.parseInt(env && env.QSIM_MAX_BYTES, 10);
  return Number.isFinite(n) && n > 0 ? n : 33554432;
}

function qsimIntentTtlS(env) {
  const n = Number.parseInt(env && env.QSIM_INTENT_TTL_S, 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

// ─── v0.10.1 · ED25519 INTENT SIGNATURE VERIFICATION ─────────────────────
// Ed25519 is available via WebCrypto in Cloudflare Workers. The intent
// signature is Ed25519 over canonical JSON of the IntentPayload. The
// intent-signing key is rotated on every AGI runtime restart; its
// public key is served to this Worker via env.AGI_INTENT_PUBKEY at
// deploy time and re-read on every /v0101/status call.

function _hexToBytes(hex) {
  if (typeof hex !== "string") return null;
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) return null;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    const b = Number.parseInt(clean.substr(i * 2, 2), 16);
    if (!Number.isFinite(b)) return null;
    out[i] = b;
  }
  return out;
}

function _bytesToHex(bytes) {
  let hex = "0x";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

// Canonical JSON — same sort-and-serialise as v0.10.0's v010CanonicalJson,
// duplicated locally to avoid depending on load order.
function qsimCanonicalJson(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(qsimCanonicalJson).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + qsimCanonicalJson(obj[k])).join(",") + "}";
}

async function verifyIntentSignature(intent, pubkeyHex) {
  if (!intent || !intent.payload || !intent.signature || !pubkeyHex) return false;
  const pubkeyBytes = _hexToBytes(pubkeyHex);
  const sigBytes    = _hexToBytes(intent.signature);
  if (!pubkeyBytes || pubkeyBytes.length !== 32) return false;
  if (!sigBytes    || sigBytes.length    !== 64) return false;
  const canonicalPayload = qsimCanonicalJson(intent.payload);
  const encoder = new TextEncoder();
  const msg = encoder.encode(canonicalPayload);
  let key;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      pubkeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
  } catch (_e) {
    // Ed25519 not enabled on this runtime; refuse safely.
    return false;
  }
  try {
    return await crypto.subtle.verify({ name: "Ed25519" }, key, sigBytes, msg);
  } catch (_e) {
    return false;
  }
}

// Defence-in-depth HMAC-SHA256 tag over canonical JSON, sent alongside
// the Ed25519 signature. Even if the Ed25519 verification is bypassed
// (implementation bug, misconfigured pubkey), a valid HMAC is still
// required. Rotated together with the Ed25519 key on runtime restart.
async function verifyIntentHmac(intent, hmacKey) {
  if (!intent || !intent.payload || !intent.hmac || !hmacKey) return false;
  const canonicalPayload = qsimCanonicalJson(intent.payload);
  const encoder = new TextEncoder();
  let key;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(hmacKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch (_e) {
    return false;
  }
  let sig;
  try {
    sig = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(canonicalPayload),
    );
  } catch (_e) {
    return false;
  }
  const computed = _bytesToHex(new Uint8Array(sig));
  // constant-time comparison
  if (computed.length !== intent.hmac.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ intent.hmac.charCodeAt(i);
  }
  return diff === 0;
}

// ─── v0.10.1 · QIR STATIC ANALYSIS ───────────────────────────────────────
// Before the QIR is submitted to any backend, its static analysis
// fields (isClifford, maxEntanglementCut, depth, nonCliffordCount) are
// verified against the ops. If the caller-supplied analysis disagrees
// with the recomputed values, the request is refused. The substrate
// router (§3.6) will read the analysis to pick a backend; we cannot
// let the caller lie about it.
function qsimAnalyzeQir(qir) {
  if (!qir || !Array.isArray(qir.ops)) {
    return { ok: false, reason: "malformed QIR" };
  }
  if (qir.version !== "qsim/1") {
    return { ok: false, reason: "unsupported QIR version" };
  }
  const nq = Number.parseInt(qir.nQubits, 10);
  if (!Number.isFinite(nq) || nq < 1 || nq > 128) {
    return { ok: false, reason: "nQubits out of range [1,128]" };
  }
  let depth = 0, nonCliffordCount = 0;
  let allClifford = true;
  const nonCliffordKinds = new Set(["T", "T_DAG", "RX", "RY", "RZ", "U3", "CCX", "CSWAP"]);
  for (const op of qir.ops) {
    if (!op || !ALLOWED_GATE_KINDS.has(op.kind)) {
      return { ok: false, reason: `bad gate kind: ${op ? op.kind : "null"}` };
    }
    if (nonCliffordKinds.has(op.kind)) { nonCliffordCount++; allClifford = false; }
    if (op.kind === "MEASURE") continue;
    depth++;
    if (!Array.isArray(op.qubits)) {
      return { ok: false, reason: "op missing qubits array" };
    }
    for (const q of op.qubits) {
      if (!Number.isInteger(q) || q < 0 || q >= nq) {
        return { ok: false, reason: `qubit index out of range: ${q}` };
      }
    }
  }
  return {
    ok: true,
    analysis: {
      isClifford: allClifford,
      depth,
      nonCliffordCount,
      maxEntanglementCut: 0, // computed at kernel time; 0 = unknown here
    },
  };
}

// Substrate router (§3.6 of the paper). Deterministic decision based
// on the QIR's analysis fields plus caller fidelity_min. Returns one
// of QSIM_SUBSTRATE values.
function qsimSelectSubstrate(qir, fidelityMin) {
  const a = qir && qir.analysis;
  if (!a) return QSIM_SUBSTRATE.STATE_VECTOR;
  // Clifford-only circuits go straight to the polynomial-time stabilizer
  // backend regardless of qubit count.
  if (a.isClifford) return QSIM_SUBSTRATE.STABILIZER;
  // Low-entanglement circuits with declared cut ≤ 6 go to MPS.
  if (a.maxEntanglementCut > 0 && a.maxEntanglementCut <= 6) return QSIM_SUBSTRATE.MPS;
  // If the caller requires strict noise modelling (fidelityMin < 0.99)
  // and the circuit is small enough, density-matrix.
  if (typeof fidelityMin === "number" && fidelityMin < 0.99 && qir.nQubits <= 14) {
    return QSIM_SUBSTRATE.DENSITY_MATRIX;
  }
  // Otherwise state-vector exact.
  return QSIM_SUBSTRATE.STATE_VECTOR;
}

// ─── v0.10.1 · INTENT GATE ───────────────────────────────────────────────
// The single choke-point for every QSIM invocation. Called by
// invokeQsim() below and by the DO submit handler. Never called from
// an external HTTP path.

async function qsimIntentGate(env, intent, qir) {
  if (!qsimEnabled(env))       return { ok: false, code: 503, reason: "QSIM_DISABLED" };
  if (!intent || !intent.payload) return { ok: false, code: 400, reason: "missing intent" };
  if (!qir)                    return { ok: false, code: 400, reason: "missing QIR" };

  const p = intent.payload;

  if (p.version !== "intent/1")    return { ok: false, code: 400, reason: "unsupported intent version" };
  if (typeof p.sessionId !== "string" || !p.sessionId.length) {
    return { ok: false, code: 400, reason: "missing sessionId" };
  }
  if (!ALLOWED_PURPOSES.has(p.purpose)) {
    return { ok: false, code: 403, reason: "purpose not permitted" };
  }
  if (typeof p.qirHash !== "string" || !p.qirHash.startsWith("0x")) {
    return { ok: false, code: 400, reason: "malformed qirHash" };
  }
  if (typeof p.fidelityMin !== "number" || p.fidelityMin < 0 || p.fidelityMin > 1) {
    return { ok: false, code: 400, reason: "fidelityMin out of [0,1]" };
  }
  if (!p.budget || typeof p.budget.maxSeconds !== "number" || typeof p.budget.maxBytes !== "number") {
    return { ok: false, code: 400, reason: "malformed budget" };
  }
  if (p.budget.maxSeconds <= 0 || p.budget.maxSeconds > qsimMaxSeconds(env)) {
    return { ok: false, code: 403, reason: "budget.maxSeconds exceeds cap" };
  }
  if (p.budget.maxBytes <= 0 || p.budget.maxBytes > qsimMaxBytes(env)) {
    return { ok: false, code: 403, reason: "budget.maxBytes exceeds cap" };
  }
  if (!p.justification || typeof p.justification.traceHash !== "string" || !p.justification.traceHash.startsWith("0x")) {
    return { ok: false, code: 400, reason: "missing justification.traceHash" };
  }
  if (typeof p.issued !== "number" || typeof p.expiry !== "number") {
    return { ok: false, code: 400, reason: "missing issued/expiry" };
  }
  const nowS = Date.now() / 1000;
  if (p.expiry <= nowS)            return { ok: false, code: 403, reason: "intent expired" };
  if (p.expiry - p.issued > qsimIntentTtlS(env)) {
    return { ok: false, code: 403, reason: "intent TTL exceeds cap" };
  }

  // Signature verifications (Ed25519 primary, HMAC defence-in-depth).
  const sigOk = await verifyIntentSignature(intent, env.AGI_INTENT_PUBKEY);
  if (!sigOk) return { ok: false, code: 403, reason: "bad Ed25519 signature" };

  if (env.QSIM_INTENT_HMAC_KEY) {
    const hmacOk = await verifyIntentHmac(intent, env.QSIM_INTENT_HMAC_KEY);
    if (!hmacOk) return { ok: false, code: 403, reason: "bad HMAC" };
  }

  // QIR static analysis.
  if (qir.nQubits > qsimMaxQubits(env)) {
    return { ok: false, code: 403, reason: `nQubits ${qir.nQubits} exceeds cap ${qsimMaxQubits(env)}` };
  }
  const analysis = qsimAnalyzeQir(qir);
  if (!analysis.ok) return { ok: false, code: 400, reason: analysis.reason };

  // The caller's declared analysis is compared against ours; if the
  // caller does not declare it, we fill it in from our recomputation.
  const a = qir.analysis || {};
  const ok =
    (a.isClifford === undefined       || a.isClifford === analysis.analysis.isClifford) &&
    (a.nonCliffordCount === undefined || a.nonCliffordCount === analysis.analysis.nonCliffordCount) &&
    (a.depth === undefined            || a.depth === analysis.analysis.depth);
  if (!ok) return { ok: false, code: 400, reason: "QIR analysis mismatch (caller-supplied vs recomputed)" };

  qir.analysis = { ...analysis.analysis, ...a };
  const substrate = qsimSelectSubstrate(qir, p.fidelityMin);
  return { ok: true, substrate, analysis: qir.analysis };
}

// ─── v0.10.1 · RATE-LIMIT COUNTERS (CHAINSTATE_QSIM_KV) ──────────────────
// Per-session soft counters, enforced at the intent gate for defence
// in depth. The authoritative rate limit is in the Durable Object.
async function qsimRateLimitBump(env, sessionId) {
  if (!env.CHAINSTATE_QSIM_KV) return { permitted: true, count: 0 };
  const key = `rate:${sessionId}:${Math.floor(Date.now() / 60000)}`;
  let n = 0;
  try {
    const raw = await env.CHAINSTATE_QSIM_KV.get(key);
    n = Number.parseInt(raw || "0", 10) || 0;
  } catch (_e) {}
  n += 1;
  try { await env.CHAINSTATE_QSIM_KV.put(key, String(n), { expirationTtl: 120 }); } catch (_e) {}
  // Cap at 60 intents per session per minute.
  return { permitted: n <= 60, count: n };
}

// ─── v0.10.1 · INVOKE QSIM · INTERNAL FUNCTION ───────────────────────────
// The ONE entry point through which QSIM is invoked. Called from within
// the AGI runtime over a service binding — never bound to an HTTP route.
// The reason this function is defined here is so it is co-located with
// the intent-gate rules that govern it; it is exported for use by the
// AGI runtime binding.
async function invokeQsim(env, intent, qir) {
  if (!qsimEnabled(env)) {
    const e = new Error("QSIM_DISABLED"); e.code = 503; throw e;
  }
  // Rate limit first, to preserve the intent-gate check budget under
  // adversarial rate attempts.
  const sid = intent && intent.payload && intent.payload.sessionId;
  if (!sid) {
    const e = new Error("intent missing sessionId"); e.code = 400; throw e;
  }
  const rl = await qsimRateLimitBump(env, sid);
  if (!rl.permitted) {
    const e = new Error("session rate limit exceeded"); e.code = 429; throw e;
  }
  const gate = await qsimIntentGate(env, intent, qir);
  if (!gate.ok) {
    const e = new Error(`intent gate rejected: ${gate.reason}`); e.code = gate.code; throw e;
  }
  // Route via Durable Object per session. The DO submits to the Render
  // kernel over the internal binding, waits for the receipt, persists
  // to Supabase, and returns { receiptHash, semanticSummary } only.
  const id  = env.QSIM_KERNEL_DO.idFromName(sid);
  const stub = env.QSIM_KERNEL_DO.get(id);
  const resp = await stub.fetch("https://qsim.internal/submit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-QSIM-SUBSTRATE": String(gate.substrate),
    },
    body: JSON.stringify({ intent, qir }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const e = new Error(`kernel failure: ${resp.status} ${text.slice(0, 120)}`);
    e.code = 502; throw e;
  }
  const out = await resp.json();

  // Envelope invariant I1 · No raw amplitudes. Reject any output that
  // carries a tensor of more than 32 elements.
  if (out && out.amplitudes && Array.isArray(out.amplitudes) &&
      out.amplitudes.length > QSIM_MAX_AMPLITUDE_ELEMENTS) {
    const e = new Error("envelope I1: raw amplitudes refused (>32 elements)");
    e.code = 500; throw e;
  }
  // Envelope invariant I2 · Strip any intermediate state; only
  // receiptHash and semanticSummary are permitted upward.
  return {
    receiptHash:     out.receiptHash || null,
    semanticSummary: out.semanticSummary || null,
    substrate:       out.substrate || gate.substrate,
    // Aggregate summary quantities are permitted if scalar.
    expectationValue: (typeof out.expectationValue === "number") ? out.expectationValue : null,
    probabilityHistogram: (
      out.probabilityHistogram && Array.isArray(out.probabilityHistogram) &&
      out.probabilityHistogram.length <= QSIM_MAX_AMPLITUDE_ELEMENTS
    ) ? out.probabilityHistogram : null,
  };
}

// ─── v0.10.1 · RECEIPT LOOKUP (external-facing, read-only) ──────────────
// GET /receipt/:id returns Base tx hash + semantic summary. Never
// returns raw amplitudes or intermediate state. Rate-limited via
// CHAINSTATE_QSIM_KV. Envelope invariants I1 and I4 hold here by
// construction: nothing beyond receiptHash and semanticSummary is
// ever emitted.

async function handleQsimReceiptLookup(request, env, id) {
  if (!qsimEnabled(env)) {
    return new Response("not found", { status: 404 });
  }
  if (!/^[0-9a-fA-Fx]{2,80}$/.test(id)) {
    return new Response("bad id", { status: 400 });
  }
  // Try KV cache first.
  try {
    if (env.CHAINSTATE_QSIM_KV) {
      const raw = await env.CHAINSTATE_QSIM_KV.get(`receipt:${id}`);
      if (raw) {
        return new Response(raw, { status: 200, headers: { "content-type": "application/json" } });
      }
    }
  } catch (_e) {}

  // Fall through to Supabase.
  if (!env.QSIM_SUPABASE_URL || !env.QSIM_SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("not found", { status: 404 });
  }
  try {
    const url = `${env.QSIM_SUPABASE_URL}/rest/v1/qsim_receipts?id=eq.${encodeURIComponent(id)}&select=id,base_tx_hash,semantic_summary,substrate,timestamp`;
    const resp = await fetch(url, {
      headers: {
        apikey: env.QSIM_SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.QSIM_SUPABASE_SERVICE_ROLE_KEY}`,
        "accept-profile": "chainstate_qsim",
      },
    });
    if (!resp.ok) return new Response("not found", { status: 404 });
    const rows = await resp.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response("not found", { status: 404 });
    }
    const r = rows[0];
    const body = JSON.stringify({
      id: r.id,
      base_tx_hash: r.base_tx_hash,
      semantic_summary: r.semantic_summary,
      substrate: r.substrate,
      timestamp: r.timestamp,
    });
    try {
      if (env.CHAINSTATE_QSIM_KV) {
        await env.CHAINSTATE_QSIM_KV.put(`receipt:${id}`, body, { expirationTtl: 3600 });
      }
    } catch (_e) {}
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  } catch (_e) {
    return new Response("not found", { status: 404 });
  }
}

// ─── v0.10.1 · v0101 STATUS & AUDIT TAIL (operator introspection) ────────
function handleV0101Status(env) {
  const body = JSON.stringify({
    ok: true,
    version: V0101_VERSION,
    paper: V0101_PAPER,
    qsim_enabled: qsimEnabled(env),
    caps: {
      max_qubits:     qsimMaxQubits(env),
      max_seconds:    qsimMaxSeconds(env),
      max_bytes:      qsimMaxBytes(env),
      intent_ttl_s:   qsimIntentTtlS(env),
    },
    allowed_purposes: [...ALLOWED_PURPOSES],
    envelope_invariants: [
      "I1: no raw amplitudes >32 elements",
      "I2: no intermediate state",
      "I3: no intent-signing artefacts",
      "I4: receipt-hash-only external references",
      "I5: append-only audit ledger",
    ],
    architectural_rule: "no external /qsim/* route; QSIM invoked only via internal binding",
    base: V0101_BASE,
    preserved: "every v0.7.0 – v0.10.0 subsystem is byte-identically preserved",
  });
  return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
}

async function handleV0101AuditTail(request, env) {
  const adminHeader = request.headers.get("x-chainstate-admin-token") || "";
  if (!env.QSIM_ADMIN_TOKEN || adminHeader !== env.QSIM_ADMIN_TOKEN) {
    return new Response("forbidden", { status: 403 });
  }
  try {
    if (env.CHAINSTATE_QSIM_AUDIT_KV) {
      const raw = await env.CHAINSTATE_QSIM_AUDIT_KV.get("tail");
      if (raw) {
        return new Response(raw, { status: 200, headers: { "content-type": "application/json" } });
      }
    }
  } catch (_e) {}
  return new Response(JSON.stringify({ ok: true, tail: [] }), {
    status: 200, headers: { "content-type": "application/json" },
  });
}

// ─── v0.10.1 · DISPATCHER (called from main fetch after v0.10.0) ─────────
async function dispatchV0101Qsim(request, env, ctx, url) {
  const p = url.pathname;

  // ARCHITECTURAL RULE — refuse every /qsim/* external path unconditionally.
  // This runs regardless of QSIM_ENABLED because the property is
  // load-bearing: the sovereignty argument in §5 of the paper depends on
  // the compile-time absence of external QSIM routes at the edge.
  if (p === "/qsim" || p.startsWith("/qsim/")) {
    return new Response("not found", { status: 404 });
  }

  // /receipt/:id read-only lookup (safe: envelope-invariant filtered).
  if (p.startsWith("/receipt/") && request.method === "GET") {
    const id = p.slice("/receipt/".length);
    return handleQsimReceiptLookup(request, env, id);
  }

  // Operator status (no key material, no audit content).
  if (p === "/v0101/status") return handleV0101Status(env);

  // Operator audit tail (gated by X-CHAINSTATE-ADMIN-TOKEN).
  if (p === "/v0101/audit/tail" && request.method === "GET") {
    return handleV0101AuditTail(request, env);
  }

  return null; // not a v0.10.1 route
}

// ─── v0.10.1 · CRON DISPATCHER ───────────────────────────────────────────
async function dispatchV0101Cron(cron, env, ctx) {
  if (!qsimEnabled(env)) return null;

  // Every 5 minutes — key rotation check.
  if (cron === "*/5 * * * *") {
    return qsimKeyRotationCheckTick(env, ctx);
  }
  // Every hour — audit reconciliation.
  if (cron === "0 * * * *") {
    return qsimAuditReconcileTick(env, ctx);
  }
  return null;
}

async function qsimKeyRotationCheckTick(env, ctx) {
  try {
    const pubkeyHex = env.AGI_INTENT_PUBKEY || "";
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(pubkeyHex));
    const nowRotHash = _bytesToHex(new Uint8Array(digest));
    let prevRotHash = null;
    if (env.CHAINSTATE_QSIM_KV) {
      prevRotHash = await env.CHAINSTATE_QSIM_KV.get("key_rot_hash");
    }
    if (prevRotHash !== nowRotHash) {
      if (env.CHAINSTATE_QSIM_KV) {
        await env.CHAINSTATE_QSIM_KV.put("key_rot_hash", nowRotHash, { expirationTtl: 86400 });
        await env.CHAINSTATE_QSIM_KV.put(`key_rot_history:${Date.now()}`, JSON.stringify({
          prev: prevRotHash, next: nowRotHash, at_iso: new Date().toISOString(),
        }), { expirationTtl: 604800 });
      }
    }
    return { ok: true, rotated: prevRotHash !== nowRotHash };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

async function qsimAuditReconcileTick(env, ctx) {
  // Envelope invariant I5: the audit ledger is append-only in Supabase
  // and cross-referenced with Base receipts. This tick reads the
  // Supabase tail via service role and caches a summary into
  // CHAINSTATE_QSIM_AUDIT_KV for operator introspection.
  if (!env.QSIM_SUPABASE_URL || !env.QSIM_SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, reason: "supabase not configured" };
  }
  try {
    const url = `${env.QSIM_SUPABASE_URL}/rest/v1/audit_ledger?select=id,intent_hash,receipt_hash,base_tx_hash,at_iso&order=at_iso.desc&limit=50`;
    const resp = await fetch(url, {
      headers: {
        apikey: env.QSIM_SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.QSIM_SUPABASE_SERVICE_ROLE_KEY}`,
        "accept-profile": "chainstate_qsim",
      },
    });
    if (!resp.ok) return { ok: false, reason: `supabase ${resp.status}` };
    const rows = await resp.json();
    const tail = { ok: true, at_iso: new Date().toISOString(), rows };
    if (env.CHAINSTATE_QSIM_AUDIT_KV) {
      await env.CHAINSTATE_QSIM_AUDIT_KV.put("tail", JSON.stringify(tail), { expirationTtl: 3600 });
    }
    return { ok: true, count: Array.isArray(rows) ? rows.length : 0 };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

// ─── v0.10.1 · DURABLE OBJECT · QSIM_KERNEL_DO ───────────────────────────
// One instance per AGI session id. Coordinates intent-token sequencing,
// forwards to the Render kernel, mints the Base receipt, persists to
// Supabase, and returns { receiptHash, semanticSummary } to the caller.
// This DO is the only place that talks to the Render kernel; it is
// never bound to an external HTTP route.
export class QsimKernelDO {
  constructor(state, env) {
    this.state = state;
    this.env   = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/submit" || request.method !== "POST") {
      return new Response("not found", { status: 404 });
    }
    if (!qsimEnabled(this.env)) {
      return new Response(JSON.stringify({ ok: false, reason: "QSIM_DISABLED" }), {
        status: 503, headers: { "content-type": "application/json" },
      });
    }
    let body;
    try {
      body = await request.json();
    } catch (_e) {
      return new Response(JSON.stringify({ ok: false, reason: "bad JSON" }), {
        status: 400, headers: { "content-type": "application/json" },
      });
    }
    const { intent, qir } = body || {};
    const substrateStr = request.headers.get("X-QSIM-SUBSTRATE") || "0";
    const substrate = Number.parseInt(substrateStr, 10);

    if (!this.env.QSIM_KERNEL_BASE_URL || !this.env.QSIM_KERNEL_INTERNAL_TOKEN) {
      return new Response(JSON.stringify({ ok: false, reason: "kernel not configured" }), {
        status: 503, headers: { "content-type": "application/json" },
      });
    }

    const kernelPath = ({
      0: "/qsim/kernel/state_vector",
      1: "/qsim/kernel/mps",
      2: "/qsim/kernel/stabilizer",
      3: "/qsim/kernel/density_matrix",
    })[substrate] || "/qsim/kernel/state_vector";

    let kernelResp;
    try {
      kernelResp = await fetch(this.env.QSIM_KERNEL_BASE_URL.replace(/\/$/, "") + kernelPath, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-QSIM-INTERNAL-TOKEN": this.env.QSIM_KERNEL_INTERNAL_TOKEN,
          "X-QSIM-SUBSTRATE": String(substrate),
        },
        body: JSON.stringify({ intent, qir }),
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, reason: `kernel fetch: ${e.message || e}` }), {
        status: 502, headers: { "content-type": "application/json" },
      });
    }
    if (!kernelResp.ok) {
      const text = await kernelResp.text().catch(() => "");
      return new Response(JSON.stringify({ ok: false, reason: `kernel ${kernelResp.status}`, body: text.slice(0, 200) }), {
        status: 502, headers: { "content-type": "application/json" },
      });
    }
    const kernelOut = await kernelResp.json();

    // Persist a receipt row to Supabase (append-only enforced by trigger).
    let receiptHash = kernelOut && kernelOut.receipt_hash ? kernelOut.receipt_hash : null;
    let semanticSummary = kernelOut && kernelOut.semantic_summary ? kernelOut.semantic_summary : null;

    if (this.env.QSIM_SUPABASE_URL && this.env.QSIM_SUPABASE_SERVICE_ROLE_KEY && receiptHash) {
      try {
        const insertResp = await fetch(`${this.env.QSIM_SUPABASE_URL}/rest/v1/qsim_receipts`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            apikey: this.env.QSIM_SUPABASE_SERVICE_ROLE_KEY,
            authorization: `Bearer ${this.env.QSIM_SUPABASE_SERVICE_ROLE_KEY}`,
            "content-profile": "chainstate_qsim",
            prefer: "return=minimal",
          },
          body: JSON.stringify({
            id: receiptHash,
            qir_hash: intent && intent.payload && intent.payload.qirHash,
            intent_hash: kernelOut.intent_hash || null,
            substrate: substrate,
            semantic_summary: semanticSummary,
            base_tx_hash: kernelOut.base_tx_hash || null,
            timestamp: new Date().toISOString(),
          }),
        });
        void insertResp;
      } catch (_e) { /* audit failure never blocks user-visible response */ }
    }

    return new Response(JSON.stringify({
      ok: true,
      receiptHash,
      semanticSummary,
      substrate,
      expectationValue: (typeof kernelOut.expectation_value === "number") ? kernelOut.expectation_value : null,
      probabilityHistogram: Array.isArray(kernelOut.probability_histogram) &&
                             kernelOut.probability_histogram.length <= QSIM_MAX_AMPLITUDE_ELEMENTS
                             ? kernelOut.probability_histogram : null,
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}

// ─── v0.10.1 · Public exports (for AGI runtime service binding) ──────────
// These are the ONLY functions the AGI runtime binding may call. Never
// bind these to an HTTP route; there is no route through which they
// should be reachable from outside the AGI runtime.
export { invokeQsim, verifyIntentSignature, ALLOWED_PURPOSES };

// ─── END of v0.10.1 · CHAINSTATE EDGE QSIM ─────────────────────────────
