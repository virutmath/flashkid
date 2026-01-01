<template>
  <div class="memory-game">
    <!-- Game Settings Modal -->
    <van-popup v-model:show="showSettings" position="bottom" :style="{ height: 'auto' }">
      <div class="game-settings">
        <div class="settings-title">Game Settings</div>
        
        <!-- Mode Selection -->
        <div class="settings-group">
          <label class="settings-label">Match Mode:</label>
          <van-space size="8" direction="vertical" style="width: 100%">
            <van-button 
              :type="gameMode === 'image-hanzi' ? 'primary' : 'default'"
              size="small" block @click="gameMode = 'image-hanzi'">
              🖼️ Image ↔ Hanzi
            </van-button>
            <van-button 
              :type="gameMode === 'english-hanzi' ? 'primary' : 'default'"
              size="small" block @click="gameMode = 'english-hanzi'">
              🌐 English ↔ Hanzi
            </van-button>
            <van-button 
              :type="gameMode === 'vietnamese-hanzi' ? 'primary' : 'default'"
              size="small" block @click="gameMode = 'vietnamese-hanzi'">
              🇻🇳 Vietnamese ↔ Hanzi
            </van-button>
          </van-space>
        </div>

        <!-- Topic Selection -->
        <div class="settings-group">
          <label class="settings-label">Topic:</label>
          <van-space size="8" direction="vertical" style="width: 100%">
            <van-button 
              :type="selectedTopic === null ? 'primary' : 'default'"
              size="small" block @click="selectedTopic = null">
              All Topics
            </van-button>
            <van-button 
              v-for="topic in availableTopics"
              :key="topic.id"
              :type="selectedTopic === topic.id ? 'success' : 'default'"
              size="small" block @click="selectedTopic = topic.id">
              {{ topic.label || topic.id }}
            </van-button>
          </van-space>
        </div>

        <!-- Card Count Selection -->
        <div class="settings-group">
          <label class="settings-label">Number of Pairs:</label>
          <van-stepper v-model="cardCount" :min="2" :max="12" :step="2" />
        </div>

        <!-- Pinyin Toggle -->
        <div class="settings-group">
          <label class="settings-label">Show Pinyin with Hanzi:</label>
          <van-switch v-model="showPinyin" />
        </div>

        <!-- Start Button -->
        <van-button type="success" round block size="large" @click="startGame" class="start-btn">
          Start Game
        </van-button>
      </div>
    </van-popup>

    <!-- Game Board -->
    <div v-if="gameStarted" class="game-board">
      <div class="game-header">
        <div class="game-info">
          <span>Turns: <strong>{{ turns }}</strong></span>
          <span>Matches: <strong>{{ matchCount }} / {{ cardCount }}</strong></span>
        </div>
        <van-button size="small" type="danger" round @click="resetGame">Reset</van-button>
      </div>

    <h2>Memory Match</h2>
    <div :class="['game-grid', { 'image-mode': gameMode === 'image-hanzi' }]">
      <button
        v-for="(c, idx) in board"
        v-show="!matched[idx]"
        :key="idx"
        class="memory-card"
        :class="{
          'revealed': revealed[idx] && !matchingTemp.includes(idx),
          'matched': matchingTemp.includes(idx)
        }"
        @click="flipCell(idx)"
        :disabled="matched[idx]"
        :aria-pressed="matched[idx] ? 'true' : 'false'"
        :aria-label="matched[idx] ? 'Matched' : 'Card'"
      >
        <div v-if="revealed[idx]" class="card-content">
          <div v-if="c.type === 'hanzi'" class="hanzi-card">
            <div class="hanzi-text">{{ c.display.split('\n')[0] }}</div>
            <div v-if="c.display.includes('\n')" class="pinyin-text">{{ c.display.split('\n')[1] }}</div>
          </div>
          <div v-else-if="c.type === 'image'" class="image-card">
            <img v-if="c.display" :src="c.display" alt="card" />
            <span v-else>🖼️</span>
          </div>
          <div v-else>{{ c.display }}</div>
        </div>
        <span v-else class="card-back">❓</span>
      </button>
    </div>
    </div>

    <!-- Game Over / Show Settings -->
    <div v-else class="game-start">
      <van-button type="primary" round size="large" block @click="showSettings = true">
        Configure & Start Game
      </van-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch, computed } from 'vue'
