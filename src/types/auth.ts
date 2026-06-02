import type { ApiSuccessResponse } from '@/types/api'

// ─── Role ──────────────────────────────────────────────────────────────────────

export type UserRole = 'systemAdmin' | 'gymAdmin' | 'trainer' | 'member'

// ─── User ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  role: UserRole
}

// ─── Session ───────────────────────────────────────────────────────────────────

export interface AuthSession {
  sessionId: string
  user: AuthUser
}

// ─── API response shapes ────────────────────────────────────────────────────────

/** Shape returned by POST /api/v1/auth/google */
export type GoogleSignInResponse = ApiSuccessResponse<AuthSession>
