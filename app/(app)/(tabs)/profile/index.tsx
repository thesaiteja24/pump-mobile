// app/(app)/(tabs)/profile.tsx
import EditableAvatar from '@/components/EditableAvatar'
import { DailyCheckInSheet } from '@/components/profile/DailyCheckInSheet'
import { EditProfileSheet } from '@/components/profile/EditProfileSheet'
import { FitnessGoalsSheet } from '@/components/profile/FitnessGoalsSheet'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/stores/authStore'
import { useUser } from '@/stores/userStore'
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, Pressable, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type WeightUnit = 'kg' | 'lbs'
type LengthUnit = 'cm' | 'inches'

export default function ProfileScreen() {
	const { user, logout } = useAuth()
	const { getUserData, updatePreferences } = useUser()
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()

	const unitSheetRef = useRef<BottomSheetModal>(null)
	const editProfileSheetRef = useRef<BottomSheetModal>(null)
	const dailyCheckInSheetRef = useRef<BottomSheetModal>(null)
	const fitnessGoalsSheetRef = useRef<BottomSheetModal>(null)

	const storedWeightUnit: WeightUnit = user?.preferredWeightUnit ?? 'kg'
	const storedLengthUnit: LengthUnit = user?.preferredLengthUnit ?? 'cm'

	const [weightUnit, setWeightUnit] = useState<WeightUnit>(storedWeightUnit)
	const [lengthUnit, setLengthUnit] = useState<LengthUnit>(storedLengthUnit)

	useEffect(() => {
		setWeightUnit(storedWeightUnit)
		setLengthUnit(storedLengthUnit)
	}, [storedWeightUnit, storedLengthUnit])

	const hasChanges = useMemo(() => {
		return weightUnit !== storedWeightUnit || lengthUnit !== storedLengthUnit
	}, [weightUnit, lengthUnit, storedWeightUnit, storedLengthUnit])

	const onDismiss = async () => {
		if (!hasChanges || !user?.userId) return

		await updatePreferences(user.userId, {
			preferredWeightUnit: weightUnit,
			preferredLengthUnit: lengthUnit,
		})
	}

	const optionClass = (active: boolean, rounded?: string) =>
		[
			'w-1/2 py-2 border',
			rounded,
			active
				? 'bg-blue-500 border-blue-500 text-white'
				: 'bg-white border-neutral-200/60 text-black dark:bg-neutral-900 dark:border-neutral-800 dark:text-white',
		].join(' ')

	// Animation Values
	const avatarOpacity = useSharedValue(0)
	const avatarScale = useSharedValue(0.8)

	const nameOpacity = useSharedValue(0)
	const nameTranslateY = useSharedValue(15)

	const infoOpacity = useSharedValue(0)
	const infoTranslateY = useSharedValue(20)

	useEffect(() => {
		// 1. Avatar: Fade In + Scale Up
		avatarOpacity.value = withTiming(1, { duration: 500 })
		// avatarScale.value = withSpring(1, { damping: 12, stiffness: 200 });

		// 2. Name: Fade In + Slide Up (delayed 100ms)
		nameOpacity.value = withDelay(100, withTiming(1, { duration: 500 }))
		nameTranslateY.value = withDelay(100, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }))

		// 3. Info Card: Fade In + Slide Up (delayed 200ms)
		infoOpacity.value = withDelay(200, withTiming(1, { duration: 500 }))
		infoTranslateY.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }))
	}, [avatarOpacity, infoOpacity, infoTranslateY, nameOpacity, nameTranslateY])

	useEffect(() => {
		getUserData(user?.userId ?? '')
	}, [getUserData, user?.userId])

	const avatarStyle = useAnimatedStyle(() => ({
		opacity: avatarOpacity.value,
		transform: [{ scale: avatarScale.value }],
	}))

	const nameStyle = useAnimatedStyle(() => ({
		opacity: nameOpacity.value,
		transform: [{ translateY: nameTranslateY.value }],
	}))

	const infoStyle = useAnimatedStyle(() => ({
		opacity: infoOpacity.value,
		transform: [{ translateY: infoTranslateY.value }],
	}))

	useEffect(() => {
		const onBackPress = () => {
			if (router.canGoBack()) {
				router.back()
			} else {
				router.push('/(app)/(tabs)/home')
			}
			return true
		}

		const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

		return () => subscription.remove()
	}, [])

	return (
		<View className="flex-1 bg-white p-4 dark:bg-black" style={{ paddingBottom: useSafeAreaInsets().bottom }}>
			{/* Avatar */}
			<View className="flex-row items-center gap-4">
				<Animated.View style={avatarStyle} className="mb-6 items-center">
					<EditableAvatar uri={user?.profilePicUrl ? user.profilePicUrl : null} size={132} editable={false} />
				</Animated.View>

				{/* Name as prominent line */}
				<Animated.View style={nameStyle} className="mb-3 min-w-0 flex-1 gap-2">
					<Text
						className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
						numberOfLines={1}
						ellipsizeMode="tail"
					>
						{(user?.firstName ?? '') + (user?.lastName ? ` ${user.lastName}` : '')}
					</Text>

					<View className="flex-row gap-4">
						<Pressable
							onPress={() => {
								router.push('/(app)/profile/followers')
							}}
						>
							<Text className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
								Followers
							</Text>
							<Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
								{user?.followersCount ?? 0}
							</Text>
						</Pressable>
						<Pressable
							onPress={() => {
								router.push('/(app)/profile/following')
							}}
						>
							<Text className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
								Following
							</Text>
							<Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
								{user?.followingCount ?? 0}
							</Text>
						</Pressable>
					</View>
				</Animated.View>
			</View>

			{/* Info Card / Action List */}
			<Animated.View style={infoStyle} className="mt-4 gap-2">
				<Button
					title="Account Details"
					variant="ghost"
					className="justify-start py-4"
					textClassName="text-base font-medium text-neutral-700 dark:text-neutral-300"
					leftIcon={
						<MaterialCommunityIcons
							name="account-edit"
							size={24}
							color={isDarkMode ? '#D4D4D4' : '#525252'}
							className="mr-2"
						/>
					}
					rightIcon={
						<MaterialCommunityIcons
							name="chevron-right"
							size={24}
							color={isDarkMode ? '#525252' : '#A3A3A3'}
							className="ml-auto"
						/>
					}
					onPress={() => editProfileSheetRef.current?.present()}
				/>

				<View className="ml-14 h-[1px] bg-neutral-100 dark:bg-neutral-800" />

				<Button
					title="Daily Check-In"
					variant="ghost"
					className="justify-start py-4"
					textClassName="text-base font-medium text-neutral-700 dark:text-neutral-300"
					leftIcon={
						<MaterialCommunityIcons
							name="clipboard-check-outline"
							size={24}
							color={isDarkMode ? '#D4D4D4' : '#525252'}
							className="mr-2"
						/>
					}
					rightIcon={
						<MaterialCommunityIcons
							name="chevron-right"
							size={24}
							color={isDarkMode ? '#525252' : '#A3A3A3'}
							className="ml-auto"
						/>
					}
					onPress={() => dailyCheckInSheetRef.current?.present()}
				/>

				<View className="ml-14 h-[1px] bg-neutral-100 dark:bg-neutral-800" />

				<Button
					title="Fitness Goals"
					variant="ghost"
					className="justify-start py-4"
					textClassName="text-base font-medium text-neutral-700 dark:text-neutral-300"
					leftIcon={
						<MaterialCommunityIcons
							name="bullseye-arrow"
							size={24}
							color={isDarkMode ? '#D4D4D4' : '#525252'}
							className="mr-2"
						/>
					}
					rightIcon={
						<MaterialCommunityIcons
							name="chevron-right"
							size={24}
							color={isDarkMode ? '#525252' : '#A3A3A3'}
							className="ml-auto"
						/>
					}
					onPress={() => fitnessGoalsSheetRef.current?.present()}
				/>

				<View className="ml-14 h-[1px] bg-neutral-100 dark:bg-neutral-800" />

				<Button
					title="Unit Preferences"
					variant="ghost"
					className="justify-start py-4"
					textClassName="text-base font-medium text-neutral-700 dark:text-neutral-300"
					leftIcon={
						<MaterialCommunityIcons
							name="tune-variant"
							size={24}
							color={isDarkMode ? '#D4D4D4' : '#525252'}
							className="mr-2"
						/>
					}
					rightIcon={
						<MaterialCommunityIcons
							name="chevron-right"
							size={24}
							color={isDarkMode ? '#525252' : '#A3A3A3'}
							className="ml-auto"
						/>
					}
					onPress={() => unitSheetRef.current?.present()}
				/>

				<View className="ml-14 h-[1px] bg-neutral-100 dark:bg-neutral-800" />

				<Button
					title="Logout"
					variant="ghost"
					className="justify-start py-4"
					textClassName="text-base font-medium text-red-600 dark:text-red-500"
					leftIcon={
						<AntDesign
							name="logout"
							size={22}
							color={isDarkMode ? '#EF4444' : '#DC2626'}
							className="ml-[2px] mr-2"
						/>
					}
					rightIcon={
						<MaterialCommunityIcons
							name="chevron-right"
							size={24}
							color={isDarkMode ? '#525252' : '#A3A3A3'}
							className="ml-auto"
						/>
					}
					onPress={logout}
				/>
			</Animated.View>

			<BottomSheetModal
				ref={unitSheetRef}
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
				onDismiss={onDismiss}
				animationConfigs={{
					duration: 350,
				}}
			>
				<BottomSheetView
					style={{
						paddingBottom: insets.bottom + 16,
						paddingHorizontal: 24,
						paddingTop: 8,
					}}
				>
					<Text className="mb-6 text-center text-xl font-bold text-black dark:text-white">
						Unit Preferences
					</Text>

					<View className="flex flex-col gap-6">
						<View className="flex flex-row items-center justify-between">
							<Text className="w-1/2 text-lg font-semibold text-black dark:text-white">Weight</Text>
							<View className="flex w-1/2 flex-row">
								<TouchableOpacity
									onPress={() => setWeightUnit('kg')}
									className={optionClass(weightUnit === 'kg', 'rounded-l-full')}
								>
									<Text
										className={
											weightUnit === 'kg'
												? 'text-center text-white'
												: 'text-center text-black dark:text-white'
										}
									>
										Kg
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() => setWeightUnit('lbs')}
									className={optionClass(weightUnit === 'lbs', 'rounded-r-full')}
								>
									<Text
										className={
											weightUnit === 'lbs'
												? 'text-center text-white'
												: 'text-center text-black dark:text-white'
										}
									>
										Lbs
									</Text>
								</TouchableOpacity>
							</View>
						</View>

						<View className="flex flex-row items-center justify-between">
							<Text className="w-1/2 text-lg font-semibold text-black dark:text-white">Measurements</Text>
							<View className="flex w-1/2 flex-row">
								<TouchableOpacity
									onPress={() => setLengthUnit('cm')}
									className={optionClass(lengthUnit === 'cm', 'rounded-l-full')}
								>
									<Text
										className={
											lengthUnit === 'cm'
												? 'text-center text-white'
												: 'text-center text-black dark:text-white'
										}
									>
										Cm
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() => setLengthUnit('inches')}
									className={optionClass(lengthUnit === 'inches', 'rounded-r-full')}
								>
									<Text
										className={
											lengthUnit === 'inches'
												? 'text-center text-white'
												: 'text-center text-black dark:text-white'
										}
									>
										Inches
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>

					{hasChanges && (
						<Text className="mt-6 text-center text-sm text-blue-500">
							Changes will be saved when you close this sheet
						</Text>
					)}
				</BottomSheetView>
			</BottomSheetModal>

			<EditProfileSheet ref={editProfileSheetRef} />
			<DailyCheckInSheet ref={dailyCheckInSheetRef} />
			<FitnessGoalsSheet ref={fitnessGoalsSheetRef} />
		</View>
	)
}
