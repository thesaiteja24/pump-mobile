import { Stack } from 'expo-router'

/**
 * Auth group layout — unauthenticated screens (login, onboarding, etc.)
 * No header, fade transition — keeps the auth flow feeling clean.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  )
}
