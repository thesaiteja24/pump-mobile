import * as Sentry from '@sentry/react-native'

import { ENV } from '@/config/env'

/**
 * Filter helper: suppress 401 errors from Sentry since they are expected
 * (session expired, token revoked) and not actionable by engineering.
 */
function isUnauthorized(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }
  const err = error as Record<string, unknown>
  const msg = String(err.message || '')
  if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
    return true
  }
  if (err.status === 401 || err.statusCode === 401) {
    return true
  }
  const res = err.response as Record<string, unknown> | undefined
  return !!res && res.status === 401
}

if (ENV.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: ENV.EXPO_PUBLIC_SENTRY_DSN,
    debug: false,
    // Only capture in production builds — prevents cluttering Sentry with
    // intentional test errors thrown during development.
    enabled: !__DEV__,
    tracesSampleRate: 0.1,
    beforeSend(event, hint) {
      if (isUnauthorized(hint.originalException)) {
        return null
      }
      return event
    },
  })
}

export { Sentry }
