"use client"

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TrendingDown,
  WalletCards,
} from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"

const exposure = [
  {
    asset: "BTC",
    name: "Bitcoin",
    exposure: "42.0%",
    value: "$21,840",
    limit: "50%",
    status: "Healthy",
  },
  {
    asset: "ETH",
    name: "Ethereum",
    exposure: "28.0%",
    value: "$14,560",
    limit: "40%",
    status: "Healthy",
  },
  {
    asset: "SOL",
    name: "Solana",
    exposure: "18.0%",
    value: "$9,360",
    limit: "25%",
    status: "Healthy",
  },
  {
    asset: "OTHER",
    name: "Other assets",
    exposure: "12.0%",
    value: "$6,240",
    limit: "20%",
    status: "Healthy",
  },
]

const riskMetrics = [
  {
    label: "Risk score",
    value: "34",
    suffix: "/100",
    change: "Low risk",
    icon: ShieldCheck,
  },
  {
    label: "Portfolio drawdown",
    value: "-2.14%",
    suffix: "",
    change: "Within limit",
    icon: TrendingDown,
  },
  {
    label: "Risk per trade",
    value: "1.42%",
    suffix: "",
    change: "2% maximum",
    icon: Target,
  },
  {
    label: "Cash reserve",
    value: "8.6%",
    suffix: "",
    change: "Above minimum",
    icon: WalletCards,
  },
]

