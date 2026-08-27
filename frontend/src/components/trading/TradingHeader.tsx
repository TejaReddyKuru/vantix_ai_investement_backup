"use client"

import {
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  FlaskConical,
  Radio,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"
import {
  useTradingMode,
  type TradingMode,
} from "@/context/TradingModeContext"

interface TradingHeaderProps {
  onModeChange?: (mode: TradingMode) => void
}

export default function TradingHeader({
  onModeChange,
}: TradingHeaderProps) {
  const { mode, setMode, isLive } = useTradingMode()
  const [open, setOpen] = useState(false)

  const changeMode = (newMode: TradingMode) => {
    setMode(newMode)
    setOpen(false)
    onModeChange?.(newMode)
  }

  return (
    <header className="relative z-40 flex min-h-[72px] w-full items-center justify-between border-b border-[#E2E1D5] bg-[#F7F6E8] px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9D8CA] bg-white">
          <BarChart3 className="h-5 w-5 text-[#22231F]" />
        </div>

        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[#22231F]">
            Trading Workstation
          </h1>

          <p className="text-xs text-[#77786F]">
            Execute, monitor and manage your trades
          </p>
        </div>
      </div>

      {/* Center — Trading Mode */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={`flex min-w-[190px] items-center justify-between gap-4 rounded-xl border px-4 py-2.5 transition ${
            isLive
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isLive ? "bg-red-100" : "bg-amber-100"
              }`}
            >
              {isLive ? (
                <Radio className="h-4 w-4 text-red-600" />
              ) : (
                <FlaskConical className="h-4 w-4 text-amber-600" />
              )}
            </span>

            <div className="text-left">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#77786F]">
                Trading Mode
              </p>

              <p
                className={`text-sm font-semibold ${
                  isLive ? "text-red-700" : "text-amber-700"
                }`}
              >
                {isLive ? "Live Trading" : "Paper Trading"}
              </p>
            </div>
          </div>

          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close trading mode menu"
              className="fixed inset-0 z-[-1] cursor-default"
              onClick={() => setOpen(false)}
            />

            <div
              role="menu"
              className="absolute left-0 top-[calc(100%+8px)] z-50 w-[300px] overflow-hidden rounded-2xl border border-[#D9D8CA] bg-white p-2 shadow-xl"
            >
              {/* Paper */}
              <button
                type="button"
                role="menuitem"
                onClick={() => changeMode("paper")}
                className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                  mode === "paper"
                    ? "bg-amber-50"
                    : "hover:bg-[#F7F6E8]"
                }`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <FlaskConical className="h-4 w-4 text-amber-600" />
                </span>

                <span>
                  <span className="block text-sm font-semibold text-[#22231F]">
                    Paper Trading
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#77786F]">
                    Practice trades using simulated funds. No real money is
                    involved.
                  </span>
                </span>
              </button>

              {/* Live */}
              <button
                type="button"
                role="menuitem"
                onClick={() => changeMode("live")}
                className={`mt-1 flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                  mode === "live"
                    ? "bg-red-50"
                    : "hover:bg-[#F7F6E8]"
                }`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
                  <Radio className="h-4 w-4 text-red-600" />
                </span>

                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#22231F]">
                    Live Trading

                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-700">
                      Real Money
                    </span>
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#77786F]">
                    Execute real trades through your connected exchange.
                  </span>
                </span>
              </button>

              {/* Safety */}
              <div className="mt-2 flex items-start gap-2 rounded-xl bg-[#F7F6E8] p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#5F604F]" />

                <p className="text-[10px] leading-4 text-[#77786F]">
                  Live trading should only be enabled after an exchange
                  account and trading permissions are configured.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-[#D9D8CA] bg-white px-3 py-2 md:flex">
          <CircleDollarSign className="h-4 w-4 text-[#77786F]" />

          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#999A91]">
              Account
            </p>

            <p className="text-xs font-semibold text-[#22231F]">
              {isLive ? "Live Account" : "Paper Account"}
            </p>
          </div>
        </div>

        <div
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
            isLive
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {isLive ? "LIVE" : "PAPER"}
        </div>
      </div>
    </header>
  )
}