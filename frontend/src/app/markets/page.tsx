"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ChevronsUpDown,
  CircleHelp,
  LineChart,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react"
import CoinCrestBrand from "../../components/branding/CoinCrestBrand"
import SiteFooter from "../../components/landing/SiteFooter"
import DashboardShell from "@/components/dashboard/DashboardShell"

type MarketToken = {
  symbol: string
  name: string
  icon: string
  price: number
  priceLabel: string
  change: number
  volume: number
  volumeLabel: string
  marketCap: number
  marketCapLabel: string
  category: string
  tags: string[]
  isNew?: boolean
  chart: number[]
}

type SortKey = "price" | "change" | "volume" | "marketCap"
type MarketView = "Overview" | "Trading data" | "Token unlocks"

type MarketsApiResponse = {
  source: "live" | "fallback"
  provider: string
  updatedAt: string
  coins: Array<{
    symbol: string
    name: string
    currentPrice: number
    priceChange: number
    volume: number
    marketCap: number
    sparkline: number[]
  }>
}

const tokens: MarketToken[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    icon: "/crypto/btc.png",
    price: 111820.4,
    priceLabel: "$111,820.40",
    change: 2.84,
    volume: 30.46,
    volumeLabel: "$30.46B",
    marketCap: 2220,
    marketCapLabel: "$2.22T",
    category: "Layer 1",
    tags: ["Cryptos", "Spot", "Futures", "Payments"],
    chart: [41, 43, 42, 47, 46, 51, 49, 55, 57, 54, 61, 65],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: "/crypto/eth.png",
    price: 4632.18,
    priceLabel: "$4,632.18",
    change: 1.72,
    volume: 18.2,
    volumeLabel: "$18.20B",
    marketCap: 559,
    marketCapLabel: "$559.0B",
    category: "Layer 1",
    tags: ["Cryptos", "Spot", "Futures", "DeFi"],
    chart: [35, 38, 37, 41, 43, 40, 46, 48, 47, 53, 51, 58],
  },
  {
    symbol: "SOL",
    name: "Solana",
    icon: "/crypto/sol.png",
    price: 213.08,
    priceLabel: "$213.08",
    change: 3.11,
    volume: 6.84,
    volumeLabel: "$6.84B",
    marketCap: 99.4,
    marketCapLabel: "$99.40B",
    category: "Layer 1",
    tags: ["Cryptos", "Spot", "Futures", "DeFi"],
    chart: [22, 26, 24, 31, 29, 36, 34, 41, 39, 47, 49, 55],
  },
  {
    symbol: "USDT",
    name: "Tether",
    icon: "/crypto/usdt.png",
    price: 1,
    priceLabel: "$1.00",
    change: 0.01,
    volume: 76.2,
    volumeLabel: "$76.20B",
    marketCap: 141,
    marketCapLabel: "$141.0B",
    category: "Payments",
    tags: ["Cryptos", "Spot", "Payments"],
    chart: [45, 45, 46, 45, 45, 46, 45, 46, 45, 45, 46, 46],
  },
  {
    symbol: "BNB",
    name: "BNB",
    icon: "/crypto/bnb.png",
    price: 884.56,
    priceLabel: "$884.56",
    change: 0.93,
    volume: 2.51,
    volumeLabel: "$2.51B",
    marketCap: 128,
    marketCapLabel: "$128.0B",
    category: "Layer 1",
    tags: ["Cryptos", "Spot", "Futures"],
    chart: [31, 32, 30, 34, 36, 35, 39, 38, 42, 41, 45, 47],
  },
  {
    symbol: "XRP",
    name: "XRP",
    icon: "/crypto/xrp.png",
    price: 3.08,
    priceLabel: "$3.08",
    change: -1.21,
    volume: 4.1,
    volumeLabel: "$4.10B",
    marketCap: 179,
    marketCapLabel: "$179.0B",
    category: "Payments",
    tags: ["Cryptos", "Spot", "Futures", "Payments"],
    chart: [58, 55, 57, 52, 54, 49, 50, 46, 48, 43, 45, 40],
  },
  {
    symbol: "ADA",
    name: "Cardano",
    icon: "/crypto/ada.png",
    price: 0.91,
    priceLabel: "$0.91",
    change: 0.38,
    volume: 1.2,
    volumeLabel: "$1.20B",
    marketCap: 32.1,
    marketCapLabel: "$32.10B",
    category: "Layer 1",
    tags: ["Cryptos", "Spot", "Futures"],
    chart: [38, 39, 37, 40, 41, 40, 43, 42, 44, 43, 46, 47],
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    icon: "/crypto/avax.png",
    price: 32.47,
    priceLabel: "$32.47",
    change: -0.46,
    volume: 0.48,
    volumeLabel: "$480M",
    marketCap: 13.2,
    marketCapLabel: "$13.20B",
    category: "DeFi",
    tags: ["Cryptos", "Spot", "Futures", "DeFi"],
    chart: [51, 48, 50, 47, 45, 46, 43, 44, 41, 42, 39, 40],
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    icon: "/crypto/link.png",
    price: 24.61,
    priceLabel: "$24.61",
    change: 4.76,
    volume: 0.91,
    volumeLabel: "$910M",
    marketCap: 16.2,
    marketCapLabel: "$16.20B",
    category: "AI",
    tags: ["Cryptos", "Spot", "DeFi", "AI"],
    isNew: true,
    chart: [24, 27, 26, 30, 34, 32, 37, 42, 40, 46, 51, 57],
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    icon: "/crypto/doge.png",
    price: 0.24,
    priceLabel: "$0.24",
    change: -2.18,
    volume: 1.63,
    volumeLabel: "$1.63B",
    marketCap: 35.7,
    marketCapLabel: "$35.70B",
    category: "Meme",
    tags: ["Cryptos", "Spot", "Meme"],
    isNew: true,
    chart: [56, 53, 55, 50, 52, 47, 49, 44, 46, 42, 40, 38],
  },
]

