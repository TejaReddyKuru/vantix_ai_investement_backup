from typing import Dict, Set
from app.schemas.execution import NormalizedOrderState


class OrderStateTransitionError(Exception):
    """Raised when an illegal order lifecycle state transition is attempted."""
    pass


class OrderLifecycleManager:
    """
    Validates and controls normalized order state transitions across the order lifecycle.
    """

    ALLOWED_TRANSITIONS: Dict[NormalizedOrderState, Set[NormalizedOrderState]] = {
        NormalizedOrderState.CREATED: {
            NormalizedOrderState.SUBMITTED,
            NormalizedOrderState.ACCEPTED,
            NormalizedOrderState.REJECTED,
            NormalizedOrderState.FAILED,
            NormalizedOrderState.CANCELLED,
        },
        NormalizedOrderState.SUBMITTED: {
            NormalizedOrderState.ACCEPTED,
            NormalizedOrderState.PARTIALLY_FILLED,
            NormalizedOrderState.FILLED,
            NormalizedOrderState.CANCELLED,
            NormalizedOrderState.REJECTED,
            NormalizedOrderState.FAILED,
        },
        NormalizedOrderState.ACCEPTED: {
            NormalizedOrderState.PARTIALLY_FILLED,
            NormalizedOrderState.FILLED,
            NormalizedOrderState.CANCELLED,
            NormalizedOrderState.REJECTED,
            NormalizedOrderState.FAILED,
        },
        NormalizedOrderState.PARTIALLY_FILLED: {
            NormalizedOrderState.PARTIALLY_FILLED,
            NormalizedOrderState.FILLED,
            NormalizedOrderState.CANCELLED,
            NormalizedOrderState.FAILED,
        },
        NormalizedOrderState.FILLED: set(),  # Terminal state
        NormalizedOrderState.CANCELLED: set(),  # Terminal state
        NormalizedOrderState.REJECTED: set(),  # Terminal state
        NormalizedOrderState.FAILED: set(),  # Terminal state
    }

    @classmethod
    def validate_transition(
        cls,
        current_state: NormalizedOrderState,
        new_state: NormalizedOrderState,
        allow_reconciliation_override: bool = False,
    ) -> bool:
        """
        Validate whether transitioning from current_state to new_state is legally allowed.
        """
        if current_state == new_state:
            return True

        if allow_reconciliation_override:
            return True

        allowed = cls.ALLOWED_TRANSITIONS.get(current_state, set())
        if new_state not in allowed:
            raise OrderStateTransitionError(
                f"Illegal order state transition: '{current_state.value}' -> '{new_state.value}' is not permitted."
            )
        return True
