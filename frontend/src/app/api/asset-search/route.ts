import { NextRequest, NextResponse } from "next/server";
import { searchProvider, MarketProviderError } from "@/lib/market-provider";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length < 2 || query.length > 100) return NextResponse.json({ error: "Use between 2 and 100 characters" }, { status: 400 });
  try { return NextResponse.json({ assets: await searchProvider(query), source: "CoinGecko" }); }
  catch (error) { return NextResponse.json({ error: "Directory search unavailable. Try again shortly." }, { status: error instanceof MarketProviderError && error.code === 429 ? 429 : 503 }); }
}
