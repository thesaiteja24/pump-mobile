import { Button } from '@/components/ui/buttons/Button'
import { useModalBackHandler, useModalNavigationSync } from '@/hooks/modal'
import { useThemeColor } from '@/hooks/theme'
import { type UpdateState } from '@/types/app-updates'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Text, View } from 'react-native'

type Props = {
  state: UpdateState
  onLater: () => void
  onRestart: () => Promise<void>
  persistOnNavigation?: boolean
}

export const OtaUpdateModal = forwardRef<BottomSheetModal, Props>(
  ({ state, onLater, onRestart, persistOnNavigation = false }, ref) => {
    const isBusy = state !== 'idle'
    const colors = useThemeColor()
    const [isOpen, setIsOpen] = useState(false)

    // 🔒 Immediate synchronous lock (no re-render needed)
    const restartLockedRef = useRef(false)

    const present = useCallback(() => {
      // @ts-ignore
      ref?.current?.present()
    }, [ref])

    const dismiss = useCallback(() => {
      // @ts-ignore
      ref?.current?.dismiss()
    }, [ref])

    // Shared modal logic
    useModalBackHandler(isOpen, dismiss)
    useModalNavigationSync({ isOpen, present, dismiss, persistOnNavigation })

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      ),
      [],
    )

    const snapPoints = useMemo(() => ['50%'], [])

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onChange={(index) => setIsOpen(index >= 0)}
        enablePanDownToClose={!isBusy}
        handleIndicatorStyle={{ backgroundColor: colors.isDark ? '#525252' : '#d1d5db' }}
        enableDynamicSizing={true}
      >
        <BottomSheetView
          className="p-6 pb-10"
          pointerEvents={isBusy ? 'none' : 'auto'}
        >
          <Text className="text-center text-xl font-bold" style={{ color: colors.text }}>
            Update available
          </Text>

          <Text className="mt-3 text-center" style={{ color: colors.neutral[500] }}>
            {state === 'idle' && 'A new version of Pump is ready. Restart to apply it.'}
            {state === 'downloading' && 'Downloading update…'}
            {state === 'restarting' && 'Restarting app…'}
          </Text>

          {/* Progress bar */}
          {state !== 'idle' && (
            <View
              className="mt-5 h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: colors.neutral[200] }}
            >
              <View
                className={`h-full ${state === 'downloading' ? 'w-2/3' : 'w-full'}`}
                style={{ backgroundColor: colors.text }}
              />
            </View>
          )}

          <View className="mt-6 flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Later"
                variant="secondary"
                onPress={onLater}
                disabled={isBusy}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Restart"
                variant="primary"
                onPress={async () => {
                  if (restartLockedRef.current) return
                  restartLockedRef.current = true
                  try {
                    await onRestart()
                  } catch {
                    restartLockedRef.current = false
                  }
                }}
                disabled={isBusy}
                loading={state === 'restarting'}
              />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

OtaUpdateModal.displayName = 'OtaUpdateModal'
