"use client"

import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function TopNav() {
  const { user, logout } = useAuth()
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-neutral-800 border-b border-neutral-700">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-semibold">Vish Capitals</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-neutral-300">{user?.email}</div>
        <button onClick={() => logout()} className="text-sm text-blue-400">Logout</button>
      </div>
    </div>
  )
}
