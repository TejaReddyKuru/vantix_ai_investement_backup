"use client"

import { useMemo, useState, useEffect } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  History,
  Info,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  XCircle,
  Loader2,
} from "lucide-react"

import TradingHeader from "@/components/trading/TradingHeader"
import TradingChart from "@/components/trading/TradingChart"
import { useTradingMode } from "@/context/TradingModeContext"
import { useAuth } from "@/context/AuthContext"
import DashboardShell from "@/components/dashboard/DashboardShell"
import { apiClient } from "@/lib/client"

type OrderSide = "BUY" | "SELL"

type Order = {
  id: string
  side: OrderSide
  asset: string
  amount: string
  price: string
  status: "Filled" | "Pending"
  time: string
}

const initialOrders: Order[] = [
  {
    id: "ORD-1048",
    side: "BUY",
    asset: "BTC",
    amount: "0.025 BTC",
    price: "$118,420",
    status: "Filled",
    time: "12 min ago",
  },
  {
    id: "ORD-1047",
    side: "BUY",
    asset: "ETH",
    amount: "0.80 ETH",
    price: "$4,318",
    status: "Filled",
    time: "41 min ago",
  },
  {
    id: "ORD-1046",
    side: "SELL",
    asset: "SOL",
    amount: "12 SOL",
    price: "$188.40",
    status: "Filled",
    time: "2 hr ago",
  },
]

const positions = [
  {
    asset: "BTC",
    name: "Bitcoin",
    quantity: "0.125 BTC",
    value: "$14,802.50",
    pnl: "+$1,284.20",
    change: "+9.51%",
    positive: true,
  },
  {
    asset: "ETH",
    name: "Ethereum",
    quantity: "1.80 ETH",
    value: "$7,772.40",
    pnl: "+$614.80",
    change: "+8.59%",
    positive: true,
  },
  {
    asset: "SOL",
    name: "Solana",
    quantity: "24 SOL",
    value: "$4,521.60",
    pnl: "-$182.40",
    change: "-3.88%",
    positive: false,
  },
]

