import { Button } from '@/components/ui/buttons/Button'
import { useModalBackHandler, useModalNavigationSync } from '@/hooks/modal'
import { useThemeColor } from '@/hooks/theme'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface PaywallModalHandle {
  present: () => void
  dismiss: () => void
}

type Props = {
  title?: string
  description?: string
  continueText?: string
  cancelText?: string
  /**
   * Optional callback when continue is pressed.
   * If not provided, it defaults to navigating to '/paywall'.
   */
  onContinue?: () => void
  /**
   * Optional callback when cancel is pressed.
   */
  onCancel?: () => void
  persistOnNavigation?: boolean
}

export const PaywallModal = forwardRef<PaywallModalHandle, Props>(
  (
    {
      title = 'Upgrade to Pro',
      description = 'You have reached the free limit. Upgrade to Pro to unlock this feature.',
      continueText = 'Continue',
      cancelText = 'Not now',
      onContinue,
      onCancel,
      persistOnNavigation = false,
    },
    ref,
  ) => {
    const colors = useThemeColor()
    const isDark = useColorScheme() === 'dark'
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const insets = useSafeAreaInsets()
    const router = useRouter()
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

    const handleContinue = () => {
      // If we persist on navigation, we don't dismiss manually.
      // useModalNavigationSync will handle dismissal on blur and set the reopen flag.
      if (!persistOnNavigation) {
        dismiss()
      }
      if (onContinue) {
        onContinue()
      } else {
        router.push('/paywall')
      }
    }

    return (
      <BottomSheetModal
        stackBehavior="push"
        ref={bottomSheetModalRef}
        backdropComponent={renderBackdrop}
        enableDynamicSizing
        onChange={(index) => setIsOpen(index >= 0)}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#525252' : '#d1d5db',
        }}
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
            {/* Not now */}
            <Button
              className="flex-1"
              title={cancelText}
              variant="secondary"
              onPress={() => {
                dismiss()
                onCancel?.()
              }}
            />

            {/* Continue */}
            <Button
              className="flex-1"
              title={continueText}
              variant="primary"
              onPress={handleContinue}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

PaywallModal.displayName = 'PaywallModal'
