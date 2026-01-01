<template>
  <div class="bookmarks-page">
    <h2>Bookmarked Cards</h2>
    <div v-if="!userStore.user" class="auth-alert">
      <p>Bạn cần đăng nhập để xem bookmark.</p>
      <router-link to="/">
        <van-button type="primary" round>Quay lại trang chủ để đăng nhập</van-button>
      </router-link>
    </div>
    <div v-else>
      <div class="summary">
        <div class="summary-label">Tổng bookmark</div>
        <div class="summary-value">{{ bookmarkedCards.length }}</div>
      </div>
      <div v-if="bookmarkedCards.length" class="cards-container">
        <div v-for="c in bookmarkedCards" :key="c.id" class="card-wrapper">
          <Flashcard :card="c" />
        </div>
      </div>
      <div v-else class="empty">Chưa có flashcard nào được bookmark.</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted } from 'vue'
import { useFlashcardStore } from '../stores/flashcards'
import { useUserStore } from '../stores/user'
import Flashcard from '../components/Flashcard.vue'

export default defineComponent({
  components: { Flashcard },
  setup() {
    const flashcardStore = useFlashcardStore()
    const userStore = useUserStore()

    onMounted(async () => {
      userStore.loadSession()
      // Fetch topics and levels first (cached in store)
      await flashcardStore.fetchTopicsAndLevels()
      // Only fetch profile if user is logged in and not already loaded
      if (userStore.token && !userStore.user) {
        await userStore.fetchProfile()
      }
      // refreshMeta is not needed - fetchProfile already returns all data
      if (!flashcardStore.items.length) {
        flashcardStore.fetchAll()
      }
    })

    const bookmarkedCards = computed(() => {
      if (!userStore.bookmarks.length) return []
      return flashcardStore.items.filter((c) => userStore.bookmarks.includes(c.id))
    })

    return { userStore, flashcardStore, bookmarkedCards }
  }
})
</script>

<style scoped>
.bookmarks-page h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #1f2937;
}

.auth-alert {
  text-align: center;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  color: #92400e;
  padding: 1rem;
  border-radius: 0.75rem;
}

.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.summary-label {
  color: #6b7280;
  font-weight: 600;
}

.summary-value {
  font-weight: 800;
  color: #111827;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.card-wrapper {
  width: 100%;
}

.empty {
  text-align: center;
  color: #6b7280;
  padding: 1rem 0;
}
</style>
