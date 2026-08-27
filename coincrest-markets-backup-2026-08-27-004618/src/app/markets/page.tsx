"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Clock3,
  Filter,
  Search,
  Star,
  TrendingUp,
} from "lucide-react"

const markets = [
  {
    rank: 1,
    symbol: "BTC",
    name: "Bitcoin",
    price: "$117,842.20",
    change: "+2.84%",
    high: "$119,204.50",
    low: "$114,932.10",
    volume: "$42.8B",
    marketCap: "$2.35T",
    positive: true,
    score: 92,
  },
  {
    rank: 2,
    symbol: "ETH",
    name: "Ethereum",
    price: "$4,386.74",
    change: "+3.61%",
    high: "$4,428.20",
    low: "$4,192.40",
    volume: "$24.1B",
    marketCap: "$528.4B",
    positive: true,
    score: 89,
  },
  {
    rank: 3,
    symbol: "SOL",
    name: "Solana",
    price: "$201.38",
    change: "+5.27%",
    high: "$205.92",
    low: "$188.31",
    volume: "$8.7B",
    marketCap: "$97.2B",
    positive: true,
    score: 86,
  },
  {
    rank: 4,
    symbol: "BNB",
    name: "BNB",
    price: "$812.46",
    change: "-0.84%",
    high: "$824.12",
    low: "$801.37",
    volume: "$2.1B",
    marketCap: "$113.9B",
    positive: false,
    score: 71,
  },
  {
    rank: 5,
    symbol: "XRP",
    name: "XRP",
    price: "$3.18",
    change: "+1.92%",
    high: "$3.24",
    low: "$3.02",
    volume: "$4.6B",
    marketCap: "$186.7B",
    positive: true,
    score: 81,
  },
  {
    rank: 6,
    symbol: "ADA",
    name: "Cardano",
    price: "$0.91",
    change: "-1.24%",
    high: "$0.94",
    low: "$0.88",
    volume: "$912M",
    marketCap: "$32.8B",
    positive: false,
    score: 64,
  },
  {
    rank: 7,
    symbol: "AVAX",
    name: "Avalanche",
    price: "$28.74",
    change: "+2.17%",
    high: "$29.42",
    low: "$27.51",
    volume: "$634M",
    marketCap: "$12.1B",
    positive: true,
    score: 76,
  },
  {
    rank: 8,
    symbol: "LINK",
    name: "Chainlink",
    price: "$23.84",
    change: "+4.08%",
    high: "$24.21",
    low: "$22.57",
    volume: "$811M",
    marketCap: "$15.4B",
    positive: true,
    score: 84,
  },
]

