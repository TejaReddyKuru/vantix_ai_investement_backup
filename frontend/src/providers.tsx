"use client"

import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "./context/AuthContext"
import { TradingModeProvider } from "./context/TradingModeContext"
import { ThemeProvider } from "./context/ThemeContext"
import { RiskPreferencesProvider } from "./context/RiskPreferencesContext"

const queryClient = new QueryClient()

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider><TradingModeProvider><RiskPreferencesProvider>{children}</RiskPreferencesProvider></TradingModeProvider></ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
