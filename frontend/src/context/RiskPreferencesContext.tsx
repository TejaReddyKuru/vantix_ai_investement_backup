"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useTradingMode } from "./TradingModeContext";
import { DEFAULT_RISK, parseRiskPreferences, parseRiskRecord, riskStorageKey, type RiskPreferences } from "@/lib/risk-preferences";

const Context = createContext({ preferences: DEFAULT_RISK, ready: false, savedAt: null as string | null, error: "", save: (_value: RiskPreferences) => {} });
export const useRiskPreferences = () => useContext(Context);

export function RiskPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(), { mode } = useTradingMode();
  const userId = user?.id ?? "";
  const key = riskStorageKey(userId, mode);
  const [state, setState] = useState<{ key: string; preferences: RiskPreferences; ready: boolean; savedAt: string | null; error: string }>({ key: "", preferences: DEFAULT_RISK, ready: false, savedAt: null, error: "" });
  // Scope the value immediately without remounting the router or overriding a mode transition.
  const current = state.key === key ? state : { key, preferences: DEFAULT_RISK, ready: false, savedAt: null, error: "" };
  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(key);
        const record = raw ? parseRiskRecord(JSON.parse(raw), userId, mode) : { preferences: DEFAULT_RISK, savedAt: null };
        setState({ key, ...record, ready: true, error: "" });
      } catch { setState({ key, preferences: DEFAULT_RISK, savedAt: null, ready: true, error: "Saved preferences could not be read. Defaults are displayed; save a valid profile to replace them." }); }
    }
    load();
    const sync = (event: StorageEvent) => { if (event.key === key || event.key === null) load(); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key, userId, mode]);
  function save(value: RiskPreferences) {
    if (!userId || !current.ready) throw new Error("Sign in and wait for your risk profile to load before saving.");
    const valid = parseRiskPreferences(value), time = new Date().toISOString();
    try { localStorage.setItem(key, JSON.stringify({ version: 1, userId, mode, savedAt: time, preferences: valid })); }
    catch { throw new Error("Browser storage is unavailable. Your preferences were not saved."); }
    setState({ key, preferences: valid, savedAt: time, ready: true, error: "" });
  }
  return <Context.Provider value={{ preferences: current.preferences, ready: current.ready, savedAt: current.savedAt, error: current.error, save }}>{children}</Context.Provider>;
}
