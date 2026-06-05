import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useCallback, useRef } from 'react'
import { View } from 'react-native'

import { HabitForm } from '@/components/habits/habit-form'
import { BaseScreen } from '@/components/ui/base-screen'
import { Button } from '@/components/ui/button'
import { Menu } from '@/components/ui/menu'
import { useCreateHabitMutation } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

import type { HabitCreateInput } from '@/types/habit'

export default function CreateHabitScreen() {
  const { colorModes, spacing } = useTheme()
  const createHabit = useCreateHabitMutation()
  const submitRef = useRef<() => void>(() => {})

  const submit = useCallback((payload: HabitCreateInput) => {
    createHabit.mutate(payload, {
      onSuccess: () => {
        Arise.success({ heading: 'Habit created', sound: true })
        router.back()
      },
      onError: () => Arise.error({ heading: 'Unable to create habit', sound: true }),
    })
  }, [createHabit])

  return (
    <BaseScreen
      title="Create Habit"
      scrollable
      hasTabBar={false}
      headerLeft={() => (
        <Menu onPressTrigger={() => router.back()} roundedOutline>
          <Ionicons name="chevron-back" size={24} color={colorModes.text.primary} />
        </Menu>
      )}
      footer={(
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button title="Cancel" variant="outline" onPress={() => router.back()} style={{ flex: 1 }} />
          <Button title="Create" loading={createHabit.isPending} onPress={() => submitRef.current()} style={{ flex: 1 }} />
        </View>
      )}
    >
      <HabitForm
        submitRef={submitRef}
        onSubmit={submit}
      />
    </BaseScreen>
  )
}
