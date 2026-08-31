import React from "react";
import type { AHNAAnalysisResponse } from "@/lib/ahna-types";
import AHNAInstruction from "./AHNAInstruction";
import AHNAWatchConditions from "./AHNAWatchConditions";
import AHNATradePlan from "./AHNATradePlan";
import { Sparkles, Activity, Search, AlertTriangle, ShieldCheck } from "lucide-react";
import "./ahna.css";

export default function AHNAHologram({ analysis }: { analysis: AHNAAnalysisResponse }) {
  if (!analysis) return null;

  const { decision, confidence, market_state, instruction, watch_conditions, trade_plan, ui_effect, symbol } = analysis;
  const isWait = decision === "WAIT";
  const isBuy = decision === "BUY";
  const isSell = decision === "SELL";
  const isHold = decision === "HOLD";

  const decisionClass = isBuy ? "ahna-buy" : isSell ? "ahna-sell" : "ahna-wait";
  const Icon = isBuy ? Activity : isSell ? AlertTriangle : isHold ? ShieldCheck : Search;

  return (
    <div className={`ahna-hologram ${decisionClass} ${ui_effect?.animate_chart ? "ahna-animated" : ""}`}>
      <header className="ahna-hologram-header">
        <div className="ahna-hologram-title">
          <Sparkles size={16} className="ahna-icon" />
          <span>AHNA AI</span>
        </div>
        <div className="ahna-symbol">{symbol}</div>
      </header>

      <section className="ahna-decision-block">
        <div className="ahna-decision-main">
          <Icon size={24} />
          <h2>{decision}</h2>
        </div>
        <div className="ahna-metrics">
          <div className="ahna-metric">
            <span>CONFIDENCE</span>
            <strong>{confidence}%</strong>
          </div>
          <div className="ahna-metric">
            <span>REGIME</span>
            <strong>{market_state?.market_regime || analysis.market_regime || "UNKNOWN"}</strong>
          </div>
          <div className="ahna-metric">
            <span>LIQUIDITY</span>
            <strong>{market_state?.liquidity || "UNKNOWN"}</strong>
          </div>
        </div>
      </section>

      {instruction && <AHNAInstruction instruction={instruction} />}
      {watch_conditions && watch_conditions.length > 0 && <AHNAWatchConditions conditions={watch_conditions} />}
      {trade_plan && <AHNATradePlan plan={trade_plan} decision={decision} showEntryZone={ui_effect?.show_entry_zone ?? false} />}

      <footer className="ahna-footer">
        {decision === "WAIT" ? "NO TRADE RECOMMENDED" : "REVIEW PAPER TRADE BEFORE EXECUTION"}
      </footer>
    </div>
  );
}
