"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Plus,
  Search,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"

const journalEntries = [
  {
    id: 1,
    pair: "BTC/USDT",
    type: "Long",
    result: "+$482.60",
    returnPct: "+8.42%",
    status: "Win",
    strategy: "Momentum breakout",
    date: "Aug 14, 2026",
    duration: "4h 18m",
    notes:
      "Entered after BTC reclaimed resistance with strong volume confirmation. Position size remained within risk limits.",
  },
  {
    id: 2,
    pair: "ETH/USDT",
    type: "Long",
    result: "+$214.30",
    returnPct: "+4.76%",
    status: "Win",
    strategy: "Trend continuation",
    date: "Aug 13, 2026",
    duration: "6h 42m",
    notes:
      "Higher timeframe structure remained bullish. Took partial profits into resistance and moved stop to breakeven.",
  },
  {
    id: 3,
    pair: "SOL/USDT",
    type: "Short",
    result: "-$96.40",
    returnPct: "-2.18%",
    status: "Loss",
    strategy: "Resistance rejection",
    date: "Aug 12, 2026",
    duration: "2h 09m",
    notes:
      "Entry was technically valid but momentum accelerated against the position. Exit followed the predefined stop.",
  },
  {
    id: 4,
    pair: "BTC/USDT",
    type: "Long",
    result: "+$328.10",
    returnPct: "+6.12%",
    status: "Win",
    strategy: "Support reclaim",
    date: "Aug 11, 2026",
    duration: "5h 31m",
    notes:
      "Price reclaimed the daily support zone and market breadth improved across large-cap assets.",
  },
]

const statistics = [
  {
    label: "Win rate",
    value: "78.4%",
    change: "+6.2%",
    icon: Target,
  },
  {
    label: "Total trades",
    value: "64",
    change: "+12",
    icon: BarChart3,
  },
  {
    label: "Average return",
    value: "+4.82%",
    change: "+0.74%",
    icon: TrendingUp,
  },
  {
    label: "Best trade",
    value: "+14.6%",
    change: "BTC/USDT",
    icon: ArrowUpRight,
  },
]

