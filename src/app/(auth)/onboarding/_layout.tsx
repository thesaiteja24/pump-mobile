import { useThemeColor } from '@/hooks/theme'
import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  const colors = useThemeColor()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="demographics"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="metrics"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  )
}
