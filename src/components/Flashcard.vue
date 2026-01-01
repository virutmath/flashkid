<template>
  <div class="flashcard-wrapper">
    <div
      class="flashcard"
      :class="{ 'is-flipped': flipped }"
      @click="toggleFlip"
      tabindex="0"
      @keyup.enter.stop.prevent="toggleFlip"
      @keyup.space.stop.prevent="toggleFlip"
      role="button"
      :aria-pressed="flipped"
      aria-label="Flashcard. Press to flip"
    >
      <!-- front -->
      <div class="card-side card-front">
        <button
          class="bookmark-btn"
          type="button"
          @click.stop="toggleBookmark"
          :aria-label="isBookmarked ? 'Remove bookmark' : 'Add bookmark'"
        >
          {{ isBookmarked ? '⭐' : '☆' }}
        </button>

        <div class="card-image" v-if="card.content.image_url">
          <img :src="card.content.image_url" :alt="card.content.hanzi" />
        </div>

        <div class="card-text">{{ card.content.hanzi }}</div>
        <div class="pinyin">{{ card.content.pinyin }}</div>
        <div class="english-phonetic" v-if="card.content.english_phonetic">
          {{ card.content.english_phonetic }}
        </div>

        <!-- Single unified audio button -->
        <div class="audio-buttons">
          <van-button
            size="small"
            type="primary"
            class="audio-btn"
            @click.stop="play"
            :loading="isPlaying"
          >
            <span v-if="!isPlaying" class="audio-icon">🔊</span>
            <div v-else class="visualizer playing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </van-button>
        </div>
      </div>

      <!-- back -->
      <div class="card-side card-back">
        <div class="meanings-title">Meanings:</div>
        <div class="meanings-text">
          {{ card.content.meanings.en }} / {{ card.content.meanings.vi }}
        </div>

        <div v-if="card.content.example_sentence" style="margin-top: 1.5rem;">
          <div class="example-title">Example:</div>
          <div style="font-size: 1.2rem; color: white;">
            {{ card.content.example_sentence.hanzi }}
          </div>
          <div style="font-size: 1rem; color: rgba(255, 255, 255, 0.9); margin-top: 0.25rem;">
            {{ card.content.example_sentence.pinyin }}
          </div>
          <div style="font-size: 1rem; color: rgba(255, 255, 255, 0.85); margin-top: 0.5rem;">
            {{ card.content.example_sentence.meaning_vi }}
          </div>
        </div>

        <div class="card-footer">
          <van-button size="small" @click.stop="printCard">Print</van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, watch, computed } from 'vue'
import type { Flashcard } from '@/types/flashcard'
import { useUserStore } from '@/stores/user'

export default defineComponent({
  name: 'Flashcard',
  props: {
    card: {
      type: Object as PropType<Flashcard>,
      required: true
    }
  },
  setup(props) {
    const userStore = useUserStore()
    const flipped = ref(false)
    const isPlaying = ref(false)
    
    // Computed property to check if card is bookmarked
    const isBookmarked = computed(() => {
      return userStore.bookmarks.includes(props.card.id)
    })

    // Expose card to template
    const card = props.card

    const toggleFlip = () => {
      flipped.value = !flipped.value
    }

    const play = async () => {
      const audioUrl = card.content.audio?.cn
      if (!audioUrl) return
      isPlaying.value = true
      try {
        const audio = new Audio(audioUrl)
        audio.onended = () => { isPlaying.value = false }
        audio.onerror = () => { isPlaying.value = false }
        await audio.play()
      } catch (err) {
        console.error('audio play error:', err)
        isPlaying.value = false
      }
    }

    const toggleBookmark = async () => {
      try {
        await userStore.toggleBookmark(props.card.id)
      } catch (error) {
        console.error('Bookmark error:', error)
      }
    }

    const printCard = () => {
      const w = window.open('', '', 'width=600,height=800')
      if (!w) return
      const html = `
        <html>
        <head>
          <title>Flashcard - ${card.content.hanzi}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .hanzi { font-size: 3rem; font-weight: bold; margin-bottom: 10px; }
            .pinyin { font-size: 1.5rem; color: #666; margin-bottom: 10px; }
            .mean { font-size: 1.2rem; color: #333; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div>
            <div class="hanzi">${card.content.hanzi}</div>
            <div class="pinyin">${card.content.pinyin}</div>
            <div class="pinyin">${card.content.english_phonetic || ''}</div>
            <div class="mean">${card.content.meanings.en} / ${card.content.meanings.vi}</div>
            <div style="margin-top:20px">${card.content.example_sentence?.hanzi || ''}<br>${card.content.example_sentence?.pinyin || ''}<br>${card.content.example_sentence?.meaning_vi || ''}</div>
          </div>
        </body>
        </html>
      `
      w.document.write(html)
      w.document.close()
      w.print()
    }

    return { card, flipped, toggleFlip, play, printCard, isPlaying, isBookmarked, toggleBookmark }
  }
})
</script>

<style scoped>
.flashcard-wrapper {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.flashcard {
  position: relative;
  width: 100%;
  height: 400px;
  perspective: 1000px;
  cursor: pointer;
  outline: none;
  border-radius: 1.5rem;
  overflow: hidden;
}

.bookmark-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 6px 10px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  z-index: 10;
}

.bookmark-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.flashcard:focus {
  outline: 4px solid #4f46e5;
  outline-offset: 2px;
}

.card-side {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  padding: 2rem;
}

.card-front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: rotateY(0deg);
}

.card-back {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  transform: rotateY(180deg);
}

.flashcard.is-flipped .card-front {
  transform: rotateY(180deg);
}

.flashcard.is-flipped .card-back {
  transform: rotateY(360deg);
}

.card-image {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 1rem;
}

.card-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card-text {
  text-align: center;
  width: 100%;
  margin: 0 auto;
  font-size: 3.2rem;
  font-weight: 800;
  color: white;
}

.pinyin {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 0.5rem;
}

.english-phonetic {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.25rem;
}

.audio-buttons {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;
  margin-top: 1rem;
}

.audio-btn {
  min-width: 64px;
  padding-inline: 14px;
}

.audio-icon {
  display: inline-block;
  filter: invert(1) grayscale(1);
}

/* visualizer */
.visualizer {
  display: flex;
  gap: 6px;
  height: 18px;
  align-items: flex-end;
}

.visualizer span {
  display: block;
  width: 6px;
  height: 6px;
  background: #cbd5e1;
  border-radius: 2px;
  transform-origin: bottom;
  transition: height 0.15s ease;
  will-change: height;
  contain: layout style;
}

.visualizer.playing span:nth-child(1) {
  animation: beatA 400ms ease-in-out infinite;
}

.visualizer.playing span:nth-child(2) {
  animation: beatB 420ms ease-in-out infinite;
}

.visualizer.playing span:nth-child(3) {
  animation: beatC 380ms ease-in-out infinite;
}

@keyframes beatA {
  0%, 100% { height: 6px; }
  50% { height: 18px; }
}

@keyframes beatB {
  0%, 100% { height: 6px; }
  50% { height: 14px; }
}

@keyframes beatC {
  0%, 100% { height: 6px; }
  50% { height: 12px; }
}

/* Back side */
.meanings-title,
.example-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.meanings-text {
  font-size: 1.5rem;
  color: white;
  font-weight: 600;
}

.card-footer {
  margin-top: 1.5rem;
}
</style>
