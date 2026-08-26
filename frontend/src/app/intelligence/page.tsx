"use client"

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  Gauge,
  Newspaper,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"

const signals = [
  {
    asset: "BTC",
    name: "Bitcoin",
    signal: "Bullish",
    score: 91,
    change: "+3.82%",
    trend: "Strong momentum",
    confidence: "High",
  },
  {
    asset: "ETH",
    name: "Ethereum",
    signal: "Bullish",
    score: 84,
    change: "+2.41%",
    trend: "Positive structure",
    confidence: "High",
  },
  {
    asset: "SOL",
    name: "Solana",
    signal: "Neutral",
    score: 67,
    change: "+0.84%",
    trend: "Consolidating",
    confidence: "Medium",
  },
  {
    asset: "BNB",
    name: "BNB",
    signal: "Watch",
    score: 58,
    change: "-0.32%",
    trend: "Mixed momentum",
    confidence: "Medium",
  },
]

const insights = [
  {
    icon: TrendingUp,
    title: "Momentum remains constructive",
    description:
      "Large-cap crypto assets continue to show positive momentum, with BTC leading the current market structure.",
    tag: "Momentum",
  },
  {
    icon: Activity,
    title: "Volatility is elevated",
    description:
      "Short-term volatility has increased around resistance zones. Position sizing should remain disciplined.",
    tag: "Risk",
  },
  {
    icon: Target,
    title: "BTC resistance remains important",
    description:
      "Bitcoin is approaching a key resistance area. A confirmed breakout could strengthen the broader market signal.",
    tag: "BTC",
  },
]

const news = [
  {
    source: "Market Intelligence",
    title: "Bitcoin maintains leadership across large-cap assets",
    time: "12 min ago",
  },
  {
    source: "Friday Sentiment",
    title: "Crypto sentiment remains cautiously optimistic",
    time: "28 min ago",
  },
  {
    source: "Risk Engine",
    title: "No major portfolio-level risk anomalies detected",
    time: "41 min ago",
  },
]

