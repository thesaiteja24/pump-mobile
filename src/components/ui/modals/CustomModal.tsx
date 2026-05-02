import { Button } from '@/components/ui/buttons/Button'
import { useThemeColor } from '@/hooks/theme'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Modal, Pressable, Text, View } from 'react-native'

export interface ModalHandle {
  present: () => void
  dismiss: () => void
  /** @deprecated use present */
  open: () => void
  /** @deprecated use dismiss */
  close: () => void
}

type Props = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => Promise<void> | void
  onCancel?: () => void
  children?: React.ReactNode
  floating?: boolean
}

export const CustomModal = forwardRef<ModalHandle, Props>(
  (
    {
      title = 'Confirm',
      description,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      onConfirm,
      onCancel,
      children,
      floating = false,
    },
    ref,
  ) => {
    const colors = useThemeColor()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const present = useCallback(() => {
      setIsLoading(false)
      if (floating) {
        setIsOpen(true)
      } else {
        bottomSheetModalRef.current?.present()
      }
    }, [floating])

    const dismiss = useCallback(() => {
      if (floating) {
        setIsOpen(false)
      } else {
        bottomSheetModalRef.current?.dismiss()
      }
    }, [floating])

    useImperativeHandle(ref, () => ({
      present,
      dismiss,
      open: present,
      close: dismiss,
    }))


    const handleConfirm = async () => {
      if (isLoading) return

      try {
        setIsLoading(true)
        await onConfirm?.()
        dismiss()
      } finally {
        setIsLoading(false)
      }
    }

    const handleCancel = () => {
      onCancel?.()
      dismiss()
    }

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      ),
      [],
    )

    const snapPoints = useMemo(() => ['40%'], [])

    const ModalContent = (
      <View className={floating ? 'p-6' : 'p-6 pb-10'}>
        {/* Title */}
        <Text className="text-center text-xl font-bold" style={{ color: colors.text }}>
          {title}
        </Text>

        {/* Description */}
        {description ? (
          <Text className="mt-3 text-center text-base" style={{ color: colors.neutral[500] }}>
            {description}
          </Text>
        ) : null}

        {/* Custom Body (replaces Default Actions if provided) */}
        {children ? (
          <View className="mt-4">{children}</View>
        ) : (
          <View className="mt-8 flex-row gap-3">
            {cancelText && (
              <Button
                className="flex-1"
                title={cancelText}
                variant="danger"
                disabled={isLoading}
                onPress={handleCancel}
              />
            )}

            {confirmText && (
              <Button
                className="flex-1"
                title={confirmText}
                variant="primary"
                loading={isLoading}
                onPress={handleConfirm}
              />
            )}
          </View>
        )}
      </View>
    )

    if (floating) {
      return (
        <Modal
          transparent
          visible={isOpen}
          animationType="fade"
          onRequestClose={dismiss}
          statusBarTranslucent
        >
          <Pressable
            className="flex-1 items-center justify-center bg-black/40 px-6"
            onPress={dismiss}
          >
            <Pressable
              className="w-full overflow-hidden rounded-3xl"
              style={{ backgroundColor: colors.background }}
              onPress={(e) => e.stopPropagation()}
            >
              {ModalContent}
            </Pressable>
          </Pressable>
        </Modal>
      )
    }

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onChange={(index) => setIsOpen(index >= 0)}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: colors.isDark ? '#525252' : '#d1d5db' }}
        backgroundStyle={{ backgroundColor: colors.background }}
        enableDynamicSizing={true}
        animationConfigs={{ duration: 350 }}
      >
        <BottomSheetView>{ModalContent}</BottomSheetView>
      </BottomSheetModal>
    )
  },
)

CustomModal.displayName = 'CustomModal'
