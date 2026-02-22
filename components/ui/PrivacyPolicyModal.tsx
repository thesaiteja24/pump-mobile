import { Button } from '@/components/ui/Button'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
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
}

const PrivacyPolicyModal = forwardRef<PrivacyPolicyModalHandle, Props>(({ onAgree, onClose }, ref) => {
	const bottomSheetModalRef = useRef<BottomSheetModal>(null)
	const insets = useSafeAreaInsets()
	const isDark = useColorScheme() === 'dark'

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

	useImperativeHandle(ref, () => ({
		present: () => {
			setPolicyVersion(null)
			setIsOpen(true)
			bottomSheetModalRef.current?.present()
		},
		dismiss: () => {
			bottomSheetModalRef.current?.dismiss()
		},
	}))

	const snapPoints = useMemo(() => ['95%'], [])

	const renderBackdrop = useCallback(
		(props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />,
		[]
	)

	return (
		<BottomSheetModal
			enableContentPanningGesture={false}
			ref={bottomSheetModalRef}
			snapPoints={snapPoints}
			backdropComponent={renderBackdrop}
			enablePanDownToClose
			onDismiss={() => {
				setIsOpen(false)
				onClose?.()
			}}
			backgroundStyle={{
				backgroundColor: isDark ? '#171717' : 'white',
			}}
			handleIndicatorStyle={{
				backgroundColor: isDark ? '#525252' : '#d1d5db',
			}}
			animationConfigs={{ duration: 350 }}
		>
			<BottomSheetView
				style={{
					flex: 1,
					height: '100%',
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
						onMessage={event => {
							const data = JSON.parse(event.nativeEvent.data)
							if (data.type === 'privacy_version') {
								setPolicyVersion(data.value)
							}
						}}
						injectedJavaScript={injectedJS}
					/>
				</View>

				<View className="flex flex-row items-center justify-center gap-4 border-t border-gray-200 px-4 pb-4 pt-2 dark:border-gray-800">
					<View>
						<Button
							title="I Agree"
							fullWidth
							variant="success"
							onPress={() => {
								onAgree(policyVersion || undefined)
								bottomSheetModalRef.current?.dismiss()
							}}
						/>
					</View>
					<View>
						<Button
							title="Close"
							variant="danger"
							onPress={() => {
								bottomSheetModalRef.current?.dismiss()
							}}
						/>
					</View>
				</View>
			</BottomSheetView>
		</BottomSheetModal>
	)
})

PrivacyPolicyModal.displayName = 'PrivacyPolicyModal'

export default PrivacyPolicyModal
