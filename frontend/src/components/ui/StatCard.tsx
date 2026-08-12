"use client"

import React from 'react'
import Card from './Card'

export default function StatCard({ title, value, delta }: { title: string; value: string | number; delta?: string }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {delta && <div className="text-sm text-green-400 mt-1">{delta}</div>}
    </Card>
  )
}
