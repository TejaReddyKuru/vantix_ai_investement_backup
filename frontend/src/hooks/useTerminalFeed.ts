"use client";
import { useCallback, useEffect, useState } from "react";
import { isRecord } from "@/lib/market-data";
import { parseBook, parseCandle, parseTicker, parseTrade, streamUrl, upsertCandle, validPair, type Interval, type TerminalSnapshot } from "@/lib/terminal-market";

export type FeedState = TerminalSnapshot & { status: "connecting" | "streaming" | "reconnecting" | "paused" | "unavailable" | "restricted"; bookAt: number; candleAt: number; tickerAt: number; now: number };
const empty = (pair: string, interval: Interval): FeedState => ({ pair, interval, candles: [], book: null, trades: [], ticker: null, receivedAt: 0, errors: [], restricted: false, status: "connecting", bookAt: 0, candleAt: 0, tickerAt: 0, now: Date.now() });
export function useTerminalFeed(pair: string, interval: Interval) {
  const [state, setState] = useState<FeedState>(() => empty(pair, interval));
  const [revision, setRevision] = useState(0);
  const reconnect = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    let disposed = false, generation = 0, attempts = 0;
    let socket: WebSocket | undefined, request: AbortController | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let live = empty(pair, interval), dirty = true, lastMessage = 0;
    setState(live);
    function publish() { if (!disposed) setState({ ...live, now: Date.now() }); }
    function stop() { generation++; request?.abort(); clearTimeout(retry); if (socket) { socket.onclose = null; socket.close(); socket = undefined; } }
    function failed() {
      if (disposed || document.hidden) return;
      if (attempts >= 5) { live.status = "unavailable"; live.errors = ["Streaming connection unavailable. Reconnect when your network is ready."]; dirty = true; return; }
      live.status = "reconnecting"; dirty = true;
      retry = setTimeout(() => void start(), Math.min(30000, 1000 * 2 ** attempts++) + Math.random() * 500);
    }
    async function start() {
      stop();
      if (disposed || document.hidden) return;
      const current = generation;
      if (!validPair(pair)) { live.status = "unavailable"; live.errors = ["This asset has no supported USDT market."]; publish(); return; }
      live.status = attempts ? "reconnecting" : "connecting"; publish();
      request = new AbortController();
      const timeout = setTimeout(() => request?.abort(), 12000);
      try {
        const response = await fetch(`/api/terminal?symbol=${encodeURIComponent(pair)}&interval=${interval}`, { signal: request.signal, cache: "no-store", credentials: "omit" });
        if (!response.ok) throw new Error("Snapshot unavailable");
        const snapshot = await response.json() as TerminalSnapshot;
        if (disposed || generation !== current) return;
        if (snapshot.pair !== pair || snapshot.interval !== interval || !Array.isArray(snapshot.candles) || !Array.isArray(snapshot.trades)) throw new Error("Mismatched market response");
        live = { ...snapshot, status: "connecting", bookAt: snapshot.book ? Date.now() : 0, candleAt: snapshot.candles.length ? Date.now() : 0, tickerAt: snapshot.ticker ? Date.now() : 0, now: Date.now() };
        if (snapshot.restricted) { live.status = "restricted"; live.errors = ["Market-data access is restricted or rate-limited by the provider. Automatic reconnect is stopped."]; publish(); return; }
      } catch {
        if (disposed || generation !== current) return;
        live.errors = ["Historical snapshot unavailable. Streaming will only display data actually received."];
      } finally { clearTimeout(timeout); }
      if (disposed || current !== generation) return;
      let ws: WebSocket;
      try { ws = new WebSocket(streamUrl(pair, interval)); socket = ws; } catch { failed(); return; }
      lastMessage = Date.now();
      const openedAt = Date.now();
      socket.onmessage = event => {
        if (disposed || current !== generation) return;
        try {
          const envelope: unknown = JSON.parse(event.data);
          if (!isRecord(envelope) || typeof envelope.stream !== "string" || !isRecord(envelope.data)) return;
          const message = envelope.data;
          const s = pair.toLowerCase();
          let changed = false;
          if (envelope.stream === `${s}@depth20`) {
            const book = parseBook(message);
            if (!live.book || book.id >= live.book.id) { live.book = book; live.bookAt = Date.now(); changed = true; }
          } else if (envelope.stream === `${s}@kline_${interval}` && message.s === pair && isRecord(message.k) && message.k.i === interval) {
            const k = message.k;
            live.candles = upsertCandle(live.candles, parseCandle([k.t, k.o, k.h, k.l, k.c, k.v, k.T]));
            live.candleAt = Date.now(); changed = true;
          } else if (envelope.stream === `${s}@ticker`) {
            const ticker = parseTicker(message, pair, true);
            if (!live.ticker || ticker.time >= live.ticker.time) { live.ticker = ticker; live.tickerAt = Date.now(); changed = true; }
          } else if (envelope.stream === `${s}@trade`) {
            const trade = parseTrade(message, pair, true);
            if (!live.trades.length || trade.id > live.trades[0].id) { live.trades = [trade, ...live.trades].slice(0, 40); changed = true; }
          }
          if (changed) { live.status = "streaming"; lastMessage = Date.now(); dirty = true; if (Date.now() - openedAt > 30000) attempts = 0; }
        } catch { /* Malformed updates do not overwrite the last valid snapshot. */ }
      };
      ws.onclose = () => { if (generation === current) failed(); };
      ws.onerror = () => ws.close();
    }
    const flush = setInterval(() => { if (dirty) { dirty = false; publish(); } }, 250);
    const clock = setInterval(() => {
      if (disposed) return;
      if (socket?.readyState === WebSocket.OPEN && Date.now() - lastMessage > 20000) socket.close();
      publish();
    }, 1000);
    const visibility = () => {
      stop();
      if (document.hidden) { live.status = "paused"; publish(); }
      else { attempts = 0; void start(); }
    };
    document.addEventListener("visibilitychange", visibility);
    if (document.hidden) { live.status = "paused"; publish(); } else void start();
    return () => { disposed = true; stop(); clearInterval(flush); clearInterval(clock); document.removeEventListener("visibilitychange", visibility); };
  }, [pair, interval, revision]);
  // Never flash the previous instrument during an asset/interval switch.
  const feed = state.pair === pair && state.interval === interval ? state : empty(pair, interval);
  return { ...feed, reconnect, bookFresh: feed.status === "streaming" && feed.now - feed.bookAt < 10000, priceFresh: feed.status === "streaming" && feed.now - feed.tickerAt < 10000 };
}
