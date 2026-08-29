/** Local planning preferences only. These never change server risk policy. */
export type RiskPreferences = {
  riskPerTrade: number; maxPositionExposure: number; maxDrawdown: number;
  dailyLossLimit: number; cashReserve: number; requireStop: boolean;
};
export const DEFAULT_RISK: RiskPreferences = {
  riskPerTrade: 2, maxPositionExposure: 20, maxDrawdown: 15,
  dailyLossLimit: 3, cashReserve: 5, requireStop: true,
};
export const RISK_FIELDS = [
  { key: "riskPerTrade", label: "Risk per trade", description: "Planned loss at the stop as a percentage of planning capital.", step: 0.1 },
  { key: "maxPositionExposure", label: "Position exposure", description: "Maximum notional value of one planned position.", step: 1 },
  { key: "dailyLossLimit", label: "Daily loss limit", description: "Your daily loss threshold. Monitoring and enforcement need backend integration.", step: 0.1 },
  { key: "maxDrawdown", label: "Portfolio drawdown", description: "Your peak-to-trough loss threshold. This is not a current drawdown measurement.", step: 1 },
  { key: "cashReserve", label: "Cash reserve", description: "Capital you intend to leave unallocated in the planning calculator.", step: 1 },
] as const;
export function parseRiskPreferences(value: unknown): RiskPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid risk preferences");
  const row = value as Record<string, unknown>;
  for (const { key } of RISK_FIELDS) if (typeof row[key] !== "number" || !Number.isFinite(row[key]) || row[key] < 0 || row[key] > 100) throw new Error("Each percentage must be between 0 and 100.");
  if (typeof row.requireStop !== "boolean") throw new Error("Invalid stop-loss preference");
  return { riskPerTrade: row.riskPerTrade as number, maxPositionExposure: row.maxPositionExposure as number, maxDrawdown: row.maxDrawdown as number, dailyLossLimit: row.dailyLossLimit as number, cashReserve: row.cashReserve as number, requireStop: row.requireStop };
}
export function riskStorageKey(userId: string, mode: "paper" | "live") { return `coincrest:risk:v1:${encodeURIComponent(userId)}:${mode}`; }
export function parseRiskRecord(value: unknown, userId: string, mode: "paper" | "live") {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid saved risk profile");
  const row = value as Record<string, unknown>;
  if (row.version !== 1 || row.userId !== userId || row.mode !== mode || typeof row.savedAt !== "string" || !Number.isFinite(Date.parse(row.savedAt))) throw new Error("Saved risk profile does not match this account and mode.");
  return { preferences: parseRiskPreferences(row.preferences), savedAt: row.savedAt };
}
export function calculateRiskSize({ equity, entry, stop, cash = equity, side = "BUY", preferences }: { equity: number; entry: number; stop: number; cash?: number; side?: "BUY" | "SELL"; preferences: RiskPreferences }) {
  const policy = parseRiskPreferences(preferences);
  if (![equity, entry, stop].every(n => Number.isFinite(n) && n > 0 && n <= Number.MAX_SAFE_INTEGER / 100) || !Number.isFinite(cash) || cash < 0 || cash > Number.MAX_SAFE_INTEGER / 100) return null;
  if (side === "BUY" ? stop >= entry : stop <= entry) return null;
  const budget = equity * policy.riskPerTrade / 100, distance = Math.abs(entry - stop);
  const exposureCap = equity * policy.maxPositionExposure / 100;
  const available = Math.max(0, cash - equity * policy.cashReserve / 100);
  const quantity = Math.min(budget / distance, exposureCap / entry, available / entry);
  const notional = quantity * entry, lossAtStop = quantity * distance;
  if (![quantity, notional, lossAtStop].every(Number.isFinite)) return null;
  return { budget, quantity, notional, lossAtStop, exposureCap, available, distance };
}
