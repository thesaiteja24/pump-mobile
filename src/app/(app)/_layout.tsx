import AuthGuard from '@/components/auth/AuthGuard'
import { useOneSignal } from '@/hooks/notifications/useOneSignal'
import { useThemeColor } from '@/hooks/theme'
import { useAuth } from '@/stores/auth.store'
import { useSubscriptionStore } from '@/stores/subscriptions.store'
import { Stack } from 'expo-router'
import React, { useEffect } from 'react'

export default function AppLayout() {
  const colors = useThemeColor()

  const userId = useAuth((s) => s.userId)
  const isAuthenticated = useAuth((s) => s.isAuthenticated)

  const {
    initialize: initializeOneSignal,
    login: loginOneSignal,
    logout: logoutOneSignal,
  } = useOneSignal()

  const initializeSubscription = useSubscriptionStore((s) => s.initialize)
  const loginSubscription = useSubscriptionStore((s) => s.login)
  const logoutSubscription = useSubscriptionStore((s) => s.logout)

  useEffect(() => {
    const cleanup = initializeOneSignal()
    initializeSubscription()

    return () => {
      cleanup?.()
    }
  }, [initializeOneSignal, initializeSubscription])

  // 2. Sync Auth State
  useEffect(() => {
    if (isAuthenticated && userId) {
      loginOneSignal(userId)
      loginSubscription(userId)
    } else if (!isAuthenticated) {
      logoutOneSignal()
      logoutSubscription()
    }
  }, [
    isAuthenticated,
    userId,
    loginOneSignal,
    logoutOneSignal,
    loginSubscription,
    logoutSubscription,
  ])

  return (
    <AuthGuard redirectTo="/(auth)/login">
      <Stack
        screenOptions={{
          headerShown: false,
          // animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthGuard>
  )
}
