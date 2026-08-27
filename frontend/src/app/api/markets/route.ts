import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const coinIds = [
  "bitcoin",
  "ethereum",
  "solana",
  "tether",
  "binancecoin",
  "ripple",
  "cardano",
  "avalanche-2",
  "chainlink",
  "dogecoin",
]

const fallbackCoins = [
  { symbol: "BTC", name: "Bitcoin", currentPrice: 111820.4, priceChange: 2.84, volume: 30460000000, marketCap: 2220000000000, sparkline: [41, 43, 42, 47, 46, 51, 49, 55, 57, 54, 61, 65] },
  { symbol: "ETH", name: "Ethereum", currentPrice: 4632.18, priceChange: 1.72, volume: 18200000000, marketCap: 559000000000, sparkline: [35, 38, 37, 41, 43, 40, 46, 48, 47, 53, 51, 58] },
  { symbol: "SOL", name: "Solana", currentPrice: 213.08, priceChange: 3.11, volume: 6840000000, marketCap: 99400000000, sparkline: [22, 26, 24, 31, 29, 36, 34, 41, 39, 47, 49, 55] },
  { symbol: "USDT", name: "Tether", currentPrice: 1, priceChange: 0.01, volume: 76200000000, marketCap: 141000000000, sparkline: [45, 45, 46, 45, 45, 46, 45, 46, 45, 45, 46, 46] },
  { symbol: "BNB", name: "BNB", currentPrice: 884.56, priceChange: 0.93, volume: 2510000000, marketCap: 128000000000, sparkline: [31, 32, 30, 34, 36, 35, 39, 38, 42, 41, 45, 47] },
  { symbol: "XRP", name: "XRP", currentPrice: 3.08, priceChange: -1.21, volume: 4100000000, marketCap: 179000000000, sparkline: [58, 55, 57, 52, 54, 49, 50, 46, 48, 43, 45, 40] },
  { symbol: "ADA", name: "Cardano", currentPrice: 0.91, priceChange: 0.38, volume: 1200000000, marketCap: 32100000000, sparkline: [38, 39, 37, 40, 41, 40, 43, 42, 44, 43, 46, 47] },
  { symbol: "AVAX", name: "Avalanche", currentPrice: 32.47, priceChange: -0.46, volume: 480000000, marketCap: 13200000000, sparkline: [51, 48, 50, 47, 45, 46, 43, 44, 41, 42, 39, 40] },
  { symbol: "LINK", name: "Chainlink", currentPrice: 24.61, priceChange: 4.76, volume: 910000000, marketCap: 16200000000, sparkline: [24, 27, 26, 30, 34, 32, 37, 42, 40, 46, 51, 57] },
  { symbol: "DOGE", name: "Dogecoin", currentPrice: 0.24, priceChange: -2.18, volume: 1630000000, marketCap: 35700000000, sparkline: [56, 53, 55, 50, 52, 47, 49, 44, 46, 42, 40, 38] },
]

type CoinGeckoMarket = {
  symbol: string
  name: string
  current_price: number | null
  price_change_percentage_24h: number | null
  total_volume: number | null
  market_cap: number | null
  sparkline_in_7d?: { price?: number[] }
}

function lastDay(values: number[] | undefined) {
  if (!values?.length) return []
  const recent = values.slice(-24)
  const stride = Math.max(1, Math.floor(recent.length / 12))
  return recent.filter((_, index) => index % stride === 0).slice(-12)
}

export async function GET() {
  const endpoint = new URL("https://api.coingecko.com/api/v3/coins/markets")
  endpoint.searchParams.set("vs_currency", "usd")
  endpoint.searchParams.set("ids", coinIds.join(","))
  endpoint.searchParams.set("order", "market_cap_desc")
  endpoint.searchParams.set("sparkline", "true")
  endpoint.searchParams.set("price_change_percentage", "24h")

  try {
    const response = await fetch(endpoint, {
      headers: {
        accept: "application/json",
        "user-agent": "CoinCrest-Market-Overview/1.0",
      },
      cache: "no-store",
    })

    if (!response.ok) throw new Error(`Market provider returned ${response.status}`)

    const data = (await response.json()) as CoinGeckoMarket[]
    const coins = data.map((coin) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      currentPrice: coin.current_price ?? 0,
      priceChange: coin.price_change_percentage_24h ?? 0,
      volume: coin.total_volume ?? 0,
      marketCap: coin.market_cap ?? 0,
      sparkline: lastDay(coin.sparkline_in_7d?.price),
    }))

    return NextResponse.json({
      source: "live",
      provider: "CoinGecko",
      updatedAt: new Date().toISOString(),
      coins,
    })
  } catch {
    return NextResponse.json({
      source: "fallback",
      provider: "CoinCrest demonstration data",
      updatedAt: new Date().toISOString(),
      coins: fallbackCoins,
    })
  }
}
