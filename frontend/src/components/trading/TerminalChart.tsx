"use client";
import { useEffect, useId, useMemo, useReducer, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Bell, CandlestickChart, ChevronDown, Crosshair, Expand, Eye, EyeOff, LockKeyhole, Magnet, Minus, MoveUpRight, Plus, RectangleHorizontal, Redo2, RotateCcw, Ruler, Search, SlidersHorizontal, Trash2, Type, Undo2, UnlockKeyhole, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { continuousCandles, heikinAshi, indicators, INDICATORS, type IndicatorId, type Series } from "@/lib/terminal-indicators";
import { study, STUDY_PRESETS } from "@/lib/indicator-studies";
import { CHART_KINDS, drawingHistory, parseDrawings, type ChartKind, type ChartPoint, type ChartTool, type Drawing } from "@/lib/chart-tools";
import { INTERVAL_MS, INTERVALS, quote, type Candle, type Interval } from "@/lib/terminal-market";
import { chartGeometry } from "@/lib/workspace-layout";

const DEFAULT: IndicatorId[] = ["ema9", "sma20", "volume"];
const KINDS: Record<ChartKind, string> = { candles: "Candles", bars: "OHLC bars", line: "Line", area: "Area", heikin: "Heikin Ashi" };
const TOOLS = [
  { id: "crosshair", name: "Crosshair · drag to pan", icon: Crosshair },
  { id: "line", name: "Trend line · two points", icon: MoveUpRight },
  { id: "ray", name: "Ray · two points", icon: ArrowUpRight },
  { id: "horizontal", name: "Horizontal price level", icon: Minus },
  { id: "vertical", name: "Vertical time marker", icon: Minus },
  { id: "rectangle", name: "Price zone · two corners", icon: RectangleHorizontal },
  { id: "fib", name: "Fibonacci retracement · two points", icon: SlidersHorizontal },
  { id: "ruler", name: "Measure price and bars · two points", icon: Ruler },
  { id: "text", name: "Text annotation · choose a point", icon: Type },
] as const;
function isIndicatorId(value: unknown): value is IndicatorId { return typeof value === "string" && INDICATORS.some(indicator => indicator.id === value); }

export default function TerminalChart({ candles, pair, interval, onInterval, isFresh, onAlert }: {
  candles: Candle[]; pair: string; interval: Interval; onInterval: (value: Interval) => void; isFresh: boolean; onAlert?: () => void;
}) {
  const { user } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  const chartBody = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState(360), [panePage, setPanePage] = useState(0);
  const [width, setWidth] = useState(900), [count, setCount] = useState(100), [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<IndicatorId[]>(DEFAULT), [picker, setPicker] = useState(false), [indicatorSearch, setIndicatorSearch] = useState(""), [group, setGroup] = useState("All");
  const [kind, setKind] = useState<ChartKind>("candles"), [tool, setTool] = useState<ChartTool>("crosshair");
  const [hover, setHover] = useState<{ index: number; y: number; point: ChartPoint } | null>(null), [anchor, setAnchor] = useState<ChartPoint | null>(null);
  const [history, dispatch] = useReducer(drawingHistory, { past: [], present: [], future: [] });
  const [loadedKey, setLoadedKey] = useState(""), [notice, setNotice] = useState("");
  const [magnet, setMagnet] = useState(false), [locked, setLocked] = useState(false), [hidden, setHidden] = useState(false), [logScale, setLogScale] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [annotation, setAnnotation] = useState<ChartPoint | null>(null), [text, setText] = useState(""), [clearOpen, setClearOpen] = useState(false);
  const drag = useRef<{ x: number; offset: number } | null>(null);
  const clip = useId().replaceAll(":", ""), gradient = `${clip}-area`;
  const storageKey = `coincrest:chart:${user?.id ?? "guest"}:${pair}:${interval}`;
  useEffect(() => {
    if (!chartBody.current) return;
    const observer = new ResizeObserver(entries => {
      const bounds = entries[0].contentRect;
      if (bounds.width > 0) setWidth(Math.max(100, bounds.width));
      if (bounds.height > 0) setBodyHeight(bounds.height);
    });
    observer.observe(chartBody.current);
    const resize = () => setFullscreen(document.fullscreenElement === root.current);
    resize(); document.addEventListener("fullscreenchange", resize); window.addEventListener("resize", resize);
    return () => { observer.disconnect(); document.removeEventListener("fullscreenchange", resize); window.removeEventListener("resize", resize); };
  }, []);
  useEffect(() => {
    setLoadedKey(""); setOffset(0); setAnchor(null); setSelected(DEFAULT); setKind("candles"); setNotice("");
    dispatch({ type: "load", drawings: [] });
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.indicators)) setSelected([...new Set<IndicatorId>(saved.indicators.filter(isIndicatorId))]);
      if (saved) { dispatch({ type: "load", drawings: parseDrawings(saved.drawings) }); if (CHART_KINDS.includes(saved.kind)) setKind(saved.kind); }
    } catch { setNotice("Saved chart layout could not be loaded."); }
    setLoadedKey(storageKey);
  }, [storageKey]);
  useEffect(() => {
    if (loadedKey === storageKey) try { localStorage.setItem(storageKey, JSON.stringify({ version: 2, indicators: selected, drawings: history.present, kind })); }
    catch { setNotice("Browser storage unavailable; chart changes are not saved."); }
  }, [storageKey, loadedKey, selected, history.present, kind]);
  const consecutive = useMemo(() => continuousCandles(candles, interval), [candles, interval]);
  const computed = useMemo(() => indicators(consecutive), [consecutive]);
  const values = useMemo(() => Object.fromEntries(Object.entries(computed).map(([key, value]) => [key, [...Array(candles.length - consecutive.length).fill(null), ...value]])) as Record<string, Series>, [computed, candles.length, consecutive.length]);
  const plotted = useMemo(() => kind === "heikin" ? heikinAshi(candles, interval) : candles, [kind, candles, interval]);
  const maxOffset = Math.max(0, candles.length - 20);
  const end = Math.max(0, candles.length - Math.min(offset, maxOffset)), start = Math.max(0, end - count);
  const visible = plotted.slice(start, end), rawVisible = candles.slice(start, end);
  const activePanes = selected.filter(id => study(id).pane), overlays = selected.filter(id => id !== "volume" && !study(id).pane);
  const showVolume = selected.includes("volume");
  const { capacity } = chartGeometry(bodyHeight, activePanes.length, showVolume);
  const pages = Math.max(1, Math.ceil(activePanes.length / capacity));
  const visiblePage = Math.min(panePage, pages - 1);
  const visiblePanes = activePanes.slice(visiblePage * capacity, (visiblePage + 1) * capacity);
  const { height, top, volumeHeight, paneHeight, chartHeight } = chartGeometry(bodyHeight, visiblePanes.length, showVolume);
  const volumeBarsHeight = Math.max(2, volumeHeight - 19);
  const left = 49, right = width < 450 ? 72 : 86, plotWidth = Math.max(30, width - left - right);
  const bar = plotWidth / Math.max(visible.length, 1);
  const lows = visible.map(c => c.low), highs = visible.map(c => c.high);
  for (const id of overlays) for (const series of study(id).series) for (const n of values[series]?.slice(start, end) ?? []) if (n != null && Number.isFinite(n)) { lows.push(n); highs.push(n); }
  const bottom = lows.length ? Math.min(...lows) : 0, upper = highs.length ? Math.max(...highs) : 1;
  const padding = Math.max((upper - bottom) * .07, upper * .001);
  const minimum = Math.max(upper * .000001, bottom - padding), maximum = Math.max(minimum + .0000001, upper + padding);
  const lo = logScale ? Math.log(minimum) : minimum, hi = logScale ? Math.log(maximum) : maximum;
  const y = (price: number) => top + (hi - (logScale ? Math.log(Math.max(price, minimum)) : price)) / (hi - lo) * chartHeight;
  const priceAt = (position: number) => { const value = hi - (position - top) / chartHeight * (hi - lo); return logScale ? Math.exp(value) : value; };
  const x = (index: number) => left + (index - start + .5) * bar;
  const pointX = (time: number) => {
    const found = candles.findIndex(c => c.time === time);
    if (found >= 0) return x(found);
    return visible.length ? left + ((time - visible[0].time) / INTERVAL_MS[interval] + .5) * bar : left;
  };
  const path = (series: Series, mapY = y) => series.slice(start, end).map((n, i, arr) => n == null || !Number.isFinite(n) ? "" : `${i === 0 || arr[i - 1] == null ? "M" : "L"}${x(i + start).toFixed(2)},${mapY(n).toFixed(2)}`).join(" ");
  function eventPoint(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - bounds.left) * width / Math.max(1, bounds.width), py = (event.clientY - bounds.top) * height / Math.max(1, bounds.height);
    const index = Math.max(start, Math.min(end - 1, Math.floor((px - left) / bar) + start));
    let price = priceAt(Math.max(top, Math.min(top + chartHeight, py)));
    const c = candles[index];
    if (magnet && c) price = [c.open, c.high, c.low, c.close].reduce((a, b) => Math.abs(a - price) < Math.abs(b - price) ? a : b);
    return { px, py, index, point: { time: c?.time ?? 0, price } };
  }
  function finish(point: ChartPoint) {
    if (locked || hidden || tool === "crosshair" || point.time <= 0 || point.price <= 0) return;
    if (tool === "text") { setAnnotation(point); setText(""); return; }
    if (tool === "horizontal" || tool === "vertical") { dispatch({ type: "add", drawing: { type: tool, a: point, b: point } }); return; }
    if (!anchor) setAnchor(point);
    else { dispatch({ type: "add", drawing: { type: tool, a: anchor, b: point } }); setAnchor(null); }
  }
  function zoom(factor: number) { setCount(n => Math.max(20, Math.min(500, Math.round(n * factor)))); }
  function undo() { if (!locked) { dispatch({ type: "undo" }); setAnchor(null); } }
  function redo() { if (!locked) dispatch({ type: "redo" }); }
  const current = candles[hover?.index ?? candles.length - 1], latest = candles[candles.length - 1];
  const maximumVolume = Math.max(1, ...rawVisible.map(c => c.volume));
  const linePath = path(candles.map(c => c.close));
  const drawingNodes = (drawing: Drawing, index: number) => {
    const a = { x: pointX(drawing.a.time), y: y(drawing.a.price) }, b = { x: pointX(drawing.b.time), y: y(drawing.b.price) };
    const color = "var(--cc-accent)", priceColor = "var(--ct-drawing-level)";
    if (drawing.type === "text") return <text key={index} x={a.x + 5} y={a.y - 6} fill={color} className="ct-chart-annotation">{drawing.text}</text>;
    if (drawing.type === "vertical") return <line key={index} x1={a.x} x2={a.x} y1={top} y2={top + chartHeight} stroke={priceColor} strokeDasharray="5 3"/>;
    if (drawing.type === "horizontal") return <g key={index}><line x1={left} x2={left + plotWidth} y1={a.y} y2={a.y} stroke={priceColor} strokeDasharray="5 3"/><text x={left + 4} y={a.y - 5} fill={priceColor}>{quote(drawing.a.price)}</text></g>;
    if (drawing.type === "rectangle") return <rect key={index} x={Math.min(a.x, b.x)} y={Math.min(a.y, b.y)} width={Math.abs(a.x - b.x)} height={Math.abs(a.y - b.y)} fill={color} fillOpacity=".10" stroke={color} strokeWidth="1.2"/>;
    if (drawing.type === "fib") return <g key={index}>{[0, .236, .382, .5, .618, .786, 1].map(ratio => { const price = drawing.a.price + (drawing.b.price - drawing.a.price) * ratio; return <g key={ratio}><line x1={Math.min(a.x, b.x)} x2={Math.max(a.x, b.x)} y1={y(price)} y2={y(price)} stroke="var(--ct-drawing-fib)" opacity={.75}/><text x={Math.min(a.x, b.x) + 3} y={y(price) - 4} fill="var(--ct-drawing-fib)">{ratio} · {quote(price)}</text></g>; })}</g>;
    let bx = b.x, by = b.y;
    if (drawing.type === "ray") {
      const dx = b.x - a.x, dy = b.y - a.y;
      const factor = dx ? ((dx > 0 ? left + plotWidth : left) - a.x) / dx : dy ? ((dy > 0 ? top + chartHeight : top) - a.y) / dy : 1;
      bx = a.x + factor * dx; by = a.y + factor * dy;
    }
    return <g key={index}><line x1={a.x} x2={bx} y1={a.y} y2={by} stroke={color} strokeWidth="1.5"/><circle cx={a.x} cy={a.y} r="2.5" fill={color}/><circle cx={b.x} cy={b.y} r="2.5" fill={color}/>{drawing.type === "ruler" && <text x={Math.min(a.x, b.x) + 4} y={Math.min(a.y, b.y) - 8} fill={color}>{((drawing.b.price / drawing.a.price - 1) * 100).toFixed(2)}% · {Math.round(Math.abs(drawing.b.time - drawing.a.time) / INTERVAL_MS[interval])} bars · {quote(drawing.b.price - drawing.a.price)} USDT</text>}</g>;
  };
  const filteredIndicators = INDICATORS.filter(i => (group === "All" || (group === "Active" ? selected.includes(i.id) : i.group === group)) && `${i.name} ${i.group} ${study(i.id).description}`.toLowerCase().includes(indicatorSearch.toLowerCase()));
  const portalContainer = fullscreen ? root.current : undefined;
  return <div ref={root} className="ct-chart ct-chart-v5 ct-chart-v6" tabIndex={0} aria-label={`${pair} chart workspace`} onKeyDown={event => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Escape") { setAnchor(null); setTool("crosshair"); }
    else if (event.key === "+" || event.key === "=") { event.preventDefault(); zoom(.75); }
    else if (event.key === "-") { event.preventDefault(); zoom(1.25); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); setOffset(o => Math.min(maxOffset, o + 20)); }
    else if (event.key === "ArrowRight") { event.preventDefault(); setOffset(o => Math.max(0, o - 20)); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
  }}>
    <div className="ct-chart-controls"><div className="ct-intervals" role="group" aria-label="Chart timeframe">{INTERVALS.map(value => <button type="button" key={value} aria-pressed={interval === value} onClick={() => onInterval(value)}>{value}</button>)}</div><div className="ct-control-actions">
      <label className="ct-style-select"><CandlestickChart size={15}/><select aria-label="Chart type" value={kind} onChange={e => setKind(e.target.value as ChartKind)}>{CHART_KINDS.map(value => <option value={value} key={value}>{KINDS[value]}</option>)}</select><ChevronDown size={12}/></label>
      <button className="ct-study-button" onClick={() => setPicker(true)}><SlidersHorizontal size={15}/><span>Indicators</span><b>{selected.length}</b></button>
      {onAlert && <button title="Open price alerts" aria-label="Open price alerts" onClick={() => { if (fullscreen) void document.exitFullscreen().then(onAlert).catch(() => setNotice("Exit fullscreen to open alerts.")); else onAlert(); }}><Bell size={16}/></button>}
      <button aria-label={fullscreen ? "Exit full-screen chart" : "Full-screen chart"} title={fullscreen ? "Exit fullscreen" : "Full-screen chart"} onClick={() => { const operation = fullscreen ? document.exitFullscreen() : root.current?.requestFullscreen?.(); if (operation) void operation.catch(() => setNotice("Fullscreen is unavailable in this browser.")); else setNotice("Fullscreen is unavailable in this browser."); }}><Expand size={16}/></button>
    </div></div>
    <div className="ct-chart-readout"><strong>{pair} <i/> {interval} <i/> Binance Spot</strong>{current ? <><span>O <b>{quote(current.open)}</b></span><span>H <b>{quote(current.high)}</b></span><span>L <b>{quote(current.low)}</b></span><span>C <b className={current.close >= current.open ? "cc-positive" : "cc-negative"}>{quote(current.close)}</b></span></> : <span>Waiting for real OHLC data</span>}</div>
    {kind === "heikin" && <p className="ct-derived-notice">Heikin Ashi uses derived candles. Quotes, OHLC readout and studies still use actual market data—not the smoothed prices.</p>}
    <div className="ct-indicator-legend">{selected.filter(i => i !== "volume").map(id => { const indicator = INDICATORS.find(i => i.id === id)!; const value = values[study(id).readout]?.[hover?.index ?? candles.length - 1]; return <span key={id} style={{ color: indicator.color }}>{indicator.name} <b>{quote(value)}</b><button aria-label={`Remove ${indicator.name}`} onClick={() => setSelected(s => s.filter(x => x !== id))}><X size={10}/></button></span>; })}{selected.length === 0 && <button onClick={() => setPicker(true)}>+ Add a study</button>}</div>
    {pages > 1 && <label className="ct-pane-switcher">Study panes <select aria-label="Visible study panes" value={visiblePage} onChange={event => setPanePage(Number(event.target.value))}>{Array.from({ length: pages }, (_, page) => <option key={page} value={page}>{activePanes.slice(page * capacity, (page + 1) * capacity).map(id => INDICATORS.find(item => item.id === id)?.name).join(" + ")}</option>)}</select><span>{visiblePage + 1}/{pages} · all selected studies remain active</span></label>}
    <div ref={chartBody} className="ct-chart-body"><div className="ct-drawing-tools" role="toolbar" aria-label="Chart drawing tools">{TOOLS.map(({ id, name, icon: Icon }) => <button key={id} title={name} aria-label={name} aria-pressed={tool === id} disabled={id !== "crosshair" && (locked || hidden)} onClick={() => { setTool(id); setAnchor(null); root.current?.focus({ preventScroll: true }); }}><Icon size={17} className={id === "vertical" ? "ct-rotate-icon" : undefined}/></button>)}<span/>
      <button aria-label="Snap drawings to candle prices" title="Snap to nearest open, high, low or close" aria-pressed={magnet} onClick={() => setMagnet(v => !v)}><Magnet size={16}/></button>
      <button aria-label={locked ? "Unlock drawings" : "Lock drawings"} title={locked ? "Unlock drawings" : "Lock drawings"} aria-pressed={locked} onClick={() => { setLocked(v => !v); setAnchor(null); }} >{locked ? <LockKeyhole size={16}/> : <UnlockKeyhole size={16}/>}</button>
      <button aria-label={hidden ? "Show drawings" : "Hide drawings"} title={hidden ? "Show drawings" : "Hide drawings"} aria-pressed={hidden} onClick={() => { setHidden(v => !v); setAnchor(null); }}>{hidden ? <EyeOff size={16}/> : <Eye size={16}/>}</button><span/>
      <button aria-label="Undo drawing change" title="Undo · Ctrl Z" disabled={locked || !history.past.length} onClick={undo}><Undo2 size={16}/></button><button aria-label="Redo drawing change" title="Redo · Ctrl Shift Z" disabled={locked || !history.future.length} onClick={redo}><Redo2 size={16}/></button><button aria-label="Clear drawings" title="Clear drawings" disabled={locked || !history.present.length} onClick={() => setClearOpen(true)}><Trash2 size={16}/></button>
    </div>
    {visible.length ? <svg role="img" aria-label={`${pair} ${interval} ${KINDS[kind]} chart. ${selected.length} studies. Drawings are local to this account, market and timeframe.`} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ touchAction: "pan-y" }} onPointerMove={event => {
      const p = eventPoint(event); setHover({ index: p.index, y: Math.max(top, Math.min(top + chartHeight, p.py)), point: p.point });
      if (drag.current) { const scale = width / Math.max(1, event.currentTarget.getBoundingClientRect().width); setOffset(Math.max(0, Math.min(maxOffset, drag.current.offset + Math.round((event.clientX - drag.current.x) * scale / bar)))); }
    }} onPointerLeave={() => { if (!drag.current) setHover(null); }} onPointerDown={event => {
      if (event.button !== 0) return;
      const p = eventPoint(event); if (p.px < left || p.px > left + plotWidth || p.py < top || p.py > top + chartHeight) return;
      root.current?.focus({ preventScroll: true });
      if (tool === "crosshair" || locked || hidden) { drag.current = { x: event.clientX, offset: Math.min(offset, maxOffset) }; event.currentTarget.setPointerCapture(event.pointerId); } else finish(p.point);
    }} onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drag.current = null; }}>
      <defs><clipPath id={clip}><rect x={left} y={top} width={plotWidth} height={chartHeight}/></clipPath><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--cc-accent)" stopOpacity=".28"/><stop offset="100%" stopColor="var(--cc-accent)" stopOpacity=".02"/></linearGradient></defs>
      {[0, 1, 2, 3, 4].map(i => { const yy = top + chartHeight * i / 4; return <g key={i}><line x1={left} x2={left + plotWidth} y1={yy} y2={yy} className="ct-chart-gridline"/><text x={left + plotWidth + 8} y={yy + 4} className="ct-axis-label">{quote(priceAt(yy))}</text></g>; })}
      {[.25, .5, .75].map(r => <line key={r} x1={left + plotWidth * r} x2={left + plotWidth * r} y1={top} y2={height - 24} className="ct-chart-gridline"/>)}
      <g clipPath={`url(#${clip})`}>{kind === "line" || kind === "area" ? <>{kind === "area" && <path d={`${linePath} L${x(end - 1)},${top + chartHeight} L${x(start)},${top + chartHeight} Z`} fill={`url(#${gradient})`}/>}<path d={linePath} fill="none" stroke="var(--cc-accent)" strokeWidth="1.8"/></> : visible.map((c, i) => <g key={c.time} fill={c.close >= c.open ? "var(--ct-up)" : "var(--ct-down)"} stroke={c.close >= c.open ? "var(--ct-up)" : "var(--ct-down)"}><line x1={x(i + start)} x2={x(i + start)} y1={y(c.high)} y2={y(c.low)}/>{kind === "bars" ? <><line x1={x(i + start) - bar * .32} x2={x(i + start)} y1={y(c.open)} y2={y(c.open)}/><line x1={x(i + start)} x2={x(i + start) + bar * .32} y1={y(c.close)} y2={y(c.close)}/></> : <rect x={x(i + start) - bar * .32} y={Math.min(y(c.open), y(c.close))} width={Math.max(1, bar * .64)} height={Math.max(1, Math.abs(y(c.open) - y(c.close)))}/>}</g>)}
      {overlays.flatMap(id => study(id).series.map((series, i) => <path key={series} d={path(values[series] ?? [])} stroke={id === "supertrend" ? i === 0 ? "var(--ct-up)" : "var(--ct-down)" : INDICATORS.find(v => v.id === id)!.color} fill="none" strokeWidth={id === "supertrend" ? 2 : 1.4} strokeDasharray={study(id).series.length === 3 && i === 1 ? "4 3" : undefined}/>))}
      {latest && <line x1={left} x2={left + plotWidth} y1={y(latest.close)} y2={y(latest.close)} stroke={latest.close >= latest.open ? "var(--ct-up)" : "var(--ct-down)"} strokeDasharray="2 4" opacity=".75"/>}
      {!hidden && history.present.map(drawingNodes)}{anchor && hover && tool !== "crosshair" && <g opacity=".55">{drawingNodes({ type: tool, a: anchor, b: hover.point }, -1)}</g>}{anchor && <circle cx={pointX(anchor.time)} cy={y(anchor.price)} r="4" fill="var(--cc-accent)"/>}
      </g>
      {latest && y(latest.close) >= top && y(latest.close) <= top + chartHeight && <g><rect x={width - right} y={y(latest.close) - 11} width={right} height="22" rx="3" fill={latest.close >= latest.open ? "var(--ct-price-up)" : "var(--ct-price-down)"}/><text x={width - right + 5} y={y(latest.close) + 4} className="ct-price-label">{quote(latest.close)}</text></g>}
      {showVolume && <g><text x={left} y={top + chartHeight + 13} className="ct-axis-label">Volume · base units</text>{rawVisible.map((c, i) => <rect key={c.time} x={x(i + start) - bar * .32} y={top + chartHeight + volumeHeight - c.volume / maximumVolume * volumeBarsHeight} width={Math.max(1, bar * .64)} height={c.volume / maximumVolume * volumeBarsHeight} fill={c.close >= c.open ? "var(--ct-up)" : "var(--ct-down)"} opacity=".45"/>)}</g>}
      {visiblePanes.map((id, pane) => {
        const yy = top + chartHeight + volumeHeight + pane * paneHeight + 4, paneBottom = yy + paneHeight - 8, spec = study(id);
        const nums = spec.series.flatMap(k => values[k]?.slice(start, end).filter(n => n != null) as number[] ?? []);
        const paneLo = spec.bounds?.[0] ?? Math.min(0, ...nums, ...(spec.levels ?? [])), paneHi = spec.bounds?.[1] ?? Math.max(1e-8, ...nums, ...(spec.levels ?? []));
        const paneY = (n: number) => paneBottom - (n - paneLo) / Math.max(1e-8, paneHi - paneLo) * Math.max(2, paneHeight - 24);
        return <g key={id}><line x1={left} x2={width - right} y1={yy - 3} y2={yy - 3} className="ct-pane-divider"/><text x={left} y={yy + 10} className="ct-axis-label">{INDICATORS.find(i => i.id === id)?.name}</text>{spec.levels?.map(n => <g key={n}><line x1={left} x2={width - right} y1={paneY(n)} y2={paneY(n)} className="ct-chart-gridline"/><text x={width - right + 8} y={paneY(n) + 3} className="ct-axis-label">{n}</text></g>)}
          {id === "macd" && values.macdHist.slice(start, end).map((n, i) => n == null ? null : <rect key={i} x={x(i + start) - bar * .3} width={Math.max(1, bar * .6)} y={Math.min(paneY(0), paneY(n))} height={Math.abs(paneY(n) - paneY(0))} fill={n >= 0 ? "var(--ct-up)" : "var(--ct-down)"} opacity=".45"/>)}
          {spec.series.filter(k => k !== "macdHist").map((k, i) => <path key={k} d={path(values[k] ?? [], paneY)} stroke={["var(--cc-accent)", "var(--ct-drawing-level)", "var(--ct-down)"][i]} strokeWidth="1.4" fill="none"/>)}
          <text x={width - right + 8} y={yy + 10} className="ct-axis-label">{quote(values[spec.readout]?.[hover?.index ?? end - 1])}</text></g>;
      })}
      {(width < 450 ? [0, .5, 1] : [0, .25, .5, .75, 1]).map(ratio => { const i = start + Math.min(visible.length - 1, Math.floor(ratio * visible.length)); return <text key={ratio} x={x(i)} y={height - 8} className="ct-axis-label" textAnchor={ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"}>{new Date(candles[i].time).toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", ...(interval === "1d" || width < 600 ? {} : { hour: "2-digit", minute: "2-digit" }) })}</text>; })}
      {hover && <g><line x1={x(hover.index)} x2={x(hover.index)} y1={top} y2={height - 25} stroke="var(--cc-muted)" strokeDasharray="3 4"/><line x1={left} x2={left + plotWidth} y1={hover.y} y2={hover.y} stroke="var(--cc-muted)" strokeDasharray="3 4"/><rect x={width - right} y={hover.y - 11} width={right} height={22} rx={3} fill="var(--ct-crosshair-bg)"/><text x={width - right + 5} y={hover.y + 4} className="ct-price-label">{quote(priceAt(hover.y))}</text></g>}
    </svg> : <div className="ct-chart-empty"><Crosshair size={35}/><h3>Waiting for market candles</h3><p>The chart only plots OHLC data received from the provider. No sample candles are substituted.</p></div>}
    </div>
    <div className="ct-chart-footer"><div className="ct-bar-ranges" role="group" aria-label="Visible loaded candles">{[50, 100, 250, 500].map(n => <button key={n} aria-pressed={count === n} onClick={() => { setCount(n); setOffset(0); }}>{n === 500 ? "All" : n}</button>)}<small>bars</small></div><div><button aria-label="Use logarithmic price scale" aria-pressed={logScale} onClick={() => setLogScale(v => !v)}>log</button><button aria-label="Pan to older candles" disabled={end <= 20} onClick={() => setOffset(o => Math.min(maxOffset, o + 20))}>←</button><button aria-label="Pan to newer candles" disabled={!offset} onClick={() => setOffset(o => Math.max(0, o - 20))}>→</button><button aria-label="Zoom in" onClick={() => zoom(.75)}><Plus size={14}/></button><button aria-label="Zoom out" onClick={() => zoom(1.25)}><Minus size={14}/></button><button title="Reset to latest candles" aria-label="Reset chart view" onClick={() => { setOffset(0); setCount(100); setLogScale(false); }}><RotateCcw size={14}/></button></div></div>
    <div className="ct-chart-status"><span><i className={isFresh ? "ct-live-dot" : "ct-stale-dot"}/>{isFresh ? "Updating" : "Snapshot / waiting"} · USDT · UTC</span><span>{anchor ? "Choose the second point · Esc cancels" : locked ? "Drawings locked" : `${history.present.length}/30 drawings · saved on this device`}</span></div>
    <details className="ct-chart-notes"><summary>Chart notes & shortcuts</summary><p>26 built-in studies; this is not the TradingView script library. Values need warm-up bars; VWAP is an HLC3 estimate requiring the complete UTC session. Focus the chart: +/− zoom, arrows pan, Ctrl Z undo, Ctrl Shift Z redo, Esc cancel. Drawings do not place orders. {consecutive.length < candles.length && "A feed gap was detected; studies restart after the gap."}</p></details>{notice && <p className="ct-chart-help" role="status">{notice}</p>}
    <Dialog.Root open={picker} onOpenChange={setPicker}><Dialog.Portal container={portalContainer}><Dialog.Overlay className="cc-modal-backdrop"/><Dialog.Content className="cc-dialog ct-study-picker"><div className="cc-panel-heading"><div><span className="cc-eyebrow">Your analysis toolkit</span><Dialog.Title>Indicators & studies</Dialog.Title></div><Dialog.Close className="cc-icon-button" aria-label="Close indicators"><X size={18}/></Dialog.Close></div><Dialog.Description>26 built-in studies, calculated from this market’s received candles. No synthetic signals.</Dialog.Description><label className="ct-study-search"><Search size={17}/><input aria-label="Search indicators" placeholder="Search RSI, Supertrend, Bollinger…" value={indicatorSearch} onChange={e => setIndicatorSearch(e.target.value)}/></label>
      <div className="ct-study-presets"><span>Quick layouts</span>{STUDY_PRESETS.map(preset => <button key={preset.label} onClick={() => setSelected([...preset.ids])}>{preset.label}</button>)}</div>
      <div className="ct-study-groups" role="group" aria-label="Filter studies">{["All", "Active", ...new Set(INDICATORS.map(i => i.group))].map(g => <button key={g} aria-pressed={group === g} onClick={() => setGroup(g)}>{g}{g === "Active" ? ` (${selected.length})` : ""}</button>)}</div>
      <div className="ct-study-options">{filteredIndicators.map(i => <label key={i.id}><input type="checkbox" checked={selected.includes(i.id)} onChange={e => setSelected(s => e.target.checked ? [...new Set([...s, i.id])] : s.filter(id => id !== i.id))}/><i style={{ background: i.color }}/><span><strong>{i.name}</strong><small>{study(i.id).description}</small></span><em>{study(i.id).pane ? "Pane" : "Overlay"}</em></label>)}{!filteredIndicators.length && <p className="cc-empty">No studies match. Try another name or category.</p>}</div><footer><span>{selected.length} active · saved per market / timeframe</span><button className="cc-button" onClick={() => setSelected(DEFAULT)}>Reset studies</button><Dialog.Close className="cc-button cc-button-primary">Done</Dialog.Close></footer>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={!!annotation} onOpenChange={open => { if (!open) setAnnotation(null); }}><Dialog.Portal container={portalContainer}><Dialog.Overlay className="cc-modal-backdrop"/><Dialog.Content className="cc-dialog ct-annotation-dialog"><div className="cc-panel-heading"><Dialog.Title>Add a chart note</Dialog.Title><Dialog.Close className="cc-icon-button" aria-label="Close chart note"><X size={18}/></Dialog.Close></div><Dialog.Description>This note is saved only on this device for this market and timeframe.</Dialog.Description><form onSubmit={event => { event.preventDefault(); if (annotation && text.trim() && !locked) { dispatch({ type: "add", drawing: { type: "text", a: annotation, b: annotation, text: text.trim() } }); setAnnotation(null); setTool("crosshair"); } }}><label>Note<input maxLength={120} required autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="What are you watching at this level?"/></label><button className="cc-button cc-button-primary" disabled={!text.trim()}>Add note</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={clearOpen} onOpenChange={setClearOpen}><Dialog.Portal container={portalContainer}><Dialog.Overlay className="cc-modal-backdrop"/><Dialog.Content className="cc-dialog ct-annotation-dialog"><Dialog.Title>Clear this chart’s drawings?</Dialog.Title><Dialog.Description>Only drawings for {pair} · {interval} are removed. You can undo this while the chart stays open.</Dialog.Description><div className="cc-dialog-actions"><Dialog.Close className="cc-button">Keep drawings</Dialog.Close><button className="cc-button cc-button-primary" onClick={() => { if (!locked) dispatch({ type: "clear" }); setAnchor(null); setClearOpen(false); }}>Clear drawings</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
