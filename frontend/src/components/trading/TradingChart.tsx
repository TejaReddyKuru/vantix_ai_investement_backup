"use client"

import { useMemo, useState } from "react"
import CandlestickChart from "../charts/CandlestickChart"
import { getMarketCandles } from "../charts/mockMarketOHLC"
import { ChartPeriod } from "../charts/types"

type TradingChartProps = {
  assetSymbol?: string
  assetName?: string
  height?: number
  className?: string
}

export default function TradingChart({
  assetSymbol = "BTC",
  assetName = "Bitcoin",
  height = 360,
  className,
}: TradingChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>("1M")

  const candleData = useMemo(() => {
    return getMarketCandles(assetSymbol, period)
  }, [assetSymbol, period])

  return (
    <CandlestickChart
      data={candleData}
      period={period}
      onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
      assetSymbol={assetSymbol}
      assetName={assetName}
      height={height}
      showVolume={true}
      showControls={true}
      className={className}
    />
  )
}
