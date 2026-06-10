import { Stack } from 'expo-router'

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="habits/create" />
      <Stack.Screen name="habits/edit/[habitId]" />
    </Stack>
  )
}