import type { Flashcard } from '../types/flashcard'
import { useFlashcardStore } from '../stores/flashcards'

type GameMode = 'image-hanzi' | 'english-hanzi' | 'vietnamese-hanzi'

export default defineComponent({
  name: 'MemoryGame',
  props: {
    items: { type: Array as () => Flashcard[], required: true }
  },
  setup(props) {
    const flashcardStore = useFlashcardStore()
    const turns = ref(0)
    const board = reactive([] as { pairId: string; display: string; type: string }[])
    const revealed = reactive({} as Record<number, boolean>)
    const matched = reactive({} as Record<number, boolean>)
    const matchingTemp = ref<number[]>([])  // Track cards showing match animation
    
    // Settings
    const showSettings = ref(true)
    const gameStarted = ref(false)
    const gameMode = ref<GameMode>('image-hanzi')
    const selectedTopic = ref<string | null>(null)
    const cardCount = ref(6)
    const showPinyin = ref(true)
    const matchCount = computed(() => Object.values(matched).filter(Boolean).length / 2)
    const availableTopics = computed(() => flashcardStore.topics)

    const getFilteredItems = (): Flashcard[] => {
      let items = props.items
      if (selectedTopic.value) {
        items = items.filter(i => i.topic === selectedTopic.value)
      }
      return items
    }

    const init = (mode: GameMode, count: number, showPinyinFlag: boolean) => {
      turns.value = 0
      firstIndex = null
      lock = false
      matchingTemp.value = []
      Object.keys(revealed).forEach((k) => delete revealed[Number(k)])
      Object.keys(matched).forEach((k) => delete matched[Number(k)])

      const items = getFilteredItems()
      const selected = items.slice(0, Math.min(count, items.length))

      const pairs: { pairId: string; display: string; type: string }[] = []
      selected.forEach((it) => {
        const hanziDisplay = showPinyinFlag ? `${it.content.hanzi}\n${it.content.pinyin}` : it.content.hanzi
        pairs.push({ pairId: it.id, display: hanziDisplay, type: 'hanzi' })
        
        // Add second card based on mode
        if (mode === 'image-hanzi') {
          pairs.push({ pairId: it.id, display: it.content.image_url || '🖼️', type: 'image' })
        } else if (mode === 'english-hanzi') {
          pairs.push({ pairId: it.id, display: it.content.meanings.en, type: 'english' })
        } else if (mode === 'vietnamese-hanzi') {
          pairs.push({ pairId: it.id, display: it.content.meanings.vi, type: 'vietnamese' })
        }
      })
      
      // Shuffle
      for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
      }
      board.splice(0, board.length, ...pairs)
    }

    const startGame = () => {
      init(gameMode.value, cardCount.value, showPinyin.value)
      gameStarted.value = true
      showSettings.value = false
    }

    const resetGame = () => {
      gameStarted.value = false
      showSettings.value = true
    }

    let firstIndex: number | null = null
    let secondIndex: number | null = null
    let lock = false
    let pendingTimeout: number | null = null

    const flipCell = (idx: number) => {
      if (lock) return
      if (matched[idx]) return  // Already matched, cannot flip
      if (revealed[idx]) return  // Already revealed on this turn
      if (firstIndex === idx) return  // Same card clicked twice
      
      revealed[idx] = true
      
      if (firstIndex === null) {
        firstIndex = idx
        return
      }
      
      // second flip
      secondIndex = idx
      turns.value++
      lock = true
      
      // Clear any pending timeout to prevent stacking
      if (pendingTimeout) clearTimeout(pendingTimeout)
      
      const a = board[firstIndex]
      const b = board[secondIndex]
      
      if (a.pairId === b.pairId) {
        // match (same pairId, different types)
        // Show matched cards with green border briefly, then hide
        const fIdx = firstIndex
        const sIdx = secondIndex
        // Add to matchingTemp to show green border immediately
        matchingTemp.value.push(fIdx, sIdx)
        pendingTimeout = window.setTimeout(() => {
          matched[fIdx] = true
          matched[sIdx] = true
          matchingTemp.value = matchingTemp.value.filter(i => i !== fIdx && i !== sIdx)
          firstIndex = null
          secondIndex = null
          lock = false
          pendingTimeout = null
        }, 800)  // Show match effect before removing
      } else {
        // no match - hide after delay
        const fIdx = firstIndex
        const sIdx = secondIndex
        pendingTimeout = window.setTimeout(() => {
          revealed[fIdx] = false
          revealed[sIdx] = false
          firstIndex = null
          secondIndex = null
          lock = false
          pendingTimeout = null
        }, 1200)  // Time for user to see cards
      }
    }

    return {
      board,
      revealed,
      matched,
      matchingTemp,
      flipCell,
      turns,
      showSettings,
      gameStarted,
      gameMode,
      selectedTopic,
      cardCount,
      showPinyin,
      matchCount,
      startGame,
      resetGame,
      availableTopics
    }
  }
})
</script>

