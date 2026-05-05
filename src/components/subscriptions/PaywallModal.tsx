import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { useRouter } from 'expo-router'
import { forwardRef } from 'react'

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
}

export const PaywallModal = forwardRef<BaseModalHandle, Props>(
  (
    {
      title = 'Upgrade to Pro',
      description = 'You have reached the free limit. Upgrade to Pro to unlock this feature.',
      continueText = 'Continue',
      cancelText = 'Not now',
      onContinue,
      onCancel,
    },
    ref,
  ) => {
    const router = useRouter()

    const handleContinue = () => {
      // @ts-ignore
      ref?.current?.dismiss()
      if (onContinue) {
        onContinue()
      } else {
        router.push('/paywall')
      }
    }

    return (
      <BaseModal
        ref={ref}
        title={title}
        description={description}
        enableDynamicSizing={true}
        confirmAction={{
          title: continueText,
          onPress: handleContinue,
        }}
        cancelAction={{
          title: cancelText,
          onPress: () => {
            // @ts-ignore
            ref?.current?.dismiss()
            onCancel?.()
          },
        }}
      />
    )
  },
)

PaywallModal.displayName = 'PaywallModal'
