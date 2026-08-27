export type ChartPeriod = "1D" | "1W" | "1M" | "3M" | "1Y"

export type CandleData = {
  time: string // 'YYYY-MM-DD' or timestamp string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export type HoveredCandle = {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
  change: number
  changePercent: number
  isBullish: boolean
}

export type CandlestickChartProps = {
  data: CandleData[]
  period?: ChartPeriod
  onPeriodChange?: (period: ChartPeriod) => void
  assetSymbol?: string
  assetName?: string
  currentPrice?: number
  priceChange?: number
  height?: number
  showVolume?: boolean
  showControls?: boolean
  theme?: "light" | "dark"
  enableZoom?: boolean
  enablePan?: boolean
  isLoading?: boolean
  className?: string
}
