import { isRecord } from "./market-data";
import { object } from "./workspace-data";
export type Watchlist = { id: string; user_id: string; name: string; items: { id: string; watchlist_id: string; asset_id: string }[] };
export type AssetRecord = { id: string; symbol: string; base_asset: string; quote_asset: string; name: string; exchange: string; status: string };
export function collection(value: unknown): { items: unknown[]; total: number } {
  const data = object(value);
  if (!Array.isArray(data.items) || !Number.isSafeInteger(data.total) || (data.total as number) < 0) throw new Error("Unexpected collection response. Backend contract verification required.");
  return { items: data.items, total: data.total as number };
}
export function parseWatchlist(value: unknown, userId: string): Watchlist {
  const row = object(value);
  if (row.user_id !== userId || typeof row.id !== "string" || typeof row.name !== "string" || !Array.isArray(row.items)) throw new Error("Watchlist unavailable for this user");
  const items = row.items.map(item => { const r = object(item); if (r.watchlist_id !== row.id || typeof r.id !== "string" || typeof r.asset_id !== "string") throw new Error("Invalid watchlist item"); return { id: r.id, watchlist_id: row.id as string, asset_id: r.asset_id }; });
  if (new Set(items.map(item => item.id)).size !== items.length || new Set(items.map(item => item.asset_id)).size !== items.length) throw new Error("Duplicate watchlist item");
  return { id: row.id, user_id: userId, name: row.name, items };
}
export function parseAsset(value: unknown): AssetRecord {
  const row = object(value);
  for (const key of ["id", "symbol", "base_asset", "quote_asset", "name", "exchange", "status"]) if (typeof row[key] !== "string") throw new Error("Asset identity unavailable");
  return row as AssetRecord;
}
export const AGENTS = [
  { key: "technical_analysis", name: "Technical", description: "Trend, momentum & levels" },
  { key: "news", name: "News", description: "Events moving the market" },
  { key: "sentiment", name: "Sentiment", description: "The tone behind the headlines" },
  { key: "market_intelligence", name: "Market", description: "Context & conflicting signals" },
  { key: "portfolio_snapshot", name: "Portfolio", description: "Backend account context" },
  { key: "risk_assessment", name: "Risk", description: "Exposure & risk constraints" },
] as const;
export type Unified = { symbol: string; timestamp: string | null; outputs: Record<string, unknown>; strategy: unknown; execution: Record<string, unknown> };
export function parseUnified(value: unknown, symbol: string, userId: string, interval?: string): Unified {
  const row = object(value);
  if (row.symbol !== symbol || !isRecord(row.execution_summary)) throw new Error("Analysis does not match selected market");
  const outputs: Record<string, unknown> = {};
  for (const agent of AGENTS) {
    const output = row[agent.key];
    if (output != null && !(agent.key === "news" ? Array.isArray(output) : isRecord(output))) throw new Error("Invalid agent response");
    if (isRecord(output) && output.user_id != null && output.user_id !== userId) throw new Error("Analysis account mismatch");
    if (isRecord(output) && output.symbol != null && output.symbol !== symbol) throw new Error("Agent market mismatch");
    if (agent.key === "technical_analysis" && interval && isRecord(output) && output.interval != null && output.interval !== interval) throw new Error("Agent timeframe mismatch");
    outputs[agent.key] = output ?? null;
  }
  if (typeof row.timestamp === "string" && Date.parse(row.timestamp) > Date.now() + 60000) throw new Error("Analysis timestamp is in the future");
  return { symbol, timestamp: typeof row.timestamp === "string" && Number.isFinite(Date.parse(row.timestamp)) ? row.timestamp : null, outputs, strategy: row.strategy_decision ?? null, execution: row.execution_summary };
}
// Bound nesting and length; never render secrets, IDs or backend HTML.
export function insightFields(value: unknown, prefix = "", depth = 0): { label: string; value: string }[] {
  if (depth > 3 || !isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, item]) => {
    if (/(?:^|_)(?:id|token|secret|password|credential|api_key)(?:$|_)/i.test(key)) return [];
    const label = (prefix + key).replaceAll("_", " ");
    if (typeof item === "string") return [{ label, value: item.slice(0, 350) }];
    if (typeof item === "number" && Number.isFinite(item)) return [{ label, value: String(item) }];
    if (typeof item === "boolean") return [{ label, value: item ? "Yes" : "No" }];
    if (Array.isArray(item) && item.every(x => typeof x === "string")) return [{ label, value: item.slice(0, 3).join(" · ").slice(0, 500) }];
    return insightFields(item, label + " / ", depth + 1);
  }).slice(0, 12);
}
export type LocalPriceAlert = { id: string; pair: string; direction: "above" | "below"; threshold: number; active: boolean; triggeredAt: number | null; createdAt: number };
export function alertCrossed(alert: LocalPriceAlert, previous: number | null, current: number): boolean {
  if (!alert.active || previous == null || !Number.isFinite(current) || !Number.isFinite(previous)) return false;
  return alert.direction === "above" ? previous < alert.threshold && current >= alert.threshold : previous > alert.threshold && current <= alert.threshold;
}
