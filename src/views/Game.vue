<template>
  <div class="game-page">
    <h2>Games</h2>
    <div class="user-stats" v-if="userStore.user">
      <div class="stat">
        <div class="label">Streak</div>
        <div class="value">🔥 {{ userStore.streak?.current || 0 }}<span class="sub"> best {{ userStore.streak?.best || 0 }}</span></div>
      </div>
      <div class="stat" v-if="userStore.badges.length">
        <div class="label">Badges</div>
        <div class="badges">
          <span v-for="b in userStore.badges" :key="b.id" class="badge-chip">{{ b.icon }} {{ b.name }}</span>
        </div>
      </div>
    </div>
    <van-tabs v-model:active="activeTab" type="card">
      <van-tab title="Memory Match" name="memory">
        <div class="game-card">
          <MemoryGame v-if="store.items.length" :items="store.items" />
          <div v-else class="loading-text">Loading cards...</div>
        </div>
      </van-tab>
      <van-tab title="Quiz Mode" name="quiz">
        <div class="game-card">
          <QuizGame v-if="store.items.length" :items="store.items" />
          <div v-else class="loading-text">Loading quiz...</div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useRoute } from 'vue-router'
import MemoryGame from '../components/MemoryGame.vue'
import QuizGame from '../components/QuizGame.vue'
import { useFlashcardStore } from '../stores/flashcards'
import { useUserStore } from '../stores/user'

export default defineComponent({
  components: { MemoryGame, QuizGame },
  setup() {
    const route = useRoute()
    const activeTab = ref(route.query.tab === 'quiz' ? 'quiz' : 'memory')
    const store = useFlashcardStore()
    const userStore = useUserStore()
    // Fetch topics and levels first (cached in store)
    store.fetchTopicsAndLevels()
    store.fetchAll()
    userStore.loadSession()
    // Only fetch profile if user is logged in and not already loaded
    if (userStore.token && !userStore.user) {
      userStore.fetchProfile()
    }
    // refreshMeta is not needed - fetchProfile already returns all data
    return { store, activeTab, userStore }
  }
})
</script>

<style scoped>
.game-page h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #1f2937;
}

.user-stats {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
  background: #f9fafb;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
}

.stat .label {
  font-size: 0.85rem;
  color: #6b7280;
}

.stat .value {
  font-weight: 700;
  color: #111827;
}

.stat .sub {
  margin-left: 0.25rem;
  color: #6b7280;
  font-weight: 500;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.badge-chip {
  background: #eef2ff;
  color: #312e81;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}

.game-card {
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.loading-text {
  text-align: center;
  padding: 1rem 0;
  color: #6b7280;
}
</style>
