import { CustomToast } from '@/components/ui/CustomToast'
import { useThemeColor } from '@/hooks/theme'
import { useInAppUpdate } from '@/hooks/useInAppUpdate'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/stores/auth.store'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StatusBar, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Toast from 'react-native-toast-message'
import { vexo } from 'vexo-analytics'
import './globals.css'

// ─────────────────────────────────────────────
// Prevent splash auto-hide (explicit release only)
// ─────────────────────────────────────────────
SplashScreen.preventAutoHideAsync()

if (!__DEV__) {
  vexo('8f13f010-99f1-4a89-881b-b1b0d2321412')
}

export default function RootLayout() {
  const colors = useThemeColor()
  // ───── Updates ─────
  useInAppUpdate()

  // ───── Fonts ─────
  const [fontsLoaded] = useFonts({
    Monoton: require('../assets/fonts/Monoton-Regular.ttf'),
  })

  // ───── Auth state ─────
  const restoreFromStorage = useAuth((s) => s.restoreFromStorage)
  const hasRestored = useAuth((s) => s.hasRestored)

  // ─────────────────────────────────────────────
  // 1️⃣ Restore auth from storage (once)
  // ─────────────────────────────────────────────
  useEffect(() => {
    restoreFromStorage()
  }, [restoreFromStorage])

  // ─────────────────────────────────────────────
  // 3️⃣ Release splash when boot is complete
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (fontsLoaded && hasRestored) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, hasRestored])

  // ─────────────────────────────────────────────
  // 4️⃣ Absolute safety: never hang on splash
  // ─────────────────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasRestored) {
        console.warn('Auth restore timeout — forcing app start')
        SplashScreen.hideAsync()
      }
    }, 4000)

    return () => clearTimeout(timeout)
  }, [hasRestored])

  // ─────────────────────────────────────────────
  // 6️⃣ Fallback loader (should rarely appear)
  // ─────────────────────────────────────────────
  if (!fontsLoaded || !hasRestored) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  // ─────────────────────────────────────────────
  // 7️⃣ App UI
  // ─────────────────────────────────────────────
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <BottomSheetModalProvider>
          <>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>

            <StatusBar
              barStyle={colors.isDark ? 'light-content' : 'dark-content'}
              backgroundColor={colors.background}
            />

            <Toast
              config={{
                success: (props) => <CustomToast {...props} type="success" />,
                error: (props) => <CustomToast {...props} type="error" />,
                info: (props) => <CustomToast {...props} type="info" />,
              }}
            />
          </>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  )
}
