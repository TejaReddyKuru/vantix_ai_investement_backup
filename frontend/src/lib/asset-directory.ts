import { ASSETS, isRecord } from "./market-data";
export const MARKET_CATEGORIES = [
  { key: "all", label: "All assets", provider: "", description: "Explore the provider’s coin directory. Categories can overlap." },
  { key: "layer-1", label: "Layer-1 coins", provider: "layer-1", description: "Native assets of base-layer blockchains." },
  { key: "stablecoins", label: "Stablecoins", provider: "stablecoins", description: "Assets designed to track a reference value. A peg is not a guarantee." },
  { key: "utility", label: "Utility tokens", provider: "", description: "Browse utility by sector: oracles, storage, exchange services and gaming. Categories overlap; this is not an exhaustive taxonomy." },
  { key: "governance", label: "Governance", provider: "governance", description: "Tokens associated with protocol or DAO decision-making." },
  { key: "privacy", label: "Privacy coins", provider: "privacy-coins", description: "Privacy-oriented assets. Market visibility does not imply trading availability." },
  { key: "meme", label: "Meme coins", provider: "meme-token", description: "Community and meme-driven assets. Consider liquidity and concentration risk." },
] as const;
export const UTILITY_SECTORS = [
  { key: "oracle", label: "Oracles" }, { key: "storage", label: "Storage" },
  { key: "exchange-based-tokens", label: "Exchange services" },
  { key: "gaming-utility-token", label: "Gaming utility" },
] as const;
export type CategoryKey = typeof MARKET_CATEGORIES[number]["key"];
export type DirectoryAsset = { id: string; symbol: string; name: string; image: string | null; rank: number | null };
export type CatalogCoin = DirectoryAsset & { currentPrice: number | null; priceChange: number | null; volume: number | null; marketCap: number | null; sparkline: number[]; history7d: number[]; providerUpdatedAt: string | null };
export type CatalogSnapshot = { coins: CatalogCoin[]; updatedAt: string; hasMore: boolean; page: number; matchCount: number | null };
function numeric(value: unknown, nonnegative = false): number | null { return typeof value === "number" && Number.isFinite(value) && (!nonnegative || value >= 0) ? value : null; }
export function normalizeCatalogMarkets(value: unknown, normalized = false): CatalogCoin[] {
  if (!Array.isArray(value)) throw new Error("Invalid market response");
  const identities = parseDirectory(value);
  return identities.map(identity => {
    const row = value.find(item => isRecord(item) && item.id === identity.id) as Record<string, unknown>;
    const history = normalized ? row.history7d : isRecord(row.sparkline_in_7d) ? row.sparkline_in_7d.price : [];
    const safeHistory = Array.isArray(history) && history.length <= 2000 && history.every(n => typeof n === "number" && Number.isFinite(n) && n > 0) ? history as number[] : [];
    const time = normalized ? row.providerUpdatedAt : row.last_updated;
    const price = numeric(normalized ? row.currentPrice : row.current_price, true);
    return { ...identity, currentPrice: price !== null && price > 0 ? price : null, priceChange: numeric(normalized ? row.priceChange : row.price_change_percentage_24h), volume: numeric(normalized ? row.volume : row.total_volume, true), marketCap: numeric(normalized ? row.marketCap : row.market_cap, true), history7d: safeHistory, sparkline: safeHistory.slice(-24), providerUpdatedAt: typeof time === "string" && Number.isFinite(Date.parse(time)) && Date.parse(time) <= Date.now() + 60_000 ? time : null };
  });
}
export function parseCatalogSnapshot(value: unknown): CatalogSnapshot {
  if (!isRecord(value) || value.source !== "live" || value.provider !== "CoinGecko" || typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt)) || Date.parse(value.updatedAt) > Date.now() + 60_000 || typeof value.hasMore !== "boolean" || !Number.isSafeInteger(value.page) || (value.page as number) < 1 || (value.page as number) > 1000) throw new Error("Market snapshot unavailable");
  return { coins: normalizeCatalogMarkets(value.coins, true), updatedAt: value.updatedAt, hasMore: value.hasMore, page: value.page as number, matchCount: typeof value.matchCount === "number" ? value.matchCount : null };
}
export function validCoinId(value: string) { return /^[a-z0-9][a-z0-9-]{0,119}$/.test(value); }
export function safeCoinImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return url.protocol === "https:" && ["coin-images.coingecko.com", "assets.coingecko.com"].includes(url.hostname) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function parseDirectory(value: unknown): DirectoryAsset[] {
  if (!Array.isArray(value)) throw new Error("Invalid asset directory");
  const seen = new Set<string>();
  return value.flatMap(row => {
    if (!isRecord(row) || typeof row.id !== "string" || !validCoinId(row.id) || seen.has(row.id) || typeof row.symbol !== "string" || !row.symbol.trim() || row.symbol.length > 30 || typeof row.name !== "string" || !row.name.trim()) return [];
    seen.add(row.id);
    return [{ id: row.id, name: row.name.slice(0, 120), symbol: row.symbol.toUpperCase(), image: safeCoinImage(row.large ?? row.image ?? row.thumb), rank: typeof row.market_cap_rank === "number" && Number.isSafeInteger(row.market_cap_rank) && row.market_cap_rank > 0 ? row.market_cap_rank : typeof row.rank === "number" && Number.isSafeInteger(row.rank) && row.rank > 0 ? row.rank : null }];
  }).slice(0, 500);
}
// Metadata-only suggestions, never a price fallback. Remote search is not restricted to these assets.
export const SUGGESTED_ASSETS: DirectoryAsset[] = [
  ...ASSETS,
  { id: "usd-coin", symbol: "USDC", name: "USDC (USD Coin)" },
  { id: "dai", symbol: "DAI", name: "Dai" },
  { id: "monero", symbol: "XMR", name: "Monero" },
  { id: "zcash", symbol: "ZEC", name: "Zcash" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap" },
  { id: "aave", symbol: "AAVE", name: "Aave" },
  { id: "filecoin", symbol: "FIL", name: "Filecoin" },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu" },
  { id: "pepe", symbol: "PEPE", name: "Pepe" },
].map(asset => ({ ...asset, image: null, rank: null }));
export function directorySuggestions(query: string) {
  const term = query.trim().toLowerCase().replace(/\s+/g, " ");
  return SUGGESTED_ASSETS.filter(asset => `${asset.name} ${asset.symbol} ${asset.id}`.toLowerCase().includes(term)).slice(0, 12);
}
export function categoryFromQuery(query: string): CategoryKey | null {
  const value = query.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^(layer1|layer1coins|layer1blockchains|nativecoins)$/.test(value)) return "layer-1";
  if (/^stablecoins?$/.test(value)) return "stablecoins";
  if (/^utility(tokens?)?$/.test(value)) return "utility";
  if (/^governance(tokens?)?$/.test(value)) return "governance";
  if (/^privacy(coins?)?$/.test(value)) return "privacy";
  if (/^meme(coins?|tokens?)?$/.test(value)) return "meme";
  return null;
}
export function terminalSymbolForId(id: string): string | null {
  const asset = ASSETS.find(a => a.id === id);
  return asset && asset.symbol !== "USDT" ? asset.symbol : null;
}
