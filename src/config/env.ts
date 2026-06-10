/**
 * Runtime environment configuration.
 *
 * IMPORTANT: In React Native, `process.env.EXPO_PUBLIC_*` values are inlined
 * at build time by the Metro bundler. They are NOT available dynamically at
 * runtime from the process environment. This is fine for build-time constants
 * (API keys, feature flags) but means you cannot change them post-build.
 *
 * APP_ENV is read from `Constants.expoConfig.extra.APP_ENV` (set in app.config.ts)
 * so it correctly reflects the EAS build profile (development / preview / production).
 */
import Constants from 'expo-constants'

// ─── Build-time inlined vars ─────────────────────────────────────────────────

const requiredEnv = {
  EXPO_PUBLIC_APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME,
} as const

const optionalEnv = {
  // Sentry error tracking
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  EXPO_PUBLIC_SENTRY_ORG: process.env.EXPO_PUBLIC_SENTRY_ORG,
  EXPO_PUBLIC_SENTRY_PROJECT: process.env.EXPO_PUBLIC_SENTRY_PROJECT,

  // PostHog product analytics
  EXPO_PUBLIC_POSTHOG_API_KEY: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
  EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST,

  // OneSignal push notifications
  EXPO_PUBLIC_ONESIGNAL_APP_ID: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,

  // Google OAuth2 — must match the GOOGLE_WEB_CLIENT_ID used by pump-fastify
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,

  // Infrastructure
  NODE_ENV: process.env.NODE_ENV,
  EXPO_PUBLIC_WEB_HOST: process.env.EXPO_PUBLIC_WEB_HOST,
} as const

// ─── Validation ───────────────────────────────────────────────────────────────

const missingRequiredKeys = Object.entries(requiredEnv)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingRequiredKeys.length > 0) {
  throw new Error(
    `[Env Validation Failed] The following environment variables are required but missing:\n${missingRequiredKeys
      .map(key => `  - ${key}`)
      .join('\n')}`,
  )
}

const missingOptionalKeys = Object.entries(optionalEnv)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingOptionalKeys.length > 0) {
  console.warn(
    `[Env Warning] The following optional environment variables are not set:\n${missingOptionalKeys
      .map(key => `  - ${key}`)
      .join('\n')}`,
  )
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const ENV = {
  ...requiredEnv,
  ...optionalEnv,
} as {
  [K in keyof typeof requiredEnv]: string
} & typeof optionalEnv

/**
 * Current app environment — resolved from Expo config extra at runtime.
 * Reflects the EAS build profile: 'development' | 'preview' | 'production'.
 */
export const APP_ENV: string
  = (Constants.expoConfig?.extra?.APP_ENV as string | undefined) ?? 'development'

export const IS_PROD = APP_ENV === 'production'
export const IS_DEV = APP_ENV === 'development'

/**
 * Computed integration flags — true when the required keys are present.
 * Use these in code to guard integration-specific calls:
 *
 * @example
 * if (INTEGRATIONS.sentry) { Sentry.captureException(err) }
 */
export const INTEGRATIONS = {
  sentry: Boolean(ENV.EXPO_PUBLIC_SENTRY_DSN),
  posthog: Boolean(ENV.EXPO_PUBLIC_POSTHOG_API_KEY),
  onesignal: Boolean(ENV.EXPO_PUBLIC_ONESIGNAL_APP_ID),
  googleAuth: Boolean(ENV.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
} as const
