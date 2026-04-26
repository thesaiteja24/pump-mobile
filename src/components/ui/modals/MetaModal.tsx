import { useModalBackHandler, useModalNavigationSync } from '@/hooks/modal'
import { useThemeColor } from '@/hooks/theme'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MetaItem } from '@/types/meta'

export interface MetaModalHandle {
  present: () => void
  dismiss: () => void
}

type Props = {
  title: string
  loading: boolean
  enableCreate?: boolean
  items: MetaItem[]
  onClose?: () => void
  onSelect: (item: MetaItem) => void
  onLongPress?: (item: MetaItem) => void
  onCreatePress?: () => void
  persistOnNavigation?: boolean
}

const MetaModal = forwardRef<MetaModalHandle, Props>(
  ({
    title,
    loading,
    enableCreate,
    items,
    onClose,
    onSelect,
    onLongPress,
    onCreatePress,
    persistOnNavigation = false,
  }, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const insets = useSafeAreaInsets()
    const colors = useThemeColor()
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
        <View style={{ flex: 1, paddingBottom: insets.bottom }}>
          <View className="px-6 pt-4">
            <View
              className={`flex-row items-center ${
                onCreatePress && enableCreate ? 'justify-between' : 'justify-center'
              } mb-6`}
            >
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {title}
              </Text>

              {onCreatePress && enableCreate && (
                <TouchableOpacity onPress={onCreatePress}>
                  <Text className="text-xl text-primary">Create</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator animating size="large" />
            </View>
          ) : (
            <BottomSheetScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 24,
              }}
              showsVerticalScrollIndicator={false}
            >
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
        </View>
      </BottomSheetModal>
    )
  },
)

MetaModal.displayName = 'MetaModal'

export default MetaModal
