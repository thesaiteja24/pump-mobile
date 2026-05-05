import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { useThemeColor } from '@/hooks/theme'
import type { SetType } from '@/types/workouts'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { forwardRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const SET_TYPES: {
  key: SetType
  title: string
  description: string
  titleClass: string
}[] = [
  {
    key: 'warmup',
    title: 'Warm Up',
    description: 'Prepare muscles and joints before working sets.',
    titleClass: 'text-yellow-500',
  },
  {
    key: 'working',
    title: 'Working',
    description: 'Primary sets counted toward training volume.',
    titleClass: 'text-black dark:text-white',
  },
  {
    key: 'failureSet',
    title: 'Failure',
    description: 'Performed until no further reps are possible.',
    titleClass: 'text-red-600',
  },
  {
    key: 'dropSet',
    title: 'Drop Set',
    description: 'Reduce weight and continue immediately after failure.',
    titleClass: 'text-primary font-semibold',
  },
]

type Props = {
  currentType: SetType
  onSelect: (type: SetType) => void
  onClose?: () => void
}

const SetTypeSelectionModal = forwardRef<BaseModalHandle, Props>(
  ({ currentType, onSelect, onClose }, ref) => {
    const colors = useThemeColor()

    return (
      <BaseModal ref={ref} title="Set Type" enableDynamicSizing={true}>
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
                className={`rounded-xl border p-4 ${
                  selected
                    ? 'border-primary bg-blue-50 dark:bg-blue-950'
                    : 'border-neutral-300 dark:border-neutral-700'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <Text className={`text-lg font-bold ${type.titleClass}`}>{type.title}</Text>

                    <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
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

SetTypeSelectionModal.displayName = 'SetTypeSelectionModal'

export default SetTypeSelectionModal
