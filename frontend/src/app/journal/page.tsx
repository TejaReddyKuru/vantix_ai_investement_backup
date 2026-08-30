"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import JournalEntryModal from "@/components/journal/JournalEntryModal";
import CreateJournalEntryModal from "@/components/journal/CreateJournalEntryModal";
import { fetchJournalEntries, fetchJournalAnalytics, TradeJournalEntry, JournalAnalytics } from "@/lib/journal-api";

export default function JournalPage() {
  const [entries, setEntries] = useState<TradeJournalEntry[]>([]);
  const [analytics, setAnalytics] = useState<JournalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<TradeJournalEntry | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesData, analyticsData] = await Promise.all([
        fetchJournalEntries(1, 25),
        fetchJournalAnalytics(),
      ]);
      setEntries(entriesData.items || []);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading journal data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check URL for specific trade to open
  useEffect(() => {
    if (!loading && entries.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        const entry = entries.find(e => e.id === id);
        if (entry) {
          setSelectedTrade(entry);
        }
      }
    }
  }, [loading, entries]);

  const formatCurrency = (value: number) => {
    return value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    return value >= 0 ? `+${value.toFixed(2)}%` : `-${Math.abs(value).toFixed(2)}%`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
  };

  const statistics = analytics ? [
    {
      label: "Win rate",
      value: `${analytics.win_rate.toFixed(1)}%`,
      change: "",
      icon: Target,
      positive: true
    },
    {
      label: "Total trades",
      value: `${analytics.total_trades}`,
      change: "",
      icon: BarChart3,
      positive: true
    },
    {
      label: "Average return",
      value: formatPercent(analytics.average_return),
      change: "",
      icon: TrendingUp,
      positive: analytics.average_return >= 0
    },
    {
      label: "Best trade",
      value: analytics.best_trade ? formatPercent(analytics.best_trade.return_percentage || 0) : "-",
      change: analytics.best_trade?.symbol || "",
      icon: ArrowUpRight,
      positive: true
    },
  ] : [
    { label: "Win rate", value: "-", change: "", icon: Target, positive: true },
    { label: "Total trades", value: "-", change: "", icon: BarChart3, positive: true },
    { label: "Average return", value: "-", change: "", icon: TrendingUp, positive: true },
    { label: "Best trade", value: "-", change: "", icon: ArrowUpRight, positive: true },
  ];

  return (
    <DashboardShell>
      {/* Header */}
      <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8A897F]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#18794E]/40" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-[#18794E]" />
            </span>
            Trading journal
          </div>

          <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#07111F] sm:text-4xl">
            Trade Journal
          </h1>

          <p className="mt-2 max-w-[680px] text-sm leading-6 text-[#77776F]">
            Review your trading decisions, analyze performance patterns and
            build a more disciplined trading process.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#2F78B7] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(15,45,31,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#245F93]"
        >
          <Plus size={15} />
          New journal entry
        </button>
      </section>

      {/* Statistics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="group relative overflow-hidden rounded-xl border border-[#E3E2D9] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D1DCD3] hover:shadow-[0_18px_40px_rgba(23,23,23,0.07)]"
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#EEF4FA] opacity-60 blur-2xl" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FA] text-[#2F78B7]">
                  <Icon size={17} />
                </div>

                {stat.change && (
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${stat.positive ? 'bg-[#EEF4FA] text-[#18794E]' : 'bg-[#FAEEEE] text-[#A04D4D]'}`}>
                    {stat.change}
                  </span>
                )}
              </div>

              <div className="relative mt-5 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#9A998F]">
                {stat.label}
              </div>

              <div className="relative mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#07111F]">
                {loading ? "Loading..." : stat.value}
              </div>
            </article>
          );
        })}
      </section>

      {/* Main content */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          {/* Filters */}
          <section className="rounded-xl border border-[#E3E2D9] bg-white p-4 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
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
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] px-3 text-[12px] font-extrabold text-[#55554F] transition-colors hover:border-[#BFD3C5] hover:text-[#2F78B7]"
              >
                <CalendarDays size={14} />
                Last 30 days
              </button>

              <button
                type="button"
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] px-3 text-[12px] font-extrabold text-[#55554F] transition-colors hover:border-[#BFD3C5] hover:text-[#2F78B7]"
              >
                <Filter size={14} />
                Filters
              </button>
            </div>
          </section>

          {/* Entries */}
          <section className="overflow-hidden rounded-xl border border-[#E3E2D9] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-center justify-between border-b border-[#ECECE4] p-5 sm:p-6">
              <div>
                <h2 className="text-sm font-extrabold text-[#07111F]">
                  Recent trades
                </h2>

                <p className="mt-1 text-[12px] text-[#9A998F]">
                  Your latest journal activity
                </p>
              </div>

              <span className="rounded-md bg-[#F5F5EF] px-2.5 py-1 text-[12px] font-extrabold text-[#8A897F]">
                {loading ? "-" : entries.length} total
              </span>
            </div>

            <div className="divide-y divide-[#F0F0EA]">
              {loading ? (
                <div className="p-8 text-center text-sm text-[#9A998F]">Loading...</div>
              ) : entries.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#9A998F]">No completed trades yet.</div>
              ) : (
                entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="group p-5 transition-colors hover:bg-[#FAFAF7] sm:p-6"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F1E9] text-[11px] font-extrabold text-[#34342F] transition-colors group-hover:bg-[#EEF4FA] group-hover:text-[#2F78B7]">
                            {entry.symbol?.slice(0, 2) || "NA"}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xs font-extrabold text-[#34342F]">
                                {entry.symbol}
                              </h3>

                              <span
                                className={[
                                  "rounded-full px-2 py-0.5 text-[12px] font-extrabold",
                                  entry.side === "LONG"
                                    ? "bg-[#EEF4FA] text-[#18794E]"
                                    : "bg-[#F3F0E5] text-[#8A897F]",
                                ].join(" ")}
                              >
                                {entry.side}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#9A998F]">
                              <span>{entry.strategy || "No strategy"}</span>
                              <span>•</span>
                              <span>{formatDate(entry.exit_timestamp || entry.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={[
                              "text-sm font-extrabold tabular-nums",
                              (entry.realized_pnl || 0) >= 0
                                ? "text-[#18794E]"
                                : "text-[#A04D4D]",
                            ].join(" ")}
                          >
                            {formatCurrency(entry.realized_pnl || 0)}
                          </div>

                          <div
                            className={[
                              "mt-0.5 text-[11px] font-extrabold",
                              (entry.return_percentage || 0) >= 0
                                ? "text-[#18794E]"
                                : "text-[#A04D4D]",
                            ].join(" ")}
                          >
                            {formatPercent(entry.return_percentage || 0)}
                          </div>
                        </div>
                      </div>

                      <p className="max-w-[760px] text-[12px] leading-5 text-[#6D6D65]">
                        {entry.notes || entry.trade_thesis || "No notes available."}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9A998F]">
                            <Clock3 size={12} />
                            {formatDuration(entry.duration_seconds || 0)}
                          </div>

                          <div
                            className={[
                              "flex items-center gap-1.5 text-[11px] font-extrabold",
                              (entry.realized_pnl || 0) >= 0
                                ? "text-[#18794E]"
                                : "text-[#A04D4D]",
                            ].join(" ")}
                          >
                            {(entry.realized_pnl || 0) >= 0 ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            {(entry.realized_pnl || 0) >= 0 ? "Win" : "Loss"}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedTrade(entry)}
                          className="flex items-center gap-1 text-[11px] font-extrabold text-[#2F78B7] opacity-80 transition-all group-hover:opacity-100"
                        >
                          View journal
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="border-t border-[#ECECE4] p-4">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E5E6DE] py-2.5 text-[12px] font-extrabold text-[#2F78B7] transition-all hover:border-[#C9D7CD] hover:bg-[#FAFAF7]"
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
          <section className="rounded-xl border border-[#E3E2D9] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div>
              <h2 className="text-sm font-extrabold text-[#07111F]">
                Journal performance
              </h2>

              <p className="mt-1 text-[12px] text-[#9A998F]">
                Trading results this month
              </p>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-3xl font-extrabold tracking-[-0.04em] text-[#07111F]">
                  {loading ? "-" : formatPercent(analytics?.monthly_return || 0)}
                </div>

                <div className={`mt-1 flex items-center gap-1 text-[11px] font-extrabold ${(analytics?.monthly_return || 0) >= (analytics?.monthly_target || 0) ? 'text-[#18794E]' : 'text-[#A04D4D]'}`}>
                  {(analytics?.monthly_return || 0) >= (analytics?.monthly_target || 0) ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {(analytics?.monthly_return || 0) >= (analytics?.monthly_target || 0) ? "Above monthly target" : "Below monthly target"}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-bold text-[#9A998F]">
                  Target
                </div>

                <div className="mt-1 text-xs font-extrabold text-[#34342F]">
                  {formatPercent(analytics?.monthly_target || 0)}
                </div>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#E8E9E1]">
              <div 
                className="h-full rounded-full bg-[#2F78B7]" 
                style={{ width: `${Math.min(100, Math.max(0, ((analytics?.monthly_return || 0) / (analytics?.monthly_target || 1)) * 100))}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[12px] font-bold text-[#AAA99F]">
              <span>0%</span>
              <span>Monthly target</span>
            </div>
          </section>

          {/* Strategy breakdown */}
          <section className="rounded-xl border border-[#E3E2D9] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div>
              <h2 className="text-sm font-extrabold text-[#07111F]">
                Strategy breakdown
              </h2>

              <p className="mt-1 text-[12px] text-[#9A998F]">
                Performance by strategy
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                 <div className="text-[12px] text-[#9A998F] text-center py-4">Loading...</div>
              ) : (!analytics?.strategy_breakdown || analytics.strategy_breakdown.length === 0) ? (
                 <div className="text-[12px] text-[#9A998F] text-center py-4">No strategies recorded yet.</div>
              ) : (
                analytics.strategy_breakdown.map((strat: any) => (
                  <div key={strat.strategy}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-extrabold text-[#4C4C46]">
                        {strat.strategy || "Unknown"}
                      </span>

                      <span className={`text-[11px] font-extrabold ${strat.total_pnl >= 0 ? 'text-[#18794E]' : 'text-[#A04D4D]'}`}>
                        {formatPercent(strat.average_return || 0)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8E9E1]">
                        <div
                          className={`h-full rounded-full ${strat.win_rate >= 50 ? 'bg-[#79A98A]' : 'bg-[#D48989]'}`}
                          style={{ width: `${strat.win_rate || 0}%` }}
                        />
                      </div>

                      <span className="w-8 text-right text-[12px] font-bold text-[#9A998F]">
                        {strat.win_rate?.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Discipline */}
          <section className="relative overflow-hidden rounded-xl border border-[#D7E4EF] bg-[#EEF4FA] p-5">
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/60 blur-3xl" />

            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2F78B7] shadow-sm">
                <BookOpen size={18} />
              </div>

              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#18794E]">
                  Trading discipline
                </div>

                <h2 className="mt-0.5 text-sm font-extrabold text-[#07111F]">
                  {loading ? "-" : (analytics?.discipline_score || 0) >= 80 ? "Excellent consistency" : (analytics?.discipline_score || 0) >= 50 ? "Average consistency" : "Needs improvement"}
                </h2>
              </div>
            </div>

            <p className="relative mt-4 text-xs leading-5 text-[#617168]">
              You followed your predefined risk rules on {loading ? "-" : analytics?.discipline_score || 0}% of trades this month.
            </p>

            <div className="relative mt-4 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#718178]">
                Discipline score
              </span>

              <span className="text-sm font-extrabold text-[#2F78B7]">
                {loading ? "-" : `${analytics?.discipline_score || 0}/100`}
              </span>
            </div>

            <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
              <div 
                className="h-full rounded-full bg-[#2F78B7]" 
                style={{ width: `${analytics?.discipline_score || 0}%` }}
              />
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-xl border border-[#E3E2D9] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1F1E9] text-[#2F78B7]">
                <FileText size={16} />
              </div>

              <div>
                <h2 className="text-sm font-extrabold text-[#07111F]">
                  Journal habit
                </h2>

                <p className="mt-0.5 text-[11px] text-[#9A998F]">
                  Keep documenting every decision
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#FAFAF7] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9A998F]">
                  Entries this month
                </span>

                <span className="text-sm font-extrabold text-[#34342F]">
                  {loading ? "-" : analytics?.total_trades || 0}
                </span>
              </div>

              <div className="mt-3 flex gap-1 overflow-hidden">
                {Array.from({ length: Math.max(7, Math.min(30, analytics?.total_trades || 0)) }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-5 flex-1 rounded-sm ${index < (analytics?.total_trades || 0) ? 'bg-[#79A98A]' : 'bg-[#E5E6DE]'}`}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#A09F96]">
        <BookOpen size={11} />
        CoinCrest Trading Journal
      </div>
      
      <JournalEntryModal 
        entry={selectedTrade} 
        onClose={() => setSelectedTrade(null)} 
        onDeleteSuccess={loadData}
      />
      <CreateJournalEntryModal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={loadData} 
      />
    </DashboardShell>
  );
}