const viewTabs: MarketView[] = ["Overview", "Trading data", "Token unlocks"]
const productTabs = ["Favorites", "Cryptos", "Spot", "Futures", "AI", "New listings"]
const categoryTabs = ["All", "Layer 1", "Payments", "DeFi", "AI", "Meme"]

const unlocks = [
  { symbol: "AVAX", name: "Avalanche", date: "Sep 12", value: "$41.2M", supply: "0.31%", progress: 68 },
  { symbol: "LINK", name: "Chainlink", date: "Sep 19", value: "$26.8M", supply: "0.18%", progress: 42 },
  { symbol: "SOL", name: "Solana", date: "Sep 28", value: "$18.4M", supply: "0.04%", progress: 24 },
]

function formatPrice(value: number) {
  const maximumFractionDigits = value >= 1000 ? 2 : value >= 1 ? 2 : 6
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value)
}

function formatMarketValue(value: number) {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
  return `$${value.toLocaleString("en-US")}`
}

function TokenIcon({ token, size = 34 }: { token: MarketToken; size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10"
      style={{ height: size, width: size }}
    >
      <Image src={token.icon} alt={`${token.name} logo`} fill sizes={`${size}px`} className="object-cover" />
    </span>
  )
}

function Sparkline({ values, positive, className = "h-10 w-28" }: { values: number[]; positive: boolean; className?: string }) {
  const width = 120
  const height = 42
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(max - min, 1)
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * (height - 8) - 4
      return `${x},${y}`
    })
    .join(" ")
  const color = positive ? "#5FBF83" : "#D6A12A"

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-label={`${positive ? "Rising" : "Falling"} 24-hour price chart`} role="img">
      <defs>
        <linearGradient id={`spark-${positive ? "up" : "down"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#spark-${positive ? "up" : "down"})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Change({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span className={`font-black tabular-nums ${positive ? "text-[#70C891]" : "text-[#E3B64D]"}`}>
      {positive ? "+" : ""}{value.toFixed(2)}%
    </span>
  )
}

function MarketSummaryCard({ title, tokens: cardTokens, accent }: { title: string; tokens: MarketToken[]; accent: "yellow" | "green" | "blue" }) {
  const accentClass = accent === "green" ? "bg-[#5FBF83]" : accent === "blue" ? "bg-[#2F78B7]" : "bg-[#F2C94C]"

  return (
    <article className="rounded-[22px] border border-white/10 bg-[#101310] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#FFEA93]/25">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.14em] text-white">
          <span className={`h-2 w-2 rounded-full ${accentClass}`} />
          {title}
        </h2>
        <a href="#market-table" className="text-[11px] font-bold text-white/48 transition hover:text-[#FFEA93]">View all</a>
      </div>

      <div className="space-y-4">
        {cardTokens.map((token) => (
          <div key={token.symbol} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <TokenIcon token={token} size={28} />
              <b className="text-[13px] text-white">{token.symbol}</b>
            </span>
            <span className="text-right text-[12px] font-bold tabular-nums text-white/82">{token.priceLabel}</span>
            <span className="w-[58px] text-right text-[11px]"><Change value={token.change} /></span>
          </div>
        ))}
      </div>
    </article>
  )
}

function SortButton({ label, sortKey, activeSort, onSort }: { label: string; sortKey: SortKey; activeSort: SortKey; onSort: (key: SortKey) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap transition ${activeSort === sortKey ? "text-[#FFEA93]" : "text-white/42 hover:text-white"}`}
    >
      {label}<ChevronsUpDown className="h-3.5 w-3.5" />
    </button>
  )
}

