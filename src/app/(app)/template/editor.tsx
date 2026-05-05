import { PaywallModal } from '@/components/subscriptions/PaywallModal'
import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { Button } from '@/components/ui/buttons/Button'
import ExerciseRow from '@/components/workout-editor/ExerciseRow'
import WorkoutReorderList from '@/components/workout-editor/WorkoutReorderList'
import { FREE_TIER_LIMITS } from '@/constants/limits'
import { useExercises } from '@/hooks/queries/exercises'
import {
  useCreateTemplateMutation,
  useTemplateByIdQuery,
  useTemplatesQuery,
  useUpdateTemplateMutation,
} from '@/hooks/queries/templates'
import { useProgram } from '@/stores/programs.store'
import { useSubscriptionStore } from '@/stores/subscriptions.store'
import { finalizeTemplateForSave, useWorkoutEditor } from '@/stores/workout-editor.store'
import { usePreventRemove } from '@react-navigation/native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function TemplateEditor() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    id?: string
    context?: string
    weekIndex?: string
    dayIndex?: string
  }>()

  const isEditing = typeof params.id === 'string' && params.id.length > 0
  const programWeekIndex =
    params.context === 'program' && typeof params.weekIndex === 'string'
      ? Number(params.weekIndex)
      : undefined
  const programDayIndex =
    params.context === 'program' && typeof params.dayIndex === 'string'
      ? Number(params.dayIndex)
      : undefined

  const { data: templates = [] } = useTemplatesQuery()
  const { data: templateFromQuery, isLoading: templateLoading } = useTemplateByIdQuery(
    isEditing ? params.id : null,
  )
  const { data: exerciseList = [] } = useExercises()
  const createMutation = useCreateTemplateMutation()
  const updateMutation = useUpdateTemplateMutation()

  const isPro = useSubscriptionStore((s) => s.isPro)
  const workout = useWorkoutEditor((s) => s.workout)
  const mode = useWorkoutEditor((s) => s.mode)
  const source = useWorkoutEditor((s) => s.source)
  const initiateWorkout = useWorkoutEditor((s) => s.initiateWorkout)
  const updateWorkoutMeta = useWorkoutEditor((s) => s.updateWorkoutMeta)
  const reorderExercises = useWorkoutEditor((s) => s.reorderExercises)
  const discardWorkout = useWorkoutEditor((s) => s.discardWorkout)

  const [isReorderMode, setIsReorderMode] = useState(false)
  const [pendingPrunedTemplate, setPendingPrunedTemplate] = useState<
    ReturnType<typeof finalizeTemplateForSave>['template'] | null
  >(null)
  const [pruneMessage, setPruneMessage] = useState<string | null>(null)

  const discardModalRef = useRef<BaseModalHandle>(null)
  const pruneModalRef = useRef<BaseModalHandle>(null)
  const paywallModalRef = useRef<BaseModalHandle>(null)

  const isLimitHit =
    !isEditing && !isPro && templates.length >= FREE_TIER_LIMITS.MAX_CUSTOM_TEMPLATES

  useEffect(() => {
    if (!isLimitHit) return

    requestAnimationFrame(() => {
      paywallModalRef.current?.present()
    })
  }, [isLimitHit])

  useEffect(() => {
    if (isEditing) {
      if (!params.id) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'No template ID provided' })
        router.back()
        return
      }

      if (templateLoading) return

      if (!templateFromQuery) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Template not found' })
        router.back()
        return
      }

      if (mode === 'template-edit' && source?.templateId === templateFromQuery.id && workout) {
        return
      }

      discardWorkout()
      initiateWorkout({
        mode: 'template-edit',
        template: templateFromQuery,
        programWeekIndex,
        programDayIndex,
      })
      return
    }

    const currentProgramWeekIndex = source?.programWeekIndex ?? null
    const currentProgramDayIndex = source?.programDayIndex ?? null
    const nextProgramWeekIndex = programWeekIndex ?? null
    const nextProgramDayIndex = programDayIndex ?? null

    if (
      workout &&
      mode === 'template-create' &&
      currentProgramWeekIndex === nextProgramWeekIndex &&
      currentProgramDayIndex === nextProgramDayIndex
    ) {
      return
    }

    if (workout) {
      discardWorkout()
    }

    initiateWorkout({
      mode: 'template-create',
      programWeekIndex,
      programDayIndex,
    })
  }, [
    discardWorkout,
    initiateWorkout,
    isEditing,
    mode,
    params.id,
    programDayIndex,
    programWeekIndex,
    source?.programDayIndex,
    source?.programWeekIndex,
    source?.templateId,
    templateFromQuery,
    templateLoading,
    workout,
  ])

  useEffect(() => {
    if (!pruneMessage) return
    pruneModalRef.current?.present()
  }, [pruneMessage])

  useEffect(() => {
    if (!workout) {
      setIsReorderMode(false)
    }
  }, [workout])

  const hasUnsavedChanges = Boolean(
    workout &&
    (workout.title.trim().length > 0 ||
      (workout.notes?.trim().length ?? 0) > 0 ||
      workout.exerciseOrder.length > 0),
  )

  usePreventRemove(hasUnsavedChanges, () => {
    discardModalRef.current?.present()
  })

  const validExerciseIds = useMemo(
    () => new Set(exerciseList.map((exercise) => exercise.id)),
    [exerciseList],
  )

  const reorderItems = useMemo(() => {
    if (!workout) return []

    return workout.exerciseOrder
      .map((exerciseInstanceId) => {
        const exercise = workout.exercisesById[exerciseInstanceId]
        if (!exercise) return null

        const details = exerciseList.find((item) => item.id === exercise.exerciseId)
        if (!details) return null

        const group = exercise.groupId ? (workout.groupsById[exercise.groupId] ?? null) : null

        return {
          id: exercise.id,
          title: details.title,
          thumbnailUrl: details.thumbnailUrl,
          instanceLabel: null,
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

  const commitSave = useCallback(
    async (templateToSave: ReturnType<typeof finalizeTemplateForSave>['template']) => {
      try {
        const response =
          mode === 'template-edit' && source?.templateId
            ? await updateMutation.mutateAsync({
                id: source.templateId,
                draft: templateToSave,
              })
            : await createMutation.mutateAsync(templateToSave)

        const savedId = response?.id || source?.templateId || templateToSave.id

        if (source?.programWeekIndex != null && source?.programDayIndex != null) {
          const draftProgram = useProgram.getState().draftProgram

          if (draftProgram?.weeks) {
            const nextWeeks = [...draftProgram.weeks]
            if (nextWeeks[source.programWeekIndex]?.days[source.programDayIndex]) {
              nextWeeks[source.programWeekIndex].days[source.programDayIndex].templateId =
                savedId || templateToSave.clientId
              useProgram.getState().updateDraftProgram({ weeks: nextWeeks })
            }
          }
        }

        Toast.show({
          type: 'success',
          text1: mode === 'template-edit' ? 'Template updated' : 'Template created',
        })

        discardWorkout()
        setPendingPrunedTemplate(null)
        setPruneMessage(null)

        if (source?.programWeekIndex != null && source?.programDayIndex != null) {
          router.back()
          return
        }

        if (savedId) {
          router.replace({
            pathname: '/(app)/template/[id]',
            params: { id: savedId },
          })
          return
        }

        router.replace('/(app)/(tabs)/workout')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The template request failed.'
        Toast.show({
          type: 'error',
          text1: 'Failed to save template',
          text2: message,
        })
      }
    },
    [
      createMutation,
      discardWorkout,
      mode,
      source?.programDayIndex,
      source?.programWeekIndex,
      source?.templateId,
      updateMutation,
    ],
  )

  const handleSave = useCallback(async () => {
    if (!workout) return

    if (!workout.title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Title required',
        text2: 'Please enter a name for your template.',
      })
      return
    }

    if (workout.exerciseOrder.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No exercises',
        text2: 'Add at least one exercise to your template.',
      })
      return
    }

    const finalized = finalizeTemplateForSave(workout, validExerciseIds, source)

    if (finalized.template.exercises.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No valid exercises',
        text2: 'All exercises in this template are unavailable. Add valid exercises and try again.',
      })
      return
    }

    if (finalized.warnings.length > 0) {
      setPendingPrunedTemplate(finalized.template)
      setPruneMessage(finalized.warnings.join(' '))
      return
    }

    await commitSave(finalized.template)
  }, [commitSave, source, validExerciseIds, workout])

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      discardModalRef.current?.present()
      return
    }

    discardWorkout()
    router.back()
  }, [discardWorkout, hasUnsavedChanges])

  if (!workout || (isEditing && templateLoading && mode !== 'template-edit')) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-neutral-500 dark:text-neutral-400">Loading template...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {mode === 'template-edit' ? 'Edit Template' : 'New Template'}
        </Text>

        {/* Title + Actions */}
        <View className="mt-1 flex-row items-center gap-2">
          <TextInput
            value={workout.title}
            onChangeText={(title) => updateWorkoutMeta({ title })}
            placeholder="Template Name"
            placeholderTextColor="#9ca3af"
            className="flex-1 text-xl font-bold text-black dark:text-white"
          />

          <View className="flex-row gap-4">
            <Button title="Cancel" variant="danger" onPress={handleCancel} className="" />
            <Button
              title={isReorderMode ? 'Done' : 'Save'}
              variant="primary"
              onPress={() => {
                if (isReorderMode) {
                  setIsReorderMode(false)
                  return
                }
                void handleSave()
              }}
            />
          </View>
        </View>

        {/* Notes */}
        <TextInput
          value={workout.notes ?? ''}
          onChangeText={(notes) => updateWorkoutMeta({ notes })}
          placeholder="Notes (optional)"
          placeholderTextColor="#9ca3af"
          multiline
          className="max-h-24 text-sm text-neutral-600 dark:text-neutral-400"
        />

        {/* Meta */}
        <Text className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {workout.exerciseOrder.length} exercises • {Object.keys(workout.setsById).length} sets
        </Text>
      </View>
      {isReorderMode ? (
        <View className="flex-1 px-4 pb-4 pt-3">
          <Text className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            Drag exercises to reorder the template.
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
                title="Discard Template"
                variant="danger"
                className="flex-1"
                onPress={() => discardModalRef.current?.present()}
              />
            </View>
          </View>
        </ScrollView>
      )}

      <BaseModal
        ref={discardModalRef}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        deleteAction={{
          title: 'Discard',
          onPress: () => {
            discardWorkout()
            discardModalRef.current?.dismiss()
            router.back()
          },
        }}
        cancelAction={{
          onPress: () => discardModalRef.current?.dismiss(),
        }}
      />

      <BaseModal
        ref={pruneModalRef}
        title="Confirm Save"
        description={pruneMessage || ''}
        confirmAction={{
          title: 'Save Anyway',
          onPress: () => {
            if (pendingPrunedTemplate) {
              void commitSave(pendingPrunedTemplate)
              pruneModalRef.current?.dismiss()
            }
          },
        }}
        cancelAction={{
          onPress: () => {
            setPendingPrunedTemplate(null)
            setPruneMessage(null)
            pruneModalRef.current?.dismiss()
          },
        }}
      />

      <PaywallModal
        ref={paywallModalRef}
        title="Upgrade to Pro"
        description={`You can only add up to ${FREE_TIER_LIMITS.MAX_CUSTOM_TEMPLATES} custom templates on the Free plan.`}
        continueText="View Plans"
        cancelText="Go Back"
        onContinue={() => {
          discardWorkout()
          router.replace('/paywall')
        }}
        onCancel={() => {
          discardWorkout()
          router.back()
        }}
      />
    </SafeAreaView>
  )
}
