"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
      <form onSubmit={onSubmit} className="w-full max-w-md p-8 bg-neutral-800 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Login</h3>
        {error && <div className="mb-4 text-red-400">{error}</div>}
        <label className="block mb-2 text-sm text-neutral-300">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 mb-4 rounded bg-neutral-900" />
        <label className="block mb-2 text-sm text-neutral-300">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 mb-4 rounded bg-neutral-900" />
        <button type="submit" className="w-full bg-blue-600 p-2 rounded">Sign in</button>
      </form>
    </div>
  )
}
