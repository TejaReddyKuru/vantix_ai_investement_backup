"use client"

import React from 'react'
import Link from 'next/link'

export default function Sidebar() {
  const items = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/markets', label: 'Markets' },
    { href: '/terminal', label: 'Trading Terminal' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/paper', label: 'Paper Trading' },
  ]
  return (
    <aside className="w-72 bg-neutral-900 border-r border-neutral-800 p-4 flex flex-col gap-4 min-h-screen">
      <div className="text-2xl font-semibold">VC</div>
      <nav className="flex flex-col gap-2">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="text-neutral-300 hover:text-white px-3 py-2 rounded-lg hover:bg-neutral-800">
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
