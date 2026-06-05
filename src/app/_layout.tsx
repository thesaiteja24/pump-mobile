import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter'
import { SplashScreen, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'

import { FallbackComponent } from '@/components/ui/fallback-component'
import { useTheme } from '@/hooks/use-theme'
import { AriseRoot } from '@/lib/arise'
import { ConfettiRoot } from '@/lib/confetti'
import { Sentry } from '@/lib/sentry'
import { AppBootstrap } from '@/providers/app-bootstrap'
import { AppProviders } from '@/providers/app-providers'
import { useAuthStore } from '@/stores/auth-store'

// Must be called synchronously at module-level so the splash is held
// before the first render cycle. Moving this into useEffect would cause
// a flash because the JS bridge call would be deferred after paint.
SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { isDark } = useTheme()
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Global overlay layers — rendered above all screens */}
      <AriseRoot />
      <ConfettiRoot />
      {/* Headless startup effects (OneSignal init, permission prompt, analytics, etc.) */}
      <AppBootstrap />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  )
}

function RootLayout() {
  return (
    <AppProviders>
      <Sentry.ErrorBoundary fallback={FallbackComponent}>
        <RootNavigator />
      </Sentry.ErrorBoundary>
    </AppProviders>
  )
}

// Wrap with Sentry for automatic navigation instrumentation and breadcrumbs.
// When EXPO_PUBLIC_SENTRY_DSN is unset, Sentry.wrap is a transparent pass-through.
export default Sentry.wrap(RootLayout)
