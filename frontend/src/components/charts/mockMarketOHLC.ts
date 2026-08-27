import { CandleData, ChartPeriod } from "./types"

// Helper to generate smooth realistic candles based on base price, trend, and volatility
function generateCandles(
  basePrice: number,
  count: number,
  volatility: number,
  trendFactor: number,
  startDate: Date,
  intervalDays: number
): CandleData[] {
  const candles: CandleData[] = []
  let currentPrice = basePrice

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + i * intervalDays * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split("T")[0]

    // Realistic day open close
    const open = currentPrice
    const change = (Math.sin(i * 0.4) * 0.5 + (Math.random() - 0.47) + trendFactor) * volatility * currentPrice
    const close = Math.max(open + change, open * 0.8)

    const isBull = close >= open
    const highWick = Math.random() * volatility * 0.7 * currentPrice
    const lowWick = Math.random() * volatility * 0.7 * currentPrice

    const high = Math.max(open, close) + highWick
    const low = Math.min(open, close) - lowWick

    // Realistic volume distribution
    const volume = Math.floor((15000 + Math.random() * 25000 + Math.abs(change) * 50) * (basePrice > 1000 ? 10 : 100))

    candles.push({
      time: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    })

    currentPrice = close
  }

  return candles
}

const now = new Date("2026-08-27")

// 1M datasets (approx 30 daily candles)
const btc1M = generateCandles(108500, 30, 0.015, 0.003, new Date(now.getTime() - 30 * 86400000), 1)
const eth1M = generateCandles(4180, 30, 0.018, 0.0035, new Date(now.getTime() - 30 * 86400000), 1)
const sol1M = generateCandles(172, 30, 0.024, 0.004, new Date(now.getTime() - 30 * 86400000), 1)

// 1D (24 hourly-like intervals represented as date sequence)
const btc1D = generateCandles(116200, 24, 0.004, 0.0008, new Date(now.getTime() - 24 * 86400000), 1)
const eth1D = generateCandles(4260, 24, 0.005, 0.001, new Date(now.getTime() - 24 * 86400000), 1)
const sol1D = generateCandles(184, 24, 0.008, 0.0015, new Date(now.getTime() - 24 * 86400000), 1)

// 1W (7 intervals)
const btc1W = generateCandles(112400, 14, 0.009, 0.002, new Date(now.getTime() - 14 * 86400000), 1)
const eth1W = generateCandles(4210, 14, 0.011, 0.0025, new Date(now.getTime() - 14 * 86400000), 1)
const sol1W = generateCandles(179, 14, 0.015, 0.003, new Date(now.getTime() - 14 * 86400000), 1)

// 3M (60 daily candles)
const btc3M = generateCandles(96000, 60, 0.018, 0.004, new Date(now.getTime() - 60 * 86400000), 1)
const eth3M = generateCandles(3650, 60, 0.02, 0.0035, new Date(now.getTime() - 60 * 86400000), 1)
const sol3M = generateCandles(142, 60, 0.026, 0.005, new Date(now.getTime() - 60 * 86400000), 1)

// 1Y (90 sample candles spaced across the year)
const btc1Y = generateCandles(68000, 90, 0.022, 0.006, new Date(now.getTime() - 365 * 86400000), 4)
const eth1Y = generateCandles(2700, 90, 0.024, 0.005, new Date(now.getTime() - 365 * 86400000), 4)
const sol1Y = generateCandles(98, 90, 0.03, 0.007, new Date(now.getTime() - 365 * 86400000), 4)

export const MARKET_OHLC_DATA: Record<string, Record<ChartPeriod, CandleData[]>> = {
  BTC: {
    "1D": btc1D,
    "1W": btc1W,
    "1M": btc1M,
    "3M": btc3M,
    "1Y": btc1Y,
  },
  ETH: {
    "1D": eth1D,
    "1W": eth1W,
    "1M": eth1M,
    "3M": eth3M,
    "1Y": eth1Y,
  },
  SOL: {
    "1D": sol1D,
    "1W": sol1W,
    "1M": sol1M,
    "3M": sol3M,
    "1Y": sol1Y,
  },
}

export function getMarketCandles(symbol: string, period: ChartPeriod = "1M"): CandleData[] {
  const normalized = symbol.toUpperCase().replace("/USD", "").replace("/USDT", "").trim()
  const assetData = MARKET_OHLC_DATA[normalized] || MARKET_OHLC_DATA.BTC
  return assetData[period] || assetData["1M"]
}
