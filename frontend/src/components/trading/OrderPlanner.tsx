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

export default function OrderPlanner({ pair, price, fresh, limitPrice, onLimitPrice }: { pair: string; price: number | undefined; fresh: boolean; limitPrice: string; onLimitPrice: (value: string) => void }) {
  const { isPaper } = useTradingMode(), profile = useRiskPreferences(), account = usePaperAccount(), summary = usePaperSummary();
  const preferences = profile.preferences;
  const [side, setSide] = useState<"BUY" | "SELL">("BUY"), [kind, setKind] = useState<"MARKET" | "LIMIT">("LIMIT"), [amount, setAmount] = useState("");
  const [stop, setStop] = useState(""), [target, setTarget] = useState(""), [review, setReview] = useState(false);
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
    {warnings.length > 0 && <ul className="ct-plan-warnings" aria-label="Local planning checks">{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}
    <button className="ct-review-order" disabled={!profile.ready || !valid || !stopValid || !targetValid || warnings.length > 0 || (kind === "MARKET" && !fresh)} onClick={() => setReview(true)}>Review trade plan</button><p className="ct-order-disclosure"><ShieldCheck size={14}/>Planning only. No order submission or broker permission is enabled here. Local checks are not server risk authorization. Estimates exclude fees, gaps and slippage.</p>
    <Dialog.Root open={review} onOpenChange={setReview}><Dialog.Portal><Dialog.Overlay className="cc-modal-backdrop"/><Dialog.Content className="cc-dialog ct-plan-review"><div className="cc-panel-heading"><Dialog.Title>Review plan · not an order</Dialog.Title><Dialog.Close className="cc-icon-button" aria-label="Close trade plan"><X size={18}/></Dialog.Close></div><Dialog.Description>Nothing is submitted to a broker or paper execution service.</Dialog.Description><dl><div><dt>Market / mode</dt><dd>{pair} · {isPaper ? "Paper" : "Live planning"}</dd></div><div><dt>Side / type</dt><dd>{side} · {kind}</dd></div><div><dt>Quantity</dt><dd>{amount}</dd></div><div><dt>Reference entry</dt><dd>{quote(reference)} USDT</dd></div><div><dt>Notional</dt><dd>{quote(total)} USDT</dd></div><div><dt>Local risk preference</dt><dd>{preferences.riskPerTrade}% at stop</dd></div><div><dt>Account-risk checks</dt><dd>{accountReady && side === "BUY" ? "Partial local estimates only" : "Unavailable"}</dd></div></dl><p>Live balances, exchange size filters, existing exposure, daily loss, drawdown, server risk authorization and executable order handling must be integrated before trading is enabled. Sell / Exit does not imply short-selling permission.</p><Dialog.Close className="cc-button cc-button-primary">Back to workstation</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}
