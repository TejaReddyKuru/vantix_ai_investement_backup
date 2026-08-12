import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
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
