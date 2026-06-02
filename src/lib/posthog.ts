import PostHog from 'posthog-react-native'

import { ENV } from '@/config/env'
import { mmkvStorageAdapter } from '@/lib/storage'

/**
 * PostHog analytics client.
 * Null when EXPO_PUBLIC_POSTHOG_API_KEY is not set (e.g. in CI or forks).
 * Disabled in DEV mode so local sessions don't pollute production data.
 *
 * ⚠️  Storage: posthog-react-native v3 defaults to expo-file-system
 * (via readAsStringAsync/writeAsStringAsync), but Expo SDK 56 made those
 * legacy APIs throw instead of just warn. We supply our MMKV adapter so
 * PostHog never touches expo-file-system at all.
 */
export const posthogClient = ENV.EXPO_PUBLIC_POSTHOG_API_KEY
  ? new PostHog(
      ENV.EXPO_PUBLIC_POSTHOG_API_KEY,
      {
        host: ENV.EXPO_PUBLIC_POSTHOG_HOST,
        // Use MMKV for all PostHog persistence — avoids expo-file-system entirely
        customStorage: mmkvStorageAdapter,
        enableSessionReplay: true,
        // Automatically capture app lifecycle events:
        // Application Opened, Application Backgrounded, Application Installed,
        // Application Updated, Deep Link Opened
        captureNativeAppLifecycleEvents: true,
        // Disable in development so local usage stays out of production analytics
        disabled: __DEV__,
      },
    )
  : null

// PostHog React Native SDK serializes properties natively — no custom conversion needed.
type AnalyticsProperties = Record<string, unknown>

/**
 * Thin wrapper around posthogClient that safe-guards against null.
 * Import `analytics` everywhere instead of posthogClient directly.
 *
 * @example
 * analytics.capture('button_pressed', { screen: 'Home' })
 * analytics.identify(userId)
 */
export const analytics = {
  get isDisabled() {
    return !posthogClient || posthogClient.isDisabled
  },

  identify(userId: string) {
    posthogClient?.identify(userId)
  },

  reset() {
    posthogClient?.reset()
  },

  capture(event: string, properties?: AnalyticsProperties) {
    // eslint-disable-next-line ts/no-explicit-any
    posthogClient?.capture(event, properties as any)
  },

  setPersonProperties(properties: AnalyticsProperties) {
    // PostHog v3: set person properties via $set in a capture call
    // eslint-disable-next-line ts/no-explicit-any
    posthogClient?.capture('$set', { $set: properties as any })
  },

  getFeatureFlagPayload(key: string): unknown {
    return posthogClient?.getFeatureFlagPayload(key)
  },

  getFeatureFlags(): unknown {
    return posthogClient?.getFeatureFlags()
  },

  onFeatureFlags(callback: () => void): () => void {
    return posthogClient?.onFeatureFlags(callback) ?? (() => {})
  },
}
