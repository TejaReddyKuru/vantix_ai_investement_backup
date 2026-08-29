"use client"

import React from 'react'
import { MOCK_MARKETS } from '../../../lib/mock/market'

export default function MarketList() {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Market Overview</h3>
        <div className="text-sm text-neutral-400">24h</div>
      </div>
      <div className="grid gap-2">
        {MOCK_MARKETS.map((m) => (
          <div key={m.symbol} className="flex items-center justify-between py-2 px-2 rounded hover:bg-neutral-800">
            <div>
              <div className="text-sm font-medium">{m.symbol}</div>
              <div className="text-xs text-neutral-400">{m.name}</div>
            </div>
            <div className="text-right">
              <div className="font-medium">${m.price.toLocaleString()}</div>
              <div className={`text-sm ${m.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>{m.change24h}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