export default function RiskPage() {
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
            Portfolio protection
          </div>

          <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#171717] sm:text-4xl">
            Risk Management
          </h1>

          <p className="mt-2 max-w-[680px] text-sm leading-6 text-[#77776F]">
            Monitor portfolio exposure, drawdown, position sizing and trading
            risk from one centralized control layer.
          </p>
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-[#DDE3DD] bg-white px-4 py-2.5 text-xs font-bold text-[#34342F] shadow-[0_5px_20px_rgba(23,23,23,0.035)] transition-all hover:-translate-y-0.5 hover:border-[#BFD3C5] hover:text-[#0F2D1F]"
        >
          <SlidersHorizontal size={15} />
          Risk settings
        </button>
      </section>

      {/* Overall status */}
      <section className="relative mb-5 overflow-hidden rounded-2xl bg-[#0F2D1F] p-5 text-white shadow-[0_15px_40px_rgba(15,45,31,0.12)] sm:p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#79A98A]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck size={22} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#A8D2B5]">
                  Overall risk posture
                </span>

                <span className="rounded-full bg-[#65C18C]/15 px-2 py-0.5 text-[7px] font-extrabold text-[#9ED7B2]">
                  HEALTHY
                </span>
              </div>

              <h2 className="mt-1.5 text-xl font-extrabold tracking-[-0.025em]">
                Portfolio risk is under control.
              </h2>

              <p className="mt-1.5 max-w-[650px] text-xs leading-5 text-white/60">
                Current exposure remains within your configured risk limits.
                Friday has detected no critical portfolio-level risk events.
              </p>
            </div>
          </div>

          <div className="shrink-0 lg:text-right">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/45">
              Risk score
            </div>

            <div className="mt-1 text-4xl font-extrabold tracking-[-0.05em]">
              34
              <span className="text-sm font-semibold text-white/40">
                /100
              </span>
            </div>

            <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-white/10 lg:ml-auto">
              <div className="h-full w-[34%] rounded-full bg-[#79A98A]" />
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {riskMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <article
              key={metric.label}
              className="group relative overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D1DCD3] hover:shadow-[0_18px_40px_rgba(23,23,23,0.07)]"
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#E8F2EA] opacity-60 blur-2xl" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2EA] text-[#0F2D1F]">
                  <Icon size={17} />
                </div>

                <span className="rounded-full bg-[#EAF4EC] px-2.5 py-1 text-[9px] font-extrabold text-[#18794E]">
                  {metric.change}
                </span>
              </div>

              <div className="relative mt-5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#9A998F]">
                {metric.label}
              </div>

              <div className="relative mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#171717]">
                {metric.value}
                {metric.suffix && (
                  <span className="text-[10px] font-semibold text-[#9A998F]">
                    {metric.suffix}
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </section>

      {/* Main */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <div className="space-y-5">
          {/* Exposure */}
          <section className="overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-start justify-between border-b border-[#ECECE4] p-5 sm:p-6">
              <div>
                <h2 className="text-sm font-extrabold text-[#171717]">
                  Asset exposure
                </h2>

                <p className="mt-1 text-[10px] text-[#9A998F]">
                  Current allocation against configured exposure limits
                </p>
              </div>

              <span className="rounded-full bg-[#EAF4EC] px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wide text-[#18794E]">
                All healthy
              </span>
            </div>

            <div className="divide-y divide-[#F0F0EA]">
              {exposure.map((item) => (
                <div
                  key={item.asset}
                  className="p-4 transition-colors hover:bg-[#FAFAF7] sm:p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F1E9] text-[9px] font-extrabold text-[#34342F]">
                        {item.asset.slice(0, 2)}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-[#34342F]">
                          {item.asset}
                        </div>

                        <div className="mt-0.5 text-[9px] text-[#9A998F]">
                          {item.name}
                        </div>
                      </div>
                    </div>

                    <div className="hidden text-right sm:block">
                      <div className="text-xs font-extrabold text-[#34342F]">
                        {item.value}
                      </div>

                      <div className="mt-0.5 text-[9px] text-[#9A998F]">
                        Limit {item.limit}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#EAF4EC] px-2 py-1 text-[8px] font-extrabold text-[#18794E]">
                        {item.status}
                      </span>

                      <ChevronRight
                        size={14}
                        className="text-[#AAA99F]"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8E9E1]">
                      <div
                        className="h-full rounded-full bg-[#0F2D1F]"
                        style={{
                          width: item.exposure,
                        }}
                      />
                    </div>

                    <span className="w-12 text-right text-[10px] font-extrabold text-[#34342F]">
                      {item.exposure}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Risk limits */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-sm font-extrabold text-[#171717]">
                Risk limits
              </h2>

              <p className="mt-1 text-[10px] text-[#9A998F]">
                Active portfolio protection parameters
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Maximum position exposure", "20%", "Configured"],
                ["Maximum portfolio drawdown", "15%", "Configured"],
                ["Maximum risk per trade", "2%", "Configured"],
                ["Minimum cash reserve", "5%", "Configured"],
              ].map(([label, value, status]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#ECECE4] bg-[#FAFAF7] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#8A897F]">
                      {label}
                    </span>

                    <CheckCircle2
                      size={14}
                      className="shrink-0 text-[#18794E]"
                    />
                  </div>

                  <div className="mt-3 text-xl font-extrabold text-[#171717]">
                    {value}
                  </div>

                  <div className="mt-1 text-[9px] font-semibold text-[#18794E]">
                    {status}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Drawdown */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#171717]">
                  Drawdown monitor
                </h2>

                <p className="mt-1 text-[10px] text-[#9A998F]">
                  Portfolio decline from peak
                </p>
              </div>

              <TrendingDown
                size={17}
                className="text-[#18794E]"
              />
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="text-3xl font-extrabold tracking-[-0.04em] text-[#171717]">
                  -2.14%
                </div>

                <div className="mt-1 text-[9px] font-semibold text-[#18794E]">
                  Well below 15% limit
                </div>
              </div>

              <div className="text-right text-[9px] font-bold text-[#9A998F]">
                <div>Current</div>
                <div className="mt-1">Peak: $53,840</div>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#E8E9E1]">
              <div className="h-full w-[14%] rounded-full bg-[#18794E]" />
            </div>

            <div className="mt-2 flex justify-between text-[8px] font-bold text-[#AAA99F]">
              <span>0%</span>
              <span>15% maximum</span>
            </div>
          </section>

          {/* Friday */}
          <section className="relative overflow-hidden rounded-2xl border border-[#D3E3D7] bg-[#E8F2EA] p-5">
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/60 blur-3xl" />

            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F2D1F] shadow-sm">
                <BrainCircuit size={18} />
              </div>

              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#18794E]">
                  Friday analysis
                </div>

                <h2 className="mt-0.5 text-sm font-extrabold text-[#171717]">
                  Risk posture is healthy
                </h2>
              </div>
            </div>

            <p className="relative mt-4 text-xs leading-5 text-[#617168]">
              Current position sizing and portfolio diversification are
              appropriate for the prevailing volatility regime.
            </p>

            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("open-friday"))
              }
              className="relative mt-4 flex items-center gap-1.5 text-xs font-extrabold text-[#0F2D1F]"
            >
              Ask Friday
              <ArrowUpRight size={14} />
            </button>
          </section>

          {/* Alerts */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#171717]">
                  Risk alerts
                </h2>

                <p className="mt-1 text-[10px] text-[#9A998F]">
                  Recent risk events
                </p>
              </div>

              <span className="rounded-full bg-[#F5F5EF] px-2 py-1 text-[8px] font-bold text-[#8A897F]">
                2 events
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex gap-3 rounded-xl bg-[#FAFAF7] p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F2EA] text-[#18794E]">
                  <CheckCircle2 size={14} />
                </div>

                <div>
                  <div className="text-[10px] font-extrabold text-[#34342F]">
                    Risk assessment passed
                  </div>

                  <div className="mt-0.5 text-[9px] text-[#9A998F]">
                    All portfolio limits are currently respected.
                  </div>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl bg-[#FAFAF7] p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F0E5] text-[#8A897F]">
                  <AlertTriangle size={14} />
                </div>

                <div>
                  <div className="text-[10px] font-extrabold text-[#34342F]">
                    Volatility elevated
                  </div>

                  <div className="mt-0.5 text-[9px] text-[#9A998F]">
                    Consider reducing position size on new entries.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom action */}
      <section className="relative mt-5 overflow-hidden rounded-2xl border border-[#DCE7DE] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F2EA] text-[#0F2D1F]">
              <Target size={17} />
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-[#171717]">
                Risk engine active
              </h2>

              <p className="mt-1 text-[10px] leading-5 text-[#8A897F]">
                New paper trades will be checked against these limits before
                execution.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0F2D1F] px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-[#17452F]"
          >
            Review risk configuration
            <ChevronRight size={14} />
          </button>
        </div>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-semibold text-[#A09F96]">
        <ShieldCheck size={11} />
        Vish Capitals Risk Intelligence
      </div>
    </DashboardShell>
  )
}