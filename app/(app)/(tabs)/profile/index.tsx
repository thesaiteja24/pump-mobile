// app/(app)/(tabs)/profile.tsx
import EditableAvatar from '@/components/EditableAvatar'
import { useAuth } from '@/stores/authStore'
import { useUser } from '@/stores/userStore'
import { router } from 'expo-router'
import React, { memo, useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const InfoRow = memo(function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
	return (
		<View className="flex-row items-center justify-between border-b border-neutral-200/60 py-3 last:border-b-0 dark:border-neutral-800">
			<Text className="text-sm text-neutral-500 dark:text-neutral-400">{label}</Text>
			<Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">{value ?? '—'}</Text>
		</View>
	)
})

export default function ProfileScreen() {
	const user = useAuth(state => state.user)
	const getUserData = useUser(state => state.getUserData)
	const dob = new Date(user?.dateOfBirth ?? '')

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
	}, [])

	useEffect(() => {
		getUserData(user?.userId ?? '')
	}, [])

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

	return (
		<View className="flex-1 bg-white p-4 dark:bg-black" style={{ paddingBottom: useSafeAreaInsets().bottom }}>
			{/* Avatar */}
			<View className="flex-row items-center gap-4">
				<Animated.View style={avatarStyle} className="mb-6 items-center">
					<EditableAvatar uri={user?.profilePicUrl ? user.profilePicUrl : null} size={132} editable={false} />
				</Animated.View>

				{/* Name as prominent line */}
				<Animated.View style={nameStyle} className="mb-3 flex-grow gap-2">
					<Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
						{(user?.firstName ?? '') + (user?.lastName ? ` ${user.lastName}` : '')}
					</Text>

					{/* {user?.phoneE164 ? (
            <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {user.phoneE164}
            </Text>
          ) : null} */}

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

			{/* Info Card */}
			<Animated.View
				style={infoStyle}
				className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
			>
				<InfoRow label="Date of Birth" value={dob.toDateString() ?? ''} />
				<InfoRow label="Height" value={user?.height ? `${user.height}` : ''} />
				<InfoRow label="Weight" value={user?.weight ? `${user.weight}` : ''} />
			</Animated.View>
		</View>
	)
}
