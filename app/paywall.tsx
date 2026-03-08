import { Paywall } from '@/components/revenueCat/Paywall'
import { useRouter } from 'expo-router'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PaywallScreen() {
	const router = useRouter()

	return (
		<SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-zinc-950">
			<Paywall
				onSuccess={() => {
					if (router.canGoBack()) {
						router.back()
					} else {
						router.replace('/')
					}
				}}
				onCancel={() => {
					if (router.canGoBack()) {
						router.back()
					} else {
						router.replace('/')
					}
				}}
			/>
		</SafeAreaView>
	)
}
