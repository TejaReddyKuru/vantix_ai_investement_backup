"use client"

import React from 'react'

export default function ChartContainer({ children }: { children: React.ReactNode }) {
  return <div className="card p-4 h-80">{children}</div>
}
