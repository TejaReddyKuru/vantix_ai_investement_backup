import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class AgentStarted:
    agent_name: str
    timestamp: float = field(default_factory=time.time)


@dataclass(frozen=True)
class AgentFinished:
    agent_name: str
    execution_time_ms: float
    result: Any = None
    timestamp: float = field(default_factory=time.time)


@dataclass(frozen=True)
class AgentFailed:
    agent_name: str
    error: str
    execution_time_ms: float = 0.0
    timestamp: float = field(default_factory=time.time)


@dataclass(frozen=True)
class AgentSkipped:
    agent_name: str
    reason: str
    timestamp: float = field(default_factory=time.time)


@dataclass
class ExecutionSummary:
    total_agents: int = 0
    executed: int = 0
    skipped: int = 0
    failed: int = 0
    duration_ms: float = 0.0
    success_rate: float = 0.0
    started_at: float = 0.0
    finished_at: float = 0.0
    results: Dict[str, Any] = field(default_factory=dict)
    events: List[Any] = field(default_factory=list)
