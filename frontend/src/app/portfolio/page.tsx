"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react"

const holdings = [
  {
    asset: "BTC",
    name: "Bitcoin",
    amount: "0.2841 BTC",
    price: "$117,842.20",
    value: "$33,491.91",
    allocation: "42.1%",
    pnl: "+$5,284.22",
    change: "+18.72%",
    positive: true,
  },
  {
    asset: "ETH",
    name: "Ethereum",
    amount: "3.842 ETH",
    price: "$4,386.74",
    value: "$16,860.47",
    allocation: "28.4%",
    pnl: "+$2,941.18",
    change: "+21.14%",
    positive: true,
  },
  {
    asset: "SOL",
    name: "Solana",
    amount: "13.71 SOL",
    price: "$201.38",
    value: "$2,756.93",
    allocation: "18.2%",
    pnl: "+$486.12",
    change: "+21.41%",
    positive: true,
  },
  {
    asset: "USDT",
    name: "Tether",
    amount: "8,956.12 USDT",
    price: "$1.00",
    value: "$8,956.12",
    allocation: "11.3%",
    pnl: "+$0.00",
    change: "0.00%",
    positive: true,
  },
]

const chartValues = [
  38,
  41,
  40,
  44,
  46,
  45,
  51,
  49,
  56,
  59,
  57,
  64,
  63,
  70,
  68,
  77,
  74,
  82,
]

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
  return `${buildChartPath(values)} L 888 260 L 12 260 Z`
}

