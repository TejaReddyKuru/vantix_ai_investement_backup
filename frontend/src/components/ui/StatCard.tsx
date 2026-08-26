"use client"

import { ArrowUpRight } from "lucide-react"
import Card from "./Card"

export default function StatCard({
  title,
  value,
  delta,
}: {
  title: string
  value: string | number
  delta?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold text-[var(--muted)]">
          {title}
        </div>

        {delta && (
          <div className="badge-positive">
            <ArrowUpRight size={12} />
            {delta}
          </div>
        )}
      </div>

      <div className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {value}
      </div>

      <div className="mt-2 text-[10px] font-medium text-[var(--muted)]">
        Updated just now
      </div>
    </Card>
  )
}
