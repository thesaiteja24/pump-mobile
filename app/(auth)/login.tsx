import GoogleIcon from '@/assets/components/icons/Google'
import PhoneInputField from '@/components/auth/PhoneInputField'
import { Button } from '@/components/ui/Button'
import PrivacyPolicyModal, { PrivacyPolicyModalHandle } from '@/components/ui/PrivacyPolicyModal'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { useOnboarding } from '@/stores/onboardingStore'
import { useUser } from '@/stores/userStore'
import { User } from '@/types/auth'
import { calculateBMR, calculateDailyTargets, calculateTDEE } from '@/utils/analytics'
import {
	updateFitnessProfileService,
	updateNutritionPlanService,
} from '@/services/analyticsService'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { router } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
	ActivityIndicator,
	Keyboard,
	KeyboardAvoidingView,
	Pressable,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function Login() {
	const colors = useThemeColor()
	const [phone, setPhone] = useState('')
	const [country, setCountry] = useState({
		name: 'India',
		dial_code: '+91',
		code: 'IN',
	})
	const [privacyAccepted, setPrivacyAccepted] = useState(false)
	const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState<string | null>(null)
	const privacyModalRef = useRef<PrivacyPolicyModalHandle>(null)

	const sendOtp = useAuth((state: any) => state.sendOtp)
	const isLoading = useAuth((state: any) => state.isLoading)
	const googleLogin = useAuth((state: any) => state.googleLogin)
	const isGoogleLoading = useAuth((state: any) => state.isGoogleLoading)

	const updateUserData = useUser(state => state.updateUserData)
	const updatePreferences = useUser(state => state.updatePreferences)

	const opacity = useSharedValue(0)
	const translateY = useSharedValue(20)
	const pumpScale = useSharedValue(0.8)

	useEffect(() => {
		GoogleSignin.configure({
			webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
			iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
			offlineAccess: true,
			forceCodeForRefreshToken: true,
		})
	}, [])

	const onGoogleButtonPress = async () => {
		try {
			await GoogleSignin.hasPlayServices()
			await GoogleSignin.signOut()
			const userInfo = await GoogleSignin.signIn()
			const idToken = userInfo.data?.idToken

			if (idToken) {
				googleLogin(idToken, true, privacyPolicyVersion).then((res: any) => {
					if (res.success) {
						handlePostLogin(res.data?.user)
					} else {
						Toast.show({
							type: 'error',
							text1: res.error?.message || 'Google Login Failed',
						})
					}
				})
			}
		} catch (error: any) {
			console.error(error)
		}
	}

	const PHONE_ENABLED = false

	// Onboarding Store
	const { hasData, getPayload, reset: resetOnboarding } = useOnboarding.getState()
	const completeOnboarding = useAuth(s => s.completeOnboarding)

	const onContinue = async () => {
		Keyboard.dismiss()

		try {
			const payload = { countryCode: country.dial_code, phone, resend: false }
			const response = await sendOtp(payload)

			if (response.success) {
				// Navigate to OTP verification screen
				router.push({
					pathname: '/(auth)/verify-otp',
					params: {
						data: JSON.stringify({
							countryCode: payload.countryCode,
							phone: payload.phone,
							privacyAccepted: true, // Phone login implies acceptance if checkbox is checked
							privacyPolicyVersion: privacyPolicyVersion,
						}),
					},
				})
				Toast.show({
					type: 'success',
					text1: response.message || 'OTP sent successfully',
				})
			} else {
				Toast.show({
					type: 'error',
					text1: response.error?.message || 'Failed to send OTP',
				})
			}
		} catch (error: any) {
			Toast.show({
				type: 'error',
				text1: error?.message || 'Failed to send OTP',
			})
		}
	}

	const handlePostLogin = async (user: User) => {
		// 1. Sync Onboarding Data if exists
		if (hasData()) {
			const onBoardingPayload = getPayload()

			const userData = {
				height: onBoardingPayload.height,
				weight: onBoardingPayload.weight,
				dateOfBirth: onBoardingPayload.dateOfBirth,
				gender: onBoardingPayload.gender as any,
			}
			const preferences = {
				preferredWeightUnit: onBoardingPayload.weightUnit as any,
				preferredLengthUnit: onBoardingPayload.heightUnit as any,
			}
			const { setUser } = useAuth.getState()
			setUser({ ...userData, ...preferences })

			await updateUserData(user.userId!, userData)
			await updatePreferences(user.userId!, preferences)

			if (onBoardingPayload.fitnessProfile) {
				const fp = onBoardingPayload.fitnessProfile

				// Compute targets
				const age = new Date().getFullYear() - new Date(onBoardingPayload.dateOfBirth!).getFullYear()
				const bmr = calculateBMR(
					Number(onBoardingPayload.weight),
					Number(onBoardingPayload.height),
					age,
					onBoardingPayload.gender as any
				)
				const tdee = calculateTDEE(bmr, fp.activityLevel as any)

				const computedTargets = calculateDailyTargets({
					tdee,
					weightKg: Number(onBoardingPayload.weight),
					goal: fp.fitnessGoal as any,
					weeklyRateKg: Number(fp.weeklyWeightChange),
				})

				const fitnessPayload = {
					...fp,
				}

				const nutritionPayload = {
					caloriesTarget: computedTargets.caloriesTarget,
					proteinTarget: computedTargets.proteinTarget,
					fatsTarget: computedTargets.fatsTarget,
					carbsTarget: computedTargets.carbsTarget,
					calculatedTDEE: computedTargets.caloriesTarget - computedTargets.deficitOrSurplus,
					deficitOrSurplus: computedTargets.deficitOrSurplus,
					startDate: new Date().toISOString(),
				}

				await Promise.all([
					updateFitnessProfileService(user.userId!, fitnessPayload),
					updateNutritionPlanService(user.userId!, nutritionPayload),
				])
			}

			// Reset onboarding store
			resetOnboarding()
		}

		// 2. Mark onboarding as seen
		completeOnboarding()

		// 3. Redirect
		router.replace('/home')
	}

	useEffect(() => {
		opacity.value = withTiming(1, { duration: 800 })
		translateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) })
		pumpScale.value = withRepeat(
			withSequence(
				withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
				withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
			),
			-1,
			true
		)
	}, [opacity, translateY, pumpScale])

	const animatedContainerStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}))

	const animatedPumpStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pumpScale.value }],
		fontFamily: 'Monoton',
	}))

	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-black">
			<View className="flex-[2] justify-center px-6">
				{/* <View className="flex flex-row items-center gap-2">
          <Text className="mb-2 text-3xl font-extrabold text-black dark:text-white">
            Welcome to
          </Text>
          <Text
            className="text-3xl text-black dark:text-white"
            style={{
              fontFamily: "Monoton",
              includeFontPadding: false,
            }}
          >
            PUMP
          </Text>
        </View> */}

				{PHONE_ENABLED && (
					<Text className="text-base text-gray-500 dark:text-gray-400">
						Lock in today’s pump. Earn a bigger one tomorrow.
					</Text>
				)}
			</View>

			<Animated.View style={[animatedContainerStyle]} className="justify-center px-6">
				<Text className="text-5xl text-gray-500 dark:text-gray-400">
					Lock in today’s{' '}
					<Animated.Text style={[animatedPumpStyle]} className="text-4xl text-black dark:text-white">
						PUMP
					</Animated.Text>{' '}
					Earn a bigger one tomorrow.
				</Text>
			</Animated.View>

			{PHONE_ENABLED && (
				<View className="flex-[2] justify-center px-6">
					<Text className="mb-4 text-sm text-gray-400 dark:text-gray-500">
						Enter your mobile number to continue.
					</Text>

					<PhoneInputField
						value={phone}
						onChangeText={setPhone}
						initialCountry={country.code}
						onCountryChange={(c: any) => setCountry(c)}
					/>
				</View>
			)}

			<KeyboardAvoidingView behavior="position" className="flex-[4] justify-center gap-4 px-6">
				{PHONE_ENABLED && (
					<TouchableOpacity
						className={`w-full items-center rounded-full py-2 ${
							!privacyAccepted ? 'bg-gray-400' : 'bg-primary'
						}`}
						onPress={onContinue}
						disabled={!privacyAccepted}
					>
						{isLoading ? (
							<ActivityIndicator color={colors.white} />
						) : (
							<Text className="text-lg font-semibold text-white">Continue</Text>
						)}
					</TouchableOpacity>
				)}

				{PHONE_ENABLED && (
					<View className="mt-4 flex-row justify-center">
						<Text className="text-gray-500 dark:text-gray-400">Or</Text>
					</View>
				)}

				<View className="mb-4 flex-row items-center justify-center gap-4 px-6">
					<View className="w-full border-t-[0.25px] border-gray-500 dark:border-gray-400"></View>
					<Text className="text-sm text-gray-500 dark:text-gray-400">
						{hasData() ? 'Complete Signup' : 'Welcome Back'}
					</Text>
					<View className="w-full border-t-[0.25px] border-gray-500 dark:border-gray-400"></View>
				</View>
				<Button
					title="Continue with Google"
					onPress={onGoogleButtonPress}
					variant="secondary"
					disabled={!privacyAccepted}
					loading={isGoogleLoading}
					rightIcon={<GoogleIcon />}
					onDisabledPress={() => privacyModalRef.current?.present()}
				/>
				<View className="mt-4 flex-row items-center justify-center gap-4 px-6">
					<Pressable
						onPress={() => {
							if (privacyAccepted) {
								setPrivacyAccepted(false)
								setPrivacyPolicyVersion(null)
							} else {
								privacyModalRef.current?.present()
							}
						}}
						className="flex-row items-center gap-2"
					>
						<View
							className={`h-5 w-5 items-center justify-center rounded border ${
								privacyAccepted ? 'border-primary bg-primary' : 'border-gray-500 bg-transparent'
							}`}
						>
							{privacyAccepted && <Text className="text-xs font-bold text-white">✓</Text>}
						</View>
					</Pressable>
					<Text className="text-sm text-gray-500 dark:text-gray-400">
						I agree to the{' '}
						<Text className="text-primary underline" onPress={() => privacyModalRef.current?.present()}>
							Privacy Policy
						</Text>
					</Text>
				</View>
			</KeyboardAvoidingView>
			<PrivacyPolicyModal
				ref={privacyModalRef}
				onAgree={version => {
					setPrivacyAccepted(true)
					setPrivacyPolicyVersion(version || '1.0')
				}}
			/>
		</SafeAreaView>
	)
}
