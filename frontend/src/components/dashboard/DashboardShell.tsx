"use client"

import { useState } from "react"

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fridayOpen, setFridayOpen] = useState(false)

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
