import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { Button } from '@/components/ui/buttons/Button'
import { ReadOnlyExerciseRow } from '@/components/workout-editor/ReadOnlyExerciseRow'
import { ProgramDay, UserProgramDay } from '@/types/programs'
import { TemplateExerciseGroup } from '@/types/templates'
import { FontAwesome6 } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Text, View } from 'react-native'

export interface WorkoutDetailsModalHandle {
  present: (day: ProgramDay | UserProgramDay, isStartable?: boolean) => void
  dismiss: () => void
}

export interface WorkoutDetailsModalProps {
  onOpenChange?: (isOpen: boolean) => void
  onStartWorkout?: (day: UserProgramDay) => void
}

export const WorkoutDetailsModal = forwardRef<WorkoutDetailsModalHandle, WorkoutDetailsModalProps>(
  ({ onOpenChange, onStartWorkout }, ref) => {
    const router = useRouter()
    const [selectedDay, setSelectedDay] = useState<ProgramDay | UserProgramDay | null>(null)
    const [isStartable, setIsStartable] = useState(false)
    const baseModalRef = useRef<BaseModalHandle>(null)
    const dynamicSizing = selectedDay?.isRestDay ? true : false

    const presentModal = useCallback(
      (day: ProgramDay | UserProgramDay, startable: boolean = false) => {
        setSelectedDay(day)
        setIsStartable(startable)
        baseModalRef.current?.present()
      },
      [],
    )

    const dismissModal = useCallback(() => {
      baseModalRef.current?.dismiss()
    }, [])

    useImperativeHandle(ref, () => ({
      present: presentModal,
      dismiss: dismissModal,
    }))

    const template = useMemo(() => {
      if (!selectedDay) return null
      return 'template' in selectedDay
        ? (selectedDay as ProgramDay).template
        : (selectedDay as UserProgramDay).templateSnapshot
    }, [selectedDay])

    const groupMap = useMemo(() => {
      const map = new Map<string, TemplateExerciseGroup>()
      template?.exerciseGroups?.forEach((g) => map.set(g.id, g))
      return map
    }, [template?.exerciseGroups])

    const renderContent = () => {
      if (!selectedDay) return null

      if (selectedDay.isRestDay) {
        return (
          <View className="items-center justify-center">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <FontAwesome6 name="heart-circle-bolt" size={40} color="#10b981" />
            </View>
            <Text className="mb-2 text-center text-2xl font-bold text-black dark:text-white">
              Rest & Recovery
            </Text>
            <Text className="text-center text-base leading-6 text-neutral-600 dark:text-neutral-400">
              Your muscles grow while you rest, not while you work. Take this time to refuel and
              recharge for your next session!
            </Text>
          </View>
        )
      }

      if (!template) {
        return (
          <View className="items-center justify-center py-12">
            <Text className="text-neutral-500">No workout linked for this day.</Text>
          </View>
        )
      }

      return (
        <View className="flex-1">
          {/* Header */}
          <View className="border-b border-neutral-100 dark:border-neutral-900">
            {template.notes && (
              <Text className="mb-4 text-base text-neutral-600 dark:text-neutral-400">
                {template.notes}
              </Text>
            )}
            <View className="flex-row gap-4">
              <View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                <Text className="text-sm font-medium text-neutral-500">
                  {template.exercises.length} Exercises
                </Text>
              </View>
              <View className="rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-900/30">
                <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {selectedDay.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Exercise List */}
          <View className="gap-4 p-4">
            {template.exercises.map((ex, idx) => (
              <ReadOnlyExerciseRow
                key={ex.id || idx}
                exercise={ex}
                group={ex.exerciseGroupId ? groupMap.get(ex.exerciseGroupId) : null}
              />
            ))}
          </View>

          {/* Footer Start Button */}
          {isStartable && (
            <View className="mt-4 p-4">
              <Button
                title="Start Scheduled Workout"
                onPress={() => {
                  if (selectedDay && 'templateSnapshot' in selectedDay) {
                    onStartWorkout?.(selectedDay as UserProgramDay)
                  }
                  baseModalRef.current?.dismiss()
                  router.push({
                    pathname: '/(app)/workout/start',
                  })
                }}
              />
            </View>
          )}
        </View>
      )
    }

    return (
      <BaseModal
        ref={baseModalRef}
        title={selectedDay?.isRestDay ? 'Rest Day' : template?.title || 'Workout Details'}
        enableDynamicSizing={dynamicSizing}
        onDismiss={() => onOpenChange?.(false)}
        onChange={(index) => onOpenChange?.(index >= 0)}
      >
        {renderContent()}
      </BaseModal>
    )
  },
)

WorkoutDetailsModal.displayName = 'WorkoutDetailsModal'
