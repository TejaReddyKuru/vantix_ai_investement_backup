import { ASSETS, isRecord } from "./market-data";

export const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Interval = (typeof INTERVALS)[number];
export const PAIRS = ASSETS.filter(a => a.symbol !== "USDT").map(a => `${a.symbol}USDT`);
export const INTERVAL_MS: Record<Interval, number> = { "1m": 60000, "5m": 300000, "15m": 900000, "1h": 3600000, "4h": 14400000, "1d": 86400000 };
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number; closeTime: number };
export type Book = { id: number; bids: [number, number][]; asks: [number, number][] };
export type TapeTrade = { id: number; price: number; quantity: number; time: number; side: "buy" | "sell" };
export type Ticker = { price: number; change: number; high: number; low: number; volume: number; quoteVolume: number; time: number };
export type TerminalSnapshot = { pair: string; interval: Interval; candles: Candle[]; book: Book | null; trades: TapeTrade[]; ticker: Ticker | null; receivedAt: number; errors: string[]; restricted: boolean };
export function validPair(value: string): boolean { return PAIRS.includes(value); }
export function validInterval(value: string): value is Interval { return INTERVALS.includes(value as Interval); }
export function numeric(value: unknown, allowZero = false): number {
  if ((typeof value !== "number" && typeof value !== "string") || value === "" || (typeof value === "string" && !/^[-+]?\d+(?:\.\d+)?$/.test(value))) throw new Error("Invalid numeric market value");
  const n = Number(value);
  if (!Number.isFinite(n) || (allowZero ? n < 0 : n <= 0)) throw new Error("Invalid market value");
  return n;
}
export function parseCandle(value: unknown): Candle {
  if (!Array.isArray(value) || value.length < 7) throw new Error("Invalid candle");
  const [time, open, high, low, close, volume, closeTime] = value;
  const c = { time: numeric(time), open: numeric(open), high: numeric(high), low: numeric(low), close: numeric(close), volume: numeric(volume, true), closeTime: numeric(closeTime) };
  if (!Number.isSafeInteger(c.time) || !Number.isSafeInteger(c.closeTime) || c.closeTime < c.time || c.low > Math.min(c.open, c.close) || c.high < Math.max(c.open, c.close) || c.low > c.high) throw new Error("Inconsistent OHLC candle");
  return c;
}
export function parseCandles(value: unknown): Candle[] {
  if (!Array.isArray(value) || !value.length || value.length > 1000) throw new Error("Candle history unavailable");
  const candles = value.map(parseCandle);
  if (candles.some((c, i) => i > 0 && c.time <= candles[i - 1].time)) throw new Error("Unordered candle history");
  return candles;
}
export function upsertCandle(candles: Candle[], c: Candle): Candle[] {
  if (!candles.length) return [c];
  const last = candles[candles.length - 1];
  if (c.time < last.time) return candles;
  return c.time === last.time ? [...candles.slice(0, -1), c] : [...candles, c].slice(-500);
}
export function parseBook(value: unknown): Book {
  if (!isRecord(value) || !Array.isArray(value.bids) || !Array.isArray(value.asks)) throw new Error("Order book unavailable");
  function levels(value: unknown[], descending: boolean): [number, number][] {
    const rows = value.slice(0, 20).map(row => {
      if (!Array.isArray(row) || row.length < 2) throw new Error("Invalid depth level");
      return [numeric(row[0]), numeric(row[1])] as [number, number];
    });
    if (new Set(rows.map(row => row[0])).size !== rows.length) throw new Error("Duplicate depth price");
    return rows.sort((a, b) => descending ? b[0] - a[0] : a[0] - b[0]);
  }
  const bids = levels(value.bids, true), asks = levels(value.asks, false);
  if (!bids.length || !asks.length || bids[0][0] >= asks[0][0]) throw new Error("Crossed or empty order book");
  const id = numeric(value.lastUpdateId, true);
  if (!Number.isSafeInteger(id)) throw new Error("Invalid order book revision");
  return { id, bids, asks };
}
export function parseTicker(value: unknown, pair: string, stream = false): Ticker {
  if (!isRecord(value) || (stream ? value.s : value.symbol) !== pair) throw new Error("Ticker does not match market");
  const rawChange = stream ? value.P : value.priceChangePercent;
  if ((typeof rawChange !== "string" && typeof rawChange !== "number") || (typeof rawChange === "string" && !/^[-+]?\d+(?:\.\d+)?$/.test(rawChange))) throw new Error("Invalid price change");
  const change = Number(rawChange);
  if (!Number.isFinite(change)) throw new Error("Invalid price change");
  return { price: numeric(stream ? value.c : value.lastPrice), change, high: numeric(stream ? value.h : value.highPrice), low: numeric(stream ? value.l : value.lowPrice), volume: numeric(stream ? value.v : value.volume, true), quoteVolume: numeric(stream ? value.q : value.quoteVolume, true), time: numeric(stream ? value.E : value.closeTime) };
}
export function parseTrade(value: unknown, pair: string, stream = false): TapeTrade {
  if (!isRecord(value) || (stream && value.s !== pair)) throw new Error("Invalid trade");
  const maker = stream ? value.m : value.isBuyerMaker;
  if (typeof maker !== "boolean") throw new Error("Trade side unavailable");
  return { id: numeric(stream ? value.t : value.id, true), price: numeric(stream ? value.p : value.price), quantity: numeric(stream ? value.q : value.qty), time: numeric(stream ? value.T : value.time), side: maker ? "sell" : "buy" };
}
export function streamUrl(pair: string, interval: Interval): string {
  if (!validPair(pair) || !validInterval(interval)) throw new Error("Unsupported market");
  const s = pair.toLowerCase();
  return `wss://data-stream.binance.vision/stream?streams=${s}@kline_${interval}/${s}@depth20/${s}@trade/${s}@ticker`;
}
export function quote(value: number | null | undefined, digits?: number): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: digits ?? (Math.abs(value) >= 1 ? 2 : 5), maximumFractionDigits: digits ?? (Math.abs(value) >= 1 ? 2 : 8) });
}
export function quantity(value: number | undefined): string { return value == null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: 6 }); }
