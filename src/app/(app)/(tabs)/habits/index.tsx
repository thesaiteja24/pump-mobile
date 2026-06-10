import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { LucidePlus, LucideSettings } from 'lucide-react-native'
import { View } from 'react-native'

import { queryKeys } from '@/api/query-keys'
import { HabitCard } from '@/components/habits/habit-card'
import { HabitEmptyState, HabitErrorState, HabitLoadingState } from '@/components/habits/habit-state'
import { BaseScreen } from '@/components/ui/base-screen'
import { CustomText } from '@/components/ui/custom-text'
import { Menu } from '@/components/ui/menu'
import { useTodayHabitsQuery } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'

export default function HabitsScreen() {
  const { colorModes, spacing } = useTheme()

  const { data: habits = [], isLoading, isError, isRefetching, refetch } = useTodayHabitsQuery()
  const queryClient = useQueryClient()
  const completedCount = habits.filter(habit => habit.completed).length

  const openCreateForm = () => router.push('/(app)/habits/create')
  const openEditForm = (habitId: string) => router.push(`/(app)/habits/edit/${habitId}`)
  const openHabit = (habitId: string) => router.push(`/(app)/(tabs)/habits/${habitId}`)
  const openInternalHabits = () => router.push('/(app)/habits/internal')

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.habits.all })
  }

  return (
    <BaseScreen
      title="Habits"
      scrollable
      onRefresh={handleRefresh}
      refreshing={isRefetching}
      headerRight={() => (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Menu onPressTrigger={openInternalHabits} roundedOutline>
            <LucideSettings size={20} color={colorModes.text.primary} />
          </Menu>
          <Menu onPressTrigger={openCreateForm} roundedOutline>
            <LucidePlus size={24} color={colorModes.text.primary} />
          </Menu>
        </View>
      )}
    >
      {!isLoading && !isError && habits.length > 0 && (
        <View>
          <CustomText variant="displayMd">Today</CustomText>
          <CustomText variant="bodySm" color="secondary">
            {habits.length > 0
              ? `${completedCount} of ${habits.length} habits complete`
              : 'Track the daily actions that move your fitness forward.'}
          </CustomText>
        </View>
      )}

      {/* Loading state */}
      {isLoading && <HabitLoadingState />}

      {/* Error state */}
      {isError && <HabitErrorState onAction={() => refetch()} />}

      {/* Empty state */}
      {!isLoading && !isError && habits.length === 0 && <HabitEmptyState onCreate={() => openCreateForm()} />}

      {/* Habit list */}
      {!isLoading && !isError && habits.length > 0 && habits.map(habit => (
        <HabitCard key={habit.id} habit={habit} onEdit={openEditForm} onOpen={openHabit} />
      ))}
    </BaseScreen>
  )
}
