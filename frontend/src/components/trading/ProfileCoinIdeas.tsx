"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useRiskPreferences } from "@/context/RiskPreferencesContext";
import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";
import { ASSETS, money, percent, type MarketCoin } from "@/lib/market-data";

function volatility(history: number[]) {
  if (history.length < 8) return null;
  const sample = history.slice(-96);
  const returns = sample.slice(1).map((price, index) => Math.log(price / sample[index])).filter(Number.isFinite);
  if (returns.length < 6) return null;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

export default function ProfileCoinIdeas({ activeSymbol, mode }: { activeSymbol: string; mode: "paper" | "live" }) {
  const snapshot = useMarketSnapshot(true);
  const profile = useRiskPreferences();
  const supported = new Set<string>(ASSETS.filter(asset => asset.symbol !== "USDT").map(asset => asset.id));
  const ranked = (snapshot.data?.coins ?? []).filter(coin => supported.has(coin.id) && coin.symbol !== activeSymbol).map(coin => ({ coin, volatility: volatility(coin.history7d) })).filter((item): item is { coin: MarketCoin; volatility: number } => item.volatility != null);
  const ordered = [...ranked].sort((a, b) => a.volatility - b.volatility);
  const risk = profile.ready ? profile.preferences.riskPerTrade : 2;
  const band = risk <= 1 ? 0 : risk <= 2 ? 1 : 2;
  const chunk = Math.max(1, Math.ceil(ordered.length / 3));
  const choices = ordered.slice(band * chunk, (band + 1) * chunk).sort((a, b) => b.coin.marketCap - a.coin.marketCap).slice(0, 4);
  const label = band === 0 ? "Lower-volatility fit" : band === 1 ? "Balanced-volatility fit" : "Higher-volatility fit";

  return <section className="ct-panel ct-profile-ideas">
    <header><div><Sparkles size={14}/><strong>Profile-fit coin ideas</strong></div><span>{label}</span></header>
    {snapshot.isError ? <p className="ct-profile-empty">Live market scan unavailable.</p> : !profile.ready ? <p className="ct-profile-empty">Loading your saved risk profileâ€¦</p> : !choices.length ? <p className="ct-profile-empty">Waiting for enough live history to rank supported markets.</p> : <div className="ct-profile-list">{choices.map(({ coin, volatility: vol }) => <Link key={coin.id} href={`/paper-trading?mode=${mode}&symbol=${coin.symbol}`}><span><strong>{coin.symbol}USDT</strong><small>{coin.name}</small></span><span><strong className={coin.priceChange < 0 ? "cc-negative" : "cc-positive"}>{percent(coin.priceChange)}</strong><small>{money(coin.currentPrice)} Â· vol {vol.toFixed(2)}%</small></span><ArrowUpRight size={13}/></Link>)}</div>}
    <footer>Research ranking only: live market volatility + your saved risk-per-trade setting. It is not an instruction to invest, and it is separate from AHNAâ€™s single-market six-agent analysis.</footer>
  </section>;
}

