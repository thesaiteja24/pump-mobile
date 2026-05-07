import { useEffect, useRef } from 'react'
import { OneSignal } from 'react-native-onesignal'

export function useAskNotificationPermission(enabled: boolean) {
  const hasAsked = useRef(false)

  useEffect(() => {
    if (!enabled) return
    if (hasAsked.current) return

    const timer = setTimeout(async () => {
      try {
        const granted = await OneSignal.Notifications.requestPermission(true)

        if (granted) {
          console.info('🔔 Notification permission granted')
        } else {
          console.info('🔕 Notification permission denied')
        }

        hasAsked.current = true
      } catch (err) {
        console.error('Notification permission error', err)
      }
    }, 1500) // Play Store style delay

    return () => clearTimeout(timer)
  }, [enabled])
}
