import React, { memo, useEffect, useState } from 'react'
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'
import { mmkvStorageAdapter } from '@/lib/storage'
import { useAuthStore } from '@/stores/auth-store'

// App update check type definitions
export type UpdateSeverity = 'force' | 'flexible'

export interface AppUpdateInfo {
  /** Minimum version required to use the app. If current < this, force update. */
  minRequiredVersion: string
  /** Latest available version. If current < this, suggest optional update. */
  latestVersion: string
  /** Platform-specific store URLs */
  storeUrl: {
    ios: string
    android: string
  }
  /** Changelog message shown in the modal */
  releaseNotes?: string
}

export interface ParsedUpdateStatus {
  severity: UpdateSeverity | null
  storeUrl: string
  releaseNotes: string
  currentVersion?: string
  latestVersion?: string
}

interface AppUpdateModalProps {
  update: ParsedUpdateStatus
}

const LAST_SHOWN_KEY = 'app_update_last_shown_date'
const DELAY_MS = 30000 // 30 seconds

const TEXTS = {
  force: {
    title: 'Update Required',
    subtitle: 'This version is no longer supported. Please update to continue.',
  },
  flexible: {
    title: 'Update Available',
    subtitle: 'A new version is available with improvements and bug fixes.',
  },
}

const VersionInfoRow = memo(({ update }: { update: ParsedUpdateStatus }) => {
  const { colors, spacing, typography, layout, radius } = useTheme()
  if (!update.currentVersion && !update.latestVersion)
    return null

  const currentText = `v${update.currentVersion ?? '0.0.0'}`
  const latestText = `v${update.latestVersion ?? '0.0.0'}`

  return (
    <View style={[layout.rowAlign, { marginBottom: spacing.lg, gap: spacing.sm, justifyContent: 'center' }]}>
      <View style={{ borderRadius: radius.lg, backgroundColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderWidth: 1, borderColor: colors.border }}>
        <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>{currentText}</Text>
      </View>
      <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '600' }]}>is now</Text>
      <View style={{ borderRadius: radius.lg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, backgroundColor: `${colors.accent}15`, borderWidth: 1, borderColor: `${colors.accent}30` }}>
        <Text style={[typography.caption, { color: colors.accent, fontWeight: '700' }]}>{latestText}</Text>
      </View>
    </View>
  )
})
VersionInfoRow.displayName = 'VersionInfoRow'

const ReleaseNotes = memo(({ notes }: { notes: string }) => {
  const { typography, colors, spacing, radius } = useTheme()

  return (
    <View style={{ borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, marginBottom: spacing.lg, overflow: 'hidden' }}>
      <View style={{ borderBottomWidth: 0.5, borderColor: colors.border, padding: spacing.md }}>
        <Text style={[typography.bodySmStrong, { color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }]}>What's new</Text>
      </View>
      <ScrollView style={{ maxHeight: 180 }} contentContainerStyle={{ padding: spacing.md }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        <Text style={[typography.caption, { color: colors.text, lineHeight: 20 }]}>{notes}</Text>
      </ScrollView>
    </View>
  )
})
ReleaseNotes.displayName = 'ReleaseNotes'

const UpdateCard = memo(({
  update,
  config,
  isForce,
  onUpdate,
  onDismiss,
}: {
  update: ParsedUpdateStatus
  config: typeof TEXTS.force
  isForce: boolean
  onUpdate: () => void
  onDismiss: () => void
}) => {
  const { colors, typography, layout, spacing, radius } = useTheme()

  return (
    <View
      style={{
        width: '100%',
        borderRadius: radius.xl,
        backgroundColor: colors.card,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      <View style={[layout.center, layout.selfCenter, { width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.accent}15`, marginBottom: spacing.lg }]}>
        <Text style={{ fontSize: 32 }}>🚀</Text>
      </View>
      <Text style={[typography.displaySm, { color: colors.text, marginBottom: spacing.sm, textAlign: 'center' }]}>{config.title}</Text>
      <Text style={[typography.bodySm, { color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center' }]}>{config.subtitle}</Text>
      <VersionInfoRow update={update} />
      {update.releaseNotes && <ReleaseNotes notes={update.releaseNotes} />}
      <View style={{ width: '100%', gap: spacing.sm, marginTop: spacing.sm }}>
        <Button title="Update Now" onPress={onUpdate} variant="primary" size="sm" />
        {!isForce && <Button title="Maybe Later" onPress={onDismiss} variant="outline" size="sm" />}
      </View>
    </View>
  )
})
UpdateCard.displayName = 'UpdateCard'

export function AppUpdateModal({ update }: AppUpdateModalProps) {
  const { layout, spacing } = useTheme()
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const [dismissed, setDismissed] = useState(false)
  const isForce = update.severity === 'force'

  const [hasBeenShownToday] = useState(() => {
    if (isForce)
      return false
    return mmkvStorageAdapter.getItem(LAST_SHOWN_KEY) === new Date().toDateString()
  })

  useEffect(() => {
    if (!isAuthenticated || !update.severity || dismissed || isForce || hasBeenShownToday)
      return

    const timer = setTimeout(() => {
      mmkvStorageAdapter.setItem(LAST_SHOWN_KEY, new Date().toDateString())
    }, DELAY_MS)

    return () => clearTimeout(timer)
  }, [isAuthenticated, update.severity, dismissed, isForce, hasBeenShownToday])

  if (!isAuthenticated || !update.severity || dismissed || hasBeenShownToday)
    return null

  const config = isForce ? TEXTS.force : TEXTS.flexible
  const handleDismiss = () => setDismissed(true)
  const handleUpdate = () => {
    if (update.storeUrl) {
      Linking.openURL(update.storeUrl).catch(() => {})
    }
  }

  return (
    <Modal
      visible={!dismissed}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!isForce)
          handleDismiss()
      }}
    >
      <View style={[layout.flex1, layout.center, { padding: spacing.xl, backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        {!isForce && <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={handleDismiss} />}
        <View style={layout.wFull}>
          <UpdateCard update={update} config={config} isForce={isForce} onUpdate={handleUpdate} onDismiss={handleDismiss} />
        </View>
      </View>
    </Modal>
  )
}
