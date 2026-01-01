import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = ['/flashcards', '/topics', '/levels', '/auth/login', '/auth/logout']

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => 
      config.url?.startsWith(endpoint)
    )
    
    // Only add token if it exists and endpoint is not public
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token expiration and rate limiting
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => 
      error.config?.url?.startsWith(endpoint)
    )
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !isPublicEndpoint) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Redirect to home page since there's no login route
      window.location.href = '/'
    }
    
    // Handle 429 - Too Many Requests (Rate Limiting)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000 // Default 2 seconds
      
      // Only retry once
      if (!error.config?.headers?.['X-Retry-Count']) {
        console.warn(`Rate limited. Retrying after ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Mark as retried
        if (error.config) {
          error.config.headers = error.config.headers || {}
          error.config.headers['X-Retry-Count'] = '1'
          return apiClient.request(error.config)
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
