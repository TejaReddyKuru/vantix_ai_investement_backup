"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type TradingMode = "paper" | "live"

type TradingModeContextValue = {
  mode: TradingMode
  setMode: (mode: TradingMode) => void
  isPaper: boolean
  isLive: boolean
}

const TradingModeContext = createContext<
  TradingModeContextValue | undefined
>(undefined)

export function TradingModeProvider({
  children,
}: {
  children: ReactNode
}) {
  const [mode, setMode] = useState<TradingMode>("paper")

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isPaper: mode === "paper",
      isLive: mode === "live",
    }),
    [mode],
  )

  return (
    <TradingModeContext.Provider value={value}>
      {children}
    </TradingModeContext.Provider>
  )
}

export function useTradingMode() {
  const context = useContext(TradingModeContext)

  if (!context) {
    throw new Error(
      "useTradingMode must be used inside TradingModeProvider",
    )
  }

  return context
}