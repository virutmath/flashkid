export type UserRole = 'guest' | 'free_user' | 'paid_user'

export function getUserRole(): UserRole {
  return (localStorage.getItem('user_role') as UserRole) || 'guest'
}

export function canAccessFeature(featureName: string): boolean {
  const role = getUserRole()
  const rules: Record<string, UserRole[]> = {
    'premium_content': ['paid_user'],
    'download_media': ['paid_user', 'free_user']
  }
  const allowed = rules[featureName]
  if (!allowed) return true // default open
  return allowed.includes(role)
}
