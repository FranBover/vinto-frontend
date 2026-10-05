import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const TOKEN_KEY = 'vinto_admin_token'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5202/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(config => {
  // Read directly from localStorage so the interceptor works outside React
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  res => res,
  error => {
    // Un 401 del login son credenciales incorrectas, no una sesión vencida.
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      useAuthStore.getState().expirarSesion()
    }
    return Promise.reject(error)
  }
)
