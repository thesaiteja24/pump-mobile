import { Ionicons } from '@expo/vector-icons'
import { FlashListProps } from '@shopify/flash-list'
import { isThisWeek } from 'date-fns'
import { router, useLocalSearchParams } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { useCallback, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import { BaseModalHandle, NudgeModal } from '@/components/modals'
import { SocialWorkoutCard } from '@/components/social/SocialWorkoutCard'
import { BaseListScreen, Button, SectionHeader } from '@/components/ui'
import { ProfileScreenShimmer } from '@/components/ui/shimmers'
import { TopLifts, UserHeader } from '@/components/user'
import { UserTrainingActivity } from '@/components/user/UserTrainingActivity'
import { useFollowUserMutation, useUnfollowUserMutation } from '@/hooks/queries/engagement'
import { useExercises } from '@/hooks/queries/exercises'
import {
  useNudgeMutation,
  usePublicUserQuery,
  useUserTopLiftsQuery,
  useUserTrainingAnalyticsQuery,
} from '@/hooks/queries/usePublicUser'
import { useWorkoutListQuery } from '@/hooks/queries/workouts'
import { useShare } from '@/hooks/useShare'
import { Arise } from '@/lib/arise'
import { useAuth } from '@/stores/auth.store'
import { useMeStore } from '@/stores/me.store'
import { WorkoutHistoryItem } from '@/types/workouts'

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const currentUserId = useAuth((state) => state.userId)
  const { canNudgeUser } = useMeStore()
  const { shareEntity } = useShare()
  const { colorScheme } = useColorScheme()
  const isDarkMode = colorScheme === 'dark'
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: user, isLoading: isUserLoading } = usePublicUserQuery(id)
  const { data: topLifts = [], isLoading: isTopLiftsLoading } = useUserTopLiftsQuery(id)
  const nudgeModalRef = useRef<BaseModalHandle>(null)
  const { data: exerciseList = [] } = useExercises()
  const nudgeMutation = useNudgeMutation()

  const followMutation = useFollowUserMutation()
  const unfollowMutation = useUnfollowUserMutation()

  const {
    workouts,
    isLoading: isWorkoutsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchWorkouts,
  } = useWorkoutListQuery(id)

  const { data: trainingAnalytics, isLoading: isTrainingLoading } = useUserTrainingAnalyticsQuery(
    id,
    'all',
  )

  const isLoading = isUserLoading || isWorkoutsLoading || isTopLiftsLoading || isTrainingLoading
  const isSelf = id === currentUserId

  const hasStreak = useMemo(() => {
    return workouts.some((w) => isThisWeek(new Date(w.startTime), { weekStartsOn: 1 }))
  }, [workouts])

  const handleShare = useCallback(async () => {
    if (!user) return

    await shareEntity('profile', id, {
      title: `${user.firstName}'s Profile`,
      image: user.profilePicUrl,
      message: `Check out ${user.firstName}'s fitness journey on Pump!`,
    })
  }, [user, id, shareEntity])

  const headerTitle = useMemo(() => {
    if (isLoading) return 'Profile'
    if (!user) return 'Profile'
    return `${user.firstName || ''} ${user.lastName || ''}`.trim()
  }, [user, isLoading])

  const exerciseTypeMap = useMemo(() => {
    const map = new Map<string, any>()
    exerciseList.forEach((ex) => map.set(ex.id, ex.exerciseType))
    return map
  }, [exerciseList])

  const handleToggleFollow = useCallback(() => {
    if (!user) return
    if (user.isFollowing) {
      unfollowMutation.mutate(id)
    } else {
      followMutation.mutate(id, {
        onSuccess: () => {
          Arise.success({
            heading: `You are now following ${user.firstName}`,
          })
        },
      })
    }
  }, [user, id, followMutation, unfollowMutation])

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refetchWorkouts()
    setIsRefreshing(false)
  }, [refetchWorkouts])

  const renderHeader = useMemo(() => {
    const isPending = followMutation.isPending || unfollowMutation.isPending

    return (
      <View className="flex-col gap-6">
        <UserHeader user={user ?? null} />

        {!isSelf && (
          <View className="flex-row gap-4">
            <Button
              title={user?.isFollowing ? 'Following' : 'Follow'}
              variant={user?.isFollowing ? 'secondary' : 'primary'}
              onPress={handleToggleFollow}
              loading={isPending}
              className="flex-1 rounded-full"
            />
            <Button
              title={canNudgeUser(id) ? 'Nudge' : 'Sent'}
              variant="outline"
              disabled={!canNudgeUser(id)}
              onPress={() => nudgeModalRef.current?.present()}
              className="w-1/3 rounded-full"
            />
          </View>
        )}

        <UserTrainingActivity userId={id} analytics={trainingAnalytics} />

        <TopLifts lifts={topLifts} isLoading={isTopLiftsLoading} />

        <SectionHeader title="Recent Workouts" className="pb-4" />
      </View>
    )
  }, [
    user,
    isSelf,
    id,
    canNudgeUser,
    handleToggleFollow,
    followMutation.isPending,
    unfollowMutation.isPending,
    topLifts,
    isTopLiftsLoading,
    trainingAnalytics,
  ])

  const renderItem: FlashListProps<WorkoutHistoryItem>['renderItem'] = useCallback(
    ({ item, index }: { item: WorkoutHistoryItem; index: number }) => (
      <SocialWorkoutCard
        workout={item}
        exerciseTypeMap={exerciseTypeMap}
        index={index}
        onPressComments={(workoutId: string) => {
          router.push(`/(app)/workout/${workoutId}`)
        }}
      />
    ),
    [exerciseTypeMap],
  )

  return (
    <>
      <BaseListScreen<WorkoutHistoryItem>
        title={headerTitle}
        backButton
        right={
          !isLoading && (
            <Button
              title=""
              variant="ghost"
              leftIcon={
                <Ionicons name="share-outline" size={28} color={isDarkMode ? 'white' : 'black'} />
              }
              onPress={handleShare}
              className="p-0"
            />
          )
        }
        // Data & Rendering
        data={workouts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={250}
        // States
        isLoading={isLoading}
        shimmer={<ProfileScreenShimmer />}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        // Pagination
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onEndReached={fetchNextPage}
        // Customizations
        emptyText="This athlete hasn't posted any workouts yet 🏋️‍♂️"
        endReachedText="You've conquered all the workouts here 🏆"
        flashListProps={{
          ListHeaderComponent: renderHeader,
        }}
      />

      <NudgeModal
        ref={nudgeModalRef}
        targetUserId={id}
        targetUserName={user?.firstName ?? 'Athlete'}
        hasStreak={hasStreak}
        isLoading={nudgeMutation.isPending}
        onSend={(note) => {
          nudgeMutation.mutate(
            { userId: id, note },
            {
              onSuccess: () => {
                Arise.success({
                  heading: 'Nudge sent successfully',
                  content: `${user?.firstName ?? 'The user'} has been notified of your encouragement`,
                })
                nudgeModalRef.current?.dismiss()
              },
            },
          )
        }}
      />
    </>
  )
}
