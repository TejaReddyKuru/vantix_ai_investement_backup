"use client"

import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "./context/AuthContext"
import { TradingModeProvider } from "./context/TradingModeContext"

const queryClient = new QueryClient()

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TradingModeProvider>{children}</TradingModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}