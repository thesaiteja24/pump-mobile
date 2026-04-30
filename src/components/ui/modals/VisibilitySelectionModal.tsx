import { useModalBackHandler, useModalNavigationSync } from '@/hooks/modal'
import { useThemeColor } from '@/hooks/theme'
import { VisibilityType } from '@/types/workouts'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SET_TYPES: {
  key: 'public' | 'private'
  title: string
  description: string
  titleClass: string
}[] = [
  {
    key: 'public',
    title: 'Public',
    description: 'Everyone on the PUMP can see this workout.',
    titleClass: 'text-blue-500',
  },
  {
    key: 'private',
    title: 'Private',
    description: 'Only you can see this workout.',
    titleClass: 'text-red-600',
  },
]

export interface VisibilitySelectionModalHandle {
  present: () => void
  dismiss: () => void
}

type Props = {
  currentType: VisibilityType
  onSelect: (type: VisibilityType) => void
  onClose?: () => void
  persistOnNavigation?: boolean
}

const VisibilitySelectionModal = forwardRef<VisibilitySelectionModalHandle, Props>(
  ({ currentType, onSelect, onClose, persistOnNavigation = false }, ref) => {
    const colors = useThemeColor()
    const isDark = useColorScheme() === 'dark'
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

    const snapPoints = useMemo(() => ['60%'], [])

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        onChange={(index) => setIsOpen(index >= 0)}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#525252' : '#d1d5db',
        }}
        // Smoother, slightly slower animation
        animationConfigs={{ duration: 350 }}
      >
        <BottomSheetView style={{ flex: 1, paddingBottom: insets.bottom + 24 }}>
          <View className="flex-1 px-6">
            {/* Header */}
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Set Visibility
              </Text>

              <TouchableOpacity onPress={dismiss}>
                <Ionicons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View className="gap-4">
              {SET_TYPES.map((type) => {
                const selected = currentType === type.key

                return (
                  <TouchableOpacity
                    key={type.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      onSelect(type.key)
                      dismiss()
                    }}
                    style={{
                      backgroundColor: selected
                        ? colors.isDark
                          ? 'rgba(59, 130, 246, 0.1)'
                          : '#eff6ff'
                        : 'transparent',
                      borderColor: selected ? colors.primary : colors.border,
                    }}
                    className="rounded-xl border p-4"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-4">
                        <Text className={`text-lg font-bold ${type.titleClass}`}>{type.title}</Text>

                        <Text className="mt-1 text-sm" style={{ color: colors.neutral[500] }}>
                          {type.description}
                        </Text>
                      </View>

                      {selected && (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

VisibilitySelectionModal.displayName = 'VisibilitySelectionModal'

export default VisibilitySelectionModal
