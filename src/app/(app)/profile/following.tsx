import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import Fuse from 'fuse.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, BackHandler, Platform, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'

import { SocialUserItem } from '@/components/social/SocialUserItem'
import { BaseListScreen } from '@/components/ui'
import { UserListShimmer } from '@/components/ui/shimmers'
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useUserFollowingQuery,
} from '@/hooks/queries/engagement'
import { useThemeColor } from '@/hooks/theme'
import { useAuth } from '@/stores/auth.store'
import { SearchedUser } from '@/types/engagement'

export default function Following() {
  const colors = useThemeColor()
  const lineHeight = Platform.OS === 'ios' ? 0 : 20

  const { userId } = useLocalSearchParams<{ userId: string }>()

  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const currentUserId = useAuth((state) => state.userId)
  const targetUserId = userId || currentUserId

  const {
    data: fetchedUsers = [],
    isFetching,
    refetch,
  } = useUserFollowingQuery(targetUserId!)
  const users: SearchedUser[] = fetchedUsers as SearchedUser[]
  const followMutation = useFollowUserMutation()
  const unfollowMutation = useUnfollowUserMutation()

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    refetch().finally(() => setRefreshing(false))
  }, [refetch])

  // 🔍 Fuzzy Search
  const fuse = useMemo(() => {
    return new Fuse(users, {
      keys: ['firstName', 'lastName', 'username'],
      threshold: 0.3,
    })
  }, [users])

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return users
    return fuse.search(query).map((result) => result.item)
  }, [query, users, fuse])

  useEffect(() => {
    const onBackPress = () => {
      router.back()
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

    return () => subscription.remove()
  }, [])

  return (
    <BaseListScreen<SearchedUser>
      title="Following"
      backButton
      data={filteredUsers}
      keyExtractor={(item) => item.id}
      isLoading={isFetching}
      shimmer={<UserListShimmer />}
      isRefreshing={refreshing}
      onRefresh={onRefresh}
      emptyText={query.trim() ? 'No users found' : 'Not following anyone yet'}
      estimatedItemSize={80}
      renderItem={({ item }) => (
        <SocialUserItem
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
    >
      <View className="flex-row items-center justify-center gap-2 pb-6">
        {isFetching && !refreshing ? (
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
          placeholder="Search following"
          placeholderTextColor="#9CA3AF"
          className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-lg text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          style={{ lineHeight: lineHeight }}
        />
      </View>
    </BaseListScreen>
  )
}
