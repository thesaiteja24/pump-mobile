import { Stack } from 'expo-router'

import { useThemeColor } from '@/hooks/theme'

export default function Layout() {
  const colors = useThemeColor()
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}
