"""Top-level agents package for Vantix AI Trading Platform."""

from typing import List, Optional

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.agents.events import (
    AgentFailed,
    AgentFinished,
    AgentSkipped,
    AgentStarted,
    ExecutionSummary,
)
from app.agents.exceptions import (
    AgentError,
    AgentExecutionError,
    DependencyError,
    RegistrationError,
    ValidationError,
)
from app.agents.memory import AgentMemory
from app.agents.orchestrator import AgentOrchestrator
from app.agents.registry import AgentRegistry

from app.agents.technical_analysis.technical_agent import TechnicalAgent
from app.agents.news_analysis.news_agent import NewsAgent
from app.agents.sentiment_analysis.sentiment_agent import SentimentAgent
from app.agents.market_analysis.market_agent import MarketAgent
from app.agents.portfolio.portfolio_agent import PortfolioAgent
from app.agents.risk_management.risk_agent import RiskAgent
from app.agents.advisor.strategy_agent import StrategyDecisionAgent


from app.agents.pipeline.intelligence_pipeline import UnifiedIntelligencePipeline


def register_domain_agents(registry: Optional[AgentRegistry] = None) -> AgentRegistry:
    """
    Instantiate and register all standard Phase 8 domain agents into the provided
    AgentRegistry instance (or create a new registry if none provided).
    """
    target_registry = registry if registry is not None else AgentRegistry()
    domain_agents: List[BaseAgent] = [
        TechnicalAgent(),
        NewsAgent(),
        SentimentAgent(),
        PortfolioAgent(),
        RiskAgent(),
        MarketAgent(),
        StrategyDecisionAgent(),
    ]
    for agent in domain_agents:
        try:
            target_registry.register(agent)
        except RegistrationError:
            pass
    return target_registry


__all__ = [
    "BaseAgent",
    "AgentContext",
    "AgentMemory",
    "AgentRegistry",
    "AgentOrchestrator",
    "AgentError",
    "AgentExecutionError",
    "DependencyError",
    "ValidationError",
    "RegistrationError",
    "AgentStarted",
    "AgentFinished",
    "AgentFailed",
    "AgentSkipped",
    "ExecutionSummary",
    "TechnicalAgent",
    "NewsAgent",
    "SentimentAgent",
    "MarketAgent",
    "PortfolioAgent",
    "RiskAgent",
    "StrategyDecisionAgent",
    "UnifiedIntelligencePipeline",
    "register_domain_agents",
    "market_analysis",
    "technical_analysis",
    "risk_management",
    "portfolio",
    "news_analysis",
    "sentiment_analysis",
    "execution",
    "advisor",
    "orchestrator",
    "pipeline",
]

