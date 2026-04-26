import { registerUnauthorizedHandler } from '@/lib/authSession'
import { queryClient } from '@/lib/queryClient'
import { setAccessToken } from '@/services/api'
import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'

type AuthState = {
  userId: string | null
  accessToken: string | null
  isAuthenticated: boolean

  // Boot invariant
  hasRestored: boolean

  hasSeenOnboarding: boolean
  completeOnboarding: () => Promise<void>

  setSession: (session: {
    userId: string
    accessToken: string
    refreshToken: string
  }) => Promise<void>

  restoreFromStorage: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  userId: null,
  accessToken: null,
  isAuthenticated: false,
  hasRestored: false,
  hasSeenOnboarding: false,

  completeOnboarding: async () => {
    set({ hasSeenOnboarding: true })
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true')
  },

  setSession: async ({ userId, accessToken, refreshToken }) => {
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    await SecureStore.setItemAsync('userId', userId)
    setAccessToken(accessToken)
    set({
      userId,
      accessToken,
      isAuthenticated: true,
    })
  },

  restoreFromStorage: async () => {
    if (get().hasRestored) return // idempotent

    try {
      const token = await SecureStore.getItemAsync('accessToken')
      const userId = await SecureStore.getItemAsync('userId')
      const hasSeenOnboarding = await SecureStore.getItemAsync('hasSeenOnboarding')

      set({ hasSeenOnboarding: hasSeenOnboarding === 'true' })

      if (token && userId) {
        setAccessToken(token)
        set({
          accessToken: token,
          userId: userId,
          isAuthenticated: true,
        })
      }
    } catch {
      set({
        accessToken: null,
        userId: null,
        isAuthenticated: false,
      })
    } finally {
      set({ hasRestored: true })
    }
  },

  logout: async () => {
    try {
      // Clear TanStack Query cache
      queryClient.clear()

      await SecureStore.deleteItemAsync('accessToken')
      await SecureStore.deleteItemAsync('refreshToken')
      await SecureStore.deleteItemAsync('userId')
    } finally {
      set({
        userId: null,
        accessToken: null,
        isAuthenticated: false,
      })

      // Reset all related stores
      const { useWorkout } = require('./workoutStore')
      const { useTemplate } = require('./templateStore')

      useWorkout.getState().resetState()
      useTemplate.getState().resetState()
    }
  },
}))

registerUnauthorizedHandler(() => {
  useAuth.getState().logout()
})
