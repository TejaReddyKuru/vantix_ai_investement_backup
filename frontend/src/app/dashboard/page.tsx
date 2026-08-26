"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  CircleDollarSign,
  Maximize2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react"

import DashboardShell from "../../components/dashboard/DashboardShell"

const stats = [
  {
    label: "Total portfolio",
    value: "$124,580.42",
    change: "+8.42%",
    icon: Wallet,
  },
  {
    label: "Today's P/L",
    value: "+$2,184.72",
    change: "+1.78%",
    icon: TrendingUp,
  },
  {
    label: "Available balance",
    value: "$38,420.16",
    change: "30.8% reserve",
    icon: CircleDollarSign,
  },
  {
    label: "Win rate",
    value: "68.4%",
    change: "+4.2%",
    icon: BarChart3,
  },
]

const markets = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: "$117,842.00",
    change: "+2.41%",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: "$4,321.48",
    change: "+1.87%",
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: "$192.84",
    change: "+3.14%",
  },
  {
    symbol: "BNB",
    name: "BNB",
    price: "$846.21",
    change: "+0.92%",
  },
]

const chartValues: Record<string, number[]> = {
  "1D": [42, 45, 43, 48, 47, 52, 50, 56, 54, 61, 59, 66, 64, 71],
  "1W": [34, 39, 36, 44, 42, 51, 48, 58, 55, 63, 61, 70, 66, 76],
  "1M": [30, 35, 33, 41, 39, 48, 45, 55, 52, 62, 59, 69, 66, 78, 74, 86],
  "3M": [24, 29, 27, 34, 32, 41, 39, 49, 46, 57, 54, 63, 61, 72, 69, 82],
  "1Y": [18, 23, 21, 29, 27, 36, 34, 43, 41, 51, 49, 60, 57, 68, 65, 79],
}

