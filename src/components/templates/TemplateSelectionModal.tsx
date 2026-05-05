import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { useThemeColor } from '@/hooks/theme'
import { WorkoutTemplate } from '@/types/templates'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { forwardRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

type Props = {
  templates: WorkoutTemplate[]
  onSelect: (templateId: string) => void
  onClose?: () => void
}

const TemplateSelectionModal = forwardRef<BaseModalHandle, Props>(
  ({ templates, onSelect, onClose }, ref) => {
    const colors = useThemeColor()

    return (
      <BaseModal ref={ref} title="Select a Template" onDismiss={onClose}>
        <BottomSheetScrollView style={{ height: 500 }} showsVerticalScrollIndicator={false}>
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
                    // @ts-ignore
                    ref?.current?.dismiss()
                  }}
                  className="rounded-xl border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <Text className="text-lg font-bold text-black dark:text-white">{type.title}</Text>
                  <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {type.exercises.length} exercises
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </BottomSheetScrollView>
      </BaseModal>
    )
  },
)

TemplateSelectionModal.displayName = 'TemplateSelectionModal'
export default TemplateSelectionModal
