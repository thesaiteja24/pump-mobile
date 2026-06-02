import { useEffect, useRef } from 'react'

import { AppUpdateModal } from '@/components/ui/app-update-modal'
import { NotificationPromptModal } from '@/components/ui/notification-prompt-modal'
import { useAskNotificationPermission } from '@/hooks/notifications/use-ask-notification-permission'
import { useOneSignal } from '@/hooks/notifications/use-onesignal'
import { useAppUpdate } from '@/hooks/use-app-update'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Headless bootstrap component mounted inside the root layout.
 * Handles all side-effectful startup logic outside of render:
 *
 * Phase 5: OneSignal push notification SDK initialization + permission prompt.
 * Phase 6: PostHog + Sentry integration hooks.
 * Auth:    OneSignal identity sync — login(userId) on sign-in, logout() on sign-out.
 */
export function AppBootstrap() {
  const { initialize, login: oneSignalLogin, logout: oneSignalLogout, requestPermission, isInitialized } = useOneSignal()

  // Track the previous user id so we only call login/logout on actual changes,
  // not on every re-render.
  const prevUserIdRef = useRef<string | null>(null)

  const userId = useAuthStore(state => state.user?.id ?? null)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const update = useAppUpdate()

  // Initialize OneSignal SDK on mount (no-op if ONESIGNAL_APP_ID is not set)
  useEffect(() => {
    initialize()
  }, [initialize])

  // Sync OneSignal identity whenever auth state changes.
  // login(userId) links push tokens to the user → targeted notifications.
  // logout() unlinks the token → stops sending user-specific pushes.
  useEffect(() => {
    if (prevUserIdRef.current === userId)
      return

    if (isAuthenticated && userId) {
      oneSignalLogin(userId)
    }
    else if (!isAuthenticated && prevUserIdRef.current) {
      oneSignalLogout()
    }

    prevUserIdRef.current = userId
  }, [isAuthenticated, userId, oneSignalLogin, oneSignalLogout])

  // Ask for push permission once, 30 seconds after SDK is ready
  const { showPrompt, onRequestPermission, onDismiss } = useAskNotificationPermission(
    isAuthenticated && isInitialized,
    requestPermission,
  )

  return (
    <>
      {showPrompt && (
        <NotificationPromptModal
          onAccept={onRequestPermission}
          onDecline={onDismiss}
        />
      )}
      {isAuthenticated && update?.severity && <AppUpdateModal update={update} />}
    </>
  )
}