<style scoped>
.memory-game h2 {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
}

/* Image mode: always 2 columns for larger display */
.game-grid.image-mode {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* Tablet small: 4 columns (unless image mode) */
@media (min-width: 641px) and (max-width: 1024px) {
  .game-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
    padding: 1rem;
  }
  
  .game-grid.image-mode {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
}

/* Tablet large / PC: 8 columns (unless image mode) */
@media (min-width: 1025px) {
  .game-grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 0.75rem;
    padding: 1rem;
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .game-grid.image-mode {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    max-width: 600px;
  }
}

.memory-card {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: white;
  border: 3px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
  padding: 0.5rem;
  box-sizing: border-box;
  flex-shrink: 0;
  position: relative;
  contain: layout style paint;
}

.image-card {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-card img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.memory-card:not([style*="display: none"]) {
  animation: none;
}

.memory-card[style*="display: none"] {
  animation: fadeOut 0.4s ease-out forwards;
}

.memory-card:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.memory-card:active:not(:disabled) {
  transform: scale(0.95);
}

.memory-card.revealed {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
}

/* Matched state overrides revealed state */
.memory-card.matched {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3) !important;
  background: rgba(16, 185, 129, 0.05) !important;
}

.memory-card:disabled {
  cursor: default;
}

.card-content {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popIn 0.3s ease-out;
  text-align: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
  inset: 0;
}

.hanzi-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  width: 100%;
  height: 100%;
  padding: 0.25rem;
  box-sizing: border-box;
}

.hanzi-text {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pinyin-text {
  font-size: 0.55rem;
  color: #6b7280;
  font-weight: 600;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-back {
  display: block;
  font-size: 1.5rem;
}

/* Image mode: larger card display */
.image-mode .card-content {
  font-size: 3rem;
}

.image-mode .memory-card {
  min-height: 150px;
}

@keyframes popIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

/* Cleanup containment when card is hidden */
.memory-card[style*="display: none"] {
  contain: none;
}

.game-settings {
  padding: 1.5rem;
  border-radius: 1.5rem 1.5rem 0 0;
}

.settings-title {
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #1f2937;
}

.settings-group {
  margin-bottom: 1.5rem;
}

.settings-label {
  display: block;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.start-btn {
  margin-top: 1rem;
}

.game-board {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.75rem;
}

.game-info {
  display: flex;
  gap: 2rem;
  font-weight: 600;
  color: #4f46e5;
}

.game-start {
  text-align: center;
  padding: 2rem;
}
</style>
