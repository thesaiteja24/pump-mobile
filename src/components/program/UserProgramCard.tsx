import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Link, router } from 'expo-router'
import { Text, View } from 'react-native'

import { BaseCard, Button, CardBadgeProps } from '@/components/ui'
import { UserProgram } from '@/types/programs'

export function UserProgramCard({ program }: { program: UserProgram }) {
  const totalDays = program.durationWeeks * 7
  const completedDays = program.progress.currentWeek * 7 + program.progress.currentDay
  const progressPercent = Math.round(Math.min(100, Math.max(0, (completedDays / totalDays) * 100)))

  const isActive = program.status === 'active'

  const handleStart = () => {
    router.push(`/(app)/user-program/${program.id}`)
  }

  const getStatusColor = () => {
    switch (program.status) {
      case 'active':
        return 'info'
      case 'completed':
        return 'success'
      case 'paused':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const statusColor = getStatusColor()

  return (
    <Link
      href={`/(app)/user-program/${program.id}`}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      asChild
    >
      <BaseCard className={isActive ? 'h-48' : ''}>
        <BaseCard.Header
          title={program.program.title}
          subtitle={`Week ${program.progress.currentWeek + 1} of ${program.durationWeeks} • Day ${
            program.progress.currentDay + 1
          }`}
          right={
            <BaseCard.Badge
              label={`${progressPercent}%`}
              variant={statusColor as CardBadgeProps['variant']}
            />
          }
        />

        <BaseCard.Progress progress={progressPercent} color={statusColor} className="mb-4" />

        {isActive && (
          <BaseCard.Footer className="mt-auto border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Next Up
              </Text>
              <Text
                className={`mt-1 text-base font-semibold ${
                  program.progress.isRestDay
                    ? 'font-bold text-emerald-500'
                    : 'text-black dark:text-white'
                }`}
              >
                {program.progress.isRestDay
                  ? 'Rest Day'
                  : program.progress.workoutTitle || 'Next Workout'}
              </Text>
            </View>

            <Button
              title=""
              onPress={(e) => {
                e.preventDefault()
                handleStart()
              }}
              rightIcon={<MaterialCommunityIcons name="chevron-right" size={24} color="white" />}
              variant="primary"
              className="rounded-full"
            />
          </BaseCard.Footer>
        )}
      </BaseCard>
    </Link>
  )
}
export default UserProgramCard