export default function MarketsPage() {
  const [view, setView] = useState<MarketView>("Overview")
  const [productTab, setProductTab] = useState("Cryptos")
  const [category, setCategory] = useState("All")
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("marketCap")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [favorites, setFavorites] = useState<string[]>(["BTC", "ETH", "SOL"])
  const [marketTokens, setMarketTokens] = useState<MarketToken[]>(tokens)
  const [dataStatus, setDataStatus] = useState<"loading" | "live" | "fallback" | "error">("loading")
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadMarketData = useCallback(async () => {
    setRefreshing(true)
    try {
      const response = await fetch("/api/markets", { cache: "no-store" })
      if (!response.ok) throw new Error("Market feed unavailable")

      const payload = (await response.json()) as MarketsApiResponse
      const liveBySymbol = new Map(payload.coins.map((coin) => [coin.symbol, coin]))

      setMarketTokens(tokens.map((fallback) => {
        const live = liveBySymbol.get(fallback.symbol)
        if (!live) return fallback

        return {
          ...fallback,
          name: live.name || fallback.name,
          price: live.currentPrice,
          priceLabel: formatPrice(live.currentPrice),
          change: live.priceChange,
          volume: live.volume / 1_000_000_000,
          volumeLabel: formatMarketValue(live.volume),
          marketCap: live.marketCap / 1_000_000_000,
          marketCapLabel: formatMarketValue(live.marketCap),
          chart: live.sparkline.length > 1 ? live.sparkline : fallback.chart,
        }
      }))

      setDataStatus(payload.source)
      setLastUpdated(payload.updatedAt)
    } catch {
      setDataStatus("error")
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadMarketData()
    const timer = window.setInterval(() => void loadMarketData(), 30_000)
    return () => window.clearInterval(timer)
  }, [loadMarketData])

  const visibleTokens = useMemo(() => {
    let result = [...marketTokens]

    if (productTab === "Favorites") result = result.filter((token) => favorites.includes(token.symbol))
    if (["Spot", "Futures", "AI"].includes(productTab)) result = result.filter((token) => token.tags.includes(productTab))
    if (productTab === "New listings") result = result.filter((token) => token.isNew)
    if (category !== "All") result = result.filter((token) => token.category === category || token.tags.includes(category))
    if (query.trim()) {
      const normalized = query.trim().toLowerCase()
      result = result.filter((token) => token.symbol.toLowerCase().includes(normalized) || token.name.toLowerCase().includes(normalized))
    }

    return result.sort((a, b) => {
      const difference = a[sortKey] - b[sortKey]
      return sortDirection === "asc" ? difference : -difference
    })
  }, [category, favorites, marketTokens, productTab, query, sortDirection, sortKey])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"))
      return
    }
    setSortKey(key)
    setSortDirection("desc")
  }

  function toggleFavorite(symbol: string) {
    setFavorites((current) => current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol])
  }

  const gainers = [...marketTokens].sort((a, b) => b.change - a.change).slice(0, 3)
  const volumeLeaders = [...marketTokens].sort((a, b) => b.volume - a.volume).slice(0, 3)
  const newest = marketTokens.filter((token) => token.isNew).concat(marketTokens.slice(6, 7)).slice(0, 3)
  const updatedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null
  const dataMessage = dataStatus === "live"
    ? `Live via CoinGecko${updatedTime ? ` · Updated ${updatedTime}` : ""}`
    : dataStatus === "loading"
      ? "Connecting to live market data"
      : dataStatus === "fallback"
        ? "Live provider delayed · Safe snapshot shown"
        : "Market feed unavailable · Last snapshot shown"

  return (
    <DashboardShell>
    <main className="min-h-screen overflow-hidden bg-[#07111F] text-white">
      <div className="flex min-h-9 items-center justify-center border-b border-white/8 bg-black px-5 text-center text-[10px] font-black uppercase tracking-[0.14em] text-[#FFEA93]">
        Markets move fast. CoinCrest helps you slow the decision down.
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111F]/94 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-[1380px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="CoinCrest home"><CoinCrestBrand inverted compact /></Link>

          <nav className="hidden items-center gap-9 text-[16px] font-bold tracking-[-0.01em] text-white/72 lg:flex">
            <Link href="/markets" className="!text-[#FFEA93]">Markets</Link>
            <Link href="/#platform" className="transition hover:text-white">Platform</Link>
            <Link href="/#ahna" className="transition hover:text-white">AHNA</Link>
            <Link href="/about" className="transition hover:text-white">About</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden px-3 py-2 text-[15px] font-bold tracking-[-0.01em] text-white/78 transition hover:text-white sm:block">Sign in</Link>
            <Link href="/register" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#FFEA93] px-4 text-[13px] font-black !text-black transition hover:-translate-y-0.5 hover:bg-white sm:px-5 sm:text-[15px]">
              Create account <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-white/8 bg-[#0B0E0C]">
        <div className="mx-auto max-w-[1380px] px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-8 overflow-x-auto py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {viewTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setView(tab)}
                className={`relative shrink-0 pb-1 text-[15px] font-black transition sm:text-[16px] ${view === tab ? "text-white" : "text-white/42 hover:text-white/76"}`}
              >
                {tab}
                {view === tab && <span className="absolute -bottom-5 left-0 h-[3px] w-full rounded-full bg-[#2F78B7]" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(141,179,85,0.12),transparent_34%),radial-gradient(circle_at_15%_65%,rgba(255,234,147,0.07),transparent_28%)]" />
        <div className="relative mx-auto max-w-[1380px] px-5 pb-10 pt-12 sm:px-8 lg:px-12 lg:pb-14">
          <div className="mb-10 grid gap-7 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFEA93]">
                <span className="h-2 w-2 rounded-full bg-[#2F78B7]" /> CoinCrest market overview
              </span>
              <h1 className="max-w-[900px] font-serif text-[clamp(4rem,6.8vw,7.6rem)] leading-[0.85] tracking-[-0.064em] text-[#FFF8E0]">
                See the market.<br /><span className="text-[#70C891]">Keep your context.</span>
              </h1>
            </div>
            <div className="lg:pb-2">
              <p className="max-w-[620px] text-[16px] leading-7 text-white/58 sm:text-[18px] sm:leading-8">
                Scan price, momentum, liquidity, and market size before opening a chart. Then move into AHNA when you need evidence—not another impulse.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] font-bold text-white/48">
                <span className="inline-flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${dataStatus === "live" ? "bg-[#5FBF83]" : "bg-[#F2C94C]"}`} /> {dataMessage}</span>
                <span>10 tracked assets</span>
                <span>24-hour view</span>
                <button
                  type="button"
                  onClick={() => void loadMarketData()}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-white/62 transition hover:border-[#2F78B7] hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {view !== "Token unlocks" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MarketSummaryCard title="Hot now" tokens={marketTokens.slice(0, 3)} accent="yellow" />
              <MarketSummaryCard title="New signals" tokens={newest} accent="blue" />
              <MarketSummaryCard title="Top gainers" tokens={gainers} accent="green" />
              <MarketSummaryCard title="Top volume" tokens={volumeLeaders} accent="yellow" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {unlocks.map((unlock) => (
                <article key={unlock.symbol} className="rounded-[22px] border border-white/10 bg-[#101310] p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#70C891]">Scheduled unlock</p>
                      <h2 className="mt-3 text-2xl font-black">{unlock.symbol} <span className="text-[14px] font-medium text-white/38">{unlock.name}</span></h2>
                    </div>
                    <span className="rounded-full bg-[#FFEA93] px-3 py-1.5 text-[11px] font-black text-black">{unlock.date}</span>
                  </div>
                  <div className="mt-7 grid grid-cols-2 gap-4 border-y border-white/8 py-5">
                    <span><small className="block text-white/36">Est. value</small><b className="mt-1 block text-lg">{unlock.value}</b></span>
                    <span><small className="block text-white/36">Supply impact</small><b className="mt-1 block text-lg">{unlock.supply}</b></span>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-[#5FBF83]" style={{ width: `${unlock.progress}%` }} /></div>
                  <p className="mt-3 text-[11px] text-white/36">Timeline is illustrative and not a live vesting feed.</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="market-table" className="mx-auto max-w-[1380px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex gap-7 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {productTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setProductTab(tab)}
                className={`relative shrink-0 pb-3 text-[14px] font-black transition ${productTab === tab ? "text-white" : "text-white/42 hover:text-white/76"}`}
              >
                {tab}
                {tab === "New listings" && <span className="absolute -top-3 right-0 rounded-full bg-[#2F78B7] px-1.5 py-0.5 text-[7px] uppercase text-white">New</span>}
                {productTab === tab && <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-[#FFEA93]" />}
              </button>
            ))}
          </div>

          <label className="flex min-h-12 w-full items-center gap-3 rounded-full border border-white/12 bg-white/[0.035] px-5 text-white transition focus-within:border-[#2F78B7] focus-within:ring-4 focus-within:ring-[#2F78B7]/10 xl:w-[320px]">
            <Search className="h-4 w-4 text-white/38" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search asset or symbol"
              className="w-full bg-transparent text-[13px] font-semibold text-white outline-none placeholder:text-white/30"
            />
          </label>
        </div>

        <div className="flex gap-2 overflow-x-auto py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setCategory(tab)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black transition ${category === tab ? "border-[#FFEA93] bg-[#FFEA93] text-black" : "border-white/10 bg-white/[0.025] text-white/50 hover:border-white/25 hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-[clamp(2.9rem,4.6vw,5rem)] leading-[0.94] tracking-[-0.054em] text-[#FFF8E0]">
              {view === "Trading data" ? "Markets by trading activity" : "Top assets by market capitalization"}
            </h2>
            <p className="mt-3 max-w-[800px] text-[13px] leading-6 text-white/40">
              A structured snapshot of price, 24-hour direction, volume, market size, and short-term movement.
            </p>
          </div>
          <p className="inline-flex items-center gap-2 text-[11px] font-bold text-white/44"><CircleHelp className="h-4 w-4" /> Live prices refresh every 30 seconds; unlock dates remain illustrative</p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0D100E] shadow-[0_30px_100px_rgba(0,0,0,0.3)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.025] text-left text-[10px] font-black uppercase tracking-[0.12em] text-white/42">
                  <th className="w-12 px-5 py-5"><span className="sr-only">Favorite</span></th>
                  <th className="px-3 py-5">Asset</th>
                  <th className="px-5 py-5 text-right"><SortButton label="Price" sortKey="price" activeSort={sortKey} onSort={handleSort} /></th>
                  <th className="px-5 py-5 text-right"><SortButton label="24h change" sortKey="change" activeSort={sortKey} onSort={handleSort} /></th>
                  <th className="px-5 py-5 text-right"><SortButton label="24h volume" sortKey="volume" activeSort={sortKey} onSort={handleSort} /></th>
                  <th className="px-5 py-5 text-right"><SortButton label="Market cap" sortKey="marketCap" activeSort={sortKey} onSort={handleSort} /></th>
                  <th className="px-5 py-5 text-center">24h chart</th>
                  <th className="px-5 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleTokens.map((token) => {
                  const isFavorite = favorites.includes(token.symbol)
                  return (
                    <tr key={token.symbol} className="group border-b border-white/[0.07] transition last:border-0 hover:bg-[#FFEA93]/[0.035]">
                      <td className="px-5 py-5">
                        <button type="button" onClick={() => toggleFavorite(token.symbol)} aria-label={`${isFavorite ? "Remove" : "Add"} ${token.name} ${isFavorite ? "from" : "to"} favorites`} className="text-white/24 transition hover:text-[#FFEA93]">
                          <Star className={`h-4 w-4 ${isFavorite ? "fill-[#FFEA93] text-[#FFEA93]" : ""}`} />
                        </button>
                      </td>
                      <td className="px-3 py-5">
                        <div className="flex items-center gap-3">
                          <TokenIcon token={token} size={38} />
                          <span>
                            <b className="text-[14px] text-white">{token.symbol}</b>
                            <small className="ml-2 text-[12px] text-white/36">{token.name}</small>
                            <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.12em] text-[#70C891]">{token.category}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right text-[14px] font-black tabular-nums text-white">{token.priceLabel}</td>
                      <td className="px-5 py-5 text-right text-[13px]"><Change value={token.change} /></td>
                      <td className="px-5 py-5 text-right text-[13px] font-bold tabular-nums text-white/72">{token.volumeLabel}</td>
                      <td className="px-5 py-5 text-right text-[13px] font-bold tabular-nums text-white/72">{token.marketCapLabel}</td>
                      <td className="px-5 py-5"><Sparkline values={token.chart} positive={token.change >= 0} className="mx-auto h-10 w-28" /></td>
                      <td className="px-5 py-5 text-right">
                        <Link href={`/login?next=${encodeURIComponent(`/intelligence?symbol=${token.symbol}`)}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/12 px-4 text-[11px] font-black !text-white transition hover:border-[#FFEA93] hover:bg-[#FFEA93] hover:!text-black">
                          Analyze <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {visibleTokens.length === 0 && (
            <div className="px-6 py-20 text-center">
              <Search className="mx-auto h-8 w-8 text-white/20" />
              <h3 className="mt-4 text-lg font-black">No matching assets</h3>
              <p className="mt-2 text-[13px] text-white/40">Try another name, symbol, or market category.</p>
              <button type="button" onClick={() => { setQuery(""); setCategory("All"); setProductTab("Cryptos") }} className="mt-5 rounded-full bg-[#FFEA93] px-5 py-2.5 text-[12px] font-black text-black">Reset filters</button>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-black/20 bg-[#A9CFAF] text-black">
        <div className="mx-auto grid max-w-[1380px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12 lg:py-16">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.16em]">From scan to explanation</span>
            <h2 className="mt-3 max-w-[900px] font-serif text-[clamp(3.3rem,5.6vw,5.9rem)] leading-[0.88] tracking-[-0.058em]">A price move is a signal—not a conclusion.</h2>
            <p className="mt-5 max-w-[700px] text-[15px] font-medium leading-7 text-black/66">Open any market in AHNA to inspect structure, news, sentiment, risk, and agent agreement before you rehearse a decision.</p>
          </div>
          <div>
            <Link href="/register" className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full bg-[#164F7D] px-7 text-[13px] font-black !text-white shadow-[0_12px_28px_rgba(22,79,125,0.2)] transition hover:-translate-y-0.5 hover:bg-[#103F65]">Start paper trading <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F4E7B2] text-black">
        <div className="mx-auto grid max-w-[1380px] gap-px border-x border-black/10 bg-black/10 sm:grid-cols-3">
          {[
            { icon: BarChart3, title: "Market structure", text: "Compare price, liquidity, capitalization, and trend without switching tools." },
            { icon: ShieldCheck, title: "Risk-aware context", text: "Move from market movement to portfolio impact before considering a position." },
            { icon: LineChart, title: "Explainable analysis", text: "Use AHNA to see what each specialist agent found and where evidence conflicts." },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="bg-[#FBF6DF] p-7 sm:p-9">
              <Icon className="h-6 w-6 text-[#2F78B7]" />
              <h3 className="mt-8 text-xl font-black">{title}</h3>
              <p className="mt-3 text-[14px] leading-6 text-black/58">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
    </DashboardShell>
  )
}
