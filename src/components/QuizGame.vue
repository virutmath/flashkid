<template>
  <div class="quiz-card">
    <h3 class="quiz-title">Quiz Mode</h3>
    <div class="question-block" v-if="current && !finished">
      <div class="prompt">What is this word?</div>
      <div class="quiz-image" v-if="current.content.image_url">
        <img :src="current.content.image_url" alt="quiz" />
      </div>
      <div class="quiz-audio">
        <van-button size="small" type="primary" round @click="playAudio">Play Audio</van-button>
      </div>
      <div class="choices">
        <van-button
          v-for="choice in choices"
          :key="choice.id"
          class="choice-btn"
          :type="getType(choice.id)"
          block
          round
          @click="answer(choice.id)"
        >
          {{ choice.label }}
        </van-button>
      </div>
      <div class="status" v-if="feedback">
        <span :class="{ correct: feedback === 'Correct!', wrong: feedback === 'Try again' }">{{ feedback }}</span>
      </div>
      <div class="meta">
        <span>Question {{ index + 1 }} / {{ questions.length }}</span>
        <span>Score: {{ score }}</span>
      </div>
    </div>
    <div v-else-if="finished" class="result-block">
      <div class="result-title">Quiz complete!</div>
      <div class="result-score">Score: {{ score }}</div>
      <div class="result-meta">{{ questions.length }} questions answered</div>
      <van-button type="primary" round block @click="restart">Restart Quiz</van-button>
    </div>
    <div v-else class="loading-text">Loading quiz...</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, onBeforeUnmount } from 'vue'
import type { Flashcard } from '../types/flashcard'

interface ChoiceOption {
  id: string
  label: string
}

export default defineComponent({
  name: 'QuizGame',
  props: {
    items: { type: Array as () => Flashcard[], required: true }
  },
  setup(props) {
    const questions = ref<Flashcard[]>([])
    const index = ref(0)
    const choices = ref<ChoiceOption[]>([])
    const feedback = ref('')
    const score = ref(0)
    const finished = ref(false)
    const audio = new Audio()

    const shuffle = <T,>(arr: T[]): T[] => {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }

    const pickChoices = (correct: Flashcard, pool: Flashcard[]): ChoiceOption[] => {
      const others = shuffle(pool.filter((p) => p.id !== correct.id)).slice(0, 3)
      const opts = shuffle([correct, ...others]).map((c) => ({ id: c.id, label: `${c.content.hanzi} · ${c.content.meanings.en}` }))
      return opts
    }

    const current = computed(() => questions.value[index.value])

    const buildQuiz = () => {
      if (!props.items.length) return
      questions.value = shuffle(props.items).slice(0, Math.min(10, props.items.length))
      index.value = 0
      score.value = 0
      feedback.value = ''
      finished.value = false
      if (current.value) {
        choices.value = pickChoices(current.value, props.items)
      }
    }

    const nextQuestion = () => {
      if (index.value < questions.value.length - 1) {
        index.value += 1
        feedback.value = ''
        choices.value = current.value ? pickChoices(current.value, props.items) : []
      } else {
        finished.value = true
        feedback.value = 'Great job!'
      }
    }

    const answer = (id: string) => {
      if (finished.value) return
      if (!current.value) return
      if (id === current.value.id) {
        feedback.value = 'Correct!'
        score.value += 10
        setTimeout(nextQuestion, 600)
      } else {
        feedback.value = 'Try again'
        score.value = Math.max(0, score.value - 2)
      }
    }

    const playAudio = () => {
      if (!current.value?.content.audio.cn) return
      audio.src = current.value.content.audio.cn
      audio.play().catch(() => {})
    }

    // Watch only items length to avoid deep comparison overhead
    watch(
      () => props.items.length,
      (len) => {
        if (len > 0) {
          buildQuiz()
        }
      },
      { immediate: true }
    )

    onBeforeUnmount(() => {
      audio.pause()
      audio.src = ''
    })

    const getType = (id: string) => {
      if (!current.value) return 'default'
      if (feedback.value === 'Correct!' && id === current.value.id) return 'success'
      return 'primary'
    }

    const restart = () => buildQuiz()

    return { current, choices, feedback, score, index, questions, finished, answer, playAudio, getType, restart }
  }
})
</script>

<style scoped>
.quiz-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.quiz-title {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #1f2937;
}

.prompt {
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #374151;
}

.quiz-image {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.quiz-image img {
  max-width: 200px;
  max-height: 160px;
  object-fit: contain;
}

.quiz-audio {
  text-align: center;
  margin-bottom: 0.75rem;
}

.choices {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.choice-btn {
  font-weight: 700;
}

.status {
  text-align: center;
  margin-bottom: 0.5rem;
}

.status .correct { color: #10b981; font-weight: 700; }
.status .wrong { color: #ef4444; font-weight: 700; }

.meta {
  display: flex;
  justify-content: space-between;
  color: #6b7280;
  font-size: 0.9rem;
}

.loading-text {
  text-align: center;
  color: #6b7280;
}

.result-block {
  text-align: center;
  display: grid;
  gap: 0.5rem;
}

.result-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #111827;
}

.result-score {
  font-size: 1.1rem;
  color: #047857;
  font-weight: 700;
}

.result-meta {
  color: #6b7280;
}
</style>
