import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { googleSignInApi } from '@/api/auth'
import { ENV } from '@/config/env'
import { Arise } from '@/lib/arise'
import { analytics } from '@/lib/posthog'
import { useAuthStore } from '@/stores/auth-store'
import { ApiRequestError } from '@/types/api'

// ─── Hook ──────────────────────────────────────────────────────────────────────

export interface UseGoogleSignInResult {
  signIn: () => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * Manages the native Google Sign In flow using @react-native-google-signin/google-signin.
 */
export function useGoogleSignIn(): UseGoogleSignInResult {
  const router = useRouter()
  const { setSession } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: ENV.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: ENV.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    })
  }, [])

  const signIn = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      await GoogleSignin.hasPlayServices()

      // Ensure any previous session is cleared before signing in
      try {
        await GoogleSignin.signOut()
      }
      catch {
      }
      const userInfo = await GoogleSignin.signIn()

      const idToken = userInfo.data?.idToken

      if (!idToken) {
        console.error('[Google Auth] No ID token received in userInfo')
        throw new Error('No ID token received from Google')
      }

      const session = await googleSignInApi(idToken)

      setSession(session)
      analytics.identify(session.user.id)
      analytics.capture('sign_in', { method: 'google' })

      router.replace('/(app)/(tabs)/home')
    }
    catch (err: unknown) {
      console.error('[Google Auth] Error during sign-in flow:', err)
      const error = err as { code?: string, message?: string }

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        console.warn('[Google Auth] User cancelled sign in')
      }
      else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
        console.warn('[Google Auth] Sign in is already in progress')
      }
      else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        const msg = 'Play services not available'
        setError(msg)
        Arise.error({ heading: 'Sign in failed', content: msg })
      }
      else {
        // some other error happened
        const msg = err instanceof ApiRequestError
          ? err.message
          : error.message || 'Something went wrong. Please try again.'
        setError(msg)
        Arise.error({ heading: 'Sign in failed', content: msg })
        console.error('[Google Auth] Detailed error message:', msg)
      }
    }
    finally {
      setIsLoading(false)
    }
  }, [router, setSession])

  return { signIn, isLoading, error }
}
