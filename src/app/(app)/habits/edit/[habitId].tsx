import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useRef } from 'react'
import { View } from 'react-native'

import { HabitForm } from '@/components/habits/habit-form'
import { HabitErrorState, HabitLoadingState } from '@/components/habits/habit-state'
import { BaseScreen } from '@/components/ui/base-screen'
import { Button } from '@/components/ui/button'
import { Menu } from '@/components/ui/menu'
import { useHabitQuery, useUpdateHabitMutation } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

import type { HabitCreateInput } from '@/types/habit'

export default function EditHabitScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>()
  const { colorModes, spacing } = useTheme()
  const habitQuery = useHabitQuery(habitId)
  const updateHabit = useUpdateHabitMutation()
  const habit = habitQuery.data
  const submitRef = useRef<() => void>(() => {})

  const submit = useCallback((payload: HabitCreateInput) => {
    updateHabit.mutate(
      { habitId, data: { ...payload, startDate: undefined } },
      {
        onSuccess: () => {
          Arise.success({ heading: 'Habit updated', sound: true })
          router.back()
        },
        onError: () => Arise.error({ heading: 'Unable to update habit', sound: true }),
      },
    )
  }, [habitId, updateHabit])

  return (
    <BaseScreen
      title="Edit Habit"
      scrollable
      headerLeft={() => (
        <Menu onPressTrigger={() => router.back()} roundedOutline>
          <Ionicons name="chevron-back" size={24} color={colorModes.text.primary} />
        </Menu>
      )}
      footer={habit
        ? (
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Button title="Cancel" variant="outline" onPress={() => router.back()} style={{ flex: 1 }} />
              <Button title="Save" loading={updateHabit.isPending} onPress={() => submitRef.current()} style={{ flex: 1 }} />
            </View>
          )
        : null}
    >
      {habitQuery.isLoading && <HabitLoadingState />}
      {habitQuery.isError && (
        <HabitErrorState
          title="Unable to load habit"
          message="Go back or try loading this habit again."
          onAction={() => habitQuery.refetch()}
        />
      )}
      {habit && (
        <HabitForm
          habit={habit}
          submitRef={submitRef}
          onSubmit={submit}
        />
      )}
    </BaseScreen>
  )
}
