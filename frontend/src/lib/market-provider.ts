// Server-only public data adapter. Host and endpoints are never user-controlled.
import { isRecord } from "./market-data";
import { parseDirectory } from "./asset-directory";
type Cached = { until: number; promise: Promise<unknown> };
const cache = new Map<string, Cached>();
export class MarketProviderError extends Error {
  constructor(public code: number) { super(code === 429 ? "Market provider rate limit reached. Try again shortly." : "Market provider unavailable. Please retry."); }
}
export async function providerGet(path: string, params: URLSearchParams, ttl = 60_000): Promise<unknown> {
  if (!["coins/markets", "search", "coins/categories/list"].includes(path)) throw new Error("Unsupported provider endpoint");
  const key = path + "?" + params.toString();
  const existing = cache.get(key);
  if (existing && existing.until > Date.now()) return existing.promise;
  for (const [id, item] of cache) if (item.until <= Date.now()) cache.delete(id);
  if (cache.size >= 200) cache.delete(cache.keys().next().value!);
  const promise = (async () => {
    const headers: Record<string, string> = { accept: "application/json" };
    if (process.env.COINGECKO_DEMO_API_KEY) headers["x-cg-demo-api-key"] = process.env.COINGECKO_DEMO_API_KEY;
    const response = await fetch(`https://api.coingecko.com/api/v3/${key}`, { headers, signal: AbortSignal.timeout(10_000), cache: "no-store" });
    if (!response.ok) throw new MarketProviderError(response.status);
    return response.json();
  })();
  cache.set(key, { until: Date.now() + ttl, promise });
  try { return await promise; } catch (error) { cache.delete(key); throw error; }
}
export async function searchProvider(query: string) {
  const data = await providerGet("search", new URLSearchParams({ query: query.toLowerCase() === "usd coin" ? "usdc" : query }), 300_000);
  if (!isRecord(data) || !Array.isArray(data.coins)) throw new Error("Invalid directory response");
  return parseDirectory(data.coins);
}
