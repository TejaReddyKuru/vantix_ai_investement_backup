"use client";

import { CandlestickChart, ShieldCheck, Sparkles, RefreshCw } from "lucide-react";
import { useTradingMode, type TradingMode } from "@/context/TradingModeContext";
import { useWorkspace } from "@/components/dashboard/WorkspaceContext";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";

export default function TradingHeader({
  onModeChange,
}: {
  onModeChange?: (mode: TradingMode) => void;
}) {
  const { mode, setMode, isLive } = useTradingMode();
  const { openAhna } = useWorkspace();
  const queryClient = useQueryClient();
  const [isResetting, setIsResetting] = useState(false);

  function selectMode(next: TradingMode) {
    setMode(next);
    onModeChange?.(next);
  }

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset your paper trading account? This will close all positions and clear your history.")) return;
    setIsResetting(true);
    try {
      await apiClient.post("/api/v1/paper-trading/reset");
      queryClient.invalidateQueries({ queryKey: ["paper-account"] });
      queryClient.invalidateQueries({ queryKey: ["paper-summary"] });
      queryClient.invalidateQueries({ queryKey: ["paper-positions"] });
      queryClient.invalidateQueries({ queryKey: ["paper-orders"] });
      queryClient.invalidateQueries({ queryKey: ["paper-trades"] });
      queryClient.invalidateQueries({ queryKey: ["paper-transactions"] });
      alert("Paper trading account has been reset.");
    } catch (e: any) {
      alert("Failed to reset account: " + (e.response?.data?.detail || e.message));
    } finally {
      setIsResetting(false);
    }
  };
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
        {!isLive && (
          <button type="button" className="cc-button" onClick={handleReset} disabled={isResetting}>
            <RefreshCw size={16} className={isResetting ? "animate-spin" : ""} />
            {isResetting ? "Resetting..." : "Reset Portfolio"}
          </button>
        )}
        <span className="cc-tag">
          {isLive ? "LIVE MODE · EXECUTION NOT ENABLED" : "SIMULATED CAPITAL"}
        </span>
      </div>
    </div>
  );
}
