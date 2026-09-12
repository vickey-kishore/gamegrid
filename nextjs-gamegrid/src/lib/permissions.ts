import { User } from '@/types'

export function isMasterAdmin(userRole: 'admin' | 'creator' | 'player' | null): boolean {
  return userRole === 'admin'
}

export function isResourceOwner(user: User | null, resourceUserId: string | null | undefined): boolean {
  if (!user || !resourceUserId) return false
  return user.id === resourceUserId
}

export function canManageResource(user: User | null, resourceUserId: string | null | undefined, userRole: 'admin' | 'creator' | 'player' | null): boolean {
  return isMasterAdmin(userRole) || isResourceOwner(user, resourceUserId)
}

export function canCreateResource(userRole: 'admin' | 'creator' | 'player' | null): boolean {
  if (!userRole) return false
  return userRole === 'admin' || userRole === 'creator'
}
