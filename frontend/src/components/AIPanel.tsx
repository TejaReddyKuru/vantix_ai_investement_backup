"use client"

import { Bot, ChevronRight, Send, Sparkles } from "lucide-react"
import { AI_NAME } from "../constants/theme"

const suggestions = [
  "What is moving the market?",
  "Analyze my portfolio",
  "Find high momentum setups",
]

export default function AIPanel() {
  return (
    <aside className="hidden w-[330px] shrink-0 border-l border-[var(--border)] bg-white xl:flex xl:flex-col">
      <div className="flex h-[76px] items-center justify-between border-b border-[var(--border)] px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-mint)]">
            <Sparkles size={19} />
          </div>

          <div>
            <div className="text-sm font-extrabold">{AI_NAME}</div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--positive)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--positive)]" />
              AI online
            </div>
          </div>
        </div>

        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[#F7F7F2]">
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-6 flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
            <Bot size={15} />
          </div>

          <div className="rounded-2xl rounded-tl-md bg-[var(--surface-mint)] px-4 py-3 text-sm leading-6">
            <div className="mb-1 font-bold">
              Good to see you.
            </div>

            <p className="text-[var(--muted)]">
              I&apos;m Friday, your AI trading assistant. I can analyze markets,
              review risk, explain setups, and help you make better trading
              decisions.
            </p>
          </div>
        </div>

        <div className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
          Try asking
        </div>

        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-left text-xs font-semibold transition hover:border-[#C8E6C9] hover:bg-[var(--surface-mint)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[#FAFAF7] p-2">
          <textarea
            rows={2}
            placeholder="Ask Friday anything..."
            className="min-h-[52px] flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-[#A2A198]"
          />

          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white transition hover:opacity-85"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>

        <div className="mt-2 text-center text-[9px] font-medium text-[var(--muted)]">
          Friday can make mistakes. Verify important trading decisions.
        </div>
      </div>
    </aside>
  )
}
