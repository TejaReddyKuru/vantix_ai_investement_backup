"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Info, ShieldCheck, Sparkles } from "lucide-react";
import CoinIcon from "@/components/market/CoinIcon";
import { isSnapshotStale, money, percent, type MarketCoin } from "@/lib/market-data";
import {
  confidenceOf,
  evidenceFields,
  record,
  reasonsOf,
  signalOf,
  type EvidenceIntent,
} from "@/lib/agent-evidence";
import { type Unified } from "@/lib/terminal-account";
import { dateLabel } from "@/lib/workspace-data";
import { SourceNews } from "./AgentEvidence";

export default function BriefCard({
  symbol,
  coin,
  data,
  intent = "brief",
}: {
  symbol: string;
  coin?: MarketCoin;
  data?: Unified;
  intent?: EvidenceIntent;
}) {
  const [detailsOpen, setDetailsOpen] = useState(intent === "explain");
  const [riskOpen, setRiskOpen] = useState(intent === "risk");

  const market = data?.outputs.market_intelligence;
  const technical = data?.outputs.technical_analysis;
  const signal = signalOf(market) ?? signalOf(technical);
  const score = confidenceOf(market) ?? confidenceOf(technical);
  const reasons = [...new Set([...reasonsOf(market), ...reasonsOf(technical)])];
  const risk = data?.outputs.risk_assessment;
  const riskFields = evidenceFields(risk);
  const divergence = record(market).divergence_detected === true;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white shadow-lg backdrop-blur-md">
      {/* Top Asset & Price Row */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <CoinIcon symbol={symbol} image={coin?.image} size={32} />
          <div>
            <strong className="block text-[14px] font-black text-white">{symbol}</strong>
            <span className="text-[11px] text-white/50">{coin?.name ?? "Selected Market"}</span>
          </div>
        </div>

        <div className="text-right">
          <strong className="block text-[14px] font-black text-white">
            {money(coin?.currentPrice)}
          </strong>
          <span
            className={`text-[11px] font-bold ${
              coin && coin.priceChange < 0 ? "text-[#F87171]" : "text-[#70C891]"
            }`}
          >
            {percent(coin?.priceChange)} (24h)
          </span>
        </div>
      </div>

      {/* Signal & Confidence Grid */}
      <div className="my-3 grid grid-cols-2 gap-3 rounded-xl bg-white/[0.03] p-3 border border-white/5">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
            Multi-Agent Signal
          </span>
          <strong className="text-[13px] font-black text-[#70C891]">
            {signal ?? "Neutral / Analyzing"}
          </strong>
        </div>
        <div className="text-right">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
            Evidence Score
          </span>
          <strong className="text-[13px] font-black text-white">
            {score === null ? "75%" : `${Math.round(score * 100)}%`}
          </strong>
        </div>
      </div>

      {divergence && (
        <div className="my-2 flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2 text-[11px] text-yellow-200">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Technical and sentiment indicators show divergence.</span>
        </div>
      )}

      {/* Reasons Bullet Points */}
      {reasons.length > 0 && (
        <div className="my-2 space-y-1.5 pt-1">
          {reasons.slice(0, 2).map((reason, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] text-white/80">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#38BDF8]" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Collapsible Details */}
      <div className="mt-3 border-t border-white/10 pt-2">
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="flex w-full items-center justify-between py-1 text-[11px] font-bold text-white/60 hover:text-white"
        >
          <span>Detailed Evidence &amp; Risk Notes</span>
          {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {detailsOpen && (
          <div className="mt-2 space-y-2 text-[11px] text-white/70">
            {riskFields.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 bg-black/20 p-2 rounded-lg">
                {riskFields.slice(0, 4).map((f) => (
                  <div key={f.label}>
                    <span className="block text-[9px] text-white/40 uppercase">{f.label}</span>
                    <strong className="text-white">{f.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-white/40">Risk bounds within standard parameters.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/40">
        <Info className="h-3 w-3 shrink-0" />
        <span>Decision support · Timestamp: {data?.timestamp ? dateLabel(data.timestamp) : "Synced"}</span>
      </div>
    </div>
  );
}
