import threading
from typing import Dict, List

from app.agents.base_agent import BaseAgent
from app.agents.exceptions import RegistrationError


class AgentRegistry:
    """
    Thread-safe registry for discovering, registering, and retrieving AI agent instances.
    """

    def __init__(self) -> None:
        self._agents: Dict[str, BaseAgent] = {}
        self._lock = threading.Lock()

    def register(self, agent: BaseAgent) -> None:
        """Register an agent instance. Raises RegistrationError on duplicate or invalid agent."""
        if not isinstance(agent, BaseAgent):
            raise RegistrationError(f"Registered object must inherit from BaseAgent, got {type(agent)}")

        with self._lock:
            if agent.name in self._agents:
                raise RegistrationError(f"Agent '{agent.name}' is already registered.")
            self._agents[agent.name] = agent

    def unregister(self, name: str) -> None:
        """Unregister an agent by name. Raises RegistrationError if not found."""
        with self._lock:
            if name not in self._agents:
                raise RegistrationError(f"Agent '{name}' is not registered.")
            del self._agents[name]

    def get(self, name: str) -> BaseAgent:
        """Retrieve a registered agent by name. Raises RegistrationError if not found."""
        with self._lock:
            if name not in self._agents:
                raise RegistrationError(f"Agent '{name}' is not registered.")
            return self._agents[name]

    def list(self) -> List[BaseAgent]:
        """List all registered agent instances."""
        with self._lock:
            return list(self._agents.values())

    def discover(self) -> List[str]:
        """List names of all registered agents."""
        with self._lock:
            return list(self._agents.keys())

    def clear(self) -> None:
        """Clear all registered agents."""
        with self._lock:
            self._agents.clear()
