import EditableAvatar from '@/components/EditableAvatar'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { useUser } from '@/stores/userStore'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Platform, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function EditProfileScreen() {
	const navigation = useNavigation()
	const colors = useThemeColor()

	// global state (stores)
	const user = useAuth(s => s.user)
	const getUserData = useUser(s => s.getUserData)
	const updateProfilePic = useUser(s => s.updateProfilePic)
	const updateUserData = useUser(s => s.updateUserData)
	const isLoading = useUser(s => s.isLoading)
	const [uploading, setUploading] = useState(false)

	const lineHeight = Platform.OS === 'ios' ? 0 : 30

	// local state
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [height, setHeight] = useState<number | null>(null)
	const [weight, setWeight] = useState<number | null>(null)
	const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)

	// Snapshot of original values
	const originalRef = useRef({
		firstName: '',
		lastName: '',
		height: null as number | null,
		weight: null as number | null,
		dateOfBirth: null as Date | null,
	})

	// sync local state with global user data
	useEffect(() => {
		if (!user) return

		setFirstName(user.firstName ?? '')
		setLastName(user.lastName ?? '')
		setHeight(user.height ?? null)
		setWeight(user.weight ?? null)
		setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth) : null)

		originalRef.current = {
			firstName: user.firstName ?? '',
			lastName: user.lastName ?? '',
			height: user.height ?? null,
			weight: user.weight ?? null,
			dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
		}
	}, [user])

	// Dirty checking
	const isDirty = useMemo(() => {
		const original = originalRef.current

		const sameDOB =
			(dateOfBirth &&
				original.dateOfBirth &&
				dateOfBirth.toDateString() === original.dateOfBirth.toDateString()) ||
			(!dateOfBirth && !original.dateOfBirth)

		return !(
			firstName === original.firstName &&
			lastName === original.lastName &&
			height === original.height &&
			weight === original.weight &&
			sameDOB
		)
	}, [firstName, lastName, height, weight, dateOfBirth, user])

	// save handler
	const onSave = useCallback(async () => {
		if (!user?.userId || !isDirty) return
		Keyboard.dismiss()

		const payload = {
			firstName,
			lastName,
			height,
			weight,
			dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
		}

		const response = await updateUserData(user.userId, payload)

		if (response?.success) {
			Toast.show({ type: 'success', text1: 'Profile updated successfully' })

			// update original snapshot
			originalRef.current = {
				firstName,
				lastName,
				height,
				weight,
				dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
			}
		} else {
			Toast.show({
				type: 'error',
				text1: 'Profile update failed, try again',
			})
		}
	}, [firstName, lastName, height, weight, dateOfBirth, isDirty, user?.userId])

	// load user data on mount
	useEffect(() => {
		if (user?.userId) {
			getUserData(user.userId)
		}
	}, [])

	// nav bar checkmark
	useEffect(() => {
		;(navigation as any).setOptions({
			rightIcons: [
				{
					name: 'checkmark-done',
					onPress: onSave,
					disabled: !isDirty || isLoading,
					color: colors.primary,
				},
			],
		})
	}, [navigation, isDirty, onSave, user, isLoading, colors.primary])

	// profile pic picker
	const onPick = async (uri: string | null) => {
		if (!uri || !user?.userId || uploading) return

		try {
			setUploading(true)

			// 1️⃣ Prepare image (retina-safe avatar)
			const prepared = await prepareImageForUpload(
				{
					uri,
					fileName: 'profile.jpg', // safe default
					type: 'image/jpeg',
				},
				'avatar'
			)

			// 2️⃣ Build FormData
			const formData = new FormData()
			formData.append('profilePic', prepared as any)

			// 3️⃣ Upload
			const res = await updateProfilePic(user.userId, formData)

			if (!res?.success) {
				Toast.show({
					type: 'error',
					text1: res?.error || 'Profile picture upload failed',
				})
			} else {
				Toast.show({
					type: 'success',
					text1: 'Profile picture updated',
				})
			}
		} catch (error: any) {
			Toast.show({
				type: 'error',
				text1: error?.message || 'Image processing failed',
			})
		} finally {
			setUploading(false)
		}
	}

	return (
		<View className="flex-1 bg-white p-4 dark:bg-black" style={{ paddingBottom: useSafeAreaInsets().bottom }}>
			<View className="mb-6 items-center">
				<EditableAvatar
					uri={user?.profilePicUrl ? user.profilePicUrl : null}
					size={132}
					editable={!isLoading}
					uploading={uploading}
					onChange={newUri => newUri && onPick(newUri)}
				/>
			</View>

			<View className="flex flex-col gap-2">
				{/* first name */}
				<View className="flex flex-row items-center gap-8">
					<Text className="text-lg font-semibold text-black dark:text-white">First Name</Text>
					<TextInput
						value={firstName}
						onChangeText={setFirstName}
						editable={!isLoading}
						placeholder="Enter Name..."
						className="text-lg text-primary"
						placeholderTextColor={colors.neutral[500]}
						style={{ lineHeight }}
					/>
				</View>

				{/* last name */}
				<View className="flex flex-row items-center gap-8">
					<Text className="text-lg font-semibold text-black dark:text-white">Last Name</Text>
					<TextInput
						value={lastName}
						onChangeText={setLastName}
						editable={!isLoading}
						placeholder="Enter Surname..."
						className="text-lg text-primary"
						placeholderTextColor={colors.neutral[500]}
						style={{ lineHeight }}
					/>
				</View>

				{/* details card */}
				<View className="mt-4 rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
					{/* date of birth */}
					<View className="flex-row items-center justify-between border-b border-neutral-200/60 py-3 dark:border-neutral-800">
						<Text className="text-sm text-neutral-500 dark:text-neutral-400">Date of Birth</Text>
						<DateTimePicker value={dateOfBirth ?? undefined} dateOnly onUpdate={setDateOfBirth} />
					</View>

					{/* height */}
					<View className="flex-row items-center justify-between border-b border-neutral-200/60 py-3 dark:border-neutral-800">
						<Text className="text-sm text-neutral-500 dark:text-neutral-400">Height (cm)</Text>
						<TextInput
							value={height?.toString() ?? ''}
							placeholder="--"
							placeholderTextColor={colors.neutral[500]}
							keyboardType="numeric"
							onChangeText={text =>
								// @ts-ignore
								setHeight(text)
							}
							editable={!isLoading}
							className="text-lg text-primary"
							style={{ lineHeight }}
						/>
					</View>

					{/* weight */}
					<View className="flex-row items-center justify-between border-neutral-200/60 py-3 dark:border-neutral-800">
						<Text className="text-sm text-neutral-500 dark:text-neutral-400">Weight (kg)</Text>
						<TextInput
							value={weight?.toString() ?? ''}
							placeholder="--"
							placeholderTextColor={colors.neutral[500]}
							keyboardType="decimal-pad"
							onChangeText={text =>
								// @ts-ignore
								setWeight(text)
							}
							editable={!isLoading}
							className="text-lg text-primary"
							style={{ lineHeight }}
						/>
					</View>
				</View>
			</View>
		</View>
	)
}
