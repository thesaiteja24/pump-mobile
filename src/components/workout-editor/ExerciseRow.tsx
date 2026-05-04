import ExerciseGroupModal, {
  ExerciseGroupModalHandle,
} from '@/components/exercises/ExerciseGroupModal'
import { Button } from '@/components/ui/buttons/Button'
import TimerDurationModal, {
  TimerDurationModalHandle,
} from '@/components/workouts/modals/TimerDurationModal'
import { useExercises } from '@/hooks/queries/exercises'
import { useWorkoutEditor } from '@/stores/workout-editor.store'
import type { ExerciseType } from '@/types/exercises'
import type { ExerciseGroupType } from '@/types/workouts'
import { Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { memo, useMemo, useRef, useState } from 'react'
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ElapsedTime } from './ElapsedTime'
import { useUnitConverter } from '@/hooks/useUnitConverter'
import SetRow from './SetRow'

const COL_SET = 'w-[40%] flex-row items-center justify-evenly'
const COL_STD = 'w-[20%] flex-row items-center justify-evenly'
const COL_RPE = 'w-[20%] flex-row items-center justify-evenly'

const GROUP_COLORS = [
  '#4C1D95',
  '#7C2D12',
  '#14532D',
  '#7F1D1D',
  '#1E3A8A',
  '#581C87',
  '#0F766E',
  '#1F2937',
]

const EXERCISE_CAPABILITIES: Record<
  ExerciseType,
  { hasWeight: boolean; hasReps: boolean; hasDuration: boolean }
> = {
  weighted: { hasWeight: true, hasReps: true, hasDuration: false },
  assisted: { hasWeight: true, hasReps: true, hasDuration: false },
  repsOnly: { hasWeight: false, hasReps: true, hasDuration: false },
  durationOnly: { hasWeight: false, hasReps: false, hasDuration: true },
}

type Props = {
  exerciseInstanceId: string
  onEnterReorder?: (exerciseInstanceId: string) => void
}

function hashStringToIndex(str: string, modulo: number) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % modulo
}

function getGroupColor(groupId: string) {
  return GROUP_COLORS[hashStringToIndex(groupId, GROUP_COLORS.length)]
}

