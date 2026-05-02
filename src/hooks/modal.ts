import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useRef } from 'react'
import { BackHandler } from 'react-native'

/**
 * Handles the hardware back button (Android) to dismiss the modal.
 *
 * @param isOpen - Current open state of the modal
 * @param dismiss - Function to call to dismiss the modal
 */
export function useModalBackHandler(isOpen: boolean, dismiss: () => void) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isOpen) {
        dismiss()
        return true // consume back press
      }
      return false // allow navigation
    })

    return () => subscription.remove()
  }, [isOpen, dismiss])
}

/**
 * Synchronizes modal state with navigation focus.
 * Closes the modal on blur and optionally re-opens on focus if persistOnNavigation is true.
 *
 * @param isOpen - Current open state of the modal
 * @param present - Function to call to open the modal
 * @param dismiss - Function to call to dismiss the modal
 * @param persistOnNavigation - Whether the modal should re-open when returning to the screen
 */
export function useModalNavigationSync({
  isOpen,
  present,
  dismiss,
  persistOnNavigation = false,
}: {
  isOpen: boolean
  present: () => void
  dismiss: () => void
  persistOnNavigation?: boolean
}) {
  const shouldReopenRef = useRef(false)
  const isOpenRef = useRef(isOpen)

  // Keep ref in sync
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useFocusEffect(
    useCallback(() => {
      // On Focus: Re-open if it was open before blur
      if (shouldReopenRef.current) {
        present()
        shouldReopenRef.current = false
      }

      return () => {
        // On Blur: Close and potentially mark for re-opening
        // We use the ref here to check the LATEST state without re-running the effect when isOpen changes
        if (isOpenRef.current) {
          if (persistOnNavigation) {
            shouldReopenRef.current = true
          }
          dismiss()
        }
      }
    }, [present, dismiss, persistOnNavigation]), // Removed isOpen from dependencies
  )
}
