import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native'

import CommentsModal, { CommentsModalHandle } from '@/components/modals/SocialCommentsModal'
import { SocialWorkoutCard } from '@/components/social/SocialWorkoutCard'
import { Button } from '@/components/ui'
import BaseScreen from '@/components/ui/BaseScreen'
import { ShimmerDiscoverScreen } from '@/components/ui/shimmers/ShimmerDiscoverScreen'
import { useExercises } from '@/hooks/queries/exercises'
import { useWorkoutsQuery } from '@/hooks/queries/workouts'
import { useThemeColor } from '@/hooks/theme'
import { queryKeys } from '@/lib/queryKeys'

export default function DiscoverScreen() {
  const router = useRouter()
  const colors = useThemeColor()

  // TanStack Query — infinite pagination with pending merge
  const {
    workouts,
    hasMore: discoverHasMore,
    isLoading: discoverLoading,
    isFetchingNextPage: discoverLoadingNextPage,
    fetchNextPage,
  } = useWorkoutsQuery()

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
    <BaseScreen
      title="Discover"
      isLoading={isScreenLoading}
      shimmer={<ShimmerDiscoverScreen />}
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
    >
      <FlashList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          discoverHasMore ? (
            <View className="mb-[100%] items-center justify-center p-4 pb-12 pt-6">
              {discoverLoadingNextPage && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
          ) : (
            <View className="mb-[100%] items-center justify-center p-4 pb-12 pt-6">
              <Text className="text-neutral-500 dark:text-neutral-400">
                You&apos;ve conquered all the workouts here 🏆
              </Text>
            </View>
          )
        }
      />

      <CommentsModal ref={commentsModalRef} />
    </BaseScreen>
  )
}