export default function PortfolioPage() {
  const chartPath = buildChartPath(chartValues)
  const areaPath = buildAreaPath(chartValues)

  return (
    <main className="min-h-screen bg-[#F7F6E8] text-[#171717]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <section className="mb-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8A897F]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
              Portfolio management
            </div>

            <h1 className="text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">
              Portfolio
            </h1>

            <p className="mt-2 max-w-[680px] text-sm leading-6 text-[#77776F]">
              Track your holdings, performance, allocation and portfolio risk
              from one workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[#DDE3DD] bg-white px-4 py-2.5 text-xs font-bold text-[#34342F] shadow-sm transition hover:border-[#BFD3C5] hover:text-[#0F2D1F]"
            >
              <Clock3 size={14} />
              Last 30 days
              <ChevronRight size={13} />
            </button>

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-[#0F2D1F] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(15,45,31,0.16)] transition hover:bg-[#17452F]"
            >
              <Wallet size={14} />
              Add funds
            </button>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total portfolio",
              value: "$79,565.43",
              change: "+18.72%",
              icon: CircleDollarSign,
            },
            {
              label: "Today's P&L",
              value: "+$1,284.72",
              change: "+1.64%",
              icon: TrendingUp,
            },
            {
              label: "Total P&L",
              value: "+$8,711.52",
              change: "+12.29%",
              icon: ArrowUpRight,
            },
            {
              label: "Available cash",
              value: "$8,956.12",
              change: "11.3%",
              icon: Wallet,
            },
          ].map((stat) => {
            const Icon = stat.icon

            return (
              <article
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D1DCD3] hover:shadow-[0_18px_40px_rgba(23,23,23,0.07)]"
              >
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#E8F2EA] opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />

                <div className="relative flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2EA] text-[#0F2D1F]">
                    <Icon size={17} />
                  </div>

                  <span className="rounded-full bg-[#EAF4EC] px-2.5 py-1 text-[9px] font-extrabold text-[#18794E]">
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

        {/* Main content */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">

          <div className="space-y-5">

            {/* Performance chart */}
            <section className="overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
              <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
                <div>
                  <h2 className="text-sm font-extrabold">
                    Portfolio performance
                  </h2>

                  <p className="mt-1 text-[10px] text-[#9A998F]">
                    Portfolio value and cumulative return
                  </p>
                </div>

                <div className="flex items-end gap-4">
                  <div className="text-right">
                    <div className="text-[8px] font-bold uppercase tracking-wider text-[#9A998F]">
                      Current value
                    </div>

                    <div className="mt-1 text-lg font-extrabold">
                      $79,565.43
                    </div>
                  </div>

                  <span className="rounded-full bg-[#EAF4EC] px-2.5 py-1 text-[9px] font-extrabold text-[#18794E]">
                    +18.72%
                  </span>
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

                  <path
                    d={areaPath}
                    fill="url(#portfolioFill)"
                  />

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
                  <span>JUL 15</span>
                  <span>JUL 22</span>
                  <span>JUL 29</span>
                  <span>AUG 05</span>
                  <span>TODAY</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-5 sm:p-6">
                {[
                  ["Return", "+18.72%", "text-[#18794E]"],
                  ["Max drawdown", "-4.82%", "text-[#34342F]"],
                  ["Sharpe ratio", "1.84", "text-[#34342F]"],
                ].map(([label, value, valueClass]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#ECECE4] bg-[#FAFAF7] p-3"
                  >
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#9A998F]">
                      {label}
                    </div>

                    <div
                      className={`mt-1 text-sm font-extrabold ${valueClass}`}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Holdings */}
            <section className="overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
              <div className="flex items-center justify-between border-b border-[#ECECE4] p-5">
                <div>
                  <h2 className="text-sm font-extrabold">
                    Your holdings
                  </h2>

                  <p className="mt-1 text-[10px] text-[#9A998F]">
                    Current portfolio positions
                  </p>
                </div>

                <span className="rounded-full bg-[#F5F5EF] px-2.5 py-1 text-[8px] font-bold text-[#8A897F]">
                  4 assets
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#ECECE4] bg-[#FAFAF7] text-left">
                      <th className="px-5 py-3 text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                        Asset
                      </th>

                      <th className="px-4 py-3 text-right text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                        Price
                      </th>

                      <th className="px-4 py-3 text-right text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                        Value
                      </th>

                      <th className="px-4 py-3 text-right text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                        Allocation
                      </th>

                      <th className="px-5 py-3 text-right text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                        P&L
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {holdings.map((holding) => (
                      <tr
                        key={holding.asset}
                        className="border-b border-[#F0F0EA] transition-colors hover:bg-[#FAFAF7]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F2EA] text-[9px] font-extrabold text-[#0F2D1F]">
                              {holding.asset.slice(0, 2)}
                            </div>

                            <div>
                              <div className="text-xs font-extrabold">
                                {holding.asset}
                              </div>

                              <div className="mt-0.5 text-[9px] text-[#9A998F]">
                                {holding.amount}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right text-[10px] font-semibold tabular-nums text-[#55554F]">
                          {holding.price}
                        </td>

                        <td className="px-4 py-4 text-right text-xs font-extrabold tabular-nums">
                          {holding.value}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <span className="rounded-full bg-[#F3F4EE] px-2 py-1 text-[9px] font-extrabold text-[#55554F]">
                            {holding.allocation}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="text-[10px] font-extrabold text-[#18794E]">
                            {holding.pnl}
                          </div>

                          <div className="mt-0.5 flex items-center justify-end gap-0.5 text-[8px] font-bold text-[#18794E]">
                            <ArrowUpRight size={9} />
                            {holding.change}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right rail */}
          <aside className="space-y-5">

            {/* Allocation */}
            <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
              <h2 className="text-sm font-extrabold">
                Asset allocation
              </h2>

              <p className="mt-1 text-[10px] text-[#9A998F]">
                Current portfolio distribution
              </p>

              <div className="mt-6 flex items-center justify-center">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[18px] border-[#0F2D1F]">
                  <div className="absolute inset-[-18px] rounded-full border-[18px] border-transparent border-r-[#79A98A] border-t-[#79A98A] rotate-[-30deg]" />

                  <div className="text-center">
                    <div className="text-2xl font-extrabold">
                      100%
                    </div>

                    <div className="text-[8px] font-bold uppercase tracking-wider text-[#9A998F]">
                      allocated
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  ["BTC", "42.1%", "bg-[#0F2D1F]"],
                  ["ETH", "28.4%", "bg-[#79A98A]"],
                  ["SOL", "18.2%", "bg-[#B7CDBD]"],
                  ["USDT", "11.3%", "bg-[#D9E1DA]"],
                ].map(([asset, percentage, dot]) => (
                  <div
                    key={asset}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${dot}`}
                      />

                      <span className="text-[10px] font-semibold text-[#6B6B63]">
                        {asset}
                      </span>
                    </div>

                    <span className="text-[10px] font-extrabold">
                      {percentage}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Risk */}
            <section className="relative overflow-hidden rounded-2xl border border-[#D3E3D7] bg-[#E8F2EA] p-5">
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F2D1F] shadow-sm">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-extrabold">
                    Portfolio risk
                  </h2>

                  <p className="mt-0.5 text-[9px] text-[#6D8274]">
                    Current risk posture
                  </p>
                </div>
              </div>

              <div className="relative mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5F7166]">
                  Exposure
                </span>

                <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold text-[#18794E] shadow-sm">
                  Healthy
                </span>
              </div>

              <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                <div className="h-full w-[34%] rounded-full bg-[#0F2D1F]" />
              </div>

              <div className="mt-2 flex justify-between text-[8px] font-semibold text-[#718178]">
                <span>34% used</span>
                <span>20% target</span>
              </div>

              <div className="mt-5 border-t border-[#CFE0D3] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-[#718178]">
                    Portfolio drawdown
                  </span>

                  <span className="text-xs font-extrabold text-[#0F2D1F]">
                    -2.14%
                  </span>
                </div>
              </div>
            </section>

            {/* Friday insight */}
            <section className="rounded-2xl bg-[#0F2D1F] p-5 text-white shadow-[0_12px_35px_rgba(15,45,31,0.14)]">
              <div className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#A8D2B5]">
                Friday portfolio insight
              </div>

              <h2 className="mt-3 text-sm font-extrabold leading-5">
                Your portfolio remains within the target risk regime.
              </h2>

              <p className="mt-2 text-[10px] leading-5 text-white/55">
                BTC and ETH are driving most of the current return. Position
                concentration remains manageable.
              </p>

              <button
                type="button"
                className="mt-4 flex items-center gap-1.5 text-[10px] font-extrabold text-[#C9E3D0]"
              >
                View risk analysis
                <ChevronRight size={12} />
              </button>
            </section>

            {/* Recent transaction */}
            <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold">
                    Recent activity
                  </h2>

                  <p className="mt-1 text-[10px] text-[#9A998F]">
                    Latest portfolio events
                  </p>
                </div>

                <PieChart size={15} className="text-[#8A897F]" />
              </div>

              <div className="mt-4 space-y-4">
                {[
                  ["BTC position increased", "+0.025 BTC", "12 min"],
                  ["ETH position updated", "+0.40 ETH", "46 min"],
                  ["USDT cash balance", "$8,956.12", "2 hr"],
                ].map(([title, detail, time]) => (
                  <div
                    key={title}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F2EA] text-[#18794E]">
                      <ArrowUpRight size={13} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] font-extrabold">
                        {title}
                      </div>

                      <div className="mt-0.5 text-[9px] text-[#9A998F]">
                        {detail}
                      </div>
                    </div>

                    <span className="text-[8px] font-semibold text-[#AAA99F]">
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {/* Bottom status */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[9px] font-semibold text-[#A09F96]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
          Portfolio data synchronized
        </div>
      </div>
    </main>
  )
}