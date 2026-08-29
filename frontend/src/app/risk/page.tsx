"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Calculator, Check, RotateCcw, Save, ShieldCheck } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useRiskPreferences } from "@/context/RiskPreferencesContext";
import { useTradingMode } from "@/context/TradingModeContext";
import { DEFAULT_RISK, RISK_FIELDS, calculateRiskSize, parseRiskPreferences, type RiskPreferences } from "@/lib/risk-preferences";
import { quote } from "@/lib/terminal-market";

function RiskWorkspace() {
  const profile = useRiskPreferences();
  const { mode, setMode } = useTradingMode();
  const [draft, setDraft] = useState<RiskPreferences>(profile.preferences);
  const [message, setMessage] = useState(""), [error, setError] = useState("");
  const [capital, setCapital] = useState(""), [entry, setEntry] = useState(""), [stop, setStop] = useState("");
  useEffect(() => { setDraft(profile.preferences); setError(""); }, [profile.preferences]);
  let valid = true;
  try { parseRiskPreferences(draft); } catch { valid = false; }
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile.preferences) || !profile.savedAt;
  const preview = valid ? calculateRiskSize({ equity: Number(capital), entry: Number(entry), stop: Number(stop), preferences: draft }) : null;
  function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try { profile.save(draft); setMessage(`${mode === "paper" ? "Paper" : "Live-planning"} preferences saved on this browser. Server limits are unchanged.`); }
    catch (err) { setError(err instanceof Error ? err.message : "Preferences could not be saved."); }
  }
  return <div className="cc-page cc-risk-workspace">
    <div className="cc-page-heading"><div><span className="cc-eyebrow">Your capital. Your boundaries.</span><h1>Risk Management<span className="cc-title-dot">.</span></h1><p>Set your planning limits here, then see what they mean for a position.</p></div>
      <div className="cc-segmented" role="group" aria-label="Risk profile mode"><button aria-pressed={mode === "paper"} onClick={() => setMode("paper")}>Paper profile</button><button aria-pressed={mode === "live"} onClick={() => setMode("live")}>Live-planning profile</button></div>
    </div>
    <div className="cc-risk-scope"><ShieldCheck size={20}/><div><strong>Local planning profile · {mode === "paper" ? "Paper" : "Live planning"}</strong><p>Saved per account and mode on this browser. These preferences are not synced to, or enforced by, the backend. Existing server safeguards cannot be relaxed from here.</p></div><span>{profile.savedAt ? "Saved locally" : "Not saved yet"}</span></div>
    {profile.error && <p role="status" className="cc-data-warning">{profile.error}</p>}
    <div className="cc-risk-grid">
      <form className="cc-card cc-risk-editor" onSubmit={submit}>
        <div className="cc-card-heading"><div><span className="cc-eyebrow">Define the downside</span><h2>Your risk preferences</h2></div><span className="cc-risk-draft">{dirty ? "Unsaved changes" : "Up to date"}</span></div>
        <div className="cc-risk-fields">{RISK_FIELDS.map(field => <div className="cc-risk-field" key={field.key}>
          <div><label htmlFor={`risk-${field.key}`}>{field.label}</label><p>{field.description}</p></div>
          <div className="cc-risk-number"><input id={`risk-${field.key}`} type="number" min={0} max={100} step="any" required value={Number.isFinite(draft[field.key]) ? draft[field.key] : ""} onChange={event => { setDraft(old => ({ ...old, [field.key]: event.target.valueAsNumber })); setMessage(""); }}/><span>%</span></div>
          <input className="cc-risk-range" type="range" aria-label={`${field.label} slider`} min={0} max={100} step={field.step} value={Number.isFinite(draft[field.key]) ? draft[field.key] : 0} onChange={event => { setDraft(old => ({ ...old, [field.key]: Number(event.target.value) })); setMessage(""); }}/>
        </div>)}</div>
        <label className="cc-risk-stop"><input type="checkbox" checked={draft.requireStop} onChange={e => { setDraft(old => ({ ...old, requireStop: e.target.checked })); setMessage(""); }}/><span><strong>Require a stop in my trade plan</strong><small>The local order planner requires a stop before review. It does not place a stop order.</small></span></label>
        {!valid && <p className="cc-data-warning" role="alert">Enter a number from 0 to 100 for every percentage.</p>}
        {draft.riskPerTrade > DEFAULT_RISK.riskPerTrade && <p className="cc-data-warning">This exceeds the product’s initial 2% planning value. Increasing it increases the planned loss at the stop; it does not change backend limits.</p>}
        {error && <p className="cc-data-warning" role="alert">{error}</p>}
        <div className="cc-risk-save"><button type="button" className="cc-button" onClick={() => { setDraft({ ...DEFAULT_RISK }); setMessage(""); }}><RotateCcw size={15}/>Reset form</button><button type="submit" className="cc-button cc-button-primary" disabled={!valid || !profile.ready || !dirty}><Save size={15}/>Save preferences</button></div>
        <p className="cc-risk-message" role="status">{message ? <><Check size={14}/>{message}</> : profile.savedAt ? `Last saved ${new Date(profile.savedAt).toLocaleString()}` : "Defaults are editable starting values, not a personal recommendation."}</p>
      </form>
      <aside className="cc-risk-aside">
        <section className="cc-card cc-risk-preview"><div className="cc-card-heading"><div className="cc-inline"><Calculator size={20}/><div><span className="cc-eyebrow">See the effect</span><h2>Position-size preview</h2></div></div></div><p>Long-position planning in USDT. Uses the values in the form, including unsaved edits.</p>
          <label>Planning capital · not a live balance<input type="number" step="any" min="0" placeholder="Enter your planning capital" value={capital} onChange={e => setCapital(e.target.value)}/></label>
          <div className="cc-risk-price-inputs"><label>Entry price<input type="number" step="any" min="0" placeholder="USDT" value={entry} onChange={e => setEntry(e.target.value)}/></label><label>Stop price<input type="number" step="any" min="0" placeholder="Below entry" value={stop} onChange={e => setStop(e.target.value)}/></label></div>
          {capital && entry && stop && !preview && <p className="cc-data-warning">Use positive finite amounts and a stop below entry. Preferences must also be valid.</p>}
          <dl><div><dt>Risk budget</dt><dd>{quote(preview?.budget)} USDT</dd></div><div><dt>Size after exposure &amp; reserve caps</dt><dd>{quote(preview?.quantity, 6)} units</dd></div><div><dt>Position notional</dt><dd>{quote(preview?.notional)} USDT</dd></div><div><dt>Estimated loss at stop</dt><dd>{quote(preview?.lossAtStop)} USDT</dd></div></dl>
          <p className="cc-data-note">The smallest of risk, position-exposure and cash-reserve limits determines size. Fees, gaps and slippage can increase losses. No order is sent.</p><Link href={`/paper-trading?mode=${mode}`} className="cc-button">Open trade planner<ArrowUpRight size={14}/></Link>
        </section>
        <section className="cc-risk-integration"><span className="cc-eyebrow">Backend connection comes next</span><h3>Preferences are not measurements.</h3><p>Daily loss, portfolio drawdown and live exposure need verified account data. No “healthy” badge or made-up risk score is shown before that connection.</p><div><span>Daily-loss monitoring</span><b>Not connected</b></div><div><span>Drawdown enforcement</span><b>Not connected</b></div></section>
      </aside>
    </div>
  </div>;
}
export default function RiskPage() { return <DashboardShell><RiskWorkspace/></DashboardShell>; }