export default function IntelligencePage() {
  return (
    <DashboardShell>
      {/* Header */}
      <section className="mb-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8A897F]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#18794E]/40" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-[#18794E]" />
            </span>
            AI intelligence
          </div>

          <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#171717] sm:text-4xl">
            Friday Intelligence
          </h1>

          <p className="mt-2 max-w-[680px] text-sm leading-6 text-[#77776F]">
            AI-powered market analysis, sentiment, signals and portfolio
            intelligence in one workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-[#DDE3DD] bg-white px-4 py-2.5 text-xs font-bold text-[#34342F] shadow-[0_5px_20px_rgba(23,23,23,0.035)] transition-all hover:-translate-y-0.5 hover:border-[#BFD3C5] hover:text-[#0F2D1F]"
          >
            <RefreshCw size={14} />
            Refresh analysis
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-friday"))}
            className="flex items-center gap-2 rounded-xl bg-[#0F2D1F] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(15,45,31,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#17452F]"
          >
            <Sparkles size={14} />
            Ask Friday
          </button>
        </div>
      </section>

      {/* AI status */}
      <section className="relative mb-5 overflow-hidden rounded-2xl bg-[#0F2D1F] p-5 text-white shadow-[0_15px_40px_rgba(15,45,31,0.12)] sm:p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#79A98A]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <BrainCircuit size={21} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold">
                  Friday AI Engine
                </h2>

                <span className="rounded-full bg-[#65C18C]/15 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-[#9ED7B2]">
                  Online
                </span>
              </div>

              <p className="mt-1 max-w-[650px] text-xs leading-5 text-white/60">
                Six intelligence layers are currently monitoring market
                structure, news, sentiment, risk and trade opportunities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
            {[
              ["6", "Agents"],
              ["1,284", "Signals"],
              ["98.4%", "Uptime"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center"
              >
                <div className="text-sm font-extrabold">{value}</div>
                <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-white/40">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent cards */}
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            icon: Activity,
            name: "Market Agent",
            status: "Monitoring",
            detail: "Price structure & momentum",
          },
          {
            icon: Newspaper,
            name: "News Agent",
            status: "Monitoring",
            detail: "Market-moving events",
          },
          {
            icon: ShieldCheck,
            name: "Risk Agent",
            status: "Healthy",
            detail: "Portfolio exposure",
          },
          {
            icon: Zap,
            name: "Trade Alert Agent",
            status: "Active",
            detail: "Opportunity detection",
          },
          {
            icon: Sparkles,
            name: "Sentiment Agent",
            status: "Active",
            detail: "Market psychology",
          },
          {
            icon: BrainCircuit,
            name: "AI Chat Agent",
            status: "Ready",
            detail: "Personal trading assistant",
          },
        ].map((agent) => {
          const Icon = agent.icon

          return (
            <article
              key={agent.name}
              className="group rounded-2xl border border-[#E1E2D8] bg-white p-4 shadow-[0_8px_30px_rgba(23,23,23,0.025)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D1DCD3] hover:shadow-[0_15px_35px_rgba(23,23,23,0.06)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2EA] text-[#0F2D1F]">
                  <Icon size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-[#171717]">
                    {agent.name}
                  </div>

                  <div className="mt-0.5 text-[9px] text-[#9A998F]">
                    {agent.detail}
                  </div>
                </div>

                <span className="rounded-full bg-[#EAF4EC] px-2 py-1 text-[8px] font-extrabold text-[#18794E]">
                  {agent.status}
                </span>
              </div>
            </article>
          )
        })}
      </section>

      {/* Main intelligence */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          {/* Market signals */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-center justify-between border-b border-[#ECECE4] p-5">
              <div>
                <h2 className="text-sm font-extrabold text-[#171717]">
                  AI market signals
                </h2>
                <p className="mt-1 text-[10px] text-[#9A998F]">
                  Current AI scoring across major assets
                </p>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-[#EAF4EC] px-2.5 py-1.5 text-[8px] font-extrabold uppercase tracking-wide text-[#18794E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
                Live
              </div>
            </div>

            <div className="divide-y divide-[#F0F0EA]">
              {signals.map((signal) => (
                <div
                  key={signal.asset}
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-[#FAFAF7] sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3 sm:w-[180px]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F1E9] text-[9px] font-extrabold text-[#34342F]">
                      {signal.asset}
                    </div>

                    <div>
                      <div className="text-xs font-extrabold text-[#34342F]">
                        {signal.name}
                      </div>
                      <div className="mt-0.5 text-[9px] text-[#9A998F]">
                        {signal.trend}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#9A998F]">
                        AI score
                      </span>

                      <span className="text-xs font-extrabold text-[#0F2D1F]">
                        {signal.score}/100
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#E8E9E2]">
                      <div
                        className="h-full rounded-full bg-[#0F2D1F]"
                        style={{ width: `${signal.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 sm:w-[145px] sm:justify-end">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-[#9A998F]">
                        Signal
                      </div>
                      <div className="mt-1 text-xs font-extrabold text-[#18794E]">
                        {signal.signal}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-[#9A998F]">
                        Change
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1 text-xs font-extrabold text-[#18794E]">
                        <ArrowUpRight size={12} />
                        {signal.change}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Insights */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="mb-4">
              <h2 className="text-sm font-extrabold text-[#171717]">
                Friday&apos;s latest insights
              </h2>
              <p className="mt-1 text-[10px] text-[#9A998F]">
                AI-generated observations from the current market regime
              </p>
            </div>

            <div className="space-y-3">
              {insights.map((insight) => {
                const Icon = insight.icon

                return (
                  <article
                    key={insight.title}
                    className="rounded-xl border border-[#ECECE4] bg-[#FAFAF7] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F2EA] text-[#0F2D1F]">
                        <Icon size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs font-extrabold text-[#34342F]">
                            {insight.title}
                          </h3>

                          <span className="rounded-full bg-white px-2 py-1 text-[7px] font-extrabold uppercase tracking-wide text-[#8A897F]">
                            {insight.tag}
                          </span>
                        </div>

                        <p className="mt-1.5 text-[10px] leading-5 text-[#77776F]">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Intelligence score */}
          <section className="rounded-2xl border border-[#DCE7DE] bg-[#E8F2EA] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F2D1F] shadow-sm">
                <Gauge size={18} />
              </div>

              <div>
                <h2 className="text-sm font-extrabold text-[#171717]">
                  Market intelligence score
                </h2>
                <p className="mt-0.5 text-[9px] text-[#6D8274]">
                  Combined AI confidence
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div className="text-5xl font-extrabold tracking-[-0.06em] text-[#0F2D1F]">
                87
              </div>

              <div className="pb-1 text-right">
                <div className="flex items-center justify-end gap-1 text-xs font-extrabold text-[#18794E]">
                  <ArrowUpRight size={14} />
                  +6.2
                </div>
                <div className="mt-1 text-[8px] font-semibold text-[#718178]">
                  vs yesterday
                </div>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/70">
              <div className="h-full w-[87%] rounded-full bg-[#0F2D1F]" />
            </div>

            <div className="mt-2 flex justify-between text-[8px] font-semibold text-[#718178]">
              <span>Weak</span>
              <span>Neutral</span>
              <span>Strong</span>
            </div>
          </section>

          {/* Recent intelligence */}
          <section className="rounded-2xl border border-[#E1E2D8] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#171717]">
                  Intelligence feed
                </h2>
                <p className="mt-1 text-[10px] text-[#9A998F]">
                  Latest AI events
                </p>
              </div>

              <Clock3 size={15} className="text-[#9A998F]" />
            </div>

            <div className="mt-4 space-y-4">
              {news.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F1F1E9] text-[#6D6D65]">
                    <Newspaper size={13} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold leading-4 text-[#34342F]">
                      {item.title}
                    </div>

                    <div className="mt-1 text-[8px] font-semibold text-[#AAA99F]">
                      {item.source} · {item.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Risk warning */}
          <section className="rounded-2xl border border-[#E8E0CF] bg-[#FAF7ED] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#8A897F]">
                <CircleAlert size={16} />
              </div>

              <div>
                <h2 className="text-xs font-extrabold text-[#34342F]">
                  AI risk observation
                </h2>

                <p className="mt-1.5 text-[10px] leading-5 text-[#77776F]">
                  Volatility is elevated around major resistance levels.
                  Friday recommends maintaining disciplined position sizing.
                </p>
              </div>
            </div>
          </section>

          {/* Action */}
          <button
            type="button"
            className="group flex w-full items-center justify-between rounded-2xl border border-[#DCE7DE] bg-white p-4 text-left shadow-[0_8px_30px_rgba(23,23,23,0.025)] transition-all hover:border-[#BFD3C5] hover:bg-[#FAFAF7]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F2D1F] text-white">
                <Eye size={15} />
              </div>

              <div>
                <div className="text-xs font-extrabold text-[#34342F]">
                  View full AI analysis
                </div>
                <div className="mt-0.5 text-[9px] text-[#9A998F]">
                  Open detailed intelligence report
                </div>
              </div>
            </div>

            <ChevronRight
              size={16}
              className="text-[#9A998F] transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>
      </div>

      {/* Bottom status */}
      <div className="mt-5 flex items-center justify-center gap-2 text-[9px] font-semibold text-[#A09F96]">
        <Sparkles size={11} />
        Friday Intelligence Engine · Vish Capitals
      </div>
    </DashboardShell>
  )
}