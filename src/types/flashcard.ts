export interface FlashcardAudio {
  cn: string
  en: string
  vi: string
}

export interface ExampleSentence {
  hanzi: string
  pinyin: string
  meaning_vi: string
}

export interface Meanings {
  en: string
  vi: string
}

export interface FlashcardContent {
  hanzi: string
  pinyin: string
  english_phonetic?: string
  image_url?: string
  audio: FlashcardAudio
  meanings: Meanings
  example_sentence?: ExampleSentence
}

export interface Flashcard {
  id: string
  topic: string
  level: string
  is_premium: boolean
  content: FlashcardContent
}
