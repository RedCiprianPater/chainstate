"""
chainstate.consensus.protocol
=============================
Reputation-weighted Bayesian log-pooling consensus.

Public surface:
  · ReputationSystem        — EMA reputation per node (α / β / γ rules)
  · LogPoolingConsensus     — iterative log-pool with 0.7 agreement filter
  · CognitiveTransaction    — tx = (sender, nonce, query, gas, ...) → SHA3 hash
  · SwarmNode               — minimal node interface returning NodeOutput

Reference implementation. Production swarm nodes run a much larger pipeline
(model shards, KV-cached attention, Dilithium signing); this file gives the
shapes and the math, suitable for in-process simulation and unit tests.
"""
from __future__ import annotations

import hashlib
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Any

import torch
import torch.nn.functional as F


TOTAL_DIM = 65_536


# ── Reputation ─────────────────────────────────────────────────────
class ReputationSystem:
    """
    Per-node reputation in [0, 100].

    Update rule (called after each consensus round, given the node's
    cosine-similarity 'accuracy' against the final consensus):

        if accuracy > 0.8:   rep += alpha * accuracy            # reward
        elif accuracy < 0.5: rep -= beta  * (1 - accuracy)      # penalty
        else:                rep *= gamma                       # decay

    Reputation is then clamped to [0, 100] and capped at min(stake/10, 100).
    """

    def __init__(self, alpha: float = 0.1, beta: float = 0.2, gamma: float = 0.99,
                 history_window: int = 1_000):
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.history_window = history_window
        self._rep: dict[str, float] = {}
        self._stake: dict[str, float] = {}
        self._accuracy_history: dict[str, deque[float]] = {}
        self._last_active: dict[str, float] = {}

    # ── registration / lookup ─────────────────────────────────
    def register(self, node_id: str, stake: float = 0.0, initial_rep: float = 50.0) -> None:
        self._rep.setdefault(node_id, initial_rep)
        self._stake[node_id] = stake
        self._accuracy_history.setdefault(node_id, deque(maxlen=self.history_window))
        self._last_active[node_id] = time.time()

    def get(self, node_id: str) -> float:
        return self._rep.get(node_id, 50.0)

    def all(self) -> dict[str, float]:
        return dict(self._rep)

    def stake_of(self, node_id: str) -> float:
        return self._stake.get(node_id, 0.0)

    def rep_cap(self, node_id: str) -> float:
        return min(self.stake_of(node_id) / 10.0, 100.0) if node_id in self._stake else 100.0

    # ── update ────────────────────────────────────────────────
    def update(self, node_id: str, accuracy: float) -> float:
        """
        accuracy: cosine similarity of node's state vs final consensus, ∈ [-1, 1].
        Returns the new reputation.
        """
        accuracy = max(-1.0, min(1.0, accuracy))
        rep = self._rep.setdefault(node_id, 50.0)
        if accuracy > 0.8:
            rep += self.alpha * accuracy
        elif accuracy < 0.5:
            rep -= self.beta * (1.0 - accuracy)
        else:
            rep *= self.gamma
        # cap by stake
        cap = self.rep_cap(node_id)
        rep = max(0.0, min(cap, rep))
        self._rep[node_id] = rep
        self._accuracy_history.setdefault(node_id, deque(maxlen=self.history_window)).append(accuracy)
        self._last_active[node_id] = time.time()
        return rep

    # ── selection helpers ─────────────────────────────────────
    def top_k(self, k: int, eps_greedy: float = 0.1) -> list[str]:
        """Reputation-weighted top-K with ε-greedy random sample for new nodes."""
        if not self._rep:
            return []
        items = sorted(self._rep.items(), key=lambda kv: kv[1], reverse=True)
        top = [n for n, _ in items[: max(1, int(k * (1.0 - eps_greedy)))]]
        # ε random samples (any nodes not already in top)
        rest = [n for n, _ in items if n not in top]
        if rest:
            random_k = max(0, k - len(top))
            # deterministic-ish: take from the middle of the list
            mid = rest[len(rest) // 4 :]
            top.extend(mid[:random_k])
        return top[:k]

    def decay_inactive(self, max_idle_seconds: float = 86_400.0) -> None:
        now = time.time()
        for n, last in list(self._last_active.items()):
            if now - last > max_idle_seconds:
                self._rep[n] = self._rep.get(n, 50.0) * self.gamma


# ── Log-pooling consensus ──────────────────────────────────────────
class LogPoolingConsensus:
    """
    Iterative reputation-weighted Bayesian log-pooling.

      P(c) ∝ ∏_i P(s_i)^w_i   ⇔   log P(c) = Σ_i w_i · log P(s_i)

    With per-round 0.7 cosine agreement filter; converges when
    cos(c_t, c_{t-1}) > 0.95. Hard min 10 participants.
    """

    def __init__(self, agreement_threshold: float = 0.7,
                 convergence_threshold: float = 0.95,
                 min_participants: int = 10,
                 max_rounds: int = 7):
        self.agreement_threshold = agreement_threshold
        self.convergence_threshold = convergence_threshold
        self.min_participants = min_participants
        self.max_rounds = max_rounds

    def step(self, states: torch.Tensor, reputations: torch.Tensor) -> torch.Tensor:
        """
        states:       [k, TOTAL_DIM]  per-node symbolic state vectors
        reputations:  [k]             per-node reputation ≥ 0
        Returns:      [TOTAL_DIM]     log-pooled consensus probability vector
        """
        # numerical stability: log_softmax
        log_p = F.log_softmax(states, dim=-1)                      # [k, D]
        w = reputations / reputations.sum().clamp_min(1e-9)        # [k]
        log_c = (log_p * w.view(-1, 1)).sum(0)                     # [D]
        # normalise to a proper probability
        consensus = (log_c - torch.logsumexp(log_c, dim=0)).exp()  # [D]
        return consensus

    def run(self, states: torch.Tensor, reputations: torch.Tensor) -> dict:
        """
        Full iterative consensus with per-round agreement filter.
        Returns dict { consensus, depth, participants, converged, agreement_history }.
        """
        if states.shape[0] < self.min_participants:
            raise ValueError(
                f"need at least {self.min_participants} participants, got {states.shape[0]}"
            )

        agreement_history: list[float] = []
        prev_consensus = None
        consensus = None
        participating_ids = list(range(states.shape[0]))

        for depth in range(1, self.max_rounds + 1):
            cur_states = states[participating_ids]
            cur_reps = reputations[participating_ids]
            consensus = self.step(cur_states, cur_reps)             # [D]

            # convergence check vs previous round
            if prev_consensus is not None:
                cos = F.cosine_similarity(consensus.unsqueeze(0),
                                          prev_consensus.unsqueeze(0)).item()
                agreement_history.append(cos)
                if cos >= self.convergence_threshold:
                    return {
                        "consensus":       consensus,
                        "depth":           depth,
                        "participants":    participating_ids,
                        "converged":       True,
                        "agreement":       agreement_history,
                    }

            # per-round agreement filter: keep nodes with cos(state, consensus) > 0.7
            sims = F.cosine_similarity(cur_states, consensus.unsqueeze(0).expand_as(cur_states))
            keep_local = (sims > self.agreement_threshold).nonzero(as_tuple=True)[0].tolist()
            if len(keep_local) < self.min_participants:
                # fall back to top-N by similarity to retain the floor
                topk = torch.topk(sims, k=self.min_participants).indices.tolist()
                keep_local = topk
            participating_ids = [participating_ids[i] for i in keep_local]
            prev_consensus = consensus

        return {
            "consensus":    consensus,
            "depth":        self.max_rounds,
            "participants": participating_ids,
            "converged":    False,
            "agreement":    agreement_history,
        }


# ── Cognitive transaction ──────────────────────────────────────────
def _sha3(data: bytes) -> str:
    return hashlib.sha3_256(data).hexdigest()


@dataclass
class CognitiveTransaction:
    """
    sender ‖ nonce ‖ query ‖ ts  → SHA3-256[:16] → hash
    Receipt is populated post-consensus.
    """
    sender:    str
    query:     str
    nonce:     int
    gas_price: float = 0.001
    max_gas:   float = 0.05
    timestamp: float = field(default_factory=time.time)
    hash:      str   = ""
    result:    dict[str, Any] | None = None
    receipt:   dict[str, Any] | None = None

    def __post_init__(self):
        if not self.hash:
            payload = (
                self.sender.encode()
                + str(self.nonce).encode()
                + self.query.encode()
                + str(self.timestamp).encode()
            )
            self.hash = "0x" + _sha3(payload)[:32]

    def to_dict(self) -> dict[str, Any]:
        return {
            "hash":      self.hash,
            "sender":    self.sender,
            "nonce":     self.nonce,
            "query":     self.query,
            "gas_price": self.gas_price,
            "max_gas":   self.max_gas,
            "timestamp": self.timestamp,
            "result":    self.result,
            "receipt":   self.receipt,
        }


# ── Swarm node ─────────────────────────────────────────────────────
@dataclass
class NodeOutput:
    node_id:        str
    symbolic_state: torch.Tensor   # [TOTAL_DIM]
    confidence:     float
    compute_proof:  str            # SHA3-256(node_id ‖ query ‖ ts ‖ state[:1024])
    timestamp:      float


class SwarmNode:
    """
    Minimal swarm node. Real nodes carry the USE/SAM/Composition modules.
    Here we accept a `forward_fn` so callers can plug in any model.
    """

    def __init__(self, node_id: str, forward_fn, capabilities: list[str] | None = None):
        self.node_id = node_id
        self.forward_fn = forward_fn
        self.capabilities = capabilities or ["embedding", "attention"]

    def run(self, query: str) -> NodeOutput:
        ts = time.time()
        state = self.forward_fn(query)            # → [TOTAL_DIM]
        if state.dim() == 0 or state.numel() != TOTAL_DIM:
            raise ValueError(f"forward_fn must return a [{TOTAL_DIM}] tensor")
        # confidence = max-softmax probability (proxy)
        confidence = float(F.softmax(state, dim=0).max().item())
        # compute proof = SHA3 over (node_id, query, ts, top-1024 dims)
        topk_idx = torch.topk(state, k=1_024).indices.tolist()
        proof_payload = (
            self.node_id.encode()
            + query.encode()
            + f"{ts:.6f}".encode()
            + ",".join(str(i) for i in topk_idx).encode()
        )
        return NodeOutput(
            node_id=self.node_id,
            symbolic_state=state,
            confidence=confidence,
            compute_proof="sha3:" + _sha3(proof_payload),
            timestamp=ts,
        )


# ── Gas formula ────────────────────────────────────────────────────
def compute_gas(n_nodes: int, depth: int, execution_ms: int) -> float:
    """Pricing formula from the README / SCAN page."""
    return (
        0.001
        + n_nodes      * 0.00001
        + depth        * 0.00005
        + execution_ms * 0.000001
    )


# ── Smoke test ─────────────────────────────────────────────────────
if __name__ == "__main__":
    # tiny in-process simulation
    rep_sys = ReputationSystem()
    for i in range(12):
        rep_sys.register(f"node-{i:03d}", stake=1_500.0, initial_rep=50.0 + i)

    # synthetic per-node states + reps
    k = 12
    states = torch.randn(k, TOTAL_DIM)
    reps   = torch.tensor([rep_sys.get(f"node-{i:03d}") for i in range(k)])

    consensus = LogPoolingConsensus()
    result = consensus.run(states, reps)
    print(f"converged={result['converged']}  depth={result['depth']}  "
          f"participants={len(result['participants'])}  "
          f"consensus.shape={tuple(result['consensus'].shape)}")

    # update reputations based on accuracy (cosine vs consensus)
    final = result["consensus"]
    for i in range(k):
        acc = F.cosine_similarity(states[i].unsqueeze(0), final.unsqueeze(0)).item()
        new_rep = rep_sys.update(f"node-{i:03d}", acc)
        print(f"  node-{i:03d}  accuracy={acc:+.3f}  rep={new_rep:.2f}")

    # tx hash demo
    tx = CognitiveTransaction(sender="0xabc123", query="∫∂x → ?", nonce=42)
    print(f"\ntx hash: {tx.hash}")

    # gas calc
    print(f"gas (20 nodes, 3 rounds, 800 ms): {compute_gas(20, 3, 800):.6f} $STATE")
