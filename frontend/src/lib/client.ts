import axios from "axios"
import { QueryClient } from "@tanstack/react-query"

function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "")
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[CoinCrest] Warning: NEXT_PUBLIC_API_BASE_URL is not configured in Vercel environment variables. Falling back to production backend domain."
    )
    return "https://coincrest-backend.onrender.com"
  }

  return "http://127.0.0.1:8000"
}

const API_BASE_URL = resolveApiBaseUrl()

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const auth = localStorage.getItem("vc_auth")
      if (auth) {
        const { token } = JSON.parse(auth)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch {}
  }
  return config
})

export const queryClient = new QueryClient()