"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import axios from "axios"
import { apiClient } from "../lib/client"

type User = {
  id: string
  email: string
  display_name?: string
}

type StoredAuth = {
  user: User
  token: string
}

type AuthContextValue = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = localStorage.getItem("vc_auth")

    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("user" in parsed) ||
      !("token" in parsed)
    ) {
      localStorage.removeItem("vc_auth")
      return null
    }

    const auth = parsed as StoredAuth

    if (
      !auth.user ||
      typeof auth.token !== "string" ||
      !auth.token
    ) {
      localStorage.removeItem("vc_auth")
      return null
    }

    return auth
  } catch {
    localStorage.removeItem("vc_auth")
    return null
  }
}

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [initialAuth] = useState<StoredAuth | null>(() =>
    getStoredAuth()
  )

  const [user, setUser] = useState<User | null>(
    () => initialAuth?.user ?? null
  )

  const [token, setToken] = useState<string | null>(
    () => initialAuth?.token ?? null
  )

  /*
   * Restore the saved authentication token when
   * the application starts.
   */
  useEffect(() => {
    if (initialAuth?.token) {
      apiClient.defaults.headers.common["Authorization"] =
        `Bearer ${initialAuth.token}`
    }
  }, [initialAuth])

  /*
   * Login
   */
  const login = async (
    email: string,
    password: string
  ) => {
    const response = await apiClient.post(
      "/api/v1/auth/login",
      {
        email,
        password,
      }
    )

    const data = response.data

    const accessToken =
      data.tokens?.access_token

    if (!accessToken) {
      throw new Error(
        "Login succeeded but no access token was returned."
      )
    }

    const authenticatedUser = data.user as User

    setUser(authenticatedUser)
    setToken(accessToken)

    /*
     * Set Authorization header for all future
     * requests made through apiClient.
     */
    apiClient.defaults.headers.common["Authorization"] =
      `Bearer ${accessToken}`

    /*
     * Persist authentication locally so the user
     * remains logged in after refreshing the page.
     */
    localStorage.setItem(
      "vc_auth",
      JSON.stringify({
        user: authenticatedUser,
        token: accessToken,
      })
    )
  }

  /*
   * Logout
   */
  const logout = async () => {
    try {
      await apiClient.post("/api/v1/auth/logout")
    } catch {
      /*
       * Even if the backend logout request fails,
       * clear the local authentication state.
       */
    }

    setUser(null)
    setToken(null)

    delete apiClient.defaults.headers.common["Authorization"]

    localStorage.removeItem("vc_auth")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    )
  }

  return ctx
}