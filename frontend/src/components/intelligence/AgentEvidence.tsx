"use client";
import { ArrowUpRight, ChevronDown, Info } from "lucide-react";
import { AGENTS, type Unified } from "@/lib/terminal-account";
import { AGENT_GUIDES, confidenceOf, evidenceFields, hasEvidence, newsFromUnified, reasonsOf, signalOf, type AgentKey } from "@/lib/agent-evidence";
import { dateLabel } from "@/lib/workspace-data";
export function SourceNews({ data, limit = 6 }: { data?: Unified; limit?: number }) {
  const articles = newsFromUnified(data);
  return <div className="cc-evidence-news">{articles.length ? articles.slice(0, limit).map(article => <article key={article.id}><div className="cc-story-meta"><span>{article.source}</span><time dateTime={article.published_at}>{dateLabel(article.published_at)}</time></div><a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}<ArrowUpRight size={15}/></a>{article.description && <p>{article.description}</p>}</article>) : <p className="cc-evidence-empty">No usable published articles were returned. Unverified or demonstration links are not displayed.</p>}</div>;
}
export default function AgentEvidence({ agentKey, data, pending = false }: { agentKey: AgentKey; data?: Unified; pending?: boolean }) {
  const index = AGENTS.findIndex(a => a.key === agentKey), agent = AGENTS[index], guide = AGENT_GUIDES[agentKey];
  const value = data?.outputs[agentKey], fields = evidenceFields(value), reasons = reasonsOf(value), signal = signalOf(value), score = confidenceOf(value);
  const available = agentKey === "news" ? newsFromUnified(data).length > 0 : hasEvidence(value) && fields.length > 0;
  return <article className={`cc-agent-evidence ${available ? "has-evidence" : ""}`}>
    <header><span className="cc-agent-index">0{index + 1}</span><div><h3>{agent.name} agent</h3><small>{agent.description}</small></div><span className="cc-evidence-status">{pending ? "Fetching" : available ? "Returned" : "No evidence"}</span></header>
    <p className="cc-agent-task">{guide.task}</p>
    {agentKey === "news" ? <SourceNews data={data} limit={3}/> : <>
      {(signal || score !== null) && <div className="cc-agent-verdict"><strong>{signal ?? "Backend confidence"}</strong>{score !== null && <span>{Math.round(score * 100)}% <small>confidence</small></span>}</div>}
      {reasons.length ? <ul className="cc-evidence-reasons">{reasons.slice(0, 3).map((reason, i) => <li key={i}>{reason}</li>)}</ul> : fields.length ? <dl className="cc-evidence-metrics">{fields.slice(0, 3).map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl> : <p className="cc-evidence-empty">{pending ? "Waiting for this agent’s output…" : "No usable output returned. No score or status is assumed."}</p>}
    </>}
    <details className="cc-evidence-details"><summary><span>Inspect individual work</span><ChevronDown size={15}/></summary><div><span className="cc-eyebrow">Returned evidence</span>{agentKey === "news" ? <SourceNews data={data} limit={20}/> : <dl className="cc-evidence-metrics">{fields.length ? fields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>) : <p className="cc-muted">No evidence fields available.</p>}</dl>}<div className="cc-agent-next"><span className="cc-eyebrow">What to verify next · review guidance</span><p>{guide.next}</p></div></div></details>
    <footer><Info size={13}/><p>{guide.caution}</p></footer>
  </article>;
}
