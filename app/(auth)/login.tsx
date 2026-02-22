import GoogleIcon from '@/assets/components/icons/Google'
import PhoneInputField from '@/components/auth/PhoneInputField'
import { Button } from '@/components/ui/Button'
import PrivacyPolicyModal, { PrivacyPolicyModalHandle } from '@/components/ui/PrivacyPolicyModal'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth, User } from '@/stores/authStore'
import { useEquipment } from '@/stores/equipmentStore'
import { useExercise } from '@/stores/exerciseStore'
import { useMuscleGroup } from '@/stores/muscleGroupStore'
import { useUser } from '@/stores/userStore'
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin'
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
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
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
			const userInfo = await GoogleSignin.signIn()
			const idToken = userInfo.data?.idToken

			if (idToken) {
				googleLogin(idToken, true, privacyPolicyVersion)
					.then((res: any) => {
						if (res.success) {
							handlePostLogin(res.data?.user)
						} else {
							Toast.show({
								type: 'error',
								text1: res.error?.message || 'Google Login Failed',
							})
						}
					})
					.catch((err: any) => {
						Toast.show({
							type: 'error',
							text1: err.message || 'Google Login Error',
						})
					})
			} else {
				Toast.show({
					type: 'error',
					text1: 'Login Failed',
				})
			}
		} catch (error: any) {
			if (isErrorWithCode(error)) {
				switch (error.code) {
					case statusCodes.SIGN_IN_CANCELLED:
						// user cancelled the login flow
						break
					case statusCodes.IN_PROGRESS:
						// operation (eg. sign in) already in progress
						break
					case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
						Toast.show({
							type: 'error',
							text1: 'Play services not available or outdated',
						})
						break
					default:
						Toast.show({
							type: 'error',
							text1: 'Google Sign-In Error',
							text2: error.message,
						})
				}
			} else {
				Toast.show({
					type: 'error',
					text1: 'Login Error',
					text2: error.message,
				})
			}
		}
	}

	const PHONE_ENABLED = false

	// Onboarding Store
	const { hasData, getPayload, reset: resetOnboarding } = require('@/stores/onboardingStore').useOnboarding.getState()
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
				gender: onBoardingPayload.gender,
			}
			const preferences = {
				preferredWeightUnit: onBoardingPayload.weightUnit,
				preferredLengthUnit: onBoardingPayload.heightUnit,
			}
			const { setUser } = useAuth.getState()
			setUser({ ...userData, ...preferences })

			await updateUserData(user.userId!, userData)
			await updatePreferences(user.userId!, preferences)

			// Reset onboarding store
			resetOnboarding()
		}

		// 2. Mark onboarding as seen
		completeOnboarding()

		// 3. Redirect
		router.replace('/home')
	}

	// fetch intialization data
	const getAllExercises = useExercise(s => s.getAllExercises)
	const getAllEquipment = useEquipment(s => s.getAllEquipment)
	const getAllMuscleGroups = useMuscleGroup(s => s.getAllMuscleGroups)

	useEffect(() => {
		getAllExercises()
		getAllEquipment()
		getAllMuscleGroups()
	}, [])

	useEffect(() => {
		opacity.value = withTiming(1, { duration: 2000 })
		translateY.value = withTiming(0, {
			duration: 2000,
			easing: Easing.out(Easing.cubic),
		})

		pumpScale.value = withDelay(500, withTiming(1, { duration: 600, easing: Easing.out(Easing.exp) }))
	}, [])

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
					console.log('Accepted policy version:', version)
				}}
			/>
		</SafeAreaView>
	)
}
