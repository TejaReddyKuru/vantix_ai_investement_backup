"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";
import { isSnapshotStale, money, percent } from "@/lib/market-data";

export default function MarketTicker() {
  const market = useMarketSnapshot();
  const [paused, setPaused] = useState(false), [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const coins = market.data?.coins ?? [];
  const delayed = market.isError || coins.some(coin => isSnapshotStale(coin.providerUpdatedAt, now));
  const status = !coins.length ? "Waiting for quotes" : delayed ? "Quotes delayed; check provider timestamps" : "USD reference quotes; refresh about every 60 seconds";
  return <div className="cc-ticker cc-ticker-v5" aria-label="Market price ticker">
    <span className={`cc-ticker-dot ${delayed || !coins.length ? "is-delayed" : ""}`} role="img" aria-label={status} title={status}/>
    <div className="cc-ticker-window"><div className={`cc-ticker-track ${paused || !coins.length ? "is-paused" : ""}`}>
      {coins.length ? [0, 1].map(copy => <div key={copy} className="cc-ticker-set" aria-hidden={copy === 1 ? true : undefined}>
        {coins.map(coin => <Link tabIndex={copy === 1 ? -1 : undefined} key={coin.id} href={`/markets?coin=${encodeURIComponent(coin.id)}`}>
          <strong>{coin.symbol}</strong><span>{money(coin.currentPrice)}</span><b className={coin.priceChange < 0 ? "cc-negative" : "cc-positive"}>{percent(coin.priceChange)}</b>
        </Link>)}
      </div>) : <span className="cc-ticker-empty">{market.isError ? "Market feed unavailable · retry from Markets" : "Loading market prices…"}</span>}
    </div></div>
    <button type="button" className="cc-ticker-pause" disabled={!coins.length} aria-pressed={paused} aria-label={paused ? "Resume ticker motion" : "Pause ticker motion"} onClick={() => setPaused(value => !value)}>{paused ? <Play size={13}/> : <Pause size={13}/>}</button>
  </div>;
}
