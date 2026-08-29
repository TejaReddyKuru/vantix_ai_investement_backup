"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useWorkspace } from "@/components/dashboard/WorkspaceContext";
import AssetPicker from "@/components/market/AssetPicker";
import TerminalChart from "@/components/trading/TerminalChart";
import OrderBook from "@/components/trading/OrderBook";
import OrderPlanner from "@/components/trading/OrderPlanner";
import PriceAlerts from "@/components/trading/PriceAlerts";
import AgentInsights from "@/components/trading/AgentInsights";
import AccountOrders from "@/components/trading/AccountOrders";
import MarketDepth, { RecentTrades } from "@/components/trading/MarketDepth";
import ProfileCoinIdeas from "@/components/trading/ProfileCoinIdeas";
import { useTradingMode } from "@/context/TradingModeContext";
import { useAuth } from "@/context/AuthContext";
import { useTerminalFeed } from "@/hooks/useTerminalFeed";
import { normalizeSymbol } from "@/lib/market-data";
import { SUGGESTED_ASSETS, terminalSymbolForId } from "@/lib/asset-directory";
import { quote, quantity, validInterval, type Interval } from "@/lib/terminal-market";
import "@/components/trading/terminal.css";
import "@/components/trading/trading-workstation-v7.css";
import "@/components/trading/premium-trading-v9.css";

