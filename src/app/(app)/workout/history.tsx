import { useCallback, useMemo, useState } from 'react'

import { SocialWorkoutCard } from '@/components/social/SocialWorkoutCard'
import { BaseListScreen } from '@/components/ui'
import { WorkoutHistoryShimmer } from '@/components/ui/shimmers/WorkoutHistoryShimmer'
import { useExercises } from '@/hooks/queries/exercises'
import { useWorkoutHistoryQuery } from '@/hooks/queries/workouts'
import { ExerciseType } from '@/types/exercises'
import { WorkoutHistoryItem } from '@/types/workouts'

const History = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    workoutHistory,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchHistory,
  } = useWorkoutHistoryQuery()

  const { data: exerciseList = [] } = useExercises()

  const exerciseTypeMap = useMemo(() => {
    const map = new Map<string, ExerciseType>()
    exerciseList.forEach((ex) => map.set(ex.id, ex.exerciseType))
    return map
  }, [exerciseList])

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refetchHistory()
    setIsRefreshing(false)
  }, [refetchHistory])

  return (
    <BaseListScreen<WorkoutHistoryItem>
      title="Workout History"
      backButton
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      shimmer={<WorkoutHistoryShimmer />}
      data={workoutHistory}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <SocialWorkoutCard workout={item} exerciseTypeMap={exerciseTypeMap} index={index} />
      )}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onEndReached={fetchNextPage}
      emptyText="It's quiet empty out here 🤧"
      endReachedText="You've conquered all the workouts here 🏆"
      estimatedItemSize={150}
    />
  )
}

export default History
