"use client";

import { quote, quantity, type Book, type TapeTrade } from "@/lib/terminal-market";

function pathFor(rows: [number, number][], min: number, max: number, width: number, height: number) {
  if (!rows.length || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return "";
  let running = 0;
  const totals = rows.map(([price, size]) => ({ price, total: (running += size) }));
  const ceiling = Math.max(1e-8, ...totals.map(item => item.total));
  return totals.map((item, index) => {
    const x = (item.price - min) / (max - min) * width;
    const y = height - item.total / ceiling * (height - 8);
    return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export default function MarketDepth({ book, pair }: { book: Book | null; pair: string }) {
  const asks = book?.asks.slice(0, 12) ?? [];
  const bids = book?.bids.slice(0, 12) ?? [];
  const prices = [...asks, ...bids].map(([price]) => price);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 1;
  const bidVolume = bids.reduce((sum, [, size]) => sum + size, 0);
  const askVolume = asks.reduce((sum, [, size]) => sum + size, 0);
  const total = bidVolume + askVolume;
  const bidShare = total ? Math.round(bidVolume / total * 100) : 0;
  const base = pair.replace(/USDT$/, "");
  return <section className="ct-panel ct-market-depth-card">
    <header><strong>Market depth</strong><span>Top 12 · {base}</span></header>
    {book ? <>
      <div className="ct-depth-legend"><span><i className="buy"/>Buy {bidShare}%</span><span><i className="sell"/>Sell {100 - bidShare}%</span></div>
      <svg viewBox="0 0 300 118" role="img" aria-label={`${pair} order book cumulative market depth`} preserveAspectRatio="none">
        <path className="buy-area" d={`${pathFor([...bids].sort((a,b) => a[0]-b[0]), min, max, 300, 110)} L300,118 L0,118 Z`}/>
        <path className="sell-area" d={`${pathFor([...asks].sort((a,b) => a[0]-b[0]), min, max, 300, 110)} L300,118 L0,118 Z`}/>
        <path className="buy-line" d={pathFor([...bids].sort((a,b) => a[0]-b[0]), min, max, 300, 110)}/>
        <path className="sell-line" d={pathFor([...asks].sort((a,b) => a[0]-b[0]), min, max, 300, 110)}/>
      </svg>
      <div className="ct-depth-axis"><span>{quote(min)}</span><span>{quote((min + max) / 2)}</span><span>{quote(max)}</span></div>
    </> : <p className="ct-empty">Waiting for verified order-book depth.</p>}
  </section>;
}

export function RecentTrades({ trades, pair }: { trades: TapeTrade[]; pair: string }) {
  const base = pair.replace(/USDT$/, "");
  return <section className="ct-panel ct-recent-trades-card"><header><strong>Recent trades</strong><span>Public prints</span></header>
    <div className="ct-recent-labels"><span>Price</span><span>Size ({base})</span><span>Time</span></div>
    <div className="ct-recent-list">{trades.length ? trades.slice(0, 7).map(trade => <div key={trade.id} className={trade.side}><span>{quote(trade.price)}</span><span>{quantity(trade.quantity)}</span><span>{new Date(trade.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span></div>) : <p>Waiting for live trade prints.</p>}</div>
  </section>;
}
