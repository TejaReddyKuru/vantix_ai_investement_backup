import React from "react";
import type { AHNATradePlan as AHNATradePlanType } from "@/lib/ahna-types";
import { money } from "@/lib/market-data";

export default function AHNATradePlan({ plan, decision, showEntryZone }: { plan: AHNATradePlanType; decision: string; showEntryZone: boolean }) {
  if (!plan) return null;
  
  // If the decision is WAIT or HOLD, and showEntryZone is false, we may not show the full plan unless it has data.
  // The backend says "For WAIT/HOLD, these should normally be null."
  if (decision === "WAIT" && !showEntryZone) return null;
  if (!plan.entry_min && !plan.stop_loss && !plan.take_profit) return null;

  return (
    <section className="ahna-trade-plan">
      <div className="ahna-section-label">TRADE PLAN GEOMETRY</div>
      <div className="ahna-trade-levels">
        {plan.entry_min != null && plan.entry_max != null && (
          <div className="ahna-level">
            <span>ENTRY ZONE</span>
            <strong>{money(plan.entry_min)} - {money(plan.entry_max)}</strong>
          </div>
        )}
        {plan.take_profit != null && (
          <div className="ahna-level tp-level">
            <span>TAKE PROFIT</span>
            <strong>{money(plan.take_profit)}</strong>
          </div>
        )}
        {plan.stop_loss != null && (
          <div className="ahna-level sl-level">
            <span>STOP LOSS</span>
            <strong>{money(plan.stop_loss)}</strong>
          </div>
        )}
        {plan.risk_reward != null && (
          <div className="ahna-level">
            <span>RISK/REWARD</span>
            <strong>1 : {plan.risk_reward.toFixed(2)}</strong>
          </div>
        )}
      </div>
    </section>
  );
}
