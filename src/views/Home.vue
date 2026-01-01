<template>
  <div class="home">
    <div class="hero-box">
      <h2>Welcome to Flashcard Kids</h2>
      <p>Play and learn Chinese words with pictures, audio and games.</p>
      <div class="button-group">
        <router-link to="/learn">
          <van-button type="success" round size="large" block>Start Learning</van-button>
        </router-link>
        <router-link to="/game">
          <van-button type="warning" round size="large" block>Play Games</van-button>
        </router-link>
        <router-link :to="{ path: '/game', query: { tab: 'quiz' } }">
          <van-button type="primary" round size="large" block>Start Quiz</van-button>
        </router-link>
        <router-link to="/bookmarks">
          <van-button type="primary" round size="large" block>My Bookmarks</van-button>
        </router-link>
      </div>
    </div>

    <div v-if="userStore.user" class="bookmarks-section">
      <div class="section-header" @click="toggleBookmarks">
        <div>
          <div class="section-title">Bookmarked Cards</div>
          <div class="section-sub">{{ bookmarkedCards.length }} saved</div>
        </div>
        <van-icon :name="showBookmarks ? 'arrow-down' : 'arrow-up'" />
      </div>
      <div v-show="showBookmarks" class="bookmarks-body">
        <div v-if="bookmarkedCards.length" class="cards-container">
          <div v-for="c in bookmarkedCards" :key="c.id" class="card-wrapper">
            <Flashcard :card="c" />
          </div>
        </div>
        <div v-else class="empty">Chưa có bookmark nào</div>
        <div class="view-all">
          <router-link to="/bookmarks">
            <van-button size="small" type="primary" plain round>Open Bookmarks Page</van-button>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useFlashcardStore } from '../stores/flashcards'
import Flashcard from '../components/Flashcard.vue'

export default defineComponent({
  components: { Flashcard },
  setup() {
    const userStore = useUserStore()
    const flashcardStore = useFlashcardStore()
    const showBookmarks = ref(false)

    onMounted(async () => {
      userStore.loadSession()
      // Fetch topics and levels first (cached in store)
      await flashcardStore.fetchTopicsAndLevels()
      // Only fetch profile if user is logged in (has token)
      if (userStore.token) {
        await userStore.fetchProfile()
        // refreshMeta is not needed - fetchProfile already returns all user data
      }
      // Only fetch flashcards if not already loaded
      if (!flashcardStore.items.length) {
        flashcardStore.fetchAll()
      }
    })

    const bookmarkedCards = computed(() => {
      if (!userStore.bookmarks.length) return []
      return flashcardStore.items.filter((c) => userStore.bookmarks.includes(c.id))
    })

    const toggleBookmarks = () => {
      showBookmarks.value = !showBookmarks.value
    }

    return { userStore, flashcardStore, bookmarkedCards, showBookmarks, toggleBookmarks }
  }
})
</script>

<style scoped>
.home {
  text-align: center;
}

.hero-box {
  background: white;
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.hero-box h2 {
  font-size: 2rem;
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.hero-box p {
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
  color: #6b7280;
}

.button-group {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.bookmarks-section {
  margin-top: 1.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.section-title {
  font-weight: 800;
  color: #111827;
}

.section-sub {
  color: #6b7280;
  font-size: 0.9rem;
}

.bookmarks-body {
  margin-top: 0.75rem;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.card-wrapper {
  width: 100%;
}

.empty {
  color: #6b7280;
  text-align: center;
  padding: 0.5rem 0;
}

.view-all {
  margin-top: 0.5rem;
  text-align: center;
}
</style>
