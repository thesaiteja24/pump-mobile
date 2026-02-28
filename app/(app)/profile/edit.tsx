import EditableAvatar from '@/components/EditableAvatar'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { useUser } from '@/stores/userStore'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { router, useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, BackHandler, Keyboard, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function EditProfileScreen() {
	const navigation = useNavigation()
	const colors = useThemeColor()

	// global state (stores)
	const user = useAuth(s => s.user)
	const getUserData = useUser(s => s.getUserData)
	const updateProfilePic = useUser(s => s.updateProfilePic)
	const deleteProfilePic = useUser(s => s.deleteProfilePic)
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
	const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null)

	// Snapshot of original values
	const originalRef = useRef({
		firstName: '',
		lastName: '',
		height: null as number | null,
		weight: null as number | null,
		dateOfBirth: null as Date | null,
		gender: null as 'male' | 'female' | 'other' | null,
	})

	// sync local state with global user data
	useEffect(() => {
		if (!user) return

		setFirstName(user.firstName ?? '')
		setLastName(user.lastName ?? '')
		setHeight(user.height ?? null)
		setWeight(user.weight ?? null)
		setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth) : null)
		setGender((user.gender as any) ?? null)

		originalRef.current = {
			firstName: user.firstName ?? '',
			lastName: user.lastName ?? '',
			height: user.height ?? null,
			weight: user.weight ?? null,
			dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
			gender: (user.gender as any) ?? null,
		}
	}, [user])

	// Dirty checking
	const hasChanges = useMemo(() => {
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
			gender === original.gender &&
			sameDOB
		)
	}, [firstName, lastName, height, weight, dateOfBirth, gender])

	// save handler
	const handleSave = useCallback(async () => {
		if (!user?.userId || !hasChanges) return
		Keyboard.dismiss()

		const payload = {
			firstName,
			lastName,
			height,
			weight,
			dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
			gender,
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
				gender,
			}
		} else {
			Toast.show({
				type: 'error',
				text1: 'Profile update failed, try again',
			})
		}
	}, [firstName, lastName, height, weight, dateOfBirth, gender, hasChanges, user?.userId, updateUserData])

	// load user data on mount
	useEffect(() => {
		if (user?.userId) {
			getUserData(user.userId)
		}
	}, [user?.userId, getUserData])

	// nav bar checkmark
	useEffect(() => {
		;(navigation as any).setOptions({
			rightIcons: [
				{
					name: 'checkmark-done',
					onPress: handleSave,
					disabled: !hasChanges || isLoading,
					color: colors.primary,
				},
			],
		})
	}, [navigation, hasChanges, handleSave, user, isLoading, colors.primary])

	useEffect(() => {
		const onBackPress = () => {
			if (hasChanges) {
				Alert.alert('Unsaved Changes', 'You have unsaved changes. Are you sure you want to go back?', [
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Discard',
						style: 'destructive',
						onPress: () => router.back(),
					},
				])
				return true
			}
			router.back()
			return true
		}

		const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

		return () => subscription.remove()
	}, [])

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
				{user?.profilePicUrl && (
					<TouchableOpacity
						onPress={async () => {
							if (!user?.userId) return
							setUploading(true)
							const res = await deleteProfilePic(user.userId)
							if (!res?.success) {
								Toast.show({
									type: 'error',
									text1: res?.error || 'Failed to remove avatar',
								})
							} else {
								Toast.show({
									type: 'success',
									text1: 'Avatar removed successfully',
								})
							}
							setUploading(false)
						}}
						className="mt-4"
						disabled={uploading}
					>
						<Text className="text-base font-medium text-red-500">Remove Avatar</Text>
					</TouchableOpacity>
				)}
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
					{/* gender section */}
					<View className="border-b border-neutral-200/60 py-3 pb-5 dark:border-neutral-800">
						<Text className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">Gender</Text>
						<View className="flex-row items-center gap-2">
							<SelectableCard
								selected={gender === 'male'}
								onSelect={() => setGender('male')}
								title="Male"
								className="flex-1 px-3 py-3"
							/>
							<SelectableCard
								selected={gender === 'female'}
								onSelect={() => setGender('female')}
								title="Female"
								className="flex-1 px-3 py-3"
							/>
							<SelectableCard
								selected={gender === 'other'}
								onSelect={() => setGender('other')}
								title="Other"
								className="flex-1 px-3 py-3"
							/>
						</View>
					</View>

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
