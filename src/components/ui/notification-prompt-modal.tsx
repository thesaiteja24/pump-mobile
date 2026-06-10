import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

interface NotificationPromptModalProps {
  onAccept: () => void | Promise<void>
  onDecline: () => void
}

function ModalActions({ onAccept, onDecline }: NotificationPromptModalProps) {
  const { spacing, layout } = useTheme()
  return (
    <View style={[layout.wFull, { gap: spacing.md }]}>
      <Button title="Enable" onPress={onAccept} variant="primary" style={{ width: '100%' }} />
      <Button title="Maybe Later" onPress={onDecline} variant="ghost" style={{ width: '100%' }} />
    </View>
  )
}

export function NotificationPromptModal({ onAccept, onDecline }: NotificationPromptModalProps) {
  const { colors, typography, layout, radius, spacing } = useTheme()

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={[layout.flex1, layout.center, { padding: spacing.xxl, backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <Pressable style={StyleSheet.absoluteFill} accessible={false} />

        <View
          style={[
            layout.wFull,
            layout.center,
            {
              maxWidth: 400,
              borderRadius: radius.xl,
              backgroundColor: colors.input,
              padding: spacing.lg,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 4,
            },
          ]}
        >
          <View
            style={[
              layout.center,
              {
                width: 64,
                height: 64,
                borderRadius: radius.xl,
                backgroundColor: colors.accent,
                marginBottom: spacing.xl,
              },
            ]}
          >
            <Text style={{ fontSize: 30 }}>🔔</Text>
          </View>

          <Text
            style={[
              typography.displaySm,
              {
                color: colors.text,
                marginBottom: spacing.sm,
                fontWeight: '700',
                letterSpacing: -0.3,
                textAlign: 'center',
              },
            ]}
          >
            Enable Notifications
          </Text>
          <Text
            style={[
              typography.caption,
              {
                color: colors.textSecondary,
                marginBottom: spacing.xxl,
                textAlign: 'center',
              },
            ]}
          >
            Get real-time updates and important alerts from the app. You can disable this anytime in settings.
          </Text>

          <ModalActions onAccept={onAccept} onDecline={onDecline} />
        </View>
      </View>
    </Modal>
  )
}
