import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle2, XCircle, Clock3, Trash2 } from "lucide-react";
import { TradeJournalEntry, addJournalObservation, deleteJournalEntry } from "@/lib/journal-api";

export default function JournalEntryModal({ entry, onClose, onDeleteSuccess }: { entry: TradeJournalEntry | null; onClose: () => void; onDeleteSuccess?: () => void }) {
  const [observation, setObservation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localObservations, setLocalObservations] = useState(entry?.observations || []);

  if (!entry) return null;

  const handleAddObservation = async () => {
    if (!observation.trim()) return;
    setSubmitting(true);
    try {
      const newObs = await addJournalObservation(entry.id, observation);
      setLocalObservations([...localObservations, newObs]);
      setObservation("");
    } catch (error) {
      alert("Failed to add observation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this journal entry? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await deleteJournalEntry(entry.id);
      onClose();
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      console.error("Failed to delete journal entry:", error);
      alert("Failed to delete journal entry");
    } finally {
      setIsDeleting(false);
    }
  };

  const isWin = (entry.realized_pnl || 0) >= 0;

  return (
    <Dialog.Root open={!!entry} onOpenChange={(open) => !open && onClose()}>
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
            maxWidth: '800px', 
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
            <Dialog.Title className="text-xl font-extrabold text-[#07111F]">Trade Journal: {entry.symbol}</Dialog.Title>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleDelete} 
                disabled={isDeleting} 
                className="p-1.5 text-[#D6A12A] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50" 
                title="Delete Entry"
              >
                <Trash2 size={16} />
              </button>
              <Dialog.Close className="cc-icon-button p-1 hover:bg-[#F0F0EA] rounded-full transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
          </div>

          <div className="py-4 space-y-6">
            {/* TRADE SUMMARY */}
            <section>
              <h3 className="text-sm font-extrabold text-[#07111F] mb-3 uppercase tracking-wider">Trade Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Side</div>
                  <div className={`font-bold ${entry.side === 'LONG' ? 'text-green-600' : 'text-red-500'}`}>{entry.side}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Quantity</div>
                  <div className="font-bold">{entry.quantity}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Entry Price</div>
                  <div className="font-bold">${entry.entry_price}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Exit Price</div>
                  <div className="font-bold">{entry.exit_price ? `$${entry.exit_price}` : '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Realized P&L</div>
                  <div className={`font-bold ${isWin ? 'text-green-600' : 'text-red-500'}`}>
                    ${entry.realized_pnl || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Return %</div>
                  <div className={`font-bold ${isWin ? 'text-green-600' : 'text-red-500'}`}>
                    {entry.return_percentage ? `${entry.return_percentage}%` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Duration</div>
                  <div className="font-bold flex items-center gap-1">
                    <Clock3 size={14} />
                    {entry.duration_seconds ? `${Math.floor(entry.duration_seconds / 60)}m` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Status</div>
                  <div className="font-bold flex items-center gap-1">
                    {isWin ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-500" />}
                    {entry.status}
                  </div>
                </div>
              </div>
            </section>

            {/* TRADE PLAN */}
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-sm font-extrabold text-[#07111F] mb-3 uppercase tracking-wider">Trade Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Strategy</div>
                  <div className="font-bold">{entry.strategy || 'None'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Entry Reason</div>
                  <div>{entry.entry_reason || 'None'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Risk Profile</div>
                  <div>{entry.trade_plan_snapshot?.risk_level ? `${entry.trade_plan_snapshot.risk_level}% risk` : '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Confidence</div>
                  <div>{entry.confidence ? `${entry.confidence}%` : '-'}</div>
                </div>
              </div>
            </section>

            {/* AHNA SNAPSHOT */}
            {entry.ahna_snapshot && (
              <section className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-sm font-extrabold text-[#07111F] mb-3 uppercase tracking-wider text-blue-800">AHNA Snapshot</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-blue-500 font-bold mb-1">Consensus</div>
                    <div className="font-bold text-blue-900">{entry.ahna_snapshot.consensus || 'Neutral'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-500 font-bold mb-1">Momentum</div>
                    <div className="font-bold text-blue-900">{entry.ahna_snapshot.momentum || '-'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-blue-500 font-bold mb-1">Agent Insights</div>
                    <div className="text-xs text-blue-800 whitespace-pre-wrap">
                      {JSON.stringify(entry.ahna_snapshot.agent_insights || {}, null, 2)}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* OBSERVATIONS */}
            <section>
              <h3 className="text-sm font-extrabold text-[#07111F] mb-3 uppercase tracking-wider">Observations</h3>
              {localObservations.length > 0 ? (
                <ul className="space-y-3 mb-4">
                  {localObservations.map((obs, i) => (
                    <li key={i} className="text-sm border-l-2 border-blue-400 pl-3 py-1 text-gray-600 bg-gray-50">
                      <span className="text-xs text-gray-400 block mb-1">{new Date(obs.created_at).toLocaleString()}</span>
                      {obs.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic mb-4">No observations recorded during this trade.</p>
              )}
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Add an observation..." 
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <button 
                  onClick={handleAddObservation} 
                  disabled={submitting || !observation.trim()}
                  className="bg-[#2F78B7] text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </section>

            {/* POST-TRADE REVIEW */}
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-sm font-extrabold text-[#07111F] mb-3 uppercase tracking-wider">Post-Trade Review</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">What went well?</div>
                  <div>{entry.what_went_well || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">What went wrong?</div>
                  <div>{entry.what_went_wrong || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Notes / Lessons Learned</div>
                  <div>{entry.notes || '-'}</div>
                </div>
              </div>
            </section>

            {/* DISCIPLINE */}
            <section>
              <h3 className="text-sm font-extrabold text-[#07111F] mb-3 uppercase tracking-wider">Discipline</h3>
              <div className="flex items-center justify-between bg-white border border-gray-200 p-4 rounded-xl">
                <div>
                  <div className="text-sm font-bold text-gray-700">Discipline Score</div>
                  <div className="text-xs text-gray-500">Based on risk and strategy compliance</div>
                </div>
                <div className="text-2xl font-extrabold text-[#2F78B7]">
                  {entry.discipline_score ? `${entry.discipline_score}/100` : '-/100'}
                </div>
              </div>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
