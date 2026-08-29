"use client";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

/** Account-scoped, device-only layout preference. Never writes another account's state. */
export function useWorkspacePreference<T>(key: string, fallback: T, parse: (value: unknown) => T) {
  const [session, setSession] = useState<{ key: string; value: T }>({ key: "", value: fallback });
  useEffect(() => {
    let value = fallback;
    try { value = parse(JSON.parse(localStorage.getItem(key) ?? "null")); } catch { /* Optional preference. */ }
    setSession({ key, value });
  }, [key, fallback, parse]);
  useEffect(() => {
    if (session.key !== key) return;
    try { localStorage.setItem(key, JSON.stringify(session.value)); } catch { /* Session controls still work. */ }
  }, [key, session]);
  const setValue = useCallback((action: SetStateAction<T>) => {
    setSession(current => {
      const value = current.key === key ? current.value : fallback;
      return { key, value: typeof action === "function" ? (action as (old: T) => T)(value) : action };
    });
  }, [key, fallback]);
  return [session.key === key ? session.value : fallback, setValue] as const;
}
