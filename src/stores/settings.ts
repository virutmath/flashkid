import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    globalLevel: null as string | null,
    audioEnabled: true
  }),
  getters: {
    hasGlobalLevel: (state) => state.globalLevel !== null
  },
  actions: {
    setGlobalLevel(level: string | null) {
      this.globalLevel = level
      if (level) {
        localStorage.setItem('globalLevel', level)
      } else {
        localStorage.removeItem('globalLevel')
      }
    },
    loadSettings() {
      const saved = localStorage.getItem('globalLevel')
      if (saved) {
        this.globalLevel = saved
      }
    }
  }
})
