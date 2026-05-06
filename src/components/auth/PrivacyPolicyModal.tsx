import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import PrivacyPolicy from '@/components/ui/PrivacyPolicy'
import { forwardRef } from 'react'

type Props = {
  onAgree: (version?: string) => void
  onClose?: () => void
}

const POLICY_VERSION = '2026-02-13'

const PrivacyPolicyModal = forwardRef<BaseModalHandle, Props>(({ onAgree, onClose }, ref) => {
  return (
    <BaseModal
      ref={ref}
      title="Privacy Policy"
      onDismiss={onClose}
      confirmAction={{
        title: 'I Agree',
        onPress: () => {
          onAgree(POLICY_VERSION)
          ;(ref as React.RefObject<BaseModalHandle>).current?.dismiss()
        },
      }}
      cancelAction={{
        title: 'Close',
        onPress: () => {
          ;(ref as React.RefObject<BaseModalHandle>).current?.dismiss()
        },
      }}
    >
      <PrivacyPolicy />
    </BaseModal>
  )
})

PrivacyPolicyModal.displayName = 'PrivacyPolicyModal'

export default PrivacyPolicyModal
