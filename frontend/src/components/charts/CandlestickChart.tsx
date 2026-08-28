"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts"
import {
  BarChart2,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  TrendingUp,
} from "lucide-react"
import { CandlestickChartProps, ChartPeriod, HoveredCandle } from "./types"

const PERIODS: ChartPeriod[] = ["1D", "1W", "1M", "3M", "1Y"]

// Real Stock Market Standard Palette (TradingView / Wall Street)
const BULLISH_COLOR = "#089981" // Standard Market Emerald Green
const BEARISH_COLOR = "#F23645" // Standard Market Coral Red

export default function CandlestickChart({
  data,
  period = "1M",
  onPeriodChange,
  assetSymbol = "BTC",
  assetName = "Bitcoin",
  currentPrice,
  priceChange,
  height = 360,
  showVolume = true,
  showControls = true,
  theme = "light",
  enableZoom = true,
  enablePan = true,
  isLoading = false,
  className = "",
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)

  const [hoveredCandle, setHoveredCandle] = useState<HoveredCandle | null>(null)
  const [volumeVisible, setVolumeVisible] = useState(showVolume)

  // Latest candle for fallback header
  const latestCandle = useMemo(() => {
    if (!data || data.length === 0) return null
    const last = data[data.length - 1]
    const change = last.close - last.open
    const changePercent = (change / (last.open || 1)) * 100
    return {
      time: last.time,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      volume: last.volume,
      change,
      changePercent,
      isBullish: last.close >= last.open,
    }
  }, [data])

  const activeHeader = hoveredCandle || latestCandle

  useEffect(() => {
    if (!chartContainerRef.current) return

    const container = chartContainerRef.current
    const isDark = theme === "dark"

    // 1. Initialize TradingView Lightweight Chart
    const chart = createChart(container, {
      width: container.clientWidth,
      height: height,
      layout: {
        background: {
          type: ColorType.Solid,
          color: isDark ? "#0D100E" : "#FFFFFF",
        },
        textColor: isDark ? "#A0A096" : "#6B6B63",
        fontSize: 11,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      },
      grid: {
        vertLines: {
          color: isDark ? "rgba(255,255,255,0.04)" : "#F0EFE6",
        },
        horzLines: {
          color: isDark ? "rgba(255,255,255,0.04)" : "#F0EFE6",
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#0F2D1F",
          width: 1,
          style: 3,
          labelBackgroundColor: "#0F2D1F",
        },
        horzLine: {
          color: "#0F2D1F",
          width: 1,
          style: 3,
          labelBackgroundColor: "#0F2D1F",
        },
      },
      rightPriceScale: {
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E1D5",
        scaleMargins: {
          top: 0.1,
          bottom: volumeVisible ? 0.25 : 0.1,
        },
      },
      timeScale: {
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E1D5",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: enablePan,
      handleScale: enableZoom,
    })

    chartInstanceRef.current = chart

    // 2. Add Candlestick Series (Real Stock Market Green & Red)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: BULLISH_COLOR,
      downColor: BEARISH_COLOR,
      borderUpColor: BULLISH_COLOR,
      borderDownColor: BEARISH_COLOR,
      wickUpColor: BULLISH_COLOR,
      wickDownColor: BEARISH_COLOR,
    })
    candleSeriesRef.current = candleSeries

    // 3. Add Volume Histogram Series
    let volumeSeries: ISeriesApi<"Histogram"> | null = null
    if (volumeVisible) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "", // overlay
      })
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      })
      volumeSeriesRef.current = volumeSeries
    }

    // 4. Set Chart Data
    if (data && data.length > 0) {
      const sortedData = [...data].sort((a, b) =>
        a.time.localeCompare(b.time)
      )

      candleSeries.setData(
        sortedData.map((d) => ({
          time: d.time as string,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      )

      if (volumeSeries) {
        volumeSeries.setData(
          sortedData.map((d) => ({
            time: d.time as string,
            value: d.volume || 0,
            color: d.close >= d.open ? `${BULLISH_COLOR}50` : `${BEARISH_COLOR}50`,
          }))
        )
      }

      chart.timeScale().fitContent()
    }

    // 5. Crosshair hover listener for live OHLC readout
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        setHoveredCandle(null)
      } else {
        const cData = param.seriesData.get(candleSeries) as
          | { open: number; high: number; low: number; close: number }
          | undefined

        if (cData) {
          const change = cData.close - cData.open
          const changePercent = (change / (cData.open || 1)) * 100
          setHoveredCandle({
            time: String(param.time),
            open: cData.open,
            high: cData.high,
            low: cData.low,
            close: cData.close,
            change,
            changePercent,
            isBullish: cData.close >= cData.open,
          })
        }
      }
    })

    // 6. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].target) return
      const newRect = entries[0].contentRect
      chart.applyOptions({
        width: newRect.width,
      })
    })

    resizeObserver.observe(container)

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartInstanceRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [data, height, theme, volumeVisible, enablePan, enableZoom])

  function handleZoomIn() {
    const timeScale = chartInstanceRef.current?.timeScale()
    if (!timeScale) return
    const logicalRange = timeScale.getVisibleLogicalRange()
    if (logicalRange) {
      const span = logicalRange.to - logicalRange.from
      const delta = span * 0.2
      timeScale.setVisibleLogicalRange({
        from: logicalRange.from + delta,
        to: logicalRange.to - delta,
      })
    }
  }

  function handleZoomOut() {
    const timeScale = chartInstanceRef.current?.timeScale()
    if (!timeScale) return
    const logicalRange = timeScale.getVisibleLogicalRange()
    if (logicalRange) {
      const span = logicalRange.to - logicalRange.from
      const delta = span * 0.2
      timeScale.setVisibleLogicalRange({
        from: logicalRange.from - delta,
        to: logicalRange.to + delta,
      })
    }
  }

  function handleResetView() {
    chartInstanceRef.current?.timeScale().fitContent()
  }

  return (
    <div
      className={[
        "relative flex flex-col overflow-hidden rounded-2xl border border-[#DDDCD0] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.025)]",
        className,
      ].join(" ")}
    >
      {/* 1. Header Toolbar & Real-Time OHLC Readout */}
      <div className="flex flex-col justify-between gap-3 border-b border-[#E8E7DC] bg-[#FAFAF7] px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        {/* Left: Asset info and OHLC metrics */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-[#171717]">
                {assetSymbol}/USD
              </span>
              <span className="rounded-full bg-[#E8F2EA] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-[#089981]">
                Candles
              </span>
            </div>
            <div className="text-[10px] font-medium text-[#8A897F]">
              {assetName} · Live Market Data
            </div>
          </div>

          {/* Interactive OHLC Readout Bar */}
          {activeHeader && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#E2E1D5] bg-white px-3 py-1 text-[10px] font-semibold tabular-nums shadow-xs">
              <span className="text-[#8A897F]">
                O:{" "}
                <strong className="text-[#171717]">
                  ${activeHeader.open.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </span>
              <span className="text-[#8A897F]">
                H:{" "}
                <strong className="text-[#171717]">
                  ${activeHeader.high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </span>
              <span className="text-[#8A897F]">
                L:{" "}
                <strong className="text-[#171717]">
                  ${activeHeader.low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </span>
              <span className="text-[#8A897F]">
                C:{" "}
                <strong
                  style={{
                    color: activeHeader.isBullish ? BULLISH_COLOR : BEARISH_COLOR,
                  }}
                >
                  ${activeHeader.close.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </span>
              <span
                className="font-extrabold"
                style={{
                  color: activeHeader.isBullish ? BULLISH_COLOR : BEARISH_COLOR,
                }}
              >
                {activeHeader.change >= 0 ? "+" : ""}
                {activeHeader.change.toFixed(2)} (
                {activeHeader.changePercent >= 0 ? "+" : ""}
                {activeHeader.changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {/* Right: Period Timeframe Buttons & Controls */}
        {showControls && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Timeframe Selector */}
            <div className="flex rounded-lg border border-[#E2E1D5] bg-white p-0.5 shadow-xs">
              {PERIODS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPeriodChange?.(item)}
                  className={[
                    "rounded-md px-2.5 py-1 text-[9px] font-extrabold transition-all duration-200",
                    period === item
                      ? "bg-[#0F2D1F] text-white shadow-xs"
                      : "text-[#8A897F] hover:text-[#171717]",
                  ].join(" ")}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Volume Toggle */}
            <button
              type="button"
              onClick={() => setVolumeVisible((prev) => !prev)}
              title={volumeVisible ? "Hide volume" : "Show volume"}
              className={[
                "flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition-colors",
                volumeVisible
                  ? "border-[#0F2D1F] bg-[#E8F2EA] text-[#0F2D1F]"
                  : "border-[#E2E1D5] bg-white text-[#8A897F] hover:text-[#171717]",
              ].join(" ")}
            >
              <BarChart2 size={13} />
            </button>

            {/* Zoom / Reset Controls */}
            {enableZoom && (
              <div className="flex items-center gap-0.5 rounded-lg border border-[#E2E1D5] bg-white p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom in"
                  className="flex h-6 w-6 items-center justify-center rounded text-[#66665F] hover:bg-[#F7F6E8] hover:text-[#0F2D1F]"
                >
                  <Plus size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom out"
                  className="flex h-6 w-6 items-center justify-center rounded text-[#66665F] hover:bg-[#F7F6E8] hover:text-[#0F2D1F]"
                >
                  <Minus size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  title="Reset view"
                  className="flex h-6 w-6 items-center justify-center rounded text-[#66665F] hover:bg-[#F7F6E8] hover:text-[#0F2D1F]"
                >
                  <RotateCcw size={11} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Candlestick Canvas Container */}
      <div className="relative w-full" style={{ height: height }}>
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-xs">
            <div className="flex items-center gap-2 rounded-xl bg-[#0F2D1F] px-4 py-2 text-xs font-bold text-white shadow-lg">
              <RefreshCw size={14} className="animate-spin" />
              <span>Loading Candlesticks...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!data || data.length === 0) && !isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white p-6 text-center">
            <TrendingUp size={28} className="text-[#8A897F]" />
            <p className="mt-2 text-xs font-bold text-[#171717]">
              No candlestick market data available
            </p>
            <p className="text-[10px] text-[#8A897F]">
              Select a different timeframe or asset.
            </p>
          </div>
        )}

        {/* Lightweight Charts Mount Target */}
        <div ref={chartContainerRef} className="h-full w-full" />
      </div>

      {/* 3. Footer Legend & Disclaimer */}
      <div className="flex items-center justify-between border-t border-[#E8E7DC] bg-[#FAFAF7] px-4 py-2 text-[9px] font-semibold text-[#8A897F]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: BULLISH_COLOR }} />
            Bullish (Close &gt; Open)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: BEARISH_COLOR }} />
            Bearish (Close &lt; Open)
          </span>
          {volumeVisible && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: `${BULLISH_COLOR}80` }} />
              Volume Histogram
            </span>
          )}
        </div>

        <span className="hidden sm:inline text-[#A09F96]">
          Drag to pan · Scroll to zoom · Hover for OHLC values
        </span>
      </div>
    </div>
  )
}
