import { Button } from '@/components/ui/buttons/Button'
import { useModalBackHandler, useModalNavigationSync } from '@/hooks/modal'
import { useThemeColor } from '@/hooks/theme'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface DeleteConfirmModalHandle {
  present: () => void
  dismiss: () => void
}

type Props = {
  title?: string
  description?: string
  onCancel?: () => void
  onConfirm: () => Promise<void> | void
  confirmText?: string
  persistOnNavigation?: boolean
}

export const DeleteConfirmModal = forwardRef<DeleteConfirmModalHandle, Props>(
  (
    {
      title = 'Delete item?',
      description = 'This action cannot be undone.',
      onCancel,
      onConfirm,
      confirmText = 'Delete',
      persistOnNavigation = false,
    },
    ref,
  ) => {
    const colors = useThemeColor()
    const isDark = useColorScheme() === 'dark'
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const insets = useSafeAreaInsets()

    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const present = useCallback(() => {
      setIsLoading(false)
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

    const handleConfirm = async () => {
      if (isLoading) return

      try {
        setIsLoading(true)
        await onConfirm()
        dismiss()
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        backdropComponent={renderBackdrop}
        enableDynamicSizing
        onDismiss={() => {
          setIsOpen(false)
          onCancel?.()
        }}
        onChange={(index) => setIsOpen(index >= 0)}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#525252' : '#d1d5db',
        }}
        backgroundStyle={{ backgroundColor: colors.background }}
        animationConfigs={{ duration: 350 }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 24 }} className="px-6 pt-2">
          <Text className="text-center text-xl font-bold" style={{ color: colors.text }}>
            {title}
          </Text>

          <Text className="mt-3 text-center text-base" style={{ color: colors.neutral[500] }}>
            {description}
          </Text>

          <View className="mt-8 flex-1 flex-row gap-3">
            {/* Cancel */}
            <Button
              className="flex-1"
              title="Cancel"
              variant="secondary"
              disabled={isLoading}
              onPress={() => {
                onCancel?.()
                dismiss()
              }}
            />

            {/* Delete */}
            <Button
              className="flex-1"
              title={confirmText}
              variant="danger"
              loading={isLoading}
              onPress={handleConfirm}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

DeleteConfirmModal.displayName = 'DeleteConfirmModal'
