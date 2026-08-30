import axios from "axios"
import { QueryClient } from "@tanstack/react-query"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
    } catch (e) {}
  }
  return config
})

export const queryClient = new QueryClient()