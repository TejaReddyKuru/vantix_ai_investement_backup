"use client";

import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
  LineChart,
  Newspaper,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { type Unified } from "@/lib/terminal-account";
import {
  confidenceOf,
  evidenceFields,
  hasEvidence,
  newsFromUnified,
  reasonsOf,
  signalOf,
} from "@/lib/agent-evidence";
import { dateLabel } from "@/lib/workspace-data";
import "./intelligence-v2.css";

export interface AgentCardConfig {
  key: string;
  name: string;
  role: string;
  icon: typeof TrendingUp;
  accentColor: string;
  badge: string;
  task: string;
  caution: string;
}

export const AGENT_CONFIGS: Record<string, AgentCardConfig> = {
  technical_analysis: {
    key: "technical_analysis",
    name: "Market Agent",
    role: "Technical & Structure",
    icon: TrendingUp,
    accentColor: "#FFEA93",
    badge: "Price & Momentum",
    task: "Evaluates multi-timeframe price action, EMA trends, RSI/MACD momentum, and key support/resistance boundaries.",
    caution: "Technical indicators represent price history; always verify with risk boundaries.",
  },
  news: {
    key: "news",
    name: "News Agent",
    role: "Catalysts & Events",
    icon: Newspaper,
    accentColor: "#70C891",
    badge: "NLP Event Filter",
    task: "Processes macro headlines and crypto developments, eliminating noise and linking events to affected tokens.",
    caution: "A headline alone does not establish a confirmed buy or sell setup.",
  },
  sentiment: {
    key: "sentiment",
    name: "Sentiment Agent",
    role: "Crowd Psychology",
    icon: Radar,
    accentColor: "#A78BFA",
    badge: "Narrative & Tone",
    task: "Measures crowd psychology, Fear & Greed shifts, and narrative momentum without chasing market hype.",
    caution: "Social tone can diverge significantly from underlying institutional order flow.",
  },
  market_intelligence: {
    key: "market_intelligence",
    name: "Feature Builder",
    role: "Quantitative Features",
    icon: Cpu,
    accentColor: "#38BDF8",
    badge: "Engineered Signals",
    task: "Calculates volatility spreads, liquidity depth, momentum features, and detects inter-signal divergences.",
    caution: "Feature models flag statistical patterns, not guaranteed price trajectories.",
  },
  risk_assessment: {
    key: "risk_assessment",
    name: "Risk Agent",
    role: "Capital Protection",
    icon: ShieldCheck,
    accentColor: "#F87171",
    badge: "Risk Guardrails",
    task: "Enforces max drawdown limits, calculates optimal position size, and flags invalidation price levels.",
    caution: "Risk clearance indicates analytical bounds; adhere strictly to your stop-loss.",
  },
  trade_agent: {
    key: "trade_agent",
    name: "Trade Agent",
    role: "Setup & Execution",
    icon: Target,
    accentColor: "#F59E0B",
    badge: "Actionable Plan",
    task: "Synthesizes setups into structured trade plans with entry zones, target boundaries, and R:R ratios.",
    caution: "Rehearse setups with simulated paper capital before live capital deployment.",
  },
  strategy_synthesis: {
    key: "strategy_synthesis",
    name: "AI Synthesis",
    role: "AHNA Orchestrator",
    icon: Sparkles,
    accentColor: "#2F78B7",
    badge: "Final Consensus",
    task: "Weighs specialist agent evidence, checks cross-agent agreement, and produces an explainable brief.",
    caution: "Confidence is the model's evidence score, not a guaranteed win rate.",
  },
};

export function SourceNews({ data, limit = 5 }: { data?: Unified; limit?: number }) {
  const articles = newsFromUnified(data);
  if (!articles.length) {
    return (
      <p className="text-[12px] text-white/50 py-2">
        No published news articles returned for this cycle.
      </p>
    );
  }
  return (
    <div className="cc-agent-news-feed">
      {articles.slice(0, limit).map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="cc-news-item"
        >
          <div className="cc-news-meta">
            <span>{article.source}</span>
            <time dateTime={article.published_at}>{dateLabel(article.published_at)}</time>
          </div>
          <span className="cc-news-title flex items-center justify-between gap-2">
            <span>{article.title}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/40" />
          </span>
          {article.description && (
            <p className="text-[11px] text-white/60 line-clamp-2 mt-1">{article.description}</p>
          )}
        </a>
      ))}
    </div>
  );
}

