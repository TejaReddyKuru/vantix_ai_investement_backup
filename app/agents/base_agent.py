import abc
from typing import Any, Dict, List

from app.agents.context import AgentContext


class BaseAgent(abc.ABC):
    """
    Abstract base class for all AI Agents in the Vantix platform.
    Provides standard attributes, validation hook, health checking, and metadata synthesis.
    """

    name: str = "BaseAgent"
    description: str = "Abstract base agent framework component"
    version: str = "1.0.0"
    priority: int = 100
    dependencies: List[str] = []

    @abc.abstractmethod
    def execute(self, context: AgentContext) -> Any:
        """
        Execute core agent logic given shared AgentContext.
        Must be implemented by concrete subclass agents.
        """
        raise NotImplementedError("Subclasses must implement execute()")

    def validate(self, context: AgentContext) -> bool:
        """
        Validate prerequisites in context before execution.
        Default implementation returns True.
        """
        return True

    def health_check(self) -> bool:
        """
        Check health and readiness of agent.
        Default implementation returns True.
        """
        return True

    def metadata(self) -> Dict[str, Any]:
        """
        Return structured metadata dictionary describing agent capabilities and status.
        """
        return {
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "priority": self.priority,
            "dependencies": list(self.dependencies),
            "healthy": self.health_check(),
        }
