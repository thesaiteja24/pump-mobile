import { OtaUpdateModal } from '@/components/auth/OtaUpdateModal'
import { CustomToast } from '@/components/ui/CustomToast'
import { useSyncQueue } from '@/hooks/useSyncQueue'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import * as Updates from 'expo-updates'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StatusBar, View, useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Toast from 'react-native-toast-message'
import { vexo } from 'vexo-analytics'
import './globals.css'

// ─────────────────────────────────────────────
// Prevent splash auto-hide (explicit release only)
// ─────────────────────────────────────────────
SplashScreen.preventAutoHideAsync()

type UpdateState = 'idle' | 'downloading' | 'restarting'

if (!__DEV__) {
	vexo('8f13f010-99f1-4a89-881b-b1b0d2321412')
}

export default function RootLayout() {
	const colors = useThemeColor()
	const theme = useColorScheme()

	// ───── Fonts ─────
	const [fontsLoaded] = useFonts({
		Monoton: require('../assets/fonts/Monoton-Regular.ttf'),
	})

	// ───── Auth state ─────
	const restoreFromStorage = useAuth(s => s.restoreFromStorage)
	const hasRestored = useAuth(s => s.hasRestored)
	const isAuthenticated = useAuth(s => s.isAuthenticated)

	// ───── OTA state ─────
	const [updateAvailable, setUpdateAvailable] = useState(false)
	const [showOtaModal, setShowOtaModal] = useState(false)
	const [updateState, setUpdateState] = useState<UpdateState>('idle')

	// ───── Subscription state ─────
	const initializeSubscription = useSubscriptionStore(s => s.initialize)
	const loginSubscription = useSubscriptionStore(s => s.login)
	const logoutSubscription = useSubscriptionStore(s => s.logout)
	const { user } = useAuth()

	// ───── Offline sync ─────
	useSyncQueue()

	// ───── Initial Data Fetch ─────
	// useInitialDataFetch();

	// ─────────────────────────────────────────────
	// 1️⃣ Restore auth from storage (once)
	// ─────────────────────────────────────────────
	useEffect(() => {
		restoreFromStorage()
	}, [restoreFromStorage])

	// ─────────────────────────────────────────────
	// 1.5️⃣ Initialize Subscription Store
	// ─────────────────────────────────────────────
	useEffect(() => {
		if (hasRestored) {
			initializeSubscription()
		}
	}, [hasRestored, initializeSubscription])

	// ─────────────────────────────────────────────
	// 1.6️⃣ Sync Subscription Store with Auth
	// ─────────────────────────────────────────────
	useEffect(() => {
		if (hasRestored) {
			if (isAuthenticated && user?.userId) {
				loginSubscription(user.userId)
			} else if (!isAuthenticated) {
				logoutSubscription()
			}
		}
	}, [hasRestored, isAuthenticated, user?.userId, loginSubscription, logoutSubscription])

	// ─────────────────────────────────────────────
	// 2️⃣ Silent OTA check (NO UI, NO splash blocking)
	// ─────────────────────────────────────────────
	useEffect(() => {
		if (!hasRestored) return

		let cancelled = false

		async function checkForUpdates() {
			try {
				const update = await Updates.checkForUpdateAsync()
				if (!cancelled && update.isAvailable) {
					setUpdateAvailable(true)
				}
			} catch (e) {
				if (__DEV__) {
					console.log('OTA check failed:', e)
				}
			}
		}

		checkForUpdates()

		return () => {
			cancelled = true
		}
	}, [hasRestored])

	// ─────────────────────────────────────────────
	// 3️⃣ Release splash when boot is complete
	// ─────────────────────────────────────────────
	useEffect(() => {
		if (fontsLoaded && hasRestored) {
			SplashScreen.hideAsync()
		}
	}, [fontsLoaded, hasRestored])

	// ─────────────────────────────────────────────
	// 4️⃣ Absolute safety: never hang on splash
	// ─────────────────────────────────────────────
	useEffect(() => {
		const timeout = setTimeout(() => {
			if (!hasRestored) {
				console.warn('Auth restore timeout — forcing app start')
				SplashScreen.hideAsync()
			}
		}, 4000)

		return () => clearTimeout(timeout)
	}, [hasRestored])

	// ─────────────────────────────────────────────
	// 5️⃣ Show OTA modal ONLY after login
	// ─────────────────────────────────────────────
	useEffect(() => {
		if (!isAuthenticated) return
		if (!updateAvailable) return

		requestAnimationFrame(() => {
			setShowOtaModal(true)
		})
	}, [isAuthenticated, updateAvailable])

	// ─────────────────────────────────────────────
	// 6️⃣ Fallback loader (should rarely appear)
	// ─────────────────────────────────────────────
	if (!fontsLoaded || !hasRestored) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<ActivityIndicator color={colors.primary} />
			</View>
		)
	}

	// ─────────────────────────────────────────────
	// 7️⃣ App UI
	// ─────────────────────────────────────────────
	return (
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
			<BottomSheetModalProvider>
				<>
					<Stack
						screenOptions={{
							headerShown: false,
							contentStyle: { backgroundColor: colors.background },
						}}
					>
						<Stack.Screen name="index" />
						<Stack.Screen name="(auth)" />
						<Stack.Screen name="(app)" />
					</Stack>

					<StatusBar
						barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
						backgroundColor={colors.background}
					/>

					<Toast
						config={{
							success: props => <CustomToast {...props} type="success" />,
							error: props => <CustomToast {...props} type="error" />,
							info: props => <CustomToast {...props} type="info" />,
						}}
					/>

					<OtaUpdateModal
						visible={showOtaModal}
						state={updateState}
						onLater={() => {
							if (updateState === 'idle') {
								setShowOtaModal(false)
							}
						}}
						onRestart={async () => {
							try {
								setUpdateState('downloading')
								await Updates.fetchUpdateAsync()

								setUpdateState('restarting')
								await Updates.reloadAsync()
							} catch (e) {
								if (__DEV__) {
									console.log('OTA update failed:', e)
								}
								setUpdateState('idle')
							}
						}}
					/>
				</>
			</BottomSheetModalProvider>
		</GestureHandlerRootView>
	)
}