function buildChartPath(values: number[]) {
  const width = 900
  const height = 260
  const paddingX = 12
  const paddingY = 18

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  return values
    .map((value, index) => {
      const x =
        paddingX +
        (index / (values.length - 1)) * (width - paddingX * 2)

      const y =
        height -
        paddingY -
        ((value - min) / range) * (height - paddingY * 2)

      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")
}

function buildAreaPath(values: number[]) {
  const line = buildChartPath(values)
  return `${line} L 888 260 L 12 260 Z`
}

export default function Dashboard() {
  const [period, setPeriod] = useState("1M")

  const values = chartValues[period]

  const chartPath = useMemo(() => buildChartPath(values), [values])
  const areaPath = useMemo(() => buildAreaPath(values), [values])

  return (
    <DashboardShell>
      {/* Page heading */}
      <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8A897F]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#18794E]/40" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-[#18794E]" />
            </span>
            Portfolio overview
          </div>

          <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#171717] sm:text-4xl">
            Good morning, Vish.
          </h1>

          <p className="mt-2 max-w-[650px] text-sm leading-6 text-[#77776F]">
            Your portfolio is performing well. Here&apos;s what&apos;s happening
            across your assets and the crypto market today.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-friday"))}
            className="group flex items-center gap-2 rounded-xl border border-[#DDE3DD] bg-white px-4 py-2.5 text-xs font-bold text-[#34342F] shadow-[0_5px_20px_rgba(23,23,23,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BFD3C5] hover:text-[#0F2D1F] hover:shadow-[0_10px_25px_rgba(15,45,31,0.08)]"
          >
            <Sparkles size={15} className="transition-transform duration-200 group-hover:rotate-12" />
            Ask Friday
          </button>

          <Link
            href="/dashboard"
            className="group flex items-center gap-2 rounded-xl bg-[#0F2D1F] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(15,45,31,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#17452F]"
          >
            <Zap size={15} />
            Open terminal
            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Portfolio metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <article
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D1DCD3] hover:shadow-[0_18px_40px_rgba(23,23,23,0.07)]"
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#E8F2EA] opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2EA] text-[#0F2D1F] transition-transform duration-300 group-hover:scale-105">
                  <Icon size={17} />
                </div>

                <span className="rounded-full bg-[#EAF4EC] px-2.5 py-1 text-[9px] font-extrabold tabular-nums text-[#18794E]">
                  {stat.change}
                </span>
              </div>

              <div className="relative mt-5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#9A998F]">
                {stat.label}
              </div>

              <div className="relative mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#171717]">
                {stat.value}
              </div>
            </article>
          )
        })}
      </section>

      {/* Main content */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          {/* Performance */}
          <section className="overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-[#171717]">
                    Portfolio performance
                  </h2>

                  <span className="rounded-full bg-[#EAF4EC] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-[#18794E]">
                    +18.72%
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-[#8A897F]">
                  Portfolio value over the selected period
                </p>
              </div>

              <div className="flex rounded-lg border border-[#E2E1D5] bg-[#FAFAF7] p-1">
                {Object.keys(chartValues).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPeriod(item)}
                    className={[
                      "rounded-md px-2.5 py-1.5 text-[9px] font-extrabold transition-all duration-200",
                      period === item
                        ? "bg-white text-[#0F2D1F] shadow-sm"
                        : "text-[#9A998F] hover:text-[#34342F]",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative h-[275px] overflow-hidden bg-[#FAFAF7]">
              <div className="absolute inset-0 flex flex-col justify-between px-5 py-5">
                {[0, 1, 2, 3, 4].map((line) => (
                  <div
                    key={line}
                    className="border-t border-dashed border-[#E4E3D9]"
                  />
                ))}
              </div>

              <svg
                viewBox="0 0 900 260"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <defs>
                  <linearGradient
                    id="portfolioFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#0F2D1F"
                      stopOpacity="0.18"
                    />
                    <stop
                      offset="100%"
                      stopColor="#0F2D1F"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path d={areaPath} fill="url(#portfolioFill)" />

                <path
                  d={chartPath}
                  fill="none"
                  stroke="#0F2D1F"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[8px] font-semibold text-[#AAA99F]">
                <span>JUL 18</span>
                <span>JUL 25</span>
                <span>AUG 01</span>
                <span>AUG 08</span>
                <span>TODAY</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-5 sm:p-6">
              {[
                ["Return", "+18.72%", "text-[#18794E]"],
                ["Max drawdown", "-4.82%", "text-[#34342F]"],
                ["Sharpe", "1.84", "text-[#34342F]"],
              ].map(([label, value, valueClass]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#ECECE4] bg-[#FAFAF7] p-3"
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#9A998F]">
                    {label}
                  </div>

                  <div className={`mt-1 text-sm font-extrabold ${valueClass}`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Intelligence cards */}
          <div className="grid gap-5 md:grid-cols-2">
            <section className="group relative overflow-hidden rounded-2xl border border-[#DCE7DE] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(23,23,23,0.06)]">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#E8F2EA] blur-3xl" />

              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2D1F] text-white shadow-[0_8px_20px_rgba(15,45,31,0.18)]">
                    <BrainCircuit size={18} />
                  </div>

                  <div>
                    <h2 className="text-sm font-extrabold text-[#171717]">
                      AI market insight
                    </h2>

                    <p className="mt-0.5 text-[10px] text-[#9A998F]">
                      Friday&apos;s latest analysis
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-[#EAF4EC] px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-[#18794E]">
                  87 score
                </span>
              </div>

              <div className="relative mt-5 rounded-xl border border-[#EDF0EA] bg-[#FAFAF7] p-3.5">
                <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#18794E]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
                  Constructive momentum
                </div>

                <p className="mt-2 text-xs leading-5 text-[#62635C]">
                  BTC continues to lead large-cap assets while momentum remains
                  constructive. Volatility is elevated around key resistance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-friday"))}
                className="group relative mt-4 flex items-center gap-1.5 text-xs font-extrabold text-[#0F2D1F]"
              >
                Open full analysis
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </button>
            </section>

            <section className="relative overflow-hidden rounded-2xl border border-[#D3E3D7] bg-[#E8F2EA] p-5">
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/60 blur-3xl" />

              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F2D1F] shadow-sm">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-extrabold text-[#171717]">
                    Risk overview
                  </h2>

                  <p className="mt-0.5 text-[10px] text-[#6D8274]">
                    Portfolio risk posture
                  </p>
                </div>
              </div>

              <div className="relative mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5F7166]">
                  Risk exposure
                </span>

                <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold text-[#18794E] shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
                  Healthy
                </span>
              </div>

              <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                <div className="h-full w-[34%] rounded-full bg-[#0F2D1F]" />
              </div>

              <div className="relative mt-2 flex justify-between text-[9px] font-semibold text-[#718178]">
                <span>34% used</span>
                <span>20% target</span>
              </div>

              <div className="relative mt-5 flex items-center justify-between border-t border-[#CFE0D3] pt-4">
                <span className="text-[10px] font-semibold text-[#718178]">
                  Portfolio drawdown
                </span>

                <span className="text-xs font-extrabold text-[#0F2D1F]">
                  -2.14%
                </span>
              </div>
            </section>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Market watch */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#171717]">
                  Market watch
                </h2>

                <p className="mt-1 text-[10px] text-[#9A998F]">
                  Leading crypto assets
                </p>
              </div>

              <span className="flex items-center gap-1.5 rounded-full bg-[#EAF4EC] px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-[#18794E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
                Streaming
              </span>
            </div>

            <div className="mt-4 divide-y divide-[#F0F0EA]">
              {markets.map((market) => (
                <div
                  key={market.symbol}
                  className="group flex items-center justify-between rounded-xl px-2 py-3 transition-colors hover:bg-[#FAFAF7]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1F1E9] text-[9px] font-extrabold text-[#34342F] transition-colors group-hover:bg-[#E8F2EA] group-hover:text-[#0F2D1F]">
                      {market.symbol.slice(0, 2)}
                    </div>

                    <div>
                      <div className="text-xs font-extrabold text-[#34342F]">
                        {market.symbol}
                      </div>

                      <div className="mt-0.5 text-[9px] text-[#9A998F]">
                        {market.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-extrabold tabular-nums text-[#34342F]">
                      {market.price}
                    </div>

                    <div className="mt-0.5 flex items-center justify-end gap-0.5 text-[9px] font-extrabold text-[#18794E]">
                      <ArrowUpRight size={10} />
                      {market.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-market-search"))}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-[#E5E6DE] py-2.5 text-[10px] font-extrabold text-[#0F2D1F] transition-all hover:border-[#C9D7CD] hover:bg-[#FAFAF7]"
            >
              Explore markets
              <ChevronRight size={13} />
            </button>
          </section>

          {/* Allocation */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <h2 className="text-sm font-extrabold text-[#171717]">
              Portfolio allocation
            </h2>

            <p className="mt-1 text-[10px] text-[#9A998F]">
              Current asset distribution
            </p>

            <div className="mt-5 flex items-center gap-5">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[12px] border-[#0F2D1F]">
                <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-r-[#79A98A] border-t-[#79A98A] rotate-[-35deg]" />

                <div className="text-center">
                  <div className="text-lg font-extrabold text-[#171717]">
                    100%
                  </div>

                  <div className="text-[8px] font-bold uppercase tracking-wider text-[#9A998F]">
                    invested
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {[
                  ["BTC", "42%"],
                  ["ETH", "28%"],
                  ["SOL", "18%"],
                  ["Other", "12%"],
                ].map(([asset, percentage], index) => (
                  <div
                    key={asset}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "h-2 w-2 rounded-full",
                          index === 0
                            ? "bg-[#0F2D1F]"
                            : index === 1
                              ? "bg-[#79A98A]"
                              : index === 2
                                ? "bg-[#B7CDBD]"
                                : "bg-[#D9E1DA]",
                        ].join(" ")}
                      />

                      <span className="text-[10px] font-semibold text-[#6B6B63]">
                        {asset}
                      </span>
                    </div>

                    <span className="text-[10px] font-extrabold text-[#34342F]">
                      {percentage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Activity */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#171717]">
                  Recent activity
                </h2>

                <p className="mt-1 text-[10px] text-[#9A998F]">
                  Latest portfolio events
                </p>
              </div>

              <span className="rounded-full bg-[#F5F5EF] px-2 py-1 text-[8px] font-bold text-[#8A897F]">
                3 events
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {[
                {
                  title: "BTC position increased",
                  detail: "0.025 BTC",
                  time: "12 min",
                  positive: true,
                },
                {
                  title: "Risk assessment completed",
                  detail: "Healthy posture",
                  time: "34 min",
                  positive: true,
                },
                {
                  title: "Friday market alert",
                  detail: "BTC resistance",
                  time: "1 hr",
                  positive: false,
                },
              ].map((activity) => (
                <div
                  key={activity.title}
                  className="flex items-center gap-3"
                >
                  <div
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      activity.positive
                        ? "bg-[#E8F2EA] text-[#18794E]"
                        : "bg-[#F3F0E5] text-[#8A897F]",
                    ].join(" ")}
                  >
                    {activity.positive ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-extrabold text-[#34342F]">
                      {activity.title}
                    </div>

                    <div className="mt-0.5 text-[9px] text-[#9A998F]">
                      {activity.detail}
                    </div>
                  </div>

                  <span className="shrink-0 text-[8px] font-semibold text-[#AAA99F]">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Friday intelligence */}
      <section className="relative mt-5 overflow-hidden rounded-2xl bg-[#0F2D1F] p-5 text-white shadow-[0_15px_40px_rgba(15,45,31,0.14)] sm:p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#79A98A]/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Sparkles size={19} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#A8D2B5]">
                Friday intelligence layer

                <span className="rounded-full bg-[#65C18C]/15 px-2 py-0.5 text-[7px] text-[#9ED7B2]">
                  AI ONLINE
                </span>
              </div>

              <div className="mt-1 text-lg font-extrabold tracking-[-0.02em]">
                Your portfolio is currently in a healthy risk regime.
              </div>

              <p className="mt-1.5 max-w-[700px] text-xs leading-5 text-white/60">
                Momentum is positive across major assets. Maintain disciplined
                position sizing while volatility remains elevated.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-friday"))}
            className="group flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#0F2D1F] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F4F3EA]"
          >
            Open Friday
            <ChevronRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-semibold text-[#A09F96]">
        <Maximize2 size={11} />
        Vish Capitals Intelligence Platform
      </div>
    </DashboardShell>
  )
}
