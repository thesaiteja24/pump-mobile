import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { HabitForm } from '@/components/habits/habit-form'
import { BaseScreen } from '@/components/ui/base-screen'
import { Menu } from '@/components/ui/menu'
import { useCreateHabitMutation } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

import type { HabitCreateInput } from '@/types/habit'

export default function CreateHabitScreen() {
  const { colorModes } = useTheme()
  const createHabit = useCreateHabitMutation()

  const submit = (payload: HabitCreateInput) => {
    createHabit.mutate(payload, {
      onSuccess: () => {
        Arise.success({ heading: 'Habit created', sound: true })
        router.back()
      },
      onError: () => Arise.error({ heading: 'Unable to create habit', sound: true }),
    })
  }

  return (
    <BaseScreen
      title="Create Habit"
      scrollable
      headerLeft={() => (
        <Menu onPressTrigger={() => router.back()} roundedOutline>
          <Ionicons name="chevron-back" size={24} color={colorModes.text.primary} />
        </Menu>
      )}
    >
      <HabitForm
        submitLabel="Create"
        isPending={createHabit.isPending}
        onCancel={() => router.back()}
        onSubmit={submit}
      />
    </BaseScreen>
  )
}
