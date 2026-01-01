import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserProfile, Streak, Badge } from '../types/user'
import { login as apiLogin, logout as apiLogout } from '../services/authService'
import { fetchUser, fetchBookmarks, fetchStreak, fetchBadges, updateBookmarks } from '../services/userService'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token') || null)
  const user = ref<UserProfile | null>(null)
  const bookmarks = ref<string[]>([])
  const streak = ref<Streak | null>(null)
  const badges = ref<Badge[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const saveSession = () => {
    if (token.value) localStorage.setItem('token', token.value)
    else localStorage.removeItem('token')
    if (user.value) localStorage.setItem('user', JSON.stringify(user.value))
    else localStorage.removeItem('user')
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks.value))
  }

  const loadSession = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) user.value = JSON.parse(savedUser)
    const savedBookmarks = localStorage.getItem('bookmarks')
    if (savedBookmarks) bookmarks.value = JSON.parse(savedBookmarks)
  }

  const login = async (username: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      const res = await apiLogin(username, password)
      token.value = res.token
      user.value = res.user
      await fetchProfile()
      saveSession()
    } catch (e: any) {
      error.value = e?.message || 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    await apiLogout()
    token.value = null
    user.value = null
    bookmarks.value = []
    streak.value = null
    badges.value = []
    saveSession()
  }

  const fetchProfile = async () => {
    try {
      const u = await fetchUser()
      user.value = { id: u.id, name: u.name, email: u.email, avatar: u.avatar }
      if (u.streak) streak.value = u.streak
      if (u.bookmarks) bookmarks.value = u.bookmarks
      if (u.badges) badges.value = u.badges
    } catch (err) {
      // silent fallback
    }
  }

  const refreshMeta = async () => {
    try {
      const [bm, st, bd] = await Promise.all([
        fetchBookmarks(),
        fetchStreak(),
        fetchBadges()
      ])
      bookmarks.value = bm
      streak.value = st
      badges.value = bd
      saveSession()
    } catch (err) {
      // ignore
    }
  }

  const toggleBookmark = async (cardId: string) => {
    if (!bookmarks.value.includes(cardId)) {
      bookmarks.value.push(cardId)
    } else {
      bookmarks.value = bookmarks.value.filter((id) => id !== cardId)
    }
    await updateBookmarks(bookmarks.value)
    saveSession()
  }

  return { token, user, bookmarks, streak, badges, loading, error, login, logout, fetchProfile, refreshMeta, toggleBookmark, loadSession }
})
