import ExerciseList from '@/components/exercises/ExerciseList'
import MetaModal, { MetaModalHandle } from '@/components/ui/modals/MetaModal'

import { Button } from '@/components/ui/buttons/Button'
import {
  DeleteConfirmModal,
  DeleteConfirmModalHandle,
} from '@/components/ui/modals/DeleteConfirmModal'

import { ROLES as roles } from '@/constants/roles'
import { useDeleteExercise, useExercises } from '@/hooks/queries/exercises'
import { useProfileQuery } from '@/hooks/queries/me'
import { useEquipment, useMuscleGroups } from '@/hooks/queries/meta'
import { Exercise } from '@/types/exercises'
import { SelfUser } from '@/types/me'

import { useWorkoutEditor } from '@/stores/workout-editor.store'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import Fuse from 'fuse.js'

import React, { useEffect, useMemo, useState } from 'react'
import {
  BackHandler,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

type NavigationWithRightIcons = {
  setOptions: (options: {
    rightIcons?: {
      name: string
      onPress: () => void
    }[]
  }) => void
}

/* ───────────────── Chip (UI only) ───────────────── */

type ChipProps = {
  label: string
  onRemove: () => void
}

function Chip({ label, onRemove }: ChipProps) {
  const isDark = useColorScheme() === 'dark'

  return (
    <TouchableOpacity
      onPress={onRemove}
      className="h-12 w-full flex-row items-center justify-around rounded-2xl border border-neutral-200/60 bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800"
    >
      <Text className="text-lg font-semibold text-black dark:text-white">{label}</Text>
      <Ionicons name="close-circle" size={24} color={isDark ? '#737373' : '#a3a3a3'} />
    </TouchableOpacity>
  )
}

/* ───────────────── Screen ───────────────── */

export default function ExercisesScreen() {
  const navigation = useNavigation()
  const navigationWithRightIcons = navigation as unknown as NavigationWithRightIcons
  const isDark = useColorScheme() === 'dark'
  const lineHeight = Platform.OS === 'ios' ? 0 : 20

  const { data: userData } = useProfileQuery()
  const user = userData as SelfUser | null
  const role = user?.role
  const safeAreaInsets = useSafeAreaInsets()
  const params = useLocalSearchParams()
  const context = (params.context as 'library' | 'builder') || 'library'
  const isBuilderContext = context === 'builder'
  const activeWorkoutMode = useWorkoutEditor((s) => s.mode)
  const replaceInstanceId =
    typeof params.replaceInstanceId === 'string' ? params.replaceInstanceId : null

  const isSelectionMode = params.mode === 'select' || isBuilderContext
  const isTemplateMode =
    activeWorkoutMode === 'template-create' || activeWorkoutMode === 'template-edit'

  const addExerciseToBuilder = useWorkoutEditor((s) => s.addExercise)
  const replaceExerciseInBuilder = useWorkoutEditor((s) => s.replaceExercise)
  const deleteExerciseFromBuilder = useWorkoutEditor((s) => s.deleteExercise)
  const workout = useWorkoutEditor((s) => s.workout)

  // Equipment (TanStack Query)
  const { data: equipmentList = [], isLoading: equipmentLoading } = useEquipment()

  // Muscle Groups (TanStack Query)
  const { data: muscleGroupList = [], isLoading: muscleGroupLoading } = useMuscleGroups()

  // Exercises (TanStack Query)
  const { data: exerciseList = [], isLoading: exerciseLoading } = useExercises()
  const deleteExerciseMutation = useDeleteExercise()

  const initialSelectedIds = useMemo(() => {
    if (isBuilderContext) {
      if (isTemplateMode) {
        return new Set<string>(
          workout?.exerciseOrder
            .map((id) => workout.exercisesById[id]?.exerciseId)
            .filter((id): id is string => Boolean(id)) ?? [],
        )
      }
      return new Set<string>()
    }
    return new Set<string>()
  }, [
    isBuilderContext,
    isTemplateMode,
    workout,
  ])

  // Local, temporary selection buffer (UI only)
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(initialSelectedIds)

  useEffect(() => {
    setTempSelectedIds(new Set(initialSelectedIds))
  }, [initialSelectedIds])

  const selectedExerciseIds = isSelectionMode ? tempSelectedIds : initialSelectedIds

  const selectedCount = selectedExerciseIds.size

  const [query, setQuery] = useState('')
  // const [showMuscleGroupsModal, setShowMuscleGroupsModal] = useState(false); // Removed

  const equipmentModalRef = React.useRef<MetaModalHandle>(null)
  const muscleGroupsModalRef = React.useRef<MetaModalHandle>(null)
  const deleteConfirmModalRef = React.useRef<DeleteConfirmModalHandle>(null)

  const [filter, setFilter] = useState({
    equipmentId: '',
    muscleGroupId: '',
  })

  const [deleteExerciseId, setDeleteExerciseId] = useState<{
    id: string
    title: string
  } | null>(null)

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false)
  const [isMuscleGroupModalOpen, setIsMuscleGroupModalOpen] = useState(false)

  useEffect(() => {
    if (role === roles.systemAdmin) {
      navigationWithRightIcons.setOptions({
        rightIcons: [
          {
            name: 'add',
            onPress: () => router.push('/(app)/(system-admin)/exercises/create'),
          },
        ],
      })
    }
  }, [navigationWithRightIcons, role])

  useEffect(() => {
    const onBackPress = () => {
      if (isEquipmentModalOpen) {
        equipmentModalRef.current?.dismiss()
        return true
      }
      if (isMuscleGroupModalOpen) {
        muscleGroupsModalRef.current?.dismiss()
        return true
      }
      if (router.canGoBack()) {
        router.back()
      } else {
        router.push('/(app)/(tabs)/home')
      }
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => subscription.remove()
  }, [isEquipmentModalOpen, isMuscleGroupModalOpen])

  /* ───────────────── Fuzzy search ───────────────── */

  const fuse = useMemo(() => {
    if (!exerciseList.length) return null

    return new Fuse(exerciseList, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'equipment.title', weight: 0.2 },
        { name: 'primaryMuscleGroup.title', weight: 0.1 },
        { name: 'secondaryMuscleGroups.title', weight: 0.1 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
    })
  }, [exerciseList])

  const filteredExercises = useMemo(() => {
    let data = exerciseList

    if (filter.equipmentId) {
      data = data.filter((e) => e.equipment?.id === filter.equipmentId)
    }

    if (filter.muscleGroupId) {
      data = data.filter(
        (e) =>
          e.primaryMuscleGroup?.id === filter.muscleGroupId ||
          e.otherMuscleGroups?.some((m) => m.id === filter.muscleGroupId),
      )
    }

    if (!fuse || query.trim() === '') return data

    const ids = new Set(fuse.search(query).map((r) => r.item.id))
    return data.filter((e) => ids.has(e.id))
  }, [exerciseList, filter, fuse, query])

  /* ───────────────── Handlers ───────────────── */

  const handleExercisePress = (exercise: Exercise) => {
    Haptics.selectionAsync()

    if (replaceInstanceId && isBuilderContext) {
      const replacingExercise = workout?.exercisesById[replaceInstanceId]
      if (!replacingExercise) {
        router.back()
        return
      }

      if (
        isTemplateMode &&
        exercise.id !== replacingExercise.exerciseId &&
        initialSelectedIds.has(exercise.id)
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Toast.show({
          type: 'error',
          text1: 'Duplicate Exercise',
          text2: 'This exercise is already in your template.',
        })
        return
      }

      replaceExerciseInBuilder(replaceInstanceId, exercise.id)
      router.back()
      return
    }

    if (isBuilderContext) {
      setTempSelectedIds((prev) => {
        const next = new Set(prev)

        if (next.has(exercise.id)) {
          next.delete(exercise.id)
        } else {
          next.add(exercise.id)
        }

        return next
      })
      return
    }

    if (isSelectionMode) {
      setTempSelectedIds((prev) => {
        const next = new Set(prev)

        if (next.has(exercise.id)) {
          next.delete(exercise.id)
        } else {
          next.add(exercise.id)
        }

        return next
      })
      return
    }

    router.push(`/(app)/exercises/${exercise.id}/(tabs)/summary`)
  }

  /* ───────────────── Render ───────────────── */

  return (
    <View
      style={{ paddingBottom: safeAreaInsets.bottom }}
      className="flex-1 bg-white px-4 pt-4 dark:bg-black"
    >
      {/* Search */}
      <View className="relative mb-4 justify-center">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises, equipment, muscles…"
          placeholderTextColor="#9CA3AF"
          className="rounded-xl border border-neutral-200 bg-white py-3 pl-4 pr-8 text-lg text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          style={{ lineHeight: lineHeight }}
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery('')
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }}
            className="absolute right-3"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View className="mb-4 flex-row gap-4">
        <View className="flex-1">
          {filter.equipmentId ? (
            <Chip
              label={equipmentList.find((e) => e.id === filter.equipmentId)?.title ?? 'Equipment'}
              onRemove={() => {
                setFilter((f) => ({ ...f, equipmentId: '' }))
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              }}
            />
          ) : (
            <Button
              title="Equipment"
              onPress={() => {
                setIsEquipmentModalOpen(true)
                equipmentModalRef.current?.present()
                Keyboard.dismiss()
              }}
            />
          )}
        </View>

        <View className="flex-1">
          {filter.muscleGroupId ? (
            <Chip
              label={
                muscleGroupList.find((m) => m.id === filter.muscleGroupId)?.title ?? 'Muscle Groups'
              }
              onRemove={() => {
                setFilter((f) => ({ ...f, muscleGroupId: '' }))
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              }}
            />
          ) : (
            <Button
              title="Muscle Groups"
              onPress={() => {
                setIsMuscleGroupModalOpen(true)
                muscleGroupsModalRef.current?.present()
                Keyboard.dismiss()
              }}
            />
          )}
        </View>
      </View>

      {/* Exercise list */}
      <ExerciseList
        loading={exerciseLoading}
        exercises={filteredExercises}
        isSelecting={isSelectionMode}
        isSelected={(id) => selectedExerciseIds.has(id)}
        onPress={handleExercisePress}
        onLongPress={(exercise) => {
          if (role !== roles.systemAdmin) return
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          router.push(`/(app)/(system-admin)/exercises/${exercise.id}`)
        }}
      />

      {/* Bottom bar (selection mode) */}
      {isSelectionMode && !exerciseLoading && (
        <View className="flex-row items-center justify-between rounded-2xl border border-neutral-200/60 bg-neutral-100 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
              router.back()
            }}
          >
            <Text className="text-lg font-semibold text-red-600">Cancel</Text>
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-black dark:text-white">
            {selectedCount} selected
          </Text>

          <TouchableOpacity
            disabled={selectedCount === 0}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

              if (isBuilderContext) {
                if (isTemplateMode && workout) {
                  initialSelectedIds.forEach((id) => {
                    if (!tempSelectedIds.has(id)) {
                      const exerciseInstanceId = workout.exerciseOrder.find(
                        (instanceId) => workout.exercisesById[instanceId]?.exerciseId === id,
                      )

                      if (exerciseInstanceId) {
                        deleteExerciseFromBuilder(exerciseInstanceId)
                      }
                    }
                  })

                  tempSelectedIds.forEach((id) => {
                    if (!initialSelectedIds.has(id)) {
                      addExerciseToBuilder(id)
                    }
                  })
                } else {
                  tempSelectedIds.forEach((id) => {
                    addExerciseToBuilder(id)
                  })
                }

                router.back()
                return
              }

              router.back()
            }}
          >
            <Text
              className={`text-lg font-semibold ${
                selectedCount === 0 ? 'text-neutral-400' : 'text-green-600'
              }`}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <MetaModal
        ref={equipmentModalRef}
        title="Equipment"
        loading={equipmentLoading}
        enableCreate={role === roles.systemAdmin}
        items={equipmentList}
        onClose={() => setIsEquipmentModalOpen(false)}
        onSelect={(item) => {
          setFilter((f) => ({ ...f, equipmentId: item.id }))
          equipmentModalRef.current?.dismiss()
        }}
        onLongPress={(item) => {
          if (role !== roles.systemAdmin) return
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          equipmentModalRef.current?.dismiss()
          router.push(`/(app)/(system-admin)/meta/equipment/${item.id}`)
        }}
        onCreatePress={() => {
          if (role !== roles.systemAdmin) return
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          equipmentModalRef.current?.dismiss()
          router.push(`/(app)/(system-admin)/meta/equipment/create`)
        }}
      />

      <MetaModal
        ref={muscleGroupsModalRef}
        title="Muscle Groups"
        loading={muscleGroupLoading}
        enableCreate={role === roles.systemAdmin}
        items={muscleGroupList}
        onClose={() => setIsMuscleGroupModalOpen(false)}
        onSelect={(item) => {
          setFilter((f) => ({ ...f, muscleGroupId: item.id }))
          muscleGroupsModalRef.current?.dismiss()
        }}
        onLongPress={(item) => {
          if (role !== roles.systemAdmin) return
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          muscleGroupsModalRef.current?.dismiss()
          router.push(`/(app)/(system-admin)/meta/muscle-groups/${item.id}`)
        }}
        onCreatePress={() => {
          if (role !== roles.systemAdmin) return
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          muscleGroupsModalRef.current?.dismiss()
          router.push(`/(app)/(system-admin)/meta/muscle-groups/create`)
        }}
      />

      <DeleteConfirmModal
        ref={deleteConfirmModalRef}
        title={deleteExerciseId ? `Delete "${deleteExerciseId.title}"?` : 'Delete Exercise?'}
        description="This exercise will be permanently removed."
        onCancel={() => setDeleteExerciseId(null)}
        onConfirm={async () => {
          if (!deleteExerciseId) return
          try {
            await deleteExerciseMutation.mutateAsync(deleteExerciseId.id)
            setDeleteExerciseId(null)
            Toast.show({
              type: 'success',
              text1: 'Exercise deleted successfully',
            })
          } catch (e) {
            const message =
              e instanceof Error ? e.message : 'Unexpected error deleting exercise'
            setDeleteExerciseId(null)
            Toast.show({
              type: 'error',
              text1: 'Error deleting exercise',
              text2: message,
            })
          }
        }}
      />
    </View>
  )
}