export default function JournalPage() {
  return (
    <DashboardShell>
      {/* Header */}
      <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8A897F]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#18794E]/40" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-[#18794E]" />
            </span>
            Trading journal
          </div>

          <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#171717] sm:text-4xl">
            Trade Journal
          </h1>

          <p className="mt-2 max-w-[680px] text-sm leading-6 text-[#77776F]">
            Review your trading decisions, analyze performance patterns and
            build a more disciplined trading process.
          </p>
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#0F2D1F] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(15,45,31,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#17452F]"
        >
          <Plus size={15} />
          New journal entry
        </button>
      </section>

      {/* Statistics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((stat) => {
          const Icon = stat.icon

          return (
            <article
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D1DCD3] hover:shadow-[0_18px_40px_rgba(23,23,23,0.07)]"
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#E8F2EA] opacity-60 blur-2xl" />

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

              <div className="relative mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#171717]">
                {stat.value}
              </div>
            </article>
          )
        })}
      </section>

      {/* Main content */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          {/* Filters */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-4 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A998F]"
                />

                <input
                  type="text"
                  placeholder="Search trades, strategies or notes..."
                  className="h-10 w-full rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] pl-9 pr-3 text-[11px] font-semibold text-[#34342F] outline-none transition-all placeholder:text-[#AAA99F] focus:border-[#AFC5B6] focus:bg-white"
                />
              </div>

              <button
                type="button"
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] px-3 text-[10px] font-extrabold text-[#55554F] transition-colors hover:border-[#BFD3C5] hover:text-[#0F2D1F]"
              >
                <CalendarDays size={14} />
                Last 30 days
              </button>

              <button
                type="button"
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] px-3 text-[10px] font-extrabold text-[#55554F] transition-colors hover:border-[#BFD3C5] hover:text-[#0F2D1F]"
              >
                <Filter size={14} />
                Filters
              </button>
            </div>
          </section>

          {/* Entries */}
          <section className="overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-center justify-between border-b border-[#ECECE4] p-5 sm:p-6">
              <div>
                <h2 className="text-sm font-extrabold text-[#171717]">
                  Recent trades
                </h2>

                <p className="mt-1 text-[10px] text-[#9A998F]">
                  Your latest journal activity
                </p>
              </div>

              <span className="rounded-full bg-[#F5F5EF] px-2.5 py-1 text-[8px] font-extrabold text-[#8A897F]">
                64 total
              </span>
            </div>

            <div className="divide-y divide-[#F0F0EA]">
              {journalEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="group p-5 transition-colors hover:bg-[#FAFAF7] sm:p-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F1E9] text-[9px] font-extrabold text-[#34342F] transition-colors group-hover:bg-[#E8F2EA] group-hover:text-[#0F2D1F]">
                          {entry.pair.slice(0, 2)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xs font-extrabold text-[#34342F]">
                              {entry.pair}
                            </h3>

                            <span
                              className={[
                                "rounded-full px-2 py-0.5 text-[8px] font-extrabold",
                                entry.type === "Long"
                                  ? "bg-[#EAF4EC] text-[#18794E]"
                                  : "bg-[#F3F0E5] text-[#8A897F]",
                              ].join(" ")}
                            >
                              {entry.type}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-[#9A998F]">
                            <span>{entry.strategy}</span>
                            <span>•</span>
                            <span>{entry.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={[
                            "text-sm font-extrabold tabular-nums",
                            entry.status === "Win"
                              ? "text-[#18794E]"
                              : "text-[#A04D4D]",
                          ].join(" ")}
                        >
                          {entry.result}
                        </div>

                        <div
                          className={[
                            "mt-0.5 text-[9px] font-extrabold",
                            entry.status === "Win"
                              ? "text-[#18794E]"
                              : "text-[#A04D4D]",
                          ].join(" ")}
                        >
                          {entry.returnPct}
                        </div>
                      </div>
                    </div>

                    <p className="max-w-[760px] text-[10px] leading-5 text-[#6D6D65]">
                      {entry.notes}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#9A998F]">
                          <Clock3 size={12} />
                          {entry.duration}
                        </div>

                        <div
                          className={[
                            "flex items-center gap-1.5 text-[9px] font-extrabold",
                            entry.status === "Win"
                              ? "text-[#18794E]"
                              : "text-[#A04D4D]",
                          ].join(" ")}
                        >
                          {entry.status === "Win" ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {entry.status}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="flex items-center gap-1 text-[9px] font-extrabold text-[#0F2D1F] opacity-80 transition-all group-hover:opacity-100"
                      >
                        View journal
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t border-[#ECECE4] p-4">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E5E6DE] py-2.5 text-[10px] font-extrabold text-[#0F2D1F] transition-all hover:border-[#C9D7CD] hover:bg-[#FAFAF7]"
              >
                View all journal entries
                <ChevronRight size={13} />
              </button>
            </div>
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Performance */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div>
              <h2 className="text-sm font-extrabold text-[#171717]">
                Journal performance
              </h2>

              <p className="mt-1 text-[10px] text-[#9A998F]">
                Trading results this month
              </p>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-3xl font-extrabold tracking-[-0.04em] text-[#171717]">
                  +18.72%
                </div>

                <div className="mt-1 flex items-center gap-1 text-[9px] font-extrabold text-[#18794E]">
                  <ArrowUpRight size={11} />
                  Above monthly target
                </div>
              </div>

              <div className="text-right">
                <div className="text-[9px] font-bold text-[#9A998F]">
                  Target
                </div>

                <div className="mt-1 text-xs font-extrabold text-[#34342F]">
                  +12%
                </div>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#E8E9E1]">
              <div className="h-full w-[82%] rounded-full bg-[#0F2D1F]" />
            </div>

            <div className="mt-2 flex justify-between text-[8px] font-bold text-[#AAA99F]">
              <span>0%</span>
              <span>Monthly target</span>
            </div>
          </section>

          {/* Strategy breakdown */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div>
              <h2 className="text-sm font-extrabold text-[#171717]">
                Strategy breakdown
              </h2>

              <p className="mt-1 text-[10px] text-[#9A998F]">
                Performance by strategy
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {[
                ["Momentum breakout", "86%", "+11.4%"],
                ["Trend continuation", "81%", "+7.8%"],
                ["Support reclaim", "75%", "+5.2%"],
                ["Resistance rejection", "62%", "-1.8%"],
              ].map(([strategy, winRate, result]) => (
                <div key={strategy}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-extrabold text-[#4C4C46]">
                      {strategy}
                    </span>

                    <span className="text-[9px] font-extrabold text-[#18794E]">
                      {result}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8E9E1]">
                      <div
                        className="h-full rounded-full bg-[#79A98A]"
                        style={{ width: winRate }}
                      />
                    </div>

                    <span className="w-8 text-right text-[8px] font-bold text-[#9A998F]">
                      {winRate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Discipline */}
          <section className="relative overflow-hidden rounded-2xl border border-[#D3E3D7] bg-[#E8F2EA] p-5">
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/60 blur-3xl" />

            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F2D1F] shadow-sm">
                <BookOpen size={18} />
              </div>

              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#18794E]">
                  Trading discipline
                </div>

                <h2 className="mt-0.5 text-sm font-extrabold text-[#171717]">
                  Excellent consistency
                </h2>
              </div>
            </div>

            <p className="relative mt-4 text-xs leading-5 text-[#617168]">
              You followed your predefined risk rules on 92% of trades this
              month.
            </p>

            <div className="relative mt-4 flex items-center justify-between">
              <span className="text-[9px] font-bold text-[#718178]">
                Discipline score
              </span>

              <span className="text-sm font-extrabold text-[#0F2D1F]">
                92/100
              </span>
            </div>

            <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
              <div className="h-full w-[92%] rounded-full bg-[#0F2D1F]" />
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1F1E9] text-[#0F2D1F]">
                <FileText size={16} />
              </div>

              <div>
                <h2 className="text-sm font-extrabold text-[#171717]">
                  Journal habit
                </h2>

                <p className="mt-0.5 text-[9px] text-[#9A998F]">
                  Keep documenting every decision
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#FAFAF7] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9A998F]">
                  Entries this month
                </span>

                <span className="text-sm font-extrabold text-[#34342F]">
                  18
                </span>
              </div>

              <div className="mt-3 flex gap-1">
                {Array.from({ length: 18 }).map((_, index) => (
                  <span
                    key={index}
                    className="h-5 flex-1 rounded-sm bg-[#79A98A]"
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-5 flex items-center justify-center gap-2 text-[9px] font-semibold text-[#A09F96]">
        <BookOpen size={11} />
        Vish Capitals Trading Journal
      </div>
    </DashboardShell>
  )
}