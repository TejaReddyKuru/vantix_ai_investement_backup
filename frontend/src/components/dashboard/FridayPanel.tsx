"use client"

import {
  ArrowUpRight,
  BrainCircuit,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react"

type FridayPanelProps = {
  open: boolean
  onClose: () => void
}

const insights = [
  {
    label: "Market regime",
    value: "Constructive",
  },
  {
    label: "BTC momentum",
    value: "Strong",
  },
  {
    label: "Volatility",
    value: "Elevated",
  },
]

export default function FridayPanel({
  open,
  onClose,
}: FridayPanelProps) {
  if (!open) return null

  return (
    <>
      {/* Friday AI side panel */}
      <aside
        aria-label="Friday AI intelligence panel"
        className={[
          "fixed inset-y-0 right-0 z-[70] flex",
          "w-full sm:w-[400px] lg:w-[390px] xl:w-[410px]",
          "border-l border-[#DCE7DE]",
          "bg-[#F7F6E8]",
          "shadow-[-12px_0_40px_rgba(15,45,31,0.10)]",
          "animate-in slide-in-from-right duration-300",
        ].join(" ")}
      >
        <div className="flex min-h-0 w-full flex-col">

          {/* Header */}
          <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#E2E1D5] bg-[#F7F6E8] px-4 sm:px-5">

            <div className="flex items-center gap-3">

              {/* Friday icon */}
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2D1F] text-white shadow-[0_8px_24px_rgba(15,45,31,0.16)]">
                <Sparkles size={16} />

                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#F7F6E8] bg-[#65C18C]" />
              </div>

              {/* Friday identity */}
              <div>
                <div className="text-sm font-extrabold tracking-[-0.02em] text-[#171717]">
                  Friday AI
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#18794E]">

                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#65C18C] opacity-50" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-[#65C18C]" />
                  </span>

                  Intelligence online
                </div>
              </div>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Friday AI"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E1D5] bg-white text-[#55554F] transition-all duration-200 hover:border-[#C9D7CD] hover:bg-[#F1F5F0] hover:text-[#0F2D1F]"
            >
              <X size={17} />
            </button>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">

            {/* Intelligence hero */}
            <section className="overflow-hidden rounded-2xl border border-[#DCE7DE] bg-white shadow-[0_12px_35px_rgba(23,23,23,0.045)]">

              <div className="relative overflow-hidden p-5">

                {/* Decorative glow */}
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#E8F2EA] blur-3xl" />

                <div className="relative">

                  {/* Section label */}
                  <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8A897F]">
                    <BrainCircuit size={13} />
                    Market intelligence
                  </div>

                  {/* Main insight */}
                  <h2 className="mt-3 text-[21px] font-extrabold leading-tight tracking-[-0.035em] text-[#171717]">
                    The market looks constructive.
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#6B6B63]">
                    BTC continues to lead large-cap crypto assets.
                    Momentum remains positive, although volatility
                    is elevated near resistance.
                  </p>

                  {/* AI Score */}
                  <div className="mt-4 rounded-xl bg-[#F7F6E8] p-4">

                    <div className="flex items-center justify-between">

                      <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8A897F]">
                        Friday AI score
                      </span>

                      <span className="text-lg font-extrabold text-[#0F2D1F]">
                        87/100
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8E7DC]">
                      <div className="h-full w-[87%] rounded-full bg-[#0F2D1F]" />
                    </div>

                    <div className="mt-2 flex justify-between text-[8px] font-semibold text-[#AAA99F]">
                      <span>BEARISH</span>
                      <span>NEUTRAL</span>
                      <span>BULLISH</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Signals */}
            <section className="mt-4 rounded-2xl border border-[#E2E1D5] bg-white p-4 shadow-[0_8px_28px_rgba(23,23,23,0.025)]">

              <div className="flex items-center justify-between">

                <div>
                  <div className="text-sm font-extrabold text-[#171717]">
                    Market signals
                  </div>

                  <div className="mt-1 text-[10px] text-[#55554F]">
                    Current intelligence snapshot
                  </div>
                </div>

                <span className="rounded-full bg-[#E8F2EA] px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wide text-[#18794E]">
                  Updated
                </span>
              </div>

              <div className="mt-4 space-y-2">

                {insights.map((insight) => (
                  <div
                    key={insight.label}
                    className="group flex items-center justify-between rounded-xl border border-transparent bg-[#FAFAF7] px-3.5 py-3 transition-all duration-200 hover:border-[#DCE7DE] hover:bg-[#F7F9F5]"
                  >
                    <span className="text-xs font-semibold text-[#6B6B63]">
                      {insight.label}
                    </span>

                    <span className="flex items-center gap-2 text-xs font-extrabold text-[#0F2D1F]">

                      <span className="h-1.5 w-1.5 rounded-full bg-[#65C18C]" />

                      {insight.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommendation */}
            <section className="relative mt-4 overflow-hidden rounded-2xl border border-[#CFE0D3] bg-[#E8F2EA] p-5">

              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/30 blur-2xl" />

              <div className="relative">

                <div className="flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0F2D1F]">
                    <Sparkles size={14} />
                  </div>

                  <div className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#18794E]">
                    Friday&apos;s view
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold leading-6 text-[#0F2D1F]">
                  Focus on position sizing and risk controls before
                  adding exposure around resistance.
                </p>

                <button
                  type="button"
                  className="mt-4 flex items-center gap-1.5 rounded-lg text-xs font-extrabold text-[#0F2D1F] transition-all duration-200 hover:gap-2.5"
                >
                  View detailed analysis
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </section>

          </div>

          {/* Bottom action */}
          <div className="shrink-0 border-t border-[#E2E1D5] bg-[#F7F6E8] p-4">

            <button
              type="button"
              className="group flex w-full items-center justify-between rounded-xl bg-[#0F2D1F] px-4 py-3.5 text-xs font-extrabold text-white shadow-[0_10px_28px_rgba(15,45,31,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#17452F]"
            >
              <span>
                Ask Friday anything
              </span>

              <ChevronRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </button>
          </div>

        </div>
      </aside>
    </>
  )
}
