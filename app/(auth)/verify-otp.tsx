import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Text, TouchableOpacity, View } from 'react-native'
import { ChevronDoubleLeftIcon } from 'react-native-heroicons/outline'
import { OtpInput } from 'react-native-otp-entry'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function VerifyOtp() {
	const colors = useThemeColor()
	const { data } = useLocalSearchParams()
	const [otp, setOtp] = useState('')
	const [resendCooldown, setResendCooldown] = useState(0)

	const isLoading = useAuth((state: any) => state.isLoading)
	const verifyOtp = useAuth((state: any) => state.verifyOtp)
	const sendOtp = useAuth((state: any) => state.sendOtp)

	// Countdown timer for resend cooldown
	useEffect(() => {
		if (resendCooldown <= 0) return

		const timer = setInterval(() => {
			setResendCooldown(prev => prev - 1)
		}, 1000)

		return () => clearInterval(timer)
	}, [resendCooldown])

	const handleResendOtp = useCallback(async () => {
		if (resendCooldown > 0 || isLoading) return

		try {
			const payload = JSON.parse(Array.isArray(data) ? data[0] : data)
			const response = await sendOtp({
				countryCode: payload.countryCode,
				phone: payload.phone,
				resend: true,
			})

			if (response.success) {
				Toast.show({
					type: 'success',
					text1: 'OTP sent!',
					text2: 'Check your phone for the new code.',
				})
				setResendCooldown(60) // 60 second cooldown
			} else {
				Toast.show({
					type: 'error',
					text1: response.error?.message || 'Failed to resend OTP',
				})
			}
		} catch (error: any) {
			Toast.show({
				type: 'error',
				text1: error?.message || 'Failed to resend OTP',
			})
		}
	}, [data, resendCooldown, isLoading, sendOtp])

	const onVerifyOtp = async () => {
		// Ensure it's a string, not an array as per expo-router behavior
		try {
			const payload = JSON.parse(Array.isArray(data) ? data[0] : data)
			const response = await verifyOtp({
				...payload,
				otp,
				privacyAccepted: payload.privacyAccepted,
				privacyPolicyVersion: payload.privacyPolicyVersion,
			})

			if (response.success) {
				// Navigate to the next screen or home screen after successful verification
				router.replace('/home') // Adjust the path as needed
				Toast.show({
					type: 'success',
					text1: response.message || 'OTP verified successfully',
				})
			} else {
				Toast.show({
					type: 'error',
					text1: response.error?.message || 'Failed to verify OTP',
				})
			}
		} catch (error: any) {
			Toast.show({
				type: 'error',
				text1: error?.message || 'Failed to verify OTP',
			})
		}
	}

	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-black">
			{/* Navigate back to Login page */}
			<View className="flex-1 justify-center px-6">
				<TouchableOpacity onPress={() => router.back()} className="self-start">
					<ChevronDoubleLeftIcon color={colors.icon} />
				</TouchableOpacity>
			</View>

			{/* Header text */}
			<View className="flex-[2] justify-end px-6">
				<View className="flex flex-row items-center gap-2">
					<Text className="mb-2 text-3xl font-extrabold text-black dark:text-white">Enter 6-digit code</Text>
				</View>
				<Text className="text-base text-gray-500 dark:text-gray-400">We sent a verification code to</Text>
			</View>

			{/* OTP input and resend text */}
			<View className="flex-[2] justify-center px-6">
				<OtpInput
					numberOfDigits={6}
					type="numeric"
					onTextChange={text => setOtp(text)}
					textInputProps={{
						textContentType: 'oneTimeCode',
						autoComplete: 'sms-otp',
					}}
					theme={{
						focusedPinCodeContainerStyle: { borderColor: colors.primary },
						filledPinCodeContainerStyle: { borderColor: colors.success },
						pinCodeTextStyle: {
							color: colors.text,
						},
					}}
				/>
				<Text className="mt-4 text-sm text-gray-400 dark:text-gray-500">
					You didn&apos;t receive any code?{' '}
					<Text className={resendCooldown > 0 ? 'text-gray-400' : 'text-primary'} onPress={handleResendOtp}>
						{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
					</Text>
				</Text>
			</View>

			{/* Verify button */}
			<KeyboardAvoidingView behavior="position" className="flex-[4] justify-end px-6 pb-6">
				<TouchableOpacity
					className="w-full items-center rounded-full bg-primary py-2"
					onPress={onVerifyOtp}
					disabled={isLoading || otp.length < 6}
					style={{
						opacity: isLoading || otp.length < 6 ? 0.6 : 1,
					}}
				>
					{isLoading ? (
						<ActivityIndicator color={colors.white} />
					) : (
						<Text className="text-lg font-semibold text-white">Verify</Text>
					)}
				</TouchableOpacity>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}
