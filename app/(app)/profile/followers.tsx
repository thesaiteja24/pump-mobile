import { Button } from '@/components/ui/Button'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { SearchedUser, useUser } from '@/stores/userStore'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import Fuse from 'fuse.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Platform, RefreshControl, Text, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const UserItem = ({
	id,
	firstName,
	lastName,
	profilePicUrl,
	isFollowing,
	onPressFollow,
	followLoading,
}: SearchedUser & {
	followLoading: boolean
	onPressFollow: () => void
}) => {
	const isDark = useThemeColor().isDark
	return (
		<View className="w-full flex-row items-center justify-between py-3">
			<View className="w-2/3 flex-row items-center gap-4">
				<Image
					source={profilePicUrl ? { uri: profilePicUrl } : require('../../../assets/images/icon.png')}
					style={{
						width: 48,
						height: 48,
						borderRadius: 100,
						borderColor: isDark ? 'white' : '#black',
						borderWidth: 0.25,
					}}
					contentFit="cover"
				/>
				<Text className="text-base text-black dark:text-white">
					{firstName} {lastName}
				</Text>
			</View>
			<Button
				className="min-h-6 w-1/3 py-2"
				variant={isFollowing ? 'secondary' : 'primary'}
				title={isFollowing ? 'Following' : 'Follow'}
				onPress={onPressFollow}
				loading={followLoading}
			/>
		</View>
	)
}

export default function Followers() {
	const colors = useThemeColor()
	const lineHeight = Platform.OS === 'ios' ? 0 : 20
	const safeAreaInsets = useSafeAreaInsets()
	const { userId } = useLocalSearchParams<{ userId: string }>()

	const [query, setQuery] = useState('')
	const [refreshing, setRefreshing] = useState(false)
	const [users, setUsers] = useState<SearchedUser[]>([])
	const [loading, setLoading] = useState(true)

	const currentUserId = useAuth(state => state.user?.userId)
	const getUserFollowers = useUser(state => state.getUserFollowers)
	const unFollowUser = useUser(state => state.unFollowUser)
	const followUser = useUser(state => state.followUser)
	const followLoading = useUser(state => state.followLoading)
	const getUserData = useUser(state => state.getUserData)

	const targetUserId = userId || currentUserId

	const fetchFollowers = useCallback(async () => {
		if (!targetUserId) return
		try {
			const res = await getUserFollowers(targetUserId)
			if (res.success) {
				setUsers(res.data)
			}
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}, [targetUserId, getUserFollowers])

	useEffect(() => {
		fetchFollowers()
	}, [fetchFollowers])

	const onRefresh = useCallback(() => {
		setRefreshing(true)
		fetchFollowers()
	}, [fetchFollowers])

	// 🔍 Fuzzy Search
	const fuse = useMemo(() => {
		return new Fuse(users, {
			keys: ['firstName', 'lastName', 'username'],
			threshold: 0.3,
		})
	}, [users])

	const filteredUsers = useMemo(() => {
		if (!query.trim()) return users
		return fuse.search(query).map(result => result.item)
	}, [query, users, fuse])

	return (
		<View style={{ paddingBottom: safeAreaInsets.bottom }} className="flex-1 bg-white px-4 pt-4 dark:bg-black">
			<View className="flex-row items-center justify-center gap-2">
				<MaterialCommunityIcons name="magnify" size={24} color={colors.isDark ? 'white' : 'black'} />
				<TextInput
					value={query}
					onChangeText={text => setQuery(text)}
					placeholder="Search followers"
					placeholderTextColor="#9CA3AF"
					className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-lg text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
					style={{ lineHeight: lineHeight }}
				/>
			</View>

			{/* 👥 Users List */}
			<FlatList
				data={filteredUsers}
				keyExtractor={item => item.id}
				renderItem={({ item }) => (
					<UserItem
						id={item.id}
						firstName={item.firstName}
						lastName={item.lastName}
						profilePicUrl={item.profilePicUrl}
						isFollowing={item.isFollowing}
						followLoading={!!followLoading[item.id]}
						onPressFollow={async () => {
							if (!currentUserId) return

							const isFollowing = item.isFollowing

							// Optimistic update
							setUsers(prev =>
								prev.map(u => (u.id === item.id ? { ...u, isFollowing: !isFollowing } : u))
							)

							if (isFollowing) {
								await unFollowUser(item.id)
							} else {
								await followUser(item.id)
							}

							// Refresh current user data to update counts
							getUserData(currentUserId)
						}}
					/>
				)}
				contentContainerStyle={{ paddingBottom: 40 }}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				ListEmptyComponent={
					loading ? (
						<ActivityIndicator style={{ marginTop: 40 }} />
					) : (
						<View className="mt-20 items-center">
							<Text className="text-black dark:text-white">
								{query.trim() ? 'No users found' : 'No followers yet'}
							</Text>
						</View>
					)
				}
			/>
		</View>
	)
}
