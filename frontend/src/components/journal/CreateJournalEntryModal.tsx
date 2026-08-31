"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BarChart2,
  BookOpen,
  BrainCircuit,
  Calendar,
  Check,
  Clock,
  DollarSign,
  FileText,
  Heart,
  Layers,
  Plus,
  Smile,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { createJournalEntry, TradeJournalEntry } from "@/lib/journal-api";

interface CreateJournalEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TabKey = "details" | "analysis" | "reflection" | "notes";

const STRATEGIES = [
  "AHNA AI Deliberation",
  "Breakout & Retest",
  "Trend Following",
  "Support / Resistance Bounce",
  "Mean Reversion",
  "Liquidity Sweep",
  "Scalp Momentum",
];

const MARKET_CONDITIONS = [
  "Bullish Strong Trend",
  "Bearish Trend",
  "Range-Bound / Consolidation",
  "High Volatility",
  "Pre-Catalyst / Low Volume",
];

const EMOTIONAL_STATES = [
  "Disciplined & Calm",
  "Confident",
  "Patient",
  "FOMO / Rushed",
  "Hesitant",
  "Anxious / Stressed",
];

export default function CreateJournalEntryModal({
  open,
  onClose,
  onSuccess,
}: CreateJournalEntryModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<TradeJournalEntry>>({
    symbol: "BTCUSDT",
    side: "LONG",
    status: "CLOSED",
    entry_price: undefined,
    exit_price: undefined,
    quantity: undefined,
    strategy: "AHNA AI Deliberation",
    market_condition: "Bullish Strong Trend",
    entry_reason: "",
    trade_thesis: "",
    what_went_well: "",
    what_went_wrong: "",
    lessons: "",
    notes: "",
    tags: "crypto, ahna",
  });

  const [selectedEmotion, setSelectedEmotion] = useState("Disciplined & Calm");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  // Calculate projected P&L
  const entryPrice = formData.entry_price || 0;
  const exitPrice = formData.exit_price || 0;
  const qty = formData.quantity || 0;
  let estimatedPnl = 0;
  let estimatedReturn = 0;

  if (entryPrice > 0 && exitPrice > 0 && qty > 0) {
    if (formData.side === "LONG") {
      estimatedPnl = (exitPrice - entryPrice) * qty;
      estimatedReturn = ((exitPrice - entryPrice) / entryPrice) * 100;
    } else {
      estimatedPnl = (entryPrice - exitPrice) * qty;
      estimatedReturn = ((entryPrice - exitPrice) / entryPrice) * 100;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol) {
      alert("Please specify an asset symbol.");
      return;
    }

    setSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const payload: Partial<TradeJournalEntry> = {
        ...formData,
        realized_pnl: estimatedPnl,
        return_percentage: estimatedReturn,
        entry_timestamp: formData.entry_timestamp || nowIso,
        exit_timestamp: nowIso,
        title: `${formData.side} ${formData.symbol} (${selectedEmotion})`,
        lessons: formData.lessons ? `${formData.lessons} [Emotion: ${selectedEmotion}]` : `[Emotion: ${selectedEmotion}]`,
      };

      await createJournalEntry(payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create journal entry:", error);
      alert("Failed to save journal entry. Please ensure backend is online.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-[#0B1524] border border-white/15 p-0 text-white shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#07111F]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F78B7]/20 text-[#38BDF8] border border-[#2F78B7]/30">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-[17px] font-black text-white">
                  New Journal Entry
                </Dialog.Title>
                <p className="text-[11.5px] text-white/50">
                  Record trade execution, psychology, and lessons learned.
                </p>
              </div>
            </div>

            <Dialog.Close className="rounded-xl border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-[#07111F]/60 px-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[12.5px] font-black transition-colors ${
                activeTab === "details"
                  ? "border-[#38BDF8] text-[#38BDF8]"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>1. Trade Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("analysis")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[12.5px] font-black transition-colors ${
                activeTab === "analysis"
                  ? "border-[#38BDF8] text-[#38BDF8]"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              <BrainCircuit className="h-4 w-4" />
              <span>2. Analysis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reflection")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[12.5px] font-black transition-colors ${
                activeTab === "reflection"
                  ? "border-[#38BDF8] text-[#38BDF8]"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              <Smile className="h-4 w-4" />
              <span>3. Reflection</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[12.5px] font-black transition-colors ${
                activeTab === "notes"
                  ? "border-[#38BDF8] text-[#38BDF8]"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              <Tag className="h-4 w-4" />
              <span>4. Notes &amp; Tags</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* TAB 1: TRADE DETAILS */}
            {activeTab === "details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                      Asset Symbol
                    </label>
                    <input
                      type="text"
                      name="symbol"
                      required
                      value={formData.symbol}
                      onChange={handleChange}
                      placeholder="e.g. BTCUSDT, ETHUSDT"
                      className="h-10 w-full rounded-xl border border-white/15 bg-[#111E30] px-3.5 text-[13px] font-bold text-white outline-none focus:border-[#38BDF8]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                      Direction / Side
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, side: "LONG" })}
                        className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[12px] font-black border transition-all ${
                          formData.side === "LONG"
                            ? "bg-[#70C891]/25 text-[#70C891] border-[#70C891]"
                            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <TrendingUp className="h-4 w-4" />
                        <span>BUY / LONG</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, side: "SHORT" })}
                        className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[12px] font-black border transition-all ${
                          formData.side === "SHORT"
                            ? "bg-red-500/25 text-red-400 border-red-500"
                            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <TrendingDown className="h-4 w-4" />
                        <span>SELL / SHORT</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                      Entry Price ($)
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="entry_price"
                      required
                      value={formData.entry_price || ""}
                      onChange={handleChange}
                      placeholder="e.g. 64250"
                      className="h-10 w-full rounded-xl border border-white/15 bg-[#111E30] px-3.5 text-[13px] font-bold text-white outline-none focus:border-[#38BDF8]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                      Exit Price ($)
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="exit_price"
                      value={formData.exit_price || ""}
                      onChange={handleChange}
                      placeholder="e.g. 66400"
                      className="h-10 w-full rounded-xl border border-white/15 bg-[#111E30] px-3.5 text-[13px] font-bold text-white outline-none focus:border-[#38BDF8]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="quantity"
                      required
                      value={formData.quantity || ""}
                      onChange={handleChange}
                      placeholder="e.g. 0.5"
                      className="h-10 w-full rounded-xl border border-white/15 bg-[#111E30] px-3.5 text-[13px] font-bold text-white outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                </div>

                {/* Live P&L Preview Banner */}
                {entryPrice > 0 && exitPrice > 0 && qty > 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-white/50">
                        Calculated Realized P&amp;L
                      </span>
                      <strong
                        className={`text-lg font-black ${
                          estimatedPnl >= 0 ? "text-[#70C891]" : "text-red-400"
                        }`}
                      >
                        {estimatedPnl >= 0 ? `+$${estimatedPnl.toFixed(2)}` : `-$${Math.abs(estimatedPnl).toFixed(2)}`}
                      </strong>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-black ${
                        estimatedReturn >= 0 ? "bg-[#70C891]/20 text-[#70C891]" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {estimatedReturn >= 0 ? `+${estimatedReturn.toFixed(2)}%` : `${estimatedReturn.toFixed(2)}%`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TRADE ANALYSIS */}
            {activeTab === "analysis" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                      Strategy Used
                    </label>
                    <select
                      name="strategy"
                      value={formData.strategy}
                      onChange={handleChange}
                      className="h-10 w-full rounded-xl border border-white/15 bg-[#111E30] px-3 text-[12.5px] font-bold text-white outline-none focus:border-[#38BDF8]"
                    >
                      {STRATEGIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                      Market Condition
                    </label>
                    <select
                      name="market_condition"
                      value={formData.market_condition}
                      onChange={handleChange}
                      className="h-10 w-full rounded-xl border border-white/15 bg-[#111E30] px-3 text-[12.5px] font-bold text-white outline-none focus:border-[#38BDF8]"
                    >
                      {MARKET_CONDITIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                    Reason for Entering (Trade Thesis)
                  </label>
                  <textarea
                    name="entry_reason"
                    rows={2}
                    value={formData.entry_reason}
                    onChange={handleChange}
                    placeholder="e.g. 4h EMA crossover, RSI divergence, breakout retest confirmed with AHNA 85% confidence score."
                    className="w-full rounded-xl border border-white/15 bg-[#111E30] p-3 text-[13px] font-medium text-white outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                    Reason for Exiting (Take-Profit or Stop-Loss)
                  </label>
                  <textarea
                    name="trade_thesis"
                    rows={2}
                    value={formData.trade_thesis}
                    onChange={handleChange}
                    placeholder="e.g. Hit predetermined 2.5R target at resistance wall / Stopped out when support invalidated."
                    className="w-full rounded-xl border border-white/15 bg-[#111E30] p-3 text-[13px] font-medium text-white outline-none focus:border-[#38BDF8]"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: REFLECTION */}
            {activeTab === "reflection" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                    Psychological &amp; Emotional State
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EMOTIONAL_STATES.map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => setSelectedEmotion(emo)}
                        className={`rounded-xl border p-2.5 text-left text-[11.5px] font-black transition-all ${
                          selectedEmotion === emo
                            ? "border-[#38BDF8] bg-[#38BDF8]/20 text-[#38BDF8]"
                            : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
                        }`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-[#70C891]">
                      What Went Well?
                    </label>
                    <textarea
                      name="what_went_well"
                      rows={2}
                      value={formData.what_went_well}
                      onChange={handleChange}
                      placeholder="e.g. Followed risk rules, waited for 15m candle close."
                      className="w-full rounded-xl border border-white/15 bg-[#111E30] p-3 text-[12.5px] font-medium text-white outline-none focus:border-[#70C891]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-red-400">
                      What Went Wrong?
                    </label>
                    <textarea
                      name="what_went_wrong"
                      rows={2}
                      value={formData.what_went_wrong}
                      onChange={handleChange}
                      placeholder="e.g. Slightly overleveraged, entered 2 minutes before news drop."
                      className="w-full rounded-xl border border-white/15 bg-[#111E30] p-3 text-[12.5px] font-medium text-white outline-none focus:border-red-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-[#FFEA93]">
                    Key Lesson Learned
                  </label>
                  <textarea
                    name="lessons"
                    rows={2}
                    value={formData.lessons}
                    onChange={handleChange}
                    placeholder="e.g. Always check economic calendar before placing breakout orders."
                    className="w-full rounded-xl border border-white/15 bg-[#111E30] p-3 text-[12.5px] font-medium text-white outline-none focus:border-[#FFEA93]"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: NOTES & TAGS */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                    Additional Observations &amp; Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="e.g. Market spread was wider than usual during execution..."
                    className="w-full rounded-xl border border-white/15 bg-[#111E30] p-3 text-[13px] font-medium text-white outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/60">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g. btc, breakout, ahna, scalp"
                    className="h-10 w-full rounded-xl border border-white/15 bg-[#111E30] px-3.5 text-[13px] font-bold text-white outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div className="rounded-xl bg-white/[0.04] p-3 border border-white/10 text-[11px] text-white/50 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#38BDF8] shrink-0" />
                  <span>Entry timestamp will be auto-generated upon saving.</span>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <div className="text-[11.5px] text-white/50">
                Step {activeTab === "details" ? "1" : activeTab === "analysis" ? "2" : activeTab === "reflection" ? "3" : "4"} of 4
              </div>

              <div className="flex items-center gap-2">
                {activeTab !== "details" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "notes") setActiveTab("reflection");
                      else if (activeTab === "reflection") setActiveTab("analysis");
                      else if (activeTab === "analysis") setActiveTab("details");
                    }}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-bold text-white hover:bg-white/10"
                  >
                    Back
                  </button>
                )}

                {activeTab !== "notes" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "details") setActiveTab("analysis");
                      else if (activeTab === "analysis") setActiveTab("reflection");
                      else if (activeTab === "reflection") setActiveTab("notes");
                    }}
                    className="rounded-xl bg-[#2F78B7] px-5 py-2 text-[12px] font-black text-white hover:bg-[#245F93]"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 rounded-xl bg-[#70C891] px-5 py-2 text-[12px] font-black text-black shadow-lg hover:bg-[#5bb87e] transition-all disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    <span>{submitting ? "Saving..." : "Complete & Save Entry"}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
