import { FlashList } from '@shopify/flash-list'
import { isThisWeek } from 'date-fns'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

import { BaseModalHandle, NudgeModal } from '@/components/modals'
import { SocialWorkoutCard } from '@/components/social/SocialWorkoutCard'
import { Button } from '@/components/ui/buttons/Button'
import { ShimmerProfileScreen } from '@/components/ui/shimmers'
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
import { useWorkoutsQuery } from '@/hooks/queries/workouts'
import { useShare } from '@/hooks/useShare'
import { Arise } from '@/lib/arise'
import { useAuth } from '@/stores/auth.store'
import { useMeStore } from '@/stores/me.store'

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const currentUserId = useAuth((state) => state.userId)
  const { canNudgeUser } = useMeStore()
  const { shareEntity } = useShare()

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
  } = useWorkoutsQuery(id)

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

  useEffect(() => {
    navigation.setOptions({
      title: isLoading
        ? 'Profile'
        : user
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
          : 'Profile',
      leftIcon: 'chevron-back-outline',
      onLeftPress: () => {
        router.back()
      },
      rightIcons: isLoading
        ? []
        : [
            {
              name: 'share-outline',
              onPress: handleShare,
            },
          ],
    })
  }, [user, navigation, isLoading, handleShare])

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

        <Text className="pb-4 text-lg font-thin text-neutral-900 dark:text-neutral-100">
          Recent Workouts
        </Text>
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

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
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

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <View className="flex-1 bg-white px-4 dark:bg-black">
      {isLoading ? (
        <ShimmerProfileScreen />
      ) : (
        <FlashList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            hasNextPage ? (
              <View className="mb-[100%] items-center justify-center p-4 pb-12 pt-6">
                {isFetchingNextPage && <ActivityIndicator size="small" />}
              </View>
            ) : (
              <View className="mb-[50%] items-center justify-center p-4 pb-12 pt-6">
                <Text className="text-neutral-500 dark:text-neutral-400">
                  You&apos;ve conquered all the workouts here 🏆
                </Text>
              </View>
            )
          }
        />
      )}

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
    </View>
  )
}
