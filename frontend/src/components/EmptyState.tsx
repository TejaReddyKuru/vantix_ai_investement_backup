"use client"

import React from 'react'

export default function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400">
      <div className="text-lg font-semibold mb-2">{title}</div>
      {description && <div className="text-sm">{description}</div>}
    </div>
  )
}
