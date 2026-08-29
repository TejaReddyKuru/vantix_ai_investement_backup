"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
type Theme = "system" | "light" | "dark";
const ThemeContext = createContext({ theme: "system" as Theme, resolved: "light" as "light" | "dark", ready: false, change: (_theme: Theme) => {} });
export const useTheme = () => useContext(ThemeContext);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system"), [ready, setReady] = useState(false);
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  useEffect(() => { try { const saved = localStorage.getItem("coincrest:theme"); if (saved === "dark" || saved === "light" || saved === "system") setTheme(saved); } catch {} setReady(true); }, []);
  useEffect(() => {
    if (!ready) return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { const value = theme === "system" ? media.matches ? "dark" : "light" : theme; document.documentElement.dataset.theme = value; setResolved(value); };
    apply(); media.addEventListener("change", apply); return () => media.removeEventListener("change", apply);
  }, [theme, ready]);
  function change(value: Theme) { setTheme(value); try { localStorage.setItem("coincrest:theme", value); } catch {} }
  return <ThemeContext.Provider value={{ theme, resolved, ready, change }}>{children}</ThemeContext.Provider>;
}
export function ThemeControl() {
  const { resolved, ready, change } = useTheme();
  const dark = resolved === "dark";
  return <button type="button" role="switch" aria-checked={dark} aria-label="Dark mode" disabled={!ready} title={dark ? "Switch to light theme" : "Switch to dark theme"} className={`cc-theme-toggle ${dark ? "is-dark" : ""}`} onClick={() => change(dark ? "light" : "dark")}><span className="cc-theme-thumb"/><Sun size={15} aria-hidden="true"/><Moon size={15} aria-hidden="true"/></button>;
}
export function ThemeSettings() {
  const { theme, change } = useTheme();
  return <div className="cc-theme-settings"><ThemeControl/><button type="button" className="cc-button" aria-pressed={theme === "system"} onClick={() => change("system")}><Monitor size={15}/>Follow device</button></div>;
}
