class AgentError(Exception):
    """Base exception for all AI Agent Framework errors."""
    pass


class AgentExecutionError(AgentError):
    """Raised when an agent encounters an unhandled runtime error during execution."""
    pass


class DependencyError(AgentError):
    """Raised when agent dependency resolution fails (missing or circular dependencies)."""
    pass


class ValidationError(AgentError):
    """Raised when agent or context validation fails."""
    pass


class RegistrationError(AgentError):
    """Raised when agent registration or lookup fails."""
    pass
