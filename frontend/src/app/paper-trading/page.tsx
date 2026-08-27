"use client"

import { useMemo, useState } from "react"
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
} from "lucide-react"

import TradingHeader from "@/components/trading/TradingHeader"
import TradingChart from "@/components/trading/TradingChart"
import { useTradingMode } from "@/context/TradingModeContext"

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

  const [side, setSide] = useState<OrderSide>("BUY")
  const [asset, setAsset] = useState("BTC")
  const [amount, setAmount] = useState("")
  const [orders, setOrders] = useState(initialOrders)
  const [running, setRunning] = useState(true)

  const estimatedPrice =
    asset === "BTC"
      ? "$118,420"
      : asset === "ETH"
        ? "$4,318"
        : "$188.40"

  function placeOrder() {
    if (!isPaper) return
    if (!running) return
    if (!amount.trim()) return

    const newOrder: Order = {
      id: `ORD-${1050 + orders.length}`,
      side,
      asset,
      amount: `${amount} ${asset}`,
      price: estimatedPrice,
      status: "Pending",
      time: "Just now",
    }

    setOrders((current) => [newOrder, ...current])
    setAmount("")
  }

  function resetSimulation() {
    setOrders(initialOrders)
    setAmount("")
    setSide("BUY")
    setAsset("BTC")
    setRunning(true)
  }

  return (
    <div className="min-h-full bg-[#F7F6E8] text-[#171717]">
      {/* Trading Header */}
      <TradingHeader />

      <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
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
              value: "$100,000.00",
              change: "Available",
              icon: WalletCards,
            },
            {
              label: "Portfolio value",
              value: "$102,418.60",
              change: "+2.42%",
              icon: TrendingUp,
            },
            {
              label: "Today's P&L",
              value: "+$684.20",
              change: "+0.67%",
              icon: BarChart3,
            },
            {
              label: "Risk status",
              value: "Healthy",
              change: "34% exposure",
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
                asset === "BTC"
                  ? "Bitcoin"
                  : asset === "ETH"
                    ? "Ethereum"
                    : "Solana"
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
                  3 positions
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
                    {positions.map((position) => (
                      <tr key={position.asset}>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1F1E9] text-[9px] font-extrabold text-[#34342F]">
                              {position.asset.slice(0, 2)}
                            </div>

                            <div>
                              <div className="text-xs font-extrabold">
                                {position.asset}
                              </div>

                              <div className="mt-0.5 text-[9px] text-[#9A998F]">
                                {position.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 text-xs font-semibold text-[#55554F]">
                          {position.quantity}
                        </td>

                        <td className="py-4 text-xs font-extrabold">
                          {position.value}
                        </td>

                        <td
                          className={`py-4 text-xs font-extrabold ${
                            position.positive
                              ? "text-[#18794E]"
                              : "text-[#9A5A45]"
                          }`}
                        >
                          {position.pnl}
                        </td>

                        <td className="py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-[8px] font-extrabold ${
                              position.positive
                                ? "bg-[#EAF4EC] text-[#18794E]"
                                : "bg-[#F5ECE8] text-[#9A5A45]"
                            }`}
                          >
                            {position.change}
                          </span>
                        </td>
                      </tr>
                    ))}
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

              {/* Asset */}
              <label className="mt-5 block">
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
                    <option>BTC</option>
                    <option>ETH</option>
                    <option>SOL</option>
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#77776F]"
                  />
                </div>
              </label>

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
                    {estimatedPrice}
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
                disabled={isLive || !running || !amount.trim()}
                onClick={placeOrder}
                className={[
                  "mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(15,45,31,0.14)] transition",
                  isLive || !running || !amount.trim()
                    ? "cursor-not-allowed bg-[#A09F96] shadow-none"
                    : side === "BUY"
                      ? "bg-[#0F2D1F] hover:-translate-y-0.5 hover:bg-[#17452F]"
                      : "bg-[#8B5140] hover:-translate-y-0.5 hover:bg-[#754333]",
                ].join(" ")}
              >
                {side === "BUY" ? (
                  <ArrowUpRight size={15} />
                ) : (
                  <ArrowDownRight size={15} />
                )}

                {isLive
                  ? "Paper Trading Disabled"
                  : !running
                    ? "Simulation Paused"
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
                    $100,000
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-[#8A897F]">
                    Available cash
                  </span>

                  <span className="text-[10px] font-extrabold">
                    $72,903.50
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-[#8A897F]">
                    Used margin
                  </span>

                  <span className="text-[10px] font-extrabold">
                    $27,096.50
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
              {orders.length} orders
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
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-4 text-[10px] font-extrabold text-[#34342F]">
                      {order.id}
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

                        {order.side}
                      </span>
                    </td>

                    <td className="py-4 text-xs font-extrabold">
                      {order.asset}
                    </td>

                    <td className="py-4 text-[10px] font-semibold text-[#55554F]">
                      {order.amount}
                    </td>

                    <td className="py-4 text-[10px] font-extrabold">
                      {order.price}
                    </td>

                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-extrabold ${
                          order.status === "Filled"
                            ? "bg-[#EAF4EC] text-[#18794E]"
                            : "bg-[#F5F1E4] text-[#8A7445]"
                        }`}
                      >
                        {order.status === "Filled" ? (
                          <CheckCircle2 size={10} />
                        ) : (
                          <Clock3 size={10} />
                        )}

                        {order.status}
                      </span>
                    </td>

                    <td className="py-4 text-[9px] font-semibold text-[#9A998F]">
                      {order.time}
                    </td>
                  </tr>
                ))}
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
      </main>
    </div>
  )
}