"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../context/AuthContext"

import Sidebar from "./Sidebar"
import TopBar from "./TopBar"
import FridayPanel from "./FridayPanel"
import MarketMarquee from "../market/MarketMarquee"

type DashboardShellProps = {
  children: React.ReactNode
}

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  const { token } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fridayOpen, setFridayOpen] = useState(false)

  useEffect(() => {
    if (!token && typeof window !== "undefined") {
      router.replace("/login")
    }
  }, [token, router])

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F3EA]">
        <div className="text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0F2D1F] border-t-transparent mx-auto"></div>
          <p className="mt-3 text-[10px] font-extrabold uppercase tracking-wider text-[#8A897F]">Verifying session</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[#F4F3EA] text-[#171717]">

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main application */}
      <div className="min-h-screen lg:pl-[258px]">

        {/* Top navigation */}
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          fridayOpen={fridayOpen}
          onFridayToggle={() => setFridayOpen((value) => !value)}
        />

        {/* Compact live market ticker */}
        <MarketMarquee />

        {/* Main page */}
        <main className="relative">
          <div className="mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-5 xl:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Friday AI drawer */}
      <FridayPanel
        open={fridayOpen}
        onClose={() => setFridayOpen(false)}
      />
    </div>
  )
}
