export type ChartPoint = { time: number; price: number };
export const DRAWING_TYPES = ["line", "ray", "horizontal", "vertical", "rectangle", "fib", "ruler", "text"] as const;
export type Drawing = { type: typeof DRAWING_TYPES[number]; a: ChartPoint; b: ChartPoint; text?: string };
export type ChartTool = "crosshair" | Drawing["type"];
export const CHART_KINDS = ["candles", "bars", "line", "area", "heikin"] as const;
export type ChartKind = typeof CHART_KINDS[number];
export type DrawingHistory = { past: Drawing[][]; present: Drawing[]; future: Drawing[][] };
export type DrawingAction = { type: "add"; drawing: Drawing } | { type: "load"; drawings: Drawing[] } | { type: "undo" | "redo" | "clear" };
export function parseDrawings(value: unknown): Drawing[] {
  if (!Array.isArray(value)) return [];
  const validPoint = (p: unknown): p is ChartPoint => !!p && typeof p === "object" && ["time", "price"].every(key => {
    const n = (p as Record<string, unknown>)[key];
    return typeof n === "number" && Number.isFinite(n) && n > 0 && n < Number.MAX_SAFE_INTEGER;
  });
  return value.filter((drawing): drawing is Drawing => {
    if (!drawing || typeof drawing !== "object" || !DRAWING_TYPES.includes(drawing.type) || !validPoint(drawing.a) || !validPoint(drawing.b)) return false;
    return drawing.type !== "text" || (typeof drawing.text === "string" && drawing.text.trim().length > 0 && drawing.text.length <= 120);
  }).slice(-30).map(d => ({ type: d.type, a: { time: d.a.time, price: d.a.price }, b: { time: d.b.time, price: d.b.price }, ...(d.type === "text" ? { text: d.text } : {}) }));
}
export function drawingHistory(state: DrawingHistory, action: DrawingAction): DrawingHistory {
  if (action.type === "load") return { past: [], present: parseDrawings(action.drawings), future: [] };
  if (action.type === "undo") return state.past.length ? { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future].slice(0, 30) } : state;
  if (action.type === "redo") return state.future.length ? { past: [...state.past, state.present].slice(-30), present: state.future[0], future: state.future.slice(1) } : state;
  if (action.type === "clear" && !state.present.length) return state;
  const present = action.type === "add" ? parseDrawings([...state.present, action.drawing]) : [];
  return { past: [...state.past, state.present].slice(-30), present, future: [] };
}
