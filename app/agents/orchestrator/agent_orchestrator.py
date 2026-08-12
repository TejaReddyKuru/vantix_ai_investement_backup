import time
from typing import Any, Dict, List, Optional, Set, Tuple

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.agents.events import (
    AgentFailed,
    AgentFinished,
    AgentSkipped,
    AgentStarted,
    ExecutionSummary,
)
from app.agents.exceptions import DependencyError
from app.agents.memory import AgentMemory
from app.agents.registry import AgentRegistry


class AgentOrchestrator:
    """
    Orchestrates execution of AI Agents:
    - Resolves dependencies and builds topological DAG execution sequence
    - Orders independent agents by priority
    - Enforces context isolation and failure boundaries
    - Collects execution metrics, results, and event logs
    """

    def __init__(
        self,
        registry: Optional[AgentRegistry] = None,
        memory: Optional[AgentMemory] = None,
    ) -> None:
        self.registry = registry or AgentRegistry()
        self.memory = memory or AgentMemory()

    def resolve_dependencies(self, agents: List[BaseAgent]) -> List[BaseAgent]:
        """
        Perform topological sorting on agents based on dependencies and priority.
        Raises DependencyError if dependencies are missing or circular.
        """
        agent_map: Dict[str, BaseAgent] = {a.name: a for a in agents}
        
        # 1. Validate all dependencies exist in agent_map
        for agent in agents:
            for dep in agent.dependencies:
                if dep not in agent_map:
                    raise DependencyError(
                        f"Agent '{agent.name}' depends on missing or unregistered agent '{dep}'."
                    )

        # 2. Build in-degree graph
        in_degree: Dict[str, int] = {a.name: 0 for a in agents}
        dependents: Dict[str, List[str]] = {a.name: [] for a in agents}

        for agent in agents:
            for dep in agent.dependencies:
                in_degree[agent.name] += 1
                dependents[dep].append(agent.name)

        # 3. Kahn's Algorithm with Priority Sorting
        # Initial candidates: agents with in-degree 0
        ready: List[BaseAgent] = [a for a in agents if in_degree[a.name] == 0]
        # Sort ready queue by priority (descending) and name (ascending)
        ready.sort(key=lambda a: (-a.priority, a.name))

        ordered: List[BaseAgent] = []

        while ready:
            # Pick highest priority ready agent
            curr = ready.pop(0)
            ordered.append(curr)

            # Reduce in-degree of dependent agents
            for dep_name in dependents[curr.name]:
                in_degree[dep_name] -= 1
                if in_degree[dep_name] == 0:
                    dep_agent = agent_map[dep_name]
                    ready.append(dep_agent)
                    ready.sort(key=lambda a: (-a.priority, a.name))

        if len(ordered) != len(agents):
            raise DependencyError("Circular dependency detected in agent execution graph.")

        return ordered

    def run(
        self,
        context: AgentContext,
        agent_names: Optional[List[str]] = None,
    ) -> Tuple[Dict[str, Any], ExecutionSummary]:
        """
        Execute registered agents in resolved dependency order against shared AgentContext.
        """
        started_at = time.time()
        start_clock = time.perf_counter()

        # Load agents
        if agent_names is not None:
            all_agents = [self.registry.get(name) for name in agent_names]
        else:
            all_agents = self.registry.list()

        if not all_agents:
            finished_at = time.time()
            duration_ms = (time.perf_counter() - start_clock) * 1000.0
            summary = ExecutionSummary(
                total_agents=0,
                executed=0,
                skipped=0,
                failed=0,
                duration_ms=round(duration_ms, 3),
                success_rate=100.0,
                started_at=started_at,
                finished_at=finished_at,
                results={},
                events=[],
            )
            return {}, summary

        # Topological sorting & dependency validation
        ordered_agents = self.resolve_dependencies(all_agents)

        events: List[Any] = []
        results: Dict[str, Any] = {}
        failed_or_skipped: Set[str] = set()

        executed_count = 0
        skipped_count = 0
        failed_count = 0

        for agent in ordered_agents:
            agent_start_time = time.time()
            agent_clock_start = time.perf_counter()

            # Check if any dependency failed or skipped
            unmet_deps = [dep for dep in agent.dependencies if dep in failed_or_skipped]
            if unmet_deps:
                skipped_count += 1
                failed_or_skipped.add(agent.name)
                skip_event = AgentSkipped(
                    agent_name=agent.name,
                    reason=f"Prerequisite dependency failure: {', '.join(unmet_deps)}",
                    timestamp=agent_start_time,
                )
                events.append(skip_event)
                continue

            # Emit AgentStarted event
            events.append(AgentStarted(agent_name=agent.name, timestamp=agent_start_time))

            # Validate agent context requirements
            try:
                valid = agent.validate(context)
            except Exception as exc:
                valid = False

            if not valid:
                skipped_count += 1
                failed_or_skipped.add(agent.name)
                events.append(
                    AgentSkipped(
                        agent_name=agent.name,
                        reason="Agent validation failed",
                        timestamp=time.time(),
                    )
                )
                continue

            # Execute agent logic with isolated error handling
            try:
                res = agent.execute(context)
                exec_duration_ms = (time.perf_counter() - agent_clock_start) * 1000.0

                executed_count += 1
                results[agent.name] = res

                # Automatically place result into context if dictionary
                if isinstance(res, dict):
                    for k, v in res.items():
                        context[k] = v

                events.append(
                    AgentFinished(
                        agent_name=agent.name,
                        execution_time_ms=round(exec_duration_ms, 3),
                        result=res,
                        timestamp=time.time(),
                    )
                )
            except Exception as exc:
                exec_duration_ms = (time.perf_counter() - agent_clock_start) * 1000.0
                failed_count += 1
                failed_or_skipped.add(agent.name)

                events.append(
                    AgentFailed(
                        agent_name=agent.name,
                        error=str(exc),
                        execution_time_ms=round(exec_duration_ms, 3),
                        timestamp=time.time(),
                    )
                )

        finished_at = time.time()
        total_duration_ms = (time.perf_counter() - start_clock) * 1000.0
        total_agents = len(ordered_agents)
        success_rate = (executed_count / total_agents * 100.0) if total_agents > 0 else 100.0

        summary = ExecutionSummary(
            total_agents=total_agents,
            executed=executed_count,
            skipped=skipped_count,
            failed=failed_count,
            duration_ms=round(total_duration_ms, 3),
            success_rate=round(success_rate, 2),
            started_at=started_at,
            finished_at=finished_at,
            results=results,
            events=events,
        )

        return results, summary
