import { useRouter } from 'expo-router'
import { useCallback, useSyncExternalStore } from 'react'

import { ENV } from '@/config/env'
import { analytics } from '@/lib/posthog'
import { Sentry } from '@/lib/sentry'

// OneSignal push notification integration.
// Safe to use in all environments — gracefully no-ops when:
//  - Running in Expo Go (native module unavailable)
//  - EXPO_PUBLIC_ONESIGNAL_APP_ID is not configured
//  - Any runtime initialization error occurs
import type { NotificationClickEvent, NotificationWillDisplayEvent } from 'react-native-onesignal'

// ─── Types ────────────────────────────────────────────────────────────────────

type OneSignalModule = typeof import('react-native-onesignal')

// ─── Module cache ─────────────────────────────────────────────────────────────

let cachedModule: OneSignalModule | null = null
let loadAttempted = false

async function loadOneSignal(): Promise<OneSignalModule | null> {
  if (loadAttempted)
    return cachedModule

  loadAttempted = true
  try {
    const mod = await import('react-native-onesignal')
    cachedModule = mod as OneSignalModule
    return cachedModule
  }
  catch (error) {
    Sentry.captureException(error)
    return null
  }
}

// ─── Notification routing helper ──────────────────────────────────────────────

function handleNotificationClick(
  event: NotificationClickEvent,
  push: ReturnType<typeof useRouter>['push'],
): void {
  try {
    const data = (event.notification as { additionalData?: Record<string, unknown> })
      .additionalData

    analytics.capture('notification_opened', {
      notificationId: event.notification.notificationId,
      title: event.notification.title ?? null,
      body: event.notification.body ?? null,
      ...data,
    })

    if (data?.screen && typeof data.screen === 'string') {
      push(data.screen as Parameters<typeof push>[0])
    }
  }
  catch (error) {
    Sentry.captureException(error)
  }
}

// ─── Shared reactive state ────────────────────────────────────────────────────

interface OneSignalState {
  hasPermission: boolean
  isOptedIn: boolean
  subscriptionId: string | null
  isInitialized: boolean
}

let sdkInitialized = false
const listeners = new Set<() => void>()

let cachedSnapshot: OneSignalState = {
  hasPermission: false,
  isOptedIn: false,
  subscriptionId: null,
  isInitialized: false,
}

function updateState(updates: Partial<OneSignalState>) {
  cachedSnapshot = {
    ...cachedSnapshot,
    ...updates,
  }
  listeners.forEach(l => l())
}

function setupEventListeners(
  os: OneSignalModule,
  onNotificationClick: (e: NotificationClickEvent) => void,
): void {
  os.OneSignal.Notifications.addEventListener('click', (event: NotificationClickEvent) => {
    onNotificationClick(event)
  })

  os.OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: NotificationWillDisplayEvent) => {
    event.getNotification().display()
  })

  os.OneSignal.User.pushSubscription.addEventListener('change', (state) => {
    if (cachedSnapshot.hasPermission && state.current.optedIn === false) {
      os.OneSignal.User.pushSubscription.optIn()
    }

    if (state.previous.optedIn === false && state.current.optedIn === true) {
      os.OneSignal.User.getExternalId().then((externalId) => {
        if (externalId) {
          os.OneSignal.logout()
          os.OneSignal.login(externalId)
        }
      }).catch((err) => {
        Sentry.captureException(err)
      })
    }

    updateState({
      isOptedIn: state.current.optedIn,
      subscriptionId: state.current.id ?? null,
    })
    analytics.setPersonProperties({
      push_notifications_opted_in: state.current.optedIn,
      onesignal_subscription_id: state.current.id ?? null,
    })
  })

  os.OneSignal.Notifications.addEventListener('permissionChange', (permission: boolean) => {
    updateState({ hasPermission: permission })
    analytics.capture('push_permission_changed', { enabled: permission })
    analytics.setPersonProperties({
      push_notifications_permission: permission ? 'granted' : 'denied',
    })
  })
}

