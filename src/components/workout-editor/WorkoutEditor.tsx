import { Button } from '@/components/ui/buttons/Button'
import WorkoutDurationModal from '@/components/workouts/modals/WorkoutDurationModal'
import { BaseModalHandle } from '@/components/ui/BaseModal'
import { useExercises } from '@/hooks/queries/exercises'
import {
  getWorkoutDurationSeconds,
  getWorkoutSaveState,
  getWorkoutSummary,
  useWorkoutEditor,
} from '@/stores/workout-editor.store'
import type { ExerciseType } from '@/types/exercises'
import { formatSeconds } from '@/utils/workout'
import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import ExerciseRow from './ExerciseRow'
import RestTimerBar from './RestTimerBar'
import WorkoutReorderList from './WorkoutReorderList'

export default function Workout() {
  const insets = useSafeAreaInsets()
  const titleInputRef = useRef<TextInput>(null)
  const durationModalRef = useRef<BaseModalHandle>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [now, setNow] = useState(Date.now())

  const workout = useWorkoutEditor((state) => state.workout)
  const mode = useWorkoutEditor((state) => state.mode)
  const updateWorkoutMeta = useWorkoutEditor((state) => state.updateWorkoutMeta)
  const reorderExercises = useWorkoutEditor((state) => state.reorderExercises)
  const discardWorkout = useWorkoutEditor((state) => state.discardWorkout)
  const pauseWorkout = useWorkoutEditor((state) => state.pauseWorkout)
  const resumeWorkout = useWorkoutEditor((state) => state.resumeWorkout)
  const [isReorderMode, setIsReorderMode] = useState(false)

  const { data: exerciseList = [] } = useExercises()

  const exerciseTypeMap = useMemo(() => {
    const map = new Map<string, ExerciseType>()
    exerciseList.forEach((exercise) => {
      map.set(exercise.id, exercise.exerciseType)
    })
    return map
  }, [exerciseList])

  const summary = useMemo(
    () => getWorkoutSummary(workout, exerciseTypeMap),
    [workout, exerciseTypeMap],
  )

  const reorderItems = useMemo(() => {
    if (!workout) return []

    const occurrenceCount = new Map<string, number>()

    return workout.exerciseOrder
      .map((exerciseInstanceId) => {
        const exercise = workout.exercisesById[exerciseInstanceId]
        if (!exercise) return null

        const details = exerciseList.find((item) => item.id === exercise.exerciseId)
        if (!details) return null

        const seen = (occurrenceCount.get(exercise.exerciseId) ?? 0) + 1
        occurrenceCount.set(exercise.exerciseId, seen)

        const group = exercise.groupId ? (workout.groupsById[exercise.groupId] ?? null) : null

        return {
          id: exercise.id,
          title: details.title,
          thumbnailUrl: details.thumbnailUrl,
          instanceLabel: seen > 1 ? `Instance ${seen}` : null,
          groupLabel: group
            ? `${group.groupType.toUpperCase()} ${String.fromCharCode('A'.charCodeAt(0) + group.groupIndex)}`
            : null,
          groupColor: group
            ? [
                '#4C1D95',
                '#7C2D12',
                '#14532D',
                '#7F1D1D',
                '#1E3A8A',
                '#581C87',
                '#0F766E',
                '#1F2937',
              ][
                Math.abs(
                  [...group.id].reduce((hash, char) => {
                    const next = (hash << 5) - hash + char.charCodeAt(0)
                    return next | 0
                  }, 0),
                ) % 8
              ]
            : null,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [exerciseList, workout])

  useEffect(() => {
    if (!isEditingTitle) return
    titleInputRef.current?.focus()
  }, [isEditingTitle])

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!workout) {
      setIsReorderMode(false)
    }
  }, [workout])

   useEffect(() => {
    if (!workout) {
      router.replace('/(app)/(tabs)/workout')
    }
  }, [workout])

  if (!workout) {
    return null
  }

  const durationSeconds = getWorkoutDurationSeconds(workout, mode, now)

  const handleOpenSaveScreen = () => {
    const validation = getWorkoutSaveState(workout, exerciseTypeMap)

    if (validation.validSetIds.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Nothing ready to save',
        text2:
          validation.stats.completedSetCount > 0
            ? 'Complete at least one set with all required values before saving.'
            : 'Complete at least one valid set before moving to save.',
      })
      return
    }

    router.push('/(app)/workout/save' as const)
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            {isEditingTitle ? (
              <TextInput
                ref={titleInputRef}
                value={workout.title}
                onChangeText={(title) => updateWorkoutMeta({ title })}
                onBlur={() => setIsEditingTitle(false)}
                onSubmitEditing={() => setIsEditingTitle(false)}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-2xl font-bold text-black dark:border-neutral-700 dark:text-white"
                returnKeyType="done"
              />
            ) : (
              <Pressable onPress={() => setIsEditingTitle(true)}>
                <Text className="text-2xl font-bold text-black dark:text-white">
                  {workout.title.trim().length > 0 ? workout.title : 'New Workout'}
                </Text>
              </Pressable>
            )}
          </View>

          <Button
            title={isReorderMode ? 'Done' : 'Save'}
            variant="secondary"
            onPress={() => {
              if (isReorderMode) {
                setIsReorderMode(false)
                return
              }
              handleOpenSaveScreen()
            }}
          />
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => durationModalRef.current?.present()}
            className="rounded-full border border-neutral-200 px-3 py-1.5 dark:border-neutral-800"
          >
            <Text className="text-sm font-semibold text-primary">
              {formatSeconds(durationSeconds)}
            </Text>
          </Pressable>

          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            {summary.exerciseCount} exercises • {summary.setCount} sets •{' '}
            {summary.validCompletedSetCount} valid completed
          </Text>
        </View>
      </View>

      {isReorderMode ? (
        <View className="flex-1 px-4 pb-4 pt-3">
          <Text className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            Drag exercises to reorder. Release to save the new position.
          </Text>
          <WorkoutReorderList
            items={reorderItems}
            onReorder={(orderedIds) => {
              reorderExercises(orderedIds)
            }}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 132 }}
        >
          {workout.exerciseOrder.length === 0 ? (
            <View className="px-4 py-8">
              <Text className="text-center text-neutral-500 dark:text-neutral-400">
                No exercises added yet. Tap &quot;Add Exercise&quot; to begin.
              </Text>
            </View>
          ) : (
            workout.exerciseOrder.map((exerciseInstanceId) => (
              <ExerciseRow
                key={exerciseInstanceId}
                exerciseInstanceId={exerciseInstanceId}
                onEnterReorder={() => setIsReorderMode(true)}
              />
            ))
          )}

          <View className="px-4 pb-2 pt-4">
            <View className="flex-row gap-3">
              <Button
                title="Add Exercise"
                variant="primary"
                className="flex-1"
                onPress={() => router.push('/(app)/exercises?context=builder')}
              />
              <Button
                title="Discard Workout"
                variant="danger"
                className="flex-1"
                onPress={() => {
                  discardWorkout()
                  router.back()
                }}
              />
            </View>
          </View>
        </ScrollView>
      )}

      <RestTimerBar />

      <WorkoutDurationModal
        ref={durationModalRef}
        mode={mode === 'edit-history' ? 'edit' : 'live'}
        title={mode === 'edit-history' ? 'Edit Workout Timing' : 'Workout Duration'}
        elapsedSeconds={durationSeconds}
        startTime={new Date(workout.startTime)}
        durationSeconds={durationSeconds}
        isPaused={mode === 'edit-history' ? false : Boolean(workout.pausedAt)}
        onUpdateStartTime={(date) =>
          updateWorkoutMeta(
            mode === 'edit-history'
              ? { startTime: date.toISOString() }
              : { startTime: date.toISOString(), endTime: null },
          )
        }
        onUpdateDurationSeconds={
          mode === 'edit-history'
            ? (seconds) => {
                const effectiveEndTime = new Date(
                  workout.endTime ?? new Date().toISOString(),
                ).getTime()
                updateWorkoutMeta({
                  startTime: new Date(effectiveEndTime - seconds * 1000).toISOString(),
                })
              }
            : undefined
        }
        onPause={mode === 'edit-history' ? undefined : pauseWorkout}
        onResume={mode === 'edit-history' ? undefined : resumeWorkout}
      />
    </SafeAreaView>
  )
}
