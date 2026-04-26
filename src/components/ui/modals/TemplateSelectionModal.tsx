import { useModalBackHandler, useModalNavigationSync } from '@/hooks/modal'
import { WorkoutTemplate } from '@/types/templates'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface TemplateSelectionModalHandle {
  present: () => void
  dismiss: () => void
}

type Props = {
  templates: WorkoutTemplate[]
  onSelect: (templateId: string) => void
  onClose?: () => void
  persistOnNavigation?: boolean
}

const TemplateSelectionModal = forwardRef<TemplateSelectionModalHandle, Props>(
  ({ templates, onSelect, onClose, persistOnNavigation = false }, ref) => {
    const isDark = useColorScheme() === 'dark'
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const insets = useSafeAreaInsets()
    const [isOpen, setIsOpen] = useState(false)

    const present = useCallback(() => bottomSheetModalRef.current?.present(), [])
    const dismiss = useCallback(() => bottomSheetModalRef.current?.dismiss(), [])

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

    const snapPoints = useMemo(() => ['70%'], [])

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        onChange={(index) => setIsOpen(index >= 0)}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#525252' : '#d1d5db' }}
        animationConfigs={{
          duration: 350,
        }}
      >
        <BottomSheetScrollView style={{ flex: 1, paddingBottom: insets.bottom + 24 }}>
          <View className="flex-1 px-6">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-black dark:text-white">
                Select a Template
              </Text>
              <TouchableOpacity onPress={dismiss}>
                <Ionicons name="close" size={24} color={isDark ? 'white' : 'gray'} />
              </TouchableOpacity>
            </View>

            {templates.length === 0 ? (
              <Text className="mt-10 text-center text-neutral-500">No templates found.</Text>
            ) : (
              <View className="gap-3">
                {templates.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      onSelect(type.id)
                      dismiss()
                    }}
                    className="rounded-xl border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <Text className="text-lg font-bold text-black dark:text-white">
                      {type.title}
                    </Text>
                    <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {type.exercises.length} exercises
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  },
)

TemplateSelectionModal.displayName = 'TemplateSelectionModal'
export default TemplateSelectionModal
