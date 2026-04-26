import { Button } from '@/components/ui/buttons/Button'
import { GlassView } from '@/components/ui/GlassView'
import { useThemeColor } from '@/hooks/theme'
import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { Pressable, Modal as RNModal, Text, View } from 'react-native'

export interface ModalHandle {
  open: () => void
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
    },
    ref,
  ) => {
    const colors = useThemeColor()

    const [visible, setVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useImperativeHandle(ref, () => ({
      open: () => {
        setIsLoading(false)
        setVisible(true)
      },
      close: () => {
        setVisible(false)
      },
    }))

    const handleConfirm = async () => {
      if (isLoading) return

      try {
        setIsLoading(true)
        await onConfirm?.()
        setVisible(false)
      } finally {
        setIsLoading(false)
      }
    }

    const handleCancel = () => {
      onCancel?.()
      setVisible(false)
    }

    return (
      <RNModal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
        {/* Backdrop */}
        <Pressable className="flex-1 bg-black/40" onPress={handleCancel} />

        {/* Centered modal */}
        <View className="absolute inset-0 items-center justify-center px-6">
          <GlassView className="w-full p-6 shadow-lg">
            {/* Title */}
            <Text className="text-center text-xl font-bold" style={{ color: colors.text }}>
              {title}
            </Text>

            {/* Description */}
            {description ? (
              <Text className="mt-3 text-justify text-base" style={{ color: colors.neutral[500] }}>
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
                    liquidGlass
                  />
                )}

                {confirmText && (
                  <Button
                    className="flex-1"
                    title={confirmText}
                    variant="primary"
                    loading={isLoading}
                    onPress={handleConfirm}
                    liquidGlass
                  />
                )}
              </View>
            )}
          </GlassView>
        </View>
      </RNModal>
    )
  },
)

CustomModal.displayName = 'CustomModal'
