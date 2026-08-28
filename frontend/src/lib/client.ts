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

// Response interceptor to handle expired sessions / 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const config = error.config
      if (config && config.url && !config.url.includes("/auth/login")) {
        if (typeof window !== "undefined") {
          if (localStorage.getItem("vc_auth")) {
            localStorage.removeItem("vc_auth")
            if (window.location.pathname !== "/login") {
              window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
            }
          }
        }
      }
    }
    return Promise.reject(error)
  }
)

export const queryClient = new QueryClient()