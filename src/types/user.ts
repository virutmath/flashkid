export interface Badge {
  id: string
  name: string
  icon: string
  description: string
}

export interface Streak {
  current: number
  best: number
  lastUpdated: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
}