function Workstation() {
  const { user } = useAuth();
  const { setActiveSymbol, openAhna } = useWorkspace();
  const { mode, setMode, isLive } = useTradingMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const symbol = normalizeSymbol(searchParams.get("symbol"));
  const requestedInterval = searchParams.get("interval") ?? "1h";
  const interval: Interval = validInterval(requestedInterval) ? requestedInterval : "1h";
  const pair = `${symbol}USDT`;
  const feed = useTerminalFeed(pair, interval);
  const [limitPrice, setLimitPrice] = useState("");
  const [focused, setFocused] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertNotice, setAlertNotice] = useState("");
  const noticeAlert = useCallback((message: string) => setAlertNotice(message), []);
  const selectedAsset = SUGGESTED_ASSETS.find(asset => asset.symbol === symbol) ?? SUGGESTED_ASSETS[0];

  useEffect(() => {
    setActiveSymbol(symbol);
    const query = new URLSearchParams(searchKey);
    if (query.get("mode") === "live" || query.get("mode") === "paper") setMode(query.get("mode") as "live" | "paper");
  }, [searchKey, symbol, setActiveSymbol, setMode]);
  useEffect(() => setLimitPrice(""), [pair, user?.id]);

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(searchKey);
    params.set(key, value);
    params.delete("analyze");
    router.replace(`/paper-trading?${params.toString()}`, { scroll: false });
  }

  const price = feed.ticker?.price;
  const Change = (feed.ticker?.change ?? 0) >= 0 ? ArrowUp : ArrowDown;
  const spread = useMemo(() => {
    if (!feed.book?.asks.length || !feed.book?.bids.length) return null;
    return feed.book.asks[0][0] - feed.book.bids[0][0];
  }, [feed.book]);

  return <div className={`ct-workstation ct-workstation-v7${focused ? " is-chart-focused" : ""}`}>
    <div className="ct-terminal-heading">
      <div className="ct-terminal-title"><span>Workspace</span><b>/</b><h1>Trading Workstation</h1></div>
      <div className="ct-heading-actions">
        <div className="cc-segmented" role="group" aria-label="Trading account mode"><button aria-pressed={!isLive} onClick={() => { setMode("paper"); navigate("mode", "paper"); }}>Paper</button><button aria-pressed={isLive} onClick={() => { setMode("live"); navigate("mode", "live"); }}>Live</button></div>
        <button className="cc-button" aria-pressed={focused} onClick={() => setFocused(value => !value)}>{focused ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}<span>{focused ? "Restore terminal" : "Focus chart"}</span></button>
        <button className="cc-button ct-alert-button" aria-pressed={alertsOpen} onClick={() => setAlertsOpen(true)}><Bell size={14}/><span>Alerts</span></button>
        <button className="cc-button cc-button-primary" onClick={openAhna}><Sparkles size={14}/><span>AHNA</span></button>
      </div>
    </div>

    <section className="ct-instrument" aria-label="Selected market">
      <div className="ct-instrument-name"><AssetPicker value={selectedAsset} terminalOnly onSelect={asset => { const next = terminalSymbolForId(asset.id); if (next) navigate("symbol", next); }}/></div>
      <div className="ct-main-price"><strong>{quote(price)}</strong><span className={feed.ticker && feed.ticker.change < 0 ? "cc-negative" : "cc-positive"}><Change size={12}/>{feed.ticker ? Math.abs(feed.ticker.change).toFixed(2) + "%" : "—"}</span></div>
      <dl className="ct-instrument-stats">
        <div><dt>Last price</dt><dd>{quote(price)}</dd></div>
        <div><dt>24h change</dt><dd className={feed.ticker && feed.ticker.change < 0 ? "cc-negative" : "cc-positive"}>{feed.ticker ? `${feed.ticker.change > 0 ? "+" : ""}${feed.ticker.change.toFixed(2)}%` : "—"}</dd></div>
        <div><dt>24h high</dt><dd>{quote(feed.ticker?.high)}</dd></div>
        <div><dt>24h low</dt><dd>{quote(feed.ticker?.low)}</dd></div>
        <div><dt>24h volume ({symbol})</dt><dd>{quantity(feed.ticker?.volume)}</dd></div>
        <div><dt>24h volume (USDT)</dt><dd>{quote(feed.ticker?.quoteVolume, 0)}</dd></div>
        <div><dt>Spread</dt><dd>{quote(spread)}</dd></div>
      </dl>
      <div className="ct-feed-state"><span><i className={feed.priceFresh ? "ct-live-dot" : "ct-stale-dot"}/>{feed.priceFresh ? "Streaming" : feed.status}</span><button aria-label="Reconnect market feed" title="Reconnect market feed" onClick={feed.reconnect}><RefreshCw size={14}/></button></div>
    </section>

    {feed.errors.length > 0 && <details className="ct-feed-warning"><summary>Market feed notice · data may be delayed</summary><p>{feed.errors.join(" · ")}</p></details>}
    {alertNotice && <div className="ct-workspace-alert" role="alert"><Bell size={14}/><span>{alertNotice}</span><button onClick={() => setAlertsOpen(true)}>View alerts</button><button aria-label="Dismiss price alert" onClick={() => setAlertNotice("")}><X size={14}/></button></div>}

    <div className="ct-pro-layout">
      <div className="ct-pro-chart"><TerminalChart key={`${user?.id}:${pair}:${interval}`} candles={feed.candles} pair={pair} interval={interval} onAlert={() => setAlertsOpen(true)} onInterval={value => navigate("interval", value)} isFresh={feed.status === "streaming" && feed.now - feed.candleAt < 10000}/></div>

      {!focused && <aside className="ct-pro-book"><OrderBook book={feed.book} trades={feed.trades} fresh={feed.bookFresh} pair={pair} price={price} onPrice={value => setLimitPrice(String(value))}/></aside>}
      {!focused && <aside className="ct-pro-trade"><OrderPlanner key={`${user?.id}:${pair}:${mode}`} pair={pair} price={price} fresh={feed.priceFresh} limitPrice={limitPrice} onLimitPrice={setLimitPrice}/></aside>}
      {!focused && <section className="ct-pro-ai"><AgentInsights key={`${user?.id}:${pair}:${interval}`} pair={pair} interval={interval}/></section>}
      {!focused && <aside className="ct-pro-secondary"><RecentTrades trades={feed.trades} pair={pair}/><MarketDepth book={feed.book} pair={pair}/></aside>}
      {!focused && <section className="ct-pro-account"><AccountOrders/></section>}
      {!focused && <aside className="ct-pro-ideas"><ProfileCoinIdeas activeSymbol={symbol} mode={mode}/></aside>}
    </div>

    {alertsOpen && <div className="ct-alert-layer" role="dialog" aria-modal="false" aria-label="Price alerts"><div className="ct-alert-layer-head"><div><Bell size={14}/><strong>Price alerts</strong><span>{pair}</span></div><button className="cc-icon-button" aria-label="Close alerts" onClick={() => setAlertsOpen(false)}><X size={16}/></button></div><div className="ct-alert-layer-body"><PriceAlerts key={user?.id} pair={pair} price={price} fresh={feed.priceFresh} onTrigger={noticeAlert}/></div></div>}

    <footer className="ct-terminal-footer"><span>Binance Spot · USDT · public market data</span><span>{feed.receivedAt ? `Received ${new Date(feed.receivedAt).toLocaleTimeString()}` : "Snapshot pending"}</span></footer>
  </div>;
}

export default function TradingWorkstationPage() {
  return <DashboardShell><Workstation/></DashboardShell>;
}
