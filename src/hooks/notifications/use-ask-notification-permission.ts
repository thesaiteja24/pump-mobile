import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Platform } from 'react-native'

import { mmkvStorageAdapter } from '@/lib/storage'

import type { UseOneSignalReturn } from './use-onesignal'

const PERMISSION_ASKED_KEY = 'notifications.permissionAsked'
const PROMPT_DELAY_MS = 30000

export interface UseAskNotificationPermissionReturn {
  showPrompt: boolean
  onRequestPermission: () => Promise<void>
  onDismiss: () => void
}

/**
 * Asks for push notification permission once, with a 30-second delay.
 * @param enabled - Should be true when the SDK is initialized and ready.
 * @param requestPermission - The requestPermission function from useOneSignal().
 */
export function useAskNotificationPermission(
  enabled: boolean,
  requestPermission: UseOneSignalReturn['requestPermission'],
): UseAskNotificationPermissionReturn {
  const [showPrompt, setShowPrompt] = useState(false)
  const hasAskedRef = useRef(false)

  useEffect(() => {
    if (!enabled)
      return

    if (mmkvStorageAdapter.getItem(PERMISSION_ASKED_KEY) === 'true')
      return

    if (hasAskedRef.current)
      return

    const timer = setTimeout(async () => {
      hasAskedRef.current = true

      if (Platform.OS === 'ios') {
        Alert.alert(
          'Enable Notifications?',
          'Stay updated with real-time updates and notifications about your account.',
          [
            {
              text: 'Maybe Later',
              style: 'cancel',
              onPress: () => {},
            },
            {
              text: 'Enable',
              onPress: async () => {
                mmkvStorageAdapter.setItem(PERMISSION_ASKED_KEY, 'true')
                await requestPermission()
              },
            },
          ],
        )
      }
      else {
        setShowPrompt(true)
      }
    }, PROMPT_DELAY_MS)

    return () => clearTimeout(timer)
  }, [enabled, requestPermission])

  const onRequestPermission = useCallback(async () => {
    setShowPrompt(false)
    mmkvStorageAdapter.setItem(PERMISSION_ASKED_KEY, 'true')
    await requestPermission()
  }, [requestPermission])

  const onDismiss = useCallback(() => {
    setShowPrompt(false)
  }, [])

  return {
    showPrompt,
    onRequestPermission,
    onDismiss,
  }
}
