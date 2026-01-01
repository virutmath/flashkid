import apiClient from './apiClient'
import type { UserProfile } from '../types/user'

interface LoginResponse {
  token: string
  user: UserProfile
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await apiClient.post<LoginResponse>('/auth/login', { email, password })
  return res.data
}

export const logout = async (): Promise<boolean> => {
  try {
    await apiClient.post('/auth/logout', {})
    return true
  } catch (err) {
    return true
  }
}
