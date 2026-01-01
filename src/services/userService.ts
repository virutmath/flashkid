import apiClient from './apiClient'
import type { Badge, Streak, UserProfile } from '../types/user'

interface UserPayload {
  id: string
  name: string
  email: string
  avatar?: string
  streak?: Streak
  bookmarks?: string[]
  badges?: Badge[]
}

export const fetchUser = async (): Promise<UserPayload> => {
  const res = await apiClient.get<UserPayload>('/user')
  return res.data
}

export const fetchBookmarks = async (): Promise<string[]> => {
  const res = await apiClient.get<{ data: { bookmarks: string[] } }>('/bookmarks')
  return res.data.data.bookmarks
}

export const fetchStreak = async (): Promise<Streak> => {
  const res = await apiClient.get<Streak>('/streak')
  return res.data
}

export const fetchBadges = async (): Promise<Badge[]> => {
  const res = await apiClient.get<{ data: Badge[] }>('/badges')
  return res.data.data
}

export const updateBookmarks = async (bookmarks: string[]): Promise<string[]> => {
  const res = await apiClient.put<{ data: { bookmarks: string[] } }>(
    '/bookmarks',
    { bookmarks }
  )
  return res.data.data.bookmarks
}
