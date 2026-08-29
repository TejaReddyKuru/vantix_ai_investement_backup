"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Search } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useWorkspace } from "@/components/dashboard/WorkspaceContext";
import IntelligenceWorkbench from "@/components/intelligence/IntelligenceWorkbench";
import AssetPicker from "@/components/market/AssetPicker";
import { terminalSymbolForId, type DirectoryAsset } from "@/lib/asset-directory";
import { analysisSelection } from "@/lib/analysis-selection";
import { INTERVALS, validInterval, type Interval } from "@/lib/terminal-market";

function IntelligencePageContent() {
  const params = useSearchParams(), router = useRouter(), searchKey = params.toString();
  const [asset, setAsset] = useState(() => analysisSelection(new URLSearchParams(searchKey)));
  const requestedInterval = params.get("interval") ?? "1h";
  const interval: Interval = validInterval(requestedInterval) ? requestedInterval : "1h";
  const { selectAsset } = useWorkspace();
  const supportedSymbol = terminalSymbolForId(asset.id), pair = `${supportedSymbol ?? asset.symbol}USDT`;
  useEffect(() => {
    const next = analysisSelection(new URLSearchParams(searchKey));
    setAsset(current => current.id === next.id && next.id !== "unconnected-selection" ? current : next);
  }, [searchKey]);
  useEffect(() => selectAsset(asset.symbol, asset.id), [asset.symbol, asset.id, selectAsset]);
  function choose(next: DirectoryAsset) {
    setAsset(next);
    const query = new URLSearchParams({ coin: next.id, symbol: next.symbol, name: next.name, interval });
    router.replace(`/intelligence?${query}`, { scroll: false });
  }
  function changeInterval(value: string) {
    const query = new URLSearchParams(searchKey); query.set("interval", value);
    router.replace(`/intelligence?${query}`, { scroll: false });
  }
  return <div className="cc-page cc-intelligence-v5">
    <div className="cc-page-heading"><div><span className="cc-eyebrow">One coin. Six perspectives.</span><h1>AI Intelligence<span className="cc-title-dot">.</span></h1><p>Search a market, then inspect the evidence returned by each agent.</p></div></div>
    <section className="cc-analysis-launcher" aria-label="Select the coin for all six agents">
      <div><span className="cc-eyebrow"><Search size={12}/>Search &amp; select a coin</span><AssetPicker value={asset} onSelect={choose}/></div>
      <label className="cc-analysis-timeframe">Analysis timeframe<select aria-label="Intelligence timeframe" value={interval} onChange={e => changeInterval(e.target.value)}>{INTERVALS.map(value => <option key={value}>{value}</option>)}</select></label>
      <div className="cc-analysis-identity"><strong>{asset.name}</strong><small>Provider ID: {asset.id}</small><span>{supportedSymbol ? `${pair} · selection requests the read-only pipeline` : "Agent integration pending for this asset"}</span></div>
      <Link href={`/markets?coin=${encodeURIComponent(asset.id)}`} className="cc-button">Market details<ArrowUpRight size={14}/></Link>
    </section>
    <IntelligenceWorkbench key={`${asset.id}:${interval}`} pair={pair} interval={interval} connected={Boolean(supportedSymbol)}/>
  </div>;
}
export default function IntelligencePage() { return <DashboardShell><IntelligencePageContent/></DashboardShell>; }
