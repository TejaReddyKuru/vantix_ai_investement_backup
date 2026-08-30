"use client";
import Link from "next/link";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ShieldCheck, X } from "lucide-react";
import { useTradingMode } from "@/context/TradingModeContext";
import { useRiskPreferences } from "@/context/RiskPreferencesContext";
import { usePaperAccount, usePaperSummary } from "@/hooks/useWorkspaceData";
import { accountAmount } from "@/lib/workspace-data";
import { calculateRiskSize } from "@/lib/risk-preferences";
import { quote } from "@/lib/terminal-market";
import { apiClient } from "@/lib/client";
import { useAssetRecords, useUnifiedAnalysis } from "@/hooks/useTerminalAccount";
import { useQueryClient } from "@tanstack/react-query";

export default function OrderPlanner({ pair, price, fresh, limitPrice, onLimitPrice }: { pair: string; price: number | undefined; fresh: boolean; limitPrice: string; onLimitPrice: (value: string) => void }) {
  const { isPaper } = useTradingMode(), profile = useRiskPreferences(), account = usePaperAccount(), summary = usePaperSummary();
  const preferences = profile.preferences;
  const [side, setSide] = useState<"BUY" | "SELL">("BUY"), [kind, setKind] = useState<"MARKET" | "LIMIT">("LIMIT"), [amount, setAmount] = useState("");
  const [stop, setStop] = useState(""), [target, setTarget] = useState(""), [review, setReview] = useState(false);
  const [strategy, setStrategy] = useState(""), [entryReason, setEntryReason] = useState(""), [confidence, setConfidence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ahnaAnalysis = useUnifiedAnalysis(pair, "1D", false, true);
  
  const queryClient = useQueryClient();
  const reference = kind === "MARKET" ? price : Number(limitPrice), size = Number(amount);
  const valid = size > 0 && Number.isFinite(size) && reference != null && Number.isFinite(reference) && reference > 0 && size * reference <= Number.MAX_SAFE_INTEGER / 100;
  const total = valid ? size * reference! : null, stopNumber = Number(stop), targetNumber = Number(target);
  const stopValid = !stop || (Number.isFinite(stopNumber) && stopNumber > 0 && reference != null && (side === "BUY" ? stopNumber < reference : stopNumber > reference));
  const targetValid = !target || (Number.isFinite(targetNumber) && targetNumber > 0 && reference != null && (side === "BUY" ? targetNumber > reference : targetNumber < reference));
  const risk = valid && stop && stopValid ? Math.abs(reference! - stopNumber) * size : null;
  const reward = valid && target && targetValid ? Math.abs(targetNumber - reference!) * size : null;
  const equity = Number(summary.data?.total_equity), cash = Number(account.data?.current_cash);
  const accountReady = isPaper && account.data?.currency === "USDT" && !account.isError && !summary.isError && !account.isStale && !summary.isStale && Number.isFinite(equity) && equity > 0 && Number.isFinite(cash) && cash >= 0;
  const suggested = accountReady && reference && stop ? calculateRiskSize({ equity, entry: reference, stop: stopNumber, cash, side, preferences }) : null;
  const stopMissing = preferences.requireStop && !stop;
  const warnings: string[] = [];
  
  if (stopMissing) warnings.push("Your profile requires a stop price before review.");
  if (accountReady && side === "BUY" && total != null) {
    if (total > equity * preferences.maxPositionExposure / 100 + 1e-8) warnings.push("Plan notional exceeds your per-position exposure preference.");
    if (total > Math.max(0, cash - equity * preferences.cashReserve / 100) + 1e-8) warnings.push("This plan would leave less than your cash reserve.");
    if (risk != null && risk > equity * preferences.riskPerTrade / 100 + 1e-8) warnings.push("Estimated loss at the stop exceeds your risk budget.");
  }

  // Find asset ID for the current pair. This is a bit hacky but we need the UUID for the backend order.
  // We assume the caller passed the correct pair. We'll search the cached assets from queryClient.
  // Usually this would be passed down as a prop if available, but for now we try to get it.
  const handlePlaceOrder = async () => {
    if (!valid || !isPaper) return;
    setIsSubmitting(true);
    try {
      // Find the asset ID
      const allQueries = queryClient.getQueryCache().getAll();
      let assetId = null;
      for (const q of allQueries) {
        if (q.queryKey[0] === "assets" && Array.isArray(q.state.data)) {
           const asset = q.state.data.find((a: any) => a.symbol === pair);
           if (asset) assetId = asset.id;
        }
      }
      
      if (!assetId) {
        const assetsResp = await apiClient.get('/api/v1/assets?q=' + pair);
        if (assetsResp.data?.items?.length > 0) {
           assetId = assetsResp.data.items[0].id;
        }
      }
      
      if (!assetId) throw new Error("Could not determine asset ID for " + pair);

      const payload = {
        asset_id: assetId,
        order_type: kind,
        side: side,
        quantity: size,
        requested_price: reference,
        stop_loss: stop ? stopNumber : null,
        take_profit: target ? targetNumber : null,
        journal_data: (strategy || entryReason || confidence) ? {
          strategy,
          entry_reason: entryReason,
          confidence: confidence ? Number(confidence) : null,
          trade_plan_snapshot: {
            risk_level: preferences.riskPerTrade,
            risk_reward: (reward && risk) ? (reward/risk).toFixed(2) : null
          },
          ahna_snapshot: ahnaAnalysis.data || null
        } : null
      };

      await apiClient.post('/api/v1/paper-trading/orders', payload);
      setReview(false);
      setAmount("");
      setStop("");
      setTarget("");
      setStrategy("");
      setEntryReason("");
      setConfidence("");
      queryClient.invalidateQueries({ queryKey: ["paper-orders"] });
      queryClient.invalidateQueries({ queryKey: ["paper-positions"] });
      queryClient.invalidateQueries({ queryKey: ["paper-summary"] });
      queryClient.invalidateQueries({ queryKey: ["paper-account"] });
      
      alert("Paper order placed successfully!");
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || "Unknown error";
      alert("Failed to place order: " + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return <section className="ct-panel ct-order-planner"><header><h2>Trade plan</h2><span className={isPaper ? "ct-paper-label" : "ct-live-label"}>{isPaper ? "PAPER" : "LIVE MODE"}</span></header>
    <div className="ct-order-sides" role="group" aria-label="Order side"><button className="buy" aria-pressed={side === "BUY"} onClick={() => setSide("BUY")}>Buy / Long</button><button className="sell" aria-pressed={side === "SELL"} onClick={() => setSide("SELL")}>Sell / Exit</button></div>
    <div className="ct-order-types" role="group" aria-label="Order type"><button aria-pressed={kind === "MARKET"} onClick={() => setKind("MARKET")}>Market</button><button aria-pressed={kind === "LIMIT"} onClick={() => setKind("LIMIT")}>Limit</button></div>
    <label>Price <span>USDT</span>{kind === "LIMIT" ? <input type="number" value={limitPrice} step="any" min="0" placeholder="Choose a price" onChange={e => onLimitPrice(e.target.value)}/> : <output>{quote(price)} <small>{fresh ? "Reference, not guaranteed" : "Stale / unavailable"}</small></output>}</label>
    <label>Quantity <span>{pair.replace(/USDT$/, "")}</span><input type="number" step="any" min="0" value={amount} placeholder="0.00" onChange={e => setAmount(e.target.value)}/></label>
    <div className="ct-size-shortcuts" aria-label="Percentage of paper cash">{[25, 50, 75, 100].map(percent => <button key={percent} disabled={!accountReady || !reference || reference <= 0 || side !== "BUY"} onClick={() => setAmount(String(Math.floor(cash * percent / 100 / reference! * 1e6) / 1e6))}>{percent}%</button>)}</div>
    <section className="ct-order-protection"><h3>Protection · planning only</h3><label>Stop price<input type="number" step="any" min="0" value={stop} placeholder={preferences.requireStop ? "Required by your profile" : "Optional"} onChange={e => setStop(e.target.value)}/></label><label>Take-profit price<input type="number" step="any" min="0" value={target} placeholder="Optional" onChange={e => setTarget(e.target.value)}/></label>{(!stopValid || !targetValid) && <p className="cc-error">Stops and targets must be on the appropriate side of entry.</p>}</section>
    <div className="ct-local-risk"><div><ShieldCheck size={14}/><strong>Your local risk profile</strong><Link href="/risk">Edit</Link></div><p>{preferences.riskPerTrade}% at stop · {preferences.maxPositionExposure}% position cap · {preferences.cashReserve}% reserve</p>
      <button type="button" className="cc-button" disabled={!profile.ready || !suggested || suggested.quantity < .000001 || side !== "BUY"} onClick={() => { if (suggested) setAmount(String(Math.floor(suggested.quantity * 1e6) / 1e6)); }}>Size to my risk budget</button>
      <small>{accountReady ? "Estimates use recent paper-account snapshots. Existing holdings are not included in the position cap." : "Automatic sizing needs recent USDT paper equity and cash. Use Risk Management’s manual preview while unconnected."}</small>
      {side === "SELL" && <small>Sell / Exit needs verified holdings and cost basis before account-risk checks can be applied. It does not authorize a short.</small>}
    </div>
    <dl className="ct-order-totals"><div><dt>{isPaper ? "Paper cash" : "Live cash"}</dt><dd>{isPaper ? accountAmount(account.data?.current_cash, account.data?.currency) : "Unavailable"}</dd></div><div><dt>Estimated notional</dt><dd>{quote(total)} USDT</dd></div><div><dt>Risk at stop</dt><dd>{quote(risk)} USDT</dd></div><div><dt>Reward / risk</dt><dd>{risk && reward ? (reward / risk).toFixed(2) + " : 1" : "—"}</dd></div></dl>
    
    <section className="ct-order-protection" style={{ marginTop: '16px' }}>
      <h3>Pre-trade Journal (Optional)</h3>
      <label>Strategy<input type="text" value={strategy} placeholder="e.g. Momentum Breakout" onChange={e => setStrategy(e.target.value)}/></label>
      <label>Entry Reason<input type="text" value={entryReason} placeholder="e.g. Price reclaimed resistance" onChange={e => setEntryReason(e.target.value)}/></label>
      <label>Confidence (%)<input type="number" min="0" max="100" value={confidence} placeholder="80" onChange={e => setConfidence(e.target.value)}/></label>
    </section>

    {warnings.length > 0 && <ul className="ct-plan-warnings" aria-label="Local planning checks">{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}
    <button className="ct-review-order" disabled={!profile.ready || !valid || !stopValid || !targetValid || warnings.length > 0 || (kind === "MARKET" && !fresh) || isSubmitting} onClick={() => setReview(true)}>Review trade plan</button>
    <p className="ct-order-disclosure"><ShieldCheck size={14}/>Planning checks exclude fees, gaps and slippage.</p>
    
    <Dialog.Root open={review} onOpenChange={setReview}><Dialog.Portal><Dialog.Overlay className="cc-modal-backdrop"/><Dialog.Content className="cc-dialog ct-plan-review"><div className="cc-panel-heading"><Dialog.Title>Review and Submit Order</Dialog.Title><Dialog.Close className="cc-icon-button" aria-label="Close trade plan"><X size={18}/></Dialog.Close></div><Dialog.Description>You are about to place a paper trade.</Dialog.Description><dl><div><dt>Market / mode</dt><dd>{pair} · {isPaper ? "Paper" : "Live planning"}</dd></div><div><dt>Side / type</dt><dd>{side} · {kind}</dd></div><div><dt>Quantity</dt><dd>{amount}</dd></div><div><dt>Reference entry</dt><dd>{quote(reference)} USDT</dd></div><div><dt>Notional</dt><dd>{quote(total)} USDT</dd></div><div><dt>Local risk preference</dt><dd>{preferences.riskPerTrade}% at stop</dd></div></dl>
    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
       <button onClick={() => setReview(false)} className="cc-button" style={{ flex: 1 }}>Cancel</button>
       <button onClick={handlePlaceOrder} disabled={isSubmitting} className="cc-button cc-button-primary" style={{ flex: 1 }}>
         {isSubmitting ? (side === "BUY" ? "Buying..." : "Selling...") : "Place Paper Trade"}
       </button>
    </div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}
