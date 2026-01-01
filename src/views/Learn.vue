<template>
  <div class="learn">
    <h2>Learn</h2>

    <van-loading v-if="store.loading" size="50px" />

    <div v-else>
      <div v-if="userStore.user" class="bookmarks-block">
        <div class="bookmarks-header" @click="toggleBookmarks">
          <div>
            <h3>Bookmarked Cards</h3>
            <div class="bookmark-count">{{ bookmarkedCards.length }} saved</div>
          </div>
          <van-icon :name="showBookmarks ? 'arrow-down' : 'arrow-up'" />
        </div>
        <div v-show="showBookmarks" class="bookmarks-body">
          <div v-if="bookmarkedCards.length" class="cards-container">
            <div v-for="c in bookmarkedCards" :key="c.id" class="card-wrapper">
              <Flashcard :card="c" />
            </div>
          </div>
          <div v-else class="no-bookmarks">Chưa có bookmark nào</div>
          <div class="view-all">
            <router-link to="/bookmarks">
              <van-button size="small" type="primary" plain round>Open Bookmarks Page</van-button>
            </router-link>
          </div>
        </div>
        <van-divider />
      </div>

      <!-- Topic & Level filters as dropdowns with apply/reset -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-menu">
            <van-dropdown-menu>
              <van-dropdown-item v-model="selectedTopic" :options="topicOptions" />
              <van-dropdown-item v-model="selectedLevel" :options="levelOptions" />
            </van-dropdown-menu>
          </div>
          <div class="filter-actions">
            <van-button size="small" type="primary" round @click="applyFilters">Apply</van-button>
            <van-button size="small" type="default" round @click="clearFilters">Clear</van-button>
          </div>
        </div>
        <div class="filter-active">
          <span class="label">Active filters:</span>
          <span class="pill">Topic: {{ activeTopicLabel }}</span>
          <span class="pill">Level: {{ activeLevelLabel }}</span>
        </div>
      </div>

      <div class="card-stage" @touchstart="onTouchStart" @touchend="onTouchEnd">
        <div class="stage-header">
          <div class="stage-meta">Card {{ displayIndex }} / {{ store.meta.total || totalCards }}</div>
          <div class="stage-controls">
            <van-button size="small" type="default" round :disabled="currentIndex === 0 && store.meta.page === 1" @click="prevCard">Prev</van-button>
            <van-button size="small" type="primary" round :disabled="currentIndex >= totalCards - 1 && store.meta.page >= store.meta.totalPages" @click="nextCard">Next</van-button>
          </div>
        </div>
        <transition :name="transitionName" mode="out-in">
          <div v-if="currentCard" :key="currentCard.id || currentIndex" class="card-wrapper single">
            <Flashcard :card="currentCard" />
          </div>
          <div v-else key="empty" class="no-more">Không có flashcard nào</div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed, watch, onBeforeUnmount } from 'vue'
import { useFlashcardStore } from '../stores/flashcards'
import { useSettingsStore } from '../stores/settings'
import { useUserStore } from '../stores/user'
import Flashcard from '../components/Flashcard.vue'

