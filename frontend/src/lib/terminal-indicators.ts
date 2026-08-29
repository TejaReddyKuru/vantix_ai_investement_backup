import { INTERVAL_MS, type Candle, type Interval } from "./terminal-market";
export type Series = (number | null)[];
export const INDICATORS = [
  { id: "sma20", name: "SMA 20", group: "Trend", color: "#d29b1f" },
  { id: "sma50", name: "SMA 50", group: "Trend", color: "#9973c6" },
  { id: "sma200", name: "SMA 200", group: "Trend", color: "#405c89" },
  { id: "ema9", name: "EMA 9", group: "Trend", color: "#2f78b7" },
  { id: "ema21", name: "EMA 21", group: "Trend", color: "#d58051" },
  { id: "ema50", name: "EMA 50", group: "Trend", color: "#6b6aaa" },
  { id: "bb", name: "Bollinger Bands 20 / 2", group: "Volatility", color: "#849dbb" },
  { id: "vwap", name: "VWAP · UTC session", group: "Volume", color: "#4c9c9c" },
  { id: "volume", name: "Volume", group: "Volume", color: "#22704e" },
  { id: "rsi", name: "RSI 14", group: "Momentum", color: "#9973c6" },
  { id: "macd", name: "MACD 12 / 26 / 9", group: "Momentum", color: "#2f78b7" },
  { id: "stoch", name: "Stochastic 14 / 3", group: "Momentum", color: "#d29b1f" },
  { id: "atr", name: "ATR 14 · Wilder", group: "Volatility", color: "#d58051" },
  { id: "adx", name: "ADX + DI 14 · Wilder", group: "Trend strength", color: "#405c89" },
  { id: "obv", name: "On-balance volume", group: "Volume", color: "#4c9c9c" },
  { id: "ema200", name: "EMA 200", group: "Trend", color: "#b498e9" },
  { id: "wma20", name: "Weighted MA 20", group: "Trend", color: "#55b2c6" },
  { id: "hma16", name: "Hull MA 16", group: "Trend", color: "#d79a6f" },
  { id: "donchian", name: "Donchian Channels 20", group: "Volatility", color: "#8c9fe5" },
  { id: "keltner", name: "Keltner · EMA 20 / ATR 10 / 2", group: "Volatility", color: "#65aba8" },
  { id: "supertrend", name: "Supertrend · ATR 10 / 3", group: "Trend", color: "#32ac85" },
  { id: "cci", name: "Commodity Channel Index 20", group: "Momentum", color: "#c295df" },
  { id: "williams", name: "Williams %R 14", group: "Momentum", color: "#d3a543" },
  { id: "roc", name: "Rate of Change 12", group: "Momentum", color: "#60b3d3" },
  { id: "mfi", name: "Money Flow Index 14", group: "Volume", color: "#ac95da" },
  { id: "cmf", name: "Chaikin Money Flow 21", group: "Volume", color: "#56b295" },
] as const;
export type IndicatorId = (typeof INDICATORS)[number]["id"];
export function wma(values: Series, period: number): Series {
  return values.map((_, index) => {
    if (index < period - 1) return null;
    const window = values.slice(index - period + 1, index + 1);
    return window.some(n => n == null) ? null : window.reduce<number>((sum, n, i) => sum + n! * (i + 1), 0) / (period * (period + 1) / 2);
  });
}
export function heikinAshi(candles: Candle[], interval?: Interval): Candle[] {
  const output: Candle[] = [];
  candles.forEach((candle, index) => {
    const close = (candle.open + candle.high + candle.low + candle.close) / 4;
    const consecutive = index > 0 && (!interval || candle.time - candles[index - 1].time === INTERVAL_MS[interval]);
    const open = consecutive ? (output[index - 1].open + output[index - 1].close) / 2 : (candle.open + candle.close) / 2;
    output.push({ ...candle, open, close, high: Math.max(candle.high, open, close), low: Math.min(candle.low, open, close) });
  });
  return output;
}
export function sma(values: Series, period: number): Series {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const window = values.slice(i + 1 - period, i + 1);
    return window.some(n => n == null) ? null : (window as number[]).reduce((a, b) => a + b, 0) / period;
  });
}
export function ema(values: Series, period: number, wilder = false): Series {
  let previous: number | null = null;
  let seed: number[] = [];
  const alpha = wilder ? 1 / period : 2 / (period + 1);
  return values.map(value => {
    if (value == null) { previous = null; seed = []; return null; }
    if (previous == null) { seed.push(value); if (seed.length < period) return null; previous = seed.reduce((a, b) => a + b, 0) / period; }
    else previous += alpha * (value - previous);
    return previous;
  });
}
export function rsi(values: number[], period = 14): Series {
  const gains = values.map((n, i) => i ? Math.max(0, n - values[i - 1]) : null);
  const losses = values.map((n, i) => i ? Math.max(0, values[i - 1] - n) : null);
  const g = ema(gains, period, true), l = ema(losses, period, true);
  return values.map((_, i) => g[i] == null || l[i] == null ? null : l[i] === 0 ? g[i] === 0 ? 50 : 100 : 100 - 100 / (1 + g[i]! / l[i]!));
}
export function continuousCandles(candles: Candle[], interval: Interval): Candle[] {
  let start = 0;
  for (let i = 1; i < candles.length; i++) if (candles[i].time - candles[i - 1].time !== INTERVAL_MS[interval]) start = i;
  return candles.slice(start);
}
export function indicators(candles: Candle[]): Record<string, Series> {
  const close = candles.map(c => c.close);
  const output: Record<string, Series> = {};
  for (const n of [20, 50, 200]) output[`sma${n}`] = sma(close, n);
  for (const n of [9, 21, 50, 200]) output[`ema${n}`] = ema(close, n);
  output.wma20 = wma(close, 20);
  const halfHull = wma(close, 8), fullHull = wma(close, 16);
  output.hma16 = wma(close.map((_, i) => halfHull[i] == null || fullHull[i] == null ? null : 2 * halfHull[i]! - fullHull[i]!), 4);
  output.rsi = rsi(close);
  output.bbMiddle = output.sma20;
  const deviations = close.map((_, i) => i < 19 ? null : Math.sqrt(close.slice(i - 19, i + 1).reduce((sum, value) => sum + (value - output.sma20[i]!) ** 2, 0) / 20));
  output.bbUpper = close.map((_, i) => deviations[i] == null ? null : output.sma20[i]! + 2 * deviations[i]!);
  output.bbLower = close.map((_, i) => deviations[i] == null ? null : output.sma20[i]! - 2 * deviations[i]!);
  const fast = ema(close, 12), slow = ema(close, 26);
  output.macd = close.map((_, i) => fast[i] == null || slow[i] == null ? null : fast[i]! - slow[i]!);
  output.macdSignal = ema(output.macd, 9);
  output.macdHist = close.map((_, i) => output.macdSignal[i] == null ? null : output.macd[i]! - output.macdSignal[i]!);
  const tr = candles.map((c, i) => i === 0 ? null : Math.max(c.high - c.low, Math.abs(c.high - candles[i - 1].close), Math.abs(c.low - candles[i - 1].close)));
  output.atr = ema(tr, 14, true);
  const plus = ema(candles.map((c, i) => { if (!i) return null; const up = c.high - candles[i - 1].high, down = candles[i - 1].low - c.low; return up > down && up > 0 ? up : 0; }), 14, true);
  const minus = ema(candles.map((c, i) => { if (!i) return null; const up = c.high - candles[i - 1].high, down = candles[i - 1].low - c.low; return down > up && down > 0 ? down : 0; }), 14, true);
  output.plusDi = close.map((_, i) => output.atr[i] == null ? null : output.atr[i] === 0 ? 0 : 100 * plus[i]! / output.atr[i]!);
  output.minusDi = close.map((_, i) => output.atr[i] == null ? null : output.atr[i] === 0 ? 0 : 100 * minus[i]! / output.atr[i]!);
  output.adx = ema(close.map((_, i) => output.plusDi[i] == null ? null : output.plusDi[i]! + output.minusDi[i]! === 0 ? 0 : 100 * Math.abs(output.plusDi[i]! - output.minusDi[i]!) / (output.plusDi[i]! + output.minusDi[i]!)), 14, true);
  output.stoch = close.map((value, i) => { if (i < 13) return null; const window = candles.slice(i - 13, i + 1), high = Math.max(...window.map(c => c.high)), low = Math.min(...window.map(c => c.low)); return high === low ? 50 : 100 * (value - low) / (high - low); });
  output.stochD = sma(output.stoch, 3);
  let obv = 0, day = "", pv = 0, volume = 0, fullSession = false;
  output.obv = candles.map((c, i) => { if (i) obv += Math.sign(c.close - candles[i - 1].close) * c.volume; return obv; });
  output.vwap = candles.map(c => {
    const next = new Date(c.time).toISOString().slice(0, 10);
    if (next !== day) { day = next; pv = 0; volume = 0; fullSession = c.time % 86400000 === 0; }
    pv += (c.high + c.low + c.close) / 3 * c.volume; volume += c.volume;
    return fullSession && volume > 0 ? pv / volume : null;
  });
  output.volume = candles.map(c => c.volume);
  output.donchianUpper = candles.map((_, i) => i < 19 ? null : Math.max(...candles.slice(i - 19, i + 1).map(c => c.high)));
  output.donchianLower = candles.map((_, i) => i < 19 ? null : Math.min(...candles.slice(i - 19, i + 1).map(c => c.low)));
  output.donchian = candles.map((_, i) => output.donchianUpper[i] == null ? null : (output.donchianUpper[i]! + output.donchianLower[i]!) / 2);
  const atr10 = ema(tr, 10, true);
  output.keltner = ema(close, 20);
  output.keltnerUpper = close.map((_, i) => output.keltner[i] == null || atr10[i] == null ? null : output.keltner[i]! + 2 * atr10[i]!);
  output.keltnerLower = close.map((_, i) => output.keltner[i] == null || atr10[i] == null ? null : output.keltner[i]! - 2 * atr10[i]!);
  let upperBand = 0, lowerBand = 0, direction: "up" | "down" = "down";
  output.supertrendUp = close.map(() => null); output.supertrendDown = close.map(() => null);
  output.supertrend = candles.map((c, i) => {
    if (atr10[i] == null) return null;
    const mid = (c.high + c.low) / 2, basicUpper = mid + 3 * atr10[i]!, basicLower = mid - 3 * atr10[i]!;
    if (!i || atr10[i - 1] == null) { upperBand = basicUpper; lowerBand = basicLower; direction = "down"; }
    else {
      const previousClose = candles[i - 1].close;
      upperBand = basicUpper < upperBand || previousClose > upperBand ? basicUpper : upperBand;
      lowerBand = basicLower > lowerBand || previousClose < lowerBand ? basicLower : lowerBand;
      direction = direction === "down" ? c.close > upperBand ? "up" : "down" : c.close < lowerBand ? "down" : "up";
    }
    const level = direction === "up" ? lowerBand : upperBand;
    output[direction === "up" ? "supertrendUp" : "supertrendDown"][i] = level;
    return level;
  });
  const typical = candles.map(c => (c.high + c.low + c.close) / 3), typicalSma = sma(typical, 20);
  output.cci = typical.map((value, i) => {
    if (typicalSma[i] == null) return null;
    const deviation = typical.slice(i - 19, i + 1).reduce((sum, n) => sum + Math.abs(n - typicalSma[i]!), 0) / 20;
    return deviation === 0 ? 0 : (value - typicalSma[i]!) / (0.015 * deviation);
  });
  output.williams = candles.map((c, i) => {
    if (i < 13) return null;
    const window = candles.slice(i - 13, i + 1), high = Math.max(...window.map(v => v.high)), low = Math.min(...window.map(v => v.low));
    return high === low ? null : -100 * (high - c.close) / (high - low);
  });
  output.roc = close.map((value, i) => i < 12 ? null : 100 * (value / close[i - 12] - 1));
  output.mfi = candles.map((_, i) => {
    if (i < 14) return null;
    let positive = 0, negative = 0, totalVolume = 0;
    for (let j = i - 13; j <= i; j++) {
      totalVolume += candles[j].volume;
      if (typical[j] > typical[j - 1]) positive += typical[j] * candles[j].volume;
      if (typical[j] < typical[j - 1]) negative += typical[j] * candles[j].volume;
    }
    return totalVolume === 0 ? null : negative === 0 ? positive === 0 ? 50 : 100 : 100 - 100 / (1 + positive / negative);
  });
  output.cmf = candles.map((_, i) => {
    if (i < 20) return null;
    let flow = 0, total = 0;
    for (const c of candles.slice(i - 20, i + 1)) { total += c.volume; flow += c.high === c.low ? 0 : (2 * c.close - c.low - c.high) / (c.high - c.low) * c.volume; }
    return total === 0 ? null : flow / total;
  });
  return output;
}
