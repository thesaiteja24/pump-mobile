import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { useThemeColor } from '@/hooks/theme'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { forwardRef } from 'react'
import { Text, TouchableOpacity } from 'react-native'

type GroupExerciseItem = {
  id: string
  title: string
  thumbnailUrl?: string
  selected: boolean
  disabled: boolean
}

export interface ExerciseGroupModalHandle {
  present: () => void
  dismiss: () => void
}

type Props = {
  exercises: GroupExerciseItem[]
  onSelect: (exercise: GroupExerciseItem) => void
  onClose?: () => void
  onConfirm?: () => void
}

const ExerciseGroupModal = forwardRef<BaseModalHandle, Props>(
  ({ exercises, onSelect, onClose, onConfirm }, ref) => {
    const colors = useThemeColor()

    return (
      <BaseModal
        ref={ref}
        title="Select Exercises"
        onDismiss={onClose}
        confirmAction={
          onConfirm
            ? {
                title: 'Confirm',
                onPress: () => {
                  onConfirm()
                  // @ts-ignore
                  ref?.current?.dismiss()
                },
              }
            : undefined
        }
      >
        <BottomSheetScrollView showsVerticalScrollIndicator={false} style={{ height: 500 }}>
          {exercises.map((exercise) => {
            const opacity = exercise.disabled ? 0.4 : 1

            return (
              <TouchableOpacity
                key={exercise.id}
                disabled={exercise.disabled}
                onPress={() => onSelect(exercise)}
                className="mb-3 flex-row items-center gap-4 rounded-xl border p-3"
                style={{
                  opacity,
                  borderColor: exercise.selected ? colors.primary : colors.border,
                  backgroundColor: exercise.selected
                    ? colors.isDark
                      ? 'rgba(59, 130, 246, 0.1)'
                      : '#eff6ff'
                    : 'transparent',
                }}
              >
                <Image
                  source={{ uri: exercise.thumbnailUrl }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.isDark ? colors.neutral[800] : colors.white,
                  }}
                />

                <Text className="flex-1 text-base" style={{ color: colors.text }}>
                  {exercise.title}
                </Text>

                {exercise.selected && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            )
          })}
        </BottomSheetScrollView>
      </BaseModal>
    )
  },
)

ExerciseGroupModal.displayName = 'ExerciseGroupModal'

export default ExerciseGroupModal
