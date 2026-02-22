import { Button } from '@/components/ui/Button'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { SearchedUser, useUser } from '@/stores/userStore'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
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

export default function Search() {
	const colors = useThemeColor()
	const lineHeight = Platform.OS === 'ios' ? 0 : 20
	const safeAreaInsets = useSafeAreaInsets()

	const [query, setQuery] = useState('')
	const [refreshing, setRefreshing] = useState(false)

	const currentUserId = useAuth(state => state.user?.userId)
	const getUserData = useUser(state => state.getUserData)
	const searchUsers = useUser(state => state.searchUsers)
	const resetSearchedUser = useUser(state => state.resetSearchedUser)
	const getSuggestedUsers = useUser(state => state.getSuggestedUsers)
	const unFollowUser = useUser(state => state.unFollowUser)
	const followUser = useUser(state => state.followUser)
	const followLoading = useUser(state => state.followLoading)
	const searchResult = useUser(state => state.searchResult)
	const searchLoading = useUser(state => state.searchLoading)
	const suggestedUsers = useUser(state => state.suggestedUsers)
	const suggestedLoading = useUser(state => state.suggestedLoading)

	const isSearching = query.trim().length >= 3

	const data = useMemo(() => {
		return isSearching ? (searchResult ?? []) : (suggestedUsers ?? [])
	}, [isSearching, searchResult, suggestedUsers])

	// 🔎 Debounced Search
	useEffect(() => {
		if (!isSearching) {
			resetSearchedUser()
			return
		}

		const timer = setTimeout(() => {
			searchUsers(query.trim())
		}, 500)

		return () => clearTimeout(timer)
	}, [query])

	// 🔄 Initial suggestions
	useEffect(() => {
		getSuggestedUsers()
	}, [])

	// 🔄 Pull to refresh
	const onRefresh = useCallback(async () => {
		try {
			setRefreshing(true)
			if (!isSearching) {
				await getSuggestedUsers()
			} else {
				await searchUsers(query.trim())
			}
		} finally {
			setRefreshing(false)
		}
	}, [isSearching, query, getSuggestedUsers, searchUsers])

	return (
		<View style={{ paddingBottom: safeAreaInsets.bottom }} className="flex-1 bg-white px-4 pt-4 dark:bg-black">
			<View className="flex-row items-center justify-center gap-2">
				{searchLoading ? (
					<ActivityIndicator size="small" color={colors.primary} style={{ width: 24, height: 24 }} />
				) : (
					<MaterialCommunityIcons name="magnify" size={24} color={colors.isDark ? 'white' : 'black'} />
				)}
				<TextInput
					value={query}
					onChangeText={text => setQuery(text)}
					placeholder="Search on PUMP"
					placeholderTextColor="#9CA3AF"
					className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-lg text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
					style={{ lineHeight: lineHeight }}
				/>
			</View>

			{/* 👥 Users List */}
			<FlatList
				data={data}
				keyExtractor={item => item.id}
				ListHeaderComponent={
					isSearching ? null : (
						<View className="mt-4">
							<Text className="font-semibold text-black dark:text-white">Suggested Users</Text>
						</View>
					)
				}
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

							if (item.isFollowing) {
								await unFollowUser(item.id)
							} else {
								await followUser(item.id)
							}

							await getUserData(currentUserId)
						}}
					/>
				)}
				contentContainerStyle={{ paddingBottom: 40 }}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				ListEmptyComponent={
					suggestedLoading && isSearching ? (
						<ActivityIndicator style={{ marginTop: 40 }} />
					) : (
						<View className="mt-20 items-center">
							<Text className="text-black dark:text-white">
								{searchLoading
									? 'Searching...'
									: isSearching
										? 'No users found'
										: suggestedLoading
											? 'Loading suggestions...'
											: 'No suggestions available'}
							</Text>
						</View>
					)
				}
			/>
		</View>
	)
}
