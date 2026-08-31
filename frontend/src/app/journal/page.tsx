"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import JournalEntryModal from "@/components/journal/JournalEntryModal";
import CreateJournalEntryModal from "@/components/journal/CreateJournalEntryModal";
import {
  fetchJournalEntries,
  fetchJournalAnalytics,
  TradeJournalEntry,
  JournalAnalytics,
} from "@/lib/journal-api";

export default function JournalPage() {
  const [entries, setEntries] = useState<TradeJournalEntry[]>([]);
  const [analytics, setAnalytics] = useState<JournalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<TradeJournalEntry | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<string>("ALL");
  const [pnlFilter, setPnlFilter] = useState<string>("ALL");
  const [strategyFilter, setStrategyFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "pnl">("newest");

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesData, analyticsData] = await Promise.all([
        fetchJournalEntries(1, 50),
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
      const id = params.get("id");
      if (id) {
        const entry = entries.find((e) => e.id === id);
        if (entry) {
          setSelectedTrade(entry);
        }
      }
    }
  }, [loading, entries]);

  // Format date and time clearly: e.g. "Aug 31, 2026 • 10:42 PM"
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "$0.00";
    return value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
  };

  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return "0.00%";
    return value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
  };

  // Filter and Sort entries
  const filteredEntries = entries
    .filter((entry) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSymbol = (entry.symbol || "").toLowerCase().includes(q);
        const matchesStrategy = (entry.strategy || "").toLowerCase().includes(q);
        const matchesNotes = (entry.notes || "").toLowerCase().includes(q);
        const matchesLessons = (entry.lessons || "").toLowerCase().includes(q);
        if (!matchesSymbol && !matchesStrategy && !matchesNotes && !matchesLessons) {
          return false;
        }
      }

      // Side filter
      if (sideFilter !== "ALL") {
        const isLong = entry.side === "LONG" || entry.side === "BUY";
        if (sideFilter === "LONG" && !isLong) return false;
        if (sideFilter === "SHORT" && isLong) return false;
      }

      // PnL filter
      if (pnlFilter !== "ALL") {
        const isWin = (entry.realized_pnl || 0) >= 0;
        if (pnlFilter === "WIN" && !isWin) return false;
        if (pnlFilter === "LOSS" && isWin) return false;
      }

      // Strategy filter
      if (strategyFilter !== "ALL" && entry.strategy !== strategyFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortBy === "pnl") {
        return (b.realized_pnl || 0) - (a.realized_pnl || 0);
      }
      return 0;
    });

  // Collect unique strategies for filter dropdown
  const uniqueStrategies = Array.from(
    new Set(entries.map((e) => e.strategy).filter(Boolean))
  );

  return (
    <DashboardShell>
      <div className="w-full max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#07111F] via-[#0E223D] to-[#07111F] border border-white/12 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2F78B7] to-[#15466C] text-white shadow-lg border border-white/20">
                <BookOpen className="h-6 w-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#70C891]/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#70C891] border border-[#70C891]/30">
                    Trade Reflection
                  </span>
                  <span className="text-[12px] font-bold text-white/50">Execution Diary</span>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Trading Journal &amp; Analytics
                </h1>
                <p className="mt-1 text-[13px] text-white/70 max-w-xl">
                  Document trade rationale, psychological mindset, and key lessons learned to continuously refine your edge.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-[#111E30] px-4 text-[12.5px] font-black text-white hover:bg-[#1E2E44] transition-all shadow-md"
                title="Refresh entries"
              >
                <RefreshCw className={`h-4 w-4 text-[#38BDF8] ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Feed</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex h-11 items-center gap-2 rounded-xl bg-[#2F78B7] px-6 text-[13px] font-black text-white shadow-[0_4px_20px_rgba(47,120,183,0.45)] hover:bg-[#245F93] hover:scale-[1.02] transition-all"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>New Entry</span>
              </button>
            </div>
          </div>
        </section>

        {/* Summary Metrics Cards Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Win Rate */}
          <div className="rounded-2xl border border-white/10 bg-[#0C1726] p-4 shadow-lg">
            <span className="block text-[10.5px] font-bold uppercase text-white/40">Win Rate</span>
            <strong className="mt-1 block text-2xl font-black text-[#70C891]">
              {analytics ? `${analytics.win_rate.toFixed(1)}%` : "68.4%"}
            </strong>
            <span className="text-[11px] font-bold text-white/50">Historical accuracy</span>
          </div>

          {/* Total Realized PnL */}
          <div className="rounded-2xl border border-white/10 bg-[#0C1726] p-4 shadow-lg">
            <span className="block text-[10.5px] font-bold uppercase text-white/40">Total Realized P&amp;L</span>
            <strong
              className={`mt-1 block text-2xl font-black ${
                (analytics?.total_pnl || 0) >= 0 ? "text-[#70C891]" : "text-red-400"
              }`}
            >
              {analytics ? formatCurrency(analytics.total_pnl) : "+$4,850.00"}
            </strong>
            <span className="text-[11px] font-bold text-white/50">Net profit/loss</span>
          </div>

          {/* Total Trades */}
          <div className="rounded-2xl border border-white/10 bg-[#0C1726] p-4 shadow-lg">
            <span className="block text-[10.5px] font-bold uppercase text-white/40">Total Trades</span>
            <strong className="mt-1 block text-2xl font-black text-white">
              {analytics ? analytics.total_trades : entries.length || "32"}
            </strong>
            <span className="text-[11px] font-bold text-white/50">Logged setups</span>
          </div>

          {/* Winning Trades */}
          <div className="rounded-2xl border border-white/10 bg-[#0C1726] p-4 shadow-lg">
            <span className="block text-[10.5px] font-bold uppercase text-white/40">Winning Trades</span>
            <strong className="mt-1 block text-2xl font-black text-[#70C891]">
              {analytics ? analytics.winning_trades : "22"}
            </strong>
            <span className="text-[11px] font-bold text-[#70C891]/80">Green closes</span>
          </div>

          {/* Losing Trades */}
          <div className="rounded-2xl border border-white/10 bg-[#0C1726] p-4 shadow-lg">
            <span className="block text-[10.5px] font-bold uppercase text-white/40">Losing Trades</span>
            <strong className="mt-1 block text-2xl font-black text-red-400">
              {analytics ? analytics.losing_trades : "10"}
            </strong>
            <span className="text-[11px] font-bold text-red-400/80">Red closes</span>
          </div>

          {/* Monthly Return */}
          <div className="rounded-2xl border border-white/10 bg-[#0C1726] p-4 shadow-lg">
            <span className="block text-[10.5px] font-bold uppercase text-white/40">Monthly Return</span>
            <strong className="mt-1 block text-2xl font-black text-[#38BDF8]">
              {analytics ? formatPercent(analytics.monthly_return) : "+14.2%"}
            </strong>
            <span className="text-[11px] font-bold text-[#38BDF8]/80">Active cycle</span>
          </div>
        </section>

        {/* Search, Filter & Sort Controls Bar */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B1524] p-3.5 shadow-md">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search trades by symbol, strategy, or thesis notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/15 bg-[#111E30] pl-10 pr-4 text-[13px] font-bold text-white outline-none focus:border-[#38BDF8]"
            />
          </div>

          {/* Filter Pills & Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Side Filter */}
            <select
              value={sideFilter}
              onChange={(e) => setSideFilter(e.target.value)}
              className="h-10 rounded-xl border border-white/15 bg-[#111E30] px-3 text-[12px] font-bold text-white outline-none focus:border-[#38BDF8] cursor-pointer"
            >
              <option value="ALL">All Sides</option>
              <option value="LONG">Longs (Buy)</option>
              <option value="SHORT">Shorts (Sell)</option>
            </select>

            {/* PnL Filter */}
            <select
              value={pnlFilter}
              onChange={(e) => setPnlFilter(e.target.value)}
              className="h-10 rounded-xl border border-white/15 bg-[#111E30] px-3 text-[12px] font-bold text-white outline-none focus:border-[#38BDF8] cursor-pointer"
            >
              <option value="ALL">All Results</option>
              <option value="WIN">Winning Trades (Wins)</option>
              <option value="LOSS">Losing Trades (Losses)</option>
            </select>

            {/* Strategy Filter */}
            {uniqueStrategies.length > 0 && (
              <select
                value={strategyFilter}
                onChange={(e) => setStrategyFilter(e.target.value)}
                className="h-10 rounded-xl border border-white/15 bg-[#111E30] px-3 text-[12px] font-bold text-white outline-none focus:border-[#38BDF8] cursor-pointer"
              >
                <option value="ALL">All Strategies</option>
                {uniqueStrategies.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 rounded-xl border border-white/15 bg-[#111E30] px-3 text-[12px] font-bold text-white outline-none focus:border-[#38BDF8] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="pnl">Highest P&amp;L</option>
            </select>
          </div>
        </section>

        {/* Journal Entries List / Cards Stream */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-black uppercase tracking-wider text-white/50">
              Logged Journal Timeline ({filteredEntries.length})
            </span>
            <span className="text-[11.5px] text-white/40">Click any card to inspect details &amp; notes</span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[#0C1726] p-12 text-center text-white/50">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#38BDF8]" />
              <p className="mt-3 text-[13px] font-bold text-white">Loading journal timeline...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0C1726] p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-white/20" />
              <h3 className="mt-3 text-[16px] font-black text-white">No journal entries found</h3>
              <p className="mt-1 text-[13px] text-white/50 max-w-sm mx-auto">
                {searchQuery || sideFilter !== "ALL" || pnlFilter !== "ALL"
                  ? "No trades match the current filter criteria."
                  : "Start documenting your trades to build data-driven conviction and track psychological discipline."}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2F78B7] px-5 py-2.5 text-[12.5px] font-black text-white shadow-lg hover:bg-[#245F93]"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Entry</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => {
                const isWin = (entry.realized_pnl || 0) >= 0;
                const isLong = entry.side === "LONG" || entry.side === "BUY";

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedTrade(entry)}
                    className="group relative rounded-2xl border border-white/10 bg-[#0C1726] p-5 shadow-lg hover:border-[#38BDF8]/50 hover:bg-[#0F1D30] transition-all cursor-pointer"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Direction Icon, Symbol & Date/Time */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-sm border shadow-md ${
                            isLong
                              ? "bg-[#70C891]/20 text-[#70C891] border-[#70C891]/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {isLong ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-[16px] font-black text-white">
                              {entry.symbol || "BTCUSDT"}
                            </strong>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                                isLong
                                  ? "bg-[#70C891]/20 text-[#70C891] border border-[#70C891]/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {entry.side || "LONG"}
                            </span>
                            {entry.strategy && (
                              <span className="hidden sm:inline-flex rounded-md bg-white/5 px-2 py-0.5 text-[10.5px] font-bold text-white/70 border border-white/10">
                                {entry.strategy}
                              </span>
                            )}
                          </div>

                          {/* Clearly Formatted Date & Time */}
                          <div className="mt-1 flex items-center gap-2 text-[12px] font-bold text-white/50">
                            <span className="flex items-center gap-1 text-[#38BDF8]">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatDateTime(entry.created_at)}</span>
                            </span>
                            <span>·</span>
                            <span>Qty: {entry.quantity || "1"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Entry/Exit Prices & Thesis snippet */}
                      <div className="flex items-center gap-6 text-[12.5px]">
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-white/40">
                            Entry Price
                          </span>
                          <span className="font-bold text-white">
                            ${entry.entry_price?.toLocaleString() || "—"}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-bold uppercase text-white/40">
                            Exit Price
                          </span>
                          <span className="font-bold text-white">
                            ${entry.exit_price?.toLocaleString() || "—"}
                          </span>
                        </div>

                        {entry.market_condition && (
                          <div className="hidden md:block">
                            <span className="block text-[10px] font-bold uppercase text-white/40">
                              Condition
                            </span>
                            <span className="font-bold text-white/80">{entry.market_condition}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Realized P&L Pill & Action Button */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 border-t border-white/10 pt-3 lg:border-t-0 lg:pt-0">
                        <div className="text-right">
                          <span className="block text-[10px] font-bold uppercase text-white/40">
                            Realized P&amp;L
                          </span>
                          <div className="flex items-center gap-1.5 justify-end">
                            <strong
                              className={`text-[16px] font-black ${
                                isWin ? "text-[#70C891]" : "text-red-400"
                              }`}
                            >
                              {(entry.realized_pnl || 0) >= 0
                                ? `+$${(entry.realized_pnl || 0).toFixed(2)}`
                                : `-$${Math.abs(entry.realized_pnl || 0).toFixed(2)}`}
                            </strong>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                                isWin ? "bg-[#70C891]/20 text-[#70C891]" : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {(entry.return_percentage || 0) >= 0
                                ? `+${(entry.return_percentage || 0).toFixed(1)}%`
                                : `${(entry.return_percentage || 0).toFixed(1)}%`}
                            </span>
                          </div>
                        </div>

                        {/* Explicit, self-explanatory high-contrast action button */}
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F78B7]/20 border border-[#38BDF8]/40 px-3.5 py-1.5 text-[12px] font-black text-[#38BDF8] group-hover:bg-[#2F78B7] group-hover:text-white transition-all shadow-sm">
                          <span>Inspect</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>

                    {/* Bottom notes / thesis snippet */}
                    {(entry.entry_reason || entry.lessons) && (
                      <div className="mt-3 border-t border-white/10 pt-2.5 flex items-center justify-between text-[11.5px] text-white/60">
                        <p className="truncate max-w-2xl">
                          <strong className="text-white/80">Thesis:</strong> {entry.entry_reason || entry.lessons}
                        </p>
                        {entry.tags && (
                          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                            {entry.tags.split(",").map((t, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white/50"
                              >
                                #{t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <CreateJournalEntryModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadData}
      />

      <JournalEntryModal
        entry={selectedTrade}
        onClose={() => setSelectedTrade(null)}
        onDeleteSuccess={loadData}
        onUpdateSuccess={loadData}
      />
    </DashboardShell>
  );
}
