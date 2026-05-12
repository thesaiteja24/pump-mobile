import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  BackHandler,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import { ProgramWorkoutPromptModal } from '@/components/modals/ProgramWorkoutPromptModal'
import { UserSubscriptionPaywallModal } from '@/components/modals/SubscriptionPaywallModal'
import { ProgramCard } from '@/components/program/ProgramCard'
import { UserProgramCard } from '@/components/program/UserProgramCard'
import { TemplateCard } from '@/components/template/TemplateCard'
import { BaseEmptyState, Button, SectionHeader } from '@/components/ui'
import { BaseModalHandle } from '@/components/ui/BaseModal'
import BaseScreen from '@/components/ui/BaseScreen'
import {
  ProgramCardShimmer,
  TemplateCardShimmer,
  UserProgramCardShimmer,
} from '@/components/ui/shimmers/'
import { FREE_TIER_LIMITS } from '@/constants/limits'
import { ROLES } from '@/constants/roles'
import { useExercises } from '@/hooks/queries/exercises'
import { useProfileQuery } from '@/hooks/queries/me'
import { useActiveProgram, usePrograms, useUserPrograms } from '@/hooks/queries/programs'
import { useTemplatesQuery } from '@/hooks/queries/templates'
import { useThemeColor } from '@/hooks/theme'
import { useSubscriptionStore } from '@/stores/subscriptions.store'
import { useWorkoutEditor } from '@/stores/workout-editor.store'
import { SelfUser } from '@/types/me'

