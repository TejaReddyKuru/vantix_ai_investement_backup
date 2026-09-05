import axios from 'axios'

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

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// response interceptor to unwrap standardized error format
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.data && err.response.data.error) {
      const e = err.response.data
      return Promise.reject(new Error(e.error.message || e.error.code || 'API error'))
    }
    return Promise.reject(err)
  }
)

export default api
