import { UserItem } from '@/components/profile/UserItem'
import { useFollowUserMutation, useUnfollowUserMutation, useUserFollowingQuery } from '@/hooks/queries/useEngagement'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { SearchedUser } from '@/types/engagement'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import Fuse from 'fuse.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, BackHandler, FlatList, Platform, RefreshControl, Text, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Following() {
	const colors = useThemeColor()
	const lineHeight = Platform.OS === 'ios' ? 0 : 20
	const safeAreaInsets = useSafeAreaInsets()
	const { userId } = useLocalSearchParams<{ userId: string }>()

	const [query, setQuery] = useState('')
	const [refreshing, setRefreshing] = useState(false)
	const [loading, setLoading] = useState(true)

	const currentUserId = useAuth(state => state.userId)
	const targetUserId = userId || currentUserId

	const { data: fetchedUsers = [], isLoading, refetch } = useUserFollowingQuery(targetUserId!)
	const users: SearchedUser[] = fetchedUsers as SearchedUser[]
	const followMutation = useFollowUserMutation()
	const unfollowMutation = useUnfollowUserMutation()

	const displayUsers = users

	const onRefresh = useCallback(() => {
		setRefreshing(true)
		refetch().finally(() => setRefreshing(false))
	}, [refetch])

	useEffect(() => {
		if (!isLoading) setLoading(false)
	}, [isLoading])

	// 🔍 Fuzzy Search
	const fuse = useMemo(() => {
		return new Fuse(displayUsers, {
			keys: ['firstName', 'lastName', 'username'],
			threshold: 0.3,
		})
	}, [displayUsers])

	const filteredUsers = useMemo(() => {
		if (!query.trim()) return displayUsers
		return fuse.search(query).map(result => result.item)
	}, [query, displayUsers, fuse])

	useEffect(() => {
		const onBackPress = () => {
			router.back()
			return true
		}

		const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

		return () => subscription.remove()
	}, [])

	return (
		<View style={{ paddingBottom: safeAreaInsets.bottom }} className="flex-1 bg-white px-4 pt-4 dark:bg-black">
			<View className="flex-row items-center justify-center gap-2">
				<MaterialCommunityIcons name="magnify" size={24} color={colors.isDark ? 'white' : 'black'} />
				<TextInput
					value={query}
					onChangeText={text => setQuery(text)}
					placeholder="Search following"
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
						isPro={item.isPro}
						proSubscriptionType={item.proSubscriptionType}
						followLoading={item.followLoading}
						onPressFollow={() => {
							if (!currentUserId) return

							if (item.isFollowing) {
								unfollowMutation.mutate(item.id)
							} else {
								followMutation.mutate(item.id)
							}
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
								{query.trim() ? 'No users found' : 'Not following anyone yet'}
							</Text>
						</View>
					)
				}
			/>
		</View>
	)
}
