/**
 * TanStack Query client + MMKV-backed persistence layer.
 *
 * Cache survival guarantee:
 * - gcTime: 24 hours — prevents React Query from garbage-collecting unused
 *   queries before MMKV can re-hydrate them on the next app launch.
 * - PersistQueryClientProvider (in app-providers.tsx) reads MMKV on every
 *   mount and restores the full query cache before the first render.
 * - maxAge: 24 hours — entries older than this are discarded on restore so
 *   users never see stale data more than one day old.
 *
 * Retry policy:
 * - 4xx client errors are never retried (they are deterministic failures).
 * - All other errors (network, 5xx) are retried up to 2 times with
 *   exponential back-off provided by React Query's default retry delay.
 */
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'

import { mmkvStorageAdapter } from '@/lib/storage'

const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24
const FIVE_MINUTES = 1000 * 60 * 5

// ─── QueryClient ──────────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * gcTime MUST be >= maxAge of the persister so that queries are still
       * in-memory when the persister tries to restore them after a restart.
       */
      gcTime: TWENTY_FOUR_HOURS,
      /**
       * staleTime: data is considered fresh for 5 minutes.
       * A component mounting within this window won't trigger a background re-fetch.
       */
      staleTime: FIVE_MINUTES,
      /**
       * Never retry 4xx errors — they are client mistakes and retrying won't help.
       * Retry everything else (network, 5xx) up to 2 times.
       */
      retry: (failureCount, error) => {
        const httpStatus = (error as { status?: number, response?: { status?: number } })?.status
          ?? (error as { response?: { status?: number } })?.response?.status
        if (httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      /**
       * Never retry mutations automatically — callers decide retry strategy.
       */
      retry: false,
    },
  },
})

// ─── MMKV Persister ───────────────────────────────────────────────────────────
// Wraps mmkvStorageAdapter with the async interface TanStack Query expects.
// MMKV is synchronous under the hood — the Promise wrapper has no meaningful
// overhead and avoids the need for a bridge thread.

export const mmkvPersister = createAsyncStoragePersister({
  storage: {
    setItem: (key, value) => Promise.resolve(mmkvStorageAdapter.setItem(key, value)),
    getItem: key => Promise.resolve(mmkvStorageAdapter.getItem(key)),
    removeItem: key => Promise.resolve(mmkvStorageAdapter.removeItem(key)),
  },
  /**
   * Throttle MMKV writes to at most once per second.
   * Without throttling, every query update writes to disk immediately
   * which can cause unnecessary I/O during rapid state updates.
   */
  throttleTime: 1000,
})
