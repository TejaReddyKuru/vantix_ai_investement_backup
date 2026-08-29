/** Market-only data. Never infer account balances or AI analysis from this feed. */
export const ASSETS = [
  { symbol: "BTC", name: "Bitcoin", id: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", id: "ethereum" },
  { symbol: "SOL", name: "Solana", id: "solana" },
  { symbol: "BNB", name: "BNB", id: "binancecoin" },
  { symbol: "XRP", name: "XRP", id: "ripple" },
  { symbol: "ADA", name: "Cardano", id: "cardano" },
  { symbol: "AVAX", name: "Avalanche", id: "avalanche-2" },
  { symbol: "LINK", name: "Chainlink", id: "chainlink" },
  { symbol: "DOGE", name: "Dogecoin", id: "dogecoin" },
  { symbol: "USDT", name: "Tether", id: "tether" },
] as const;

export type MarketCoin = {
  id: string;
  image?: string | null;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange: number;
  volume: number;
  marketCap: number;
  sparkline: number[];
  history7d: number[];
  providerUpdatedAt: string | null;
};
export type MarketSnapshot = {
  source: "live";
  provider: "CoinGecko";
  updatedAt: string;
  coins: MarketCoin[];
};
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
function prices(value: unknown): number[] {
  return Array.isArray(value) &&
    value.every((price) => finite(price) && price > 0)
    ? value
    : [];
}
function timestamp(value: unknown): string | null {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? value
    : null;
}
export function normalizeProviderMarkets(payload: unknown): MarketCoin[] {
  if (!Array.isArray(payload)) throw new Error("Invalid market response");
  const result: MarketCoin[] = [];
  const seen = new Set<string>();
  for (const item of payload) {
    if (!isRecord(item)) continue;
    if (typeof item.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(item.id) || typeof item.name !== "string" || typeof item.symbol !== "string" || seen.has(item.id)) continue;
    const asset = { id: item.id, name: item.name, symbol: item.symbol.toUpperCase() };
    const price = item.current_price,
      change = item.price_change_percentage_24h;
    const volume = item.total_volume,
      cap = item.market_cap;
    // Missing values must not become zero prices, moves, or volume.
    if (
      !finite(price) ||
      price <= 0 ||
      !finite(change) ||
      !finite(volume) ||
      volume < 0 ||
      !finite(cap) ||
      cap < 0
    )
      continue;
    const history = prices(
      isRecord(item.sparkline_in_7d) ? item.sparkline_in_7d.price : null,
    );
    result.push({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      currentPrice: price,
      priceChange: change,
      volume,
      marketCap: cap,
      sparkline: history.slice(-24),
      history7d: history,
      providerUpdatedAt: timestamp(item.last_updated),
    });
    seen.add(asset.id);
  }
  return result;
}
export function parseMarketSnapshot(payload: unknown): MarketSnapshot {
  if (
    !isRecord(payload) ||
    payload.source !== "live" ||
    payload.provider !== "CoinGecko" ||
    !timestamp(payload.updatedAt) ||
    !Array.isArray(payload.coins)
  )
    throw new Error("Verified market data is unavailable");
  const coins: MarketCoin[] = [],
    seen = new Set<string>();
  for (const coin of payload.coins) {
    if (
      !isRecord(coin) ||
      typeof coin.symbol !== "string" ||
      typeof coin.id !== "string" || seen.has(coin.id)
    )
      continue;
    const asset = typeof coin.name === "string" && /^[a-z0-9][a-z0-9-]{0,119}$/.test(coin.id as string) ? { id: coin.id as string, name: coin.name, symbol: coin.symbol } : null;
    if (
      !asset ||
      !finite(coin.currentPrice) ||
      coin.currentPrice <= 0 ||
      !finite(coin.priceChange) ||
      !finite(coin.volume) ||
      coin.volume < 0 ||
      !finite(coin.marketCap) ||
      coin.marketCap < 0
    )
      continue;
    coins.push({
      id: asset.id,
      image: typeof coin.image === "string" ? coin.image : null,
      symbol: asset.symbol,
      name: asset.name,
      currentPrice: coin.currentPrice,
      priceChange: coin.priceChange,
      volume: coin.volume,
      marketCap: coin.marketCap,
      history7d: prices(coin.history7d),
      sparkline: prices(coin.sparkline),
      providerUpdatedAt: timestamp(coin.providerUpdatedAt),
    });
    seen.add(asset.id);
  }
  if (!coins.length) throw new Error("No valid prices were returned");
  return {
    source: "live",
    provider: "CoinGecko",
    updatedAt: payload.updatedAt as string,
    coins,
  };
}
export function money(
  value: number | null | undefined,
  compact = false,
): string {
  if (!finite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : value < 0.01 && value > 0 ? 10 : value < 1 && value > 0 ? 6 : 2,
  }).format(value);
}
export function percent(value: number | null | undefined): string {
  return finite(value) ? `${value > 0 ? "+" : ""}${value.toFixed(2)}%` : "—";
}
export function isSnapshotStale(
  updatedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!updatedAt) return true;
  const time = Date.parse(updatedAt);
  return !Number.isFinite(time) || time > now + 60_000 || now - time > 180_000;
}
export function normalizeSymbol(value: string | null): string {
  const input = (value || "BTC").trim().toUpperCase();
  if (ASSETS.some((asset) => asset.symbol === input)) return input;
  const symbol = input.replace(/(?:\/)?(?:USDT|USD)$/, "");
  return ASSETS.some((asset) => asset.symbol === symbol) ? symbol : "BTC";
}
