from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID

from app.schemas.broker_connection import ReconciliationMismatch, ReconciliationReport
from app.schemas.execution import NormalizedOrder
from app.services.brokers.base_broker import BaseBrokerAdapter


class BrokerReconciliationService:
    """
    Broker Reconciliation Integration Service.
    Reconciles local execution/order state against live/paper broker state safely.
    Detects discrepancies and records audit events without automatically submitting replacement orders.
    """

    async def reconcile(
        self,
        broker_adapter: BaseBrokerAdapter,
        local_orders: List[NormalizedOrder],
        environment: str = "PAPER",
    ) -> ReconciliationReport:
        broker_orders = await broker_adapter.get_orders()
        broker_order_map: Dict[str, NormalizedOrder] = {o.order_id: o for o in broker_orders}

        mismatches: List[ReconciliationMismatch] = []
        matched_count = 0

        for local_ord in local_orders:
            broker_ord = broker_order_map.get(local_ord.order_id)
            if not broker_ord:
                mismatches.append(
                    ReconciliationMismatch(
                        mismatch_type="MISSING_BROKER",
                        order_id=local_ord.order_id,
                        local_status=local_ord.status.value,
                        broker_status=None,
                        details=f"Order {local_ord.order_id} exists locally but is missing on broker {broker_adapter.broker_name}.",
                    )
                )
            else:
                matched_count += 1
                if local_ord.status != broker_ord.status:
                    mismatches.append(
                        ReconciliationMismatch(
                            mismatch_type="STATUS_MISMATCH",
                            order_id=local_ord.order_id,
                            local_status=local_ord.status.value,
                            broker_status=broker_ord.status.value,
                            details=f"Status mismatch: local={local_ord.status.value}, broker={broker_ord.status.value}.",
                        )
                    )
                if local_ord.quantity != broker_ord.quantity:
                    mismatches.append(
                        ReconciliationMismatch(
                            mismatch_type="QUANTITY_MISMATCH",
                            order_id=local_ord.order_id,
                            local_status=local_ord.status.value,
                            broker_status=broker_ord.status.value,
                            details=f"Quantity mismatch: local={local_ord.quantity}, broker={broker_ord.quantity}.",
                        )
                    )

        return ReconciliationReport(
            broker=broker_adapter.broker_name,
            environment=environment,
            timestamp=datetime.now(timezone.utc).isoformat(),
            matched_count=matched_count,
            mismatch_count=len(mismatches),
            mismatches=mismatches,
        )
