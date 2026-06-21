"""
chainstate.symbolic.embedding
=============================
Universal Semiotic Embedding (USE)
Symbolic Cross-Attention (SAM)
Symbolic Composition

A 65,536-dimensional embedding space across 6 subspaces:

    math     · 4,096 dims  · range [0, 4,096)
    science  · 8,192 dims  · range [4,096, 12,288)
    language · 16,384 dims · range [12,288, 28,672)
    occult   · 4,096 dims  · range [28,672, 32,768)
    emoji    · 16,384 dims · range [32,768, 49,152)
    control  · 16,384 dims · range [49,152, 65,536)

Reference implementation. Real swarm nodes load a quantised shard of this
table per subspace; the full 65,536 × head_dim matrix is materialised at
the consensus layer for log-pooling.
"""
from __future__ import annotations

import math
import unicodedata
from dataclasses import dataclass

import torch
import torch.nn as nn
import torch.nn.functional as F


# ── subspace specification ─────────────────────────────────────────
SUBSPACES = {
    "math":     {"dims": 4_096,  "offset": 0,       "ranges": [(0x2200, 0x22FF), (0x27C0, 0x27EF), (0x2980, 0x29FF)]},
    "science":  {"dims": 8_192,  "offset": 4_096,   "ranges": [(0x2100, 0x214F), (0x1F52A, 0x1F570), (0x26E0, 0x27BF)]},
    "language": {"dims": 16_384, "offset": 12_288,  "ranges": [(0x0041, 0x024F), (0x0370, 0x03FF), (0x0400, 0x04FF),
                                                                (0x0530, 0x058F), (0x0590, 0x05FF), (0x0600, 0x06FF),
                                                                (0x0900, 0x097F), (0x4E00, 0x9FFF), (0xAC00, 0xD7AF)]},
    "occult":   {"dims": 4_096,  "offset": 28_672,  "ranges": [(0x2600, 0x26FF), (0x2638, 0x267F), (0x1F700, 0x1F77F)]},
    "emoji":    {"dims": 16_384, "offset": 32_768,  "ranges": [(0x1F600, 0x1F64F), (0x1F300, 0x1F5FF), (0x1F680, 0x1F6FF),
                                                                (0x1F900, 0x1F9FF), (0x1FA70, 0x1FAFF)]},
    "control":  {"dims": 16_384, "offset": 49_152,  "ranges": [(0x2190, 0x21FF), (0x27F0, 0x297F), (0x2B00, 0x2BFF),
                                                                (0x2400, 0x24FF), (0x2300, 0x23FF)]},
}

TOTAL_DIM = sum(s["dims"] for s in SUBSPACES.values())
assert TOTAL_DIM == 65_536, f"expected 65,536 dims, got {TOTAL_DIM}"

NUM_HEADS = 64
HEAD_DIM  = TOTAL_DIM // NUM_HEADS   # 1,024


# ── codepoint → symbol_id ──────────────────────────────────────────
def codepoint_to_subspace(cp: int) -> str | None:
    """Return the subspace key for a codepoint, or None if out of range."""
    # Quick lookup against declared ranges; fall through to language for any
    # alphabetic codepoint we didn't explicitly enumerate (Unicode is huge).
    for sub, spec in SUBSPACES.items():
        for lo, hi in spec["ranges"]:
            if lo <= cp <= hi:
                return sub
    # Fallback for general alphabetic / letterlike content
    try:
        if unicodedata.category(chr(cp)).startswith("L"):
            return "language"
    except ValueError:
        pass
    return None


def char_to_symbol_id(ch: str) -> int | None:
    cp = ord(ch)
    sub = codepoint_to_subspace(cp)
    if sub is None:
        return None
    spec = SUBSPACES[sub]
    # Map the codepoint to a local index inside the subspace deterministically.
    # In production this uses a frozen vocab table; here we hash for determinism.
    local = cp % spec["dims"]
    return spec["offset"] + local


def query_to_symbol_ids(query: str) -> list[int]:
    """Tokenise a query string to its sequence of symbol IDs."""
    return [sid for ch in query if (sid := char_to_symbol_id(ch)) is not None]


