import { type IndicatorId } from "./terminal-indicators";
export type Study = { pane: boolean; series: string[]; readout: string; description: string; bounds?: [number, number]; levels?: number[] };
export function study(id: IndicatorId): Study {
  const base: Study = { pane: false, series: [id], readout: id, description: "A moving average of received closing prices. Warm-up bars are required." };
  const special: Partial<Record<IndicatorId, Partial<Study>>> = {
    volume: { description: "Base-asset traded volume for each candle." },
    bb: { series: ["bbUpper", "bbMiddle", "bbLower"], readout: "bbMiddle", description: "20-bar SMA with two population standard deviations above and below." },
    vwap: { description: "HLC3 volume-weighted average. Resets at UTC midnight; hidden until a complete session start is present." },
    donchian: { series: ["donchianUpper", "donchian", "donchianLower"], description: "Highest high, lowest low and midpoint over 20 bars, including the current bar." },
    keltner: { series: ["keltnerUpper", "keltner", "keltnerLower"], description: "20-bar EMA surrounded by two times 10-bar Wilder ATR." },
    supertrend: { series: ["supertrendUp", "supertrendDown"], description: "Trailing bands from HL2 and three times 10-bar Wilder ATR; trend changes at band crossings." },
    wma20: { description: "20-bar weighted average, with linearly greater weight on recent closes." },
    hma16: { description: "Hull average: WMA 4 of (2 × WMA 8 − WMA 16)." },
    rsi: { pane: true, bounds: [0, 100], levels: [30, 70], description: "14-bar relative strength, using Wilder-smoothed gains and losses." },
    macd: { pane: true, series: ["macd", "macdSignal", "macdHist"], levels: [0], description: "EMA 12 minus EMA 26, with a 9-period EMA signal and difference histogram." },
    stoch: { pane: true, series: ["stoch", "stochD"], bounds: [0, 100], levels: [20, 80], description: "14-bar fast stochastic %K with a three-bar SMA %D." },
    atr: { pane: true, description: "14-bar Wilder-smoothed true range. Values are price units, not percentages." },
    adx: { pane: true, series: ["adx", "plusDi", "minusDi"], bounds: [0, 100], levels: [25], description: "14-bar Wilder directional movement, +DI/−DI and smoothed trend strength." },
    obv: { pane: true, levels: [0], description: "Cumulative signed volume, starting at zero at the beginning of available uninterrupted history." },
    cci: { pane: true, levels: [-100, 0, 100], description: "20-bar typical-price deviation divided by 0.015 times mean absolute deviation." },
    williams: { pane: true, bounds: [-100, 0], levels: [-80, -20], description: "14-bar close location in its high/low range; values range from −100 to 0." },
    roc: { pane: true, levels: [0], description: "Percentage change from the closing price 12 bars earlier." },
    mfi: { pane: true, bounds: [0, 100], levels: [20, 80], description: "14-bar positive/negative typical-price money flows; unavailable for zero-volume windows." },
    cmf: { pane: true, levels: [0], description: "21-bar volume-weighted close location within candle ranges. Zero-volume windows are unavailable." },
  };
  return { ...base, ...special[id] };
}
export const STUDY_PRESETS: { label: string; ids: IndicatorId[] }[] = [
  { label: "Clean chart", ids: ["volume"] },
  { label: "Trend", ids: ["ema9", "ema21", "sma200", "volume", "adx"] },
  { label: "Momentum", ids: ["ema21", "volume", "rsi", "macd"] },
  { label: "Volatility", ids: ["bb", "keltner", "volume", "atr"] },
];
