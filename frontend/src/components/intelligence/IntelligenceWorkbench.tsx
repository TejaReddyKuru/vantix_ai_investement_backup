"use client";
import { useEffect, useState } from "react";
import { BrainCircuit, RefreshCw, Sparkles } from "lucide-react";
import { useUnifiedAnalysis } from "@/hooks/useTerminalAccount";
import { backendError } from "@/hooks/useWorkspaceData";
import { AGENTS } from "@/lib/terminal-account";
import { evidenceFields, hasEvidence, newsFromUnified, record, type AgentKey } from "@/lib/agent-evidence";
import { dateLabel } from "@/lib/workspace-data";
import { type Interval, validPair } from "@/lib/terminal-market";
import AgentEvidence from "./AgentEvidence";
export default function IntelligenceWorkbench({ pair, interval, connected = true }: { pair: string; interval: Interval; connected?: boolean }) {
  const [automatic, setAutomatic] = useState(false), [selected, setSelected] = useState<AgentKey | "all">("all");
  const supported = connected && validPair(pair);
  const query = useUnifiedAnalysis(pair, interval, automatic, supported), data = supported ? query.data : undefined;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const delayed = data && (!data.timestamp || now - Date.parse(data.timestamp) > 180_000);
  const count = data ? AGENTS.filter(a => a.key === "news" ? newsFromUnified(data).length : hasEvidence(data.outputs[a.key]) && evidenceFields(data.outputs[a.key]).length).length : 0;
  const strategy = evidenceFields(data?.strategy), divergence = record(data?.outputs.market_intelligence).divergence_detected === true;
  return <section className="cc-intelligence-workbench" id="terminal-agents">
    <div className="cc-intelligence-banner"><span className="cc-intelligence-mark"><BrainCircuit size={29}/></span><div><span className="cc-eyebrow">AHNA intelligence</span><h2>Understand the work behind the signal.</h2><p>{pair} · {interval} · {data?.timestamp ? `Analysis ${dateLabel(data.timestamp)}` : "No analysis timestamp yet"}</p></div><div className="cc-pipeline-count"><strong>{count}<small>/ 6</small></strong><span>returned outputs</span></div></div>
    <div className="cc-intelligence-toolbar"><div><span className="cc-status-tag">Read-only pipeline</span><small>All six perspectives for this selected coin.</small></div><div><label className="cc-auto-analysis"><input type="checkbox" disabled={!supported} checked={automatic} onChange={e => setAutomatic(e.target.checked)}/>Refresh every 60s</label><button type="button" className="cc-button cc-button-primary" disabled={!supported || query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={15} className={supported && query.isFetching ? "cc-spin" : ""}/>{supported && query.isFetching ? "Requesting six-agent analysis…" : "Analyze all six agents"}</button></div></div>
    {supported && query.isError && <p className="cc-data-warning" role="status">{backendError(query.error)} {data ? "Last returned analysis below may be stale." : "No results are invented while the backend is unavailable."}</p>}
    {!supported && <p className="cc-data-warning">This market is not connected to the intelligence pipeline.</p>}
    {delayed && <p className="cc-data-warning" role="status">Analysis timestamp is missing or older than three minutes. Refresh before using these findings; individual inputs may have older timestamps.</p>}
    {divergence && <p className="cc-disagreement"><Sparkles size={17}/>The backend reports disagreement between technical and sentiment signals. Inspect both before drawing a conclusion.</p>}
    <div className="cc-agent-filter" role="group" aria-label="Inspect an agent"><button type="button" aria-pressed={selected === "all"} onClick={() => setSelected("all")}>All perspectives</button>{AGENTS.map(a => <button type="button" key={a.key} aria-pressed={selected === a.key} onClick={() => setSelected(a.key)}>{a.name}</button>)}</div>
    <div className={`cc-agent-evidence-grid ${selected !== "all" ? "is-single" : ""}`}>{AGENTS.filter(a => selected === "all" || a.key === selected).map(a => <AgentEvidence key={a.key} agentKey={a.key} data={data} pending={supported && query.isFetching}/>)}</div>
    <section className="cc-strategy-evidence"><div className="cc-inline"><Sparkles size={19}/><div><span className="cc-eyebrow">Separate synthesis layer</span><h3>How the findings come together</h3></div></div>{strategy.length ? <dl className="cc-evidence-metrics">{strategy.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl> : <p className="cc-muted">No strategy synthesis was returned. Inspect the individual findings without assuming a combined recommendation.</p>}<p className="cc-data-note">Confidence is the backend’s own score, not a win rate. Price data and agent analysis have independent timestamps. Nothing on this page submits a trade.</p></section>
  </section>;
}
