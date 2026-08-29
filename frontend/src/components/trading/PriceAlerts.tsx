"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, Check, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useServerAlerts } from "@/hooks/useTerminalAccount";
import { backendError } from "@/hooks/useWorkspaceData";
import { alertCrossed, type LocalPriceAlert } from "@/lib/terminal-account";
import { quote, validPair } from "@/lib/terminal-market";

export default function PriceAlerts({ pair, price, fresh, onTrigger }: { pair: string; price: number | undefined; fresh: boolean; onTrigger?: (message: string) => void }) {
  const { user } = useAuth();
  const key = `coincrest:price-alerts:${user?.id ?? "guest"}`;
  const [alerts, setAlerts] = useState<LocalPriceAlert[]>([]), [loaded, setLoaded] = useState(false), [threshold, setThreshold] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above"), [tab, setTab] = useState<"local" | "server">("local"), [message, setMessage] = useState("");
  const previous = useRef<{ pair: string; price: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const server = useServerAlerts();
  useEffect(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]"); if (Array.isArray(saved)) setAlerts(saved.filter((a): a is LocalPriceAlert => typeof a === "object" && a !== null && "id" in a && "pair" in a && "direction" in a && "threshold" in a && "active" in a && typeof a.id === "string" && typeof a.pair === "string" && validPair(a.pair) && (a.direction === "above" || a.direction === "below") && typeof a.threshold === "number" && Number.isFinite(a.threshold) && a.threshold > 0 && typeof a.active === "boolean").slice(0, 100)); } catch { setMessage("Saved alerts could not be loaded."); }
    setLoaded(true);
  }, [key]);
  useEffect(() => { if (loaded) try { localStorage.setItem(key, JSON.stringify(alerts)); } catch { setMessage("Storage unavailable. These alerts will not survive a reload."); } }, [alerts, key, loaded]);
  useEffect(() => {
    if (!fresh || price == null) { previous.current = null; return; }
    const before = previous.current?.pair === pair ? previous.current.price : null;
    previous.current = { pair, price };
    if (!loaded || before == null) return;
    const triggered = alerts.filter(a => a.pair === pair && alertCrossed(a, before, price));
    if (!triggered.length) return;
    const ids = new Set(triggered.map(a => a.id));
    setAlerts(all => all.map(a => ids.has(a.id) ? { ...a, active: false, triggeredAt: Date.now() } : a));
    const message = `${pair} crossed ${triggered.map(a => `${a.direction} ${quote(a.threshold)} USDT`).join(", ")}.`;
    setAnnouncement(message);
    onTrigger?.(message);
  }, [alerts, fresh, loaded, pair, price, onTrigger]);
  function add() {
    if (!validPair(pair)) { setMessage("Choose a supported USDT market before creating an alert."); return; }
    const n = Number(threshold);
    if (!threshold.trim() || !Number.isFinite(n) || n <= 0) { setMessage("Enter a positive price in USDT."); return; }
    if (alerts.length >= 100) { setMessage("Remove an alert before adding more (100 maximum)."); return; }
    if (price != null && (direction === "above" ? n <= price : n >= price)) { setMessage(`Choose a threshold ${direction} the current price.`); return; }
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setAlerts(a => [...a, { id, pair, direction, threshold: n, active: true, triggeredAt: null, createdAt: Date.now() }]);
    setThreshold(""); setMessage("Alert saved on this device. It watches new crossings while this market is open.");
  }
  return <section className="ct-panel ct-alerts"><header className="ct-panel-tabs"><button aria-pressed={tab === "local"} onClick={() => setTab("local")}><Bell size={15}/> Price alerts</button><button aria-pressed={tab === "server"} onClick={() => setTab("server")}>Server rules</button></header>
    {announcement && <div className="ct-alert-triggered" role="alert"><Check size={16}/>{announcement}<button aria-label="Dismiss alert message" onClick={() => setAnnouncement("")}>×</button></div>}
    {tab === "local" ? <><p className="ct-panel-notice">Device-only alerts. Monitoring runs only while this workstation tab is visible, connected, and showing the matching market. No email, push or background monitoring.</p><form className="ct-alert-form" onSubmit={e => { e.preventDefault(); add(); }}><strong>{pair}</strong><select aria-label="Alert condition" value={direction} onChange={e => setDirection(e.target.value as typeof direction)}><option value="above">Crosses above</option><option value="below">Crosses below</option></select><input type="number" aria-label="Alert threshold in USDT" placeholder="Price in USDT" min="0" step="any" value={threshold} onChange={e => setThreshold(e.target.value)} required/><button className="cc-button cc-button-primary" disabled={!loaded || !validPair(pair)}><Plus size={14}/> Add alert</button></form>{message && <p className="ct-panel-notice" role="status">{message}</p>}<div className="ct-alert-list">{!alerts.length ? <p className="ct-empty">No local price alerts yet.</p> : alerts.map(a => <div key={a.id}><Bell size={15}/><span><strong>{a.pair} {a.direction} {quote(a.threshold)}</strong><small>{a.triggeredAt ? `Triggered ${new Date(a.triggeredAt).toLocaleString()}` : a.active ? a.pair === pair && fresh ? "Watching this market" : "Waiting for this market / connection" : "Paused"}</small></span><button aria-label={`${a.active ? "Pause" : "Rearm"} alert ${a.threshold}`} onClick={() => setAlerts(all => all.map(x => x.id === a.id ? { ...x, active: !x.active, triggeredAt: null } : x))}>{a.active ? <Pause size={14}/> : <Play size={14}/>}</button><button aria-label={`Delete local alert ${a.threshold}`} onClick={() => setAlerts(all => all.filter(x => x.id !== a.id))}><Trash2 size={14}/></button></div>)}</div></> : <div className="ct-server-alerts"><p className="ct-panel-notice">Saved backend rules are read-only here. The supplied contract does not define condition evaluation or guarantee a background worker. Server-rule creation needs that integration verified.</p>{server.isPending ? <p className="ct-empty">Loading saved rules…</p> : server.isError ? <p className="ct-empty">{backendError(server.error)}<button onClick={() => void server.refetch()}>Retry</button></p> : !server.data?.items.length ? <p className="ct-empty">No server rules returned.</p> : server.data.items.map((r, i) => <div key={typeof r.id === "string" ? r.id : i}><strong>{String(r.alert_type ?? "Rule")} · {String(r.threshold ?? "—")}</strong><small>{r.enabled ? "Enabled in backend" : "Disabled"} · delivery status not verified</small></div>)}{(server.data?.total ?? 0) > 25 && <p className="ct-panel-notice">Showing the first 25 of {server.data?.total} rules.</p>}</div>}
  </section>;
}
