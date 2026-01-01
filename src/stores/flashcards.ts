import { defineStore } from 'pinia'
import type { Flashcard } from '../types/flashcard'
import { fetchFlashcards, fetchTopics, fetchLevels, type TopicOption, type LevelOption } from '../services/flashcardService'

export const useFlashcardStore = defineStore('flashcards', {
  state: () => ({
    items: [] as Flashcard[],
    meta: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1
    },
    topics: [] as TopicOption[],
    levels: [] as LevelOption[],
    loading: false,
    error: '' as string | null
  }),
  actions: {
    async fetchAll(params?: { topic?: string; level?: string; page?: number; pageSize?: number }) {
      this.loading = true
      this.error = null
      try {
        const { items, meta } = await fetchFlashcards(params)
        this.items = items
        this.meta = meta
      } catch (err: any) {
        this.error = err.message || 'Failed to load flashcards'
      } finally {
        this.loading = false
      }
    },
    async fetchTopicsAndLevels() {
      const needTopics = this.topics.length === 0
      const needLevels = this.levels.length === 0
      if (!needTopics && !needLevels) return

      try {
        const [topics, levels] = await Promise.all([
          needTopics ? fetchTopics() : Promise.resolve(this.topics),
          needLevels ? fetchLevels() : Promise.resolve(this.levels)
        ])
        if (needTopics) this.topics = topics
        if (needLevels) this.levels = levels
      } catch (err: any) {
        console.error('Failed to load topics/levels:', err)
      }
    },
    getByTopic(topic: string) {
      return this.items.filter((i) => i.topic === topic)
    },
    getById(id: string) {
      return this.items.find((i) => i.id === id)
    }
  }
})
