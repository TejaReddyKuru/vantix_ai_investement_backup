"use client"

import React from 'react'
import TopNav from '../../components/TopNav'
import Sidebar from '../../components/Sidebar'
import AIPanel from '../../components/AIPanel'
import StatCard from './components/StatCard'
import ChartContainer from '../../components/ChartContainer'
import MarketList from './components/MarketList'
import ResponsiveSalaryChart from './components/ResponsiveSalaryChart'

export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Good morning,</h2>
              <div className="text-sm text-neutral-400">Here's your market snapshot</div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 bg-neutral-800 rounded">Trade</button>
              <button className="px-3 py-2 bg-neutral-800 rounded">Ask AI</button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 grid gap-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2"><StatCard title="Total Portfolio Value" value="$12,345.67" delta="+1.2%" /></div>
                <div className="col-span-1"><StatCard title="Today's P/L" value="$123.45" delta="+0.8%" /></div>
                <div className="col-span-1"><StatCard title="Win Rate" value="62%" /></div>
              </div>

              <ChartContainer>
                <ResponsiveSalaryChart />
              </ChartContainer>

              <div className="grid grid-cols-2 gap-6">
                <div className="card p-4">AI Insights (placeholder)</div>
                <div className="card p-4">Risk Overview (placeholder)</div>
              </div>
            </div>

            <div className="col-span-4 grid gap-6">
              <MarketList />
              <div className="card p-4">Watchlist (placeholder)</div>
            </div>
          </div>
        </main>
      </div>
      <AIPanel />
    </div>
  )
}
