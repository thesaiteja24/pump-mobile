import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { Button } from '@/components/ui/buttons/Button'
import * as Haptics from 'expo-haptics'
import { forwardRef, useMemo } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

/* ───────────────── Constants ───────────────── */

const RPE_VALUES = [10, 9.5, 9, 8.5, 8, 7.5, 7] as const

const RPE_DESCRIPTIONS: Record<number, string> = {
  10: 'Max effort. No reps left in reserve.',
  9.5: 'Near max. Maybe half a rep left.',
  9: 'Very hard. One rep left in reserve.',
  8.5: 'Hard. One to two reps left.',
  8: 'Challenging but controlled.',
  7.5: 'Moderate-hard training effort.',
  7: 'Comfortably challenging.',
}

/* ───────────────── Handle & Props ───────────────── */

type Props = {
  currentValue?: number | null // 0 / undefined = unset
  onClose?: () => void
  onSelect: (value?: number) => void // undefined = reset
}

/* ───────────────── Component ───────────────── */

const RPESelectionModal = forwardRef<BaseModalHandle, Props>(
  ({ currentValue, onClose, onSelect }, ref) => {
    const selectedValue = currentValue && currentValue > 0 ? currentValue : null

    const description = useMemo(() => {
      if (!selectedValue) {
        return 'Select perceived effort for this set.'
      }
      return RPE_DESCRIPTIONS[selectedValue]
    }, [selectedValue])

    return (
      <BaseModal ref={ref} title="RPE" enableDynamicSizing={true}>
        <View className="px-6">
          <View className="flex-row">
            {/* ───── Left: Scale ───── */}
            <View className="flex-1 items-center">
              <View className="gap-4 rounded-full bg-slate-50 px-2 py-4 dark:bg-neutral-800">
                {RPE_VALUES.map((value) => {
                  const isSelected = value === selectedValue

                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

                        if (isSelected) {
                          onSelect(undefined)
                        } else {
                          onSelect(value)
                        }
                      }}
                      className={`flex-row items-center justify-center gap-4 px-2 ${
                        isSelected ? 'rounded-full bg-blue-100 dark:bg-blue-900' : ''
                      }`}
                    >
                      <Text
                        className={`text-center text-base ${
                          isSelected
                            ? 'font-semibold text-primary'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* ───── Right: Detail ───── */}
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-4xl font-bold text-black dark:text-white">
                {selectedValue ?? '--'}
              </Text>

              <Text className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
                {description}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="mt-6">
            <Button
              title="Done"
              variant="primary"
              onPress={() => {
                // @ts-ignore
                ref?.current?.dismiss()
              }}
            />
          </View>

          {/* Footer hint */}
          <Text className="mt-4 text-center text-xs text-neutral-400">
            Tap selected value again to clear RPE
          </Text>
        </View>
      </BaseModal>
    )
  },
)

RPESelectionModal.displayName = 'RPESelectionModal'

export default RPESelectionModal
