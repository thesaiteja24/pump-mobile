import { useSubscriptionStore } from '@/stores/subscriptionStore'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, useColorScheme, View } from 'react-native'
import Modal from 'react-native-modal'
import { PurchasesPackage } from 'react-native-purchases'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

interface PaywallProps {
	isVisible?: boolean
	onSuccess?: () => void
	onCancel?: () => void
}

export function Paywall({ isVisible = true, onSuccess, onCancel }: PaywallProps) {
	const scheme = useColorScheme()

	const { offerings, isLoadingOfferings, isPurchasing, fetchOfferings, purchasePackage, restorePurchases } =
		useSubscriptionStore()
	console.log('offerings', JSON.stringify(offerings))

	const [selected, setSelected] = useState<PurchasesPackage | null>(null)

	useEffect(() => {
		if (isVisible) {
			fetchOfferings()
		}
	}, [fetchOfferings, isVisible])

	useEffect(() => {
		if (offerings.length) {
			// default select yearly if exists
			const yearly = offerings.find(o => o.identifier.includes('annual')) ?? offerings[0]
			setSelected(yearly)
		}
	}, [offerings])

	const handlePurchase = async () => {
		if (!selected) return

		try {
			const success = await purchasePackage(selected)

			if (success) {
				Toast.show({
					type: 'success',
					text1: 'Welcome to Pro',
				})

				onSuccess?.()
			}
		} catch (error: any) {
			if (!error.userCancelled) {
				Toast.show({
					type: 'error',
					text1: 'Purchase failed',
					text2: error.message,
				})
			}
		}
	}

	const renderContent = () => {
		if (isLoadingOfferings) {
			return (
				<View className="flex-1 items-center justify-center bg-white dark:bg-black">
					<ActivityIndicator size="large" color="#3b82f6" />
				</View>
			)
		}

		return (
			<SafeAreaView
				edges={['top', 'bottom']}
				className="flex-1 justify-between bg-white px-6 pb-8 pt-10 dark:bg-black"
			>
				{/* HERO */}
				<View className="items-center px-4">
					<Text className="text-4xl font-extrabold text-black dark:text-white">Train Smarter</Text>
					<Text className="mt-2 text-lg font-medium text-blue-500">Stronger every day for less than ₹10</Text>
					<Text className="mt-4 text-center text-base leading-6 text-zinc-500 dark:text-zinc-400">
						Unlock unlimited templates, advanced analytics, and your AI training coach.
					</Text>
				</View>

				{/* PRICING CARDS */}
				<View className="flex-row justify-center gap-3">
					{offerings.map(pack => {
						const isSelected = selected?.identifier === pack.identifier

						const badge = pack.identifier.includes('annual')
							? 'SAVE 58%'
							: pack.identifier.includes('lifetime')
								? 'BEST VALUE'
								: null

						return (
							<Pressable
								key={pack.identifier}
								onPress={() => setSelected(pack)}
								className={`relative flex-1 rounded-3xl border-2 p-4 ${
									isSelected
										? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40'
										: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
								}`}
							>
								{badge && (
									<View className="absolute -top-3.5 left-0 right-0 z-10 items-center justify-center">
										<View className="rounded-full bg-blue-500 px-3 py-1 shadow-sm">
											<Text className="text-[10px] font-bold tracking-wider text-white">
												{badge}
											</Text>
										</View>
									</View>
								)}

								<Text className="text-center text-xs font-bold tracking-widest text-zinc-400 dark:text-zinc-500">
									PRO
								</Text>

								<Text className="mt-1 text-center text-sm font-extrabold tracking-wide text-black dark:text-white">
									{pack.product.title.replace('Pro ', '').toUpperCase()}
								</Text>

								<Text className="mt-4 text-center text-xl font-black tracking-tight text-black dark:text-white">
									{pack.product.price}
								</Text>

								<Text className="mt-1 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
									{pack.identifier.includes('monthly') && 'Billed monthly'}
									{pack.identifier.includes('annual') && 'Billed annually'}
									{pack.identifier.includes('lifetime') && 'Pay once'}
								</Text>
							</Pressable>
						)
					})}
				</View>

				{/* CTA */}
				<View className="mt-6">
					<Pressable
						onPress={handlePurchase}
						disabled={!selected || isPurchasing}
						className="items-center justify-center rounded-2xl bg-blue-500 py-4 shadow-sm active:bg-blue-600"
					>
						<Text className="text-lg font-bold text-white">
							{selected ? `Subscribe to ${selected.product.title}` : 'Continue'}
						</Text>
					</Pressable>

					<Pressable onPress={() => restorePurchases()} className="mt-6 p-2">
						<Text className="text-center font-medium text-zinc-500 dark:text-zinc-400">
							Restore Purchases
						</Text>
					</Pressable>

					{onCancel && (
						<Pressable onPress={onCancel} className="mt-2 p-2">
							<Text className="text-center font-medium text-zinc-400 dark:text-zinc-500">Not now</Text>
						</Pressable>
					)}
				</View>

				{isPurchasing && (
					<View className="absolute inset-0 items-center justify-center bg-white/60 dark:bg-black/60">
						<ActivityIndicator size="large" color="#3b82f6" />
					</View>
				)}
			</SafeAreaView>
		)
	}

	return (
		<Modal
			isVisible={isVisible}
			style={{ margin: 0 }}
			animationIn="slideInUp"
			animationOut="slideOutDown"
			backdropOpacity={1}
			backdropColor={scheme === 'dark' ? '#000' : '#fff'}
			useNativeDriver
			hideModalContentWhileAnimating
		>
			{renderContent()}
		</Modal>
	)
}
