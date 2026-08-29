"use client";

import { CandlestickChart, ShieldCheck, Sparkles } from "lucide-react";
import { useTradingMode, type TradingMode } from "@/context/TradingModeContext";
import { useWorkspace } from "@/components/dashboard/WorkspaceContext";

export default function TradingHeader({
  onModeChange,
}: {
  onModeChange?: (mode: TradingMode) => void;
}) {
  const { mode, setMode, isLive } = useTradingMode();
  const { openAhna } = useWorkspace();
  function selectMode(next: TradingMode) {
    setMode(next);
    onModeChange?.(next);
  }
  return (
    <div className="cc-page-heading">
      <div>
        <span className="cc-eyebrow">Plan · Review · Execute</span>
        <h1>
          Trading Workstation<span className="cc-title-dot">.</span>
        </h1>
        <p>
          Market context, order planning, and account positions in one focused
          workspace.
        </p>
      </div>
      <div className="cc-inline">
        <div className="cc-segmented" role="group" aria-label="Trading mode">
          <button
            type="button"
            aria-pressed={mode === "paper"}
            onClick={() => selectMode("paper")}
          >
            <CandlestickChart size={15} />
            Paper
          </button>
          <button
            type="button"
            aria-pressed={mode === "live"}
            onClick={() => selectMode("live")}
          >
            <ShieldCheck size={15} />
            Live
          </button>
        </div>
        <button type="button" className="cc-button" onClick={openAhna}>
          <Sparkles size={16} />
          Ask AHNA
        </button>
        <span className="cc-tag">
          {isLive ? "LIVE MODE · EXECUTION NOT ENABLED" : "SIMULATED CAPITAL"}
        </span>
      </div>
    </div>
  );
}