export default defineComponent({
  components: { Flashcard },
  setup() {
    const store = useFlashcardStore()
    const settingsStore = useSettingsStore()
    const userStore = useUserStore()
    const selectedTopic = ref<string>('')
    const selectedLevel = ref<string>('')
    const currentIndex = ref(0)

    const PAGE_SIZE = 20
    const page = ref(1)

    const fetchWithFilters = async (pageNumber = 1) => {
      page.value = pageNumber
      await store.fetchAll({
        topic: selectedTopic.value || undefined,
        level: selectedLevel.value || undefined,
        page: page.value,
        pageSize: PAGE_SIZE
      })
    }

    const topicOptions = computed(() => [{ text: 'All Topics', value: '' }, ...store.topics.map((t) => ({ text: t.label || t.id, value: t.id }))])
    const levelOptions = computed(() => [{ text: 'All Levels', value: '' }, ...store.levels.map((l) => ({ text: l.label || l.id, value: l.id }))])

    const activeTopicLabel = computed(() => {
      if (!selectedTopic.value) return 'All'
      const found = store.topics.find((t) => t.id === selectedTopic.value)
      return found?.label || found?.id || 'All'
    })

    const activeLevelLabel = computed(() => {
      if (!selectedLevel.value) return 'All'
      const found = store.levels.find((l) => l.id === selectedLevel.value)
      return found?.label || found?.id || 'All'
    })

    onMounted(async () => {
      settingsStore.loadSettings()
      // Fetch topics and levels first (cached in store)
      await store.fetchTopicsAndLevels()
      fetchWithFilters()
      userStore.loadSession()
      // Only fetch profile if user is logged in and not already loaded
      if (userStore.token && !userStore.user) {
        await userStore.fetchProfile()
      }
      // refreshMeta is not needed - fetchProfile already returns all data
    })

    // Debounce globalLevel watch to prevent cascade re-fetches
    let levelWatchTimeout: number | null = null
    watch(() => settingsStore.globalLevel, (newLevel) => {
      if (levelWatchTimeout) clearTimeout(levelWatchTimeout)
      levelWatchTimeout = window.setTimeout(() => {
        selectedLevel.value = newLevel
        currentIndex.value = 0
        fetchWithFilters(1)
        levelWatchTimeout = null
      }, 300)
    })

    const applyFilters = async () => {
      currentIndex.value = 0
      await fetchWithFilters(1)
    }

    const clearFilters = async () => {
      selectedTopic.value = ''
      selectedLevel.value = ''
      currentIndex.value = 0
      await fetchWithFilters(1)
    }

    const allItems = computed(() => store.items)

    const totalCards = computed(() => allItems.value.length)
    const currentCard = computed(() => allItems.value[currentIndex.value])
    const displayIndex = computed(() => {
      if (!totalCards.value) return 0
      return (store.meta.page - 1) * store.meta.pageSize + currentIndex.value + 1
    })
    const direction = ref<'next' | 'prev'>('next')
    const transitionName = computed(() => (direction.value === 'next' ? 'slide-left' : 'slide-right'))

    const bookmarkedCards = computed(() => {
      if (!userStore.bookmarks.length) return []
      return store.items.filter((c) => userStore.bookmarks.includes(c.id))
    })

    const showBookmarks = ref(false)
    const toggleBookmarks = () => {
      showBookmarks.value = !showBookmarks.value
    }

    const nextCard = async () => {
      if (currentIndex.value < totalCards.value - 1) {
        direction.value = 'next'
        currentIndex.value += 1
        return
      }

      if (store.meta.page < store.meta.totalPages) {
        direction.value = 'next'
        await fetchWithFilters(store.meta.page + 1)
        currentIndex.value = 0
      }
    }

    const prevCard = async () => {
      if (currentIndex.value > 0) {
        direction.value = 'prev'
        currentIndex.value -= 1
        return
      }

      if (store.meta.page > 1) {
        direction.value = 'prev'
        await fetchWithFilters(store.meta.page - 1)
        currentIndex.value = Math.max(store.items.length - 1, 0)
      }
    }

    const touchStartX = ref(0)
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.value = e.changedTouches[0].clientX
    }
    const onTouchEnd = (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientX - touchStartX.value
      if (Math.abs(delta) < 50) return
      if (delta < 0) nextCard()
      else prevCard()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextCard()
      } else if (e.key === 'ArrowLeft') {
        prevCard()
      }
    }

    onMounted(() => {
      window.addEventListener('keydown', onKey)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', onKey)
    })

    return {
      store,
      settingsStore,
      userStore,
      selectedTopic,
      selectedLevel,
      topicOptions,
      levelOptions,
      activeTopicLabel,
      activeLevelLabel,
      applyFilters,
      clearFilters,
      currentCard,
      totalCards,
      currentIndex,
      nextCard,
      prevCard,
      bookmarkedCards,
      showBookmarks,
      toggleBookmarks,
      onTouchStart,
      onTouchEnd,
      transitionName,
      displayIndex
    }
  }
})
</script>

<style scoped>
.learn h2 {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.filter-section {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.filter-menu {
  flex: 1 1 320px;
  min-width: 260px;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.filter-actions .van-button {
  min-width: 72px;
  padding-inline: 14px;
}

.filter-active {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  color: #374151;
}

.filter-active .label {
  font-weight: 600;
  color: #111827;
}

.filter-active .pill {
  background: #f3f4f6;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.9rem;
}

.bookmarks-block {
  margin-bottom: 1.5rem;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
}

.bookmarks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  cursor: pointer;
}

.bookmarks-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.bookmark-count {
  color: #6b7280;
  font-weight: 600;
}

.bookmarks-body {
  margin-top: 0.25rem;
}

.no-bookmarks {
  color: #6b7280;
  padding: 0.5rem 0;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
  text-align: center;
}

.filter-buttons {
  display: flex;
  justify-content: center;
}

.card-stage {
  margin-top: 1rem;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.stage-meta {
  font-weight: 700;
  color: #1f2937;
}

.stage-controls {
  display: flex;
  gap: 0.5rem;
}

.card-wrapper.single {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.no-more {
  text-align: center;
  color: #9ca3af;
  padding: 2rem 0;
}

/* Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
