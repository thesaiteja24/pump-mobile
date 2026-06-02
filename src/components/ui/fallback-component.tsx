import * as Updates from 'expo-updates'
import { useState } from 'react'
import { Platform, Pressable, ScrollView, Text, View } from 'react-native'

import { BaseScreen } from '@/components/ui/base-screen'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

// Sub-components

interface ErrorDetailsHeaderProps {
  showDetails: boolean
  onToggle: () => void
}

function ErrorDetailsHeader({ showDetails, onToggle }: ErrorDetailsHeaderProps) {
  const { colors, typography, layout, spacing } = useTheme()
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        layout.rowBetween,
        layout.wFull,
        {
          paddingVertical: spacing.md,
          borderTopWidth: 0.5,
          borderBottomWidth: 0.5,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[typography.bodySmStrong, { color: colors.accent }]}>
        {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
      </Text>
      <Text style={[{ fontSize: 10, color: colors.accent }]}>
        {showDetails ? '▲' : '▼'}
      </Text>
    </Pressable>
  )
}

interface RecoveryActionsProps {
  onReload: () => void
  onRestart: () => void
}

function RecoveryActions({ onReload, onRestart }: RecoveryActionsProps) {
  const { layout, spacing } = useTheme()
  return (
    <View style={[layout.wFull, { gap: spacing.sm, marginTop: spacing.sm }]}>
      <Button title="Reload Screen" variant="primary" size="sm" onPress={onReload} />
      <Button title="Restart App" variant="outline" size="sm" onPress={onRestart} />
    </View>
  )
}

interface ErrorDetailsProps {
  message: string
  stack: string
}

function ErrorDetails({ message, stack }: ErrorDetailsProps) {
  const { colors, typography, layout, spacing, radius } = useTheme()
  const [showDetails, setShowDetails] = useState(false)

  if (!__DEV__) {
    return null
  }

  return (
    <>
      <ErrorDetailsHeader showDetails={showDetails} onToggle={() => setShowDetails(prev => !prev)} />

      {showDetails && (
        <View
          style={[
            layout.wFull,
            {
              borderRadius: radius.md,
              marginBottom: spacing.lg,
              borderWidth: 1,
              backgroundColor: colors.input,
              borderColor: colors.border,
            },
          ]}
        >
          <ScrollView
            style={{ maxHeight: 200, width: '100%' }}
            contentContainerStyle={{ padding: spacing.md }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <Text
              selectable
              style={[
                { fontSize: 11, lineHeight: 16 },
                { color: colors.text },
                { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
              ]}
            >
              {`${message}\n\nStack Trace:\n${stack}`}
            </Text>
          </ScrollView>
          <Text
            style={[
              typography.caption,
              {
                color: colors.textSecondary,
                alignSelf: 'flex-end',
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.sm,
              },
            ]}
          >
            Long press to select and copy
          </Text>
        </View>
      )}
    </>
  )
}

// Main Component

interface FallbackComponentProps {
  error: unknown
  resetError: () => void
}

export function FallbackComponent({ error, resetError }: FallbackComponentProps) {
  const { colors, typography, layout, spacing, radius } = useTheme()
  const message = error instanceof Error ? error.message : String(error)
  const stack = (error instanceof Error && error.stack) ? error.stack : 'No stack trace available.'

  function handleReload() {
    Updates.reloadAsync().catch(() => {})
  }

  return (
    <BaseScreen
      style={{ backgroundColor: colors.background }}
      contentStyle={[layout.flex1, layout.center, { padding: spacing.xl }]}
    >
      <View
        style={[
          layout.wFull,
          layout.center,
          {
            borderRadius: radius.xl,
            backgroundColor: colors.card,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            layout.center,
            { width: 64, height: 64, borderRadius: 32, marginBottom: 20, backgroundColor: `${colors.danger}15` },
          ]}
        >
          <Text style={{ fontSize: 32 }}>💥</Text>
        </View>

        <Text style={[typography.displaySm, { color: colors.text, textAlign: 'center', marginBottom: 10 }]}>
          Rare achievement unlocked: Runtime Explorer 😅
        </Text>

        <Text style={[typography.bodySm, { color: colors.textSecondary, textAlign: 'justify', marginBottom: 24, lineHeight: 22 }]}>
          The issue has been
          {' '}
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: `${colors.success}15`,
              transform: [{ translateY: 2 }],
            }}
          >
            <Text style={[typography.bodySmStrong, { color: colors.success, lineHeight: 16 }]}>
              auto-reported
            </Text>
          </View>
          {' '}
          and our development team is working on a fix.
        </Text>

        <ErrorDetails message={message} stack={stack} />

        <RecoveryActions onReload={resetError} onRestart={handleReload} />
      </View>
    </BaseScreen>
  )
}
