"""
CHAINSTATE: Proof-of-Cognitive-Work Consensus
Reputation-weighted Bayesian log-pooling implementation
"""

import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict, Tuple, Optional, Callable
from dataclasses import dataclass
from collections import defaultdict
import asyncio
from datetime import datetime, timedelta

@dataclass
class NodeOutput:
    """Output from a single swarm node."""
    node_id: str
    symbolic_state: torch.Tensor
    confidence: float
    timestamp: datetime
    compute_proof: str  # Proof of computation

@dataclass
class ConsensusResult:
    """Result of consensus process."""
    consensus_state: torch.Tensor
    participating_nodes: List[str]
    reputation_updates: Dict[str, float]
    consensus_depth: int
    execution_time_ms: float
    gas_used: float

class ReputationSystem:
    """
    Manages node reputations with exponential moving average.
    """
    
    def __init__(
        self,
        alpha: float = 0.1,      # Reward rate
        beta: float = 0.2,       # Penalty rate
        gamma: float = 0.99,     # Decay rate
        min_reputation: float = 0.0,
        max_reputation: float = 100.0
    ):
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.min_reputation = min_reputation
        self.max_reputation = max_reputation
        
        self.reputations: Dict[str, float] = defaultdict(lambda: 50.0)
        self.accuracy_history: Dict[str, List[bool]] = defaultdict(list)
        self.last_active: Dict[str, datetime] = {}
    
    def get_reputation(self, node_id: str) -> float:
        """Get current reputation score."""
        return self.reputations[node_id]
    
    def update_reputation(
        self,
        node_id: str,
        prediction: torch.Tensor,
        ground_truth: torch.Tensor,
        consensus_state: torch.Tensor
    ) -> float:
        """
        Update node reputation based on accuracy.
        
        Args:
            node_id: Node identifier
            prediction: Node's predicted state
            ground_truth: Ground truth (if available)
            consensus_state: Final consensus state
            
        Returns:
            New reputation score
        """
        current_rep = self.reputations[node_id]
        
        # Calculate accuracy against consensus
        accuracy = self._calculate_accuracy(prediction, consensus_state)
        
        # Update based on accuracy threshold
        if accuracy > 0.8:  # High accuracy
            reward = self.alpha * accuracy
            new_rep = current_rep + reward
        elif accuracy < 0.5:  # Low accuracy
            penalty = self.beta * (1 - accuracy)
            new_rep = current_rep - penalty
        else:
            # Neutral - small decay
            new_rep = current_rep * self.gamma
        
        # Clamp to valid range
        new_rep = max(self.min_reputation, min(self.max_reputation, new_rep))
        
        self.reputations[node_id] = new_rep
        self.accuracy_history[node_id].append(accuracy > 0.8)
        self.last_active[node_id] = datetime.now()
        
        return new_rep
    
    def _calculate_accuracy(
        self,
        prediction: torch.Tensor,
        target: torch.Tensor
    ) -> float:
        """Calculate cosine similarity as accuracy metric."""
        similarity = torch.nn.functional.cosine_similarity(
            prediction.unsqueeze(0),
            target.unsqueeze(0)
        )
        return (similarity.item() + 1) / 2  # Normalize to [0, 1]
    
    def decay_inactive(self, inactive_threshold: timedelta = timedelta(hours=24)):
        """Decay reputation for inactive nodes."""
        now = datetime.now()
        for node_id, last_active in self.last_active.items():
            if now - last_active > inactive_threshold:
                self.reputations[node_id] *= self.gamma
    
    def get_top_nodes(self, n: int = 100) -> List[Tuple[str, float]]:
        """Get top N nodes by reputation."""
        sorted_nodes = sorted(
            self.reputations.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return sorted_nodes[:n]


class LogPoolingConsensus:
    """
    Reputation-weighted log-pooling consensus mechanism.
    
    Implements Bayesian consensus where:
    log P(consensus) = Σᵢ wᵢ · log P(nodeᵢ)
    
    where wᵢ is the reputation weight of node i.
    """
    
    def __init__(
        self,
        reputation_system: ReputationSystem,
        epsilon: float = 1e-10,
        min_participation: int = 10,
        consensus_threshold: float = 0.95
    ):
        self.reputation_system = reputation_system
        self.epsilon = epsilon
        self.min_participation = min_participation
        self.consensus_threshold = consensus_threshold
    
    async def reach_consensus(
        self,
        node_outputs: List[NodeOutput],
        max_rounds: int = 7
    ) -> ConsensusResult:
        """
        Reach consensus through iterative log-pooling.
        
        Args:
            node_outputs: List of outputs from swarm nodes
            max_rounds: Maximum consensus rounds
            
        Returns:
            ConsensusResult with final state and metadata
        """
        import time
        start_time = time.time()
        
        if len(node_outputs) < self.min_participation:
            raise ValueError(
                f"Insufficient participation: {len(node_outputs)} < {self.min_participation}"
            )
        
        # Initial weighted average
        current_consensus = self._weighted_pooling(node_outputs)
        
        participating_nodes = [out.node_id for out in node_outputs]
        reputation_updates = {}
        
        # Iterative refinement
        for round_num in range(max_rounds):
            # Filter nodes by agreement with current consensus
            agreeing_outputs = []
            
            for output in node_outputs:
                agreement = self._calculate_agreement(
                    output.symbolic_state,
                    current_consensus
                )
                
                if agreement > 0.7:  # Threshold for participation
                    agreeing_outputs.append(output)
            
            if len(agreeing_outputs) < self.min_participation:
                break
            
            # Recompute consensus with agreeing nodes
            new_consensus = self._weighted_pooling(agreeing_outputs)
            
            # Check convergence
            convergence = self._calculate_agreement(
                current_consensus,
                new_consensus
            )
            
            current_consensus = new_consensus
            
            if convergence > self.consensus_threshold:
                break
        
        # Update reputations
        for output in node_outputs:
            new_rep = self.reputation_system.update_reputation(
                output.node_id,
                output.symbolic_state,
                None,  # Ground truth not available in real-time
                current_consensus
            )
            reputation_updates[output.node_id] = new_rep
        
        execution_time = (time.time() - start_time) * 1000
        
        # Calculate gas used (simplified model)
        gas_used = self._calculate_gas(
            len(node_outputs),
            round_num + 1,
            execution_time
        )
        
        return ConsensusResult(
            consensus_state=current_consensus,
            participating_nodes=participating_nodes,
            reputation_updates=reputation_updates,
            consensus_depth=round_num + 1,
            execution_time_ms=execution_time,
            gas_used=gas_used
        )
    
    def _weighted_pooling(
        self,
        node_outputs: List[NodeOutput]
    ) -> torch.Tensor:
        """
        Compute reputation-weighted log-pooling consensus.
        
        log P(consensus) = Σᵢ wᵢ · log P(nodeᵢ)
        P(consensus) = exp(log P(consensus) - logsumexp)
        """
        # Get reputation weights
        weights = torch.tensor([
            self.reputation_system.get_reputation(out.node_id)
            for out in node_outputs
        ])
        
        # Normalize weights
        weights = weights / weights.sum()
        
        # Stack node states
        states = torch.stack([out.symbolic_state for out in node_outputs])
        
        # Apply softmax to get probabilities
        log_probs = torch.nn.functional.log_softmax(states, dim=-1)
        
        # Weighted log-pooling
        weighted_logs = weights.unsqueeze(-1) * log_probs
        log_consensus = weighted_logs.sum(dim=0)
        
        # Convert back to state space
        consensus_probs = torch.exp(
            log_consensus - torch.logsumexp(log_consensus, dim=-1, keepdim=True)
        )
        
        return consensus_probs
    
    def _calculate_agreement(
        self,
        state1: torch.Tensor,
        state2: torch.Tensor
    ) -> float:
        """Calculate agreement between two states."""
        similarity = torch.nn.functional.cosine_similarity(
            state1.unsqueeze(0),
            state2.unsqueeze(0)
        )
        return (similarity.item() + 1) / 2
    
    def _calculate_gas(
        self,
        num_nodes: int,
        consensus_depth: int,
        execution_time_ms: float
    ) -> float:
        """
        Calculate gas cost for the transaction.
        
        Gas = base + (nodes × coordination) + (depth × verification) + (time × compute)
        """
        base_cost = 0.001
        coordination_cost = num_nodes * 0.00001
        verification_cost = consensus_depth * 0.00005
        compute_cost = execution_time_ms * 0.000001
        
        return base_cost + coordination_cost + verification_cost + compute_cost


class CognitiveTransaction:
    """
    Represents a transaction in CHAINSTATE.
    A transaction IS a cognitive query.
    """
    
    def __init__(
        self,
        query: str,
        sender: str,
        nonce: int,
        gas_price: float = 0.0001,
        max_gas: float = 0.1
    ):
        self.query = query
        self.sender = sender
        self.nonce = nonce
        self.gas_price = gas_price
        self.max_gas = max_gas
        self.timestamp = datetime.now()
        self.hash = self._compute_hash()
        
        # Results populated after execution
        self.result: Optional[ConsensusResult] = None
        self.receipt: Optional[Dict] = None
    
    def _compute_hash(self) -> str:
        """Compute transaction hash."""
        import hashlib
        data = f"{self.sender}:{self.nonce}:{self.query}:{self.timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def to_dict(self) -> Dict:
        """Serialize to dictionary."""
        return {
            'hash': self.hash,
            'sender': self.sender,
            'query': self.query,
            'nonce': self.nonce,
            'gas_price': self.gas_price,
            'max_gas': self.max_gas,
            'timestamp': self.timestamp.isoformat(),
            'result': self.result.__dict__ if self.result else None
        }


class SwarmNode:
    """
    Represents a node in the CHAINSTATE swarm.
    """
    
    def __init__(
        self,
        node_id: str,
        embedding_model: nn.Module,
        inference_fn: Callable,
        device: str = 'cpu'
    ):
        self.node_id = node_id
        self.embedding_model = embedding_model
        self.inference_fn = inference_fn
        self.device = device
        self.is_online = True
        self.total_queries = 0
        self.accurate_queries = 0
    
    async def process_query(self, query: str) -> NodeOutput:
        """
        Process a cognitive query.
        
        Args:
            query: The query string (can contain symbols, emojis, etc.)
            
        Returns:
            NodeOutput with symbolic state
        """
        import time
        start_time = time.time()
        
        # Convert query to symbol sequence
        symbols = list(query)
        
        # Get embeddings
        with torch.no_grad():
            embeddings = self.embedding_model(symbols)
        
        # Run inference
        state = self.inference_fn(embeddings)
        
        # Compute confidence
        confidence = torch.softmax(state, dim=-1).max().item()
        
        # Generate compute proof
        compute_proof = self._generate_proof(query, start_time)
        
        self.total_queries += 1
        
        return NodeOutput(
            node_id=self.node_id,
            symbolic_state=state,
            confidence=confidence,
            timestamp=datetime.now(),
            compute_proof=compute_proof
        )
    
    def _generate_proof(self, query: str, timestamp: float) -> str:
        """Generate proof of computation."""
        import hashlib
        data = f"{self.node_id}:{query}:{timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()[:32]


# Example usage
if __name__ == "__main__":
    # Initialize reputation system
    rep_system = ReputationSystem()
    
    # Initialize consensus
    consensus = LogPoolingConsensus(rep_system)
    
    # Create mock nodes
    from symbolic.embedding import UniversalSemioticEmbedding
    
    embedding = UniversalSemioticEmbedding()
    
    def mock_inference(embeddings):
        # Simple mock inference
        return torch.randn(65536).softmax(dim=-1)
    
    nodes = [
        SwarmNode(f"node_{i}", embedding, mock_inference)
        for i in range(10)
    ]
    
    # Simulate query processing
    async def test_consensus():
        query = "∫∂x → ?"
        
        # Process query on all nodes
        outputs = await asyncio.gather(*[
            node.process_query(query)
            for node in nodes
        ])
        
        # Reach consensus
        result = await consensus.reach_consensus(outputs)
        
        print(f"Consensus reached in {result.consensus_depth} rounds")
        print(f"Execution time: {result.execution_time_ms:.2f}ms")
        print(f"Gas used: {result.gas_used:.6f} $STATE")
        print(f"Participating nodes: {len(result.participating_nodes)}")
    
    asyncio.run(test_consensus())
