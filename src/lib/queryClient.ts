/**
 * QueryClient singleton
 *
 * A single QueryClient instance shared across the whole app.
 * Exported directly so non-React code (e.g. Zustand stores, reconcilers)
 * can call queryClient.invalidateQueries() or queryClient.getQueryData()
 * without needing to be inside a React component.
 *
 * Persistence: uses the existing MMKV `storage` instance via
 * @tanstack/query-async-storage-persister so the cache survives app restarts
 * (similar to what the old Zustand `persist` middleware did, but handled
 * centrally and with proper TTL / versioning).
 */

import { storage } from '@/lib/storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'

// ─────────────────────────────────────────────────────────────────
// 1. The QueryClient
// ─────────────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 4xx — those are user/auth errors, not transient failures.
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false
        return failureCount < 2
      },
      // After 5 min background the data is considered stale and will refetch on focus.
      // Individual queries can override this with their own staleTime.
      staleTime: 5 * 60 * 1000, // 5 minutes default
    },
    mutations: {
      retry: false,
    },
  },
})

// ─────────────────────────────────────────────────────────────────
// 2. MMKV-backed AsyncStorage adapter
// Wraps the synchronous MMKV API in the async interface that
// @tanstack/query-async-storage-persister expects.
// ─────────────────────────────────────────────────────────────────

const mmkvAsyncAdapter = {
  getItem: (key: string) => Promise.resolve(storage.getString(key) ?? null),
  setItem: (key: string, value: string) => {
    storage.set(key, value)
    return Promise.resolve()
  },
  removeItem: (key: string) => {
    storage.remove(key)
    return Promise.resolve()
  },
}

// ─────────────────────────────────────────────────────────────────
// 3. Wire up persistence
// The cache is keyed by `buster` — bump this string whenever you
// make a breaking change to query data shapes so old cached data
// is automatically discarded on app update.
// ─────────────────────────────────────────────────────────────────

const persister = createAsyncStoragePersister({
  storage: mmkvAsyncAdapter,
  key: 'tanstack-query-cache',
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60 * 1000, // discard cache entries older than 24 h
  buster: 'v1', // bump when data shapes change
})
