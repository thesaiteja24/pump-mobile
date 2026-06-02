import * as Application from 'expo-application'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

import { analytics } from '@/lib/posthog'

// Hook to check for app updates against PostHog Feature Flags / Remote Config.
// The PostHog Feature Flag "app-update-config" should return an AppUpdateInfo JSON payload.
//
// How it works:
//  1. On mount, fetch the current app version using expo-application.
//  2. If PostHog is disabled (e.g. in dev), immediately resolve to no-update.
//  3. Listen to PostHog feature flags loaded events.
//  4. Retrieve the update payload, compare semver strings, and determine force/flexible/no-update.
//  5. Return the update severity so the parent can render AppUpdateModal.
import type { AppUpdateInfo, ParsedUpdateStatus } from '@/components/ui/app-update-modal'

// ─── Semver comparison ────────────────────────────────────────────────────────

function parseVersion(version: string): number[] {
  return version.split('.').map(n => Number.parseInt(n, 10) || 0)
}

/** Returns negative if a < b, 0 if equal, positive if a > b */
function compareVersions(a: string, b: string): number {
  const aParts = parseVersion(a)
  const bParts = parseVersion(b)
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0)
    if (diff !== 0)
      return diff
  }
  return 0
}

function getUpdateSeverity(
  currentVersion: string,
  info: AppUpdateInfo,
): ParsedUpdateStatus {
  const { minRequiredVersion, latestVersion, storeUrl, releaseNotes } = info

  const platformStoreUrl = typeof storeUrl === 'object' && storeUrl !== null
    ? (Platform.OS === 'ios' ? storeUrl.ios : storeUrl.android)
    : (storeUrl || '')

  if (compareVersions(currentVersion, minRequiredVersion) < 0) {
    return {
      severity: 'force',
      storeUrl: platformStoreUrl,
      releaseNotes: releaseNotes ?? 'A critical update is required to continue.',
      currentVersion,
      latestVersion,
    }
  }
  if (compareVersions(currentVersion, latestVersion) < 0) {
    return {
      severity: 'flexible',
      storeUrl: platformStoreUrl,
      releaseNotes: releaseNotes ?? 'A new update is available.',
      currentVersion,
      latestVersion,
    }
  }
  return {
    severity: null,
    storeUrl: '',
    releaseNotes: '',
    currentVersion,
    latestVersion,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Checks PostHog remote config for required and latest app versions.
 * Returns `null` while loading and an update status object once resolved.
 */
function performUpdateCheck(): ParsedUpdateStatus {
  const currentVersion = Application.nativeApplicationVersion ?? '0.0.0'
  try {
    const config = analytics.getFeatureFlagPayload('app-update-config') as AppUpdateInfo | undefined
    if (config) {
      return getUpdateSeverity(currentVersion, config)
    }
  }
  catch {
    // Fallback to default below
  }
  return {
    severity: null,
    storeUrl: '',
    releaseNotes: '',
    currentVersion,
    latestVersion: currentVersion,
  }
}

export function useAppUpdate(): ParsedUpdateStatus | null {
  const [status, setStatus] = useState<ParsedUpdateStatus | null>(null)

  useEffect(() => {
    let mounted = true

    function safeSetStatus(nextStatus: ParsedUpdateStatus) {
      Promise.resolve().then(() => {
        if (mounted) {
          setStatus(nextStatus)
        }
      })
    }

    if (analytics.isDisabled) {
      safeSetStatus(performUpdateCheck())
      return () => {
        mounted = false
      }
    }

    const unsubscribe = analytics.onFeatureFlags(() => {
      safeSetStatus(performUpdateCheck())
    })

    if (analytics.getFeatureFlags()) {
      safeSetStatus(performUpdateCheck())
    }

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  return status
}
