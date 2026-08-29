"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import {
  Activity,
  BrainCircuit,
  CircleGauge,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useRiskPreferences } from "@/context/RiskPreferencesContext";
import { useUnifiedAnalysis } from "@/hooks/useTerminalAccount";
import { backendError } from "@/hooks/useWorkspaceData";
import {
  confidenceOf,
  evidenceFields,
  hasEvidence,
  signalOf,
} from "@/lib/agent-evidence";
import { AGENTS } from "@/lib/terminal-account";
import { dateLabel } from "@/lib/workspace-data";
import { type Interval, validPair } from "@/lib/terminal-market";

function direction(value: string | null) {
  const text = (value ?? "").toUpperCase();
  if (/BUY|BULL|POSITIVE|UPTREND|LONG/.test(text)) return "bullish";
  if (/SELL|BEAR|NEGATIVE|DOWNTREND|SHORT/.test(text)) return "bearish";
  return "neutral";
}

function fieldValues(source: unknown, patterns: RegExp[], limit = 4) {
  const values = evidenceFields(source)
    .filter(({ label, value }) => patterns.some(pattern => pattern.test(label)) && value.trim() && !/^none|null|n\/a$/i.test(value.trim()))
    .map(({ value }) => value.trim());
  return [...new Set(values)].slice(0, limit);
}

function firstField(sources: unknown[], patterns: RegExp[]) {
  for (const source of sources) {
    const value = fieldValues(source, patterns, 1)[0];
    if (value) return value;
  }
  return null;
}