function ExerciseRow({ exerciseInstanceId, onEnterReorder }: Props) {
  const isDark = useColorScheme() === 'dark'
  const insets = useSafeAreaInsets()
  const workout = useWorkoutEditor((state) => state.workout)
  const mode = useWorkoutEditor((state) => state.mode)
  const exercise = useWorkoutEditor(
    (state) => state.workout?.exercisesById[exerciseInstanceId] ?? null,
  )
  const addSet = useWorkoutEditor((state) => state.addSet)
  const deleteExercise = useWorkoutEditor((state) => state.deleteExercise)
  const updateExerciseRest = useWorkoutEditor((state) => state.updateExerciseRest)
  const createGroup = useWorkoutEditor((state) => state.createGroup)
  const updateGroup = useWorkoutEditor((state) => state.updateGroup)
  const deleteGroup = useWorkoutEditor((state) => state.deleteGroup)

  const { data: exerciseList = [] } = useExercises()
  const { weightUnit: preferredWeightUnit } = useUnitConverter()

  const [notesExpanded, setNotesExpanded] = useState(false)
  const [groupType, setGroupType] = useState<ExerciseGroupType | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [selectedGroupExerciseIds, setSelectedGroupExerciseIds] = useState<Set<string>>(new Set())

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const exerciseGroupModalRef = useRef<ExerciseGroupModalHandle>(null)
  const restPickerRef = useRef<TimerDurationModalHandle>(null)

  const exerciseMap = useMemo(
    () => new Map(exerciseList.map((item) => [item.id, item])),
    [exerciseList],
  )
  const exerciseDetails = exercise ? exerciseMap.get(exercise.exerciseId) : null
  const group = exercise?.groupId && workout ? (workout.groupsById[exercise.groupId] ?? null) : null
  const isTemplateMode = mode === 'template-create' || mode === 'template-edit'

  const exerciseOccurrence = useMemo(() => {
    if (!workout || !exercise) return 1

    let seen = 0
    for (const id of workout.exerciseOrder) {
      const current = workout.exercisesById[id]
      if (!current) continue
      if (current.exerciseId === exercise.exerciseId) {
        seen += 1
      }
      if (id === exercise.id) {
        return seen
      }
    }

    return 1
  }, [workout, exercise])

  const workoutExercisesForGrouping = useMemo(() => {
    if (!workout || !exercise) return []

    return workout.exerciseOrder
      .map((id) => {
        const row = workout.exercisesById[id]
        if (!row) return null

        const details = exerciseMap.get(row.exerciseId)
        if (!details) return null

        const inCurrentGroup = editingGroupId ? row.groupId === editingGroupId : false
        const selected = selectedGroupExerciseIds.has(id)
        const disabled =
          row.id !== exercise.id && row.groupId != null && !inCurrentGroup && !selected

        return {
          id: row.id,
          title: details.title,
          thumbnailUrl: details.thumbnailUrl,
          selected,
          disabled,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [editingGroupId, exercise, exerciseMap, selectedGroupExerciseIds, workout])

  if (!exercise || !exerciseDetails) return null

  const { hasWeight, hasReps, hasDuration } = EXERCISE_CAPABILITIES[exerciseDetails.exerciseType]

  const openCreateGroup = (nextGroupType: ExerciseGroupType) => {
    setEditingGroupId(null)
    setGroupType(nextGroupType)
    setSelectedGroupExerciseIds(new Set([exercise.id]))
    bottomSheetModalRef.current?.dismiss()
    exerciseGroupModalRef.current?.present()
  }

  const openEditGroup = () => {
    if (!group) return
    setEditingGroupId(group.id)
    setGroupType(group.groupType)
    setSelectedGroupExerciseIds(new Set(group.exerciseInstanceIds))
    bottomSheetModalRef.current?.dismiss()
    exerciseGroupModalRef.current?.present()
  }

  const confirmGroup = () => {
    if (
      !groupType ||
      selectedGroupExerciseIds.size < 2 ||
      (groupType === 'superSet' && selectedGroupExerciseIds.size !== 2)
    ) {
      return
    }

    const exerciseInstanceIds = Array.from(selectedGroupExerciseIds)

    if (editingGroupId) {
      updateGroup(editingGroupId, { exerciseInstanceIds, groupType })
    } else {
      createGroup({ groupType, exerciseInstanceIds })
    }

    setEditingGroupId(null)
    setGroupType(null)
    setSelectedGroupExerciseIds(new Set())
  }

  const currentSharedRestSeconds =
    exercise.sharedRestSeconds ??
    exercise.setOrder
      .map((setId) => workout?.setsById[setId]?.restSeconds)
      .find((seconds): seconds is number => seconds != null) ??
    null

  const enableExerciseRest = () => {
    updateExerciseRest(exercise.id, {
      restMode: 'exercise',
      sharedRestSeconds: currentSharedRestSeconds ?? 60,
    })
  }

  const enablePerSetRest = () => {
    updateExerciseRest(exercise.id, {
      restMode: 'perSet',
    })
  }

  return (
    <View className="m-4 flex gap-2">
      <View className="flex-row items-center justify-between">
        <View className="w-8/12">
          <View className="flex-row items-center gap-4">
            <Image
              source={exerciseDetails.thumbnailUrl}
              style={{
                width: 40,
                height: 40,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: 'gray',
              }}
            />

            <View className="flex-1">
              <Text className="text-lg font-bold text-black dark:text-white">
                {exerciseDetails.title}
              </Text>
              {exerciseOccurrence > 1 && (
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  Instance {exerciseOccurrence}
                </Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={() => bottomSheetModalRef.current?.present()}>
          <Entypo name="dots-three-horizontal" size={20} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
            <TouchableOpacity
              onPress={enableExerciseRest}
              className={`h-8 w-8 items-center justify-center rounded-full ${
                exercise.restMode === 'exercise' ? 'bg-primary' : ''
              }`}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={exercise.restMode === 'exercise' ? 'white' : isDark ? '#d4d4d4' : '#525252'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={enablePerSetRest}
              className={`h-8 w-8 items-center justify-center rounded-full ${
                exercise.restMode === 'perSet' ? 'bg-primary' : ''
              }`}
            >
              <MaterialCommunityIcons
                name="format-list-checks"
                size={18}
                color={exercise.restMode === 'perSet' ? 'white' : isDark ? '#d4d4d4' : '#525252'}
              />
            </TouchableOpacity>
          </View>

          {exercise.restMode === 'exercise' && (
            <TouchableOpacity
              onPress={() => restPickerRef.current?.present(currentSharedRestSeconds ?? 60)}
              className="min-w-[110px] flex-row items-center rounded-full border border-neutral-200 px-3 py-1.5 dark:border-neutral-800"
            >
              <Ionicons name="timer-outline" size={15} color="#3b82f6" />
              <ElapsedTime
                baseSeconds={currentSharedRestSeconds ?? undefined}
                textClassName={`ml-2 text-sm font-semibold ${
                  currentSharedRestSeconds == null
                    ? 'text-neutral-500 dark:text-neutral-400'
                    : 'text-blue-500'
                }`}
              />
            </TouchableOpacity>
          )}
        </View>

        {group ? (
          <View className="rounded-full" style={{ backgroundColor: getGroupColor(group.id) }}>
            <Text className="px-3 py-1 text-sm font-semibold text-white">
              {`${group.groupType.toUpperCase()} ${String.fromCharCode('A'.charCodeAt(0) + group.groupIndex)}`}
            </Text>
          </View>
        ) : (
          <View />
        )}
      </View>

      <View className="flex-row items-center bg-white py-1 dark:bg-black">
        <View className={COL_SET}>
          <Text className="mr-3 text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            SET
          </Text>
          <Text className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            PREV
          </Text>
        </View>

        <View className={COL_STD}>
          {hasWeight ? (
            <Text className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {preferredWeightUnit}
            </Text>
          ) : (
            <Text className="text-sm text-neutral-400">-</Text>
          )}
        </View>

        <View className={COL_STD}>
          {hasReps && (
            <Text className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              REPS
            </Text>
          )}
          {hasDuration && !hasReps && (
            <Text className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              TIME
            </Text>
          )}
        </View>

        <View className={COL_RPE}>
          <Text className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            RPE
          </Text>
        </View>
      </View>

      {exercise.setOrder.map((setId) => (
        <SetRow
          key={setId}
          setId={setId}
          exerciseType={exerciseDetails.exerciseType}
          exerciseRestMode={exercise.restMode}
          notesExpanded={notesExpanded}
        />
      ))}

      <Button title="Add Set" variant="secondary" onPress={() => addSet(exercise.id)} />

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? '#171717' : 'white',
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#525252' : '#d1d5db',
        }}
        animationConfigs={{ duration: 350 }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
          {!group ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  bottomSheetModalRef.current?.dismiss()
                  onEnterReorder?.(exercise.id)
                }}
                className="px-4 py-3"
              >
                <Text className="text-base text-black dark:text-white">Reorder Exercises</Text>
              </TouchableOpacity>
              <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
              {isTemplateMode && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      bottomSheetModalRef.current?.dismiss()
                      router.push({
                        pathname: '/(app)/exercises',
                        params: {
                          context: 'builder',
                          replaceInstanceId: exercise.id,
                        },
                      })
                    }}
                    className="px-4 py-3"
                  >
                    <Text className="text-base text-black dark:text-white">Replace Exercise</Text>
                  </TouchableOpacity>
                  <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
                </>
              )}
              <TouchableOpacity onPress={() => openCreateGroup('superSet')} className="px-4 py-3">
                <Text className="text-base text-black dark:text-white">Create Super Set</Text>
              </TouchableOpacity>
              <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
              <TouchableOpacity onPress={() => openCreateGroup('giantSet')} className="px-4 py-3">
                <Text className="text-base text-black dark:text-white">Create Giant Set</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={openEditGroup} className="px-4 py-3">
                <Text className="text-base text-black dark:text-white">Edit Group</Text>
              </TouchableOpacity>
              <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
              <TouchableOpacity
                onPress={() => {
                  bottomSheetModalRef.current?.dismiss()
                  deleteGroup(group.id)
                }}
                className="px-4 py-3"
              >
                <Text className="text-base text-black dark:text-white">Delete Group</Text>
              </TouchableOpacity>
            </>
          )}

          <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
          <TouchableOpacity
            onPress={() => {
              bottomSheetModalRef.current?.dismiss()
              setNotesExpanded((open) => !open)
            }}
            className="px-4 py-3"
          >
            <Text className="text-base text-black dark:text-white">
              {notesExpanded ? 'Hide Notes' : 'Take Notes'}
            </Text>
          </TouchableOpacity>

          <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
          <TouchableOpacity
            onPress={() => {
              bottomSheetModalRef.current?.dismiss()
              deleteExercise(exercise.id)
            }}
            className="px-4 py-3"
          >
            <Text className="text-base text-red-600">Delete Exercise</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>

      <ExerciseGroupModal
        ref={exerciseGroupModalRef}
        exercises={workoutExercisesForGrouping}
        onSelect={(item) => {
          setSelectedGroupExerciseIds((prev) => {
            const next = new Set(prev)
            if (next.has(item.id)) {
              next.delete(item.id)
            } else if (groupType === 'superSet' && next.size >= 2) {
              return prev
            } else {
              next.add(item.id)
            }
            return next
          })
        }}
        onConfirm={confirmGroup}
        onClose={() => {
          setEditingGroupId(null)
          setGroupType(null)
        }}
      />

      <TimerDurationModal
        ref={restPickerRef}
        title="Rest Timer"
        confirmText="Save"
        onConfirm={(seconds) => {
          updateExerciseRest(exercise.id, {
            restMode: 'exercise',
            sharedRestSeconds: seconds,
          })
        }}
      />
    </View>
  )
}

export default memo(ExerciseRow)
