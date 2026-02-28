import EditableAvatar from '@/components/EditableAvatar'
import { Button } from '@/components/ui/Button'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { useUser } from '@/stores/userStore'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Platform, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export const EditProfileSheet = forwardRef<BottomSheetModal>((props, ref) => {
	const colors = useThemeColor()
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()

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
		if (!user?.userId || !hasChanges) {
			// @ts-ignore
			ref?.current?.dismiss()
			return
		}

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

			originalRef.current = {
				firstName,
				lastName,
				height,
				weight,
				dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
				gender,
			}
			// @ts-ignore
			ref?.current?.dismiss()
		} else {
			Toast.show({
				type: 'error',
				text1: 'Profile update failed, try again',
			})
		}
	}, [firstName, lastName, height, weight, dateOfBirth, gender, hasChanges, user?.userId, updateUserData, ref])

	// profile pic picker
	const onPick = async (uri: string | null) => {
		if (!uri || !user?.userId || uploading) return

		try {
			setUploading(true)
			const prepared = await prepareImageForUpload(
				{
					uri,
					fileName: 'profile.jpg',
					type: 'image/jpeg',
				},
				'avatar'
			)

			const formData = new FormData()
			formData.append('profilePic', prepared as any)
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
		<BottomSheetModal
			ref={ref}
			index={0}
			enableDynamicSizing={true}
			backdropComponent={props => (
				<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
			)}
			backgroundStyle={{
				backgroundColor: isDarkMode ? '#171717' : 'white',
			}}
			handleIndicatorStyle={{
				backgroundColor: isDarkMode ? '#525252' : '#d1d5db',
			}}
			animationConfigs={{
				duration: 350,
			}}
			keyboardBehavior="interactive"
			keyboardBlurBehavior="restore"
		>
			<BottomSheetScrollView
				contentContainerStyle={{
					paddingBottom: insets.bottom + 16,
					paddingHorizontal: 24,
					paddingTop: 8,
				}}
			>
				<Text className="mb-6 text-center text-xl font-bold text-black dark:text-white">Edit Profile</Text>

				<View className="mb-6 items-center">
					<EditableAvatar
						uri={user?.profilePicUrl ? user.profilePicUrl : null}
						size={110}
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
							<Text className="text-sm font-medium text-red-500">Remove Avatar</Text>
						</TouchableOpacity>
					)}
				</View>

				<View className="flex flex-col gap-6">
					{/* first name */}
					<View className="flex flex-row items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
						<Text className="text-lg font-semibold text-black dark:text-white">First Name</Text>
						<TextInput
							value={firstName}
							onChangeText={setFirstName}
							editable={!isLoading}
							placeholder="Enter Name..."
							className="text-right text-lg text-primary"
							placeholderTextColor={colors.neutral[500]}
							style={{ lineHeight }}
						/>
					</View>

					{/* last name */}
					<View className="flex flex-row items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
						<Text className="text-lg font-semibold text-black dark:text-white">Last Name</Text>
						<TextInput
							value={lastName}
							onChangeText={setLastName}
							editable={!isLoading}
							placeholder="Enter Surname..."
							className="text-right text-lg text-primary"
							placeholderTextColor={colors.neutral[500]}
							style={{ lineHeight }}
						/>
					</View>

					{/* gender section */}
					<View className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
						<Text className="mb-3 text-lg font-semibold text-black dark:text-white">Gender</Text>
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
					<View className="flex-row items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
						<Text className="text-lg font-semibold text-black dark:text-white">Date of Birth</Text>
						<DateTimePicker value={dateOfBirth ?? undefined} dateOnly onUpdate={setDateOfBirth} />
					</View>

					{/* height */}
					<View className="flex-row items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
						<Text className="text-lg font-semibold text-black dark:text-white">Height (cm)</Text>
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
							className="text-right text-lg text-primary"
							style={{ lineHeight }}
						/>
					</View>

					{/* weight */}
					<View className="h-14 flex-row items-center justify-between pb-2">
						<Text className="text-lg font-semibold text-black dark:text-white">Weight (kg)</Text>
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
							className="text-right text-lg text-primary"
							style={{ lineHeight }}
						/>
					</View>
				</View>

				<Button
					title={hasChanges ? 'Save Changes' : 'Close'}
					variant={hasChanges ? 'primary' : 'secondary'}
					loading={isLoading}
					className="mt-6"
					onPress={handleSave}
				/>
			</BottomSheetScrollView>
		</BottomSheetModal>
	)
})

export default EditProfileSheet
