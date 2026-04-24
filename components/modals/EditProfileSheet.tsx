import EditableAvatar from '@/components/EditableAvatar'
import { Button } from '@/components/ui/Button'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { GlassBackground } from '@/components/ui/GlassBackground'
import { SelectableCard } from '@/components/ui/SelectableCard'
import {
	useDeleteProfilePicMutation,
	useProfileQuery,
	useUpdateProfileMutation,
	useUpdateProfilePicMutation,
} from '@/hooks/queries/useMe'
import { useThemeColor } from '@/hooks/useThemeColor'
import { SelfUser } from '@/types/user'
import { convertLength, convertWeight, displayLength, displayWeight } from '@/utils/converter'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	BackHandler,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export const EditProfileSheet = forwardRef<BottomSheetModal>((props, ref) => {
	const colors = useThemeColor()
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()
	const [isOpen, setIsOpen] = useState(false)

	const { data: userData } = useProfileQuery()
	const user = userData as SelfUser | null

	const updateProfilePicMutation = useUpdateProfilePicMutation()
	const deleteProfilePicMutation = useDeleteProfilePicMutation()
	const updateUserDataMutation = useUpdateProfileMutation()
	const [uploading, setUploading] = useState(false)

	// Derived preferred units — read from store, not local state (set only via Unit Preferences sheet)
	const weightUnit = user?.preferredWeightUnit ?? 'kg'
	const lengthUnit = user?.preferredLengthUnit ?? 'cm'

	const lineHeight = Platform.OS === 'ios' ? 0 : 30

	// local state — height & weight stored as display-unit strings (TextInput always emits strings)
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [heightDisplay, setHeightDisplay] = useState('')
	const [weightDisplay, setWeightDisplay] = useState('')
	const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined)
	const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null)

	// Snapshot of original display-unit values for dirty checking
	const originalRef = useRef({
		firstName: '',
		lastName: '',
		heightDisplay: '',
		weightDisplay: '',
		dateOfBirth: undefined as Date | undefined,
		gender: null as 'male' | 'female' | 'other' | null,
	})

	// Sync local state with global user — convert backend units (kg, cm) → user's preferred display unit
	useEffect(() => {
		if (!user) return

		const hDisplay =
			user.height != null && Number.isFinite(Number(user.height))
				? displayLength(Number(user.height), lengthUnit, { precision: 2 }).toString()
				: ''

		const wDisplay =
			user.weight != null && Number.isFinite(Number(user.weight))
				? displayWeight(Number(user.weight), weightUnit, { precision: 2 }).toString()
				: ''

		setFirstName(user.firstName ?? '')
		setLastName(user.lastName ?? '')
		setHeightDisplay(hDisplay)
		setWeightDisplay(wDisplay)
		setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth) : undefined)
		setGender((user.gender as any) ?? null)

		originalRef.current = {
			firstName: user.firstName ?? '',
			lastName: user.lastName ?? '',
			heightDisplay: hDisplay,
			weightDisplay: wDisplay,
			dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
			gender: (user.gender as any) ?? null,
		}
	}, [user, lengthUnit, weightUnit])

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
			heightDisplay === original.heightDisplay &&
			weightDisplay === original.weightDisplay &&
			gender === original.gender &&
			sameDOB
		)
	}, [firstName, lastName, heightDisplay, weightDisplay, dateOfBirth, gender])

	// Save handler — convert display-unit values back to backend canonical units (kg, cm)
	const handleSave = useCallback(async () => {
		if (!user?.id || !hasChanges) {
			// @ts-ignore
			ref?.current?.dismiss()
			return
		}

		Keyboard.dismiss()

		const parsedHeight = parseFloat(heightDisplay)
		const parsedWeight = parseFloat(weightDisplay)

		// Convert display-unit values to backend canonical units
		const heightInCm =
			!isNaN(parsedHeight) && parsedHeight > 0
				? convertLength(parsedHeight, { from: lengthUnit, to: 'cm' })
				: undefined

		const weightInKg =
			!isNaN(parsedWeight) && parsedWeight > 0
				? convertWeight(parsedWeight, { from: weightUnit, to: 'kg' })
				: undefined

		const payload = {
			firstName,
			lastName,
			height: heightInCm,
			weight: weightInKg,
			dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
			gender: gender ?? undefined,
		}

		try {
			await updateUserDataMutation.mutateAsync(payload)
			Toast.show({ type: 'success', text1: 'Profile updated successfully' })

			originalRef.current = {
				firstName,
				lastName,
				heightDisplay,
				weightDisplay,
				dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
				gender,
			}
			// @ts-ignore
			ref?.current?.dismiss()
		} catch {
			Toast.show({ type: 'error', text1: 'Profile update failed, try again' })
		}
	}, [
		firstName,
		lastName,
		heightDisplay,
		weightDisplay,
		dateOfBirth,
		gender,
		hasChanges,
		user?.id,
		updateUserDataMutation,
		ref,
		lengthUnit,
		weightUnit,
	])

	// Profile pic picker
	const onPick = async (uri: string | null) => {
		if (!uri || !user?.id || uploading) return

		try {
			setUploading(true)
			const prepared = await prepareImageForUpload({ uri, fileName: 'profile.jpg', type: 'image/jpeg' }, 'avatar')

			const formData = new FormData()
			formData.append('profilePic', prepared as any)
			await updateProfilePicMutation.mutateAsync(formData)
			Toast.show({ type: 'success', text1: 'Profile picture updated' })
		} catch (error: any) {
			Toast.show({ type: 'error', text1: error?.message || 'Image processing failed' })
		} finally {
			setUploading(false)
		}
	}

	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
			if (isOpen) {
				// @ts-ignore
				ref?.current?.dismiss()
				return true
			}
			return false
		})
		return () => backHandler.remove()
	}, [isOpen, ref])

	return (
		<BottomSheetModal
			ref={ref}
			index={0}
			snapPoints={['90%']}
			enableDynamicSizing={false}
			backdropComponent={props => (
				<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
			)}
			backgroundComponent={GlassBackground}
			handleIndicatorStyle={{ backgroundColor: isDarkMode ? '#525252' : '#d1d5db' }}
			animationConfigs={{ duration: 350 }}
			style={{ marginTop: insets.top }}
			stackBehavior="push"
			onChange={index => setIsOpen(index >= 0)}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
				keyboardVerticalOffset={150}
			>
				<BottomSheetScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{
						paddingHorizontal: 24,
						paddingTop: 8,
						paddingBottom: insets.bottom + 100,
					}}
					showsVerticalScrollIndicator={false}
				>
					<Text className="mb-6 text-center text-xl font-bold text-black dark:text-white">Edit Profile</Text>

					<View className="mb-6 items-center">
						<EditableAvatar
							uri={user?.profilePicUrl ?? null}
							size={110}
							editable={!uploading}
							uploading={uploading}
							onChange={newUri => newUri && onPick(newUri)}
						/>
						{user?.profilePicUrl && (
							<TouchableOpacity
								onPress={async () => {
									try {
										await deleteProfilePicMutation.mutateAsync()
										Toast.show({ type: 'success', text1: 'Avatar removed successfully' })
									} catch {
										Toast.show({ type: 'error', text1: 'Failed to remove avatar' })
									} finally {
										setUploading(false)
									}
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
								editable={!updateUserDataMutation.isPending}
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
								editable={!updateUserDataMutation.isPending}
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

							<DateTimePicker value={dateOfBirth} dateOnly onUpdate={setDateOfBirth} returnUndefined />
						</View>

						{/* height — dynamic unit label, input in display unit */}
						<View className="flex-row items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
							<Text className="text-lg font-semibold text-black dark:text-white">
								Height ({lengthUnit})
							</Text>
							<TextInput
								value={heightDisplay}
								placeholder="--"
								placeholderTextColor={colors.neutral[500]}
								keyboardType="numeric"
								onChangeText={setHeightDisplay}
								editable={!updateUserDataMutation.isPending}
								className="text-right text-lg text-primary"
								style={{ lineHeight }}
							/>
						</View>

						{/* weight — dynamic unit label, input in display unit */}
						<View className="h-14 flex-row items-center justify-between pb-2">
							<Text className="text-lg font-semibold text-black dark:text-white">
								Weight ({weightUnit})
							</Text>
							<TextInput
								value={weightDisplay}
								placeholder="--"
								placeholderTextColor={colors.neutral[500]}
								keyboardType="decimal-pad"
								onChangeText={setWeightDisplay}
								editable={!updateUserDataMutation.isPending}
								className="text-right text-lg text-primary"
								style={{ lineHeight }}
							/>
						</View>
					</View>

					<Button
						title={hasChanges ? 'Save Changes' : 'Close'}
						variant={hasChanges ? 'primary' : 'secondary'}
						loading={updateUserDataMutation.isPending}
						className="mt-6"
						onPress={handleSave}
						liquidGlass
					/>
				</BottomSheetScrollView>
			</KeyboardAvoidingView>
		</BottomSheetModal>
	)
})

EditProfileSheet.displayName = 'EditProfileSheet'
