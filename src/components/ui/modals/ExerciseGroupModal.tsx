import { Button } from '@/components/ui/buttons/Button'
import { useModalBackHandler, useModalNavigationSync } from '@/hooks/modal'
import { useThemeColor } from '@/hooks/theme'
import { Ionicons } from '@expo/vector-icons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
  persistOnNavigation?: boolean
}

const ExerciseGroupModal = forwardRef<ExerciseGroupModalHandle, Props>(
  ({ exercises, onSelect, onClose, onConfirm, persistOnNavigation = false }, ref) => {
    const colors = useThemeColor()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const insets = useSafeAreaInsets()
    const [isOpen, setIsOpen] = useState(false)

    const present = useCallback(() => {
      bottomSheetModalRef.current?.present()
    }, [])

    const dismiss = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()
    }, [])

    useImperativeHandle(ref, () => ({
      present,
      dismiss,
    }))

    // Shared modal logic
    useModalBackHandler(isOpen, dismiss)
    useModalNavigationSync({ isOpen, present, dismiss, persistOnNavigation })

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      ),
      [],
    )

    const snapPoints = useMemo(() => ['85%'], [])

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        onChange={(index) => setIsOpen(index >= 0)}
        handleIndicatorStyle={{
          backgroundColor: colors.isDark ? '#525252' : '#d1d5db',
        }}
        enableDynamicSizing={false}
        animationConfigs={{
          duration: 350,
        }}
      >
        <BottomSheetView style={{ flex: 1, paddingBottom: insets.bottom + 24 }}>
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between px-6 pt-4">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Select Exercises
            </Text>

            <TouchableOpacity onPress={dismiss}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Exercise list */}
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
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

          {/* Footer */}
          {onConfirm && (
            <View className="mt-4 px-6">
              <Button
                title="Confirm"
                onPress={() => {
                  onConfirm()
                  dismiss()
                }}
              />
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

ExerciseGroupModal.displayName = 'ExerciseGroupModal'

export default ExerciseGroupModal
