import { createMMKV } from 'react-native-mmkv'

import { ENV } from '@/config/env'

/**
 * We use the app scheme as the id so that in case we have multiple apps
 * running on the same device we don't mess up the storage.
 * MMKV instance for non-sensitive persisted data (e.g. theme preference).
 * Do NOT store auth tokens here — use expo-secure-store for sensitive data.
 */
// Fallback to 'pump-default' if the env var is somehow missing at runtime.
// env.ts validation should catch this first, but defense-in-depth for storage init.
const storage = createMMKV({
  id: ENV.EXPO_PUBLIC_APP_SCHEME || 'pump-default',
})

/**
 * Shared MMKV storage adapter compatible with:
 * - TanStack Query `createAsyncStoragePersister()`
 * - Direct key/value access via `adapter.getItem` / `adapter.setItem`
 */
export const mmkvStorageAdapter = {
  setItem: (key: string, value: string) => storage.set(key, value),
  getItem: (key: string): string | null => storage.getString(key) ?? null,
  removeItem: (key: string): void => { storage.remove(key) },
}
