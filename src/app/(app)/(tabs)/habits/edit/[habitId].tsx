import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'

import { HabitForm } from '@/components/habits/habit-form'
import { HabitErrorState, HabitLoadingState } from '@/components/habits/habit-state'
import { BaseScreen } from '@/components/ui/base-screen'
import { Menu } from '@/components/ui/menu'
import { useHabitQuery, useUpdateHabitMutation } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

import type { HabitCreateInput } from '@/types/habit'

export default function EditHabitScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>()
  const { colorModes } = useTheme()
  const habitQuery = useHabitQuery(habitId)
  const updateHabit = useUpdateHabitMutation()
  const habit = habitQuery.data

  const submit = (payload: HabitCreateInput) => {
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
  }

  return (
    <BaseScreen
      title="Edit Habit"
      scrollable
      headerLeft={() => (
        <Menu onPressTrigger={() => router.back()} roundedOutline>
          <Ionicons name="chevron-back" size={24} color={colorModes.text.primary} />
        </Menu>
      )}
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
          submitLabel="Save"
          isPending={updateHabit.isPending}
          onCancel={() => router.back()}
          onSubmit={submit}
        />
      )}
    </BaseScreen>
  )
}
