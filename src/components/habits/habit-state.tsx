import { LucideCheckCircle } from 'lucide-react-native'
import { ActivityIndicator, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CustomText } from '@/components/ui/custom-text'
import { useTheme } from '@/hooks/use-theme'

interface HabitEmptyStateProps {
  onCreate?: () => void
}

interface HabitErrorStateProps {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}

export function HabitLoadingState() {
  const { colorModes, spacing } = useTheme()

  return (
    <View style={{ paddingVertical: 80, alignItems: 'center', gap: spacing.md }}>
      <ActivityIndicator color={colorModes.text.primary} size="large" />
      <CustomText variant="bodySm" color="muted">Loading habits...</CustomText>
    </View>
  )
}

/**
 * Habit empty state component.
 * @returns Habit empty state component.
 */
export function HabitEmptyState({ onCreate }: HabitEmptyStateProps) {
  const { colorModes, spacing, radius } = useTheme()

  return (
    <View style={{
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xl,
    }}
    >
      <View style={{ gap: spacing.sm, alignItems: 'center' }}>
        {/* check icon */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.full,
            backgroundColor: colorModes.surface.secondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LucideCheckCircle size={28} color={colorModes.text.secondary} />
        </View>
        {/* heading */}
        <CustomText variant="bodyStrong" align="center">No habits yet</CustomText>
        {/* description */}
        <CustomText variant="bodySm" color="secondary" align="center">
          Create your first habit to start tracking consistency.
        </CustomText>
      </View>
      {onCreate && <Button title="Create Habit" variant="primary" size="sm" onPress={onCreate} />}
    </View>
  )
}

export function HabitErrorState({
  title = 'Unable to load habits',
  message = 'Try again when your connection is stable.',
  actionLabel = 'Retry',
  onAction,
}: HabitErrorStateProps) {
  const { spacing } = useTheme()

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xxs }}>
        <CustomText variant="bodyStrong" color="danger">{title}</CustomText>
        <CustomText variant="bodySm" color="secondary">{message}</CustomText>
      </View>
      {onAction && <Button title={actionLabel} variant="outline" size="sm" onPress={onAction} />}
    </Card>
  )
}
