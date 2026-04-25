import { UserItem } from '@/components/engagement/UserItem'
import {
  useFollowUserMutation,
  useSearchUsersQuery,
  useSuggestedUsersQuery,
  useUnfollowUserMutation,
} from '@/hooks/queries/useEngagement'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { SearchedUser } from '@/types/engagement'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  View,
} from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Search() {
  const colors = useThemeColor()
  const lineHeight = Platform.OS === 'ios' ? 0 : 20
  const safeAreaInsets = useSafeAreaInsets()

  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const currentUserId = useAuth((state) => state.userId)

  const isSearching = query.trim().length >= 3

  const {
    data: searchResult,
    isFetching: searchLoading,
    refetch: refetchSearch,
  } = useSearchUsersQuery(isSearching ? query.trim() : '')

  const {
    data: suggestedUsers,
    isFetching: suggestedLoading,
    refetch: refetchSuggested,
  } = useSuggestedUsersQuery()

  const followMutation = useFollowUserMutation()
  const unfollowMutation = useUnfollowUserMutation()

  const data = useMemo(() => {
    const raw = isSearching ? (searchResult ?? []) : (suggestedUsers ?? [])
    return raw as SearchedUser[]
  }, [isSearching, searchResult, suggestedUsers])

  useEffect(() => {
    const onBackPress = () => {
      router.back()
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

    return () => subscription.remove()
  }, [])

  // 🔄 Pull to refresh
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true)
      if (!isSearching) {
        await refetchSuggested()
      } else {
        await refetchSearch()
      }
    } finally {
      setRefreshing(false)
    }
  }, [isSearching, refetchSuggested, refetchSearch])

  return (
    <View
      style={{ paddingBottom: safeAreaInsets.bottom }}
      className="flex-1 bg-white px-4 pt-4 dark:bg-black"
    >
      <View className="flex-row items-center justify-center gap-2 pb-4">
        {searchLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ width: 24, height: 24 }}
          />
        ) : (
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={colors.isDark ? 'white' : 'black'}
          />
        )}
        <TextInput
          value={query}
          onChangeText={(text) => setQuery(text)}
          placeholder="Search on PUMP"
          placeholderTextColor="#9CA3AF"
          className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-lg text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          style={{ lineHeight: lineHeight }}
        />
      </View>

      {/* 👥 Users List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
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
