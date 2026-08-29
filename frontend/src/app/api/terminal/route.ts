import { NextRequest, NextResponse } from "next/server";
import { parseBook, parseCandles, parseTicker, parseTrade, validInterval, validPair, type TerminalSnapshot } from "@/lib/terminal-market";

export const dynamic = "force-dynamic";
// Public market data only: no keys, account endpoints, user URL or order execution.
const ORIGIN = "https://data-api.binance.vision";
const pending = new Map<string, { until: number; value: Promise<TerminalSnapshot> }>();
export async function GET(request: NextRequest) {
  const pair = request.nextUrl.searchParams.get("symbol") ?? "BTCUSDT";
  const interval = request.nextUrl.searchParams.get("interval") ?? "1h";
  if (!validPair(pair) || !validInterval(interval)) return NextResponse.json({ error: "Unsupported symbol or interval" }, { status: 400 });
  const key = `${pair}:${interval}`;
  let job = pending.get(key);
  if (!job || job.until < Date.now()) {
    for (const [k, v] of pending) if (v.until < Date.now()) pending.delete(k);
    const value = (async (): Promise<TerminalSnapshot> => {
      let restricted = false;
      const errors: string[] = [];
      async function get(endpoint: string) {
        const response = await fetch(`${ORIGIN}/api/v3/${endpoint}`, { signal: AbortSignal.timeout(10000), cache: "no-store" });
        if (!response.ok) {
          if ([403, 418, 429, 451].includes(response.status)) restricted = true;
          throw new Error(`Provider status ${response.status}`);
        }
        return response.json() as Promise<unknown>;
      }
      const values = await Promise.allSettled([
        get(`klines?symbol=${pair}&interval=${interval}&limit=500`).then(parseCandles),
        get(`depth?symbol=${pair}&limit=20`).then(parseBook),
        get(`ticker/24hr?symbol=${pair}`).then(v => parseTicker(v, pair)),
        get(`trades?symbol=${pair}&limit=40`).then(v => { if (!Array.isArray(v)) throw new Error("Invalid trades"); return v.map(t => parseTrade(t, pair)).reverse(); }),
      ]);
      const [history, depth, ticker, trades] = values;
      values.forEach((value, i) => { if (value.status === "rejected") errors.push(["Candle history", "Order book", "24h ticker", "Recent trades"][i] + " unavailable"); });
      return { pair, interval, receivedAt: Date.now(), restricted, errors, candles: history.status === "fulfilled" ? history.value : [], book: depth.status === "fulfilled" ? depth.value : null, ticker: ticker.status === "fulfilled" ? ticker.value : null, trades: trades.status === "fulfilled" ? trades.value : [] };
    })();
    // One immutable market snapshot can safely seed several browser tabs. The
    // socket takes over after hydration, so this only de-duplicates startup
    // requests and never caches account or order data.
    job = { until: Date.now() + 15000, value };
    pending.set(key, job);
  }
  try {
    return NextResponse.json(await job.value, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Market-data provider unavailable" }, { status: 503 });
  }
}
