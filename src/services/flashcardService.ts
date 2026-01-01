import apiClient from './apiClient'
import type { Flashcard } from '../types/flashcard'

export interface TopicOption {
  id: string
  label?: string
}

export interface LevelOption {
  id: string
  label?: string
}

interface ApiListResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

type FlashcardListMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  topics?: TopicOption[]
  levels?: LevelOption[]
}

type FlashcardListResult = {
  items: Flashcard[]
  meta: FlashcardListMeta
}

type FetchFlashcardParams = {
  topic?: string
  level?: string
  page?: number
  pageSize?: number
}

export const fetchFlashcards = async (params?: FetchFlashcardParams): Promise<FlashcardListResult> => {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20

  const queryParams: Record<string, any> = {
    page,
    pageSize
  }

  if (params?.topic) queryParams.topic = params.topic
  if (params?.level) queryParams.level = params.level

  const res = await apiClient.get<{ data: Flashcard[]; meta?: Partial<FlashcardListMeta> }>(
    '/flashcards',
    { params: queryParams }
  )

  const items = res.data.data
  const meta: FlashcardListMeta = {
    page: res.data.meta?.page ?? page,
    pageSize: res.data.meta?.pageSize ?? pageSize,
    total: res.data.meta?.total ?? items.length,
    totalPages: res.data.meta?.totalPages ?? Math.max(1, Math.ceil((res.data.meta?.total ?? items.length) / pageSize)),
    topics: res.data.meta?.topics as string[] | undefined,
    levels: res.data.meta?.levels as string[] | undefined
  }

  return { items, meta }
}

export const fetchTopics = async (): Promise<TopicOption[]> => {
  const res = await apiClient.get<ApiListResponse<Array<{ id: string; label?: string }>>>('/topics')
  return res.data.data.map((t) => ({ id: t.id, label: t.label }))
}

export const fetchLevels = async (): Promise<LevelOption[]> => {
  const res = await apiClient.get<ApiListResponse<Array<{ id: string; label?: string }>>>('/levels')
  return res.data.data.map((l) => ({ id: l.id, label: l.label }))
}