# ── modules ────────────────────────────────────────────────────────
class UniversalSemioticEmbedding(nn.Module):
    """
    The 65,536-d embedding. Per-subspace `nn.Embedding` tables sum to
    `TOTAL_DIM`. `embed_query` returns a single 65,536-d tensor by
    averaging the per-symbol head vectors across positions.
    """
    def __init__(self):
        super().__init__()
        self.tables = nn.ModuleDict()
        self.offsets = {}
        self.local_dims = {}
        for sub, spec in SUBSPACES.items():
            self.tables[sub] = nn.Embedding(spec["dims"], HEAD_DIM)
            self.offsets[sub] = spec["offset"]
            self.local_dims[sub] = spec["dims"]

    def lookup(self, symbol_ids: torch.LongTensor) -> torch.Tensor:
        """[seq] long → [seq, TOTAL_DIM] zero-padded across subspaces."""
        device = symbol_ids.device
        out = torch.zeros(symbol_ids.shape[0], TOTAL_DIM, device=device)
        for sub, spec in SUBSPACES.items():
            lo = spec["offset"]
            hi = lo + spec["dims"]
            mask = (symbol_ids >= lo) & (symbol_ids < hi)
            if not mask.any():
                continue
            local = symbol_ids[mask] - lo
            head = self.tables[sub](local)                 # [k, HEAD_DIM]
            # write to the head-aligned slice for this subspace
            head_start = (lo // HEAD_DIM) * HEAD_DIM
            out[mask, head_start:head_start + HEAD_DIM] = head
        return out

    def embed_query(self, query: str) -> torch.Tensor:
        ids = query_to_symbol_ids(query)
        if not ids:
            return torch.zeros(TOTAL_DIM)
        symbol_ids = torch.tensor(ids, dtype=torch.long)
        seq = self.lookup(symbol_ids)             # [seq, TOTAL_DIM]
        return seq.mean(0)                        # [TOTAL_DIM]


# ── cross-subspace interaction mask ────────────────────────────────
# Per spec on the architecture page:
#                 math  sci  lang  occ  emo  ctrl
#   math           1.0  1.0  0.5  0.1  0.1  0.5
#   science        1.0  1.0  0.5  0.1  0.1  0.3
#   language       0.5  0.5  0.7  0.5  0.4  0.5
#   occult         0.1  0.1  0.5  0.8  0.2  1.0
#   emoji          0.1  0.1  0.4  0.2  0.3  0.1
#   control        0.5  0.3  0.5  1.0  0.1  0.9
SUBSPACE_NAMES = ["math", "science", "language", "occult", "emoji", "control"]
SUBSPACE_MASK = torch.tensor([
    [1.0, 1.0, 0.5, 0.1, 0.1, 0.5],
    [1.0, 1.0, 0.5, 0.1, 0.1, 0.3],
    [0.5, 0.5, 0.7, 0.5, 0.4, 0.5],
    [0.1, 0.1, 0.5, 0.8, 0.2, 1.0],
    [0.1, 0.1, 0.4, 0.2, 0.3, 0.1],
    [0.5, 0.3, 0.5, 1.0, 0.1, 0.9],
])


def head_subspace_index(head_index: int) -> int:
    """For a given attention head (0..63), return which of the 6 subspaces it sits in."""
    boundaries = []
    cursor = 0
    for sub in SUBSPACE_NAMES:
        cursor += SUBSPACES[sub]["dims"] // HEAD_DIM
        boundaries.append(cursor)
    for i, b in enumerate(boundaries):
        if head_index < b:
            return i
    return len(SUBSPACE_NAMES) - 1


class SymbolicCrossAttention(nn.Module):
    """
    64-head multi-head attention with a per-head cross-subspace coupling
    weight derived from `SUBSPACE_MASK`.
    """
    def __init__(self, num_heads: int = NUM_HEADS, head_dim: int = HEAD_DIM):
        super().__init__()
        assert num_heads * head_dim == TOTAL_DIM
        self.num_heads = num_heads
        self.head_dim = head_dim
        self.q_proj = nn.Linear(TOTAL_DIM, TOTAL_DIM, bias=False)
        self.k_proj = nn.Linear(TOTAL_DIM, TOTAL_DIM, bias=False)
        self.v_proj = nn.Linear(TOTAL_DIM, TOTAL_DIM, bias=False)
        self.o_proj = nn.Linear(TOTAL_DIM, TOTAL_DIM, bias=False)
        self.norm   = nn.LayerNorm(TOTAL_DIM)
        # Per-head coupling weights (averaged across the two heads in the pair)
        head_weights = []
        for i in range(num_heads):
            si = head_subspace_index(i)
            row = SUBSPACE_MASK[si].mean().item()
            head_weights.append(row)
        self.register_buffer("head_weight", torch.tensor(head_weights).view(1, num_heads, 1, 1))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: [B, T, TOTAL_DIM]  →  [B, T, TOTAL_DIM]
        """
        B, T, D = x.shape
        H, Hd = self.num_heads, self.head_dim
        q = self.q_proj(x).view(B, T, H, Hd).transpose(1, 2)   # [B, H, T, Hd]
        k = self.k_proj(x).view(B, T, H, Hd).transpose(1, 2)
        v = self.v_proj(x).view(B, T, H, Hd).transpose(1, 2)
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(Hd)
        # apply cross-subspace coupling: scale by per-head weight
        scores = scores * self.head_weight                     # [B, H, T, T]
        attn = F.softmax(scores, dim=-1)
        out = torch.matmul(attn, v).transpose(1, 2).contiguous().view(B, T, D)
        out = self.o_proj(out)
        return self.norm(x + out)


class SymbolicComposition(nn.Module):
    """
    Gated residual composition. 2× expansion, 4 parallel sigmoid gates over
    the residual, GELU + LayerNorm. Produces the per-node next-state vector.
    """
    def __init__(self, dim: int = TOTAL_DIM):
        super().__init__()
        self.expand = nn.Linear(dim, dim * 2)
        self.norm   = nn.LayerNorm(dim * 2)
        self.proj   = nn.Linear(dim * 2, dim)
        # 4 parallel gates
        self.gates  = nn.ModuleList([nn.Linear(dim, dim) for _ in range(4)])

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [B, T, dim]
        expanded = F.gelu(self.norm(self.expand(x)))
        projected = self.proj(expanded)
        gate_out = torch.zeros_like(x)
        for gate in self.gates:
            g = torch.sigmoid(gate(x))
            gate_out = gate_out + g * x
        gate_out = gate_out / len(self.gates)
        return projected + gate_out


# ── convenience: full forward ──────────────────────────────────────
@dataclass
class SymbolicState:
    state: torch.Tensor          # [TOTAL_DIM]
    n_symbols: int
    subspaces: dict[str, int]    # per-subspace symbol counts


def encode(query: str,
           emb: UniversalSemioticEmbedding | None = None,
           sam: SymbolicCrossAttention | None = None,
           comp: SymbolicComposition | None = None) -> SymbolicState:
    """
    Convenience wrapper: query → SymbolicState. Pass module instances or
    create defaults (random init — for testing only).
    """
    emb  = emb  or UniversalSemioticEmbedding()
    sam  = sam  or SymbolicCrossAttention()
    comp = comp or SymbolicComposition()

    ids = query_to_symbol_ids(query)
    # Per-subspace counts
    sub_counts = {s: 0 for s in SUBSPACE_NAMES}
    for sid in ids:
        for sub, spec in SUBSPACES.items():
            if spec["offset"] <= sid < spec["offset"] + spec["dims"]:
                sub_counts[sub] += 1
                break

    if not ids:
        state = torch.zeros(TOTAL_DIM)
    else:
        symbol_ids = torch.tensor(ids, dtype=torch.long)
        seq = emb.lookup(symbol_ids).unsqueeze(0)         # [1, seq, D]
        x   = sam(seq)
        x   = comp(x)
        state = x.mean(1).squeeze(0)                       # [D]
    return SymbolicState(state=state, n_symbols=len(ids), subspaces=sub_counts)


if __name__ == "__main__":
    # smoke test
    samples = ["∫∂x → ?", "☉☽☿ in alchemy", "🧬→protein", "道法自然", "F=ma", "∇×B = μ₀J"]
    emb = UniversalSemioticEmbedding()
    sam = SymbolicCrossAttention()
    comp = SymbolicComposition()
    for q in samples:
        st = encode(q, emb, sam, comp)
        print(f"{q!r:<28} → {st.n_symbols:>2} symbols  | subspaces={st.subspaces}  state.shape={tuple(st.state.shape)}")
