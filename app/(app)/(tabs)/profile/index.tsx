// app/(app)/(tabs)/profile.tsx
import EditableAvatar from '@/components/EditableAvatar'
import { EditProfileSheet } from '@/components/profile/EditProfileSheet'
import { FitnessGoalsSheet } from '@/components/profile/FitnessGoalsSheet'
import { MeasurementsSheet } from '@/components/profile/MeasurementsSheet'
import { UnitPreferencesSheet } from '@/components/profile/UnitPreferencesSheet'
import { Button } from '@/components/ui/Button'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { useUserQuery } from '@/hooks/queries/useUser'
import { useAuth } from '@/stores/authStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { SelfUser } from '@/types/user'
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { BackHandler, Pressable, Text, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'

export default function ProfileScreen() {
	const currentUserId = useAuth(s => s.userId)
	const logout = useAuth(s => s.logout)
	const { data: userData } = useUserQuery(currentUserId!)
	const user = userData as SelfUser | null

	const { isPro, activePlanId } = useSubscriptionStore()
	const isDarkMode = useColorScheme() === 'dark'

	const unitSheetRef = useRef<BottomSheetModal>(null)
	const editProfileSheetRef = useRef<BottomSheetModal>(null)
	const measurementsSheetRef = useRef<BottomSheetModal>(null)
	const fitnessGoalsSheetRef = useRef<BottomSheetModal>(null)

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
					<EditableAvatar uri={user?.profilePicUrl ? user.profilePicUrl : null} size={100} editable={false} />
				</Animated.View>

				{/* Name as prominent line */}
				<Animated.View style={nameStyle} className="mb-3 min-w-0 flex-1 gap-2">
					<View className="flex-row items-center gap-1">
						<Text
							className="shrink text-xl font-semibold text-neutral-900 dark:text-neutral-100"
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							{(user?.firstName ?? '') + (user?.lastName ? ` ${user.lastName}` : '')}
						</Text>
						{isPro && <VerifiedBadge tier={activePlanId} size={28} />}
					</View>

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
					title="Measurements"
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
					onPress={() => measurementsSheetRef.current?.present()}
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

			<UnitPreferencesSheet ref={unitSheetRef} />
			<EditProfileSheet ref={editProfileSheetRef} />
			<MeasurementsSheet ref={measurementsSheetRef} />
			<FitnessGoalsSheet ref={fitnessGoalsSheetRef} />
		</View>
	)
}
