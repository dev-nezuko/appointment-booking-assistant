import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { store } from '@/state/store'
import { logout } from '@/state/slices/authSlice'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // An expired or revoked token: drop it and end the session; ProtectedRoute
    // then sends the user to sign in. A failed login is also a 401, and there
    // is no session to end then.
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      store.dispatch(logout())
    }
    return Promise.reject(error)
  }
)
