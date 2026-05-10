import { router,Stack } from 'expo-router'
import { useMemo, useRef } from 'react'
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { TimerDurationModal, TimerDurationModalHandle } from '@/components/modals/TimerDurationModal'
import { VisibilitySelectionModal } from '@/components/modals/VisibilitySelectionModal'
import { BaseModalHandle } from '@/components/ui/BaseModal'
import { Button } from '@/components/ui/buttons/Button'
import { DateTimePicker } from '@/components/ui/inputs/DateTimePicker'
import { useExercises } from '@/hooks/queries/exercises'
import {
  useCreateWorkoutPayloadMutation,
  useUpdateWorkoutPayloadMutation,
} from '@/hooks/queries/workouts'
import { Arise } from '@/lib/arise'
import {
  finalizeWorkoutForSave,
  getWorkoutDurationSeconds,
  getWorkoutSaveState,
  useWorkoutEditor,
} from '@/stores/workout-editor.store'
import type { ExerciseType } from '@/types/exercises'
import type { WorkoutPayload } from '@/types/payloads'
import { formatSeconds } from '@/utils/workout'

export default function WorkoutSaveScreen() {
  const insets = useSafeAreaInsets()
  const durationModalRef = useRef<TimerDurationModalHandle>(null)
  const visibilityModalRef = useRef<BaseModalHandle>(null)

  const workout = useWorkoutEditor((state) => state.workout)
  const mode = useWorkoutEditor((state) => state.mode)
  const source = useWorkoutEditor((state) => state.source)
  const updateWorkoutMeta = useWorkoutEditor((state) => state.updateWorkoutMeta)
  const discardWorkout = useWorkoutEditor((state) => state.discardWorkout)
  const createWorkoutMutation = useCreateWorkoutPayloadMutation()
  const updateWorkoutMutation = useUpdateWorkoutPayloadMutation()

  const { data: exerciseList = [] } = useExercises()

  const exerciseTypeMap = useMemo(() => {
    const map = new Map<string, ExerciseType>()
    exerciseList.forEach((exercise) => {
      map.set(exercise.id, exercise.exerciseType)
    })
    return map
  }, [exerciseList])

  if (!workout) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <Stack.Screen options={{ headerShown: false }} />
      </SafeAreaView>
    )
  }

  const durationSeconds = getWorkoutDurationSeconds(workout, mode, Date.now())

  const handleUpdateStartTime = (date: Date) => {
    const nextStartTime = date.toISOString()

    if (mode === 'edit-history') {
      updateWorkoutMeta({
        startTime: nextStartTime,
      })
      return
    }

    updateWorkoutMeta({
      startTime: nextStartTime,
      endTime: null,
    })
  }

  const handleUpdateDuration = (seconds: number) => {
    if (mode === 'edit-history') {
      const effectiveEndTime = new Date(workout.endTime ?? new Date().toISOString()).getTime()
      const nextStartTime = new Date(effectiveEndTime - seconds * 1000).toISOString()

      updateWorkoutMeta({
        startTime: nextStartTime,
      })
      return
    }

    const effectiveNow = workout.pausedAt ?? Date.now()
    const nextStartTime = new Date(
      effectiveNow - (seconds + workout.accumulatedPauseSeconds) * 1000,
    ).toISOString()

    updateWorkoutMeta({
      startTime: nextStartTime,
      endTime: null,
    })
  }

  const handleSaveWorkout = () => {
    const validation = getWorkoutSaveState(workout, exerciseTypeMap)

    if (!validation.canSave) {
      const invalidCompletedSetCount = validation.invalidCompletedSetIds.length
      const hasOnlyInvalidCompletedSets =
        invalidCompletedSetCount > 0 && validation.validSetIds.length === 0

      Arise.error({
        heading: hasOnlyInvalidCompletedSets ? 'Completed sets need fixes' : 'Workout cannot be saved',
        content:
          invalidCompletedSetCount > 0
            ? `${invalidCompletedSetCount} completed set${invalidCompletedSetCount === 1 ? ' is' : 's are'} missing required values. Fix them or uncheck them before saving.`
            : validation.reasons.join(' '),
      })
      return
    }

    const finalized = finalizeWorkoutForSave(workout, exerciseTypeMap, source)

    if (finalized.warnings.length > 0) {
      Arise.info({
        heading: 'Workout finalized',
        content: finalized.warnings.join(' '),
      })
    }

    if (mode === 'edit-history') {
      if (!workout.id) {
        Arise.error({
          heading: 'Missing workout id',
          content: 'This history workout cannot be updated because its id is missing.',
        })
        return
      }

      updateWorkoutMutation.mutate(
        {
          id: workout.id,
          payload: finalized.payload as WorkoutPayload,
        },
        {
          onSuccess: () => {
            Arise.success({
              heading: 'Workout updated',
              content: 'The updated workout payload was logged and sent to the API.',
            })

            discardWorkout()
            router.replace({
              pathname: '/(app)/workout/[id]',
              params: { id: workout.id as string },
            } as const)
          },
          onError: (error) => {
            const message =
              error instanceof Error ? error.message : 'The workout update request failed.'
            Arise.error({
              heading: 'Failed to update workout',
              content: message,
            })
          },
        },
      )
      return
    }

    createWorkoutMutation.mutate(finalized.payload as WorkoutPayload, {
      onSuccess: (response) => {
        const createdWorkoutId = response?.id ?? null

        Arise.success({
          heading: mode === 'program-workout' ? 'Program workout saved' : 'Workout saved',
          content: 'The workout payload was logged and sent to the API.',
        })

        discardWorkout()

        if (createdWorkoutId) {
          router.replace({
            pathname: '/(app)/workout/[id]',
            params: { id: createdWorkoutId },
          } as const)
          return
        }

        router.replace('/(app)/(tabs)/workout')
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'The workout save request failed.'
        Arise.error({
          heading: 'Failed to save workout',
          content: message,
        })
      },
    })
  }

  return (
    <SafeAreaView style={{ paddingBottom: insets.bottom }} className="flex-1 bg-white dark:bg-black">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-1 text-neutral-500">Workout title</Text>
        <TextInput
          value={workout.title}
          onChangeText={(title) => updateWorkoutMeta({ title })}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-lg text-black dark:border-neutral-700 dark:text-white"
        />

        <View className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Visibility</Text>
          <TouchableOpacity className="mt-1" onPress={() => visibilityModalRef.current?.present()}>
            <Text className="text-base font-medium text-primary">
              {workout.visibility.slice(0, 1).toUpperCase() + workout.visibility.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Start Time</Text>
          <View className="mt-1 self-start">
            <DateTimePicker
              value={new Date(workout.startTime)}
              onUpdate={handleUpdateStartTime}
              title="Edit Start Time"
              textClassName="text-base font-medium text-primary"
            />
          </View>
        </View>

        <View className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Duration</Text>
          <TouchableOpacity
            className="mt-1"
            onPress={() => durationModalRef.current?.present(durationSeconds)}
          >
            <Text className="text-base font-medium text-primary">{formatSeconds(durationSeconds)}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="gap-3 px-4 pb-4">
        <Button
          title={
            mode === 'edit-history'
              ? 'Update Workout'
              : mode === 'program-workout'
                ? 'Save Program Workout'
                : 'Save Workout'
          }
          variant="primary"
          onPress={() => {
            void handleSaveWorkout()
          }}
        />
        <Button title="Back to Workout" variant="secondary" onPress={() => router.back()} />
      </View>

      <TimerDurationModal
        ref={durationModalRef}
        title="Edit Duration"
        confirmText="Confirm"
        onConfirm={handleUpdateDuration}
      />

      <VisibilitySelectionModal
        ref={visibilityModalRef}
        currentType={workout.visibility}
        onSelect={(visibility) => updateWorkoutMeta({ visibility })}
        onClose={() => visibilityModalRef.current?.dismiss()}
      />
    </SafeAreaView>
  )
}