async function runInitializeSDK(
  os: OneSignalModule,
  appId: string,
  onNotificationClick: (e: NotificationClickEvent) => void,
): Promise<void> {
  try {
    os.OneSignal.initialize(appId)

    setupEventListeners(os, onNotificationClick)

    Promise.all([
      os.OneSignal.Notifications.getPermissionAsync(),
      os.OneSignal.User.pushSubscription.getOptedInAsync(),
      os.OneSignal.User.pushSubscription.getIdAsync(),
    ]).then(([permission, optedIn, id]) => {
      updateState({
        hasPermission: permission,
        isOptedIn: optedIn,
        subscriptionId: id,
      })
    }).catch((error) => {
      Sentry.captureException(error)
    }).finally(() => {
      updateState({ isInitialized: true })
    })

    sdkInitialized = true
  }
  catch (error) {
    Sentry.captureException(error)
    updateState({ isInitialized: true })
  }
}

// ─── useSyncExternalStore wiring ─────────────────────────────────────────────

function getSnapshot(): OneSignalState {
  return cachedSnapshot
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function useOneSignalState(): OneSignalState {
  return useSyncExternalStore(subscribe, getSnapshot)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseOneSignalReturn {
  initialize: () => Promise<void>
  login: (userId: string) => Promise<void>
  logout: () => Promise<void>
  requestPermission: () => Promise<boolean>
  hasPermission: boolean
  isOptedIn: boolean
  subscriptionId: string | null
  isInitialized: boolean
}

/**
 * Provides a safe, lazily-initialized interface to OneSignal push notifications.
 * All methods are no-ops when the SDK is unavailable or not configured.
 *
 * Deep-link routing on notification tap:
 *  - Notifications with `additionalData.screen` will push to that Expo Router route.
 *
 * Note: PostHog analytics calls (trackPostHogPermissions) are added in Phase 6
 * once the analytics lib is set up.
 */

export function useOneSignal(): UseOneSignalReturn {
  const router = useRouter()
  const { hasPermission, isOptedIn, subscriptionId, isInitialized } = useOneSignalState()

  const initialize = useCallback(async () => {
    if (__DEV__)
      return

    if (sdkInitialized) {
      return
    }

    const appId = ENV.EXPO_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) {
      return
    }

    const os = await loadOneSignal()
    if (!os) {
      return
    }

    const onClick = (e: NotificationClickEvent) => handleNotificationClick(e, router.push)
    await runInitializeSDK(os, appId, onClick)
  }, [router.push])

  const login = useCallback(async (userId: string) => {
    const os = await loadOneSignal()
    if (!os || !sdkInitialized) {
      return
    }
    try {
      os.OneSignal.login(userId)
    }
    catch (error) {
      Sentry.captureException(error)
    }
  }, [])

  const logout = useCallback(async () => {
    const os = await loadOneSignal()
    if (!os || !sdkInitialized) {
      return
    }
    try {
      os.OneSignal.logout()
    }
    catch (error) {
      Sentry.captureException(error)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    const os = await loadOneSignal()
    if (!os || !sdkInitialized) {
      return false
    }
    try {
      const granted = await os.OneSignal.Notifications.requestPermission(true)
      if (granted) {
        os.OneSignal.User.pushSubscription.optIn()

        const externalId = await os.OneSignal.User.getExternalId()
        if (externalId) {
          os.OneSignal.logout()
          os.OneSignal.login(externalId)
        }
      }
      const newSubscriptionId = await os.OneSignal.User.pushSubscription.getIdAsync()
      updateState({
        hasPermission: granted,
        isOptedIn: granted,
        subscriptionId: newSubscriptionId,
      })

      return granted
    }
    catch (error) {
      Sentry.captureException(error)
      return false
    }
  }, [])

  return { initialize, login, logout, requestPermission, hasPermission, isOptedIn, subscriptionId, isInitialized }
}
