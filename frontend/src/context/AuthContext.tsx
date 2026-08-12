"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

type User = { id: string; email: string; display_name?: string }

type AuthContextValue = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // hydrate from localStorage
    try {
      const raw = localStorage.getItem('vc_auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        setUser(parsed.user)
        setToken(parsed.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await axios.post('/api/v1/auth/login', { email, password })
    const data = res.data
    setUser(data.user)
    setToken(data.tokens.access_token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.tokens.access_token}`
    localStorage.setItem('vc_auth', JSON.stringify({ user: data.user, token: data.tokens.access_token }))
  }

  const logout = async () => {
    try {
      await axios.post('/api/v1/auth/logout')
    } catch (e) {
      // ignore
    }
    setUser(null)
    setToken(null)
    delete axios.defaults.headers.common['Authorization']
    localStorage.removeItem('vc_auth')
  }

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