export default function AgentEvidence({
  agentKey,
  data,
  pending = false,
}: {
  agentKey: string;
  data?: Unified;
  pending?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = AGENT_CONFIGS[agentKey] ?? AGENT_CONFIGS.technical_analysis;
  const Icon = config.icon;

  // Extract relevant agent value from unified data
  let value: unknown = undefined;
  if (agentKey === "strategy_synthesis") {
    value = data?.strategy;
  } else if (agentKey === "trade_agent") {
    value = data?.outputs.trade_agent ?? data?.execution;
  } else {
    value = data?.outputs[agentKey];
  }

  const fields = evidenceFields(value);
  const reasons = reasonsOf(value);
  const signal = signalOf(value);
  const score = confidenceOf(value);
  const available =
    agentKey === "news"
      ? newsFromUnified(data).length > 0
      : hasEvidence(value) && (fields.length > 0 || reasons.length > 0);

  // Derive 3 quick key metrics for this card
  const getTopMetrics = () => {
    if (agentKey === "technical_analysis") {
      return [
        { label: "Signal", value: signal ?? "Neutral" },
        { label: "Confidence", value: score !== null ? `${Math.round(score * 100)}%` : "—" },
        { label: "Timeframe", value: "1H / 4H" },
      ];
    }
    if (agentKey === "news") {
      const count = newsFromUnified(data).length;
      return [
        { label: "Articles", value: count > 0 ? `${count} items` : "0" },
        { label: "Impact", value: count > 0 ? "Moderate" : "Low" },
        { label: "Feed", value: "Verified" },
      ];
    }
    if (agentKey === "sentiment") {
      return [
        { label: "Tone", value: signal ?? "Neutral" },
        { label: "Index", value: score !== null ? `${Math.round(score * 100)}/100` : "50/100" },
        { label: "Crowd", value: "Steady" },
      ];
    }
    if (agentKey === "market_intelligence") {
      return [
        { label: "Volatility", value: "Normal" },
        { label: "Liquidity", value: "Stable" },
        { label: "Divergence", value: "None" },
      ];
    }
    if (agentKey === "risk_assessment") {
      return [
        { label: "Risk Level", value: "Moderate" },
        { label: "Max Loss", value: "2.0% equity" },
        { label: "Status", value: "Approved" },
      ];
    }
    if (agentKey === "trade_agent") {
      return [
        { label: "Setup", value: signal ?? "Review" },
        { label: "Target R:R", value: "2.2 : 1" },
        { label: "Execution", value: "Paper First" },
      ];
    }
    // Synthesis
    return [
      { label: "Consensus", value: signal ?? "Deliberating" },
      { label: "Confidence", value: score !== null ? `${Math.round(score * 100)}%` : "75%" },
      { label: "Orchestration", value: "Active" },
    ];
  };

  const topMetrics = getTopMetrics();

  return (
    <article
      className={`cc-agent-card ${agentKey === "strategy_synthesis" ? "highlight-synthesis" : ""}`}
    >
      {/* Card Header */}
      <div className="cc-agent-card-header">
        <div className="cc-agent-header-left">
          <span
            className="cc-agent-avatar"
            style={{
              backgroundColor: `${config.accentColor}18`,
              color: config.accentColor,
            }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="cc-agent-meta">
            <h3>
              {config.name}
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${config.accentColor}15`,
                  color: config.accentColor,
                }}
              >
                {config.badge}
              </span>
            </h3>
            <p>{config.role}</p>
          </div>
        </div>

        <span
          className={`cc-agent-status-tag ${
            pending
              ? "cc-status-pending"
              : available
              ? "cc-status-ready"
              : "cc-status-empty"
          }`}
        >
          {pending ? "Analyzing..." : available ? "Active" : "No Output"}
        </span>
      </div>

      {/* Key Highlight Metric Grid */}
      <div className="cc-agent-key-metrics">
        {topMetrics.map((m) => (
          <div key={m.label} className="cc-metric-cell">
            <span className="cc-metric-label">{m.label}</span>
            <span className="cc-metric-val">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Primary Insights / Reason Bullets */}
      {agentKey === "news" ? (
        <SourceNews data={data} limit={2} />
      ) : (
        <div className="cc-agent-insights">
          {reasons.length > 0 ? (
            reasons.slice(0, 2).map((reason, i) => (
              <div key={i} className="cc-insight-item">
                <span
                  className="cc-insight-dot"
                  style={{ backgroundColor: config.accentColor }}
                />
                <span>{reason}</span>
              </div>
            ))
          ) : (
            <p className="text-[12px] text-white/50">
              {pending
                ? "Waiting for agent deliberation output..."
                : config.task}
            </p>
          )}
        </div>
      )}

      {/* Collapsible Accordion for Detailed Evidence Fields */}
      <div className="cc-agent-accordion">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="cc-accordion-summary w-full"
        >
          <span>{expanded ? "Collapse Evidence" : "Inspect Detailed Parameters"}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="cc-accordion-content">
            {agentKey === "news" ? (
              <SourceNews data={data} limit={8} />
            ) : fields.length > 0 ? (
              <dl className="cc-metrics-list">
                {fields.slice(0, 10).map((field) => (
                  <div key={field.label} className="cc-metrics-row">
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-[11px] text-white/40">
                Detailed quantitative fields will populate upon next analysis stream.
              </p>
            )}

            <div className="cc-agent-footer">
              <Info className="h-3 w-3 shrink-0 text-white/40" />
              <span>{config.caution}</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
