import { Button } from '@/components/ui/Button'
import { useThemeColor } from '@/hooks/useThemeColor'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GlassBackground } from '@/components/ui/GlassBackground'

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
		},
		ref
	) => {
		const colors = useThemeColor()
		const isDark = useColorScheme() === 'dark'
		const bottomSheetModalRef = useRef<BottomSheetModal>(null)
		const insets = useSafeAreaInsets()
		const router = useRouter()

		useImperativeHandle(ref, () => ({
			present: () => {
				bottomSheetModalRef.current?.present()
			},
			dismiss: () => {
				bottomSheetModalRef.current?.dismiss()
			},
		}))

		const renderBackdrop = useCallback(
			(props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
			[]
		)

		const handleContinue = () => {
			bottomSheetModalRef.current?.dismiss()
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
				backgroundComponent={GlassBackground}
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
								bottomSheetModalRef.current?.dismiss()
								onCancel?.()
							}}
							liquidGlass
						/>

						{/* Continue */}
						<Button
							className="flex-1"
							title={continueText}
							variant="primary"
							onPress={handleContinue}
							liquidGlass
						/>
					</View>
				</BottomSheetView>
			</BottomSheetModal>
		)
	}
)

PaywallModal.displayName = 'PaywallModal'
