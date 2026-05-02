import { Button } from '@/components/ui/buttons/Button'
import { useModalBackHandler } from '@/hooks/modal'
import { useThemeColor } from '@/hooks/theme'
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'

export interface PrivacyPolicyModalHandle {
  present: () => void
  dismiss: () => void
}

type Props = {
  onAgree: (version?: string) => void
  onClose?: () => void
  persistOnNavigation?: boolean
}

const PrivacyPolicyModal = forwardRef<PrivacyPolicyModalHandle, Props>(
  ({ onAgree, onClose, persistOnNavigation = false }, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const insets = useSafeAreaInsets()
    const isDark = useColorScheme() === 'dark'
    const colors = useThemeColor()
    const [isOpen, setIsOpen] = useState(false)

    const [policyVersion, setPolicyVersion] = useState<string | null>(null)

    const injectedJS = `
    (function() {
      const meta = document.querySelector('meta[name="privacy_policy"]');
      const version = meta ? meta.getAttribute("content") : null;

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "privacy_version",
            value: version
          })
        );
      }
    })();
    true;
    `

    const present = useCallback(() => {
      setPolicyVersion(null)
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

    const snapPoints = useMemo(() => ['90%'], [])

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
      ),
      [],
    )

    return (
      <BottomSheetModal
        enableContentPanningGesture={false}
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        enableDynamicSizing={false}
        onDismiss={() => {
          setIsOpen(false)
          onClose?.()
        }}
        onChange={(index) => setIsOpen(index >= 0)}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#525252' : '#d1d5db',
        }}
        backgroundStyle={{ backgroundColor: colors.background }}
        animationConfigs={{ duration: 350 }}
      >
        <View
          style={{
            flex: 1,
            paddingBottom: insets.bottom,
          }}
        >
          <View className="flex-1 p-4">
            <WebView
              style={{
                flex: 1,
              }}
              source={{
                uri: 'https://pump.thesaiteja.dev/privacy-policy',
              }}
              startInLoadingState
              onMessage={(event) => {
                const data = JSON.parse(event.nativeEvent.data)
                if (data.type === 'privacy_version') {
                  setPolicyVersion(data.value)
                }
              }}
              injectedJavaScript={injectedJS}
            />
          </View>

          <View
            className="flex flex-row items-center justify-center gap-4 border-t px-4 pb-4 pt-2"
            style={{ borderTopColor: colors.border }}
          >
            <View className="flex-1">
              <Button
                title="I Agree"
                fullWidth
                variant="success"
                onPress={() => {
                  onAgree(policyVersion || undefined)
                  dismiss()
                }}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Close"
                fullWidth
                variant="danger"
                onPress={() => {
                  dismiss()
                }}
              />
            </View>
          </View>
        </View>
      </BottomSheetModal>
    )
  },
)

PrivacyPolicyModal.displayName = 'PrivacyPolicyModal'

export default PrivacyPolicyModal
