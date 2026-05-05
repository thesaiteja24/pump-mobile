import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { useThemeColor } from '@/hooks/theme'
import { MetaItem } from '@/types/meta'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { forwardRef } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  title: string
  loading: boolean
  enableCreate?: boolean
  items: MetaItem[]
  onClose?: () => void
  onSelect: (item: MetaItem) => void
  onLongPress?: (item: MetaItem) => void
  onCreatePress?: () => void
}

const MetaModal = forwardRef<BaseModalHandle, Props>(
  ({ title, loading, enableCreate, items, onClose, onSelect, onLongPress, onCreatePress }, ref) => {
    const colors = useThemeColor()

    return (
      <BaseModal
        ref={ref}
        title={title}
        onDismiss={onClose}
        headerRight={
          onCreatePress && enableCreate ? (
            <TouchableOpacity onPress={onCreatePress}>
              <Text className="text-lg text-primary">Create</Text>
            </TouchableOpacity>
          ) : undefined
        }
      >
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator animating size="large" />
          </View>
        ) : (
          <BottomSheetScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center justify-between pb-4"
                onPress={() => onSelect(item)}
                onLongPress={() => onLongPress?.(item)}
                delayLongPress={700}
              >
                <Text className="text-xl font-semibold" style={{ color: colors.text }}>
                  {item.title}
                </Text>

                <Image
                  source={item.thumbnailUrl}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 100,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.isDark ? colors.neutral[800] : colors.white,
                  }}
                  contentFit="contain"
                />
              </TouchableOpacity>
            ))}
          </BottomSheetScrollView>
        )}
      </BaseModal>
    )
  },
)

MetaModal.displayName = 'MetaModal'

export default MetaModal
