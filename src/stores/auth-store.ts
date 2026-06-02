import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { logoutApi } from '@/api/auth'
import { analytics } from '@/lib/posthog'
import { mmkvStorageAdapter } from '@/lib/storage'

import type { AuthSession, AuthUser } from '@/types/auth'

// ─── State shape ───────────────────────────────────────────────────────────────

interface AuthState {
  /** Opaque Redis session ID used as the Bearer token. */
  sessionId: string | null
  /** Minimal user profile — enough for the UI and analytics. */
  user: AuthUser | null
  /** Derived — true when sessionId is non-null. */
  isAuthenticated: boolean

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Persist a session after successful Google sign-in.
   * Stored in MMKV via zustand/persist — survives cold restarts.
   */
  setSession: (session: AuthSession) => void

  /**
   * Clear the session: fires logout API (best-effort), wipes MMKV,
   * resets TanStack Query cache, and resets PostHog identity.
   * OneSignal logout is handled in AppBootstrap by subscribing to this state.
   */
  clearSession: () => Promise<void>
}

// ─── Cleared state constant ────────────────────────────────────────────────────

const CLEARED: Pick<AuthState, 'sessionId' | 'user' | 'isAuthenticated'> = {
  sessionId: null,
  user: null,
  isAuthenticated: false,
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      ...CLEARED,

      setSession: ({ sessionId, user }) => {
        set({ sessionId, user, isAuthenticated: true })
      },

      clearSession: async () => {
        // Best-effort server-side revocation — do not block local logout on failure.
        try {
          await logoutApi()
        }
        catch {
          // Session may already be expired or network unavailable — safe to ignore.
        }

        // Clear TanStack Query cache — import lazily to avoid circular imports.
        try {
          // eslint-disable-next-line ts/no-require-imports
          const { queryClient } = require('@/providers/query-client') as typeof import('@/providers/query-client')
          queryClient.clear()
        }
        catch {
          // queryClient not yet initialized (e.g. called before providers mount)
        }

        // Reset PostHog — dissociates future events from the logged-out user.
        analytics.reset()

        set(CLEARED)
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorageAdapter),
      // Only persist identity fields — never leak sessionId to MMKV
      // since MMKV is not encrypted. sessionId is kept in-memory only.
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // sessionId intentionally excluded — persisted separately below
      }),
    },
  ),
)

// ─── MMKV direct persistence for sessionId ─────────────────────────────────────
// We persist sessionId directly in MMKV (not through zustand/persist) so we can
// read it synchronously in the axios interceptor without a Zustand subscribe.

const SESSION_KEY = 'auth.sessionId'

// Patch setSession / clearSession to also sync sessionId to MMKV directly.
const originalSetSession = useAuthStore.getState().setSession
useAuthStore.setState({
  setSession: (session) => {
    mmkvStorageAdapter.setItem(SESSION_KEY, session.sessionId)
    originalSetSession(session)
    // Re-patch after zustand replaces the state object
    useAuthStore.setState({
      sessionId: session.sessionId,
      isAuthenticated: true,
      user: session.user,
    })
  },
})

// Hydrate sessionId from MMKV on module load (synchronous, zero latency).
const storedSessionId = mmkvStorageAdapter.getItem(SESSION_KEY)
if (storedSessionId) {
  useAuthStore.setState({ sessionId: storedSessionId })
}

// Patch clearSession to also remove sessionId from MMKV.
const originalClearSession = useAuthStore.getState().clearSession
useAuthStore.setState({
  clearSession: async () => {
    mmkvStorageAdapter.removeItem(SESSION_KEY)
    await originalClearSession()
  },
})
