import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { createJournalEntry, TradeJournalEntry } from "@/lib/journal-api";

interface CreateJournalEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateJournalEntryModal({ open, onClose, onSuccess }: CreateJournalEntryModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<TradeJournalEntry>>({
    symbol: "",
    side: "LONG",
    status: "CLOSED",
    entry_price: undefined,
    exit_price: undefined,
    quantity: undefined,
    realized_pnl: undefined,
    strategy: "",
    notes: "",
    entry_reason: "",
    trade_thesis: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createJournalEntry(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        symbol: "",
        side: "LONG",
        status: "CLOSED",
        entry_price: undefined,
        exit_price: undefined,
        quantity: undefined,
        realized_pnl: undefined,
        strategy: "",
        notes: "",
        entry_reason: "",
        trade_thesis: ""
      });
    } catch (error) {
      console.error("Failed to create journal entry:", error);
      alert("Failed to create journal entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="cc-modal-backdrop" />
        <Dialog.Content 
          className="cc-dialog" 
          style={{ 
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: '600px', 
            maxHeight: '90vh', 
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 24px 70px rgba(7, 17, 31, 0.14)',
            zIndex: 100
          }}
        >
          <div className="cc-panel-heading sticky -top-6 bg-white z-10 pb-4 mb-2 border-b border-[#E3E2D9] flex items-center justify-between">
            <Dialog.Title>Add New Trade</Dialog.Title>
            <Dialog.Close className="cc-icon-button">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="py-4 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Symbol</label>
                <input 
                  type="text" 
                  name="symbol"
                  value={formData.symbol || ""}
                  onChange={handleChange}
                  placeholder="e.g. BTCUSDT"
                  required
                  className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Side</label>
                <select
                  name="side"
                  value={formData.side || "LONG"}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
                >
                  <option value="LONG">Long</option>
                  <option value="SHORT">Short</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Entry Price</label>
                <input 
                  type="number"
                  step="any"
                  name="entry_price"
                  value={formData.entry_price || ""}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Exit Price</label>
                <input 
                  type="number"
                  step="any"
                  name="exit_price"
                  value={formData.exit_price || ""}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Quantity</label>
                <input 
                  type="number"
                  step="any"
                  name="quantity"
                  value={formData.quantity || ""}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Realized PnL ($)</label>
                <input 
                  type="number"
                  step="any"
                  name="realized_pnl"
                  value={formData.realized_pnl || ""}
                  onChange={handleChange}
                  placeholder="e.g. 150.50"
                  className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Status</label>
                <select
                  name="status"
                  value={formData.status || "CLOSED"}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
                >
                  <option value="CLOSED">Closed</option>
                  <option value="OPEN">Open</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Strategy / Setup</label>
              <input 
                type="text" 
                name="strategy"
                value={formData.strategy || ""}
                onChange={handleChange}
                placeholder="e.g. Breakout Retest"
                className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Trade Thesis</label>
              <textarea 
                name="trade_thesis"
                value={formData.trade_thesis || ""}
                onChange={handleChange}
                placeholder="Why did you take this trade?"
                rows={2}
                className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7] resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Notes & Lessons</label>
              <textarea 
                name="notes"
                value={formData.notes || ""}
                onChange={handleChange}
                placeholder="What did you learn? What went well or poorly?"
                rows={3}
                className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7] resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-[#55554F] hover:bg-gray-100 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#2F78B7] text-xs font-extrabold text-white shadow-md hover:bg-[#245F93] transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Journal Entry"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
