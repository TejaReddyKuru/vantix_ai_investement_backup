import { NextRequest, NextResponse } from "next/server";
import { ASSETS } from "@/lib/market-data";
import { MARKET_CATEGORIES, UTILITY_SECTORS, validCoinId, normalizeCatalogMarkets } from "@/lib/asset-directory";
import { MarketProviderError, providerGet, searchProvider } from "@/lib/market-provider";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams;
  const query = (input.get("search") ?? "").trim();
  const categoryKey = input.get("category") ?? "all";
  const category = MARKET_CATEGORIES.find(c => c.key === categoryKey);
  const page = Number(input.get("page") ?? "1");
  const ids = input.get("ids");
  const sector = input.get("sector") ?? "oracle";
  if (!category || !Number.isSafeInteger(page) || page < 1 || page > 1000 || query.length > 100 || (ids && (ids.split(",").length > 50 || !ids.split(",").every(validCoinId))) || (categoryKey === "utility" && !UTILITY_SECTORS.some(s => s.key === sector))) return NextResponse.json({ error: "Invalid market filters" }, { status: 400 });
  const limit = 50;
  try {
    const params = new URLSearchParams({ vs_currency: "usd", order: "market_cap_desc", sparkline: "true", price_change_percentage: "24h", per_page: String(limit), page: String(page) });
    let matchCount: number | null = null;
    if (query) {
      const matches = await searchProvider(query);
      matchCount = matches.length;
      const slice = matches.slice((page - 1) * limit, page * limit);
      if (!slice.length) return NextResponse.json({ source: "live", provider: "CoinGecko", updatedAt: new Date().toISOString(), coins: [], hasMore: false, matchCount, page });
      params.set("ids", slice.map(m => m.id).join(",")); params.set("page", "1");
    } else if (ids) params.set("ids", ids);
    else if (categoryKey === "utility") params.set("category", sector);
    else if (category.provider) params.set("category", category.provider);
    else if (!input.has("page") && !input.has("category")) params.set("ids", [...ASSETS.map(a => a.id), "usd-coin", "monero", "uniswap"].join(","));
    const raw = await providerGet("coins/markets", params);
    if (!Array.isArray(raw)) throw new Error("Invalid prices response");
    const coins = normalizeCatalogMarkets(raw);
    if (raw.length && !coins.length) throw new Error("Market data validation failed");
    return NextResponse.json({ source: "live", provider: "CoinGecko", updatedAt: new Date().toISOString(), coins, page, matchCount, hasMore: matchCount !== null ? page * limit < matchCount : !ids && raw.length === limit }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const limited = error instanceof MarketProviderError && error.code === 429;
    return NextResponse.json({ source: "unavailable", provider: "CoinGecko", updatedAt: null, coins: [], error: limited ? error.message : "Market data unavailable. Check connectivity or the configured provider key, then retry." }, { status: limited ? 429 : 503, headers: limited ? { "Retry-After": "60" } : {} });
  }
}
