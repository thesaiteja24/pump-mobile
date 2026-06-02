import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { PostHogProvider } from 'posthog-react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { posthogClient } from '@/lib/posthog'
import { mmkvPersister, queryClient } from '@/lib/query-client'
import { ThemeProvider } from '@/providers/theme-provider'

import type { PropsWithChildren, ReactElement } from 'react'

const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24

/**
 * Core provider stack (always rendered):
 *   PersistQueryClientProvider → GestureHandlerRootView → SafeAreaProvider → ThemeProvider
 *
 * PostHogProvider wraps the entire stack when the client is available so that
 * usePostHog() and automatic screen tracking work from any descendant component.
 *
 * Phase-by-phase growth:
 *   Phase 2: ThemeProvider + SafeArea + GestureHandler
 *   Phase 3: PersistQueryClientProvider (MMKV cache, 24h TTL)
 *   Phase 6: PostHogProvider (conditional, null-safe)
 */
function CoreProviders({ children }: PropsWithChildren): ReactElement {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: mmkvPersister,
        maxAge: TWENTY_FOUR_HOURS,
        buster: 'v1',
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  )
}

export function AppProviders({ children }: PropsWithChildren): ReactElement {
  const app = <CoreProviders>{children}</CoreProviders>

  if (!posthogClient) {
    return app
  }

  return <PostHogProvider client={posthogClient}>{app}</PostHogProvider>
}
