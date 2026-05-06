import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { useThemeColor } from '@/hooks/theme'
import { VisibilityType } from '@/types/workouts'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { forwardRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

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

type Props = {
  currentType: VisibilityType
  onSelect: (type: VisibilityType) => void
  onClose?: () => void
}

const VisibilitySelectionModal = forwardRef<BaseModalHandle, Props>(
  ({ currentType, onSelect, onClose }, ref) => {
    const colors = useThemeColor()

    return (
      <BaseModal ref={ref} title="Set Visibility" enableDynamicSizing={true}>
        <View className="gap-4">
          {SET_TYPES.map((type) => {
            const selected = currentType === type.key

            return (
              <TouchableOpacity
                key={type.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  onSelect(type.key)
                  // @ts-ignore
                  ref?.current?.dismiss()
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
      </BaseModal>
    )
  },
)

VisibilitySelectionModal.displayName = 'VisibilitySelectionModal'

export default VisibilitySelectionModal
