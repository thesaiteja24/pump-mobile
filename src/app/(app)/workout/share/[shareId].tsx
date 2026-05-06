import { Button } from '@/components/ui/buttons/Button'
import { ReadOnlyExerciseRow } from '@/components/workout-editor/ReadOnlyExerciseRow'
import { useSaveWorkoutMutation } from '@/hooks/queries/workouts'
import { getWorkoutByShareIdService } from '@/services/workouts.service'
import { WorkoutHistoryItem } from '@/types/workouts'
import * as Crypto from 'expo-crypto'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, Text, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function SharedWorkoutDetails() {
  const { shareId } = useLocalSearchParams<{ shareId: string }>()
  const navigation = useNavigation()
  const isDark = useColorScheme() === 'dark'
  const safeAreaInsets = useSafeAreaInsets()

  const [loading, setLoading] = useState(true)
  const [sharedWorkout, setSharedWorkout] = useState<WorkoutHistoryItem | null>(null)
  const [saving, setSaving] = useState(false)

  const saveMutation = useSaveWorkoutMutation()

  useEffect(() => {
    if (shareId) {
      getWorkoutByShareIdService(shareId)
        .then((res) => {
          setSharedWorkout(res)
        })
        .catch((err) => {
          console.error('Failed to fetch shared workout', err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [shareId])

  useEffect(() => {
    navigation.setOptions({
      title: sharedWorkout?.title ?? 'Shared Workout',
      leftIcon: 'chevron-back-outline',
      onLeftPress: () => {
        router.replace('/(app)/(tabs)/discover')
      },
    })
  }, [navigation, sharedWorkout, isDark])

  const groupMap = useMemo(() => {
    const map = new Map<string, any>()
    sharedWorkout?.exerciseGroups?.forEach((g) => map.set(g.id, g))
    return map
  }, [sharedWorkout?.exerciseGroups])

  const handleSave = async () => {
    if (!sharedWorkout) return
    setSaving(true)

    try {
      const payload = {
        clientId: Crypto.randomUUID(),
        title: sharedWorkout.title ? `${sharedWorkout.title} (Copy)` : 'Copied Workout',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        visibility: 'private' as const,
        exerciseGroups: sharedWorkout.exerciseGroups.map((g) => ({
          id: g.id,
          groupType: g.groupType,
          groupIndex: g.groupIndex,
          restSeconds: g.restSeconds,
        })),
        exercises: sharedWorkout.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseIndex: ex.exerciseIndex,
          exerciseGroupId: ex.exerciseGroupId ?? undefined,
          sets: ex.sets.map((s) => ({
            setIndex: s.setIndex,
            setType: s.setType,
            weight: s.weight ?? undefined,
            reps: s.reps ?? undefined,
            rpe: s.rpe ?? undefined,
            durationSeconds: s.durationSeconds ?? undefined,
            restSeconds: s.restSeconds ?? undefined,
            note: s.note ?? undefined,
          })),
        })),
      }

      await saveMutation.mutateAsync(payload as any)

      Alert.alert('Success', 'Workout copied to your history!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(app)/(tabs)/workout')
          },
        },
      ])
    } catch (e) {
      console.error('Failed to save shared workout', e)
      Alert.alert('Error', 'Failed to save workout copy.')
    } finally {
      setSaving(false)
    }
  }

  if (!sharedWorkout) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        {loading || !shareId ? (
          <View>
            <Text className="text-neutral-500">Loading...</Text>
          </View>
        ) : (
          <Text className="text-base font-medium text-neutral-500">
            Workout not found or private.
          </Text>
        )}
      </View>
    )
  }

  return (
    <View className="relative flex-1 bg-white dark:bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View className="border-b border-neutral-100 p-4 dark:border-neutral-900">
          <Text className="mb-2 text-3xl font-bold text-black dark:text-white">
            {sharedWorkout.title || 'Workout'}
          </Text>
          {/* Author Info */}
          <Text className="mb-4 text-sm font-medium text-blue-600 dark:text-blue-400">
            {sharedWorkout.user
              ? `Completed by ${sharedWorkout.user.firstName} ${sharedWorkout.user.lastName}`
              : 'Shared Workout'}
          </Text>

          <View className="flex-row gap-4">
            <View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
              <Text className="text-base font-medium text-neutral-500">
                {sharedWorkout.exercises?.length || 0} Exercises
              </Text>
            </View>
          </View>
        </View>

        {/* Read Only Exercise List */}
        <View className="gap-4 p-4">
          {sharedWorkout.exercises?.map((ex, idx) => (
            <ReadOnlyExerciseRow
              key={ex.id || idx}
              exercise={ex}
              group={ex.exerciseGroupId ? groupMap.get(ex.exerciseGroupId) : null}
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button for Starting */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white p-4 dark:border-neutral-900 dark:bg-black"
        style={{ paddingBottom: safeAreaInsets.bottom + 16 }}
      >
        <Button
          title="Save a Copy to History"
          onPress={handleSave}
          disabled={saving}
          loading={saving}
        />
      </View>
    </View>
  )
}
