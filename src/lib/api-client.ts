import axios from "axios"

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || ""}/api` || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token")
      if (token && token !== "undefined" && token !== "null") {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    config.withCredentials = true
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("auth_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)
