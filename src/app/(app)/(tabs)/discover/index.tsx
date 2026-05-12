import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'

import CommentsModal, { CommentsModalHandle } from '@/components/modals/SocialCommentsModal'
import { SocialWorkoutCard } from '@/components/social/SocialWorkoutCard'
import { BaseListScreen, Button } from '@/components/ui'
import { DiscoverScreenShimmer } from '@/components/ui/shimmers/DiscoverScreenShimmer'
import { useExercises } from '@/hooks/queries/exercises'
import { useWorkoutListQuery } from '@/hooks/queries/workouts'
import { useThemeColor } from '@/hooks/theme'
import { queryKeys } from '@/lib/queryKeys'

export default function DiscoverScreen() {
  const router = useRouter()
  const colors = useThemeColor()

  // TanStack Query — infinite pagination with pending merge
  const {
    workouts,
    hasNextPage: discoverHasMore,
    isLoading: discoverLoading,
    isFetchingNextPage: discoverLoadingNextPage,
    fetchNextPage,
  } = useWorkoutListQuery()

  const qc = useQueryClient()

  const { data: exerciseList = [] } = useExercises()

  const [refreshing, setRefreshing] = useState(false)
  const commentsModalRef = useRef<CommentsModalHandle>(null)

  // ───────────────── Derived data ─────────────────
  const exerciseTypeMap = useMemo(() => {
    const map = new Map<string, any>()
    exerciseList.forEach((ex) => map.set(ex.id, ex.exerciseType))
    return map
  }, [exerciseList])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    // resetQueries will clear the cache and refetch ONLY the first page
    await qc.resetQueries({ queryKey: queryKeys.workouts.discover })
    setRefreshing(false)
  }, [qc])

  const onEndReached = useCallback(() => {
    if (!discoverLoading && discoverHasMore) {
      fetchNextPage()
    }
  }, [discoverLoading, discoverHasMore, fetchNextPage])

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <SocialWorkoutCard
        workout={item}
        exerciseTypeMap={exerciseTypeMap}
        index={index}
        onPressComments={(id: string) => {
          commentsModalRef.current?.present(id)
        }}
      />
    ),
    [exerciseTypeMap],
  )

  const isScreenLoading = refreshing || discoverLoading

  // ───────────────── Render ─────────────────
  return (
    <>
      <BaseListScreen
        title="Discover"
        isLoading={isScreenLoading}
        shimmer={<DiscoverScreenShimmer />}
        right={
          <Button
            title=""
            variant="ghost"
            className="p-0"
            onPress={() => {
              router.push('/(app)/profile/search')
            }}
            rightIcon={
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color={colors.isDark ? 'white' : 'black'}
              />
            }
          />
        }
        data={workouts}
        keyExtractor={(item: { id: string }) => item.id}
        renderItem={renderItem}
        isRefreshing={refreshing}
        onRefresh={onRefresh}
        hasNextPage={discoverHasMore}
        isFetchingNextPage={discoverLoadingNextPage}
        onEndReached={onEndReached}
        emptyText="It's quiet empty out here 🤧"
        endReachedText="You've conquered all the workouts here 🏆"
      />
      <CommentsModal ref={commentsModalRef} />
    </>
  )
}
