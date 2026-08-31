"use client";

import { useEffect, useState } from "react";
import {
  BrainCircuit,
  Cpu,
  Layers,
  LineChart,
  Newspaper,
  Radar,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useUnifiedAnalysis } from "@/hooks/useTerminalAccount";
import { backendError } from "@/hooks/useWorkspaceData";
import { dateLabel } from "@/lib/workspace-data";
import { type Interval, validPair } from "@/lib/terminal-market";
import AgentEvidence, { AGENT_CONFIGS } from "./AgentEvidence";
import "./intelligence-v2.css";

const ALL_AGENT_KEYS = [
  "technical_analysis",
  "news",
  "sentiment",
  "market_intelligence",
  "risk_assessment",
  "trade_agent",
  "strategy_synthesis",
];

export default function IntelligenceWorkbench({
  pair,
  interval,
  connected = true,
}: {
  pair: string;
  interval: Interval;
  connected?: boolean;
}) {
  const [automatic, setAutomatic] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const supported = connected && validPair(pair);
  const query = useUnifiedAnalysis(pair, interval, automatic, supported);
  const data = supported ? query.data : undefined;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const delayed = data && (!data.timestamp || now - Date.parse(data.timestamp) > 180_000);

  const displayedAgents =
    selectedTab === "all"
      ? ALL_AGENT_KEYS
      : ALL_AGENT_KEYS.filter((k) => k === selectedTab);

  return (
    <div className="cc-intelligence-v2-container" id="terminal-agents">
      {/* Top Banner Header */}
      <section className="cc-intel-header">
        <div className="cc-intel-header-inner">
          <div className="cc-intel-header-info">
            <span className="cc-intel-icon-badge">
              <Sparkles className="h-6 w-6" />
            </span>
            <div className="cc-intel-title-group">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#70C891]/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#70C891]">
                  Multi-Agent Network
                </span>
                <span className="text-[11px] font-bold text-white/50">
                  {pair} · {interval}
                </span>
              </div>
              <h2>AHNA Financial Intelligence Matrix</h2>
              <p>
                {data?.timestamp
                  ? `Deliberation synced: ${dateLabel(data.timestamp)}`
                  : "Continuous real-time evidence stream"}
              </p>
            </div>
          </div>

          <div className="cc-intel-header-actions">
            <div className="cc-intel-count-pill">
              <span>7 / 7 Active Agents</span>
            </div>

            <label className="flex items-center gap-2 text-[12px] font-bold text-white/70 cursor-pointer">
              <input
                type="checkbox"
                disabled={!supported}
                checked={automatic}
                onChange={(e) => setAutomatic(e.target.checked)}
                className="rounded accent-[#2F78B7]"
              />
              <span>Auto-refresh</span>
            </label>

            <button
              type="button"
              className="cc-intel-btn"
              disabled={!supported || query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RefreshCw className={`h-4 w-4 ${supported && query.isFetching ? "animate-spin" : ""}`} />
              <span>{supported && query.isFetching ? "Analyzing Pipeline..." : "Refresh Intelligence"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Warnings & Errors */}
      {supported && query.isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-300">
          {backendError(query.error)} {data ? "Displaying last returned cached findings." : "No results while backend is offline."}
        </div>
      )}

      {delayed && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-[12px] text-yellow-200">
          Analysis timestamp is older than 3 minutes. Click Refresh Intelligence for real-time market sync.
        </div>
      )}

      {/* Filter Tabs for the 7 Agents */}
      <div className="cc-agent-tabs" role="tablist">
        <button
          type="button"
          onClick={() => setSelectedTab("all")}
          className={`cc-agent-tab ${selectedTab === "all" ? "is-active" : ""}`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All 7 Perspectives</span>
        </button>

        {ALL_AGENT_KEYS.map((key) => {
          const cfg = AGENT_CONFIGS[key];
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedTab(key)}
              className={`cc-agent-tab ${selectedTab === key ? "is-active" : ""}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* 7-Agent Card Grid */}
      <div className={`cc-agent-cards-grid ${selectedTab === "all" ? "all-cards" : ""}`}>
        {displayedAgents.map((key) => (
          <AgentEvidence
            key={key}
            agentKey={key}
            data={data}
            pending={supported && query.isFetching}
          />
        ))}
      </div>
    </div>
  );
}
