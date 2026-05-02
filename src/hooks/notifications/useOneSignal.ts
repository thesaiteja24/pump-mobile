import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { LogLevel, OneSignal } from 'react-native-onesignal'

const ONESIGNAL_APP_ID = '412e5d5a-c5e4-485b-a462-2ecbaf6c833a'

export const useOneSignal = () => {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)

  const initialize = useCallback(async () => {
    if (isInitialized) return

    if (__DEV__) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose)
    }

    // Initialize OneSignal
    OneSignal.initialize(ONESIGNAL_APP_ID)

    // Check existing permission
    setHasPermission(await OneSignal.Notifications.getPermissionAsync())

    // Notification clicked
    const clickListener = (event: any) => {
      console.log('Notification clicked:', event)

      const data = event.notification.additionalData

      if (data) {
        if (
          data.type === 'workout_like' ||
          data.type === 'workout_comment' ||
          data.type === 'comment_reply' ||
          data.type === 'comment_like'
        ) {
          if (data.workoutId) {
            router.push(`/(app)/workout/${data.workoutId}`)
          }
        } else if (data.type === 'new_follower') {
          router.push('/(app)/profile/search') // Fallback since there's no public profile view yet
        } else if (data.screen) {
          router.push(data.screen)
        }
      }
    }

    // Notification received while app is open
    const foregroundListener = (event: any) => {
      console.log('Notification received in foreground:', event.notification)
    }

    OneSignal.Notifications.addEventListener('click', clickListener)
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundListener)

    setIsInitialized(true)

    return () => {
      OneSignal.Notifications.removeEventListener('click', clickListener)
      OneSignal.Notifications.removeEventListener('foregroundWillDisplay', foregroundListener)
    }
  }, [isInitialized, router])

  const requestPermission = useCallback(async () => {
    const granted = await OneSignal.Notifications.requestPermission(true)
    if (granted) {
      OneSignal.User.pushSubscription.optIn()
    }
    setHasPermission(granted)
    return granted
  }, [])

  const login = useCallback(
    async (externalId: string) => {
      if (!isInitialized) return
      const subId = await OneSignal.User.pushSubscription.getIdAsync()

      if (subId) {
        OneSignal.login(externalId)
      } else {
        console.log('⚠️ Cannot login — no subscription yet')
      }
    },
    [isInitialized],
  )

  const logout = useCallback(() => {
    if (!isInitialized) return
    OneSignal.logout()
  }, [isInitialized])

  return {
    isInitialized,
    hasPermission,
    initialize,
    requestPermission,
    login,
    logout,
  }
}