export default function WorkoutScreen() {
  const router = useRouter()
  const colors = useThemeColor()
  const { width } = useWindowDimensions()

  // Workout Store
  const workout = useWorkoutEditor((s) => s.workout)
  const workoutMode = useWorkoutEditor((s) => s.mode)
  const discardWorkout = useWorkoutEditor((s) => s.discardWorkout)
  const initiateWorkout = useWorkoutEditor((s) => s.initiateWorkout)
  const { data: userData } = useProfileQuery()
  const user = userData as SelfUser | null
  const userRole = user?.role
  const hasActiveWorkout = Boolean(workout)

  const {
    data: templates = [],
    isLoading: templateLoading,
    refetch: refetchTemplates,
  } = useTemplatesQuery()

  // Programs from TanStack Query
  const { data: programsData, isLoading: programLoading, refetch: refetchPrograms } = usePrograms()
  const programs = programsData?.programs || []
  const {
    data: activeProgram,
    isLoading: activeLoading,
    refetch: refetchActive,
  } = useActiveProgram()
  const { data: allUserPrograms = [], isLoading: userProgramsLoading } = useUserPrograms()

  // Warm up exercise cache
  const { refetch: refetchExercises } = useExercises()

  const pastPrograms = allUserPrograms.filter((p) => p.id !== activeProgram?.id)

  const [refreshing, setRefreshing] = useState(false)

  // Subscription Store
  const isPro = useSubscriptionStore((s) => s.isPro)

  // Refs
  const paywallModalRef = useRef<BaseModalHandle>(null)
  const programPromptRef = useRef<BaseModalHandle>(null)

  // Animation values initialized at 0 opacity
  const activeWorkoutOpacity = useSharedValue(0)
  const activeWorkoutTranslateY = useSharedValue(20)

  const libraryOpacity = useSharedValue(0)
  const libraryTranslateY = useSharedValue(20)

  const templatesOpacity = useSharedValue(0)
  const templatesTranslateY = useSharedValue(20)

  const programsOpacity = useSharedValue(0)
  const programsTranslateY = useSharedValue(20)

  useEffect(() => {
    // Staggered sequence
    activeWorkoutOpacity.value = withTiming(1, { duration: 500 })
    activeWorkoutTranslateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.quad),
    })

    libraryOpacity.value = withDelay(100, withTiming(1, { duration: 500 }))
    libraryTranslateY.value = withDelay(
      100,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
    )

    templatesOpacity.value = withDelay(200, withTiming(1, { duration: 500 }))
    templatesTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
    )

    programsOpacity.value = withDelay(250, withTiming(1, { duration: 500 }))
    programsTranslateY.value = withDelay(
      250,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
    )
  }, [
    activeWorkoutOpacity,
    activeWorkoutTranslateY,
    libraryOpacity,
    libraryTranslateY,
    templatesOpacity,
    templatesTranslateY,
    programsOpacity,
    programsTranslateY,
  ])

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchTemplates(), refetchPrograms(), refetchActive(), refetchExercises()])
    setRefreshing(false)
  }, [refetchTemplates, refetchPrograms, refetchActive, refetchExercises])

  const activeWorkoutStyle = useAnimatedStyle(() => ({
    opacity: activeWorkoutOpacity.value,
    transform: [{ translateY: activeWorkoutTranslateY.value }],
  }))

  const libraryStyle = useAnimatedStyle(() => ({
    opacity: libraryOpacity.value,
    transform: [{ translateY: libraryTranslateY.value }],
  }))

  const templatesStyle = useAnimatedStyle(() => ({
    opacity: templatesOpacity.value,
    transform: [{ translateY: templatesTranslateY.value }],
  }))

  const programsStyle = useAnimatedStyle(() => ({
    opacity: programsOpacity.value,
    transform: [{ translateY: programsOpacity.value === 1 ? 0 : programsTranslateY.value }],
  }))

  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back()
      } else {
        router.push('/(app)/(tabs)/workout')
      }
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

    return () => subscription.remove()
  }, [router])

  return (
    <BaseScreen
      title="Workout"
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View className="mb-[50%]">
        {/* Active Workout Control */}
        <Animated.View style={activeWorkoutStyle} className="mb-4 flex flex-row gap-4">
          <Button
            title={hasActiveWorkout ? 'Continue the Pump' : 'Ready to Get Pumped?'}
            variant="primary"
            onPress={() => {
              if (workout) {
                router.push(
                  workoutMode === 'template-create' || workoutMode === 'template-edit'
                    ? '/(app)/template/editor'
                    : '/(app)/workout/start',
                )
                return
              }

              // Check if there is an active program with a scheduled workout for today
              if (activeProgram?.progress && !activeProgram.progress.isRestDay) {
                programPromptRef.current?.present()
              } else {
                initiateWorkout()
                router.push('/(app)/workout/start')
              }
            }}
            className="flex-1"
          />
          {hasActiveWorkout && (
            <Button
              title="Discard"
              variant="danger"
              onPress={discardWorkout}
              className="max-w-[35%]"
            />
          )}
        </Animated.View>

        <Animated.View style={libraryStyle}>
          <View className="flex flex-row gap-4">
            <Button
              title="View Library"
              variant="secondary"
              onPress={() => router.push('/(app)/exercises')}
              className="mb-6 flex-1"
            />
            <Button
              title="View History"
              variant="secondary"
              onPress={() => router.push('/(app)/workout/history')}
              className="mb-6 flex-1"
            />
          </View>
        </Animated.View>

        <Animated.View style={programsStyle} className="mb-8 flex flex-col gap-4">
          <SectionHeader title="Active Program" />

          {/* Active Program Card or Dotted Interface */}
          <View className="">
            {activeLoading || refreshing ? (
              <UserProgramCardShimmer />
            ) : activeProgram ? (
              <>
                <UserProgramCard program={activeProgram} />
              </>
            ) : (
              <BaseEmptyState message="No active program. Choose one below!" className="h-44" />
            )}
          </View>
        </Animated.View>

        {/* Programs Section */}
        <Animated.View style={programsStyle} className="mb-8 flex flex-col gap-4">
          <SectionHeader
            title="Programs"
            actionIcon={
              isPro && userRole === ROLES.systemAdmin ? 'folder-plus' : undefined
            }
            onActionPress={
              isPro && userRole === ROLES.systemAdmin
                ? () => router.push('/(app)/program')
                : undefined
            }
          />

          {programLoading || refreshing ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
              decelerationRate="fast"
              snapToInterval={width * 0.75 + 10}
              snapToAlignment="start"
            >
              {[1, 2].map((item) => (
                <View key={item} style={{ width: width * 0.75 }}>
                  <ProgramCardShimmer />
                </View>
              ))}
            </ScrollView>
          ) : programs.length === 0 ? (
            <BaseEmptyState message="No programs available. Create one!" className="h-40" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
              decelerationRate="fast"
              snapToInterval={width * 0.75 + 10}
              snapToAlignment="start"
            >
              {programs.map((program) => (
                <View key={program.id} style={{ width: width * 0.75 }}>
                  <ProgramCard program={program} />
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Templates Section */}
        <Animated.View style={templatesStyle} className="flex flex-col gap-4">
          <SectionHeader
            title="My Templates"
            actionIcon="folder-plus"
            onActionPress={() => {
              if (!isPro && templates.length >= FREE_TIER_LIMITS.MAX_CUSTOM_TEMPLATES) {
                paywallModalRef.current?.present()
              } else {
                router.push('/(app)/template/editor')
              }
            }}
          />

          {templateLoading || refreshing ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
              decelerationRate="fast"
              snapToInterval={width * 0.75 + 10}
              snapToAlignment="start"
            >
              {[1, 2].map((item) => (
                <View key={item} style={{ width: width * 0.75 }}>
                  <TemplateCardShimmer />
                </View>
              ))}
            </ScrollView>
          ) : templates.length === 0 ? (
            <BaseEmptyState message="No templates yet. Create one!" className="h-40" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
              decelerationRate="fast"
              snapToInterval={width * 0.75 + 10}
              snapToAlignment="start"
            >
              {templates.map((template) => (
                <View key={template.id} style={{ width: width * 0.75 }}>
                  <TemplateCard template={template} />
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Past Programs Section */}
        {pastPrograms.length > 0 && (
          <Animated.View style={programsStyle} className="mt-8 flex flex-col gap-4">
            <SectionHeader title="Past Programs" />

            {userProgramsLoading || refreshing ? (
              <UserProgramCardShimmer />
            ) : (
              <View className="gap-4">
                {pastPrograms.map((p) => (
                  <UserProgramCard key={p.id} program={p} />
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </View>

      <ProgramWorkoutPromptModal
        ref={programPromptRef}
        programTitle={activeProgram?.program?.title || 'Active Program'}
        workoutTitle={activeProgram?.progress?.workoutTitle || 'Scheduled Workout'}
        onSelectProgram={() => {
          if (
            activeProgram?.progress?.userProgramDayId &&
            activeProgram?.progress?.templateSnapshot
          ) {
            initiateWorkout({
              mode: 'program-workout',
              userProgramDayId: activeProgram.progress.userProgramDayId,
              templateSnapshot: activeProgram.progress.templateSnapshot,
            })
            router.push('/(app)/workout/start')
          } else {
            initiateWorkout()
            router.push('/(app)/workout/start')
          }
        }}
        onSelectEmpty={() => {
          initiateWorkout()
          router.push('/(app)/workout/start')
        }}
      />

      <UserSubscriptionPaywallModal
        ref={paywallModalRef}
        title="Upgrade to Pro"
        description={`You can only add up to ${FREE_TIER_LIMITS.MAX_CUSTOM_TEMPLATES} custom templates on the Free plan. Upgrade to create UNLIMITED Templates`}
        continueText="View Plans"
      />
    </BaseScreen>
  )
}