export default function PaperTradingPage() {
  const { isPaper, isLive } = useTradingMode()
  const { token } = useAuth()

  const [side, setSide] = useState<OrderSide>("BUY")
  const [asset, setAsset] = useState("BTC")
  const [amount, setAmount] = useState("")
  const [running, setRunning] = useState(true)

  const [assetsList, setAssetsList] = useState<any[]>([])
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null)
  const [positionsList, setPositionsList] = useState<any[]>([])
  const [ordersList, setOrdersList] = useState<any[]>([])

  const [isPlacing, setIsPlacing] = useState(false)
  const [banner, setBanner] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [bannerVisible, setBannerVisible] = useState(false)

  const showBanner = (message: string, type: "success" | "error") => {
    setBanner({ message, type })
    setTimeout(() => setBannerVisible(true), 50)
  }

  // Auto-dismiss banner after 4 seconds
  useEffect(() => {
    if (!banner) return
    const dismissId = setTimeout(() => {
      setBannerVisible(false)
      const removeId = setTimeout(() => setBanner(null), 300)
      return () => clearTimeout(removeId)
    }, 4000)
    return () => clearTimeout(dismissId)
  }, [banner])

  const [selectedAssetPrice, setSelectedAssetPrice] = useState<number>(118420)
  const [selectedAssetChange, setSelectedAssetChange] = useState<number>(0)
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET")
  const [limitPrice, setLimitPrice] = useState<string>("")

  // 1. Initial Load of Core Portfolios, Positions, Orders, and Asset mapping
  useEffect(() => {
    if (!token) return

    async function loadData() {
      try {
        const assetsRes = await apiClient.get("/api/v1/markets")
        setAssetsList(assetsRes.data)

        const accountRes = await apiClient.get("/api/v1/paper-trading/account")
        setAccountInfo(accountRes.data)

        const summaryRes = await apiClient.get("/api/v1/portfolio/summary")
        setPortfolioSummary(summaryRes.data)

        const positionsRes = await apiClient.get("/api/v1/paper-trading/positions")
        setPositionsList(positionsRes.data.items || [])

        const ordersRes = await apiClient.get("/api/v1/paper-trading/orders")
        setOrdersList(ordersRes.data.items || [])
      } catch (err) {
        console.error("Failed to load paper trading data", err)
      }
    }

    loadData()
  }, [token])

  // 2. Poll live ticker details (price and percent change) for selected asset
  useEffect(() => {
    if (!token || !asset || assetsList.length === 0) return

    const selectedAssetObj = assetsList.find(a => a.base_asset === asset || a.symbol === asset)
    if (!selectedAssetObj) return

    async function fetchTicker() {
      try {
        const res = await apiClient.get(`/api/v1/markets/${selectedAssetObj.symbol}/ticker`)
        setSelectedAssetPrice(res.data.price)
        setSelectedAssetChange(res.data.change_24h)
      } catch (err) {
        console.error("Failed to fetch ticker price", err)
      }
    }

    fetchTicker()
    const intervalId = setInterval(fetchTicker, 5000)
    return () => clearInterval(intervalId)
  }, [token, asset, assetsList])

  // 3. Keep limitPrice input preset synchronized with ticker price
  useEffect(() => {
    if (selectedAssetPrice) {
      setLimitPrice(selectedAssetPrice.toString())
    }
  }, [asset, selectedAssetPrice])

  async function placeOrder() {
    if (!isPaper) return
    if (!running) return
    if (!amount.trim()) return

    const selectedAssetObj = assetsList.find(a => a.base_asset === asset || a.symbol === asset)
    if (!selectedAssetObj) return

    const qty = parseFloat(amount)
    if (isNaN(qty) || qty <= 0) return

    const reqPrice = orderType === "MARKET" ? selectedAssetPrice : parseFloat(limitPrice)
    if (isNaN(reqPrice) || reqPrice <= 0) return

    setIsPlacing(true)
    try {
      await apiClient.post("/api/v1/paper-trading/orders", {
        asset_id: selectedAssetObj.id,
        side,
        order_type: orderType,
        quantity: qty,
        requested_price: reqPrice,
      })

      const [accountRes, summaryRes, positionsRes, ordersRes] = await Promise.all([
        apiClient.get("/api/v1/paper-trading/account"),
        apiClient.get("/api/v1/portfolio/summary"),
        apiClient.get("/api/v1/paper-trading/positions"),
        apiClient.get("/api/v1/paper-trading/orders")
      ])

      setAccountInfo(accountRes.data)
      setPortfolioSummary(summaryRes.data)
      setPositionsList(positionsRes.data.items || [])
      setOrdersList(ordersRes.data.items || [])
      setAmount("")
      showBanner(`Successfully placed simulated ${side} order!`, "success")
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to place simulated order"
      showBanner(errMsg, "error")
    } finally {
      setIsPlacing(false)
    }
  }

  async function resetSimulation() {
    try {
      await apiClient.post("/api/v1/paper-trading/reset")

      const [accountRes, summaryRes, positionsRes, ordersRes] = await Promise.all([
        apiClient.get("/api/v1/paper-trading/account"),
        apiClient.get("/api/v1/portfolio/summary"),
        apiClient.get("/api/v1/paper-trading/positions"),
        apiClient.get("/api/v1/paper-trading/orders")
      ])

      setAccountInfo(accountRes.data)
      setPortfolioSummary(summaryRes.data)
      setPositionsList(positionsRes.data.items || [])
      setOrdersList(ordersRes.data.items || [])
      setAmount("")
      setSide("BUY")
      setAsset("BTC")
      showBanner("Simulated trading account reset successfully.", "success")
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to reset simulation"
      showBanner(errMsg, "error")
    }
  }

  return (
    <DashboardShell>
      {/* Premium Banner Alert Notification */}
      {banner && (
        <div
          role="alert"
          className={[
            "fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-[0_20px_40px_rgba(23,23,23,0.12)] bg-white/95 backdrop-blur-md transition-all duration-500 ease-out transform",
            bannerVisible ? "top-6 opacity-100 scale-100" : "-top-16 opacity-0 scale-95",
            banner.type === "success"
              ? "border-[#D1E8D5] text-[#18794E]"
              : "border-[#F5ECE8] text-[#9A5A45]",
          ].join(" ")}
        >
          {banner.type === "success" ? (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EAF4EC] text-[#18794E]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#F5ECE8] text-[#9A5A45]">
              <XCircle className="h-4 w-4" />
            </div>
          )}
          <span className="text-xs font-extrabold tracking-tight">{banner.message}</span>
        </div>
      )}

      {/* Trading Header */}
      <TradingHeader />

      <div className="mt-4">
        {/* Live mode warning */}
        {isLive && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>

            <div>
              <p className="text-xs font-extrabold text-red-800">
                Live Trading Mode Enabled
              </p>

              <p className="mt-1 text-[10px] leading-5 text-red-700">
                This page is the Paper Trading workstation. Simulated
                orders are disabled while Live Trading mode is selected.
                Switch back to Paper Trading from the Trading Mode
                selector above to continue simulation.
              </p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <section className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8A897F]">
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    isPaper
                      ? "animate-ping bg-[#18794E]/40"
                      : "bg-red-300"
                  }`}
                />

                <span
                  className={`relative h-1.5 w-1.5 rounded-full ${
                    isPaper
                      ? "bg-[#18794E]"
                      : "bg-red-600"
                  }`}
                />
              </span>

              {isPaper
                ? "Simulation environment"
                : "Live mode — simulation locked"}
            </div>

            <h1 className="text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">
              Paper Trading
            </h1>

            <p className="mt-2 max-w-[680px] text-sm leading-6 text-[#77776F]">
              Practice strategies with simulated capital before putting
              real money at risk. Track positions, orders and performance
              in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-[#D7DDD7] bg-white px-3 py-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isPaper && running
                    ? "animate-pulse bg-[#18794E]"
                    : "bg-[#A09F96]"
                }`}
              />

              <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#4C514D]">
                {isLive
                  ? "Live mode selected"
                  : running
                    ? "Market simulation live"
                    : "Simulation paused"}
              </span>
            </div>

            <button
              type="button"
              disabled={isLive}
              onClick={() => setRunning((value) => !value)}
              className={`flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(15,45,31,0.14)] transition ${
                isLive
                  ? "cursor-not-allowed bg-[#A09F96]"
                  : "bg-[#0F2D1F] hover:-translate-y-0.5 hover:bg-[#17452F]"
              }`}
            >
              {running ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}

              {running ? "Pause" : "Resume"}
            </button>
          </div>
        </section>

        {/* Account Stats */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Paper balance",
              value: accountInfo ? `$${parseFloat(accountInfo.current_cash).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$100,000.00",
              change: "Available",
              icon: WalletCards,
            },
            {
              label: "Portfolio value",
              value: portfolioSummary && portfolioSummary.total_equity !== null ? `$${parseFloat(portfolioSummary.total_equity).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$100,000.00",
              change: portfolioSummary && portfolioSummary.total_equity && accountInfo ? `${((parseFloat(portfolioSummary.total_equity) - parseFloat(accountInfo.initial_balance)) / parseFloat(accountInfo.initial_balance) * 100).toFixed(2)}%` : "0.00%",
              icon: TrendingUp,
            },
            {
              label: "Today's P&L",
              value: portfolioSummary && portfolioSummary.unrealized_pnl !== null ? `${parseFloat(portfolioSummary.unrealized_pnl) >= 0 ? "+" : ""}$${parseFloat(portfolioSummary.unrealized_pnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
              change: portfolioSummary && portfolioSummary.unrealized_pnl !== null && portfolioSummary.total_equity ? `${(parseFloat(portfolioSummary.unrealized_pnl) / parseFloat(portfolioSummary.total_equity) * 100).toFixed(2)}%` : "0.00%",
              icon: BarChart3,
            },
            {
              label: "Risk status",
              value: "Healthy",
              change: portfolioSummary && portfolioSummary.drawdown !== null ? `${parseFloat(portfolioSummary.drawdown).toFixed(2)}% drawdown` : "0.00% drawdown",
              icon: ShieldCheck,
            },
          ].map((stat) => {
            const Icon = stat.icon

            return (
              <article
                key={stat.label}
                className="relative overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(23,23,23,0.06)]"
              >
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#E8F2EA] blur-2xl" />

                <div className="relative flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2EA] text-[#0F2D1F]">
                    <Icon size={17} />
                  </div>

                  <span className="rounded-full bg-[#EAF4EC] px-2 py-1 text-[8px] font-extrabold text-[#18794E]">
                    {stat.change}
                  </span>
                </div>

                <div className="relative mt-5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#9A998F]">
                  {stat.label}
                </div>

                <div className="relative mt-1 text-xl font-extrabold tracking-[-0.03em]">
                  {stat.value}
                </div>
              </article>
            )
          })}
        </section>

        {/* Main Workspace */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          {/* Left */}
          <div className="space-y-5">
            {/* Interactive Candlestick Market Chart */}
            <TradingChart
              assetSymbol={asset}
              assetName={
                assetsList.find(a => a.base_asset === asset || a.symbol === asset)?.name ||
                (asset === "BTC"
                  ? "Bitcoin"
                  : asset === "ETH"
                    ? "Ethereum"
                    : "Solana")
              }
              height={380}
            />

            {/* Positions */}
            <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold">
                    Open positions
                  </h2>

                  <p className="mt-1 text-[10px] text-[#9A998F]">
                    Current simulated holdings
                  </p>
                </div>

                <span className="rounded-full bg-[#F5F5EF] px-2 py-1 text-[8px] font-extrabold text-[#8A897F]">
                  {`${positionsList.length} positions`}
                </span>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="border-b border-[#ECECE4] text-left">
                      {[
                        "Asset",
                        "Quantity",
                        "Value",
                        "P&L",
                        "Return",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="pb-3 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#9A998F]"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F0F0EA]">
                    {positionsList.length > 0 ? (
                      positionsList.map((position) => {
                        const qty = parseFloat(position.quantity)
                        const avg = parseFloat(position.average_entry_price)
                        const pnl = parseFloat(position.unrealized_pnl)
                        const totalVal = qty * avg + pnl
                        const returnPct = avg > 0 ? (pnl / (qty * avg)) * 100 : 0
                        const isPositive = pnl >= 0

                        return (
                          <tr key={position.id}>
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1F1E9] text-[9px] font-extrabold text-[#34342F]">
                                  {position.asset_symbol ? position.asset_symbol.slice(0, 2) : "AS"}
                                </div>

                                <div>
                                  <div className="text-xs font-extrabold">
                                    {position.asset_symbol || "Asset"}
                                  </div>

                                  <div className="mt-0.5 text-[9px] text-[#9A998F]">
                                    {position.asset_name || "Cryptocurrency"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 text-xs font-semibold text-[#55554F]">
                              {qty.toFixed(4)}
                            </td>

                            <td className="py-4 text-xs font-extrabold">
                              {`$${totalVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </td>

                            <td
                              className={`py-4 text-xs font-extrabold ${
                                isPositive
                                  ? "text-[#18794E]"
                                  : "text-[#9A5A45]"
                              }`}
                            >
                              {`${isPositive ? "+" : ""}$${pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </td>

                            <td className="py-4">
                              <span
                                className={`rounded-full px-2 py-1 text-[8px] font-extrabold ${
                                  isPositive
                                    ? "bg-[#EAF4EC] text-[#18794E]"
                                    : "bg-[#F5ECE8] text-[#9A5A45]"
                                }`}
                              >
                                {`${isPositive ? "+" : ""}${returnPct.toFixed(2)}%`}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#9A998F]">
                          No open positions. Use the order form to start trading.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Order Panel */}
          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#D8E2D9] bg-white p-5 shadow-[0_10px_35px_rgba(23,23,23,0.04)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold">
                      Place simulated order
                    </h2>

                    <span className="rounded-full bg-[#EAF4EC] px-2 py-0.5 text-[7px] font-extrabold uppercase tracking-wide text-[#18794E]">
                      Paper
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-[#9A998F]">
                    No real funds are used.
                  </p>
                </div>

                <div className="rounded-lg bg-[#F1F1E9] p-2 text-[#77776F]">
                  <Info size={14} />
                </div>
              </div>

              {/* Mode lock */}
              {isLive && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2">
                    <XCircle size={14} className="text-red-600" />

                    <span className="text-[9px] font-extrabold text-red-700">
                      Paper orders are disabled
                    </span>
                  </div>

                  <p className="mt-1 text-[8px] leading-4 text-red-600">
                    Switch Trading Mode to Paper Trading to place
                    simulated orders.
                  </p>
                </div>
              )}

              {/* Buy / Sell */}
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-[#F5F5EF] p-1">
                {(["BUY", "SELL"] as OrderSide[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={isLive}
                    onClick={() => setSide(item)}
                    className={[
                      "rounded-lg py-2.5 text-[10px] font-extrabold transition",
                      isLive
                        ? "cursor-not-allowed text-[#B5B4AB]"
                        : side === item
                          ? item === "BUY"
                            ? "bg-[#0F2D1F] text-white shadow-sm"
                            : "bg-[#8B5140] text-white shadow-sm"
                          : "text-[#8A897F] hover:text-[#34342F]",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Order Type Toggle (MARKET/LIMIT) */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#F5F5EF] p-1">
                {(["MARKET", "LIMIT"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={isLive}
                    onClick={() => setOrderType(type)}
                    className={[
                      "rounded-lg py-2 text-[9px] font-extrabold transition",
                      isLive
                        ? "cursor-not-allowed text-[#B5B4AB]"
                        : orderType === type
                          ? "bg-[#0F2D1F] text-white shadow-sm"
                          : "text-[#8A897F] hover:text-[#34342F]",
                    ].join(" ")}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Asset Selector */}
              <label className="mt-4 block">
                <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8A897F]">
                  Asset
                </span>

                <div className="relative">
                  <select
                    value={asset}
                    disabled={isLive}
                    onChange={(event) =>
                      setAsset(event.target.value)
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-[#DCDDD4] bg-[#FAFAF7] px-3 pr-10 text-xs font-extrabold outline-none transition focus:border-[#0F2D1F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {assetsList.length > 0 ? (
                      assetsList.map((a) => (
                        <option key={a.id} value={a.base_asset}>{a.base_asset} ({a.name})</option>
                      ))
                    ) : (
                      <>
                        <option>BTC</option>
                        <option>ETH</option>
                        <option>SOL</option>
                      </>
                    )}
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#77776F]"
                  />
                </div>
              </label>

              {/* Limit Price Input if orderType is LIMIT */}
              {orderType === "LIMIT" && (
                <label className="mt-4 block">
                  <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8A897F]">
                    Limit Price (USDT)
                  </span>

                  <div className="flex h-11 items-center rounded-xl border border-[#DCDDD4] bg-[#FAFAF7] px-3 focus-within:border-[#0F2D1F]">
                    <input
                      value={limitPrice}
                      disabled={isLive}
                      onChange={(event) =>
                        setLimitPrice(event.target.value)
                      }
                      placeholder="0.00"
                      inputMode="decimal"
                      className="min-w-0 flex-1 bg-transparent text-sm font-extrabold outline-none placeholder:text-[#B3B2A8] disabled:cursor-not-allowed"
                    />
                  </div>
                </label>
              )}

              {/* Amount */}
              <label className="mt-4 block">
                <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8A897F]">
                  Quantity
                </span>

                <div className="flex h-11 items-center rounded-xl border border-[#DCDDD4] bg-[#FAFAF7] px-3 focus-within:border-[#0F2D1F]">
                  <input
                    value={amount}
                    disabled={isLive}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    placeholder="0.00"
                    inputMode="decimal"
                    className="min-w-0 flex-1 bg-transparent text-sm font-extrabold outline-none placeholder:text-[#B3B2A8] disabled:cursor-not-allowed"
                  />

                  <span className="text-[10px] font-extrabold text-[#77776F]">
                    {asset}
                  </span>
                </div>
              </label>

              {/* Order Summary */}
              <div className="mt-4 rounded-xl border border-[#E7E8E0] bg-[#FAFAF7] p-3.5">
                <div className="flex justify-between">
                  <span className="text-[9px] font-semibold text-[#8A897F]">
                    Estimated price
                  </span>

                  <span className="text-[10px] font-extrabold">
                    {`$${selectedAssetPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>

                <div className="mt-2 flex justify-between">
                  <span className="text-[9px] font-semibold text-[#8A897F]">
                    Trading fee
                  </span>

                  <span className="text-[10px] font-extrabold">
                    0.10%
                  </span>
                </div>
              </div>

              {/* Place Order */}
              <button
                type="button"
                disabled={isLive || !running || !amount.trim() || isPlacing}
                onClick={placeOrder}
                className={[
                  "mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(15,45,31,0.14)] transition-all duration-200 active:scale-95 active:translate-y-0",
                  isLive || !running || !amount.trim() || isPlacing
                    ? "cursor-not-allowed bg-[#A09F96] shadow-none opacity-80"
                    : side === "BUY"
                      ? "bg-[#0F2D1F] hover:-translate-y-0.5 hover:bg-[#17452F] hover:shadow-[0_12px_24px_rgba(15,45,31,0.22)]"
                      : "bg-[#8B5140] hover:-translate-y-0.5 hover:bg-[#754333] hover:shadow-[0_12px_24px_rgba(139,81,64,0.22)]",
                ].join(" ")}
              >
                {isPlacing ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : side === "BUY" ? (
                  <ArrowUpRight size={15} className="animate-pulse" />
                ) : (
                  <ArrowDownRight size={15} className="animate-pulse" />
                )}

                {isLive
                  ? "Paper Trading Disabled"
                  : !running
                    ? "Simulation Paused"
                    : isPlacing
                      ? "Executing simulated order..."
                      : `Place ${side} order`}
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[8px] font-semibold text-[#9A998F]">
                <ShieldCheck size={11} />
                Protected by paper trading risk controls
              </div>
            </section>

            {/* Account Controls */}
            <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F2EA] text-[#0F2D1F]">
                  <WalletCards size={15} />
                </div>

                <div>
                  <h2 className="text-xs font-extrabold">
                    Simulation account
                  </h2>

                  <p className="mt-0.5 text-[9px] text-[#9A998F]">
                    Standard paper account
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-[#8A897F]">
                    Starting capital
                  </span>

                  <span className="text-[10px] font-extrabold">
                    {accountInfo ? `$${parseFloat(accountInfo.initial_balance).toLocaleString("en-US")}` : "$100,000"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-[#8A897F]">
                    Available cash
                  </span>

                  <span className="text-[10px] font-extrabold">
                    {accountInfo ? `$${parseFloat(accountInfo.current_cash).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$100,000.00"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-[#8A897F]">
                    Invested value
                  </span>

                  <span className="text-[10px] font-extrabold">
                    {portfolioSummary ? `$${parseFloat(portfolioSummary.invested_value).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetSimulation}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E0E1D9] py-2.5 text-[9px] font-extrabold text-[#55554F] transition hover:bg-[#FAFAF7] hover:text-[#0F2D1F]"
              >
                <RotateCcw size={12} />
                Reset simulation
              </button>
            </section>
          </aside>
        </div>

        {/* Order History */}
        <section className="mt-5 rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <History
                  size={15}
                  className="text-[#0F2D1F]"
                />

                <h2 className="text-sm font-extrabold">
                  Order history
                </h2>
              </div>

              <p className="mt-1 text-[10px] text-[#9A998F]">
                Recent simulated trades
              </p>
            </div>

            <span className="flex items-center gap-1.5 rounded-full bg-[#F5F5EF] px-2 py-1 text-[8px] font-bold text-[#8A897F]">
              <Clock3 size={10} />
              {`${ordersList.length} orders`}
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[#ECECE4] text-left">
                  {[
                    "Order",
                    "Side",
                    "Asset",
                    "Quantity",
                    "Price",
                    "Status",
                    "Time",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="pb-3 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#9A998F]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0F0EA]">
                {ordersList.length > 0 ? (
                  ordersList.map((order) => {
                    if (!order) return null
                    const statusVal = order.status
                      ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                      : "Pending"
                    const orderId = order.id ? order.id.slice(0, 8).toUpperCase() : "ORD"
                    const orderQty = order.quantity ? parseFloat(order.quantity).toFixed(4) : "0.0000"
                    const orderPrice = order.requested_price ? parseFloat(order.requested_price).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"
                    
                    let orderTime = "Just now"
                    if (order.created_at) {
                      try {
                        const d = new Date(order.created_at)
                        if (!isNaN(d.getTime())) {
                          orderTime = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                        }
                      } catch (e) {
                        console.error("Invalid order date", e)
                      }
                    }

                    return (
                      <tr key={order.id || Math.random().toString()}>
                        <td className="py-4 text-[10px] font-extrabold text-[#34342F]">
                          {orderId}
                        </td>

                        <td className="py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-extrabold ${
                              order.side === "BUY"
                                ? "bg-[#EAF4EC] text-[#18794E]"
                                : "bg-[#F5ECE8] text-[#9A5A45]"
                            }`}
                          >
                            {order.side === "BUY" ? (
                              <ArrowUpRight size={10} />
                            ) : (
                              <ArrowDownRight size={10} />
                            )}

                            {order.side || "BUY"}
                          </span>
                        </td>

                        <td className="py-4 text-xs font-extrabold">
                          {order.asset_symbol || "Asset"}
                        </td>

                        <td className="py-4 text-[10px] font-semibold text-[#55554F]">
                          {orderQty}
                        </td>

                        <td className="py-4 text-[10px] font-extrabold">
                          {`$${orderPrice}`}
                        </td>

                        <td className="py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-extrabold ${
                              order.status === "filled"
                                ? "bg-[#EAF4EC] text-[#18794E]"
                                : order.status === "cancelled"
                                  ? "bg-gray-100 text-gray-500"
                                  : "bg-[#F5F1E4] text-[#8A7445]"
                            }`}
                          >
                            {order.status === "filled" ? (
                              <CheckCircle2 size={10} />
                            ) : (
                              <Clock3 size={10} />
                            )}

                            {statusVal}
                          </span>
                        </td>

                        <td className="py-4 text-[9px] font-semibold text-[#9A998F]">
                          {orderTime}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#9A998F]">
                      No recent orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-center gap-2 pb-2 text-[9px] font-semibold text-[#A09F96]">
          <XCircle size={11} />

          Paper trading uses simulated funds. No real orders are
          executed.
        </div>
      </div>
    </DashboardShell>
  )
}