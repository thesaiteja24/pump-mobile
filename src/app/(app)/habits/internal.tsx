import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { LucideChevronLeft } from 'lucide-react-native'
import React, { useState } from 'react'
import { Switch, View } from 'react-native'

import { BaseScreen } from '@/components/ui/base-screen'
import { Card } from '@/components/ui/card'
import { CustomText } from '@/components/ui/custom-text'
import { Menu } from '@/components/ui/menu'
import { useInternalHabitsQuery, useToggleInternalHabitMutation } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

export default function InternalHabitsScreen() {
  const { colorModes, spacing } = useTheme()
  const { data: habits = [], isLoading, isError, refetch } = useInternalHabitsQuery()
  const toggleMutation = useToggleInternalHabitMutation()
  const [isRefreshingByUser, setIsRefreshingByUser] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshingByUser(true)
    try {
      await refetch()
    }
    finally {
      setIsRefreshingByUser(false)
    }
  }

  const handleToggle = (metric: string, isActive: boolean) => {
    toggleMutation.mutate(
      { metric, isActive },
      {
        onError: () => Arise.error({ heading: 'Unable to update internal habit', sound: true }),
      },
    )
  }

  return (
    <BaseScreen
      headerLeft={() => (
        <Menu onPressTrigger={() => router.back()} roundedOutline>
          <LucideChevronLeft size={24} color={colorModes.text.primary} />
        </Menu>
      )}
      title="Internal Habits"
      scrollable
      onRefresh={handleRefresh}
      refreshing={isRefreshingByUser}
    >
      <View style={{ gap: spacing.lg }}>
        <CustomText variant="bodySm" color="secondary">
          Pump can automatically track internal metrics as habits. Turn them on to see them in your daily dashboard.
        </CustomText>

        {isLoading && <CustomText variant="bodySm" color="muted">Loading internal habits...</CustomText>}
        {isError && <CustomText variant="bodySm" color="danger">Failed to load internal habits.</CustomText>}

        {!isLoading && !isError && habits.map((habit) => {
          return (
            <Card key={habit.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: spacing.md, gap: spacing.xxs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <CustomText variant="bodyStrong">{habit.title}</CustomText>
                </View>
                {habit.description && (
                  <CustomText variant="caption" color="secondary">{habit.description}</CustomText>
                )}
              </View>
              <Switch
                value={habit.isActive}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                  if (habit.internalMetric) {
                    handleToggle(habit.internalMetric, val)
                  }
                }}
                trackColor={{ false: colorModes.surface.secondary, true: colorModes.background.inverse }}
                thumbColor="#FFFFFF"
                disabled={toggleMutation.isPending}
              />
            </Card>
          )
        })}
      </View>
    </BaseScreen>
  )
}
