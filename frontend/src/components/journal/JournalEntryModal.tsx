"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  Layers,
  MessageSquare,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { TradeJournalEntry, addJournalObservation, deleteJournalEntry, updateJournalEntry } from "@/lib/journal-api";

interface JournalEntryModalProps {
  entry: TradeJournalEntry | null;
  onClose: () => void;
  onDeleteSuccess?: () => void;
  onUpdateSuccess?: () => void;
}

export default function JournalEntryModal({
  entry,
  onClose,
  onDeleteSuccess,
  onUpdateSuccess,
}: JournalEntryModalProps) {
  const [observation, setObservation] = useState("");
  const [submittingObs, setSubmittingObs] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localObservations, setLocalObservations] = useState(entry?.observations || []);

  // Inline edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState(entry?.notes || "");
  const [editLessons, setEditLessons] = useState(entry?.lessons || "");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  if (!entry) return null;

  const isWin = (entry.realized_pnl || 0) >= 0;
  const isLong = entry.side === "LONG" || entry.side === "BUY";

  // Format date and time clearly: e.g. "Aug 31, 2026 • 10:42 PM"
  const formattedDateTime = entry.created_at
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(new Date(entry.created_at))
    : "Recent Entry";

  const handleAddObservation = async () => {
    if (!observation.trim()) return;
    setSubmittingObs(true);
    try {
      const newObs = await addJournalObservation(entry.id, observation);
      setLocalObservations([...localObservations, newObs]);
      setObservation("");
    } catch (error) {
      alert("Failed to add observation.");
    } finally {
      setSubmittingObs(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      await updateJournalEntry(entry.id, {
        notes: editNotes,
        lessons: editLessons,
      });
      setIsEditing(false);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (e) {
      alert("Failed to update journal entry.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this journal entry? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await deleteJournalEntry(entry.id);
      onClose();
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      console.error("Failed to delete journal entry:", error);
      alert("Failed to delete journal entry.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog.Root open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-[#0B1524] border border-white/15 p-0 text-white shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#07111F]">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl font-black text-sm border shadow-md ${
                  isLong
                    ? "bg-[#70C891]/20 text-[#70C891] border-[#70C891]/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}
              >
                {isLong ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Dialog.Title className="text-[18px] font-black text-white">
                    {entry.symbol || "Trade Detail"}
                  </Dialog.Title>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      isLong ? "bg-[#70C891]/20 text-[#70C891]" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {entry.side || "LONG"}
                  </span>
                </div>
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/50 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-[#38BDF8]" />
                  <span>{formattedDateTime}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="rounded-xl border border-white/10 p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                title="Edit Entry"
              >
                <Edit2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl border border-red-500/30 p-2 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                title="Delete Entry"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <Dialog.Close className="rounded-xl border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl bg-[#07111F] p-4 border border-white/10">
              <div>
                <span className="block text-[10px] font-bold uppercase text-white/40">
                  Realized P&amp;L
                </span>
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
                  className={`block text-[11px] font-bold ${
                    isWin ? "text-[#70C891]" : "text-red-400"
                  }`}
                >
                  {(entry.return_percentage || 0) >= 0
                    ? `+${(entry.return_percentage || 0).toFixed(2)}%`
                    : `${(entry.return_percentage || 0).toFixed(2)}%`}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-white/40">
                  Entry Price
                </span>
                <strong className="text-[15px] font-black text-white">
                  ${entry.entry_price?.toLocaleString() || "—"}
                </strong>
                <span className="block text-[10.5px] text-white/40">Execution rate</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-white/40">
                  Exit Price
                </span>
                <strong className="text-[15px] font-black text-white">
                  ${entry.exit_price?.toLocaleString() || "—"}
                </strong>
                <span className="block text-[10.5px] text-white/40">Close rate</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-white/40">
                  Quantity
                </span>
                <strong className="text-[15px] font-black text-white">
                  {entry.quantity || "—"}
                </strong>
                <span className="block text-[10.5px] text-white/40">Contracts/Units</span>
              </div>
            </div>

            {/* Strategy & Market Context */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] p-3.5 border border-white/10">
                <span className="block text-[10px] font-bold uppercase text-white/40">
                  Strategy
                </span>
                <strong className="text-[13px] font-black text-[#38BDF8]">
                  {entry.strategy || "Standard Execution"}
                </strong>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-3.5 border border-white/10">
                <span className="block text-[10px] font-bold uppercase text-white/40">
                  Market Condition
                </span>
                <strong className="text-[13px] font-black text-white">
                  {entry.market_condition || "Normal Range"}
                </strong>
              </div>
            </div>

            {/* Trade Thesis / Entry Reason */}
            {entry.entry_reason && (
              <div className="rounded-xl bg-white/[0.03] p-4 border border-white/10">
                <span className="block text-[10.5px] font-bold uppercase tracking-wider text-white/50 mb-1">
                  Reason for Entering (Thesis)
                </span>
                <p className="text-[13px] leading-relaxed text-white/90">{entry.entry_reason}</p>
              </div>
            )}

            {/* Lessons & Reflection */}
            <div className="rounded-xl bg-white/[0.03] p-4 border border-white/10 space-y-3">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#FFEA93]">
                Reflection &amp; Lessons Learned
              </span>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-white/60 mb-1">
                      Lessons &amp; Reflections
                    </label>
                    <textarea
                      value={editLessons}
                      onChange={(e) => setEditLessons(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-[#38BDF8] bg-[#111E30] p-3 text-[13px] text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/60 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-[#38BDF8] bg-[#111E30] p-3 text-[13px] text-white outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit}
                      className="rounded-lg bg-[#2F78B7] px-4 py-1.5 text-xs font-bold text-white"
                    >
                      {isSavingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[13px] leading-relaxed text-white/90">
                    {entry.lessons || "No key lessons recorded for this execution."}
                  </p>
                  {entry.notes && (
                    <div className="pt-2 border-t border-white/10 text-[12px] text-white/70">
                      <strong>Notes:</strong> {entry.notes}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Observations / Follow-up Notes List */}
            <div className="space-y-3">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-white/50">
                Post-Trade Observations &amp; Follow-ups
              </span>

              <div className="space-y-2">
                {localObservations.map((obs, i) => (
                  <div
                    key={obs.id || i}
                    className="rounded-xl bg-black/40 p-3 border border-white/10 text-[12.5px] text-white/80 flex items-start gap-2"
                  >
                    <MessageSquare className="h-4 w-4 text-[#38BDF8] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div>{obs.text}</div>
                      <div className="text-[10px] text-white/40 mt-1">
                        {obs.created_at ? new Date(obs.created_at).toLocaleTimeString() : "Added"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add observation form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Add a new observation or review note..."
                  className="h-10 flex-1 rounded-xl border border-white/15 bg-[#111E30] px-3.5 text-[12.5px] font-medium text-white outline-none focus:border-[#38BDF8]"
                />
                <button
                  type="button"
                  onClick={handleAddObservation}
                  disabled={!observation.trim() || submittingObs}
                  className="rounded-xl bg-[#2F78B7] px-4 py-2 text-[12px] font-black text-white hover:bg-[#245F93] transition-all disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
