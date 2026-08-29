"use client";
import { ChevronDown, Info } from "lucide-react";
import CoinIcon from "@/components/market/CoinIcon";
import { isSnapshotStale, money, percent, type MarketCoin } from "@/lib/market-data";
import { confidenceOf, evidenceFields, record, reasonsOf, signalOf, type EvidenceIntent } from "@/lib/agent-evidence";
import { type Unified } from "@/lib/terminal-account";
import { dateLabel } from "@/lib/workspace-data";
import { SourceNews } from "./AgentEvidence";
export default function BriefCard({ symbol, coin, data, intent = "brief" }: { symbol: string; coin?: MarketCoin; data?: Unified; intent?: EvidenceIntent }) {
  const market = data?.outputs.market_intelligence, technical = data?.outputs.technical_analysis;
  const signal = signalOf(market) ?? signalOf(technical), score = confidenceOf(market) ?? confidenceOf(technical);
  const reasons = [...new Set([...reasonsOf(market), ...reasonsOf(technical)])];
  const risk = data?.outputs.risk_assessment, riskFields = evidenceFields(risk);
  const divergence = record(market).divergence_detected === true;
  return <div className="cc-brief-card">
    <div className="cc-brief-asset"><CoinIcon symbol={symbol} image={coin?.image} size={37}/><div><strong>{symbol}</strong><small>{coin?.name ?? "Selected market"}</small></div><div><strong>{money(coin?.currentPrice)}</strong><small className={coin && coin.priceChange < 0 ? "cc-negative" : "cc-positive"}>{percent(coin?.priceChange)} · 24h</small></div></div>
    <p className="cc-brief-source">CoinGecko · USD reference · {coin?.providerUpdatedAt ? dateLabel(coin.providerUpdatedAt) : "price timestamp unavailable"}{coin && isSnapshotStale(coin.providerUpdatedAt) ? " · delayed" : ""}</p>
    <div className="cc-brief-signal"><div><span className="cc-eyebrow">Backend analytical signal</span><strong>{signal ?? "Not available"}</strong></div><div><span className="cc-eyebrow">Backend confidence</span><strong>{score === null ? "—" : `${Math.round(score * 100)}%`}</strong></div>{score !== null && <div className="cc-confidence-track" role="meter" aria-label="Backend analytical confidence, not win probability" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(score * 100)}><span style={{ width: `${score * 100}%` }}/></div>}<small>Not a win-rate prediction. Analysis uses {data?.symbol ?? `${symbol}USDT`}, independently of the USD quote.</small></div>
    {divergence && <p className="cc-data-warning">Technical and sentiment signals disagree.</p>}
    <details className="cc-brief-details" open={intent === "explain"}><summary>Detailed analysis<ChevronDown size={15}/></summary><div>{reasons.length ? <ul>{reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul> : <p className="cc-muted">No supporting reasons have been returned.</p>}<small>Analysis timestamp: {data?.timestamp ? dateLabel(data.timestamp) : "unavailable"} · source: authenticated intelligence pipeline</small></div></details>
    {intent !== "news" && <details className="cc-brief-details" open={intent === "risk"}><summary>Risk &amp; portfolio context<ChevronDown size={15}/></summary><div>{riskFields.length ? <dl className="cc-evidence-metrics">{riskFields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl> : <p className="cc-muted">No risk assessment returned. Risk is not assumed to be low.</p>}<p className="cc-data-note">Account context is not a live balance or permission to trade.</p></div></details>}
    {intent !== "risk" && <details className="cc-brief-details" open={intent === "news"}><summary>Market pulse · source news<ChevronDown size={15}/></summary><SourceNews data={data} limit={6}/></details>}
    <p className="cc-brief-disclaimer"><Info size={13}/>Decision support only. Check freshness, evidence and your risk before acting.</p>
  </div>;
}