export default function AgentInsights({ pair, interval }: { pair: string; interval: Interval }) {
  const profile = useRiskPreferences();
  const supported = validPair(pair);
  const query = useUnifiedAnalysis(pair, interval, false, supported);
  const data = supported ? query.data : undefined;
  const technical = data?.outputs.technical_analysis;
  const sentiment = data?.outputs.sentiment;
  const market = data?.outputs.market_intelligence;
  const risk = data?.outputs.risk_assessment;
  const portfolio = data?.outputs.portfolio_snapshot;
  const sources = [data?.strategy, technical, market, risk];
  const signal = signalOf(market) ?? signalOf(technical);
  const confidence = confidenceOf(market) ?? confidenceOf(technical);
  const riskSignal = signalOf(risk) ?? firstField([risk], [/risk level/i, /risk category/i, /risk status/i, /decision/i]);
  const entry = fieldValues(technical, [/entry/i, /support/i, /buy.*(?:zone|level|price)/i], 2);
  const targets = [
    ...fieldValues(data?.strategy, [/take profit/i, /target/i, /resistance/i, /sell.*(?:zone|level|price)/i], 4),
    ...fieldValues(technical, [/take profit/i, /target/i, /resistance/i, /sell.*(?:zone|level|price)/i], 4),
  ].filter((value, index, array) => array.indexOf(value) === index).slice(0, 4);
  const stop = firstField(sources, [/stop loss/i, /stop price/i, /invalidation/i]);
  const riskWarnings = fieldValues(risk, [/warning/i, /reason/i, /rejection/i], 6);
  const agentReady = (key: typeof AGENTS[number]["key"]) => {
    const value = data?.outputs[key];
    return key === "news" ? Array.isArray(value) && value.length > 0 : hasEvidence(value);
  };
  const returned = AGENTS.filter(agent => agentReady(agent.key)).length;

  const consensus = useMemo(() => {
    const votes = [technical, sentiment, market]
      .map(value => direction(signalOf(value)))
      .filter(value => value !== "neutral");
    if (!votes.length) return { value: null as number | null, label: "No consensus" };
    const bullish = votes.filter(value => value === "bullish").length;
    const bearish = votes.filter(value => value === "bearish").length;
    const best = Math.max(bullish, bearish);
    return {
      value: Math.round(best / votes.length * 100),
      label: bullish === bearish ? "Mixed" : bullish > bearish ? "Bullish" : "Bearish",
    };
  }, [technical, sentiment, market]);

  const pulse = confidence == null ? null : Math.round(confidence * 100);
  const pulseDirection = direction(signal);
  const profileRisk = profile.ready ? `${profile.preferences.riskPerTrade}% / trade` : "Profile loading";
  const exposure = profile.ready ? `${profile.preferences.maxPositionExposure}% max exposure` : "—";
  const portfolioContext = fieldValues(portfolio, [/exposure/i, /cash/i, /equity/i, /position/i], 2);

  return (
    <section className="ct-ai-dashboard" aria-label="AHNA six-agent trading intelligence">
      <header className="ct-ai-header">
        <div className="ct-ai-title">
          <span className="ct-ai-mark"><BrainCircuit size={18}/></span>
          <div>
            <div><strong>AHNA / Six-Agent Intelligence</strong><span>{returned}/6 outputs</span></div>
            <small>{pair} · {interval} · {data?.timestamp ? `updated ${dateLabel(data.timestamp)}` : "analysis timestamp unavailable"}</small>
          </div>
        </div>
        <div className="ct-ai-actions">
          <span className={`ct-ai-signal is-${pulseDirection}`}>{signal ?? "Signal unavailable"}</span>
          <button className="cc-button" disabled={!supported || query.isFetching} onClick={() => void query.refetch()}>
            <RefreshCw size={13} className={query.isFetching ? "ct-spin" : ""}/>{query.isFetching ? "Analyzing…" : "Refresh 6 agents"}
          </button>
          <Link className="cc-button" href="/intelligence">Full evidence</Link>
        </div>
      </header>

      {query.isError && <p className="ct-ai-warning">{backendError(query.error)} No trading level is invented while the intelligence backend is unavailable.</p>}
      {!supported && <p className="ct-ai-warning">This market is not connected to the six-agent pipeline.</p>}

      <div className="ct-ai-cards">
        <article className="ct-ai-card ct-ai-level-card">
          <span className="ct-ai-card-icon"><Target size={14}/></span>
          <small>Buy zone / entry range</small>
          {entry.length ? <strong>{entry.join("  –  ")}</strong> : <strong className="is-empty">No entry level returned</strong>}
          <div className="ct-ai-range"><i/><b/></div>
          <p>Uses only support or entry fields returned by the current analysis.</p>
        </article>

        <article className="ct-ai-card ct-ai-targets-card">
          <span className="ct-ai-card-icon"><Sparkles size={14}/></span>
          <small>Sell targets / take profit</small>
          {targets.length ? <ol>{targets.map((target, index) => <li key={target}><span>TP{index + 1}</span><strong>{target}</strong><i style={{ width: `${Math.max(24, 88 - index * 14)}%` }}/></li>)}</ol> : <strong className="is-empty">No target ladder returned</strong>}
        </article>

        <article className="ct-ai-card ct-ai-stop-card">
          <span className="ct-ai-card-icon"><ShieldCheck size={14}/></span>
          <small>Stop / invalidation</small>
          <strong className={stop ? "is-risk" : "is-empty"}>{stop ?? "No stop returned"}</strong>
          <div className="ct-ai-stopline"><i/><b/></div>
          <p>{profileRisk} · {exposure}</p>
        </article>

        <article className="ct-ai-card ct-ai-pulse-card">
          <span className="ct-ai-card-icon"><Activity size={14}/></span>
          <small>Market pulse / momentum</small>
          <div className={`ct-ai-gauge is-${pulseDirection}`} style={{ "--ct-ai-value": `${pulse == null ? 0 : pulse * 3.6}deg` } as CSSProperties}>
            <span><strong>{pulse ?? "—"}</strong><small>{signal ?? "No signal"}</small></span>
          </div>
          <div className="ct-ai-sparkline"><i/><i/><i/><i/><i/><i/><i/></div>
        </article>

        <article className="ct-ai-card ct-ai-risk-card">
          <span className="ct-ai-card-icon"><ShieldCheck size={14}/></span>
          <small>Risk level</small>
          <strong>{riskSignal ?? "Not returned"}</strong>
          <dl><div><dt>Your risk budget</dt><dd>{profileRisk}</dd></div><div><dt>Warnings</dt><dd>{riskWarnings.length || "—"}</dd></div><div><dt>Portfolio context</dt><dd>{portfolioContext[0] ?? "—"}</dd></div></dl>
          <div className="ct-ai-heat"><i/><i/><i/><i/><i/></div>
        </article>

        <article className="ct-ai-card ct-ai-consensus-card">
          <span className="ct-ai-card-icon"><CircleGauge size={14}/></span>
          <small>Agent consensus</small>
          <div className="ct-ai-consensus-ring" style={{ "--ct-ai-value": `${(consensus.value ?? 0) * 3.6}deg` } as CSSProperties}><span><strong>{consensus.value == null ? "—" : `${consensus.value}%`}</strong><small>{consensus.label}</small></span></div>
          <div className="ct-ai-agent-dots" aria-label={`${returned} of six agents returned evidence`}>{AGENTS.map(agent => <i key={agent.key} className={agentReady(agent.key) ? "is-ready" : ""} title={agent.name}/>)}</div>
        </article>
      </div>
      <footer className="ct-ai-foot">Graphical decision support, not a chat. Confidence is a backend score, not a win rate. Missing levels remain missing.</footer>
    </section>
  );
}