const watchlist: [string, string, string, boolean][] = [
  ["BTC", "$117,842.20", "+2.84%", true],
  ["ETH", "$4,386.74", "+3.61%", true],
  ["SOL", "$201.38", "+5.27%", true],
  ["BNB", "$812.46", "-0.84%", false],
]

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-[#F7F6E8] text-[#171717]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <section className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8A897F]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
              Market intelligence
            </div>

            <h1 className="text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">
              Markets
            </h1>

            <p className="mt-2 max-w-[650px] text-sm leading-6 text-[#77776F]">
              Monitor crypto markets, momentum, liquidity and AI-generated
              market signals from one workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[#DDE3DD] bg-white px-4 py-2.5 text-xs font-bold text-[#34342F] shadow-sm transition hover:border-[#BFD3C5] hover:text-[#0F2D1F]"
            >
              <Clock3 size={14} />
              24H
              <ChevronDown size={13} />
            </button>

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-[#0F2D1F] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(15,45,31,0.16)] transition hover:bg-[#17452F]"
            >
              <TrendingUp size={14} />
              Market scanner
            </button>
          </div>
        </section>

        {/* Market summary */}
        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total market cap", "$3.82T", "+2.14%"],
            ["24H volume", "$128.6B", "+8.42%"],
            ["BTC dominance", "61.4%", "+0.37%"],
            ["Fear & Greed", "72", "Greed"],
          ].map(([label, value, change]) => (
            <article
              key={label}
              className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]"
            >
              <div className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#9A998F]">
                {label}
              </div>

              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-xl font-extrabold tracking-[-0.03em]">
                  {value}
                </div>

                <span className="rounded-full bg-[#EAF4EC] px-2 py-1 text-[9px] font-extrabold text-[#18794E]">
                  {change}
                </span>
              </div>
            </article>
          ))}
        </section>

        {/* Main layout */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">

          {/* Market table */}
          <section className="overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.025)]">

            {/* Toolbar */}
            <div className="flex flex-col gap-4 border-b border-[#ECECE4] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-extrabold">
                  Crypto markets
                </h2>

                <p className="mt-1 text-[10px] text-[#9A998F]">
                  Live market overview
                </p>
              </div>

              <div className="flex gap-2">
                <div className="flex h-9 items-center gap-2 rounded-lg border border-[#E2E1D5] bg-[#FAFAF7] px-3">
                  <Search size={14} className="text-[#8A897F]" />

                  <input
                    type="text"
                    placeholder="Search asset..."
                    className="w-[150px] bg-transparent text-[10px] font-semibold outline-none placeholder:text-[#AAA99F]"
                  />
                </div>

                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-lg border border-[#E2E1D5] bg-[#FAFAF7] px-3 text-[10px] font-bold text-[#55554F]"
                >
                  <Filter size={13} />
                  Filter
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#ECECE4] bg-[#FAFAF7] text-left">
                    <th className="px-5 py-3 text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                      Asset
                    </th>

                    <th className="px-4 py-3 text-right text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                      Price
                    </th>

                    <th className="px-4 py-3 text-right text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                      24H
                    </th>

                    <th className="px-4 py-3 text-right text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                      High
                    </th>

                    <th className="px-4 py-3 text-right text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                      Low
                    </th>

                    <th className="px-4 py-3 text-right text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                      Volume
                    </th>

                    <th className="px-5 py-3 text-right text-[8px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                      AI score
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {markets.map((market) => (
                    <tr
                      key={market.symbol}
                      className="group border-b border-[#F0F0EA] transition-colors hover:bg-[#FAFAF7]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-4 text-[9px] font-bold text-[#AAA99F]">
                            {market.rank}
                          </span>

                          <button
                            type="button"
                            aria-label={`Favorite ${market.symbol}`}
                            className="text-[#B2B1A8] transition hover:text-[#B18A28]"
                          >
                            <Star size={13} />
                          </button>

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F2EA] text-[9px] font-extrabold text-[#0F2D1F]">
                            {market.symbol.slice(0, 2)}
                          </div>

                          <div>
                            <div className="text-xs font-extrabold">
                              {market.symbol}
                            </div>

                            <div className="mt-0.5 text-[9px] text-[#9A998F]">
                              {market.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="text-xs font-extrabold tabular-nums">
                          {market.price}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span
                          className={
                            market.positive
                              ? "inline-flex items-center gap-1 text-[10px] font-extrabold text-[#18794E]"
                              : "inline-flex items-center gap-1 text-[10px] font-extrabold text-[#A3483B]"
                          }
                        >
                          {market.positive ? (
                            <ArrowUpRight size={11} />
                          ) : (
                            <ArrowDownRight size={11} />
                          )}

                          {market.change}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right text-[10px] font-semibold tabular-nums text-[#55554F]">
                        {market.high}
                      </td>

                      <td className="px-4 py-4 text-right text-[10px] font-semibold tabular-nums text-[#55554F]">
                        {market.low}
                      </td>

                      <td className="px-4 py-4 text-right text-[10px] font-semibold tabular-nums text-[#55554F]">
                        {market.volume}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#E5E7DF]">
                            <div
                              className="h-full rounded-full bg-[#0F2D1F]"
                              style={{ width: `${market.score}%` }}
                            />
                          </div>

                          <span className="w-6 text-right text-[10px] font-extrabold text-[#0F2D1F]">
                            {market.score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#ECECE4] px-5 py-3">
              <span className="text-[9px] font-semibold text-[#AAA99F]">
                Showing 8 of 250+ assets
              </span>

              <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#18794E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
                Market data streaming
              </span>
            </div>
          </section>

          {/* Right rail */}
          <aside className="space-y-5">

            {/* Watchlist */}
            <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold">
                    Watchlist
                  </h2>

                  <p className="mt-1 text-[10px] text-[#9A998F]">
                    Your tracked assets
                  </p>
                </div>

                <Star size={15} className="text-[#B18A28]" />
              </div>

              <div className="mt-4 space-y-1">
                {watchlist.map(([symbol, price, change, positive]) => (
                  <div
                    key={symbol}
                    className="flex items-center justify-between rounded-xl px-2 py-3 transition hover:bg-[#FAFAF7]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F1E9] text-[9px] font-extrabold">
                        {symbol.slice(0, 2)}
                      </div>

                      <span className="text-xs font-extrabold">
                        {symbol}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-extrabold tabular-nums">
                        {price}
                      </div>

                      <div
                        className={
                          positive
                            ? "text-[9px] font-bold text-[#18794E]"
                            : "text-[9px] font-bold text-[#A3483B]"
                        }
                      >
                        {change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-[#E2E1D5] py-2.5 text-[10px] font-extrabold text-[#0F2D1F] transition hover:bg-[#FAFAF7]"
              >
                Manage watchlist
              </button>
            </section>

            {/* Market sentiment */}
            <section className="relative overflow-hidden rounded-2xl border border-[#D3E3D7] bg-[#E8F2EA] p-5">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/50 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#0F2D1F]" />

                  <h2 className="text-sm font-extrabold">
                    Market sentiment
                  </h2>
                </div>

                <div className="mt-6 text-center">
                  <div className="text-4xl font-extrabold tracking-[-0.05em] text-[#0F2D1F]">
                    72
                  </div>

                  <div className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#18794E]">
                    Greed
                  </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full w-[72%] rounded-full bg-[#0F2D1F]" />
                </div>

                <div className="mt-2 flex justify-between text-[8px] font-bold text-[#718178]">
                  <span>Fear</span>
                  <span>Neutral</span>
                  <span>Greed</span>
                </div>
              </div>
            </section>

            {/* Friday insight */}
            <section className="rounded-2xl bg-[#0F2D1F] p-5 text-white shadow-[0_12px_35px_rgba(15,45,31,0.14)]">
              <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#A8D2B5]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65C18C]" />
                Friday intelligence
              </div>

              <h2 className="mt-3 text-sm font-extrabold leading-5">
                Momentum remains constructive across large-cap crypto.
              </h2>

              <p className="mt-2 text-[10px] leading-5 text-white/55">
                BTC and ETH are leading the current market move while
                volatility remains elevated around resistance.
              </p>

              <button
                type="button"
                className="mt-4 flex items-center gap-1.5 text-[10px] font-extrabold text-[#C9E3D0]"
              >
                View intelligence
                <ArrowUpRight size={12} />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}