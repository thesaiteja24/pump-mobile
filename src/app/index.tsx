/**
 * index.tsx — Entry redirect gate
 *
 * Reads auth state synchronously from the Zustand store (hydrated from MMKV)
 * and immediately redirects with no visible UI:
 *   - Authenticated  → /(app)/(tabs)/home
 *   - Not authenticated → /(auth)/login
 */
import { Redirect } from 'expo-router'

import { useAuthStore } from '@/stores/auth-store'

export default function Index() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/home" />
  }

  return <Redirect href="/(auth)/login" />
}
